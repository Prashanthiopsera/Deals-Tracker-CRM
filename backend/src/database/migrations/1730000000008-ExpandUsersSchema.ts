import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandUsersSchema1730000000008 implements MigrationInterface {
  name = 'ExpandUsersSchema1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE user_status AS ENUM ('active', 'deactivated')
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS auth0_sub VARCHAR(255),
      ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active'
    `);

    await queryRunner.query(`
      UPDATE users
      SET display_name = COALESCE(display_name, full_name),
          auth0_sub = COALESCE(auth0_sub, auth0_subject, 'auth0|' || id::text)
      WHERE display_name IS NULL OR auth0_sub IS NULL
    `);

    await queryRunner.query(`ALTER TABLE users ALTER COLUMN display_name SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN auth0_sub SET NOT NULL`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth0_sub ON users(auth0_sub)
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS status`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS display_name`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
  }
}
