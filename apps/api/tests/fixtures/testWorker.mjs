import { parentPort, workerData } from "node:worker_threads";

async function main() {
  const { mode, delayMs } = workerData;

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
