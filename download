/**
 * Typed HTTP client for the Spring Boot API.
 *
 * Uses undici (Node's modern HTTP client, also what powers global fetch under the hood)
 * for keep-alive connection pooling. A fresh fetch() per request creates a new TCP +
 * TLS handshake; with the pool, we reuse connections - lower latency, less overhead.
 *
 * Pattern - one client function per endpoint:
 *   Each function is the one place that knows the URL shape, query params, and
 *   response type for that endpoint. Route handlers stay clean; if the Spring URL
 *   changes, you update one function here.
 *
 * Error handling:
 *   - 4xx: throw an Error with the status code; the route's error handler maps it
 *   - 5xx: throw an Error; the BFF returns 502 ("upstream error") to the client
 *   - Network failure: throw an Error; same handling as 5xx
 *
 * NOT handled here:
 *   - Retries. Add them with a circuit-breaker library (cockatiel, opossum) when
 *     you have a real failure pattern to fix. Speculative retries are an anti-pattern.
 *   - Authentication. The BFF passes through the incoming Authorization header on a
 *     per-request basis, so it's a route concern, not a client-level concern.
 */
import { Agent, request } from 'undici';
import { config } from '../config.js';

const agent = new Agent({
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 600_000,
});

interface RequestOptions {
  bearer?: string;
}

class SpringApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SpringApiError';
  }
}

async function get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${config.springApiBaseUrl}${path}`;
  const headers: Record<string, string> = { 'accept': 'application/json' };
  if (opts.bearer) {
    headers['authorization'] = `Bearer ${opts.bearer}`;
  }

  const { statusCode, body } = await request(url, { method: 'GET', headers, dispatcher: agent });

  if (statusCode >= 400) {
    const text = await body.text();
    throw new SpringApiError(statusCode, `Spring API ${statusCode}: ${text}`);
  }

  return await body.json() as T;
}

// ---- Typed endpoints -----------------------------------------------------
// These types should ideally be generated from the Spring OpenAPI spec
// (springdoc serves /v3/api-docs). For now, hand-write them and keep them in sync.

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
}

export interface Prediction {
  id: number;
  gameId: number;
  homeWinProb: number;
  predictedHome: number;
  predictedAway: number;
  modelVersion: string;
  generatedAt: string;
}

export const springApi = {
  listTeams: (opts?: RequestOptions) => get<Team[]>('/api/v1/teams', opts),

  getTeam: (id: number, opts?: RequestOptions) =>
    get<Team>(`/api/v1/teams/${id}`, opts),

  listPredictionsForWeek: (season: number, week: number, opts?: RequestOptions) =>
    get<Prediction[]>(`/api/v1/predictions?season=${season}&week=${week}`, opts),
};

export { SpringApiError };
