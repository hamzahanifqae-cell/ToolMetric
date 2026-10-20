/**
 * Shared, framework-agnostic definitions of supported image operations and
 * their limits. Used by both the browser (client-side processing UI) and
 * the API service (server-side validation) so the two never disagree about
 * what is supported. This module must stay free of Node- or browser-only
 * APIs (no `sharp`, no `OffscreenCanvas`) so it can be bundled either way.
 */

export const SUPPORTED_INPUT_FORMATS = ["png", "jpeg", "webp"] as const;
export type SupportedInputFormat = (typeof SUPPORTED_INPUT_FORMATS)[number];

export const SUPPORTED_OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
export type SupportedOutputFormat = (typeof SUPPORTED_OUTPUT_FORMATS)[number];

export const INPUT_MIME_TYPES: Record<SupportedInputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const OUTPUT_MIME_TYPES: Record<SupportedOutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const OUTPUT_EXTENSIONS: Record<SupportedOutputFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

export type ImageOperationKind = "convert" | "compress" | "resize";

export interface ConvertOptions {
  kind: "convert";
  outputFormat: SupportedOutputFormat;
  /** Background color (hex, e.g. "#ffffff") used when flattening transparency onto JPEG. */
  backgroundColor?: string;
  /** 1–100. Only meaningful for jpeg/webp output. */
  quality?: number;
}

export interface CompressOptions {
  kind: "compress";
  outputFormat: "jpeg" | "webp";
  quality: number;
  backgroundColor?: string;
}

export interface ResizeOptions {
  kind: "resize";
  outputFormat: SupportedOutputFormat;
  width?: number;
  height?: number;
  lockAspectRatio: boolean;
  quality?: number;
  backgroundColor?: string;
}

export type ImageOperationOptions = ConvertOptions | CompressOptions | ResizeOptions;

/**
 * Hard limits enforced identically by the client UI (to fail fast with a
 * clear message) and the API service (as the actual security boundary —
 * the client-side checks are a UX convenience, not something the server
 * trusts).
 */
export const IMAGE_LIMITS = {
  /** Maximum accepted upload size in bytes (server enforces this while streaming). */
  maxUploadBytes: 25 * 1024 * 1024, // 25 MB
  /** Maximum decoded pixel count (width × height) to bound memory use. */
  maxDecodedPixels: 40_000_000, // ~40 MP, e.g. 8000x5000
  /** Maximum width or height accepted for an output image. */
  maxOutputDimension: 10_000,
  minQuality: 1,
  maxQuality: 100,
  defaultQuality: 85,
} as const;

export function isSupportedInputFormat(format: string): format is SupportedInputFormat {
  return (SUPPORTED_INPUT_FORMATS as readonly string[]).includes(format);
}

export function isSupportedOutputFormat(format: string): format is SupportedOutputFormat {
  return (SUPPORTED_OUTPUT_FORMATS as readonly string[]).includes(format);
}

export interface DimensionValidationError {
  ok: false;
  error: string;
}
export interface DimensionValidationOk {
  ok: true;
}

/** Validates decoded image dimensions against shared limits. */
export function validateDecodedDimensions(
  width: number,
  height: number
): DimensionValidationOk | DimensionValidationError {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { ok: false, error: "Image dimensions are invalid." };
  }
  if (width * height > IMAGE_LIMITS.maxDecodedPixels) {
    return {
      ok: false,
      error: `Image is too large to process (${width}×${height} exceeds the ${IMAGE_LIMITS.maxDecodedPixels.toLocaleString()} pixel limit).`,
    };
  }
  return { ok: true };
}

/** Validates a requested output dimension (resize target) against shared limits. */
export function validateOutputDimension(value: number): DimensionValidationOk | DimensionValidationError {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Width and height must be positive numbers." };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, error: "Width and height must be whole numbers of pixels." };
  }
  if (value > IMAGE_LIMITS.maxOutputDimension) {
    return { ok: false, error: `Dimension cannot exceed ${IMAGE_LIMITS.maxOutputDimension}px.` };
  }
  return { ok: true };
}

export function validateQuality(value: number): DimensionValidationOk | DimensionValidationError {
  if (!Number.isFinite(value)) {
    return { ok: false, error: "Quality must be a number." };
  }
  if (value < IMAGE_LIMITS.minQuality || value > IMAGE_LIMITS.maxQuality) {
    return {
      ok: false,
      error: `Quality must be between ${IMAGE_LIMITS.minQuality} and ${IMAGE_LIMITS.maxQuality}.`,
    };
  }
  return { ok: true };
}

/**
 * Normalizes a background-color value for use as a canvas `fillStyle`
 * (client) or passed through as a hex string (server). `ctx.fillStyle`
 * silently ignores invalid CSS color strings — keeping whatever it was
 * previously set to — rather than throwing, so a value missing its `#`
 * prefix would otherwise fail to apply with no error at all.
 */
export function normalizeHexColor(hex: string | undefined): string {
  if (!hex) return "#ffffff";
  return hex.startsWith("#") ? hex : `#${hex}`;
}

/**
 * Confirms that a browser-encoded image actually came back as the format
 * that was requested. Per the Canvas/OffscreenCanvas spec, `toBlob` /
 * `convertToBlob` silently re-encode as PNG when the requested type isn't
 * supported, rather than failing — so the request succeeding proves
 * nothing on its own; only the encoded blob's own MIME type does. Callers
 * must never relabel a mismatched result as the requested format.
 */
export function validateEncodedOutput(
  actualMime: string,
  requestedFormat: SupportedOutputFormat
): DimensionValidationOk | DimensionValidationError {
  const expectedMime = OUTPUT_MIME_TYPES[requestedFormat];
  if (actualMime !== expectedMime) {
    return {
      ok: false,
      error: `Your browser can't encode images as ${requestedFormat.toUpperCase()} (it produced ${actualMime || "an unknown format"} instead). Try a different output format, or use the server option.`,
    };
  }
  return { ok: true };
}
