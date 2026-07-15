import { EmbeddingsRegistryService } from './embeddings-registry.service';
import { UserRole } from '../database/enums';

describe('EmbeddingsRegistryService (WO-078)', () => {
  const service = new EmbeddingsRegistryService();

  it('seeds more than 100 embedding records', () => {
    expect(service.listForRole(UserRole.DIRECTOR).length).toBeGreaterThan(100);
  });

  it('returns all embeddings for Director role sessions', () => {
    const directorCount = service.countForRole(UserRole.DIRECTOR);
    const internCount = service.countForRole(UserRole.INTERN);
    expect(directorCount).toBeGreaterThan(internCount);
    expect(service.directorSeesMoreThanIntern()).toBe(true);
  });

  it('filters intern-visible embeddings without cross-role leakage', () => {
    const internRecords = service.listForRole(UserRole.INTERN);
    expect(internRecords.every((record) => record.visibility !== 'director_only')).toBe(true);
  });

  it('includes chunk metadata and company linkage on each record', () => {
    const record = service.listForRole(UserRole.DIRECTOR)[0];
    expect(record.companyId).toBeDefined();
    expect(record.chunkMetadata.sourceField).toBeDefined();
    expect(record.embedding).toHaveLength(3);
  });
});
