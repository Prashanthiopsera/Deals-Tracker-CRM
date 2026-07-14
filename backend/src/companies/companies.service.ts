import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CompanyStatus } from '../database/enums';

export interface CompanyRecord {
  id: string;
  name: string;
  deal_lead_id: string | null;
  support_1_id: string | null;
  support_2_id: string | null;
  notes: string | null;
  status: CompanyStatus;
}

@Injectable()
export class CompaniesService {
  private seedCompanies(): CompanyRecord[] {
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Acme Robotics',
        deal_lead_id: '22222222-2222-2222-2222-222222222222',
        support_1_id: '33333333-3333-3333-3333-333333333333',
        support_2_id: '44444444-4444-4444-4444-444444444444',
        notes: 'Priority target',
        status: CompanyStatus.ACTIVE,
      },
    ];
  }

  private companies: CompanyRecord[] = this.seedCompanies();

  resetToSeed(): void {
    this.companies = this.seedCompanies();
  }

  list(): CompanyRecord[] {
    return [...this.companies];
  }

  getById(id: string): CompanyRecord {
    const company = this.companies.find((item) => item.id === id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return { ...company };
  }

  patch(id: string, body: Record<string, unknown>): CompanyRecord {
    const company = this.getById(id);
    if (typeof body.name === 'string') company.name = body.name;
    if (typeof body.notes === 'string') company.notes = body.notes;
    if (typeof body.deal_lead_id === 'string') company.deal_lead_id = body.deal_lead_id;
    if (typeof body.support1_id === 'string') company.support_1_id = body.support1_id;
    if (typeof body.support2_id === 'string') company.support_2_id = body.support2_id;
    return { ...company };
  }

  create(name: string): CompanyRecord {
    const company: CompanyRecord = {
      id: randomUUID(),
      name,
      deal_lead_id: null,
      support_1_id: null,
      support_2_id: null,
      notes: null,
      status: CompanyStatus.ACTIVE,
    };
    this.companies.push(company);
    return { ...company };
  }

  delete(id: string): { deleted: boolean } {
    const index = this.companies.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new NotFoundException('Company not found');
    }
    this.companies.splice(index, 1);
    return { deleted: true };
  }
}
