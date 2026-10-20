import { parentPort, workerData } from "node:worker_threads";
import type { ImageOperationOptions } from "@toolmetric/shared";
import { processImage, ImageProcessingError } from "../lib/imageProcessor.js";

export interface SharpWorkerData {
  operation: ImageOperationOptions;
  buffer: ArrayBuffer;
}

export type SharpWorkerMessage =
  | { ok: true; buffer: ArrayBuffer; format: string; width: number; height: number }
  | { ok: false; message: string; statusCode: number };

/**
 * Runs entirely inside an isolated worker thread (see workerJob.ts) so that
 * the main server process can forcibly stop it with `worker.terminate()` if
 * it runs longer than the configured timeout — something a same-process
 * `Promise.race` can never actually do for native/synchronous work.
 */
async function main(): Promise<void> {
  if (!parentPort) {
    throw new Error("sharpWorker.ts must be run as a worker_thread.");
  }

  const { operation, buffer } = workerData as SharpWorkerData;
  const inputBuffer = Buffer.from(buffer);

  try {
    const result = await processImage(inputBuffer, operation);
    const outArrayBuffer = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    ) as ArrayBuffer;

    const message: SharpWorkerMessage = {
      ok: true,
      buffer: outArrayBuffer,
      format: result.format,
      width: result.width,
      height: result.height,
    };
    parentPort.postMessage(message, [outArrayBuffer]);
  } catch (err) {
    const message: SharpWorkerMessage =
      err instanceof ImageProcessingError
        ? { ok: false, message: err.message, statusCode: err.statusCode }
        : { ok: false, message: err instanceof Error ? err.message : "Unknown processing error.", statusCode: 500 };
    parentPort.postMessage(message);
  }
}

void main();
