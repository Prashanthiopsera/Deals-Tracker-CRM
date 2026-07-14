import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentsSchema1730000000009 implements MigrationInterface {
  name = 'CommentsSchema1730000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        body TEXT NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        record_id UUID NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id),
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        mentions TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        CONSTRAINT comments_record_type_check CHECK (
          record_type IN ('company', 'contact', 'activity', 'document')
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_comments_record ON comments(record_type, record_id)
    `);
    await queryRunner.query(`CREATE INDEX idx_comments_user_id ON comments(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id)`);
    await queryRunner.query(`CREATE INDEX idx_comments_created_at ON comments(created_at)`);
    await queryRunner.query(`ALTER TABLE comments ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
  }
}
