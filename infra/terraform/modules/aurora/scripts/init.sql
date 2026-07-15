-- Aurora PostgreSQL initialization seed script (WO-003).
-- Run after cluster provisioning via psql or a migration WO:
--   psql "$WRITER_ENDPOINT" -U p7vc_admin -d p7vc_crm -f init.sql
--
-- Creates pgvector extension and a test table to verify RLS capability.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Minimal RLS verification table — full schema migrations are in WO-030/WO-038.
CREATE TABLE IF NOT EXISTS rls_verification (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_role TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rls_verification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_verification_role_isolation ON rls_verification;

CREATE POLICY rls_verification_role_isolation ON rls_verification
  FOR ALL
  USING (owner_role = current_setting('app.current_role', true))
  WITH CHECK (owner_role = current_setting('app.current_role', true));

-- Verify pgvector is operational with a smoke-test column type.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension is not available';
  END IF;
END $$;
