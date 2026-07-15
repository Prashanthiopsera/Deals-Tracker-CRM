import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RlsSessionMiddleware implements NestMiddleware {
  use(req: Request & { user?: { p7vcUserId: string; p7vcRole: string } }, _res: Response, next: NextFunction) {
    if (req.user) {
      (req as Request & { rlsContext?: Record<string, string> }).rlsContext = {
        user_id: req.user.p7vcUserId,
        role: req.user.p7vcRole,
      };
    }
    next();
  }
}
