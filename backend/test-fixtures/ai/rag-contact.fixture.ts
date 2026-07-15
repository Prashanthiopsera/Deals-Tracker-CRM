export const mockRagContactRecords = [
  {
    id: 'contact-rag-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1-555-0100',
    piiClassification: 'confidential',
  },
  {
    id: 'contact-rag-2',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    phone: '+1-555-0200',
    piiClassification: 'restricted',
  },
] as const;

export const mockRagRetrievalPayload = {
  entityType: 'Contact',
  records: mockRagContactRecords,
  narrative:
    'Contact Ada Lovelace (ada@example.com) can be reached at +1-555-0100 for follow-up.',
};
