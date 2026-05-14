package dev.tempo.domain.team;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * REST controller for the Team resource.
 *
 * Conventions:
 *   - URLs versioned under /api/v1/ so we can introduce /api/v2/ without breaking clients
 *   - Plural nouns for collections (/teams)
 *   - Status codes: 200 for success on GET, 201 for created on POST with Location header
 *   - Each method has @Operation for OpenAPI docs
 *
 * Why @RestController (not @Controller + @ResponseBody on every method):
 *   @RestController = @Controller + implied @ResponseBody for every method.
 *   Every method's return value gets serialized to JSON automatically.
 *
 * Why constructor injection here too:
 *   Same reasons as in the service. @RequiredArgsConstructor generates the
 *   constructor for the final fields.
 */
@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team reference data")
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @Operation(summary = "List all teams", description = "Returns all teams ordered by name.")
    public List<TeamDto.Response> listAll() {
        return teamService.listAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a team by id")
    public TeamDto.Response getById(@PathVariable Long id) {
        return teamService.getById(id);
    }

    @GetMapping("/by-abbreviation/{abbreviation}")
    @Operation(summary = "Get a team by abbreviation",
               description = "e.g. /by-abbreviation/KC for the Kansas City Chiefs.")
    public TeamDto.Response getByAbbreviation(@PathVariable String abbreviation) {
        return teamService.getByAbbreviation(abbreviation.toUpperCase());
    }

    /**
     * Create a team.
     *
     * @Valid triggers Bean Validation on the request body. Failures throw
     * MethodArgumentNotValidException, which GlobalExceptionHandler turns into a
     * structured 400 response.
     *
     * Returns 201 Created with a Location header pointing to the new resource.
     * That's the textbook REST shape; not everyone follows it, but you should.
     */
    @PostMapping
    @Operation(summary = "Create a team")
    public ResponseEntity<TeamDto.Response> create(@Valid @RequestBody TeamDto.CreateRequest request) {
        TeamDto.Response created = teamService.create(request);
        URI location = URI.create("/api/v1/teams/" + created.id());
        return ResponseEntity.created(location).body(created);
    }
}
