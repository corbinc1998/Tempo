package dev.tempo.common;

/**
 * Thrown when a resource lookup fails (GET /api/v1/teams/99 with no such team).
 *
 * Resolves to HTTP 404 via GlobalExceptionHandler. Unchecked because checked
 * exceptions force every layer to either catch or declare them, which is verbose
 * for what's really just a control-flow signal.
 *
 * Subclass pattern:
 *   Each domain can extend this with TeamNotFoundException, GameNotFoundException, etc.
 *   The exception name becomes the error code in the response. Or you can pass an
 *   explicit code via the second constructor.
 */
public class NotFoundException extends RuntimeException {

    private final String code;

    public NotFoundException(String message) {
        super(message);
        this.code = "not_found";
    }

    public NotFoundException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
