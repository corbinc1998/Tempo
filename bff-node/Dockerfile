# Multi-stage Dockerfile for the Node BFF.

FROM node:22-alpine AS builder
WORKDIR /build

# Install deps with strict lockfile honoring.
COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22-alpine
WORKDIR /app

# Production deps only - no dev dependencies in the final image.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /build/dist ./dist

# Non-root.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8081
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
