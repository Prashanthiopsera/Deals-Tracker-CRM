import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [ContactsController],
  providers: [
    {
      provide: ContactsService,
      useFactory: (audit: AuditService) => new ContactsService(audit),
      inject: [AuditService],
    },
  ],
  exports: [ContactsService],
})
export class ContactsModule {}
