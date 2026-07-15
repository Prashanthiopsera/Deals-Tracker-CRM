'use client';

import { useMemo, useState } from 'react';

interface PipelineSummary {
  stages: Record<string, number>;
  total: number;
}

interface AnalyticsDashboardProps {
  summary: PipelineSummary;
  conversionRate: number;
  role: string;
}

export function PipelineAnalyticsDashboard({ summary, conversionRate, role }: AnalyticsDashboardProps) {
  const [windowDays, setWindowDays] = useState(90);
  const stages = useMemo(() => Object.entries(summary.stages), [summary.stages]);

  return (
    <section data-testid="pipeline-analytics-dashboard">
      <label>
        Window (days)
        <input
          type="number"
          value={windowDays}
          onChange={(event) => setWindowDays(Number(event.target.value))}
        />
      </label>
      <div data-testid="pipeline-funnel">
        {stages.map(([stage, count]) => (
          <div key={stage}>
            {stage}: {count}
          </div>
        ))}
      </div>
      <p data-testid="conversion-rate">Conversion: {conversionRate.toFixed(1)}%</p>
      {role !== 'Intern' ? (
        <p data-testid="workload-chart">Workload chart visible</p>
      ) : (
        <p data-testid="workload-hidden">Workload hidden for Intern</p>
      )}
    </section>
  );
}
