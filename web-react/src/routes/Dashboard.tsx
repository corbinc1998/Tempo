import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Dashboard route.
 *
 * Demonstrates the canonical TanStack Query pattern:
 *   1. Query key encodes the inputs (season, week)
 *   2. Query function calls the API client
 *   3. Component renders one of three states: loading, error, success
 *
 * Why the season/week are useState here (vs URL params):
 *   For a real app these should be in the URL so they're shareable and back-button
 *   friendly. Use useSearchParams from react-router. This is left simple for the
 *   scaffold; upgrade as soon as you ship.
 */
export default function Dashboard() {
  const [season] = useState(8);
  const [week, setWeek] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', season, week],
    queryFn: () => api.getDashboard(season, week),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Week</span>
          <select
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value, 10))}
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">Loading...</div>}

      {error && (
        <div className="text-red-600">
          Failed to load dashboard: {(error as Error).message}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="text-sm text-gray-500">
            Season {data.season}, Week {data.week} - {data.predictions.length} predictions
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.predictions.map((p) => (
              <div key={p.id} className="border rounded p-4 bg-white">
                <div className="text-sm text-gray-500">Game {p.gameId}</div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-lg">
                    {p.predictedAway.toFixed(1)} - {p.predictedHome.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {(p.homeWinProb * 100).toFixed(1)}% home win
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Model {p.modelVersion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
