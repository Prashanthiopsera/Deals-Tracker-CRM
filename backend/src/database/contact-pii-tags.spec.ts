import { readFileSync } from 'fs';
import { join } from 'path';

describe('contact pii_tags migration (WO-069)', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000012-ContactPiiTags.ts'),
    'utf8',
  );

  it('adds pii_tags JSONB column to contacts', () => {
    expect(source).toContain('pii_tags JSONB');
    expect(source).toContain('data_classification: confidential');
  });
});
