export interface DsarContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyId: string;
}

export interface DsarCompanyRecord {
  id: string;
  name: string;
  notes: string | null;
}

export interface DsarActivityRecord {
  id: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  companyId: string;
}

export interface DsarAuditRecord {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export function buildDsarFixtures(subjectEmail = 'ada@example.com') {
  const companyId = 'company-dsar-1';
  const contactId = 'contact-dsar-1';
  const activityId = 'activity-dsar-1';
  const auditId = 'audit-dsar-1';

  const contacts: DsarContactRecord[] = [
    {
      id: contactId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: subjectEmail,
      phone: '+1-555-0100',
      companyId,
    },
    {
      id: 'contact-dsar-2',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: null,
      companyId: 'company-dsar-2',
    },
  ];

  const companies: DsarCompanyRecord[] = [
    {
      id: companyId,
      name: 'Analytical Engines Ltd',
      notes: `Key contact: ${subjectEmail}`,
    },
    {
      id: 'company-dsar-2',
      name: 'Compiler Corp',
      notes: 'No subject PII here',
    },
  ];

  const activities: DsarActivityRecord[] = [
    {
      id: activityId,
      subject: 'Follow-up call',
      body: `Discussed roadmap with ${subjectEmail}`,
      metadata: { attendeeEmail: subjectEmail },
      companyId,
    },
    {
      id: 'activity-dsar-2',
      subject: 'Internal sync',
      body: 'Team standup notes',
      metadata: {},
      companyId: 'company-dsar-2',
    },
  ];

  const auditLogs: DsarAuditRecord[] = [
    {
      id: auditId,
      actorId: 'admin-1',
      action: 'update',
      entityType: 'Contact',
      entityId: contactId,
      beforeState: { email: 'old@example.com' },
      afterState: { email: subjectEmail },
      metadata: { subjectEmail },
      timestamp: '2026-07-01T12:00:00.000Z',
    },
    {
      id: 'audit-dsar-2',
      actorId: 'admin-1',
      action: 'read',
      entityType: 'Company',
      entityId: 'company-dsar-2',
      beforeState: null,
      afterState: null,
      metadata: {},
      timestamp: '2026-07-02T12:00:00.000Z',
    },
  ];

  return { contacts, companies, activities, auditLogs, subjectEmail, companyId, contactId };
}
