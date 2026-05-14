package dev.tempo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authenticates the Python predictor's ingest requests via a shared secret in the
 * X-Ingest-Key header.
 *
 * Why not JWT here?
 *   The Python predictor is a script, not a user. JWT issuance flows assume a user
 *   identity provider. A static API key (rotated via AWS Secrets Manager) is simpler
 *   and fits the trust model: there is one ingest principal, and it's machine-to-machine.
 *
 * Scope:
 *   Only acts on POST /api/v1/ingest/**. Other paths fall through untouched.
 *
 * Security notes:
 *   - Constant-time comparison would be safer than .equals() to mitigate timing attacks
 *     against an attacker who can measure response times precisely. For a header secret
 *     behind TLS + ALB, this is a defense-in-depth concern. Easy upgrade if you care:
 *     use MessageDigest.isEqual(byte[], byte[]).
 *   - The key is injected from configuration. NEVER hardcode it here.
 */
@Component
public class IngestApiKeyFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "X-Ingest-Key";
    private static final String INGEST_PATH_PREFIX = "/api/v1/ingest";

    private final String expectedKey;

    public IngestApiKeyFilter(@Value("${tempo.ingest.api-key}") String expectedKey) {
        this.expectedKey = expectedKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith(INGEST_PATH_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        String providedKey = request.getHeader(HEADER_NAME);
        if (providedKey == null || !providedKey.equals(expectedKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"invalid or missing X-Ingest-Key\"}");
            return;
        }

        // Mark the request as authenticated as the synthetic "ingest" principal.
        // Downstream controllers can check the authority if they want to.
        var auth = new UsernamePasswordAuthenticationToken(
                "ingest",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_INGEST"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
