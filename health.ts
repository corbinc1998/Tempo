package dev.tempo.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository = data access layer.
 *
 * Spring Data JPA generates the implementation at runtime. You declare the interface;
 * Spring writes the SQL.
 *
 * Three ways to define queries:
 *
 * 1. Inherited from JpaRepository: findAll, findById, save, deleteById, count, etc.
 *
 * 2. Derived from method name: findByAbbreviation parses the name and builds a query.
 *    Naming follows strict rules - see Spring Data reference for the full grammar.
 *    Risk: a typo silently becomes a wrong query. Mitigation: integration tests.
 *
 * 3. @Query annotation: write JPQL (object-oriented) or native SQL when derivation
 *    isn't enough. nativeQuery=true uses raw SQL; without it, you reference entity
 *    names (Team) and field names (t.abbreviation), not table names.
 *
 * Why @Repository over plain @Component:
 *   @Repository activates Spring's exception translation - JDBC SQLExceptions get
 *   converted to Spring's DataAccessException hierarchy, which is consistent across
 *   ORM providers.
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /** Derived query - JPA generates: SELECT * FROM team WHERE abbreviation = ? */
    Optional<Team> findByAbbreviation(String abbreviation);

    /** Derived query with ordering. */
    List<Team> findAllByOrderByNameAsc();

    /**
     * Custom JPQL query. Lets you do things derived queries can't, like joins,
     * subqueries, or projections.
     *
     * Note: 't.conference' references the Java field, not the column name.
     */
    @Query("SELECT t FROM Team t WHERE t.conference = :conference ORDER BY t.division, t.name")
    List<Team> findInConference(String conference);

    /**
     * Native SQL example - use when JPQL can't express what you need (window functions,
     * specific Postgres features, performance-critical paths where you want to control
     * the exact SQL).
     */
    @Query(value = """
            SELECT t.* FROM team t
            WHERE EXISTS (SELECT 1 FROM game g
                          WHERE g.home_team_id = t.id OR g.away_team_id = t.id)
            ORDER BY t.name
            """, nativeQuery = true)
    List<Team> findTeamsWithGames();
}
