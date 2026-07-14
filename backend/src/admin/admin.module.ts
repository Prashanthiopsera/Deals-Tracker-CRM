import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

const auth0Mock = {
  inviteUser: async () => ({ auth0Subject: 'auth0|mock' }),
  updateRole: async () => undefined,
  deactivateUser: async () => undefined,
};

const auditMock = { log: async () => undefined };
const eventsMock = {
  publishRoleChanged: async () => undefined,
  publishUserDeactivated: async () => undefined,
};

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [AdminUsersController],
  providers: [
    {
      provide: AdminUsersService,
      useFactory: () => new AdminUsersService(auth0Mock, auditMock, eventsMock),
    },
  ],
})
export class AdminModule {}
