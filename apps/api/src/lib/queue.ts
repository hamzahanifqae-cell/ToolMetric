import { config } from "../config.js";
import { JobCancelledError } from "./workerJob.js";

export class QueueFullError extends Error {
  constructor() {
    super("Server is at capacity for image processing. Please try again shortly.");
    this.name = "QueueFullError";
  }
}

/**
 * Bounds concurrent *requests* (not just the Sharp call inside them) to
 * `maxConcurrentJobs`, with up to `maxQueueLength` more waiting their turn.
 * Callers acquire a slot before reading/buffering the uploaded file, so the
 * number of files held in memory at once is bounded by the same limit as
 * processing concurrency — not by however many connections the OS/Fastify
 * happens to accept.
 */
class BoundedQueue {
  private active = 0;
  private waiting = 0;

  get activeCount(): number {
    return this.active;
  }

  get waitingCount(): number {
    return this.waiting;
  }

  isFull(): boolean {
    return this.waiting >= config.maxQueueLength;
  }

  /**
   * Reserves a slot, waiting in the (bounded) queue if necessary. Returns a
   * release function the caller must call exactly once — in a `finally` —
   * once it is done with the slot, regardless of success, failure, timeout,
   * or cancellation.
   */
  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) {
      throw new JobCancelledError();
    }

    if (this.active >= config.maxConcurrentJobs) {
      if (this.isFull()) {
        throw new QueueFullError();
      }
      this.waiting += 1;
      try {
        await this.waitForSlot(signal);
      } finally {
        this.waiting -= 1;
      }
    }

    this.active += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active = Math.max(0, this.active - 1);
    };
  }

  private waitForSlot(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const onAbort = () => {
        if (timer) clearTimeout(timer);
        reject(new JobCancelledError());
      };

      const check = () => {
        if (signal?.aborted) {
          onAbort();
          return;
        }
        if (this.active < config.maxConcurrentJobs) {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        } else {
          timer = setTimeout(check, 25);
        }
      };

      signal?.addEventListener("abort", onAbort, { once: true });
      check();
    });
  }
}

export const requestQueue = new BoundedQueue();
