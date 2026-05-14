# React Web App

React 19 + Vite + Tailwind v4 + TanStack Query. Builds to static files for S3 + CloudFront.

## Run locally

```
npm install
npm run dev
```

Opens at http://localhost:5173. Requires the BFF to be running on :8081 (Vite proxies `/api` and `/health` to it).

## Build

```
npm run build
```

Output goes to `dist/`. Deploy by syncing `dist/` to the S3 bucket and invalidating CloudFront.

## Patterns to follow

**Data fetching.** Use TanStack Query hooks. Define one function per BFF endpoint in `src/api/client.ts`, then wrap with `useQuery` in the component. Don't fetch in `useEffect` directly; that's the old way and you'll reimplement caching, loading states, and revalidation badly.

**State management.** Server state in TanStack Query. UI state in `useState`. Cross-component state in Context (rarely needed for this app's size). Don't reach for Redux or Zustand unless you have a real reason.

**Routing.** Add routes to `src/App.tsx`. Use URL params for anything that should be bookmarkable or back-button-friendly - season, week, team, etc. Currently `Dashboard.tsx` uses `useState` for week; should be `useSearchParams`. Upgrade as a first exercise.

**Styling.** Tailwind utility classes. For repeated patterns, extract to a component (`PredictionCard`, `WeekSelector`), not a CSS class.

## When to add a route here vs a component

A **route** is a screen the user can navigate to via URL. A **component** is a piece of UI reused across screens.

If you're tempted to make `/predictions?expanded=true` toggle UI state via the URL, it's probably a component state, not a route.
