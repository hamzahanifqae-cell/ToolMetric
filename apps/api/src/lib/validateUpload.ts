import { fileTypeFromBuffer } from "file-type";
import { isSupportedInputFormat, type SupportedInputFormat } from "@toolmetric/shared";

export interface SignatureValidationResult {
  ok: boolean;
  format?: SupportedInputFormat;
  error?: string;
}

/**
 * Validates the actual file signature (magic bytes) rather than trusting
 * the client-supplied Content-Type or filename extension, which can be
 * spoofed. SVG is explicitly rejected — it's XML, not a raster signature,
 * and SVGs can embed scripts, so it's excluded from server-side processing
 * entirely for this initial version.
 */
export async function validateImageSignature(buffer: Buffer): Promise<SignatureValidationResult> {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    return { ok: false, error: "Could not detect a valid image file signature." };
  }

  // file-type does not currently emit an "svg" extension (SVG is XML, not a binary
  // signature), so SVGs already fall through to the `!detected` branch above and
  // are rejected there. This check is a defensive guard in case that ever changes.
  if ((detected.ext as string) === "svg" || (detected.mime as string) === "image/svg+xml") {
    return { ok: false, error: "SVG files are not supported." };
  }

  const normalized = detected.ext === "jpg" ? "jpeg" : detected.ext;

  if (!isSupportedInputFormat(normalized)) {
    return { ok: false, error: `Unsupported image format: ${detected.ext}.` };
  }

  return { ok: true, format: normalized };
}
