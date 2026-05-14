# Multi-stage Dockerfile for the Spring Boot API.
#
# Stage 1 (builder): compiles the JAR with Maven.
# Stage 2 (runtime): minimal JRE image with just the JAR.
#
# Why multi-stage:
#   - Final image doesn't contain Maven, source code, or build artifacts
#   - Smaller image = faster pulls, faster cold starts on Fargate, smaller attack surface
#   - Builder stage is cached separately - dep changes don't invalidate the source build layer

FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy pom first and resolve dependencies. This layer is cached as long as pom.xml
# doesn't change, so source-only changes don't re-download every dep.
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Now copy source and build.
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root for security.
RUN addgroup -S app && adduser -S app -G app

# Copy just the built JAR.
COPY --from=builder /build/target/*.jar app.jar
RUN chown app:app app.jar

USER app

# Spring Boot listens on 8080 by default.
EXPOSE 8080

# Health check for orchestrators that respect HEALTHCHECK (Compose, not ECS).
# ECS uses target group health checks against /actuator/health.
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:8080/actuator/health || exit 1

# JVM tuning for containers - tells the JVM to respect cgroup memory limits.
# Without these flags, the JVM may not see container limits and OOM-kill itself.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT exec java $JAVA_OPTS -jar app.jar
