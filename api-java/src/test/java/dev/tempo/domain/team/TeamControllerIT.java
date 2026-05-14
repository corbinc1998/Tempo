package dev.tempo.domain.team;

import dev.tempo.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test for the Team REST endpoints.
 *
 * Test pyramid:
 *   - Unit tests (cheap, isolated): mock the repository, test service logic
 *   - Integration tests (this file): real DB, real Spring context, real HTTP routing
 *   - End-to-end tests (expensive, rare): full stack including BFF and React
 *
 * What we get here:
 *   - The Flyway migrations actually run, so V2__seed_teams.sql gives us 32 teams
 *   - MockMvc lets us call the controller without an actual HTTP server
 *   - Spring's content negotiation, validation, and exception handling all participate
 *
 * What we DON'T cover at this level:
 *   - JWT validation (mock auth via @WithMockUser in tests that need it)
 *   - Network failures, retries, timeouts (test those at the BFF level)
 *
 * Speed:
 *   First run: ~15s to pull and start Postgres. Subsequent runs: ~3s if you set
 *   testcontainers.reuse.enable=true in ~/.testcontainers.properties.
 */
@AutoConfigureMockMvc
class TeamControllerIT extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listAll_returns32_seededTeams() throws Exception {
        mockMvc.perform(get("/api/v1/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(32));
    }

    @Test
    void getByAbbreviation_lowercase_isStillFound() throws Exception {
        // Controller normalizes to uppercase, so "kc" should resolve to Kansas City.
        mockMvc.perform(get("/api/v1/teams/by-abbreviation/kc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kansas City Chiefs"))
                .andExpect(jsonPath("$.abbreviation").value("KC"));
    }

    @Test
    void getByAbbreviation_unknown_returns404_withStructuredError() throws Exception {
        mockMvc.perform(get("/api/v1/teams/by-abbreviation/XXX"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("team_not_found"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getById_unknown_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/teams/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("team_not_found"));
    }
}
