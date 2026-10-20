import { describe, expect, it } from "vitest";
import {
  spawnWorkerJob,
  activeWorkerCount,
  terminateAllActiveWorkers,
  JobTimeoutError,
  JobCancelledError,
  WorkerCrashedError,
} from "../src/lib/workerJob.js";

const tsFixture = new URL("./fixtures/testWorker.ts", import.meta.url);
const tsExecArgv = ["--import", "tsx/esm"];
const jsFixture = new URL("./fixtures/testWorker.mjs", import.meta.url);

interface TestMessage {
  ok: true;
  value: string;
}

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe("spawnWorkerJob (TypeScript fixture via tsx/esm)", () => {
  it("resolves with the mapped message on success", async () => {
    const result = await spawnWorkerJob<TestMessage, string>(
      tsFixture,
      { mode: "success" },
      [],
      (msg) => msg.value,
      { timeoutMs: 5000, execArgv: tsExecArgv }
    );
    expect(result).toBe("done");
  });

  it("actually terminates a hung job when it times out, and frees the worker", async () => {
    const before = activeWorkerCount();

    await expect(
      spawnWorkerJob<TestMessage, string>(
        tsFixture,
        { mode: "hang", delayMs: 60_000 },
        [],
        (msg) => msg.value,
        { timeoutMs: 80, execArgv: tsExecArgv }
      )
    ).rejects.toBeInstanceOf(JobTimeoutError);

    // The promise only settles after `worker.terminate()` has been awaited,
    // so the worker must already be gone by the time we get here.
    expect(activeWorkerCount()).toBe(before);
  }, 10_000);

  it("rejects immediately if the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      spawnWorkerJob<TestMessage, string>(tsFixture, { mode: "success" }, [], (msg) => msg.value, {
        timeoutMs: 5000,
        signal: controller.signal,
        execArgv: tsExecArgv,
      })
    ).rejects.toBeInstanceOf(JobCancelledError);
  });

  it("terminates a hung job when its signal is aborted mid-flight", async () => {
    const controller = new AbortController();
    const before = activeWorkerCount();

    const promise = spawnWorkerJob<TestMessage, string>(
      tsFixture,
      { mode: "hang", delayMs: 60_000 },
      [],
      (msg) => msg.value,
      { timeoutMs: 10_000, signal: controller.signal, execArgv: tsExecArgv }
    );

    await waitFor(() => activeWorkerCount() > before);
    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(JobCancelledError);
    expect(activeWorkerCount()).toBe(before);
  }, 10_000);

  it("rejects with WorkerCrashedError when the worker throws", async () => {
    await expect(
      spawnWorkerJob<TestMessage, string>(tsFixture, { mode: "throw" }, [], (msg) => msg.value, {
        timeoutMs: 5000,
        execArgv: tsExecArgv,
      })
    ).rejects.toBeInstanceOf(WorkerCrashedError);
  });

  it("rejects with WorkerCrashedError when the worker exits without responding", async () => {
    await expect(
      spawnWorkerJob<TestMessage, string>(tsFixture, { mode: "silent-exit" }, [], (msg) => msg.value, {
        timeoutMs: 5000,
        execArgv: tsExecArgv,
      })
    ).rejects.toBeInstanceOf(WorkerCrashedError);
  });
});

describe("spawnWorkerJob (plain .mjs fixture, no loader — mirrors the production path)", () => {
  it("resolves with the mapped message on success", async () => {
    const result = await spawnWorkerJob<TestMessage, string>(jsFixture, { mode: "success" }, [], (msg) => msg.value, {
      timeoutMs: 5000,
    });
    expect(result).toBe("done");
  });

  it("terminates a hung job on timeout", async () => {
    const before = activeWorkerCount();
    await expect(
      spawnWorkerJob<TestMessage, string>(jsFixture, { mode: "hang", delayMs: 60_000 }, [], (msg) => msg.value, {
        timeoutMs: 80,
      })
    ).rejects.toBeInstanceOf(JobTimeoutError);
    expect(activeWorkerCount()).toBe(before);
  }, 10_000);
});

describe("terminateAllActiveWorkers (used during graceful shutdown)", () => {
  it("force-kills every in-flight worker, resolving their callers with a crash error", async () => {
    const before = activeWorkerCount();

    const jobs = [1, 2, 3].map((_, i) =>
      spawnWorkerJob<TestMessage, string>(jsFixture, { mode: "hang", delayMs: 60_000 }, [], (msg) => msg.value, {
        timeoutMs: 30_000, // long enough that only our manual shutdown call stops it
      }).catch((err) => err)
    );

    await waitFor(() => activeWorkerCount() >= before + 3);
    expect(activeWorkerCount()).toBe(before + 3);

    await terminateAllActiveWorkers();

    const results = await Promise.all(jobs);
    for (const result of results) {
      expect(result).toBeInstanceOf(Error);
    }
    expect(activeWorkerCount()).toBe(before);
  }, 10_000);
});

describe("activeWorkerCount bookkeeping", () => {
  it("never leaves workers registered after many sequential jobs", async () => {
    const before = activeWorkerCount();
    for (let i = 0; i < 5; i++) {
      await spawnWorkerJob<TestMessage, string>(jsFixture, { mode: "success" }, [], (msg) => msg.value, {
        timeoutMs: 5000,
      });
    }
    expect(activeWorkerCount()).toBe(before);
  });
});
