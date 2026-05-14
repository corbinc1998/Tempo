/**
 * Health check route.
 *
 * The ALB target group hits this to decide if the task is healthy. If we return
 * non-2xx repeatedly, the ALB stops routing traffic to this task and ECS may
 * restart it.
 *
 * Deep vs shallow health:
 *   This is a SHALLOW check - "the process is up and can serve HTTP". It does NOT
 *   verify the Spring API is reachable or the cache is sane.
 *
 *   Deep health checks (e.g. /health/deep that pings the Spring API) sound nice
 *   but cause cascading failures: Spring blips, ALB pulls BFFs out of rotation,
 *   then has nothing to route to even when Spring recovers. Keep this shallow.
 */
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));
}
