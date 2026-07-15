import { getMetadataArgsStorage } from 'typeorm';
import { User } from './user.entity';
import { UserRole, UserStatus } from '../enums';

describe('User entity', () => {
  it('defines role and status enums', () => {
    expect(UserRole.DIRECTOR).toBe('Director');
    expect(UserStatus.ACTIVE).toBe('active');
  });

  it('requires auth0_sub, email, and display_name columns', () => {
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === User);
    expect(columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['auth0Sub', 'email', 'displayName', 'role', 'status', 'teamId']),
    );
  });
});
