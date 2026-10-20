import {
  validateDecodedDimensions,
  validateOutputDimension,
  validateEncodedOutput,
  computeResizeDimensions,
  normalizeHexColor,
  OUTPUT_MIME_TYPES,
  type ImageOperationOptions,
  type SupportedOutputFormat,
} from "@toolmetric/shared";
import type { ImageWorkerRequest, ImageWorkerResponse } from "../../workers/imageWorker.js";
import { mimeToOutputFormat } from "./mimeFormat.js";

export class LocalImageError extends Error {}

export interface LocalProcessResult {
  blob: Blob;
  width: number;
  height: number;
  /** The format actually produced, confirmed from the encoded blob — not merely what was requested. */
  format: SupportedOutputFormat;
}

function supportsWorkerPipeline(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined";
}

let worker: Worker | undefined;
let requestCounter = 0;
const pending = new Map<number, { resolve: (v: ImageWorkerResponse) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker {
  if (!worker) {
    const instance = new Worker(new URL("../../workers/imageWorker.ts", import.meta.url), { type: "module" });
    instance.onmessage = (event: MessageEvent<ImageWorkerResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      entry.resolve(event.data);
    };
    instance.onerror = (event) => {
      // A fatal worker error (e.g. a load/parse failure) can leave this
      // instance permanently unable to respond. Drop the reference so the
      // next request spins up a fresh worker instead of silently hanging
      // forever against a dead one.
      if (worker === instance) worker = undefined;
      for (const [, entry] of pending) entry.reject(new LocalImageError(event.message || "The background image worker failed."));
      pending.clear();
      event.preventDefault();
    };
    worker = instance;
  }
  return worker;
}

function runInWorker(bitmap: ImageBitmap, options: ImageOperationOptions): Promise<ImageWorkerResponse> {
  const id = ++requestCounter;
  const request: ImageWorkerRequest = { id, bitmap, options };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    try {
      getWorker().postMessage(request, [bitmap]);
    } catch (err) {
      pending.delete(id);
      reject(err);
    }
  });
}

async function runOnMainThread(bitmap: ImageBitmap, options: ImageOperationOptions): Promise<LocalProcessResult> {
  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;

  if (options.kind === "resize") {
    const dims = computeResizeDimensions(bitmap.width, bitmap.height, options.width, options.height, options.lockAspectRatio);
    targetWidth = dims.width;
    targetHeight = dims.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new LocalImageError("Could not create a 2D rendering context.");

  const mime = OUTPUT_MIME_TYPES[options.outputFormat];
  if (!mime) throw new LocalImageError(`Unsupported output format: ${options.outputFormat}`);

  if (options.outputFormat === "jpeg") {
    ctx.fillStyle = normalizeHexColor("backgroundColor" in options ? options.backgroundColor : undefined);
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const quality = "quality" in options && options.quality !== undefined ? options.quality / 100 : 0.85;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, options.outputFormat === "png" ? undefined : quality);
  });

  if (!blob) {
    throw new LocalImageError(
      `Your browser could not encode this image as ${options.outputFormat.toUpperCase()}. Try a different output format or the server option.`
    );
  }

  const encodedCheck = validateEncodedOutput(blob.type, options.outputFormat);
  if (!encodedCheck.ok) {
    throw new LocalImageError(encodedCheck.error);
  }

  return { blob, width: targetWidth, height: targetHeight, format: options.outputFormat };
}

/**
 * Decodes and processes an image entirely on the client. Throws
 * `LocalImageError` with a user-facing message on any failure — callers
 * must never fall back to silently uploading the file after this throws;
 * if server processing is desired, the user must explicitly choose it.
 */
export async function processImageLocally(file: File, options: ImageOperationOptions): Promise<LocalProcessResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new LocalImageError("This file could not be decoded as an image. It may be corrupt or in an unsupported format.");
  }

  const dimensionCheck = validateDecodedDimensions(bitmap.width, bitmap.height);
  if (!dimensionCheck.ok) {
    bitmap.close();
    throw new LocalImageError(dimensionCheck.error);
  }

  if (options.kind === "resize") {
    for (const dim of [options.width, options.height]) {
      if (dim !== undefined) {
        const check = validateOutputDimension(dim);
        if (!check.ok) {
          bitmap.close();
          throw new LocalImageError(check.error);
        }
      }
    }
  }

  try {
    if (supportsWorkerPipeline()) {
      const response = await runInWorker(bitmap, options);
      if (!response.ok) throw new LocalImageError(response.error);
      const format = mimeToOutputFormat(response.mime);
      if (!format) {
        throw new LocalImageError(
          `Your browser produced an unexpected image format (${response.mime}). Try a different output format, or use the server option.`
        );
      }
      return {
        blob: new Blob([response.buffer], { type: response.mime }),
        width: response.width,
        height: response.height,
        format,
      };
    }
    return await runOnMainThread(bitmap, options);
  } catch (err) {
    if (err instanceof LocalImageError) throw err;
    throw new LocalImageError(err instanceof Error ? err.message : "Local image processing failed unexpectedly.");
  }
}
