import { deriveCedarAction, deriveResourceType } from './cedar-action-mapper';

describe('cedar-action-mapper', () => {
  it('maps GET to read', () => {
    expect(deriveCedarAction('GET', '/api/companies')).toBe('read');
  });

  it('maps POST to create', () => {
    expect(deriveCedarAction('POST', '/api/companies')).toBe('create');
  });

  it('maps DELETE to delete', () => {
    expect(deriveCedarAction('DELETE', '/api/companies/abc')).toBe('delete');
  });

  it('maps owner patch to reassign', () => {
    expect(deriveCedarAction('PATCH', '/api/companies/abc/owner')).toBe('reassign');
  });

  it('derives Company resource type', () => {
    expect(deriveResourceType('/api/companies')).toBe('Company');
  });

  it('derives User resource type from admin route', () => {
    expect(deriveResourceType('/api/admin/users')).toBe('User');
  });
});
