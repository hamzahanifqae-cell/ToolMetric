import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { runImageProcessingJob } from "../src/lib/imageJobRunner.js";
import { ImageProcessingError } from "../src/lib/imageProcessor.js";
import { JobTimeoutError } from "../src/lib/workerJob.js";
import { activeWorkerCount } from "../src/lib/workerJob.js";

async function makePng(width = 40, height = 30): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } } })
    .png()
    .toBuffer();
}

describe("runImageProcessingJob (real Sharp worker, end-to-end)", () => {
  it("converts an image inside the worker and returns correct output", async () => {
    const input = await makePng();
    const result = await runImageProcessingJob(
      input,
      { kind: "convert", outputFormat: "jpeg", backgroundColor: "#00ff00" },
      { timeoutMs: 20_000 }
    );
    expect(result.format).toBe("jpeg");
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("jpeg");
  });

  it("resizes an image inside the worker", async () => {
    const input = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#123456" } })
      .png()
      .toBuffer();
    const result = await runImageProcessingJob(
      input,
      { kind: "resize", outputFormat: "png", width: 100, lockAspectRatio: true },
      { timeoutMs: 20_000 }
    );
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it("propagates a validation failure as a real ImageProcessingError with the correct status code", async () => {
    const garbage = Buffer.from("not an image", "utf-8");
    await expect(
      runImageProcessingJob(garbage, { kind: "convert", outputFormat: "png" }, { timeoutMs: 20_000 })
    ).rejects.toMatchObject({ name: "ImageProcessingError", statusCode: 400 });
  });

  it("actually stops processing when the timeout fires, freeing the worker", async () => {
    const before = activeWorkerCount();
    const input = await makePng(500, 500);

    await expect(
      runImageProcessingJob(
        input,
        { kind: "compress", outputFormat: "jpeg", quality: 90 },
        { timeoutMs: 1 } // smaller than worker startup time: guaranteed to time out
      )
    ).rejects.toBeInstanceOf(JobTimeoutError);

    expect(activeWorkerCount()).toBe(before);
  }, 10_000);

  it("honors an abort signal mid-processing", async () => {
    const controller = new AbortController();
    const input = await makePng();
    controller.abort();

    await expect(
      runImageProcessingJob(input, { kind: "convert", outputFormat: "png" }, { timeoutMs: 20_000, signal: controller.signal })
    ).rejects.toThrow();
  });

  it("rejects cleanly when an ImageProcessingError instance check is used by callers", async () => {
    const garbage = Buffer.from("not an image", "utf-8");
    try {
      await runImageProcessingJob(garbage, { kind: "convert", outputFormat: "png" }, { timeoutMs: 20_000 });
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).toBeInstanceOf(ImageProcessingError);
    }
  });
});
