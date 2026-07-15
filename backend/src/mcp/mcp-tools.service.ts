import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from '../companies/companies.dto';
import { assertNonInternOwnershipPatch } from '../companies/ownership-patch.guard';
import { McpUserContext } from './mcp-auth.service';
import { McpToolResponse, validateMcpInput } from './mcp-tool-schemas';

const FIELD_MAP: Record<string, keyof UpdateCompanyDto> = {
  company_name: 'company_name',
  notes: 'notes',
  deal_lead: 'deal_lead_id',
  support_1: 'support1_id',
  support_2: 'support2_id',
  deal_stage: 'deal_stage',
  status: 'status',
};

@Injectable()
export class McpToolsService {
  constructor(
    private readonly companies: CompaniesService,
    private readonly audit: AuditService,
  ) {}

  async searchCompanies(
    context: McpUserContext,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    const validation = validateMcpInput('search_companies', input);
    if (validation) return this.validationError(validation);

    const query: ListCompaniesQueryDto = {
      sector: input.sector as string | undefined,
      deal_stage: input.stage as never,
      geography: input.geography as string | undefined,
      tags: Array.isArray(input.tags) ? (input.tags as string[]).join(',') : undefined,
      page: Number(input.page ?? 1),
      limit: Number(input.limit ?? 20),
    };
    const result = await this.companies.list(query);
    const term = String(input.query).toLowerCase();
    const data = {
      ...result,
      items: result.items.filter((row) => String(row.name ?? '').toLowerCase().includes(term)),
    };
    this.logTool(context, 'search_companies', input, true);
    return { success: true, data };
  }

  async getRecord(context: McpUserContext, input: Record<string, unknown>): Promise<McpToolResponse> {
    const validation = validateMcpInput('get_record', input);
    if (validation) return this.validationError(validation);
    try {
      const data = await this.companies.getById(String(input.company_id));
      this.logTool(context, 'get_record', input, true);
      return { success: true, data };
    } catch {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } };
    }
  }

  async createRecord(
    context: McpUserContext,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    const validation = validateMcpInput('create_record', input);
    if (validation) return this.validationError(validation);
    const dto: CreateCompanyDto = {
      company_name: String(input.company_name),
      sector: input.sector as string | undefined,
      geography: input.geography as string | undefined,
      deal_stage: input.deal_stage as never,
      tags: input.tags as string[] | undefined,
    };
    const data = await this.companies.create(dto, context.userId, context.role);
    this.logTool(context, 'create_record', input, true);
    return { success: true, data };
  }

  async updateFields(
    context: McpUserContext,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    const validation = validateMcpInput('update_fields', input);
    if (validation) return this.validationError(validation);

    const fields = input.fields as Record<string, unknown>;
    const dto: UpdateCompanyDto = {};
    for (const [key, value] of Object.entries(fields)) {
      const mapped = FIELD_MAP[key];
      if (mapped) (dto as Record<string, unknown>)[mapped] = value;
    }

    try {
      assertNonInternOwnershipPatch(context.role, dto as Record<string, unknown>);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        this.logTool(context, 'update_fields', input, false);
        return {
          success: false,
          error: { code: 'PERMISSION_DENIED', message: error.message },
        };
      }
      throw error;
    }

    try {
      const data = await this.companies.patch(
        String(input.company_id),
        dto,
        context.userId,
        context.role,
      );
      this.logTool(context, 'update_fields', input, true);
      return { success: true, data };
    } catch {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } };
    }
  }

  async reassignOwner(
    context: McpUserContext,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    const validation = validateMcpInput('reassign_owner', input);
    if (validation) return this.validationError(validation);

    const fieldName = String(input.field_name);
    const ownerMap: Record<string, string> = {
      deal_lead: 'deal_lead_user_id',
      support_1: 'deal_support_1_user_id',
      support_2: 'deal_support_2_user_id',
    };
    const dtoKey = ownerMap[fieldName];
    if (!dtoKey) {
      return this.validationError({ field_name: 'invalid field' });
    }

    try {
      const data = await this.companies.reassignOwner(
        String(input.company_id),
        { [dtoKey]: String(input.new_owner_id) },
        context.userId,
        context.role,
      );
      this.logTool(context, 'reassign_owner', input, true);
      return { success: true, data };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } };
      }
      throw error;
    }
  }

  private validationError(fields: Record<string, string>): McpToolResponse {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input parameters', fields },
    };
  }

  private logTool(
    context: McpUserContext,
    tool: string,
    input: Record<string, unknown>,
    success: boolean,
  ): void {
    this.audit.publishAuditEvent({
      actorId: context.userId,
      actorRole: context.role,
      operation: 'update',
      resourceType: 'McpTool',
      resourceId: tool,
      metadata: {
        action: 'mcp.tool.execute',
        tool,
        input: { ...input, query: input.query ? '[redacted]' : undefined },
        outcome: success ? 'success' : 'failure',
      },
    });
  }
}
