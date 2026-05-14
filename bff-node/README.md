# Node BFF

Fastify + TypeScript backend-for-frontend. Aggregates Spring API responses for the React dashboard.

## Run locally

```
npm install
npm run dev
```

Listens on :8081. The dashboard endpoint is at http://localhost:8081/api/dashboard?season=8&week=1.

## When to add a route here vs to Spring

Add to the **BFF** when:
- It composes multiple Spring endpoints into one frontend-shaped payload
- It needs response caching tuned for the UI
- The shape is screen-specific and won't generalize to other API consumers

Add to **Spring** when:
- It's a new resource or persists state
- It's a business operation that needs transactions
- It will eventually serve more than one client (mobile, partner, internal tool)

If you're not sure, default to Spring. Moving logic up to the BFF later is easier than moving it back down.

## Anti-patterns to avoid

- **Business logic in the BFF.** If you're computing a standing or applying a rule that's not "shape this data differently," it belongs in Spring.
- **Database access from the BFF.** The BFF only talks to other services. Direct DB access from two places is a coherence problem waiting to happen.
- **Long-lived state in the BFF.** Caches are fine because they're disposable. User data, sessions, anything that loses meaning when the process restarts - not here.
