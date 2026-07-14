import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [ObservabilityModule, HealthModule],
})
export class AppModule {}
