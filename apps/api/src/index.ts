import { buildServer } from "./server.js";
import { config } from "./config.js";
import { cleanupAbandonedFiles, ensureTempDir, startCleanupSchedule, stopCleanupSchedule } from "./lib/tempFiles.js";
import { terminateAllActiveWorkers } from "./lib/workerJob.js";

/** Waits for `promise`, but never longer than `ms` — shutdown must not hang forever. */
function withDeadline(promise: Promise<void>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    promise.finally(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  await ensureTempDir();
  const removedOnStartup = await cleanupAbandonedFiles();

  const app = await buildServer();
  startCleanupSchedule(app.log);

  if (removedOnStartup > 0) {
    app.log.info(`Startup cleanup removed ${removedOnStartup} abandoned temp file(s).`);
  }

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    stopCleanupSchedule();
    try {
      // app.close() stops accepting new connections and waits for in-flight
      // requests to finish normally; each of those already awaits its own
      // worker's termination before responding. This deadline is a backstop
      // for a stuck connection, not the primary cleanup path.
      await withDeadline(app.close(), config.shutdownTimeoutMs);
      await terminateAllActiveWorkers();
      app.log.info("Server closed.");
      process.exit(0);
    } catch (err) {
      app.log.error(err, "Error during shutdown");
      await terminateAllActiveWorkers();
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
