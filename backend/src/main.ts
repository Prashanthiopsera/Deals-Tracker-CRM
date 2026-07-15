import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initTelemetry } from './observability/telemetry';

async function bootstrap() {
  initTelemetry();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
