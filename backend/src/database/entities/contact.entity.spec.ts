import { getMetadataArgsStorage } from 'typeorm';
import { Contact } from './contact.entity';
import { PiiClassification } from '../enums';

describe('Contact entity', () => {
  it('defines PII classification enum and required columns', () => {
    expect(PiiClassification.CONFIDENTIAL).toBe('confidential');
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Contact);
    expect(columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['firstName', 'lastName', 'email', 'piiClassification', 'companyId', 'createdById']),
    );
  });
});
