import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ImageOperationOptions, SupportedOutputFormat } from "@toolmetric/shared";
import { OUTPUT_EXTENSIONS, IMAGE_LIMITS } from "@toolmetric/shared";
import { processImageLocally, LocalImageError } from "../../lib/image/localProcessor.js";
import { processImageOnServer, ServerImageError } from "../../lib/image/serverProcessor.js";
import { primaryButtonClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ErrorBanner } from "../ui/ResultCard.js";

type ProcessingMode = "local" | "server";

interface SourceInfo {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface ResultInfo {
  blob: Blob;
  url: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  /** The format actually produced (validated from the encoded bytes / response), not merely requested. */
  format: SupportedOutputFormat;
}

interface ImageWorkspaceProps {
  acceptAttr: string;
  acceptedLabel: string;
  actionLabel: string;
  outputFormat: SupportedOutputFormat;
  getOptions: () => ImageOperationOptions;
  optionsPanel?: ReactNode;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageWorkspace({ acceptAttr, acceptedLabel, actionLabel, outputFormat, getOptions, optionsPanel }: ImageWorkspaceProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ProcessingMode>("local");
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const cleanupUrls = useCallback((next: { source?: SourceInfo | null; result?: ResultInfo | null }) => {
    if (next.source !== undefined) {
      setSource((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return next.source ?? null;
      });
    }
    if (next.result !== undefined) {
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return next.result ?? null;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.previewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File) {
    setError(null);
    cleanupUrls({ result: null });

    if (file.size > IMAGE_LIMITS.maxUploadBytes) {
      setError(`This file is ${formatBytes(file.size)}, which exceeds the ${formatBytes(IMAGE_LIMITS.maxUploadBytes)} limit.`);
      cleanupUrls({ source: null });
      return;
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      setError("This file could not be decoded as an image. It may be corrupt or in an unsupported format.");
      cleanupUrls({ source: null });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    cleanupUrls({ source: { file, previewUrl, width: bitmap.width, height: bitmap.height, sizeBytes: file.size } });
    bitmap.close();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleRun() {
    if (!source) return;
    setError(null);
    setIsProcessing(true);
    cleanupUrls({ result: null });

    try {
      const options = getOptions();
      if (mode === "local") {
        const { blob, width, height, format } = await processImageLocally(source.file, options);
        cleanupUrls({ result: { blob, url: URL.createObjectURL(blob), width, height, sizeBytes: blob.size, format } });
      } else {
        const { blob, width, height, format } = await processImageOnServer(source.file, options);
        cleanupUrls({ result: { blob, url: URL.createObjectURL(blob), width, height, sizeBytes: blob.size, format } });
      }
    } catch (err) {
      if (err instanceof LocalImageError || err instanceof ServerImageError) {
        setError(err.message);
      } else {
        setError("Something went wrong while processing this image.");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    cleanupUrls({ source: null, result: null });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // The extension always comes from the *validated* result format (confirmed
  // after encoding), not the requested `outputFormat` — a browser that falls
  // back to a different encoder must never produce a mislabeled filename.
  const resultExtension = result ? OUTPUT_EXTENSIONS[result.format] : OUTPUT_EXTENSIONS[outputFormat];
  const downloadName = source
    ? `${source.file.name.replace(/\.[^.]+$/, "")}-toolmetric.${resultExtension}`
    : `output.${resultExtension}`;

  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={
          "rounded-lg border-2 border-dashed p-6 text-center transition-colors " +
          (isDragOver ? "border-teal-500 bg-teal-50" : "border-sand-300 bg-sand-50")
        }
      >
        <p className="text-sm text-navy-600">
          Drag and drop a {acceptedLabel} image here, or
          <label htmlFor={inputId} className="ml-1 cursor-pointer font-semibold text-teal-700 underline">
            choose a file
          </label>
          .
        </p>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={acceptAttr}
          className="sr-only"
          onChange={onInputChange}
        />
      </div>

      {source && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">Original</p>
            <img src={source.previewUrl} alt="Selected image preview" className="max-h-56 w-full rounded-md border border-sand-200 object-contain" />
            <p className="mt-1 text-xs text-navy-500">
              {source.width}×{source.height}px · {formatBytes(source.sizeBytes)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">Result</p>
            {result ? (
              <>
                <img src={result.url} alt="Processed image result" className="max-h-56 w-full rounded-md border border-sand-200 object-contain" />
                <p className="mt-1 text-xs text-navy-500">
                  {result.width && result.height ? `${result.width}×${result.height}px · ` : ""}
                  {formatBytes(result.sizeBytes)}
                </p>
              </>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-sand-300 text-sm text-navy-400">
                {isProcessing ? "Processing..." : "No result yet"}
              </div>
            )}
          </div>
        </div>
      )}

      {optionsPanel}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-navy-800">Processing location</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="radio" name={`${inputId}-mode`} checked={mode === "local"} onChange={() => setMode("local")} />
            Process on your device (default)
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="radio" name={`${inputId}-mode`} checked={mode === "server"} onChange={() => setMode("server")} />
            Upload to our server for processing
          </label>
        </div>
        <p className="text-xs text-navy-500">
          {mode === "local"
            ? "Processed on your device — the file is never sent anywhere."
            : "Uploads to our server for processing — your file is held in memory only, for this one request, and is never written to disk. See the Privacy Policy for details."}
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primaryButtonClass} disabled={!source || isProcessing} onClick={handleRun}>
          {isProcessing ? "Processing..." : actionLabel}
        </button>
        {result && (
          <a href={result.url} download={downloadName} className={secondaryButtonClass}>
            Download result
          </a>
        )}
        <button type="button" className={secondaryButtonClass} onClick={handleReset} disabled={!source && !result}>
          Reset
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
    </div>
  );
}
