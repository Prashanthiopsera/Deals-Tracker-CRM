import AppDataSource, { buildDataSourceOptions } from './data-source';

export interface MigrationRunResult {
  dryRun: boolean;
  pending: string[];
  executed: string[];
}

export async function listPendingMigrations(): Promise<string[]> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const executed: Array<{ name: string }> = await AppDataSource.query(
    `SELECT name FROM migrations ORDER BY id`,
  );
  const executedNames = new Set(executed.map((row) => row.name));
  const pending = AppDataSource.migrations
    .map((migration) => migration.name)
    .filter((name): name is string => Boolean(name))
    .filter((name) => !executedNames.has(name));
  return pending;
}

export async function runMigrations(dryRun = false): Promise<MigrationRunResult> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const pending = await listPendingMigrations();
  if (dryRun) {
    return { dryRun: true, pending, executed: [] };
  }

  const results = await AppDataSource.runMigrations({ transaction: 'all' });
  return {
    dryRun: false,
    pending,
    executed: results.map((migration) => migration.name),
  };
}

export async function revertLastMigration(): Promise<string | null> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.undoLastMigration({ transaction: 'all' });
  const executed: Array<{ name: string }> = await AppDataSource.query(
    `SELECT name FROM migrations ORDER BY id DESC LIMIT 1`,
  );
  return executed[0]?.name ?? null;
}

export function getDataSourceOptionsForLog() {
  const options = buildDataSourceOptions();
  return {
    type: options.type,
    migrations: options.migrations,
  };
}
