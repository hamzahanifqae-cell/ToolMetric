import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validateImageSignature } from "../src/lib/validateUpload.js";

describe("validateImageSignature", () => {
  it("accepts a real PNG", async () => {
    const buffer = await sharp({ create: { width: 5, height: 5, channels: 3, background: "#ffffff" } })
      .png()
      .toBuffer();
    const result = await validateImageSignature(buffer);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("png");
  });

  it("accepts a real JPEG", async () => {
    const buffer = await sharp({ create: { width: 5, height: 5, channels: 3, background: "#ffffff" } })
      .jpeg()
      .toBuffer();
    const result = await validateImageSignature(buffer);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("jpeg");
  });

  it("accepts a real WebP", async () => {
    const buffer = await sharp({ create: { width: 5, height: 5, channels: 3, background: "#ffffff" } })
      .webp()
      .toBuffer();
    const result = await validateImageSignature(buffer);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("webp");
  });

  it("rejects a PNG file that was simply renamed from arbitrary text (no real signature)", async () => {
    const fakeImage = Buffer.from("this is just plain text pretending to be an image", "utf-8");
    const result = await validateImageSignature(fakeImage);
    expect(result.ok).toBe(false);
  });

  it("rejects an SVG (not supported in the initial version)", async () => {
    const svg = Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>', "utf-8");
    const result = await validateImageSignature(svg);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty buffer", async () => {
    const result = await validateImageSignature(Buffer.alloc(0));
    expect(result.ok).toBe(false);
  });
});
