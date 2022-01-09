-- Revert nbatopshot:create_moments from pg

BEGIN;

DROP TABLE moments;

COMMIT;
