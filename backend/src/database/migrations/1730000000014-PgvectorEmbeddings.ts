import { MigrationInterface, QueryRunner } from 'typeorm';

export class PgvectorEmbeddings1730000000014 implements MigrationInterface {
  name = 'PgvectorEmbeddings1730000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS embedding vector(1536)
    `);
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS embedding vector(1536)
    `);
    await queryRunner.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(1536)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_embedding_hnsw
      ON companies USING hnsw (embedding vector_cosine_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_embedding_hnsw
      ON contacts USING hnsw (embedding vector_cosine_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw
      ON documents USING hnsw (embedding vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_embedding_hnsw`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contacts_embedding_hnsw`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_embedding_hnsw`);
    await queryRunner.query(`ALTER TABLE documents DROP COLUMN IF EXISTS embedding`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS embedding`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS embedding`);
  }
}
