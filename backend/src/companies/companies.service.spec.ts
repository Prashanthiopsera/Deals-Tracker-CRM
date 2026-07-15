import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from '../database/entities/company.entity';
import { CompanyStatus, DealStage } from '../database/enums';
import { buildValidCompanyPayload } from '../../test-fixtures/companies/company.factory';
import { createCompanyAuditPublisher } from './companies-audit.test-utils';
import { CompaniesService } from './companies.service';
import { validateCreateCompanyDto } from './companies.dto';

describe('CompaniesService', () => {
  const company: Company = Object.assign(new Company(), {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Nova AI',
    dealLeadId: null,
    support1Id: null,
    support2Id: null,
    dealStage: DealStage.SOURCED,
    status: CompanyStatus.ACTIVE,
    sector: 'AI',
    geography: 'US',
    tags: ['priority'],
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  });

  const { queue, publisher: audit } = createCompanyAuditPublisher();

  const repo = {
    create: jest.fn((input) => Object.assign(new Company(), input)),
    save: jest.fn(async (input) => ({ ...input, id: company.id })),
    findOne: jest.fn(async () => company),
    softRemove: jest.fn(async (input) => input),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(async () => 1),
      getMany: jest.fn(async () => [company]),
    })),
  } as unknown as Repository<Company>;

  const service = new CompaniesService(repo, audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    jest.clearAllMocks();
    (repo.findOne as jest.Mock).mockResolvedValue(company);
  });

  it('creates a company and publishes audit event', async () => {
    const payload = buildValidCompanyPayload();
    const result = await service.create(
      { company_name: payload.company_name as string },
      'actor-1',
      'Director',
    );
    expect(result.id).toBeDefined();
    expect(queue.domainMessages).toHaveLength(1);
  });

  it('lists paginated companies excluding deleted by default', async () => {
    const result = await service.list({ page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('soft deletes a company and publishes audit event', async () => {
    await service.softDelete(company.id, 'actor-1');
    expect(repo.softRemove).toHaveBeenCalled();
    expect(queue.domainMessages[0].operation).toBe('delete');
  });

  it('throws when company is missing', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('patches company fields and publishes audit', async () => {
    const result = await service.patch(company.id, { notes: 'Updated' }, 'actor-1', 'Director');
    expect(result.notes).toBe('Updated');
    expect(queue.domainMessages[0].operation).toBe('update');
  });

  it('transitions deal stage with audit trail', async () => {
    const result = await service.transitionStage(
      company.id,
      DealStage.SCREENING,
      'actor-1',
      'Director',
    );
    expect(result.deal_stage).toBe(DealStage.SCREENING);
  });

  it('reassigns ownership fields', async () => {
    const result = await service.reassignOwner(
      company.id,
      { deal_lead_user_id: '22222222-2222-2222-2222-222222222222' },
      'actor-1',
      'Director',
    );
    expect(result.deal_lead_id).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('lists companies with cursor pagination metadata', async () => {
    (repo.createQueryBuilder as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(async () => 2),
      getMany: jest.fn(async () => [company, { ...company, id: '22222222-2222-2222-2222-222222222222' }]),
    });
    const result = await service.list({ limit: 1, sort_by: 'name', sort_order: 'ASC' });
    expect(result.has_more).toBe(true);
    expect(result.cursor).toBeTruthy();
  });
});

describe('companies DTO validation', () => {
  it('requires company_name on create', () => {
    expect(() => validateCreateCompanyDto({})).toThrow('company_name is required');
  });
});
