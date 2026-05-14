/**
 * Thin client for the BFF.
 *
 * Why a hand-rolled fetch wrapper, not Axios:
 *   fetch is the platform standard, lighter, and good enough. Axios was the
 *   right call in 2018; today it's a habit, not a need.
 *
 * Pattern - one function per BFF endpoint:
 *   Each function is the single source of truth for URL shape, params, and types.
 *   Components don't construct URLs; they call these functions.
 */
import type { DashboardResponse } from './types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'accept': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, `${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: (season: number, week: number) =>
    getJson<DashboardResponse>(`/api/dashboard?season=${season}&week=${week}`),
};

export { ApiError };
