import { PiiClassification } from '../../src/database/enums';

export interface DiscoveryContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyId: string;
  piiTags: Record<string, { classification: PiiClassification }>;
}

export interface DiscoveryCompanyRecord {
  id: string;
  name: string;
  notes: string | null;
}

export interface DiscoveryActivityRecord {
  id: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  companyId: string;
}

function buildContacts(count: number): DiscoveryContactRecord[] {
  const contacts: DiscoveryContactRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    contacts.push({
      id: `contact-seed-${i + 1}`,
      firstName: i % 7 === 0 ? "O'Brien" : `First${i}`,
      lastName: i % 11 === 0 ? 'Müller' : `Last${i}`,
      email: i % 5 === 0 ? null : `contact${i}@example.com`,
      phone: i % 3 === 0 ? `+1-555-${String(1000 + i).slice(-4)}` : null,
      companyId: `company-seed-${(i % 30) + 1}`,
      piiTags: {
        firstName: { classification: PiiClassification.CONFIDENTIAL },
        lastName: { classification: PiiClassification.CONFIDENTIAL },
        email: { classification: PiiClassification.CONFIDENTIAL },
        phone: { classification: PiiClassification.CONFIDENTIAL },
      },
    });
  }
  contacts.push({
    id: 'contact-seed-special',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1-555-0100',
    companyId: 'company-seed-1',
    piiTags: {
      firstName: { classification: PiiClassification.CONFIDENTIAL },
      lastName: { classification: PiiClassification.CONFIDENTIAL },
      email: { classification: PiiClassification.CONFIDENTIAL },
      phone: { classification: PiiClassification.CONFIDENTIAL },
    },
  });
  return contacts;
}

function buildCompanies(count: number): DiscoveryCompanyRecord[] {
  const companies: DiscoveryCompanyRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    companies.push({
      id: `company-seed-${i + 1}`,
      name: `Company ${i + 1}`,
      notes: i % 4 === 0 ? `Key contact ada@example.com for deal ${i}` : null,
    });
  }
  return companies;
}

export function buildPiiDiscoverySeedData() {
  const contacts = buildContacts(50);
  const companies = buildCompanies(30);
  const activities: DiscoveryActivityRecord[] = [
    {
      id: 'activity-seed-1',
      subject: 'Intro call',
      body: 'Discussed roadmap with ada@example.com',
      metadata: { attendee: 'ada@example.com' },
      companyId: 'company-seed-1',
    },
    {
      id: 'activity-seed-2',
      subject: 'Team sync',
      body: 'No PII here',
      metadata: {},
      companyId: 'company-seed-2',
    },
  ];
  return { contacts, companies, activities };
}

export const piiDiscoverySeedData = buildPiiDiscoverySeedData();
