-- Deploy nbatopshot:create_moments to pg

BEGIN;

CREATE TABLE moments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  set TEXT NOT NULL,
  tier TEXT NOT NULL,
  series TEXT NOT NULL,
  play TEXT NOT NULL,
  date DATE NOT NULL,
  team TEXT NOT NULL,
  circulation INT NOT NULL,
  top_shot_debut BOOLEAN,
  rookie_premiere BOOLEAN,
  rookie_mint BOOLEAN,
  rookie_year BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

COMMIT;
