import AppDataSource from '../src/database/data-source';
import { DealStage, UserRole } from '../src/database/enums';

export async function seedReferenceData(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const stages = Object.values(DealStage);
  for (const [index, name] of stages.entries()) {
    await AppDataSource.query(
      `INSERT INTO deal_pipeline_stages (name, sort_order)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, index + 1],
    );
  }

  await AppDataSource.query(
    `INSERT INTO system_config (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [
      'defaults',
      JSON.stringify({
        roles: Object.values(UserRole),
        dealStages: stages,
        paginationDefaultLimit: 25,
      }),
    ],
  );
}

if (require.main === module) {
  seedReferenceData()
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error.message);
      process.exit(1);
    });
}
