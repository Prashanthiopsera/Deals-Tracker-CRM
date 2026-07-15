import { cosineSimilarity } from '../search/semantic-search.fixture';

export interface EmbeddingSeedRecord {
  id: string;
  companyId: string;
  companyName: string;
  chunkText: string;
  embedding: number[];
  chunkMetadata: Record<string, unknown>;
  visibility: 'all' | 'director_only';
}

function buildEmbeddingSeeds(count: number): EmbeddingSeedRecord[] {
  const records: EmbeddingSeedRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    records.push({
      id: `emb-${i + 1}`,
      companyId: `company-${(i % 20) + 1}`,
      companyName: `Company ${(i % 20) + 1}`,
      chunkText: `Diligence notes for robotics company ${i + 1}`,
      embedding: [0.9 - i * 0.001, 0.1 + i * 0.0001, 0.0],
      chunkMetadata: { sourceField: 'notes', chunkIndex: i % 5 },
      visibility: i % 25 === 0 ? 'director_only' : 'all',
    });
  }
  return records;
}

export const embeddingSeedRecords = buildEmbeddingSeeds(120);

export { cosineSimilarity };

export function filterEmbeddingsByRole(
  records: EmbeddingSeedRecord[],
  role: string,
): EmbeddingSeedRecord[] {
  if (role === 'Director' || role === 'Admin') return records;
  return records.filter((record) => record.visibility !== 'director_only');
}
