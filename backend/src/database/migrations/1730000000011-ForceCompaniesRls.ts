import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForceCompaniesRls1730000000011 implements MigrationInterface {
  name = 'ForceCompaniesRls1730000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE companies FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE companies NO FORCE ROW LEVEL SECURITY`);
  }
}
