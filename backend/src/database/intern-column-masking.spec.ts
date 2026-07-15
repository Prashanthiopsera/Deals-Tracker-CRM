import { readFileSync } from 'fs';
import { join } from 'path';

describe('intern column masking migration', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000010-InternColumnMasking.ts'),
    'utf8',
  );

  it('defines intern ownership masking function', () => {
    expect(source).toContain('mask_company_ownership_for_intern');
    expect(source).toContain("= 'Intern'");
  });

  it('documents companies_intern_masked view purpose', () => {
    expect(source).toContain('companies_intern_masked');
  });
});
