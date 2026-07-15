import { getMetadataArgsStorage } from 'typeorm';
import { Activity } from './activity.entity';
import { ActivityType } from '../enums';

describe('Activity entity', () => {
  it('defines activity types and timeline columns', () => {
    expect(ActivityType.EMAIL).toBe('email');
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Activity);
    expect(columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['type', 'occurredAt', 'source', 'externalId', 'companyId', 'userId']),
    );
  });
});
