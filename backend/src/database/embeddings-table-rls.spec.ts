import { readFileSync } from 'fs';
import { join } from 'path';

describe('embeddings table RLS migration (WO-078)', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000015-EmbeddingsTableRls.ts'),
    'utf8',
  );

  it('creates company_embeddings with pgvector and cascade FK', () => {
    expect(source).toContain('company_embeddings');
    expect(source).toContain('vector(1536)');
    expect(source).toContain('ON DELETE CASCADE');
    expect(source).toContain('chunk_metadata JSONB');
  });

  it('enables RLS policies mirroring company access', () => {
    expect(source).toContain('ENABLE ROW LEVEL SECURITY');
    expect(source).toContain('company_embeddings_universal_read');
    expect(source).toContain('app_is_authenticated()');
  });

  it('creates HNSW index with ef_construction tuning', () => {
    expect(source).toContain('USING hnsw');
    expect(source).toContain('ef_construction = 64');
  });
});
