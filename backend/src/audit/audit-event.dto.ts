import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { DomainAuditOperation } from './audit-log.types';

export class AuditEventDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsUUID()
  actorId!: string;

  @IsString()
  actorRole!: string;

  @IsEnum(['create', 'update', 'delete', 'reassign', 'stage_transition', 'ownership_reassignment'] as const)
  operation!: DomainAuditOperation;

  @IsString()
  resourceType!: string;

  @IsUUID()
  resourceId!: string;

  @IsOptional()
  @IsObject()
  beforeState?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  afterState?: Record<string, unknown> | null;

  @IsOptional()
  @IsString({ each: true })
  affectedFields?: string[];

  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
