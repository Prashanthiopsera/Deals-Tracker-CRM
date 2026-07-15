import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuditAction } from '../database/enums';

export class AdminAuditLogSearchQueryDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  operationType?: AuditAction;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;

  @IsOptional()
  sortBy?: 'timestamp' | 'action' = 'timestamp';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
