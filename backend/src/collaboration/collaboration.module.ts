import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CollaborationController } from './collaboration.controller';
import { PresenceService } from './presence.service';
import { SharedViewsService } from './shared-views.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [CollaborationController],
  providers: [SharedViewsService, PresenceService],
  exports: [SharedViewsService, PresenceService],
})
export class CollaborationModule {}
