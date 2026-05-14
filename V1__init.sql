package dev.tempo.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralized exception-to-response mapping.
 *
 * Why this exists:
 *   Without it, controllers have try/catch blocks everywhere or throw raw exceptions
 *   that Spring renders as ugly default error responses. This class converts thrown
 *   exceptions into well-formed ApiError JSON, in ONE place.
 *
 * How it works:
 *   {@code @RestControllerAdvice} makes this a global wrapper around all controllers.
 *   For each {@code @ExceptionHandler}, Spring inspects every exception thrown from
 *   any controller method and routes to the matching handler.
 *
 * Order matters:
 *   Spring picks the most specific handler. NotFoundException is more specific than
 *   RuntimeException, so it gets matched first. The catch-all goes last.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Domain "resource not found" -> 404.
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(404, ex.getCode(), ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Bean Validation failures (@Valid on request body) -> 400 with field details.
     *
     * Example: POST a Team with name=null and you get:
     *   {
     *     ...
     *     "code": "validation_failed",
     *     "fieldErrors": [
     *       { "field": "name", "message": "must not be blank" }
     *     ]
     *   }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleBodyValidation(MethodArgumentNotValidException ex,
                                                        HttpServletRequest req) {
        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage()
                ))
                .collect(Collectors.toList());

        ApiError body = ApiError.of(400, "validation_failed",
                "Request body failed validation", req.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Bean Validation failures on path/query params (@Validated on controller) -> 400.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleParamValidation(ConstraintViolationException ex,
                                                         HttpServletRequest req) {
        List<Map<String, String>> fieldErrors = ex.getConstraintViolations().stream()
                .map(cv -> Map.of(
                        "field", cv.getPropertyPath().toString(),
                        "message", cv.getMessage()
                ))
                .collect(Collectors.toList());

        ApiError body = ApiError.of(400, "validation_failed",
                "Request parameters failed validation", req.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Auth required but not provided / invalid -> 401.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex,
                                                        HttpServletRequest req) {
        ApiError body = ApiError.of(401, "unauthenticated", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    /**
     * Auth present but caller lacks permission -> 403.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex,
                                                      HttpServletRequest req) {
        ApiError body = ApiError.of(403, "forbidden", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Catch-all for anything we didn't anticipate -> 500.
     *
     * Logs the full stack trace (important for debugging in CloudWatch) but does NOT
     * leak it to the response. The user gets a generic message.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception for {} {}", req.getMethod(), req.getRequestURI(), ex);
        ApiError body = ApiError.of(500, "internal_error",
                "An unexpected error occurred", req.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
