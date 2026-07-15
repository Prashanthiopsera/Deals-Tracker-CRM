export interface ConnectorFixture {
  id: string;
  name: string;
  type: 'enrichment' | 'activity' | 'collaboration';
  enabled: boolean;
  lastSyncAt: string | null;
  healthStatus: 'healthy' | 'degraded' | 'offline';
  config: Record<string, unknown>;
  credentialHint: string | null;
}

export function buildConnectorFixtures(): ConnectorFixture[] {
  return [
    {
      id: 'zoominfo-1',
      name: 'ZoomInfo Enrichment',
      type: 'enrichment',
      enabled: true,
      lastSyncAt: '2026-07-10T10:00:00.000Z',
      healthStatus: 'healthy',
      config: { sync_frequency_minutes: 60, field_mappings: { company_name: 'name' } },
      credentialHint: '****9f2a',
    },
    {
      id: 'granola-1',
      name: 'Granola Activity Capture',
      type: 'activity',
      enabled: false,
      lastSyncAt: null,
      healthStatus: 'offline',
      config: { sync_frequency_minutes: 15 },
      credentialHint: null,
    },
    {
      id: 'slack-1',
      name: 'Slack Collaboration',
      type: 'collaboration',
      enabled: true,
      lastSyncAt: '2026-07-14T08:30:00.000Z',
      healthStatus: 'degraded',
      config: { sync_frequency_minutes: 30, channels: ['#deals'] },
      credentialHint: '****b11c',
    },
  ];
}
