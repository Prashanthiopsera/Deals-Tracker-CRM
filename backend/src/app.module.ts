import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ObservabilityModule, AuthModule, HealthModule],
})
export class AppModule {}
