package dev.tempo.config;

import dev.tempo.security.IngestApiKeyFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Centralized HTTP security configuration.
 *
 * Authentication model:
 *   1. Most reads are PUBLIC (the dashboard is public-facing).
 *   2. User-specific writes use JWT Bearer auth (Spring's OAuth2 resource server).
 *   3. The ingest endpoint uses a separate API key filter; it never sees a JWT.
 *
 * Why disable CSRF:
 *   CSRF protection matters for stateful, cookie-authenticated apps. We're stateless
 *   with bearer tokens, so CSRF is irrelevant - the attacker can't forge an
 *   Authorization header from another origin.
 *
 * Why STATELESS sessions:
 *   The API holds no server-side session state. Each request is independent.
 *   This enables horizontal scaling without sticky sessions or shared session stores.
 */
@Configuration
public class SecurityConfig {

    private final IngestApiKeyFilter ingestApiKeyFilter;

    public SecurityConfig(IngestApiKeyFilter ingestApiKeyFilter) {
        this.ingestApiKeyFilter = ingestApiKeyFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Health + docs are open
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // Public read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/v1/teams/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/games/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/predictions/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/elo/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/standings/**").permitAll()

                        // Ingest authenticates via X-Ingest-Key header (handled by filter below)
                        .requestMatchers(HttpMethod.POST, "/api/v1/ingest/**").permitAll()

                        // Everything else requires a valid JWT
                        .anyRequest().authenticated()
                )
                // Plug in API key filter BEFORE the standard auth filter.
                // It only acts on /api/v1/ingest/** and ignores everything else.
                .addFilterBefore(ingestApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
                // Enable JWT validation for the protected endpoints.
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> {}));

        return http.build();
    }
}
