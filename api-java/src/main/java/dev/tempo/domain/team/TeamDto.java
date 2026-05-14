package dev.tempo.domain.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO (Data Transfer Object) for team API responses and requests.
 *
 * Records are perfect for DTOs: immutable, auto-generated equals/hashCode/toString,
 * compact syntax. Jackson serializes records out of the box.
 *
 * Why a separate DTO at all (vs returning the entity):
 *   - Decouples API contract from DB schema
 *   - Avoids accidentally serializing internal fields (timestamps, JPA-managed state)
 *   - Lets you reshape the response without a DB migration
 *   - Validation annotations live here, not on the entity (entity validation is
 *     a different concern from request validation)
 *
 * Two DTOs in one file is fine for related types; split when they grow.
 */
public class TeamDto {

    /** Response shape returned by GET endpoints. */
    public record Response(
            Long id,
            String name,
            String abbreviation,
            String conference,
            String division
    ) {
        public static Response from(Team entity) {
            return new Response(
                    entity.getId(),
                    entity.getName(),
                    entity.getAbbreviation(),
                    entity.getConference(),
                    entity.getDivision()
            );
        }
    }

    /**
     * Request shape for POST/PUT.
     *
     * Validation annotations (Jakarta Bean Validation):
     *   @NotBlank - non-null and not empty/whitespace
     *   @Size     - length constraints
     *
     * These run when the controller method parameter is annotated @Valid. Failures
     * throw MethodArgumentNotValidException, caught by GlobalExceptionHandler.
     */
    public record CreateRequest(
            @NotBlank @Size(max = 64) String name,
            @NotBlank @Size(max = 8) String abbreviation,
            @NotBlank @Size(max = 16) String conference,
            @NotBlank @Size(max = 16) String division
    ) {}
}
