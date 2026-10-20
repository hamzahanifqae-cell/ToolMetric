import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

/**
 * All temporary file names are server-generated UUIDs — never derived from
 * a client-supplied filename or path, which closes off path traversal and
 * filename-injection concerns entirely.
 */
export function generateTempPath(extension: string): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "tmp";
  return path.join(config.tempDir, `${randomUUID()}.${safeExt}`);
}

export async function ensureTempDir(): Promise<void> {
  await fs.mkdir(config.tempDir, { recursive: true });
}

/** Deletes a temp file if it exists; never throws (best-effort cleanup). */
export async function safeDelete(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      // Non-fatal: cleanup failures must not crash request handling.
    }
  }
}

/**
 * Removes any file in the temp directory older than the configured max age.
 * Runs at startup (to clean up files abandoned by a previous crashed
 * process) and on a recurring interval thereafter.
 */
export async function cleanupAbandonedFiles(): Promise<number> {
  await ensureTempDir();
  const now = Date.now();
  let removed = 0;

  let entries: string[];
  try {
    entries = await fs.readdir(config.tempDir);
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const filePath = path.join(config.tempDir, entry);
    try {
      const stat = await fs.stat(filePath);
      if (now - stat.mtimeMs > config.tempFileMaxAgeMs) {
        await fs.unlink(filePath);
        removed += 1;
      }
    } catch {
      // File may have been removed concurrently — ignore.
    }
  }

  return removed;
}

let cleanupTimer: NodeJS.Timeout | undefined;

export function startCleanupSchedule(logger: { info: (msg: string) => void; error: (err: unknown, msg: string) => void }): void {
  cleanupTimer = setInterval(() => {
    cleanupAbandonedFiles()
      .then((removed) => {
        if (removed > 0) logger.info(`Cleanup sweep removed ${removed} abandoned temp file(s).`);
      })
      .catch((err) => logger.error(err, "Temp file cleanup sweep failed"));
  }, config.cleanupIntervalMs);
  cleanupTimer.unref();
}

export function stopCleanupSchedule(): void {
  if (cleanupTimer) clearInterval(cleanupTimer);
}
