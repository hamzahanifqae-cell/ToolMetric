import type { ImageOperationOptions } from "@toolmetric/shared";
import { spawnWorkerJob, type SpawnWorkerJobOptions } from "./workerJob.js";
import { ImageProcessingError, type ProcessedImage } from "./imageProcessor.js";
import type { SharpWorkerMessage } from "../workers/sharpWorker.js";

// Running under `tsx watch` (dev) executes this very file with a .ts
// extension and no compiled dist/ output exists yet; running under `node
// dist/index.js` (prod) executes the compiled .js. The worker must be
// pointed at whichever form is actually on disk, and — only in the .ts case
// — told to register tsx's ESM loader so it can import TypeScript itself.
const isSourceFile = import.meta.url.endsWith(".ts");
const workerUrl = isSourceFile
  ? new URL("../workers/sharpWorker.ts", import.meta.url)
  : new URL("../workers/sharpWorker.js", import.meta.url);
const execArgv = isSourceFile ? ["--import", "tsx/esm"] : [];

export interface RunImageJobOptions {
  timeoutMs: number;
  signal?: AbortSignal;
}

/**
 * Runs one image-processing operation in an isolated worker thread (see
 * workers/sharpWorker.ts and lib/workerJob.ts) and reconstructs a real
 * `ImageProcessingError` on this side so callers can keep using
 * `instanceof ImageProcessingError` exactly as before the worker split.
 */
export async function runImageProcessingJob(
  inputBuffer: Buffer,
  operation: ImageOperationOptions,
  { timeoutMs, signal }: RunImageJobOptions
): Promise<ProcessedImage> {
  const arrayBuffer = inputBuffer.buffer.slice(
    inputBuffer.byteOffset,
    inputBuffer.byteOffset + inputBuffer.byteLength
  ) as ArrayBuffer;

  const spawnOptions: SpawnWorkerJobOptions = { timeoutMs, signal, execArgv };

  return spawnWorkerJob<SharpWorkerMessage, ProcessedImage>(
    workerUrl,
    { operation, buffer: arrayBuffer },
    [arrayBuffer],
    (message) => {
      if (message.ok) {
        return {
          buffer: Buffer.from(message.buffer),
          format: message.format as ProcessedImage["format"],
          width: message.width,
          height: message.height,
        };
      }
      throw new ImageProcessingError(message.message, message.statusCode);
    },
    spawnOptions
  );
}
