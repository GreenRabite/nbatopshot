-- Revert nbatopshot:create_owned_moments from pg

BEGIN;

DROP TABLE owned_moments;

COMMIT;
