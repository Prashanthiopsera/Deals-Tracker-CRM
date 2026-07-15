import { MigrationInterface, QueryRunner } from 'typeorm';

export class FullTextSearchIndexes1730000000013 implements MigrationInterface {
  name = 'FullTextSearchIndexes1730000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(sector, '') || ' ' || coalesce(notes, ''))
      ) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON companies USING GIN (search_vector)
    `);
    await queryRunner.query(`
      ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, ''))
      ) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_search_vector ON contacts USING GIN (search_vector)
    `);
    await queryRunner.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))
      ) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_search_vector ON documents USING GIN (search_vector)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_search_vector`);
    await queryRunner.query(`ALTER TABLE documents DROP COLUMN IF EXISTS search_vector`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contacts_search_vector`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS search_vector`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_search_vector`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS search_vector`);
  }
}
