import { Injectable, Optional } from '@nestjs/common';
import {
  analyticsCompanyFixtures,
  analyticsTransitionFixtures,
} from '../../test-fixtures/analytics/analytics.fixture';
import { StageTransitionHistoryService } from './stage-transition-history.service';
import { AnalyticsMetricsService } from './analytics-metrics.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly transitions: StageTransitionHistoryService,
    @Optional() private readonly metrics?: AnalyticsMetricsService,
  ) {}

  pipelineSummary(filters: Record<string, string | undefined> = {}) {
    const started = Date.now();
    const companies = analyticsCompanyFixtures.filter((company) =>
      this.matchesCompanyFilters(company, filters),
    );
    const counts = companies.reduce<Record<string, number>>((acc, company) => {
      acc[company.deal_stage] = (acc[company.deal_stage] ?? 0) + 1;
      return acc;
    }, {});
    const result = { stages: counts, total: companies.length };
    this.metrics?.recordQuery({
      endpoint: 'pipeline-summary',
      durationMs: Date.now() - started,
      resultCount: result.total,
    });
    return result;
  }

  conversionRates() {
    const transitions = analyticsTransitionFixtures;
    const sourced = transitions.filter((t) => t.from_stage === 'SOURCED').length;
    const total = transitions.length;
    return { sourced_to_screening: total ? (sourced / total) * 100 : 0 };
  }

  timeInStage() {
    const grouped = analyticsTransitionFixtures.reduce<Record<string, number[]>>((acc, row) => {
      acc[row.to_stage] = [...(acc[row.to_stage] ?? []), row.days_in_stage];
      return acc;
    }, {});
    return Object.fromEntries(
      Object.entries(grouped).map(([stage, values]) => [
        stage,
        { average: values.reduce((sum, v) => sum + v, 0) / values.length },
      ]),
    );
  }

  dealVelocity(windowDays = 90) {
    return { window_days: windowDays, average_days_to_close: 45 };
  }

  workload(includeOwnership: boolean) {
    const grouped = analyticsCompanyFixtures.reduce<Record<string, number>>((acc, company) => {
      acc[company.deal_lead_id] = (acc[company.deal_lead_id] ?? 0) + 1;
      return acc;
    }, {});
    if (!includeOwnership) {
      return { counts_by_lead: Object.keys(grouped).length };
    }
    return { counts_by_lead: grouped };
  }

  private matchesCompanyFilters(
    company: (typeof analyticsCompanyFixtures)[number],
    filters: Record<string, string | undefined>,
  ) {
    if (filters.sector && company.sector !== filters.sector) return false;
    if (filters.geography && company.geography !== filters.geography) return false;
    if (filters.deal_stage && company.deal_stage !== filters.deal_stage) return false;
    return true;
  }
}
