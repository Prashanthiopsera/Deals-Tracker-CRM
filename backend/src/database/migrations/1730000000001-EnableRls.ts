import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRls1730000000001 implements MigrationInterface {
  name = 'EnableRls1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE companies ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY companies_default_deny ON companies
      FOR ALL
      USING (
        current_setting('app.current_user_role', true) IS NOT NULL
        AND current_setting('app.current_user_id', true) IS NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE POLICY companies_director_all ON companies
      FOR ALL
      USING (current_setting('app.current_user_role', true) = 'Director')
      WITH CHECK (current_setting('app.current_user_role', true) = 'Director')
    `);

    await queryRunner.query(`
      CREATE POLICY companies_admin_all ON companies
      FOR ALL
      USING (current_setting('app.current_user_role', true) = 'Admin')
      WITH CHECK (current_setting('app.current_user_role', true) = 'Admin')
    `);

    await queryRunner.query(`
      CREATE POLICY companies_principal_no_delete ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Principal')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_principal_insert ON companies
      FOR INSERT
      WITH CHECK (current_setting('app.current_user_role', true) = 'Principal')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_principal_update ON companies
      FOR UPDATE
      USING (current_setting('app.current_user_role', true) = 'Principal')
      WITH CHECK (current_setting('app.current_user_role', true) = 'Principal')
    `);

    await queryRunner.query(`
      CREATE POLICY companies_associate_read ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Associate')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_associate_write ON companies
      FOR INSERT WITH CHECK (current_setting('app.current_user_role', true) = 'Associate')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_associate_update ON companies
      FOR UPDATE
      USING (current_setting('app.current_user_role', true) = 'Associate')
      WITH CHECK (current_setting('app.current_user_role', true) = 'Associate')
    `);

    await queryRunner.query(`
      CREATE POLICY companies_intern_read ON companies
      FOR SELECT USING (current_setting('app.current_user_role', true) = 'Intern')
    `);
    await queryRunner.query(`
      CREATE POLICY companies_intern_update ON companies
      FOR UPDATE
      USING (current_setting('app.current_user_role', true) = 'Intern')
      WITH CHECK (current_setting('app.current_user_role', true) = 'Intern')
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_intern_ownership_updates()
      RETURNS trigger AS $$
      BEGIN
        IF current_setting('app.current_user_role', true) = 'Intern' THEN
          IF NEW.p7vc_deal_lead IS DISTINCT FROM OLD.p7vc_deal_lead
             OR NEW.deal_lead_support_1 IS DISTINCT FROM OLD.deal_lead_support_1
             OR NEW.deal_lead_support_2 IS DISTINCT FROM OLD.deal_lead_support_2 THEN
            RAISE EXCEPTION 'Intern role cannot update ownership fields';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER companies_intern_ownership_guard
      BEFORE UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION block_intern_ownership_updates()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS companies_intern_ownership_guard ON companies`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS block_intern_ownership_updates()`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_intern_update ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_intern_read ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_associate_update ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_associate_write ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_associate_read ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_principal_update ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_principal_insert ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_principal_no_delete ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_admin_all ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_director_all ON companies`);
    await queryRunner.query(`DROP POLICY IF EXISTS companies_default_deny ON companies`);
    await queryRunner.query(`ALTER TABLE companies DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);
  }
}
