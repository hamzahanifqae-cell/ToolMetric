import { useId, useState } from "react";
import type { SupportedOutputFormat } from "@toolmetric/shared";
import { ImageWorkspace } from "./ImageWorkspace.js";
import { Field } from "../ui/Field.js";

interface ConvertImageToolProps {
  acceptAttr: string;
  acceptedLabel: string;
  outputFormat: SupportedOutputFormat;
}

export function ConvertImageTool({ acceptAttr, acceptedLabel, outputFormat }: ConvertImageToolProps) {
  const id = useId();
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const showBackground = outputFormat === "jpeg";

  return (
    <ImageWorkspace
      acceptAttr={acceptAttr}
      acceptedLabel={acceptedLabel}
      actionLabel="Convert"
      outputFormat={outputFormat}
      getOptions={() => ({
        kind: "convert",
        outputFormat,
        backgroundColor: showBackground ? backgroundColor : undefined,
      })}
      optionsPanel={
        showBackground ? (
          <Field
            label="Background color for transparent areas"
            htmlFor={`${id}-bg`}
            hint="JPEG does not support transparency, so transparent pixels are filled with this color."
          >
            <input
              id={`${id}-bg`}
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-10 w-24 cursor-pointer rounded-md border border-sand-300"
            />
          </Field>
        ) : undefined
      }
    />
  );
}
