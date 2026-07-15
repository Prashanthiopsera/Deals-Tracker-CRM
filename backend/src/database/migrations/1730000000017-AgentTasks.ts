import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgentTasks1730000000017 implements MigrationInterface {
  name = 'AgentTasks1730000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id UUID PRIMARY KEY,
        agent_type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        proposed_changes JSONB NOT NULL DEFAULT '{}',
        acting_user_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMPTZ,
        approved_by VARCHAR(128),
        audit_trail_id UUID NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS agent_tasks;');
  }
}
