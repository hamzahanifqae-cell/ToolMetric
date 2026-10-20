import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { IMAGE_LIMITS, OUTPUT_EXTENSIONS, OUTPUT_MIME_TYPES } from "@toolmetric/shared";
import { operationRequestSchema } from "../lib/operationSchema.js";
import { validateImageSignature } from "../lib/validateUpload.js";
import { ImageProcessingError } from "../lib/imageProcessor.js";
import { runImageProcessingJob } from "../lib/imageJobRunner.js";
import { requestQueue, QueueFullError } from "../lib/queue.js";
import { JobTimeoutError, JobCancelledError, WorkerCrashedError } from "../lib/workerJob.js";
import { config } from "../config.js";

function hasErrorCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === code;
}

/**
 * Explicitly labelled server-side image processing endpoint. Accepts a
 * single image file plus a JSON `operation` field describing convert /
 * compress / resize parameters, validated against the shared operation
 * schema and limits. No arbitrary remote URL fetching is supported —
 * only direct multipart file upload.
 *
 * The entire request lifecycle (reading/buffering the upload, validating
 * it, and running the Sharp worker) happens inside one reserved queue slot,
 * so concurrent memory use from buffered uploads is bounded by the same
 * `MAX_CONCURRENT_JOBS` / `MAX_QUEUE_LENGTH` limits as processing itself —
 * not by however many connections arrive before the first check runs.
 */
export async function registerImageRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/image/process", async (request, reply) => {
    const controller = new AbortController();
    const onClose = () => {
      // `close` fires both on a normal completed response and on a dropped
      // connection. `writableEnded` distinguishes the two: once we've
      // finished writing the reply it's a no-op; if the socket closed
      // before that, the client disconnected and in-flight work should stop.
      if (!reply.raw.writableEnded) {
        controller.abort();
      }
    };
    reply.raw.on("close", onClose);

    let release: (() => void) | undefined;
    try {
      release = await requestQueue.acquire(controller.signal);

      let operationRaw: unknown;
      let fileBuffer: Buffer | undefined;

      try {
        const parts = request.parts();
        for await (const part of parts) {
          if (controller.signal.aborted) throw new JobCancelledError();
          if (part.type === "file" && part.fieldname === "file") {
            fileBuffer = await part.toBuffer();
          } else if (part.type === "field" && part.fieldname === "operation") {
            try {
              operationRaw = JSON.parse(String(part.value));
            } catch {
              return reply.code(400).send({ error: "The `operation` field must be valid JSON." });
            }
          }
        }
      } catch (err) {
        if (err instanceof JobCancelledError) throw err;
        if (hasErrorCode(err, "FST_REQ_FILE_TOO_LARGE") || hasErrorCode(err, "FST_FILES_LIMIT")) {
          return reply
            .code(413)
            .send({ error: `File exceeds the ${Math.round(IMAGE_LIMITS.maxUploadBytes / (1024 * 1024))}MB upload limit.` });
        }
        request.log.error({ errName: (err as Error)?.name }, "Multipart parsing failed");
        return reply.code(400).send({ error: "Could not read the uploaded file." });
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.code(400).send({ error: "No file was uploaded." });
      }
      if (operationRaw === undefined) {
        return reply.code(400).send({ error: "Missing `operation` field." });
      }

      const parsed = operationRequestSchema.safeParse(operationRaw);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid operation parameters." });
      }

      const signature = await validateImageSignature(fileBuffer);
      if (!signature.ok) {
        return reply.code(415).send({ error: signature.error ?? "Unsupported file." });
      }

      const result = await runImageProcessingJob(fileBuffer, parsed.data, {
        timeoutMs: config.jobTimeoutMs,
        signal: controller.signal,
      });

      const extension = OUTPUT_EXTENSIONS[result.format];
      const filename = `toolmetric-${randomUUID().slice(0, 8)}.${extension}`;

      return reply
        .header("Content-Type", OUTPUT_MIME_TYPES[result.format])
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .header("Cache-Control", "no-store")
        .header("X-Output-Width", String(result.width))
        .header("X-Output-Height", String(result.height))
        .send(result.buffer);
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      if (err instanceof QueueFullError) {
        return reply.code(503).send({ error: err.message });
      }
      if (err instanceof JobTimeoutError) {
        return reply.code(504).send({ error: "Image processing timed out." });
      }
      if (err instanceof JobCancelledError) {
        // The client is gone; nothing reads this response, but returning
        // normally still lets the route exit cleanly and release the slot.
        return reply.code(499).send({ error: "Request was cancelled." });
      }
      if (err instanceof WorkerCrashedError) {
        request.log.error({ errName: err.name }, "Image processing worker crashed");
        return reply.code(500).send({ error: "Image processing failed unexpectedly." });
      }
      request.log.error({ errName: (err as Error)?.name }, "Unexpected image processing failure");
      return reply.code(500).send({ error: "Image processing failed unexpectedly." });
    } finally {
      reply.raw.off("close", onClose);
      release?.();
    }
  });
}
