'use client';

import { AppShell } from '../../../components/AppShell';
import { PipelineAnalyticsDashboard } from '../../../components/PipelineAnalyticsDashboard';

export default function PipelineAnalyticsPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
        Pipeline Analytics
      </h1>
      <PipelineAnalyticsDashboard
        summary={{ stages: { SOURCED: 3, SCREENING: 2, DILIGENCE: 1 }, total: 6 }}
        conversionRate={42.5}
        role="Director"
      />
    </AppShell>
  );
}
