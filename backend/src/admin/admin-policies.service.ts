import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface PolicyRecord {
  id: string;
  description: string;
  policyText: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersionRecord {
  policyId: string;
  version: number;
  policyText: string;
  actorId: string;
  timestamp: string;
}

export interface VerifiedPermissionsAdminClient {
  listPolicies(): Promise<PolicyRecord[]>;
  getPolicy(id: string): Promise<PolicyRecord | undefined>;
  validatePolicy(policyText: string): Promise<{ valid: boolean; error?: string }>;
  createPolicy(description: string, policyText: string): Promise<PolicyRecord>;
  updatePolicy(id: string, policyText: string): Promise<PolicyRecord>;
}

@Injectable()
export class AdminPoliciesService {
  private readonly policies = new Map<string, PolicyRecord>();
  private readonly versions = new Map<string, PolicyVersionRecord[]>();

  constructor(
    private readonly avp: VerifiedPermissionsAdminClient,
    private readonly audit: AuditService,
  ) {}

  async list(page = 1, pageSize = 20, actorRole: string) {
    this.assertAdmin(actorRole);
    const rows = await this.avp.listPolicies();
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    return { items, total: rows.length, page, pageSize };
  }

  async get(id: string, actorRole: string) {
    this.assertAdmin(actorRole);
    const policy = await this.avp.getPolicy(id);
    if (!policy) throw new NotFoundException('Policy not found');
    return { ...policy, versions: this.versions.get(id) ?? [] };
  }

  async create(
    description: string,
    policyText: string,
    actorId: string,
    actorRole: string,
  ): Promise<PolicyRecord> {
    this.assertAdmin(actorRole);
    await this.validateSyntax(policyText);
    const created = await this.avp.createPolicy(description, policyText);
    this.recordVersion(created.id, policyText, actorId);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'create',
      resourceType: 'Policy',
      resourceId: created.id,
      afterState: created as unknown as Record<string, unknown>,
    });
    return created;
  }

  async update(id: string, policyText: string, actorId: string, actorRole: string) {
    this.assertAdmin(actorRole);
    const before = await this.avp.getPolicy(id);
    if (!before) throw new NotFoundException('Policy not found');
    await this.validateSyntax(policyText);
    const updated = await this.avp.updatePolicy(id, policyText);
    this.recordVersion(id, policyText, actorId);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'Policy',
      resourceId: id,
      beforeState: before as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  private async validateSyntax(policyText: string): Promise<void> {
    const result = await this.avp.validatePolicy(policyText);
    if (!result.valid) {
      throw new UnprocessableEntityException({
        message: 'Invalid Cedar policy syntax',
        details: result.error ?? 'Syntax validation failed',
      });
    }
  }

  private recordVersion(policyId: string, policyText: string, actorId: string): void {
    const history = this.versions.get(policyId) ?? [];
    history.push({
      policyId,
      version: history.length + 1,
      policyText,
      actorId,
      timestamp: new Date().toISOString(),
    });
    this.versions.set(policyId, history);
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}

@Injectable()
export class InMemoryVerifiedPermissionsAdminClient implements VerifiedPermissionsAdminClient {
  private readonly policies = new Map<string, PolicyRecord>();

  async listPolicies(): Promise<PolicyRecord[]> {
    return [...this.policies.values()];
  }

  async getPolicy(id: string): Promise<PolicyRecord | undefined> {
    return this.policies.get(id);
  }

  async validatePolicy(policyText: string): Promise<{ valid: boolean; error?: string }> {
    const balanced = (policyText.match(/\(/g) ?? []).length === (policyText.match(/\)/g) ?? []).length;
    if (!balanced || !policyText.includes('permit(')) {
      return { valid: false, error: 'Unbalanced parentheses or missing permit block' };
    }
    return { valid: true };
  }

  async createPolicy(description: string, policyText: string): Promise<PolicyRecord> {
    const now = new Date().toISOString();
    const record: PolicyRecord = {
      id: randomUUID(),
      description,
      policyText,
      createdAt: now,
      updatedAt: now,
    };
    this.policies.set(record.id, record);
    return record;
  }

  async updatePolicy(id: string, policyText: string): Promise<PolicyRecord> {
    const existing = this.policies.get(id);
    if (!existing) throw new NotFoundException('Policy not found');
    const updated = { ...existing, policyText, updatedAt: new Date().toISOString() };
    this.policies.set(id, updated);
    return updated;
  }
}
