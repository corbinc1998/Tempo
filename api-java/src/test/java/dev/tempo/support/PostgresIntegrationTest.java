package dev.tempo.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests that need real Postgres.
 *
 * Why Testcontainers:
 *   Spinning up a real Postgres in a Docker container during tests catches bugs that
 *   H2 in-memory would mask: dialect differences (JSONB, window functions, array
 *   types), constraint behavior, real Flyway migrations. The cost is a few seconds
 *   per test class as the container starts.
 *
 * Why @ServiceConnection:
 *   Spring Boot 3.1+ feature. Auto-wires the container's connection details into
 *   the application context. No need to manually set spring.datasource.url.
 *
 * Why a single static container:
 *   Reused across all subclasses of this class. JUnit 5 + Testcontainers `static
 *   @Container` means one Postgres instance per JVM, not one per test class.
 *
 * Pattern - shared image and reuse:
 *   The first time you run tests Docker pulls postgres:16-alpine. Subsequent runs
 *   reuse it. For even faster iteration, set TESTCONTAINERS_REUSE_ENABLE=true and
 *   the container survives across `mvn test` invocations.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class PostgresIntegrationTest {

    @Container
    @ServiceConnection
    protected static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("tempo_test")
                    .withUsername("test")
                    .withPassword("test")
                    .withReuse(true);
}
