import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import AppDataSource from '../database/data-source';
import { AuthUserContext } from '../auth/auth.types';

@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  async use(req: Request & { user?: AuthUserContext }, _res: Response, next: NextFunction) {
    if (!req.user || !AppDataSource.isInitialized) {
      next();
      return;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        `SELECT set_config('app.current_user_role', $1, true)`,
        [req.user.p7vcRole],
      );
      await queryRunner.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [req.user.p7vcUserId],
      );
      (req as Request & { rlsQueryRunner?: typeof queryRunner }).rlsQueryRunner = queryRunner;
      next();
    } catch (error) {
      await queryRunner.release();
      next(error);
    }
  }
}

export function buildRlsSessionStatements(role: string, userId: string): string[] {
  return [
    `SELECT set_config('app.current_user_role', '${role}', true)`,
    `SELECT set_config('app.current_user_id', '${userId}', true)`,
  ];
}
