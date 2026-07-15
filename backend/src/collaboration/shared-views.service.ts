import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface SharedViewRecord {
  id: string;
  name: string;
  owner_id: string;
  visibility: 'private' | 'role-based' | 'all';
  filters: Record<string, string>;
  created_at: string;
}

@Injectable()
export class SharedViewsService {
  private readonly views = new Map<string, SharedViewRecord>();

  create(input: Omit<SharedViewRecord, 'id' | 'created_at'>): SharedViewRecord {
    const record: SharedViewRecord = {
      ...input,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.views.set(record.id, record);
    return record;
  }

  listForUser(_userId: string, role: string): SharedViewRecord[] {
    return [...this.views.values()].filter((view) => {
      if (view.visibility === 'all') return true;
      if (view.visibility === 'role-based') return role !== 'Intern';
      return false;
    });
  }
}
