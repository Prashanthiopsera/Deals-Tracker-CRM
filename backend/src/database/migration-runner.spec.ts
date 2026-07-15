import { getDataSourceOptionsForLog } from './migration-runner';

describe('migration-runner', () => {
  it('exposes data source options without credentials', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test';
    const options = getDataSourceOptionsForLog();
    expect(options.type).toBe('postgres');
    expect(options.migrations).toBeDefined();
  });
});
