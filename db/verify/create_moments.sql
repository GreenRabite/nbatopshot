-- Verify nbatopshot:create_moments on pg

BEGIN;

SELECT id, name, set, tier, series, play, date, team, circulation, top_shot_debut, rookie_premiere, rookie_mint, rookie_year, created_at, updated_at
  FROM moments
  WHERE FALSE;

ROLLBACK;
