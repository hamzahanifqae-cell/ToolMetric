import { parentPort, workerData } from "node:worker_threads";

interface TestWorkerData {
  mode: "success" | "hang" | "throw" | "silent-exit";
  delayMs?: number;
}

async function main(): Promise<void> {
  const { mode, delayMs } = workerData as TestWorkerData;

  if (mode === "silent-exit") {
    return;
  }
  if (mode === "throw") {
    throw new Error("deliberate test crash");
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs ?? 0));
  parentPort?.postMessage({ ok: true, value: "done" });
}

void main();
