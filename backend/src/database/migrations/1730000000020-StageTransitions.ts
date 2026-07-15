import { MigrationInterface, QueryRunner } from 'typeorm';

export class StageTransitions1730000000020 implements MigrationInterface {
  name = 'StageTransitions1730000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stage_transitions (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        from_stage VARCHAR(64),
        to_stage VARCHAR(64) NOT NULL,
        transitioned_by VARCHAR(128) NOT NULL,
        transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_stage_transitions_company_time
        ON stage_transitions (company_id, transitioned_at);
      CREATE INDEX IF NOT EXISTS idx_stage_transitions_to_stage_time
        ON stage_transitions (to_stage, transitioned_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS stage_transitions;');
  }
}
