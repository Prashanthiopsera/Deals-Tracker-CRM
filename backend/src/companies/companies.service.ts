import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Company } from '../database/entities/company.entity';
import { CompanyStatus, DealStage } from '../database/enums';
import { CreateCompanyDto, ListCompaniesQueryDto, ReassignOwnerDto, UpdateCompanyDto } from './companies.dto';
import { toCompanyResponse } from './ownership-fields';
import { validateStageTransition, stageDateKey } from './stage-transitions';

export interface CompanyAuditPublisher {
  publishCompanyEvent(input: {
    actorId: string;
    actorRole: string;
    action: 'create' | 'update' | 'delete' | 'stage_transition' | 'ownership_reassignment';
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    companyId: string;
  }): void;
}

@Injectable()
export class SqsCompanyAuditPublisher implements CompanyAuditPublisher {
  constructor(private readonly audit: AuditService) {}

  publishCompanyEvent(input: {
    actorId: string;
    actorRole: string;
    action: 'create' | 'update' | 'delete' | 'stage_transition' | 'ownership_reassignment';
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    companyId: string;
  }): void {
    this.audit.publishAuditEvent({
      actorId: input.actorId,
      actorRole: input.actorRole,
      operation: input.action,
      resourceType: 'Company',
      resourceId: input.companyId,
      beforeState: input.before,
      afterState: input.after,
    });
  }
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    private readonly audit: SqsCompanyAuditPublisher,
  ) {}

  async create(dto: CreateCompanyDto, actorId: string, actorRole = 'system'): Promise<Record<string, unknown>> {
    const entity = this.companies.create({
      name: dto.company_name,
      website: dto.website ?? null,
      sector: dto.sector ?? null,
      geography: dto.geography ?? null,
      dealStage: dto.deal_stage ?? DealStage.SOURCED,
      status: dto.status ?? CompanyStatus.ACTIVE,
      tags: dto.tags ?? [],
    });
    const saved = await this.companies.save(entity);
    const response = this.toResponse(saved);
    this.audit.publishCompanyEvent({
      actorId,
      actorRole,
      action: 'create',
      before: null,
      after: response,
      companyId: saved.id,
    });
    return response;
  }

  async list(query: ListCompaniesQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const qb = this.companies.createQueryBuilder('c').where('c.deletedAt IS NULL');
    if (query.deal_stage) qb.andWhere('c.dealStage = :dealStage', { dealStage: query.deal_stage });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    if (query.sector) qb.andWhere('c.sector = :sector', { sector: query.sector });
    if (query.geography) qb.andWhere('c.geography = :geography', { geography: query.geography });
    if (query.tags) qb.andWhere(':tag = ANY(c.tags)', { tag: query.tags });
    const sortColumn = query.sort_by === 'updated_at' ? 'c.updatedAt' : 'c.createdAt';
    qb.orderBy(sortColumn, query.sort_order ?? 'DESC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: items.map((c) => this.toResponse(c)), total };
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    const company = await this.findActive(id);
    return this.toResponse(company);
  }

  async patch(id: string, dto: UpdateCompanyDto, actorId: string, actorRole = 'system'): Promise<Record<string, unknown>> {
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
    this.audit.publishCompanyEvent({ actorId, actorRole, action: 'update', before, after, companyId: id });
    return after;
  }

  async transitionStage(
    id: string,
    targetStage: DealStage,
    actorId: string,
    actorRole: string,
  ): Promise<Record<string, unknown>> {
    const company = await this.findActive(id);
    const before = this.toResponse(company);
    validateStageTransition(company.dealStage, targetStage);
    company.dealStage = targetStage;
    company.keyDates = {
      ...company.keyDates,
      [stageDateKey(targetStage)]: new Date().toISOString(),
    };
    const saved = await this.companies.save(company);
    const after = this.toResponse(saved);
    this.audit.publishCompanyEvent({
      actorId,
      actorRole,
      action: 'stage_transition',
      before,
      after,
      companyId: id,
    });
    return after;
  }

  async reassignOwner(
    id: string,
    dto: ReassignOwnerDto,
    actorId: string,
    actorRole: string,
  ): Promise<Record<string, unknown>> {
    const company = await this.findActive(id);
    const before = this.toResponse(company);
    if (dto.deal_lead_user_id !== undefined) company.dealLeadId = dto.deal_lead_user_id;
    if (dto.deal_support_1_user_id !== undefined) company.support1Id = dto.deal_support_1_user_id;
    if (dto.deal_support_2_user_id !== undefined) company.support2Id = dto.deal_support_2_user_id;
    const saved = await this.companies.save(company);
    const after = this.toResponse(saved);
    this.audit.publishCompanyEvent({
      actorId,
      actorRole,
      action: 'ownership_reassignment',
      before,
      after,
      companyId: id,
    });
    return after;
  }

  async softDelete(id: string, actorId: string, actorRole = 'system'): Promise<void> {
    const company = await this.findActive(id);
    const before = this.toResponse(company);
    await this.companies.softRemove(company);
    this.audit.publishCompanyEvent({ actorId, actorRole, action: 'delete', before, after: null, companyId: id });
  }

  resetToSeed(): void {
    if (process.env.COMPANIES_IN_MEMORY !== 'true') return;
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
      key_dates: company.keyDates,
      created_at: company.createdAt,
      updated_at: company.updatedAt,
    });
  }
}
