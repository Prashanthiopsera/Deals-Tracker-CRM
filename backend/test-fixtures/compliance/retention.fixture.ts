export type RetentionDataCategory =
  | 'contacts'
  | 'companies'
  | 'activities'
  | 'audit_logs'
  | 'dsar_exports'
  | 'documents';

export type RetentionExpiryAction = 'delete' | 'anonymize' | 'archive';

export interface RetentionPolicyRecord {
  id: string;
  dataCategory: RetentionDataCategory;
  retentionPeriodDays: number;
  actionOnExpiry: RetentionExpiryAction;
  cronExpression: string;
  batchSize: number;
}

export interface RetentionSeedRecord {
  id: string;
  dataCategory: RetentionDataCategory;
  createdAt: string;
  subjectIdentifier?: string;
}

export function buildRetentionSeedRecords(): RetentionSeedRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const ages = [0, 30, 120, 200, 400];
  const records: RetentionSeedRecord[] = [];
  for (const category of [
    'contacts',
    'companies',
    'activities',
    'audit_logs',
    'dsar_exports',
    'documents',
  ] as RetentionDataCategory[]) {
    ages.forEach((days, index) => {
      records.push({
        id: `${category}-${index + 1}`,
        dataCategory: category,
        createdAt: new Date(now - days * dayMs).toISOString(),
        subjectIdentifier: category === 'contacts' && days >= 365 ? 'ada@example.com' : undefined,
      });
    });
  }
  return records;
}

export const defaultRetentionPolicies: RetentionPolicyRecord[] = [
  {
    id: 'policy-contacts',
    dataCategory: 'contacts',
    retentionPeriodDays: 365,
    actionOnExpiry: 'anonymize',
    cronExpression: '0 2 * * *',
    batchSize: 100,
  },
  {
    id: 'policy-documents',
    dataCategory: 'documents',
    retentionPeriodDays: 90,
    actionOnExpiry: 'delete',
    cronExpression: '0 2 * * *',
    batchSize: 100,
  },
  {
    id: 'policy-audit-logs',
    dataCategory: 'audit_logs',
    retentionPeriodDays: 365,
    actionOnExpiry: 'archive',
    cronExpression: '0 2 * * *',
    batchSize: 100,
  },
];
