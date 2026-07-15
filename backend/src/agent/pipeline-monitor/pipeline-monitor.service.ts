import {
  defaultStalenessThresholds,
  pipelineMonitorFixtures,
} from '../../../test-fixtures/agent/pipeline-monitor.fixture';

export function daysSince(isoDate: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(isoDate).getTime()) / 86_400_000);
}

export function evaluateStaleness(
  company: { deal_stage: string; updated_at: string },
  thresholds = defaultStalenessThresholds,
  now = new Date(),
): { stale: boolean; daysInStage: number; threshold: number } {
  const threshold = thresholds[company.deal_stage] ?? 14;
  const daysInStage = daysSince(company.updated_at, now);
  return { stale: daysInStage > threshold, daysInStage, threshold };
}

export function scanPipeline(now = new Date('2026-07-14T00:00:00Z')) {
  return pipelineMonitorFixtures
    .map((company) => {
      const staleness = evaluateStaleness(company, defaultStalenessThresholds, now);
      const expirySoon =
        company.term_sheet_expiry &&
        daysSince(company.term_sheet_expiry, now) <= 7 &&
        new Date(company.term_sheet_expiry) >= now;
      return { company, staleness, expirySoon: Boolean(expirySoon) };
    })
    .filter((entry) => entry.staleness.stale || entry.expirySoon);
}
