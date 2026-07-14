import AppDataSource from '../src/database/data-source';
import { CompanyStatus, DealStage, UserRole } from '../src/database/enums';

export async function seedTestData(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const users = [
    { email: 'director@test.p7vc.com', fullName: 'Test Director', role: UserRole.DIRECTOR },
    { email: 'principal@test.p7vc.com', fullName: 'Test Principal', role: UserRole.PRINCIPAL },
    { email: 'associate@test.p7vc.com', fullName: 'Test Associate', role: UserRole.ASSOCIATE },
    { email: 'intern@test.p7vc.com', fullName: 'Test Intern', role: UserRole.INTERN },
    { email: 'admin@test.p7vc.com', fullName: 'Test Admin', role: UserRole.ADMIN },
  ];

  const userIds: Record<string, string> = {};
  for (const user of users) {
    const rows = await AppDataSource.query(
      `INSERT INTO users (email, full_name, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [user.email, user.fullName, user.role],
    ) as { id: string }[];
    userIds[user.role] = rows[0].id;
  }

  const companyRows = await AppDataSource.query(
    `INSERT INTO companies (
      name, website, sector, stage, geography, key_contacts, lead_source,
      p7vc_deal_lead, deal_lead_support_1, deal_stage, check_size_usd,
      valuation_usd, status, first_contact_date, notes, source_documents, tags
    ) VALUES (
      $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17
    ) RETURNING id`,
    [
      'Acme Robotics',
      'https://acme.example',
      'Industrial Tech',
      'Series B',
      'US-West',
      JSON.stringify([{ name: 'Jane Doe', title: 'CEO', email: 'jane@acme.example' }]),
      'Conference',
      userIds[UserRole.DIRECTOR],
      userIds[UserRole.ASSOCIATE],
      DealStage.DEEP_DILIGENCE,
      '5000000.00',
      '45000000.00',
      CompanyStatus.ACTIVE,
      '2026-01-15',
      'Strong traction in warehouse automation.',
      JSON.stringify([{ name: 'pitch-deck.pdf', url: 's3://docs/pitch-deck.pdf' }]),
      ['robotics', 'automation'],
    ],
  ) as { id: string }[];

  await AppDataSource.query(
    `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      userIds[UserRole.ADMIN],
      'company.create',
      'company',
      companyRows[0].id,
      JSON.stringify({ source: 'test-seed' }),
    ],
  );
}

if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error.message);
      process.exit(1);
    });
}
