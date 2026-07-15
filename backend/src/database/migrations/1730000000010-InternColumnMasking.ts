import { MigrationInterface, QueryRunner } from 'typeorm';

export class InternColumnMasking1730000000010 implements MigrationInterface {
  name = 'InternColumnMasking1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION mask_company_ownership_for_intern(row companies)
      RETURNS companies AS $$
      BEGIN
        IF current_setting('app.current_user_role', true) = 'Intern' THEN
          row.deal_lead_id := NULL;
          row.support_1_id := NULL;
          row.support_2_id := NULL;
        END IF;
        RETURN row;
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    await queryRunner.query(`
      COMMENT ON VIEW companies_intern_masked IS
      'Column-level ownership masking for Intern sessions (WO-040 defense-in-depth)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS mask_company_ownership_for_intern(companies)`);
  }
}
