import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogActorRole1730000000008 implements MigrationInterface {
  name = 'AuditLogActorRole1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50) NOT NULL DEFAULT 'system'
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'stage_transition';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ownership_reassignment';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON audit_logs(actor_role)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_actor_role`);
    await queryRunner.query(`ALTER TABLE audit_logs DROP COLUMN IF EXISTS actor_role`);
  }
}
