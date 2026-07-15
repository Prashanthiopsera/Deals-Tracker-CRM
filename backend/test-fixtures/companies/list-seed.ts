import { CompanyStatus, DealStage } from '../../src/database/enums';

export interface CompanyListSeedRow {
  id: string;
  name: string;
  dealLeadId: string | null;
  support1Id: string | null;
  support2Id: string | null;
  dealStage: DealStage;
  status: CompanyStatus;
  sector: string | null;
  geography: string | null;
  tags: string[];
  notes: string | null;
  keyDates: Record<string, string>;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const SECTORS = ['fintech', 'ai', 'robotics', 'healthcare', 'saas'];
const GEOGRAPHIES = ['US', 'EU', 'APAC'];
const TAG_POOL = ['ai', 'saas', 'priority', 'enterprise', 'seed'];

export function buildCompanyListFixture(count = 120): CompanyListSeedRow[] {
  const rows: CompanyListSeedRow[] = [];
  const base = new Date('2025-01-01T00:00:00Z').getTime();

  for (let i = 0; i < count; i += 1) {
    const createdAt = new Date(base + i * 86_400_000);
    rows.push({
      id: `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`,
      name: `Company ${i}`,
      dealLeadId: i % 5 === 0 ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
      support1Id: null,
      support2Id: null,
      dealStage: Object.values(DealStage)[i % Object.values(DealStage).length],
      status: CompanyStatus.ACTIVE,
      sector: SECTORS[i % SECTORS.length],
      geography: GEOGRAPHIES[i % GEOGRAPHIES.length],
      tags: [TAG_POOL[i % TAG_POOL.length], TAG_POOL[(i + 1) % TAG_POOL.length]],
      notes: null,
      keyDates: {},
      createdById: null,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    });
  }

  return rows;
}
