import type { FastifyInstance } from "fastify";
import { requestQueue } from "../lib/queue.js";

/**
 * Registered at both the bare path and under /api/ so health checks work
 * whether this service is reached directly (e.g. a process monitor hitting
 * it on its own port) or through a reverse proxy that only forwards
 * requests already prefixed with /api (e.g. cPanel's Node.js Selector
 * mounting this app at a sub-path like toolmetric.online/api via
 * Phusion Passenger's PassengerBaseURI, which does not strip the prefix).
 */
export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  for (const path of ["/health", "/api/health"]) {
    app.get(path, async () => ({ status: "ok" }));
  }

  for (const path of ["/ready", "/api/ready"]) {
    app.get(path, async (_request, reply) => {
      const isReady = !requestQueue.isFull();
      return reply.code(isReady ? 200 : 503).send({ status: isReady ? "ready" : "saturated" });
    });
  }
}
