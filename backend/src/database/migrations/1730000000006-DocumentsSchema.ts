import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentsSchema1730000000006 implements MigrationInterface {
  name = 'DocumentsSchema1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS documents CASCADE`);
    await queryRunner.query(`
      CREATE TYPE document_type AS ENUM ('deck', 'memo', 'term_sheet', 'ic_memo', 'financial_model', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        s3_bucket VARCHAR(255) NOT NULL,
        s3_key VARCHAR(1000) NOT NULL UNIQUE,
        kms_key_id VARCHAR(500),
        file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
        document_type document_type NOT NULL DEFAULT 'other',
        ai_summary TEXT,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        uploaded_by_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_documents_company_id ON documents(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_documents_uploaded_by_id ON documents(uploaded_by_id)`);
    await queryRunner.query(`CREATE INDEX idx_documents_document_type ON documents(document_type)`);
    await queryRunner.query(`CREATE INDEX idx_documents_s3_key ON documents(s3_key)`);
    await queryRunner.query(`ALTER TABLE documents ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS documents`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_type`);
  }
}
