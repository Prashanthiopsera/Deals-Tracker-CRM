import { evaluateStaleness, scanPipeline } from './pipeline-monitor.service';

describe('PipelineMonitorAgent (WO-093)', () => {
  it('flags deals exceeding stage staleness thresholds', () => {
    const stale = evaluateStaleness(
      { deal_stage: 'SOURCED', updated_at: '2026-06-01T00:00:00Z' },
      undefined,
      new Date('2026-07-14T00:00:00Z'),
    );
    expect(stale.stale).toBe(true);
    expect(stale.daysInStage).toBeGreaterThan(14);
  });

  it('creates monitor candidates from pipeline scan', () => {
    const flagged = scanPipeline(new Date('2026-07-14T00:00:00Z'));
    expect(flagged.length).toBeGreaterThan(0);
  });
});
