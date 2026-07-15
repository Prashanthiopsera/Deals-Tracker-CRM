export const mockCompanyEmbeddingInput = {
  companyId: 'company-1',
  notes: 'Nova AI is building warehouse robotics with strong revenue traction in logistics.',
  sourceDocuments: 'Pitch deck highlights 3x YoY growth and enterprise customers.',
  version: 2,
};

export const mockBedrockEmbeddingResponse = {
  modelId: 'amazon.titan-embed-text-v2',
  embedding: Array.from({ length: 1536 }, (_, index) => (index === 0 ? 0.91 : 0.001)),
};

export const mockEmbeddingQueueEvent = {
  eventType: 'company.updated',
  companyId: 'company-1',
  changedFields: ['notes'],
  recordVersion: 2,
};
