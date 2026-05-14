# Domain layout

Each subfolder is one domain slice. The Team slice is the worked reference:

```
team/
  Team.java           <- JPA entity
  TeamRepository.java <- Spring Data interface
  TeamService.java    <- business logic, transactions
  TeamDto.java        <- request and response records
  TeamController.java <- REST endpoints
```

To add a new domain (say, `season`), copy that file structure and adapt. ROADMAP.md has
worked examples of larger features that touch multiple domains.

## What's stubbed

The other domain folders (`season/`, `game/`, `prediction/`, `ingest/`) contain partial
implementations. The point of the scaffold is to show you the patterns, not to do all
the work. Filling these in is part of the project.

Suggested build order:

1. `season` - simplest entity, easy practice run
2. `game` - introduces relationships (home/away team)
3. `prediction` - introduces the link from game and the ingest target
4. `ingest` - wires it all together; the service is the most interesting code

For each one, walk through the Team slice as a template, then write tests as you go.
Don't write the controller until the service and repository are working.
