import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandCrmRls1730000000002 implements MigrationInterface {
  name = 'ExpandCrmRls1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        title VARCHAR(255),
        phone VARCHAR(64),
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        activity_type VARCHAR(128) NOT NULL,
        subject VARCHAR(512) NOT NULL,
        notes TEXT,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        file_name VARCHAR(512) NOT NULL,
        s3_key VARCHAR(1024) NOT NULL,
        mime_type VARCHAR(128),
        uploaded_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_is_authenticated()
      RETURNS boolean AS $$
      BEGIN
        RETURN current_setting('app.current_user_role', true) IS NOT NULL
          AND current_setting('app.current_user_id', true) IS NOT NULL;
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_can_create_company()
      RETURNS boolean AS $$
      BEGIN
        RETURN current_setting('app.current_user_role', true) IN ('Director', 'Principal', 'Associate', 'Admin');
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_can_delete_company()
      RETURNS boolean AS $$
      BEGIN
        RETURN current_setting('app.current_user_role', true) IN ('Director', 'Admin');
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app_can_update_ownership()
      RETURNS boolean AS $$
      BEGIN
        RETURN current_setting('app.current_user_role', true) IN ('Director', 'Principal', 'Admin');
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_unauthorized_ownership_updates()
      RETURNS trigger AS $$
      BEGIN
        IF current_setting('app.current_user_role', true) = 'Intern' THEN
          IF NEW.p7vc_deal_lead IS DISTINCT FROM OLD.p7vc_deal_lead
             OR NEW.deal_lead_support_1 IS DISTINCT FROM OLD.deal_lead_support_1
             OR NEW.deal_lead_support_2 IS DISTINCT FROM OLD.deal_lead_support_2 THEN
            RAISE EXCEPTION 'Intern role cannot update ownership fields';
          END IF;
        ELSIF NOT app_can_update_ownership() THEN
          IF NEW.p7vc_deal_lead IS DISTINCT FROM OLD.p7vc_deal_lead
             OR NEW.deal_lead_support_1 IS DISTINCT FROM OLD.deal_lead_support_1
             OR NEW.deal_lead_support_2 IS DISTINCT FROM OLD.deal_lead_support_2 THEN
            RAISE EXCEPTION 'Role cannot update ownership fields';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS companies_intern_ownership_guard ON companies
    `);
    await queryRunner.query(`
      CREATE TRIGGER companies_ownership_guard
      BEFORE UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION block_unauthorized_ownership_updates()
    `);

    await queryRunner.query(`DROP POLICY IF EXISTS companies_intern_read ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_associate_read ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_principal_no_delete ON companies`);

    await queryRunner.query(`
      CREATE POLICY companies_universal_read ON companies
      FOR SELECT
      USING (app_is_authenticated())
    `);

    await queryRunner.query(`
      CREATE POLICY companies_create_roles ON companies
      FOR INSERT
      WITH CHECK (app_can_create_company())
    `);

    await queryRunner.query(`
      CREATE POLICY companies_director_delete ON companies
      FOR DELETE
      USING (app_can_delete_company())
    `);

    await queryRunner.query(`
      CREATE VIEW companies_intern_masked AS
      SELECT
        id,
        name,
        website,
        sector,
        stage,
        geography,
        key_contacts,
        lead_source,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE p7vc_deal_lead END AS p7vc_deal_lead,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE deal_lead_support_1 END AS deal_lead_support_1,
        CASE WHEN current_setting('app.current_user_role', true) = 'Intern' THEN NULL ELSE deal_lead_support_2 END AS deal_lead_support_2,
        deal_stage,
        check_size_usd,
        valuation_usd,
        status,
        first_contact_date,
        last_activity_date,
        notes,
        source_documents,
        tags,
        created_at,
        updated_at
      FROM companies
    `);

    for (const table of ['contacts', 'activities', 'documents']) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY ${table}_universal_read ON ${table}
        FOR SELECT
        USING (app_is_authenticated())
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_create_roles ON ${table}
        FOR INSERT
        WITH CHECK (app_can_create_company())
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_director_delete ON ${table}
        FOR DELETE
        USING (app_can_delete_company())
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_update_roles ON ${table}
        FOR UPDATE
        USING (app_is_authenticated())
        WITH CHECK (app_is_authenticated())
      `);
    }

    await queryRunner.query(`
      CREATE POLICY audit_logs_read ON audit_logs
      FOR SELECT
      USING (app_is_authenticated())
    `);
    await queryRunner.query(`
      CREATE POLICY audit_logs_insert ON audit_logs
      FOR INSERT
      WITH CHECK (app_is_authenticated())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_insert ON audit_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_read ON audit_logs`);

    for (const table of ['documents', 'activities', 'contacts']) {
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_update_roles ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_director_delete ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_create_roles ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_universal_read ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${table}`);
    }

    await queryRunner.query(`DROP VIEW IF EXISTS companies_intern_masked`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_director_delete ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_create_roles ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_universal_read ON companies`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS companies_ownership_guard ON companies`);
    await queryRunner.query(`
      CREATE TRIGGER companies_intern_ownership_guard
      BEFORE UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION block_intern_ownership_updates()
    `);

    await queryRunner.query(`
      CREATE POLICY companies_intern_read ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Intern')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_associate_read ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Associate')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_principal_no_delete ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Principal')
    `);

    await queryRunner.query(`DROP FUNCTION IF EXISTS block_unauthorized_ownership_updates()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_can_update_ownership()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_can_delete_company()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_can_create_company()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_is_authenticated()`);
  }
}
