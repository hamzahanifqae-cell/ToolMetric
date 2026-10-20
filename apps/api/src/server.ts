import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { IMAGE_LIMITS } from "@toolmetric/shared";
import { config } from "./config.js";
import { registerImageRoutes } from "./routes/image.js";
import { registerHealthRoutes } from "./routes/health.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
      // Never log request/response bodies — uploaded image content must not be logged.
      redact: ["req.body"],
    },
    trustProxy: config.trustProxy,
    bodyLimit: IMAGE_LIMITS.maxUploadBytes + 1024 * 1024, // headroom for multipart framing
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
  });

  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    allowList: [],
  });

  await app.register(multipart, {
    limits: {
      fileSize: IMAGE_LIMITS.maxUploadBytes,
      files: 1,
      fields: 10,
    },
  });

  await registerHealthRoutes(app);
  await registerImageRoutes(app);

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: "Not found." });
  });

  app.setErrorHandler((err: FastifyError, request, reply) => {
    request.log.error({ errName: err.name, statusCode: err.statusCode }, "Unhandled request error");
    const statusCode = err.statusCode ?? 500;
    reply.code(statusCode).send({ error: statusCode < 500 ? err.message : "Internal server error." });
  });

  return app;
}
