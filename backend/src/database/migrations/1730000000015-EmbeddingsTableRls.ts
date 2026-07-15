import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmbeddingsTableRls1730000000015 implements MigrationInterface {
  name = 'EmbeddingsTableRls1730000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        chunk_text TEXT NOT NULL,
        embedding vector(1536) NOT NULL,
        chunk_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id
      ON company_embeddings(company_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_company_embeddings_hnsw
      ON company_embeddings USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    await queryRunner.query(`ALTER TABLE company_embeddings ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY company_embeddings_universal_read ON company_embeddings
      FOR SELECT
      USING (
        app_is_authenticated()
        AND EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = company_embeddings.company_id
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY company_embeddings_create_roles ON company_embeddings
      FOR INSERT
      WITH CHECK (app_can_create_company())
    `);
    await queryRunner.query(`
      CREATE POLICY company_embeddings_update_roles ON company_embeddings
      FOR UPDATE
      USING (app_is_authenticated())
      WITH CHECK (app_is_authenticated())
    `);
    await queryRunner.query(`
      CREATE POLICY company_embeddings_director_delete ON company_embeddings
      FOR DELETE
      USING (app_can_delete_company())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS company_embeddings_director_delete ON company_embeddings`);
    await queryRunner.query(`DROP POLICY IF EXISTS company_embeddings_update_roles ON company_embeddings`);
    await queryRunner.query(`DROP POLICY IF EXISTS company_embeddings_create_roles ON company_embeddings`);
    await queryRunner.query(`DROP POLICY IF EXISTS company_embeddings_universal_read ON company_embeddings`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_company_embeddings_hnsw`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_company_embeddings_company_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_embeddings`);
  }
}
