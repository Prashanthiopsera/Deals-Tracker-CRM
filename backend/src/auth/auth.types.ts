export interface AuthUserContext {
  sub: string;
  p7vcUserId: string;
  p7vcRole: string;
  p7vcTeamId?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUserContext;
  }
}
