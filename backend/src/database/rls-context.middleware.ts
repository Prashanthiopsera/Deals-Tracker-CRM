import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import AppDataSource from '../database/data-source';
import { AuthUserContext } from '../auth/auth.types';

type RequestWithRls = Request & {
  user?: AuthUserContext;
  rlsQueryRunner?: import('typeorm').QueryRunner;
};

@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  async use(req: RequestWithRls, res: Response, next: NextFunction) {
    if (!req.user || !AppDataSource.isInitialized) {
      next();
      return;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();
      await queryRunner.query(`SELECT set_config('app.current_user_role', $1, true)`, [
        req.user.p7vcRole,
      ]);
      await queryRunner.query(`SELECT set_config('app.current_user_id', $1, true)`, [
        req.user.p7vcUserId,
      ]);
      if (req.user.p7vcTeamId) {
        await queryRunner.query(`SELECT set_config('app.current_team_id', $1, true)`, [
          req.user.p7vcTeamId,
        ]);
      }
      req.rlsQueryRunner = queryRunner;

      res.on('finish', () => {
        void (async () => {
          try {
            if (queryRunner.isTransactionActive) {
              await queryRunner.commitTransaction();
            }
          } catch {
            await queryRunner.rollbackTransaction();
          } finally {
            await queryRunner.release();
          }
        })();
      });

      next();
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
