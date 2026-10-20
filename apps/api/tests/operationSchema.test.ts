import { describe, expect, it } from "vitest";
import { operationRequestSchema } from "../src/lib/operationSchema.js";

describe("operationRequestSchema", () => {
  it("accepts a valid convert request", () => {
    const result = operationRequestSchema.safeParse({ kind: "convert", outputFormat: "jpeg" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid compress request", () => {
    const result = operationRequestSchema.safeParse({ kind: "compress", outputFormat: "webp", quality: 80 });
    expect(result.success).toBe(true);
  });

  it("rejects compress without a quality value", () => {
    const result = operationRequestSchema.safeParse({ kind: "compress", outputFormat: "webp" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid resize request", () => {
    const result = operationRequestSchema.safeParse({
      kind: "resize",
      outputFormat: "png",
      width: 800,
      lockAspectRatio: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown operation kind", () => {
    const result = operationRequestSchema.safeParse({ kind: "rotate", outputFormat: "png" });
    expect(result.success).toBe(false);
  });

  it("rejects quality outside the 1-100 range", () => {
    const result = operationRequestSchema.safeParse({ kind: "compress", outputFormat: "jpeg", quality: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed background color", () => {
    const result = operationRequestSchema.safeParse({
      kind: "convert",
      outputFormat: "jpeg",
      backgroundColor: "red",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a resize width beyond the configured maximum", () => {
    const result = operationRequestSchema.safeParse({
      kind: "resize",
      outputFormat: "png",
      width: 999_999,
      lockAspectRatio: true,
    });
    expect(result.success).toBe(false);
  });
});
