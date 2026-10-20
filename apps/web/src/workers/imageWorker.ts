/// <reference lib="webworker" />
import {
  computeResizeDimensions,
  validateEncodedOutput,
  normalizeHexColor,
  OUTPUT_MIME_TYPES,
  type ImageOperationOptions,
} from "@toolmetric/shared";

export interface ImageWorkerRequest {
  id: number;
  bitmap: ImageBitmap;
  options: ImageOperationOptions;
}

export type ImageWorkerResponse =
  | { id: number; ok: true; buffer: ArrayBuffer; mime: string; width: number; height: number }
  | { id: number; ok: false; error: string };

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const { id, bitmap, options } = event.data;

  try {
    let targetWidth = bitmap.width;
    let targetHeight = bitmap.height;

    if (options.kind === "resize") {
      const dims = computeResizeDimensions(
        bitmap.width,
        bitmap.height,
        options.width,
        options.height,
        options.lockAspectRatio
      );
      targetWidth = dims.width;
      targetHeight = dims.height;
    }

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D rendering context.");

    const mime = OUTPUT_MIME_TYPES[options.outputFormat];
    if (!mime) throw new Error(`Unsupported output format: ${options.outputFormat}`);

    if (options.outputFormat === "jpeg") {
      // JPEG has no alpha channel; flatten onto the requested background first,
      // otherwise encoders composite transparency onto black.
      ctx.fillStyle = normalizeHexColor("backgroundColor" in options ? options.backgroundColor : undefined);
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const quality = "quality" in options && options.quality !== undefined ? options.quality / 100 : 0.85;
    const blob =
      options.outputFormat === "png"
        ? await canvas.convertToBlob({ type: mime })
        : await canvas.convertToBlob({ type: mime, quality });

    const encodedCheck = validateEncodedOutput(blob.type, options.outputFormat);
    if (!encodedCheck.ok) {
      throw new Error(encodedCheck.error);
    }

    const buffer = await blob.arrayBuffer();
    const response: ImageWorkerResponse = { id, ok: true, buffer, mime: blob.type, width: targetWidth, height: targetHeight };
    (self as unknown as Worker).postMessage(response, [buffer]);
  } catch (err) {
    const response: ImageWorkerResponse = { id, ok: false, error: err instanceof Error ? err.message : String(err) };
    (self as unknown as Worker).postMessage(response);
  }
};
