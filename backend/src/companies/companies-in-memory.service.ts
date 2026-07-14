import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CompanyStatus, DealStage } from '../database/enums';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './companies.dto';
import { SqsCompanyAuditPublisher } from './companies.service';
import { toCompanyResponse } from './ownership-fields';

interface MemoryCompany {
  id: string;
  name: string;
  dealLeadId: string | null;
  support1Id: string | null;
  support2Id: string | null;
  dealStage: DealStage;
  status: CompanyStatus;
  sector: string | null;
  geography: string | null;
  tags: string[];
  notes: string | null;
  keyDates: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class CompaniesInMemoryService {
  private companies: MemoryCompany[] = this.seed();

  constructor(private readonly audit: SqsCompanyAuditPublisher) {}

  resetToSeed(): void {
    this.companies = this.seed();
  }

  private seed(): MemoryCompany[] {
    const now = new Date('2026-01-01T00:00:00Z');
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Acme Robotics',
        dealLeadId: '22222222-2222-2222-2222-222222222222',
        support1Id: '33333333-3333-3333-3333-333333333333',
        support2Id: '44444444-4444-4444-4444-444444444444',
        dealStage: DealStage.SOURCED,
        status: CompanyStatus.ACTIVE,
        sector: 'Robotics',
        geography: 'US',
        tags: ['priority'],
        notes: 'Priority target',
        keyDates: {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];
  }

  async create(dto: CreateCompanyDto, actorId: string, actorRole: string) {
    const now = new Date();
    const company: MemoryCompany = {
      id: randomUUID(),
      name: dto.company_name,
      dealLeadId: null,
      support1Id: null,
      support2Id: null,
      dealStage: dto.deal_stage ?? DealStage.SOURCED,
      status: dto.status ?? CompanyStatus.ACTIVE,
      sector: dto.sector ?? null,
      geography: dto.geography ?? null,
      tags: dto.tags ?? [],
      notes: null,
      keyDates: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.companies.push(company);
    const response = this.toResponse(company);
    this.publishAudit(actorId, actorRole, 'create', null, response, company.id);
    return response;
  }

  async list(query: ListCompaniesQueryDto) {
    const active = this.companies.filter((c) => !c.deletedAt);
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    let filtered = active;
    if (query.deal_stage) filtered = filtered.filter((c) => c.dealStage === query.deal_stage);
    if (query.status) filtered = filtered.filter((c) => c.status === query.status);
    if (query.sector) filtered = filtered.filter((c) => c.sector === query.sector);
    if (query.geography) filtered = filtered.filter((c) => c.geography === query.geography);
    if (query.tags) filtered = filtered.filter((c) => c.tags.includes(query.tags!));
    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit).map((c) => this.toResponse(c)),
      total: filtered.length,
    };
  }

  async getById(id: string) {
    return this.toResponse(this.findActive(id));
  }

  async patch(id: string, dto: UpdateCompanyDto, actorId: string, actorRole: string) {
    const company = this.findActive(id);
    const before = this.toResponse(company);
    if (dto.company_name) company.name = dto.company_name;
    if (dto.notes !== undefined) company.notes = dto.notes;
    if (dto.deal_lead_id !== undefined) company.dealLeadId = dto.deal_lead_id;
    if (dto.support1_id !== undefined) company.support1Id = dto.support1_id;
    if (dto.support2_id !== undefined) company.support2Id = dto.support2_id;
    if (dto.deal_stage) company.dealStage = dto.deal_stage;
    if (dto.status) company.status = dto.status;
    company.updatedAt = new Date();
    const after = this.toResponse(company);
    this.publishAudit(actorId, actorRole, 'update', before, after, id);
    return after;
  }

  async softDelete(id: string, actorId: string, actorRole: string): Promise<void> {
    const company = this.findActive(id);
    const before = this.toResponse(company);
    company.deletedAt = new Date();
    company.updatedAt = new Date();
    this.publishAudit(actorId, actorRole, 'delete', before, null, id);
  }

  private findActive(id: string): MemoryCompany {
    const company = this.companies.find((c) => c.id === id);
    if (!company || company.deletedAt) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  private toResponse(company: MemoryCompany): Record<string, unknown> {
    return toCompanyResponse({
      id: company.id,
      name: company.name,
      deal_lead_id: company.dealLeadId,
      support1_id: company.support1Id,
      support2_id: company.support2Id,
      deal_stage: company.dealStage,
      status: company.status,
      sector: company.sector,
      geography: company.geography,
      tags: company.tags,
      notes: company.notes,
      created_at: company.createdAt,
      updated_at: company.updatedAt,
    });
  }

  private publishAudit(
    actorId: string,
    actorRole: string,
    action: 'create' | 'update' | 'delete',
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    companyId: string,
  ): void {
    this.audit.publishCompanyEvent({
      actorId,
      actorRole,
      action,
      before,
      after,
      companyId,
    });
  }
}
