import os from "node:os";
import path from "node:path";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

function envList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

export const config = {
  port: envInt("PORT", 8787),
  host: process.env.HOST ?? "0.0.0.0",

  /** Comma-separated list of allowed CORS origins. */
  corsOrigins: envList("CORS_ORIGIN", ["http://localhost:4321"]),

  /** Whether the service sits behind a reverse proxy (affects X-Forwarded-* trust). */
  trustProxy: envBool("TRUST_PROXY", false),

  /** Maximum number of image jobs processed concurrently (bounded worker pool). */
  maxConcurrentJobs: envInt("MAX_CONCURRENT_JOBS", 2),

  /** Maximum number of jobs allowed to wait in queue before rejecting new requests. */
  maxQueueLength: envInt("MAX_QUEUE_LENGTH", 10),

  /** Hard timeout for a single image-processing job. */
  jobTimeoutMs: envInt("JOB_TIMEOUT_MS", 20_000),

  /** Upper bound on graceful shutdown before forcing worker termination and exiting. */
  shutdownTimeoutMs: envInt("SHUTDOWN_TIMEOUT_MS", 10_000),

  /** Requests per window per IP, enforced by @fastify/rate-limit. */
  rateLimitMax: envInt("RATE_LIMIT_MAX", 20),
  rateLimitWindowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),

  /** Directory used for temporary upload/output files. */
  tempDir: process.env.TEMP_DIR ?? path.join(os.tmpdir(), "toolmetric-uploads"),

  /** Files older than this are considered abandoned and removed by the cleanup sweep. */
  tempFileMaxAgeMs: envInt("TEMP_FILE_MAX_AGE_MS", 10 * 60 * 1000),

  /** How often the background cleanup sweep runs. */
  cleanupIntervalMs: envInt("CLEANUP_INTERVAL_MS", 5 * 60 * 1000),

  logLevel: process.env.LOG_LEVEL ?? "info",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;
