import { PiiClassification } from '../database/enums';
import { PiiRegistryService } from './pii-registry.service';
import {
  allContactFieldsConfidential,
  mockCompanyRecord,
  mockContactRecord,
} from '../../test-fixtures/pii/pii-records.fixture';
import {
  classifyRecord,
  getPiiFieldsForEntity,
  registerPiiEntity,
} from './pii-classification.metadata';

describe('PiiRegistryService (WO-066)', () => {
  const service = new PiiRegistryService();

  beforeEach(() => {
    service.onModuleInit();
  });

  it('enumerates PII-tagged fields across registered entities', () => {
    const rows = service.listAllTaggedFields();
    expect(rows.some((row) => row.entity === 'Contact' && row.field === 'email')).toBe(true);
    expect(rows.some((row) => row.entity === 'Company' && row.field === 'notes')).toBe(true);
  });

  it('returns contact PII fields as confidential', () => {
    expect(service.getPiiFieldsForEntity('Contact')).toEqual(allContactFieldsConfidential());
  });

  it('classifies populated record fields', () => {
    const classified = service.classifyRecord('Contact', mockContactRecord);
    expect(classified.email).toBe(PiiClassification.CONFIDENTIAL);
    expect(classified.phone).toBe(PiiClassification.CONFIDENTIAL);
  });

  it('ignores null or missing values when classifying records', () => {
    const classified = service.classifyRecord('Contact', { firstName: 'Ada', email: null });
    expect(classified.firstName).toBe(PiiClassification.CONFIDENTIAL);
    expect(classified.email).toBeUndefined();
  });

  it('classifies company notes as confidential PII', () => {
    const classified = service.classifyRecord('Company', mockCompanyRecord);
    expect(classified.notes).toBe(PiiClassification.CONFIDENTIAL);
  });
});

describe('pii-classification.metadata (WO-066)', () => {
  beforeEach(() => {
    registerPiiEntity('FixtureEntity', { secret: PiiClassification.RESTRICTED });
  });

  it('supports manual entity registration', () => {
    expect(getPiiFieldsForEntity('FixtureEntity').secret).toBe(PiiClassification.RESTRICTED);
  });

  it('classifies records via utility function', () => {
    expect(classifyRecord('FixtureEntity', { secret: 'value' }).secret).toBe(
      PiiClassification.RESTRICTED,
    );
  });
});
