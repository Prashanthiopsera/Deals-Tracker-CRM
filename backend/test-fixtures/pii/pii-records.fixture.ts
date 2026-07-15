import { PiiClassification } from '../../src/database/enums';

export const mockContactRecord = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+1-555-0100',
  title: 'CTO',
};

export const mockCompanyRecord = {
  name: 'Acme',
  notes: 'Key contact: ada@example.com',
};

export const expectedContactPiiFields = [
  'firstName',
  'lastName',
  'email',
  'phone',
] as const;

export function allContactFieldsConfidential(): Record<string, PiiClassification> {
  return Object.fromEntries(
    expectedContactPiiFields.map((field) => [field, PiiClassification.CONFIDENTIAL]),
  ) as Record<string, PiiClassification>;
}
