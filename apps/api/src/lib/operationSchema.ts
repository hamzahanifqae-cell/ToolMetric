import { z } from "zod";
import { IMAGE_LIMITS, SUPPORTED_OUTPUT_FORMATS } from "@toolmetric/shared";

const hexColor = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Background color must be a 6-digit hex value.")
  .optional();

const quality = z.number().min(IMAGE_LIMITS.minQuality).max(IMAGE_LIMITS.maxQuality).optional();

export const operationRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("convert"),
    outputFormat: z.enum(SUPPORTED_OUTPUT_FORMATS),
    backgroundColor: hexColor,
    quality,
  }),
  z.object({
    kind: z.literal("compress"),
    outputFormat: z.enum(["jpeg", "webp"]),
    quality: z.number().min(IMAGE_LIMITS.minQuality).max(IMAGE_LIMITS.maxQuality),
    backgroundColor: hexColor,
  }),
  z.object({
    kind: z.literal("resize"),
    outputFormat: z.enum(SUPPORTED_OUTPUT_FORMATS),
    width: z.number().int().positive().max(IMAGE_LIMITS.maxOutputDimension).optional(),
    height: z.number().int().positive().max(IMAGE_LIMITS.maxOutputDimension).optional(),
    lockAspectRatio: z.boolean(),
    quality,
    backgroundColor: hexColor,
  }),
]);

export type OperationRequest = z.infer<typeof operationRequestSchema>;
