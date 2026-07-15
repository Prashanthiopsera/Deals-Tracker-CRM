import { readFileSync } from 'fs';
import { join } from 'path';

describe('full-text search migration spec (WO-073)', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000013-FullTextSearchIndexes.ts'),
    'utf8',
  );

  it('defines tsvector GIN indexes for searchable entities', () => {
    expect(source).toContain('tsvector');
    expect(source).toContain('USING GIN');
    expect(source).toContain('companies');
    expect(source).toContain('contacts');
    expect(source).toContain('documents');
  });
});
