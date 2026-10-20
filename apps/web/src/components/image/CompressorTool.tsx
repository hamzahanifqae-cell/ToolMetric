import { useId, useState } from "react";
import { IMAGE_LIMITS } from "@toolmetric/shared";
import { ImageWorkspace } from "./ImageWorkspace.js";
import { Field } from "../ui/Field.js";
import { selectClass } from "../ui/inputClasses.js";

type CompressFormat = "jpeg" | "webp";

export function CompressorTool() {
  const id = useId();
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [quality, setQuality] = useState(75);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  return (
    <ImageWorkspace
      acceptAttr="image/png,image/jpeg,image/webp"
      acceptedLabel="PNG, JPG, or WebP"
      actionLabel="Compress"
      outputFormat={format}
      getOptions={() => ({
        kind: "compress",
        outputFormat: format,
        quality,
        backgroundColor: format === "jpeg" ? backgroundColor : undefined,
      })}
      optionsPanel={
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Output format" htmlFor={`${id}-format`}>
            <select id={`${id}-format`} className={selectClass} value={format} onChange={(e) => setFormat(e.target.value as CompressFormat)}>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </Field>
          <Field
            label={`Quality: ${quality}`}
            htmlFor={`${id}-quality`}
            hint="Lower quality means a smaller file but more visible compression artifacts. Quality settings do not guarantee a particular output size."
          >
            <input
              id={`${id}-quality`}
              type="range"
              min={IMAGE_LIMITS.minQuality}
              max={IMAGE_LIMITS.maxQuality}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-teal-700"
            />
          </Field>
          {format === "jpeg" && (
            <Field label="Background color for transparent areas" htmlFor={`${id}-bg`}>
              <input
                id={`${id}-bg`}
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-24 cursor-pointer rounded-md border border-sand-300"
              />
            </Field>
          )}
        </div>
      }
    />
  );
}
