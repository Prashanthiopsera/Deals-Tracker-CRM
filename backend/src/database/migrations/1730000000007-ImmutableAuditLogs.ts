import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImmutableAuditLogs1730000000007 implements MigrationInterface {
  name = 'ImmutableAuditLogs1730000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);

    await queryRunner.query(`
      CREATE TYPE audit_action AS ENUM (
        'create', 'update', 'delete', 'reassign', 'ai_retrieval', 'ai_response',
        'login', 'logout', 'permission_denied'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        actor_id UUID NOT NULL,
        action audit_action NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        before_state JSONB,
        after_state JSONB,
        changed_fields TEXT[],
        ip_address INET,
        user_agent VARCHAR(500),
        metadata JSONB NOT NULL DEFAULT '{}',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id, timestamp)
      ) PARTITION BY RANGE (timestamp)
    `);

    const partitions = [
      ['2026_01', '2026-01-01', '2026-02-01'],
      ['2026_02', '2026-02-01', '2026-03-01'],
      ['2026_03', '2026-03-01', '2026-04-01'],
      ['2026_04', '2026-04-01', '2026-05-01'],
      ['2026_05', '2026-05-01', '2026-06-01'],
      ['2026_06', '2026-06-01', '2026-07-01'],
      ['2026_07', '2026-07-01', '2026-08-01'],
      ['2026_08', '2026-08-01', '2026-09-01'],
      ['2026_09', '2026-09-01', '2026-10-01'],
      ['2026_10', '2026-10-01', '2026-11-01'],
      ['2026_11', '2026-11-01', '2026-12-01'],
      ['2026_12', '2026-12-01', '2027-01-01'],
    ];

    for (const [suffix, from, to] of partitions) {
      await queryRunner.query(`
        CREATE TABLE audit_logs_${suffix} PARTITION OF audit_logs
        FOR VALUES FROM ('${from}') TO ('${to}')
      `);
    }

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Audit log records are immutable and cannot be modified or deleted';
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER audit_logs_immutable_update
      BEFORE UPDATE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification()
    `);
    await queryRunner.query(`
      CREATE TRIGGER audit_logs_immutable_delete
      BEFORE DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification()
    `);

    await queryRunner.query(`REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC`);
    await queryRunner.query(`GRANT SELECT, INSERT ON audit_logs TO PUBLIC`);

    await queryRunner.query(`CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_action ON audit_logs(action)`);
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_entity_history
      ON audit_logs(entity_type, entity_id, timestamp DESC)
    `);

    await queryRunner.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY audit_logs_read ON audit_logs
      FOR SELECT USING (true)
    `);
    await queryRunner.query(`
      CREATE POLICY audit_logs_insert ON audit_logs
      FOR INSERT WITH CHECK (true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_audit_modification()`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action`);
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id UUID,
        action VARCHAR(128) NOT NULL,
        resource_type VARCHAR(128) NOT NULL,
        resource_id UUID,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }
}
