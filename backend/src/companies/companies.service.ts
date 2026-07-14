import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { Company } from '../database/entities/company.entity';
import { CompanyStatus, DealStage } from '../database/enums';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './companies.dto';
import { toCompanyResponse } from './ownership-fields';

export interface CompanyAuditPublisher {
  publishCompanyEvent(input: {
    actorId: string;
    action: 'create' | 'update' | 'delete';
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    companyId: string;
  }): void;
}

@Injectable()
export class SqsCompanyAuditPublisher implements CompanyAuditPublisher {
  constructor(private readonly queue: InMemoryAuditQueuePublisher) {}

  publishCompanyEvent(input: {
    actorId: string;
    action: 'create' | 'update' | 'delete';
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    companyId: string;
  }): void {
    void this.queue.publish({
      eventId: randomUUID(),
      actorId: input.actorId,
      actorRole: 'system',
      action: input.action,
      resourceType: 'Company',
      resourceId: input.companyId,
      decision: 'allow',
      source: 'api',
      timestamp: new Date().toISOString(),
      requestMetadata: { before: input.before, after: input.after },
    });
  }
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    private readonly audit: SqsCompanyAuditPublisher,
  ) {}

  async create(dto: CreateCompanyDto, actorId: string): Promise<Record<string, unknown>> {
    const entity = this.companies.create({
      name: dto.company_name,
      website: dto.website ?? null,
      sector: dto.sector ?? null,
      geography: dto.geography ?? null,
      dealStage: dto.deal_stage ?? DealStage.SOURCED,
      status: dto.status ?? CompanyStatus.ACTIVE,
      tags: dto.tags ?? [],
      createdById: actorId,
    });
    const saved = await this.companies.save(entity);
    const response = this.toResponse(saved);
    this.audit.publishCompanyEvent({
      actorId,
      action: 'create',
      before: null,
      after: response,
      companyId: saved.id,
    });
    return response;
  }

  async list(query: ListCompaniesQueryDto): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const qb = this.companies
      .createQueryBuilder('company')
      .where('company.deleted_at IS NULL');

    if (query.deal_stage) qb.andWhere('company.deal_stage = :dealStage', { dealStage: query.deal_stage });
    if (query.status) qb.andWhere('company.status = :status', { status: query.status });
    if (query.sector) qb.andWhere('company.sector = :sector', { sector: query.sector });
    if (query.geography) qb.andWhere('company.geography = :geography', { geography: query.geography });
    if (query.tags) qb.andWhere(':tag = ANY(company.tags)', { tag: query.tags });

    const sortBy = query.sort_by === 'name' ? 'company.name' : 'company.created_at';
    qb.orderBy(sortBy, query.sort_order ?? 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.toResponse(item)), total };
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    const company = await this.findActive(id);
    return this.toResponse(company);
  }

  async patch(id: string, dto: UpdateCompanyDto, actorId: string): Promise<Record<string, unknown>> {
    const company = await this.findActive(id);
    const before = this.toResponse(company);
    if (dto.company_name) company.name = dto.company_name;
    if (dto.notes !== undefined) company.notes = dto.notes;
    if (dto.deal_lead_id !== undefined) company.dealLeadId = dto.deal_lead_id;
    if (dto.support1_id !== undefined) company.support1Id = dto.support1_id;
    if (dto.support2_id !== undefined) company.support2Id = dto.support2_id;
    if (dto.deal_stage) company.dealStage = dto.deal_stage;
    if (dto.status) company.status = dto.status;
    const saved = await this.companies.save(company);
    const after = this.toResponse(saved);
    this.audit.publishCompanyEvent({ actorId, action: 'update', before, after, companyId: id });
    return after;
  }

  async softDelete(id: string, actorId: string): Promise<void> {
    const company = await this.findActive(id);
    const before = this.toResponse(company);
    await this.companies.softRemove(company);
    this.audit.publishCompanyEvent({ actorId, action: 'delete', before, after: null, companyId: id });
  }

  private async findActive(id: string): Promise<Company> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company || company.deletedAt) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  private toResponse(company: Company): Record<string, unknown> {
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
}
