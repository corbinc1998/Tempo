# Tempo

A four-tier sports stats and prediction-serving platform. A Python model produces predictions; this system stores them, serves them through an enterprise-grade Java API, aggregates them through a Node.js BFF, and displays them in a React dashboard. Deploys to AWS via CDK.

This repo is a learning scaffold. Every file has comments explaining what it does and why it exists. Read `ARCHITECTURE.md` for the full design rationale and `ROADMAP.md` for how to grow it.

## Architecture at a glance

```
React app  -->  Node BFF  -->  Spring Boot API  -->  PostgreSQL
 (S3+CF)       (Fargate)        (Fargate)             (RDS)
                                     ^
                                     |
                              Python predictor
                              (scheduled ingest)
```

- `api-java/` - Spring Boot 3 / Java 21 REST API. System of record.
- `bff-node/` - Fastify + TypeScript backend-for-frontend. Aggregates and caches.
- `web-react/` - React 19 + Vite + Tailwind dashboard.
- `infra-cdk/` - AWS CDK in TypeScript. Versioned infrastructure.
- `.github/workflows/` - CI and deployment pipelines.

## Quick start (local)

You need: Docker, Java 21, Maven, Node 22+, AWS CDK CLI (only for deploy).

```
# 1. Bring up local Postgres
docker compose up -d

# 2. Spring Boot API on :8080
cd api-java
./mvnw spring-boot:run

# 3. Node BFF on :8081
cd ../bff-node
npm install
npm run dev

# 4. React app on :5173
cd ../web-react
npm install
npm run dev
```

Open http://localhost:5173. The React app calls the BFF, which calls the Spring API, which reads from Postgres.

## How the layers communicate

| From | To | Protocol | Auth |
|------|-----|----------|------|
| Browser | React (CloudFront) | HTTPS | None (static assets) |
| React | BFF | HTTPS / JSON | JWT in Authorization header |
| BFF | Spring API | HTTPS / JSON | JWT forwarded + internal service token |
| Spring API | Postgres | JDBC | Username/password from Secrets Manager |
| Python predictor | Spring API | HTTPS / JSON | API key in `X-Ingest-Key` header |

## What goes where

When you add a feature, here is the rule of thumb:

- **New business logic, new tables, anything requiring transactions**: Spring API
- **Frontend-shaped composition of existing data**: BFF
- **Pure UI / interaction**: React
- **Anything cloud (DNS, IAM, networking, scaling)**: CDK

If you find yourself doing business logic in the BFF, stop. That belongs in Spring. The BFF should be thin.

## Read these in order

1. `ARCHITECTURE.md` - why each piece exists, design decisions, tradeoffs
2. `ROADMAP.md` - how to add new features (worked examples)
3. `api-java/README.md` - Spring Boot specifics
4. `bff-node/README.md` - BFF specifics
5. `web-react/README.md` - React specifics
6. `infra-cdk/README.md` - deployment specifics
