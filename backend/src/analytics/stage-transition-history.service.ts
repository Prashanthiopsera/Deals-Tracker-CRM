import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface StageTransitionRecord {
  id: string;
  company_id: string;
  from_stage: string | null;
  to_stage: string;
  transitioned_by: string;
  transitioned_at: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class StageTransitionHistoryService {
  private readonly records: StageTransitionRecord[] = [];

  recordTransition(input: Omit<StageTransitionRecord, 'id' | 'transitioned_at'>): StageTransitionRecord {
    const entry: StageTransitionRecord = {
      ...input,
      id: randomUUID(),
      transitioned_at: new Date().toISOString(),
    };
    this.records.push(entry);
    return entry;
  }

  listByCompany(companyId: string): StageTransitionRecord[] {
    return this.records.filter((record) => record.company_id === companyId);
  }

  listAll(): StageTransitionRecord[] {
    return [...this.records];
  }
}

export function onCompanyStageUpdated(
  service: StageTransitionHistoryService,
  companyId: string,
  fromStage: string | null,
  toStage: string,
  userId: string,
): StageTransitionRecord {
  return service.recordTransition({
    company_id: companyId,
    from_stage: fromStage,
    to_stage: toStage,
    transitioned_by: userId,
    metadata: {},
  });
}
