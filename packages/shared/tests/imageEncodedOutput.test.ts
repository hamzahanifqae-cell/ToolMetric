import { describe, expect, it } from "vitest";
import { validateEncodedOutput, normalizeHexColor } from "../src/image/operations.js";

describe("normalizeHexColor", () => {
  it("adds a missing # prefix", () => {
    expect(normalizeHexColor("ffffff")).toBe("#ffffff");
  });

  it("leaves an already-prefixed value unchanged", () => {
    expect(normalizeHexColor("#00ff00")).toBe("#00ff00");
  });

  it("defaults to white when undefined", () => {
    expect(normalizeHexColor(undefined)).toBe("#ffffff");
  });

  it("defaults to white for an empty string", () => {
    expect(normalizeHexColor("")).toBe("#ffffff");
  });
});

describe("validateEncodedOutput", () => {
  it("accepts a matching MIME type for each supported format", () => {
    expect(validateEncodedOutput("image/png", "png").ok).toBe(true);
    expect(validateEncodedOutput("image/jpeg", "jpeg").ok).toBe(true);
    expect(validateEncodedOutput("image/webp", "webp").ok).toBe(true);
  });

  it("detects a browser's silent PNG fallback when WebP encoding isn't supported", () => {
    const result = validateEncodedOutput("image/png", "webp");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("WEBP");
      expect(result.error).toContain("image/png");
    }
  });

  it("detects a browser's silent PNG fallback when JPEG encoding isn't supported", () => {
    const result = validateEncodedOutput("image/png", "jpeg");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("JPEG");
  });

  it("rejects an empty/unknown MIME type with a helpful message rather than crashing", () => {
    const result = validateEncodedOutput("", "webp");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("unknown format");
  });

  it("never passes for a completely unrelated MIME type", () => {
    expect(validateEncodedOutput("image/gif", "png").ok).toBe(false);
  });
});
