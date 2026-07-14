import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ObservabilityModule,
    AuthModule,
    AuditModule,
    AuthorizationModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
