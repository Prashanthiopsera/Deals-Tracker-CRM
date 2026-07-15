import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface SavedSearchRecord {
  id: string;
  name: string;
  query: string;
  mode: 'full_text' | 'semantic';
  ownerId: string;
  createdAt: string;
}

@Injectable()
export class SavedSearchService {
  private readonly saved = new Map<string, SavedSearchRecord>();

  create(name: string, query: string, mode: 'full_text' | 'semantic', ownerId: string): SavedSearchRecord {
    const record: SavedSearchRecord = {
      id: randomUUID(),
      name,
      query,
      mode,
      ownerId,
      createdAt: new Date().toISOString(),
    };
    this.saved.set(record.id, record);
    return { ...record };
  }

  list(ownerId: string): SavedSearchRecord[] {
    return [...this.saved.values()].filter((record) => record.ownerId === ownerId);
  }

  remove(id: string, ownerId: string): { ok: true } {
    const record = this.saved.get(id);
    if (!record || record.ownerId !== ownerId) {
      throw new Error('Saved search not found');
    }
    this.saved.delete(id);
    return { ok: true };
  }
}
