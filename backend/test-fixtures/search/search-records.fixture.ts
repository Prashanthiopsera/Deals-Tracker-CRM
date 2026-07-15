export interface SearchIndexRecord {
  entityType: 'company' | 'contact' | 'document' | 'note';
  recordId: string;
  matchedField: string;
  snippet: string;
  visibility: 'all' | 'director_only' | 'non_intern';
  text: string;
}

function buildSearchFixtureRecords(): SearchIndexRecord[] {
  const records: SearchIndexRecord[] = [];
  for (let i = 0; i < 100; i += 1) {
    records.push({
      entityType: 'company',
      recordId: `company-${i + 1}`,
      matchedField: 'name',
      snippet: `Company ${i + 1} in robotics sector`,
      visibility: i % 10 === 0 ? 'director_only' : 'all',
      text: `Company ${i + 1} robotics sector notes pipeline`,
    });
  }
  for (let i = 0; i < 200; i += 1) {
    records.push({
      entityType: 'contact',
      recordId: `contact-${i + 1}`,
      matchedField: 'email',
      snippet: `contact${i + 1}@example.com`,
      visibility: i % 15 === 0 ? 'non_intern' : 'all',
      text: `First${i} Last${i} contact${i + 1}@example.com`,
    });
  }
  for (let i = 0; i < 50; i += 1) {
    records.push({
      entityType: 'document',
      recordId: `document-${i + 1}`,
      matchedField: 'title',
      snippet: `Investment memo ${i + 1}`,
      visibility: 'all',
      text: `Investment memo ${i + 1} extracted text`,
    });
  }
  records.push({
    entityType: 'note',
    recordId: 'note-1',
    matchedField: 'body',
    snippet: 'Nova AI warehouse automation diligence notes',
    visibility: 'all',
    text: 'Nova AI warehouse automation diligence notes',
  });
  return records;
}

export const searchFixtureRecords = buildSearchFixtureRecords();
