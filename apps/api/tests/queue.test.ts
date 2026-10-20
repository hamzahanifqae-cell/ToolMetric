import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("BoundedQueue", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("never allows more active slots than the configured maximum", async () => {
    process.env.MAX_CONCURRENT_JOBS = "2";
    process.env.MAX_QUEUE_LENGTH = "10";
    const { requestQueue } = await import("../src/lib/queue.js");

    let active = 0;
    let maxActiveSeen = 0;

    const job = async () => {
      const release = await requestQueue.acquire();
      active += 1;
      maxActiveSeen = Math.max(maxActiveSeen, active);
      await delay(20);
      active -= 1;
      release();
    };

    await Promise.all([1, 2, 3, 4, 5].map(() => job()));
    expect(maxActiveSeen).toBeLessThanOrEqual(2);
    expect(requestQueue.activeCount).toBe(0);
  });

  it("rejects new acquisitions once active + waiting are both full", async () => {
    process.env.MAX_CONCURRENT_JOBS = "1";
    process.env.MAX_QUEUE_LENGTH = "1";
    const { requestQueue, QueueFullError } = await import("../src/lib/queue.js");

    const releaseFirst = await requestQueue.acquire();
    const secondAcquire = requestQueue.acquire(); // waits (queue now: 1 active + 1 waiting = full)

    await expect(requestQueue.acquire()).rejects.toBeInstanceOf(QueueFullError);

    releaseFirst();
    const releaseSecond = await secondAcquire;
    releaseSecond();
    expect(requestQueue.activeCount).toBe(0);
  });

  it("recovers capacity after a slot is released, whether from success or failure", async () => {
    process.env.MAX_CONCURRENT_JOBS = "1";
    process.env.MAX_QUEUE_LENGTH = "5";
    const { requestQueue } = await import("../src/lib/queue.js");

    const release1 = await requestQueue.acquire();
    release1();
    expect(requestQueue.activeCount).toBe(0);

    const release2 = await requestQueue.acquire();
    try {
      throw new Error("simulated failure");
    } catch {
      release2();
    }
    expect(requestQueue.activeCount).toBe(0);

    const release3 = await requestQueue.acquire();
    expect(requestQueue.activeCount).toBe(1);
    release3();
    expect(requestQueue.activeCount).toBe(0);
  });

  it("drops a waiting acquisition immediately when its signal aborts, freeing the queue", async () => {
    process.env.MAX_CONCURRENT_JOBS = "1";
    process.env.MAX_QUEUE_LENGTH = "1";
    const { requestQueue } = await import("../src/lib/queue.js");
    const { JobCancelledError } = await import("../src/lib/workerJob.js");

    const release1 = await requestQueue.acquire();
    const controller = new AbortController();
    const waitingAcquire = requestQueue.acquire(controller.signal);

    expect(requestQueue.waitingCount).toBe(1);
    controller.abort();

    await expect(waitingAcquire).rejects.toBeInstanceOf(JobCancelledError);
    expect(requestQueue.waitingCount).toBe(0);

    release1();
  });

  it("rejects immediately for an already-aborted signal without consuming a slot", async () => {
    const { requestQueue } = await import("../src/lib/queue.js");
    const { JobCancelledError } = await import("../src/lib/workerJob.js");
    const controller = new AbortController();
    controller.abort();
    await expect(requestQueue.acquire(controller.signal)).rejects.toBeInstanceOf(JobCancelledError);
    expect(requestQueue.activeCount).toBe(0);
  });
});
