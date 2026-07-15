import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandCompaniesSchema1730000000003 implements MigrationInterface {
  name = 'ExpandCompaniesSchema1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE company_stage AS ENUM (
        'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE deal_stage_v2 AS ENUM (
        'sourced', 'screening', 'diligence', 'partner_ic_review', 'term_sheet',
        'closed_won', 'closed_lost', 'closed_passed'
      )
    `);

    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN p7vc_deal_lead TO deal_lead_id`);
    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN deal_lead_support_1 TO support_1_id`);
    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN deal_lead_support_2 TO support_2_id`);
    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN check_size_usd TO check_size`);
    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN valuation_usd TO valuation`);

    await queryRunner.query(`ALTER TABLE companies ADD COLUMN company_stage company_stage`);
    await queryRunner.query(`ALTER TABLE companies ADD COLUMN created_by_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE companies ADD COLUMN key_dates JSONB NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMPTZ`);

    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN deal_stage_new deal_stage_v2 NOT NULL DEFAULT 'sourced'
    `);
    await queryRunner.query(`
      UPDATE companies SET deal_stage_new = CASE deal_stage::text
        WHEN 'Sourcing' THEN 'sourced'::deal_stage_v2
        WHEN 'Initial Screen' THEN 'screening'::deal_stage_v2
        WHEN 'Deep Diligence' THEN 'diligence'::deal_stage_v2
        WHEN 'IC Review' THEN 'partner_ic_review'::deal_stage_v2
        WHEN 'Term Sheet' THEN 'term_sheet'::deal_stage_v2
        WHEN 'Closed Won' THEN 'closed_won'::deal_stage_v2
        WHEN 'Closed Lost' THEN 'closed_lost'::deal_stage_v2
        WHEN 'Passed' THEN 'closed_passed'::deal_stage_v2
        ELSE 'sourced'::deal_stage_v2
      END
    `);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN deal_stage`);
    await queryRunner.query(`ALTER TABLE companies RENAME COLUMN deal_stage_new TO deal_stage`);
    await queryRunner.query(`DROP TYPE deal_stage`);
    await queryRunner.query(`ALTER TYPE deal_stage_v2 RENAME TO deal_stage`);

    await queryRunner.query(`
      ALTER TABLE companies
      ADD CONSTRAINT fk_companies_deal_lead FOREIGN KEY (deal_lead_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE companies
      ADD CONSTRAINT fk_companies_support_1 FOREIGN KEY (support_1_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE companies
      ADD CONSTRAINT fk_companies_support_2 FOREIGN KEY (support_2_id) REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`CREATE INDEX idx_companies_deal_stage ON companies(deal_stage)`);
    await queryRunner.query(`CREATE INDEX idx_companies_status ON companies(status)`);
    await queryRunner.query(`CREATE INDEX idx_companies_deal_lead_id ON companies(deal_lead_id)`);
    await queryRunner.query(`CREATE INDEX idx_companies_support_1_id ON companies(support_1_id)`);
    await queryRunner.query(`CREATE INDEX idx_companies_support_2_id ON companies(support_2_id)`);
    await queryRunner.query(`CREATE INDEX idx_companies_created_by_id ON companies(created_by_id)`);
    await queryRunner.query(`CREATE INDEX idx_companies_sector ON companies(sector)`);
    await queryRunner.query(`CREATE INDEX idx_companies_geography ON companies(geography)`);
    await queryRunner.query(`CREATE INDEX idx_companies_deal_stage_status ON companies(deal_stage, status)`);
    await queryRunner.query(`CREATE INDEX idx_companies_tags_gin ON companies USING GIN (tags)`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_unauthorized_ownership_updates()
      RETURNS trigger AS $$
      BEGIN
        IF current_setting('app.current_user_role', true) = 'Intern' THEN
          IF NEW.deal_lead_id IS DISTINCT FROM OLD.deal_lead_id
             OR NEW.support_1_id IS DISTINCT FROM OLD.support_1_id
             OR NEW.support_2_id IS DISTINCT FROM OLD.support_2_id THEN
            RAISE EXCEPTION 'Intern role cannot update ownership fields';
          END IF;
        ELSIF NOT app_can_update_ownership() THEN
          IF NEW.deal_lead_id IS DISTINCT FROM OLD.deal_lead_id
             OR NEW.support_1_id IS DISTINCT FROM OLD.support_1_id
             OR NEW.support_2_id IS DISTINCT FROM OLD.support_2_id THEN
            RAISE EXCEPTION 'Role cannot update ownership fields';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW companies_intern_masked AS
      SELECT
        id, name, website, sector, company_stage, geography, lead_source,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE deal_lead_id END AS deal_lead_id,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE support_1_id END AS support_1_id,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE support_2_id END AS support_2_id,
        deal_stage, check_size, valuation, status, key_dates, notes, tags, created_at, updated_at, deleted_at
      FROM companies
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS companies_intern_masked`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_tags_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_deal_stage_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_geography`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_sector`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_created_by_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_support_2_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_support_1_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_deal_lead_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_deal_stage`);
    await queryRunner.query(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_support_2`);
    await queryRunner.query(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_support_1`);
    await queryRunner.query(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_deal_lead`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS deleted_at`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS key_dates`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS created_by_id`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS company_stage`);
    await queryRunner.query(`DROP TYPE IF EXISTS company_stage`);
  }
}
