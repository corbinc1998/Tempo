/**
 * Centralized configuration.
 *
 * Everything env-driven. Defaults are dev-friendly; prod gets real values from
 * the ECS task definition (sourced from AWS Secrets Manager / Parameter Store).
 *
 * Pattern - validate at startup, not lazily:
 *   If a required env var is missing in prod, you want to fail at container start,
 *   not when the first request comes in. The throw on undefined below does this.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const config = {
  // BFF listens on this port. ALB target group health check hits /health here.
  port: parseInt(optional('PORT', '8081'), 10),

  // Where to find the Spring API. In ECS this is the service discovery DNS name
  // or the internal ALB. Locally it's localhost:8080.
  springApiBaseUrl: optional('SPRING_API_BASE_URL', 'http://localhost:8080'),

  // CORS allowlist for the React app's origin(s).
  // Comma-separated. Empty in dev means "allow all" - never do that in prod.
  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Cache TTL for aggregate endpoints (seconds).
  cacheTtlSeconds: parseInt(optional('CACHE_TTL_SECONDS', '60'), 10),

  // Log level. 'info' in prod, 'debug' locally.
  logLevel: optional('LOG_LEVEL', 'info'),
};
