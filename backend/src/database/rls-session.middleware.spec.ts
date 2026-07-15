import { RlsSessionMiddleware } from './rls-session.middleware';

describe('RlsSessionMiddleware (WO-026)', () => {
  it('attaches rls context from authenticated user', () => {
    const mw = new RlsSessionMiddleware();
    const req: any = { user: { p7vcUserId: 'u1', p7vcRole: 'Director' } };
    mw.use(req, {} as any, () => {
      expect(req.rlsContext).toEqual({ user_id: 'u1', role: 'Director' });
    });
  });
});
