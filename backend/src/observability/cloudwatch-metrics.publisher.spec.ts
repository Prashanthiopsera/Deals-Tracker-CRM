import { CloudWatchMetricsPublisher } from './cloudwatch-metrics.publisher';

describe('CloudWatchMetricsPublisher (WO-064)', () => {
  it('publishes metric payloads', () => {
    const pub = new CloudWatchMetricsPublisher();
    expect(() => pub.publish('DealsTracker', 'ApiLatency', 120)).not.toThrow();
  });
});
