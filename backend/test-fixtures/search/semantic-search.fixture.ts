export interface SemanticSearchChunk {
  id: string;
  entityType: string;
  recordId: string;
  content: string;
  embedding: number[];
}

export const semanticSearchChunks: SemanticSearchChunk[] = [
  {
    id: 'chunk-1',
    entityType: 'company',
    recordId: 'company-1',
    content: 'Nova AI warehouse robotics automation',
    embedding: [0.9, 0.1, 0.0],
  },
  {
    id: 'chunk-2',
    entityType: 'document',
    recordId: 'document-1',
    content: 'Series A investment memo for robotics startup',
    embedding: [0.85, 0.15, 0.0],
  },
  {
    id: 'chunk-3',
    entityType: 'contact',
    recordId: 'contact-1',
    content: 'CTO contact for automation platform',
    embedding: [0.2, 0.8, 0.1],
  },
];

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}
