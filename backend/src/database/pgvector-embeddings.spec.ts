import { readFileSync } from 'fs';
import { join } from 'path';

describe('pgvector embeddings migration (WO-074)', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000014-PgvectorEmbeddings.ts'),
    'utf8',
  );

  it('enables pgvector with HNSW indexes on embedding columns', () => {
    expect(source).toContain('CREATE EXTENSION IF NOT EXISTS vector');
    expect(source).toContain('vector(1536)');
    expect(source).toContain('USING hnsw');
  });
});
