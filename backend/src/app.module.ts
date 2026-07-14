import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Module({
  imports: [ObservabilityModule, AuthModule, AuthorizationModule, HealthModule],
})
export class AppModule {}
