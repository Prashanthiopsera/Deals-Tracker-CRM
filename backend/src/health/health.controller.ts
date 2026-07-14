import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../authorization/cedar.guard';
import { HealthService } from './health.service';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.check();
  }

  @Get('ready')
  getReadiness() {
    const result = this.healthService.readiness();
    if (!result.ready) {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
