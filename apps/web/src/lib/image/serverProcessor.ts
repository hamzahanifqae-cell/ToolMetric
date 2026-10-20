import type { ImageOperationOptions, SupportedOutputFormat } from "@toolmetric/shared";
import { mimeToOutputFormat } from "./mimeFormat.js";
import { apiBaseUrl } from "../../config/site.js";

export class ServerImageError extends Error {}

export interface ServerProcessResult {
  blob: Blob;
  width: number | undefined;
  height: number | undefined;
  /** The format actually returned by the API (from its Content-Type), not merely what was requested. */
  format: SupportedOutputFormat;
}

/**
 * Uploads a file to the API service for server-side processing. Only
 * called when the user has explicitly chosen the "Upload to server" option
 * — this module must never be invoked automatically after a local
 * processing failure.
 */
export async function processImageOnServer(file: File, options: ImageOperationOptions): Promise<ServerProcessResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("operation", JSON.stringify(options));

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/image/process`, { method: "POST", body: formData });
  } catch {
    throw new ServerImageError("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = `Server processing failed (${response.status}).`;
    try {
      const body = await response.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // Response body wasn't JSON — keep the generic message.
    }
    throw new ServerImageError(message);
  }

  const blob = await response.blob();
  const width = Number(response.headers.get("X-Output-Width")) || undefined;
  const height = Number(response.headers.get("X-Output-Height")) || undefined;

  // Trust the response's actual Content-Type over the request's outputFormat
  // — the download filename/extension must describe what we really got back.
  const format = mimeToOutputFormat(blob.type);
  if (!format) {
    throw new ServerImageError(`The server returned an unexpected content type (${blob.type || "unknown"}).`);
  }

  return { blob, width, height, format };
}
