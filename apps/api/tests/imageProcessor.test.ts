import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processImage, ImageProcessingError } from "../src/lib/imageProcessor.js";

async function makeTransparentPng(width = 20, height = 10): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
}

describe("processImage: convert", () => {
  it("converts PNG to JPEG and flattens transparency onto the requested background", async () => {
    const input = await makeTransparentPng();
    const result = await processImage(input, { kind: "convert", outputFormat: "jpeg", backgroundColor: "#ff0000" });
    expect(result.format).toBe("jpeg");

    const outMeta = await sharp(result.buffer).metadata();
    expect(outMeta.format).toBe("jpeg");
    expect(outMeta.hasAlpha).toBeFalsy();
  });

  it("converts PNG to WebP preserving transparency", async () => {
    const input = await makeTransparentPng();
    const result = await processImage(input, { kind: "convert", outputFormat: "webp" });
    expect(result.format).toBe("webp");
    const outMeta = await sharp(result.buffer).metadata();
    expect(outMeta.hasAlpha).toBe(true);
  });

  it("converts WebP to PNG", async () => {
    const webp = await sharp({ create: { width: 15, height: 15, channels: 3, background: "#336699" } })
      .webp()
      .toBuffer();
    const result = await processImage(webp, { kind: "convert", outputFormat: "png" });
    expect(result.format).toBe("png");
  });

  it("rejects a corrupt / undecodable buffer", async () => {
    const garbage = Buffer.from("not an image at all, just bytes", "utf-8");
    await expect(processImage(garbage, { kind: "convert", outputFormat: "png" })).rejects.toBeInstanceOf(
      ImageProcessingError
    );
  });
});

describe("processImage: compress", () => {
  it("produces a smaller JPEG at low quality than at high quality", async () => {
    const input = await sharp({
      create: { width: 400, height: 400, channels: 3, background: { r: 128, g: 64, b: 200 } },
    })
      .png()
      .toBuffer();

    const low = await processImage(input, { kind: "compress", outputFormat: "jpeg", quality: 10 });
    const high = await processImage(input, { kind: "compress", outputFormat: "jpeg", quality: 95 });

    expect(low.buffer.length).toBeLessThan(high.buffer.length);
  });

  it("rejects quality outside 1-100 at the processor level too", async () => {
    const input = await makeTransparentPng();
    await expect(
      processImage(input, { kind: "compress", outputFormat: "jpeg", quality: 150 })
    ).rejects.toBeInstanceOf(ImageProcessingError);
  });
});

describe("processImage: resize", () => {
  it("resizes with aspect ratio locked", async () => {
    const input = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#000000" } })
      .png()
      .toBuffer();

    const result = await processImage(input, {
      kind: "resize",
      outputFormat: "png",
      width: 100,
      lockAspectRatio: true,
    });

    expect(result.width).toBeLessThanOrEqual(100);
    // 200x100 -> width 100 means height should scale to 50
    expect(result.height).toBe(50);
  });

  it("resizes without locking aspect ratio to exact dimensions", async () => {
    const input = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#000000" } })
      .png()
      .toBuffer();

    const result = await processImage(input, {
      kind: "resize",
      outputFormat: "png",
      width: 50,
      height: 50,
      lockAspectRatio: false,
    });

    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it("rejects a missing width and height", async () => {
    const input = await makeTransparentPng();
    await expect(
      processImage(input, { kind: "resize", outputFormat: "png", lockAspectRatio: true })
    ).rejects.toBeInstanceOf(ImageProcessingError);
  });

  it("rejects an output dimension beyond the configured limit", async () => {
    const input = await makeTransparentPng();
    await expect(
      processImage(input, { kind: "resize", outputFormat: "png", width: 50_000, lockAspectRatio: true })
    ).rejects.toBeInstanceOf(ImageProcessingError);
  });
});
