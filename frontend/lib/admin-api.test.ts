import { assertAdminAccess } from './admin-api';

describe('admin panel access (WO-059)', () => {
  it('allows Admin role', () => {
    expect(assertAdminAccess('Admin')).toEqual({ allowed: true });
  });

  it('denies non-admin roles', () => {
    expect(assertAdminAccess('Director').allowed).toBe(false);
  });
});
