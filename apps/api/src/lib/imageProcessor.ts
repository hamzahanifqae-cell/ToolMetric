import sharp from "sharp";
import {
  IMAGE_LIMITS,
  validateDecodedDimensions,
  validateOutputDimension,
  validateQuality,
  type ImageOperationOptions,
  type SupportedOutputFormat,
} from "@toolmetric/shared";

export class ImageProcessingError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ImageProcessingError";
    this.statusCode = statusCode;
  }
}

export interface ProcessedImage {
  buffer: Buffer;
  format: SupportedOutputFormat;
  width: number;
  height: number;
}

function parseBackgroundColor(hex: string | undefined): { r: number; g: number; b: number; alpha: number } {
  const fallback = { r: 255, g: 255, b: 255, alpha: 1 };
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const value = match[1]!;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    alpha: 1,
  };
}

/**
 * Runs a single image operation (convert / compress / resize) using sharp,
 * with limits enforced at every stage: decoded pixel count, requested
 * output dimensions, and quality range. `limitInputPixels` makes sharp
 * itself refuse to decode images beyond the configured pixel budget, so
 * memory is bounded even before our own dimension check runs.
 */
export async function processImage(
  inputBuffer: Buffer,
  options: ImageOperationOptions
): Promise<ProcessedImage> {
  const pipeline = sharp(inputBuffer, {
    limitInputPixels: IMAGE_LIMITS.maxDecodedPixels,
    failOn: "error",
  });

  const metadata = await pipeline.metadata().catch(() => {
    throw new ImageProcessingError("Could not decode image. The file may be corrupt or unsupported.");
  });

  if (!metadata.width || !metadata.height) {
    throw new ImageProcessingError("Could not determine image dimensions.");
  }

  const dimensionCheck = validateDecodedDimensions(metadata.width, metadata.height);
  if (!dimensionCheck.ok) {
    throw new ImageProcessingError(dimensionCheck.error);
  }

  let working = pipeline;

  if (options.kind === "resize") {
    const targetWidth = options.width;
    const targetHeight = options.height;

    if (targetWidth === undefined && targetHeight === undefined) {
      throw new ImageProcessingError("Provide at least a width or a height to resize.");
    }
    for (const dim of [targetWidth, targetHeight]) {
      if (dim !== undefined) {
        const check = validateOutputDimension(dim);
        if (!check.ok) throw new ImageProcessingError(check.error);
      }
    }

    working = working.resize({
      width: targetWidth,
      height: targetHeight,
      fit: options.lockAspectRatio ? "inside" : "fill",
      withoutEnlargement: false,
    });
  }

  const quality = "quality" in options ? options.quality ?? IMAGE_LIMITS.defaultQuality : IMAGE_LIMITS.defaultQuality;
  const qualityCheck = validateQuality(quality);
  if (!qualityCheck.ok) {
    throw new ImageProcessingError(qualityCheck.error);
  }

  const outputFormat = options.outputFormat;
  const needsFlatten = outputFormat === "jpeg" && metadata.hasAlpha;
  if (needsFlatten) {
    const bg = parseBackgroundColor(options.backgroundColor);
    working = working.flatten({ background: bg });
  }

  switch (outputFormat) {
    case "jpeg":
      working = working.jpeg({ quality, mozjpeg: true });
      break;
    case "webp":
      working = working.webp({ quality });
      break;
    case "png":
      working = working.png();
      break;
    default:
      throw new ImageProcessingError(`Unsupported output format: ${outputFormat as string}`);
  }

  const { data, info } = await working.toBuffer({ resolveWithObject: true });

  const outputDimCheck = validateOutputDimension(Math.max(info.width, info.height));
  if (!outputDimCheck.ok) {
    throw new ImageProcessingError(outputDimCheck.error);
  }

  return { buffer: data, format: outputFormat, width: info.width, height: info.height };
}
