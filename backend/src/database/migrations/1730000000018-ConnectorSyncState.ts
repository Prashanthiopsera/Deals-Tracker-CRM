import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConnectorSyncState1730000000018 implements MigrationInterface {
  name = 'ConnectorSyncState1730000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS connector_sync_state (
        user_id VARCHAR(128) NOT NULL,
        connector_type VARCHAR(64) NOT NULL,
        history_id VARCHAR(128),
        sync_token TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, connector_type)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS connector_sync_state;');
  }
}
