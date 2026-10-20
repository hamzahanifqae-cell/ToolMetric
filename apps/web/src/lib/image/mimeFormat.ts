import { OUTPUT_MIME_TYPES, type SupportedOutputFormat } from "@toolmetric/shared";

const MIME_TO_FORMAT: Record<string, SupportedOutputFormat> = Object.fromEntries(
  Object.entries(OUTPUT_MIME_TYPES).map(([format, mime]) => [mime, format as SupportedOutputFormat])
);

/** Maps a MIME type back to a known output format, or undefined if unrecognized. */
export function mimeToOutputFormat(mime: string): SupportedOutputFormat | undefined {
  return MIME_TO_FORMAT[mime];
}
