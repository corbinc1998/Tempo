-- V1__init.sql
-- Initial schema for Tempo.
--
-- Conventions:
--   - Singular table names (team not teams). Both work; pick one and stick to it.
--   - Snake case columns. JPA's default naming strategy maps homeTeamId <-> home_team_id.
--   - BIGSERIAL for surrogate keys. UUID for cross-system references (user IDs from JWTs).
--   - Foreign keys always declared, with explicit ON DELETE behavior.
--   - Indexes for columns that show up in WHERE clauses, foreign keys, and ORDER BY.
--
-- Migration rules:
--   - NEVER modify this file after it ships. Add V2__... for changes.
--   - Each migration is wrapped in an implicit transaction. If it fails, nothing is applied.

CREATE TABLE team (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(64)  NOT NULL UNIQUE,
    abbreviation  VARCHAR(8)   NOT NULL UNIQUE,
    conference    VARCHAR(16)  NOT NULL,
    division      VARCHAR(16)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE season (
    id            BIGSERIAL PRIMARY KEY,
    season_number INTEGER      NOT NULL UNIQUE,  -- 8, 9, 10, ...
    started_at    DATE         NOT NULL,
    ended_at      DATE,                          -- NULL while season is in progress
    status        VARCHAR(16)  NOT NULL,         -- PLANNED | IN_PROGRESS | COMPLETED
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE game (
    id               BIGSERIAL PRIMARY KEY,
    season_id        BIGINT       NOT NULL REFERENCES season(id) ON DELETE RESTRICT,
    week             INTEGER      NOT NULL,
    home_team_id     BIGINT       NOT NULL REFERENCES team(id),
    away_team_id     BIGINT       NOT NULL REFERENCES team(id),
    actual_home_pts  INTEGER,                                       -- NULL until played
    actual_away_pts  INTEGER,
    played_at        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT game_teams_differ CHECK (home_team_id <> away_team_id)
);

-- Common access patterns: list a season's games, list a week's games, find by team.
CREATE INDEX idx_game_season_week ON game(season_id, week);
CREATE INDEX idx_game_home_team ON game(home_team_id);
CREATE INDEX idx_game_away_team ON game(away_team_id);

CREATE TABLE prediction (
    id                BIGSERIAL PRIMARY KEY,
    game_id           BIGINT         NOT NULL UNIQUE REFERENCES game(id) ON DELETE CASCADE,
    home_win_prob     NUMERIC(5,4)   NOT NULL,  -- 0.0000 to 1.0000
    predicted_home    NUMERIC(5,2)   NOT NULL,  -- e.g. 24.50
    predicted_away    NUMERIC(5,2)   NOT NULL,
    home_elo_pre      NUMERIC(7,2)   NOT NULL,
    away_elo_pre      NUMERIC(7,2)   NOT NULL,
    model_version     VARCHAR(32)    NOT NULL,
    generated_at      TIMESTAMPTZ    NOT NULL,
    ingested_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT prob_range CHECK (home_win_prob BETWEEN 0 AND 1)
);

CREATE TABLE elo_rating (
    id            BIGSERIAL PRIMARY KEY,
    team_id       BIGINT         NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    season_id     BIGINT         NOT NULL REFERENCES season(id) ON DELETE CASCADE,
    week          INTEGER        NOT NULL,
    rating        NUMERIC(7,2)   NOT NULL,
    captured_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, season_id, week)
);

CREATE INDEX idx_elo_team_season ON elo_rating(team_id, season_id, week);

-- updated_at trigger helpers.
-- Postgres doesn't auto-update timestamps. JPA's @UpdateTimestamp handles this
-- at the app layer, but a DB trigger is belt-and-suspenders for direct SQL updates.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_updated_at BEFORE UPDATE ON team
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER game_updated_at BEFORE UPDATE ON game
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
