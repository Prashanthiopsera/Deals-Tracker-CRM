import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1730000000000 implements MigrationInterface {
  name = 'Baseline1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM (
        'Director', 'Principal', 'Associate', 'Intern', 'Admin'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE deal_stage AS ENUM (
        'Sourcing', 'Initial Screen', 'Deep Diligence', 'IC Review',
        'Term Sheet', 'Closed Won', 'Closed Lost', 'Passed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE company_status AS ENUM (
        'Active', 'Inactive', 'Archived', 'Portfolio'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        team_id UUID,
        auth0_subject VARCHAR(255) UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        website VARCHAR(512),
        sector VARCHAR(128),
        stage VARCHAR(128),
        geography VARCHAR(128),
        key_contacts JSONB NOT NULL DEFAULT '[]',
        lead_source VARCHAR(255),
        p7vc_deal_lead UUID,
        deal_lead_support_1 UUID,
        deal_lead_support_2 UUID,
        deal_stage deal_stage NOT NULL DEFAULT 'Sourcing',
        check_size_usd NUMERIC(18,2),
        valuation_usd NUMERIC(18,2),
        status company_status NOT NULL DEFAULT 'Active',
        first_contact_date DATE,
        last_activity_date DATE,
        notes TEXT,
        source_documents JSONB NOT NULL DEFAULT '[]',
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id UUID,
        action VARCHAR(128) NOT NULL,
        resource_type VARCHAR(128) NOT NULL,
        resource_id UUID,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT ON audit_logs TO PUBLIC
    `);

    await queryRunner.query(`
      CREATE TABLE system_config (
        key VARCHAR(128) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE deal_pipeline_stages (
        id SERIAL PRIMARY KEY,
        name deal_stage NOT NULL UNIQUE,
        sort_order INT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS deal_pipeline_stages`);
    await queryRunner.query(`DROP TABLE IF EXISTS system_config`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS companies`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS company_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS deal_stage`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
