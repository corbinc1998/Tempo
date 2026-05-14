# Production profile.
# Activated by setting SPRING_PROFILES_ACTIVE=prod in the ECS task definition.
#
# Everything sensitive comes from environment variables sourced from AWS Secrets Manager.
# Nothing here should hardcode credentials, endpoints, or anything environment-specific.

spring:
  datasource:
    # All injected by ECS task definition from Secrets Manager:
    # SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/tempo
    # SPRING_DATASOURCE_USERNAME=<from secret>
    # SPRING_DATASOURCE_PASSWORD=<from secret>
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    properties:
      hibernate:
        format_sql: false  # No pretty-printing in prod logs
    show-sql: false

logging:
  level:
    root: INFO
    dev.tempo: INFO
    org.hibernate.SQL: WARN  # Don't log every query in prod
  pattern:
    # Structured logging - CloudWatch parses these into searchable fields.
    console: '{"ts":"%d{yyyy-MM-dd HH:mm:ss.SSS}","level":"%level","logger":"%logger{36}","trace":"%X{traceId:-}","msg":"%msg"}%n'

management:
  endpoints:
    web:
      exposure:
        # Tighter in prod - no /env, no /beans, no /configprops.
        include: health, prometheus
  endpoint:
    health:
      # Show component details only to authenticated callers.
      show-details: when-authorized
      probes:
        # /actuator/health/liveness and /actuator/health/readiness for ALB / ECS.
        enabled: true

server:
  error:
    include-message: never
    include-binding-errors: never
    include-stacktrace: never
