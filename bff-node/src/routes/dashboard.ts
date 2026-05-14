/**
 * Dashboard route - the canonical BFF aggregation example.
 *
 * The React app calls ONE endpoint and gets a fully-formed dashboard payload.
 * Under the hood, the BFF calls three Spring endpoints in parallel and shapes
 * the result for the UI.
 *
 * Why this is the BFF's job (not the React app's):
 *   - React shouldn't orchestrate cross-resource fetches; it gets messy fast
 *   - Network round trips matter; one BFF call to React + three internal calls
 *     in the same VPC is faster than three internet round trips from React
 *   - Caching can be centralized here, not duplicated across clients
 *
 * Why this is the BFF's job (not Spring's):
 *   - The Spring API is the system of record. Its endpoints model resources
 *     (predictions, teams, elo), not screens.
 *   - Adding a `/dashboard` endpoint to Spring would create a long tail of
 *     screen-specific endpoints, each of which the team has to maintain.
 *   - BFF endpoints are throwaway - if the dashboard redesigns, the BFF
 *     endpoint changes without touching Spring.
 */
import type { FastifyInstance } from 'fastify';
import { cache } from '../cache.js';
import { springApi, type Prediction, type Team } from '../clients/springApi.js';

interface DashboardResponse {
  season: number;
  week: number;
  teams: Team[];
  predictions: Prediction[];
  fetchedAt: string;
}

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: { season?: string; week?: string } }>(
    '/api/dashboard',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            season: { type: 'string' },
            week: { type: 'string' },
          },
        },
      },
    },
    async (request, _reply) => {
      const season = parseInt(request.query.season ?? '8', 10);
      const week = parseInt(request.query.week ?? '1', 10);

      const cacheKey = `dashboard:season:${season}:week:${week}`;
      const cached = cache.get<DashboardResponse>(cacheKey);
      if (cached) {
        request.log.debug({ cacheKey }, 'cache hit');
        return cached;
      }

      // Parallel fetches. Promise.all short-circuits on the first rejection.
      // If you want partial success (return what we got, mark the rest as errored),
      // use Promise.allSettled instead. See ROADMAP "worked example 3" for thinking
      // through partial failure modes.
      const [teams, predictions] = await Promise.all([
        springApi.listTeams(),
        springApi.listPredictionsForWeek(season, week),
      ]);

      const response: DashboardResponse = {
        season,
        week,
        teams,
        predictions,
        fetchedAt: new Date().toISOString(),
      };

      cache.set(cacheKey, response);
      return response;
    }
  );
}
