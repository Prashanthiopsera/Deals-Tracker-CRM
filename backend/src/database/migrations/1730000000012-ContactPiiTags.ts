import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactPiiTags1730000000012 implements MigrationInterface {
  name = 'ContactPiiTags1730000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS pii_tags JSONB NOT NULL DEFAULT '{}'::jsonb
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN contacts.pii_tags IS
      'Runtime PII field tags keyed by column name with classification tier metadata'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN contacts.first_name IS 'data_classification: confidential';
      COMMENT ON COLUMN contacts.last_name IS 'data_classification: confidential';
      COMMENT ON COLUMN contacts.email IS 'data_classification: confidential';
      COMMENT ON COLUMN contacts.phone IS 'data_classification: confidential';
      COMMENT ON COLUMN companies.notes IS 'data_classification: confidential';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS pii_tags`);
  }
}
