import { TypeOrmAuditLogRepository } from './audit-log.repository';
import { AuditAction } from '../database/enums';

describe('TypeOrmAuditLogRepository (WO-010)', () => {
  it('inserts and queries audit logs through TypeORM', async () => {
    const saved = { id: '1', action: AuditAction.CREATE };
    const logs = {
      create: jest.fn().mockReturnValue(saved),
      save: jest.fn().mockResolvedValue(saved),
      count: jest.fn().mockResolvedValue(3),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([saved]),
      }),
    };
    const repository = new TypeOrmAuditLogRepository(logs as never);

    await repository.insert({ actorId: 'a1' });
    const rows = await repository.query({ actorId: 'a1', operation: AuditAction.CREATE });
    const total = await repository.count();

    expect(logs.save).toHaveBeenCalled();
    expect(rows).toHaveLength(1);
    expect(total).toBe(3);
  });
});
