import { Worker, type Transferable } from "node:worker_threads";

/**
 * Generic, testable primitive for running one unit of work in an isolated
 * worker thread with an enforceable timeout and cancellation. This exists
 * because a plain `Promise.race(job, timeout)` can only abandon a *reference*
 * to a slow/hung job — the underlying synchronous or native work (e.g. a
 * pathological image being decoded by libvips) keeps running in the same
 * process either way. A worker thread can be forcibly stopped with
 * `worker.terminate()`, which is awaited here before this function's
 * promise ever settles, so callers that release capacity only after this
 * resolves/rejects can never free a slot while the work is still running.
 */

export class JobTimeoutError extends Error {
  constructor(message = "Processing timed out.") {
    super(message);
    this.name = "JobTimeoutError";
  }
}

export class JobCancelledError extends Error {
  constructor(message = "Processing was cancelled.") {
    super(message);
    this.name = "JobCancelledError";
  }
}

export class WorkerCrashedError extends Error {
  constructor(message = "The worker exited unexpectedly.") {
    super(message);
    this.name = "WorkerCrashedError";
  }
}

export interface SpawnWorkerJobOptions {
  timeoutMs: number;
  signal?: AbortSignal;
  execArgv?: string[];
}

const activeWorkers = new Set<Worker>();

/** Number of worker threads currently alive (for tests and diagnostics). */
export function activeWorkerCount(): number {
  return activeWorkers.size;
}

/**
 * Forcibly terminates every currently-tracked worker. Used during graceful
 * shutdown so the process can exit promptly instead of waiting for
 * in-flight (possibly hung) image jobs.
 */
export async function terminateAllActiveWorkers(): Promise<void> {
  await Promise.all([...activeWorkers].map((worker) => worker.terminate().catch(() => undefined)));
}

/**
 * Spawns `workerUrl` with `workerData`, waits for a single reply message,
 * and enforces `timeoutMs` and an optional `AbortSignal` by terminating the
 * worker. Exactly one outcome (message, worker error, unexpected exit,
 * timeout, or cancellation) settles the returned promise; whichever one
 * wins, `worker.terminate()` is awaited first so the thread has actually
 * stopped before the caller's `await` resolves.
 */
export function spawnWorkerJob<TMessage, TResult>(
  workerUrl: URL | string,
  workerData: unknown,
  transferList: Transferable[],
  mapMessage: (message: TMessage) => TResult,
  options: SpawnWorkerJobOptions
): Promise<TResult> {
  const { timeoutMs, signal, execArgv } = options;

  return new Promise<TResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new JobCancelledError());
      return;
    }

    const worker = new Worker(workerUrl, {
      workerData,
      transferList,
      execArgv,
    });
    activeWorkers.add(worker);

    let settled = false;
    let timeoutTimer: NodeJS.Timeout | undefined;

    const onAbort = () => {
      void settleAndTerminate(() => reject(new JobCancelledError()));
    };

    const cleanupListeners = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      signal?.removeEventListener("abort", onAbort);
    };

    async function settleAndTerminate(settle: () => void): Promise<void> {
      if (settled) return;
      settled = true;
      cleanupListeners();
      try {
        await worker.terminate();
      } finally {
        activeWorkers.delete(worker);
        settle();
      }
    }

    worker.once("message", (message: TMessage) => {
      void settleAndTerminate(() => {
        try {
          resolve(mapMessage(message));
        } catch (err) {
          reject(err);
        }
      });
    });

    worker.once("error", (err) => {
      void settleAndTerminate(() =>
        reject(new WorkerCrashedError(err instanceof Error ? err.message : String(err)))
      );
    });

    worker.once("exit", (code) => {
      if (!settled) {
        settled = true;
        cleanupListeners();
        activeWorkers.delete(worker);
        reject(new WorkerCrashedError(`Worker exited unexpectedly with code ${code}.`));
      }
    });

    timeoutTimer = setTimeout(() => {
      void settleAndTerminate(() => reject(new JobTimeoutError()));
    }, timeoutMs);

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
