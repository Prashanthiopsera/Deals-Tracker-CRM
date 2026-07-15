import { Injectable } from '@nestjs/common';
import { UserRole } from '../database/enums';
import {
  embeddingSeedRecords,
  EmbeddingSeedRecord,
  filterEmbeddingsByRole,
} from '../../test-fixtures/rag/embedding-seeds.fixture';

@Injectable()
export class EmbeddingsRegistryService {
  private records: EmbeddingSeedRecord[] = embeddingSeedRecords.map((record) => ({
    ...record,
    embedding: [...record.embedding],
    chunkMetadata: { ...record.chunkMetadata },
  }));

  seed(records: EmbeddingSeedRecord[]): void {
    this.records = records.map((record) => ({
      ...record,
      embedding: [...record.embedding],
      chunkMetadata: { ...record.chunkMetadata },
    }));
  }

  listForRole(role: string): EmbeddingSeedRecord[] {
    return filterEmbeddingsByRole(this.records, role).map((record) => ({
      ...record,
      embedding: [...record.embedding],
    }));
  }

  countForRole(role: string): number {
    return this.listForRole(role).length;
  }

  directorSeesMoreThanIntern(): boolean {
    return (
      this.countForRole(UserRole.DIRECTOR) > this.countForRole(UserRole.INTERN)
    );
  }
}
