import { UserRole } from '../../src/database/enums';

export interface AdminUserFixtureRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string | null;
}

export function buildAdminUserFixtures(): AdminUserFixtureRecord[] {
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'director@p7vc.test',
      fullName: 'Director User',
      role: UserRole.DIRECTOR,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: '2026-07-01T12:00:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'associate@p7vc.test',
      fullName: 'Associate User',
      role: UserRole.ASSOCIATE,
      status: 'active',
      createdAt: '2026-02-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'pending@p7vc.test',
      fullName: 'Pending User',
      role: UserRole.INTERN,
      status: 'pending',
      createdAt: '2026-03-01T00:00:00.000Z',
      lastLogin: null,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'inactive@p7vc.test',
      fullName: 'Inactive User',
      role: UserRole.PRINCIPAL,
      status: 'inactive',
      createdAt: '2026-04-01T00:00:00.000Z',
      lastLogin: '2026-05-01T08:00:00.000Z',
    },
  ];
}
