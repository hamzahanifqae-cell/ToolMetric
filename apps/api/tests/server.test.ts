import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server.js";

function multipartBody(fields: { name: string; value: string | Buffer; filename?: string; contentType?: string }[]): {
  body: Buffer;
  boundary: string;
} {
  const boundary = "----toolmetricTestBoundary";
  const parts: Buffer[] = [];

  for (const field of fields) {
    let header = `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"`;
    if (field.filename) header += `; filename="${field.filename}"`;
    header += "\r\n";
    if (field.contentType) header += `Content-Type: ${field.contentType}\r\n`;
    header += "\r\n";
    parts.push(Buffer.from(header, "utf-8"));
    parts.push(typeof field.value === "string" ? Buffer.from(field.value, "utf-8") : field.value);
    parts.push(Buffer.from("\r\n", "utf-8"));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`, "utf-8"));

  return { body: Buffer.concat(parts), boundary };
}

describe("API server", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("responds to the health check", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("responds to the readiness check", async () => {
    const response = await app.inject({ method: "GET", url: "/ready" });
    expect(response.statusCode).toBe(200);
  });

  it("also responds to health/readiness under the /api prefix (for subpath reverse-proxy mounts)", async () => {
    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const ready = await app.inject({ method: "GET", url: "/api/ready" });
    expect(ready.statusCode).toBe(200);
  });

  it("returns 404 for an unknown route", async () => {
    const response = await app.inject({ method: "GET", url: "/nope" });
    expect(response.statusCode).toBe(404);
  });

  it("rejects a process request with no file", async () => {
    const { body, boundary } = multipartBody([
      { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "jpeg" }) },
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/image/process",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects a process request with an invalid operation", async () => {
    const png = await sharp({ create: { width: 5, height: 5, channels: 3, background: "#fff" } }).png().toBuffer();
    const { body, boundary } = multipartBody([
      { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "bmp" }) },
      { name: "file", value: png, filename: "test.png", contentType: "image/png" },
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/image/process",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects a file that is not a real image", async () => {
    const { body, boundary } = multipartBody([
      { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "jpeg" }) },
      { name: "file", value: Buffer.from("not actually an image"), filename: "fake.png", contentType: "image/png" },
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/image/process",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(415);
  });

  it("successfully converts a PNG to JPEG end-to-end", async () => {
    const png = await sharp({ create: { width: 30, height: 20, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.4 } } })
      .png()
      .toBuffer();
    const { body, boundary } = multipartBody([
      { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "jpeg", backgroundColor: "#ffffff" }) },
      { name: "file", value: png, filename: "test.png", contentType: "image/png" },
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/image/process",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/jpeg");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["content-disposition"]).toContain("attachment");
  });

  it("successfully resizes a PNG", async () => {
    const png = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#123456" } })
      .png()
      .toBuffer();
    const { body, boundary } = multipartBody([
      { name: "operation", value: JSON.stringify({ kind: "resize", outputFormat: "png", width: 100, lockAspectRatio: true }) },
      { name: "file", value: png, filename: "test.png", contentType: "image/png" },
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/image/process",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-output-width"]).toBe("100");
    expect(response.headers["x-output-height"]).toBe("50");
  });
});

describe("API server: capacity and timeout behavior (isolated config)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 503 once the bounded queue is saturated", async () => {
    process.env.MAX_CONCURRENT_JOBS = "1";
    process.env.MAX_QUEUE_LENGTH = "0";
    process.env.JOB_TIMEOUT_MS = "20000";
    const { buildServer: build } = await import("../src/server.js");
    const app = await build();
    await app.ready();

    try {
      const png = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#123456" } })
        .png()
        .toBuffer();
      const makeBody = () =>
        multipartBody([
          { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "jpeg" }) },
          { name: "file", value: png, filename: "test.png", contentType: "image/png" },
        ]);

      const first = makeBody();
      const second = makeBody();

      const firstRequest = app.inject({
        method: "POST",
        url: "/api/image/process",
        headers: { "content-type": `multipart/form-data; boundary=${first.boundary}` },
        payload: first.body,
      });
      // Give the first request a moment to acquire the only slot before the second arrives.
      await new Promise((r) => setTimeout(r, 5));

      const secondResponse = await app.inject({
        method: "POST",
        url: "/api/image/process",
        headers: { "content-type": `multipart/form-data; boundary=${second.boundary}` },
        payload: second.body,
      });
      expect(secondResponse.statusCode).toBe(503);

      await firstRequest;
    } finally {
      await app.close();
    }
  });

  it("returns 504 when a job exceeds the configured timeout", async () => {
    process.env.MAX_CONCURRENT_JOBS = "2";
    process.env.MAX_QUEUE_LENGTH = "5";
    process.env.JOB_TIMEOUT_MS = "1"; // shorter than worker startup: guaranteed to time out
    const { buildServer: build } = await import("../src/server.js");
    const app = await build();
    await app.ready();

    try {
      const png = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#123456" } })
        .png()
        .toBuffer();
      const { body, boundary } = multipartBody([
        { name: "operation", value: JSON.stringify({ kind: "convert", outputFormat: "jpeg" }) },
        { name: "file", value: png, filename: "test.png", contentType: "image/png" },
      ]);

      const response = await app.inject({
        method: "POST",
        url: "/api/image/process",
        headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        payload: body,
      });
      expect(response.statusCode).toBe(504);
    } finally {
      await app.close();
    }
  }, 10_000);
});
