import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface CoInvestorRecord {
  id: string;
  company_id: string;
  investor_name: string;
  investor_type: 'VC' | 'Angel' | 'Corporate' | 'Other';
  round_stage: string;
}

@Injectable()
export class CoInvestorService {
  private readonly records = new Map<string, CoInvestorRecord>();

  add(input: Omit<CoInvestorRecord, 'id'>): CoInvestorRecord {
    const record = { ...input, id: randomUUID() };
    this.records.set(record.id, record);
    return record;
  }

  listByCompany(companyId: string): CoInvestorRecord[] {
    return [...this.records.values()].filter((r) => r.company_id === companyId);
  }

  graphByInvestor(investorName: string): CoInvestorRecord[] {
    return [...this.records.values()].filter((r) => r.investor_name === investorName);
  }
}
