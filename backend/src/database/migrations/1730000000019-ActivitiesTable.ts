import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivitiesTable1730000000019 implements MigrationInterface {
  name = 'ActivitiesTable1730000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        activity_type VARCHAR(32) NOT NULL,
        source VARCHAR(32) NOT NULL,
        subject TEXT,
        body_preview VARCHAR(500),
        participants JSONB NOT NULL DEFAULT '[]',
        occurred_at TIMESTAMPTZ NOT NULL,
        raw_payload_s3_key TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        external_id VARCHAR(256),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (source, external_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS activities;');
  }
}
