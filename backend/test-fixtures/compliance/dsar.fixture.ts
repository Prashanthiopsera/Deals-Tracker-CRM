export type DsarLifecycleStatus =
  | 'RECEIVED'
  | 'DISCOVERY_IN_PROGRESS'
  | 'DISCOVERY_COMPLETE'
  | 'EXPORT_GENERATED'
  | 'DELIVERED'
  | 'CLOSED';

export const dsarSubjectFixtures = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  contactId: 'contact-seed-special',
};

export function buildDsarExportCsv(manifest: { matches: Array<{ table: string; rowId: string; column: string }> }): string {
  const header = 'table,row_id,column';
  const rows = manifest.matches.map((match) => `${match.table},${match.rowId},${match.column}`);
  return [header, ...rows].join('\n');
}
