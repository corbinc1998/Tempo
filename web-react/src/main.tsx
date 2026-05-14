/**
 * Application entry point.
 *
 * Three providers wrap everything:
 *   1. QueryClientProvider - TanStack Query for server state (cache, refetch, etc)
 *   2. BrowserRouter - client-side routing via react-router-dom v7
 *   3. (StrictMode is React's invariant checker; double-renders in dev to surface bugs)
 *
 * Why TanStack Query and not Redux / Zustand / Context:
 *   Server state and client state are different problems. Server state is async,
 *   has caching semantics, can go stale, needs revalidation. TanStack Query handles
 *   all of that. For local UI state (modal open?, form values), use useState or
 *   useReducer. Redux is overkill for both.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch every time a component remounts. Predictions update at most
      // once per ingest cycle, so 30s freshness is fine.
      staleTime: 30_000,
      // Background refetch when the user comes back to the tab. Good default.
      refetchOnWindowFocus: true,
      // Retry once on transient network failures; more than that and we're hiding
      // real problems behind retries.
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
