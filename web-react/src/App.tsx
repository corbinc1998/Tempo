import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './routes/Dashboard';

/**
 * App component - just the route table.
 *
 * All routes share Layout (header, nav, footer). Each route component is responsible
 * for its own data fetching via TanStack Query hooks.
 *
 * Pattern - keep this file boring:
 *   The route table is the one place to see the whole app's surface at a glance.
 *   Don't put rendering logic here. Don't put data fetching here. Just routes.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add new routes here. e.g.:
            <Route path="/teams/:abbreviation" element={<TeamDetail />} />
            <Route path="/predictions/week/:week" element={<WeekPredictions />} />
        */}
        <Route path="*" element={<div className="p-8">Not found.</div>} />
      </Route>
    </Routes>
  );
}
