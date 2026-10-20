import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("tempFiles cleanup", () => {
  const originalEnv = { ...process.env };
  let tempDir: string;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "toolmetric-test-"));
    process.env.TEMP_DIR = tempDir;
    process.env.TEMP_FILE_MAX_AGE_MS = "50";
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("removes files older than the configured max age and keeps fresh ones", async () => {
    const { cleanupAbandonedFiles, ensureTempDir } = await import("../src/lib/tempFiles.js");
    await ensureTempDir();

    const staleFile = path.join(tempDir, "stale.png");
    await fs.writeFile(staleFile, "stale");
    const oldTime = (Date.now() - 1000) / 1000;
    await fs.utimes(staleFile, oldTime, oldTime);

    const freshFile = path.join(tempDir, "fresh.png");
    await fs.writeFile(freshFile, "fresh");

    const removed = await cleanupAbandonedFiles();

    expect(removed).toBe(1);
    await expect(fs.access(staleFile)).rejects.toThrow();
    await expect(fs.access(freshFile)).resolves.toBeUndefined();
  });

  it("generates server-side UUID filenames rather than trusting client input", async () => {
    const { generateTempPath } = await import("../src/lib/tempFiles.js");
    const p1 = generateTempPath("png");
    const p2 = generateTempPath("png");
    expect(p1).not.toBe(p2);
    expect(p1.startsWith(tempDir)).toBe(true);
    expect(p1.endsWith(".png")).toBe(true);
  });

  it("sanitizes an unexpected extension input", async () => {
    const { generateTempPath } = await import("../src/lib/tempFiles.js");
    const p = generateTempPath("../../etc/passwd");
    expect(p).not.toContain("..");
    expect(path.dirname(p)).toBe(tempDir);
  });
});
