# Spring Boot API

Java 21 + Spring Boot 3.3. System of record for predictions, games, teams, and Elo.

## Run locally

```
# From repo root, start Postgres first
docker compose up -d

# Then from this directory
./mvnw spring-boot:run
```

API is at http://localhost:8080. Swagger UI at http://localhost:8080/swagger-ui.html.

## Run tests

```
./mvnw test
```

Tests spin up an ephemeral Postgres via Testcontainers. Docker must be running.

## Key files for first-time readers

- `TempoApplication.java` - entry point, explains `@SpringBootApplication`
- `config/SecurityConfig.java` - HTTP security setup, JWT vs API key paths
- `common/GlobalExceptionHandler.java` - one place where errors become JSON
- `domain/team/` - complete domain slice, use as template

## Patterns

**Adding a new endpoint to an existing domain.** Add the method in the controller,
delegate to the service, write tests. Keep controllers thin.

**Adding a new domain.** Copy `team/` to a new package, rename, adapt. Update the
relevant SQL migration. Write an integration test against seeded data.

**Adding a new SQL column.** Write a new Flyway migration (`V3__...`). Update the
entity. Update the DTO if it's user-visible. The validation annotations only need
updating if you're changing the API contract.

## Common gotchas

- `@Transactional` on a private method does nothing - the Spring proxy can't intercept.
- `@Transactional` self-invocation (`this.method()` from another method in the same class) bypasses the proxy.
- `open-in-view: true` (the default in some Spring Boot starters) hides N+1 queries during testing - we set it false in `application.yml`.
- Flyway migrations are immutable once applied anywhere; always make a new `V_n__` file.
