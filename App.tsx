-- V2__seed_teams.sql
-- Reference data: the 32 NFL teams.
-- Idempotent via ON CONFLICT DO NOTHING - safe to re-apply during dev.

INSERT INTO team (name, abbreviation, conference, division) VALUES
    ('Arizona Cardinals',    'ARI', 'NFC', 'West'),
    ('Atlanta Falcons',      'ATL', 'NFC', 'South'),
    ('Baltimore Ravens',     'BAL', 'AFC', 'North'),
    ('Buffalo Bills',        'BUF', 'AFC', 'East'),
    ('Carolina Panthers',    'CAR', 'NFC', 'South'),
    ('Chicago Bears',        'CHI', 'NFC', 'North'),
    ('Cincinnati Bengals',   'CIN', 'AFC', 'North'),
    ('Cleveland Browns',     'CLE', 'AFC', 'North'),
    ('Dallas Cowboys',       'DAL', 'NFC', 'East'),
    ('Denver Broncos',       'DEN', 'AFC', 'West'),
    ('Detroit Lions',        'DET', 'NFC', 'North'),
    ('Green Bay Packers',    'GB',  'NFC', 'North'),
    ('Houston Texans',       'HOU', 'AFC', 'South'),
    ('Indianapolis Colts',   'IND', 'AFC', 'South'),
    ('Jacksonville Jaguars', 'JAX', 'AFC', 'South'),
    ('Kansas City Chiefs',   'KC',  'AFC', 'West'),
    ('Las Vegas Raiders',    'LV',  'AFC', 'West'),
    ('Los Angeles Chargers', 'LAC', 'AFC', 'West'),
    ('Los Angeles Rams',     'LAR', 'NFC', 'West'),
    ('Miami Dolphins',       'MIA', 'AFC', 'East'),
    ('Minnesota Vikings',    'MIN', 'NFC', 'North'),
    ('New England Patriots', 'NE',  'AFC', 'East'),
    ('New Orleans Saints',   'NO',  'NFC', 'South'),
    ('New York Giants',      'NYG', 'NFC', 'East'),
    ('New York Jets',        'NYJ', 'AFC', 'East'),
    ('Philadelphia Eagles',  'PHI', 'NFC', 'East'),
    ('Pittsburgh Steelers',  'PIT', 'AFC', 'North'),
    ('San Francisco 49ers',  'SF',  'NFC', 'West'),
    ('Seattle Seahawks',     'SEA', 'NFC', 'West'),
    ('Tampa Bay Buccaneers', 'TB',  'NFC', 'South'),
    ('Tennessee Titans',     'TEN', 'AFC', 'South'),
    ('Washington Commanders','WAS', 'NFC', 'East')
ON CONFLICT (abbreviation) DO NOTHING;
