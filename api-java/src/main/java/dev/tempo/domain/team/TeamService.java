package dev.tempo.domain.team;

import dev.tempo.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer = business logic.
 *
 * The controller's job is HTTP. The repository's job is SQL. The service is where
 * everything else lives: validation that crosses entities, coordination across
 * repositories, business rules, transactions.
 *
 * Why constructor injection (via Lombok's @RequiredArgsConstructor):
 *   - Dependencies are explicit and final
 *   - Class can be instantiated in tests without Spring
 *   - Field injection (@Autowired on fields) is discouraged by Spring's own team
 *
 * Why @Transactional(readOnly = true) at class level:
 *   - Sets the default for every method
 *   - Read-only transactions enable optimizations (no dirty-checking, hint to use replicas)
 *   - Methods that need to write override with @Transactional (defaults to readOnly=false)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;

    public List<TeamDto.Response> listAll() {
        return teamRepository.findAllByOrderByNameAsc().stream()
                .map(TeamDto.Response::from)
                .toList();
    }

    public TeamDto.Response getById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "team_not_found",
                        "Team with id " + id + " not found"
                ));
        return TeamDto.Response.from(team);
    }

    public TeamDto.Response getByAbbreviation(String abbreviation) {
        Team team = teamRepository.findByAbbreviation(abbreviation)
                .orElseThrow(() -> new NotFoundException(
                        "team_not_found",
                        "Team with abbreviation " + abbreviation + " not found"
                ));
        return TeamDto.Response.from(team);
    }

    /**
     * Write operation - overrides class-level readOnly.
     *
     * @Transactional gotchas worth knowing:
     *   1. Doesn't work on private methods (proxy can't intercept)
     *   2. Self-invocation (this.someMethod()) bypasses the proxy - no transaction
     *   3. Default rollback only for unchecked exceptions; for checked, use
     *      rollbackFor = SomeCheckedException.class
     */
    @Transactional
    public TeamDto.Response create(TeamDto.CreateRequest request) {
        Team entity = Team.builder()
                .name(request.name())
                .abbreviation(request.abbreviation())
                .conference(request.conference())
                .division(request.division())
                .build();
        Team saved = teamRepository.save(entity);
        return TeamDto.Response.from(saved);
    }
}
