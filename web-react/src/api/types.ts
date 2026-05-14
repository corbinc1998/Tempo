/**
 * Type definitions for BFF responses.
 *
 * These should match what the BFF returns. The ideal future is to generate these
 * from the BFF's OpenAPI spec (Fastify can emit one) so they can't drift.
 *
 * For now they're hand-maintained. When you add a field on the BFF side, update here.
 */

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

export interface DashboardResponse {
  season: number;
  week: number;
  teams: Team[];
  predictions: Prediction[];
  fetchedAt: string;
}
