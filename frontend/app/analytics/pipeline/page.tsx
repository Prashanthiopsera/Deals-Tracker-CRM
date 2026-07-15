'use client';

import { PipelineAnalyticsDashboard } from '../../components/PipelineAnalyticsDashboard';

export default function PipelineAnalyticsPage() {
  return (
    <main>
      <h1>Pipeline Analytics</h1>
      <PipelineAnalyticsDashboard
        summary={{ stages: { SOURCED: 3, SCREENING: 2, DILIGENCE: 1 }, total: 6 }}
        conversionRate={42.5}
        role="Director"
      />
    </main>
  );
}
