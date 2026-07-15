import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivitiesSchema1730000000005 implements MigrationInterface {
  name = 'ActivitiesSchema1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS activities CASCADE`);
    await queryRunner.query(`
      CREATE TYPE activity_type AS ENUM ('email', 'meeting', 'calendar_event', 'note', 'call')
    `);
    await queryRunner.query(`
      CREATE TABLE activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type activity_type NOT NULL,
        subject VARCHAR(500),
        body TEXT,
        occurred_at TIMESTAMPTZ NOT NULL,
        source VARCHAR(50) NOT NULL,
        external_id VARCHAR(255),
        metadata JSONB NOT NULL DEFAULT '{}',
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_activities_source_external_id
      ON activities(source, external_id)
      WHERE external_id IS NOT NULL
    `);
    await queryRunner.query(`CREATE INDEX idx_activities_company_id ON activities(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_activities_user_id ON activities(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_activities_occurred_at ON activities(occurred_at)`);
    await queryRunner.query(`CREATE INDEX idx_activities_source ON activities(source)`);
    await queryRunner.query(`CREATE INDEX idx_activities_company_timeline ON activities(company_id, occurred_at DESC)`);
    await queryRunner.query(`ALTER TABLE activities ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS activities`);
    await queryRunner.query(`DROP TYPE IF EXISTS activity_type`);
  }
}
