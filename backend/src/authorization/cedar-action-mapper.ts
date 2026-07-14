import { CedarAction } from './cedar.types';

const RESOURCE_SEGMENTS: Record<string, string> = {
  companies: 'Company',
  contacts: 'Contact',
  activities: 'Activity',
  documents: 'Document',
  users: 'User',
  'audit-logs': 'AuditLog',
};

export function deriveResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('api');
  const resourceSegment = apiIndex >= 0 ? segments[apiIndex + 1] : segments[0];
  if (resourceSegment === 'admin' && segments[apiIndex + 2]) {
    return RESOURCE_SEGMENTS[segments[apiIndex + 2]] ?? 'Company';
  }
  return RESOURCE_SEGMENTS[resourceSegment] ?? 'Company';
}

export function deriveCedarAction(method: string, path: string): CedarAction {
  const normalized = method.toUpperCase();
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes('/owner') || lowerPath.endsWith('/reassign')) {
    return 'reassign';
  }
  if (lowerPath.includes('ownership')) {
    return 'update_ownership_field';
  }

  switch (normalized) {
    case 'GET':
    case 'HEAD':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}
