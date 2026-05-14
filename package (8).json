/**
 * BFF server entry point.
 *
 * Fastify is the framework. It's faster than Express because:
 *   - JSON schema-based response serialization (avoids JSON.stringify reflection)
 *   - Encapsulated plugin context (no global middleware state)
 *   - Async/await native (Express middleware was retrofitted)
 *
 * Lifecycle:
 *   1. Create Fastify instance with logger
 *   2. Register CORS, schema validators, error handlers
 *   3. Register route plugins (each gets its own scope)
 *   4. Listen
 *   5. On SIGTERM, gracefully drain in-flight requests before exiting
 *
 * Graceful shutdown matters:
 *   When ECS rotates this task during a deploy, it sends SIGTERM and waits up to
 *   the task's stopTimeout (default 30s). If we ignore SIGTERM, in-flight requests
 *   get cut off mid-response. The shutdown handler below does it properly.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { healthRoutes } from './routes/health.js';
import { SpringApiError } from './clients/springApi.js';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    // JSON structured logs. CloudWatch Insights queries this.
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
});

async function bootstrap(): Promise<void> {
  // CORS - locked to known origins in prod, permissive in dev.
  await fastify.register(cors, {
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
    credentials: true,
  });

  // Sensible adds httpErrors helpers (reply.notFound(), reply.badRequest(), etc).
  await fastify.register(sensible);

  // Global error handler - maps Spring API errors to BFF responses.
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof SpringApiError) {
      // 401/403 from Spring should pass through transparently.
      // 5xx from Spring becomes 502 (Bad Gateway) - the issue is upstream.
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        return reply.status(error.status).send({ error: error.message });
      }
      return reply.status(502).send({ error: 'Upstream service error' });
    }

    // Validation errors from Fastify schema have statusCode set on them.
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.validation,
      });
    }

    request.log.error({ err: error }, 'unhandled error');
    return reply.status(500).send({ error: 'Internal server error' });
  });

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(dashboardRoutes);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    fastify.log.info({ signal }, 'shutdown signal received');
    try {
      await fastify.close();
      fastify.log.info('server closed gracefully');
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await fastify.listen({ port: config.port, host: '0.0.0.0' });
}

bootstrap().catch((err) => {
  fastify.log.error({ err }, 'failed to start');
  process.exit(1);
});
