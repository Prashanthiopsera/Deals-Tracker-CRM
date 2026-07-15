import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiAuditLogs1730000000016 implements MigrationInterface {
  name = 'AiAuditLogs1730000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_role VARCHAR(64) NOT NULL,
        interaction_type VARCHAR(32) NOT NULL,
        prompt_text TEXT NOT NULL,
        response_text TEXT,
        retrieved_chunk_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        retrieved_company_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        model_id VARCHAR(128),
        input_tokens INTEGER,
        output_tokens INTEGER,
        latency_ms INTEGER,
        pii_redactions_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY ai_audit_logs_insert ON ai_audit_logs
      FOR INSERT
      WITH CHECK (app_is_authenticated())
    `);
    await queryRunner.query(`
      CREATE POLICY ai_audit_logs_read ON ai_audit_logs
      FOR SELECT
      USING (app_is_authenticated())
    `);
    await queryRunner.query(`
      REVOKE UPDATE, DELETE ON ai_audit_logs FROM PUBLIC
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS ai_audit_logs_read ON ai_audit_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS ai_audit_logs_insert ON ai_audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_audit_logs`);
  }
}
