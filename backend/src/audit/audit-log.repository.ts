import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditEventQuery } from './audit-log.types';

export interface AuditLogRepository {
  insert(entry: Partial<AuditLog>): Promise<void>;
  query(filters: AuditEventQuery): Promise<Partial<AuditLog>[]>;
}

@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepository {
  readonly entries: Partial<AuditLog>[] = [];

  async insert(entry: Partial<AuditLog>): Promise<void> {
    this.entries.push(entry);
  }

  async query(filters: AuditEventQuery): Promise<Partial<AuditLog>[]> {
    return this.entries.filter((entry) => {
      if (filters.actorId && entry.actorId !== filters.actorId) return false;
      if (filters.operation && entry.action !== filters.operation) return false;
      if (filters.resourceType && entry.entityType !== filters.resourceType) return false;
      if (filters.resourceId && entry.entityId !== filters.resourceId) return false;
      if (filters.from && entry.timestamp && entry.timestamp < filters.from) return false;
      if (filters.to && entry.timestamp && entry.timestamp > filters.to) return false;
      return true;
    });
  }
}

@Injectable()
export class TypeOrmAuditLogRepository implements AuditLogRepository {
  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  async insert(entry: Partial<AuditLog>): Promise<void> {
    await this.logs.save(this.logs.create(entry));
  }

  async query(filters: AuditEventQuery): Promise<Partial<AuditLog>[]> {
    const qb = this.logs.createQueryBuilder('a');
    if (filters.actorId) qb.andWhere('a.actorId = :actorId', { actorId: filters.actorId });
    if (filters.operation) qb.andWhere('a.action = :action', { action: filters.operation });
    if (filters.resourceType) qb.andWhere('a.entityType = :entityType', { entityType: filters.resourceType });
    if (filters.resourceId) qb.andWhere('a.entityId = :entityId', { entityId: filters.resourceId });
    if (filters.from) qb.andWhere('a.timestamp >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.timestamp <= :to', { to: filters.to });
    return qb.orderBy('a.timestamp', 'DESC').getMany();
  }
}
