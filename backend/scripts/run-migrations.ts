#!/usr/bin/env ts-node
import { runMigrations } from '../src/database/migration-runner';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const result = await runMigrations(dryRun);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
