import { useId, useState } from "react";
import type { SupportedOutputFormat } from "@toolmetric/shared";
import { IMAGE_LIMITS } from "@toolmetric/shared";
import { ImageWorkspace } from "./ImageWorkspace.js";
import { Field } from "../ui/Field.js";
import { inputClass, selectClass } from "../ui/inputClasses.js";

export function ResizerTool() {
  const id = useId();
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<SupportedOutputFormat>("png");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  return (
    <ImageWorkspace
      acceptAttr="image/png,image/jpeg,image/webp"
      acceptedLabel="PNG, JPG, or WebP"
      actionLabel="Resize"
      outputFormat={outputFormat}
      getOptions={() => ({
        kind: "resize",
        outputFormat,
        width: width === "" ? undefined : Number(width),
        height: height === "" ? undefined : Number(height),
        lockAspectRatio,
        backgroundColor: outputFormat === "jpeg" ? backgroundColor : undefined,
      })}
      optionsPanel={
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Width (px)" htmlFor={`${id}-w`} hint={`Up to ${IMAGE_LIMITS.maxOutputDimension}px`}>
              <input id={`${id}-w`} className={inputClass} type="number" inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} />
            </Field>
            <Field label="Height (px)" htmlFor={`${id}-h`} hint="Leave blank to scale proportionally">
              <input id={`${id}-h`} className={inputClass} type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Field>
            <Field label="Output format" htmlFor={`${id}-format`}>
              <select id={`${id}-format`} className={selectClass} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as SupportedOutputFormat)}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={lockAspectRatio} onChange={(e) => setLockAspectRatio(e.target.checked)} />
            Lock aspect ratio
          </label>

          {outputFormat === "jpeg" && (
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
