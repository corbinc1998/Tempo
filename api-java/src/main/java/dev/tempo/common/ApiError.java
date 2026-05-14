package dev.tempo.common;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Standard error response shape returned by GlobalExceptionHandler.
 *
 * Using a record for immutability and no boilerplate. The JSON serialization is
 * predictable: every field appears in lowercase as you see it here.
 *
 * Example payload:
 *   {
 *     "timestamp": "2026-05-13T14:23:01Z",
 *     "status": 404,
 *     "code": "team_not_found",
 *     "message": "Team with id 99 not found",
 *     "path": "/api/v1/teams/99",
 *     "fieldErrors": null
 *   }
 *
 * fieldErrors is only present for validation failures.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<Map<String, String>> fieldErrors
) {
    public static ApiError of(int status, String code, String message, String path) {
        return new ApiError(Instant.now(), status, code, message, path, null);
    }

    public static ApiError of(int status, String code, String message, String path,
                              List<Map<String, String>> fieldErrors) {
        return new ApiError(Instant.now(), status, code, message, path, fieldErrors);
    }
}
