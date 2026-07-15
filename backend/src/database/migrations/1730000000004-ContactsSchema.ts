import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactsSchema1730000000004 implements MigrationInterface {
  name = 'ContactsSchema1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contacts CASCADE`);
    await queryRunner.query(`
      CREATE TYPE pii_classification AS ENUM ('public', 'internal', 'confidential', 'restricted')
    `);
    await queryRunner.query(`
      CREATE TABLE contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        title VARCHAR(255),
        linkedin_url VARCHAR(512),
        pii_classification pii_classification NOT NULL DEFAULT 'confidential',
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        created_by_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_contacts_company_id ON contacts(company_id)`);
    await queryRunner.query(`CREATE INDEX idx_contacts_email ON contacts(email)`);
    await queryRunner.query(`CREATE INDEX idx_contacts_pii_classification ON contacts(pii_classification)`);
    await queryRunner.query(`CREATE INDEX idx_contacts_name ON contacts(first_name, last_name)`);
    await queryRunner.query(`ALTER TABLE contacts ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contacts`);
    await queryRunner.query(`DROP TYPE IF EXISTS pii_classification`);
  }
}
