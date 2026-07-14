import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  database: 'connected' | 'disconnected';
}

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      database: this.isDatabaseConnected() ? 'connected' : 'disconnected',
    };
  }

  readiness(): { ready: boolean; database: 'connected' | 'disconnected' } {
    const database = this.isDatabaseConnected() ? 'connected' : 'disconnected';
    return { ready: database === 'connected', database };
  }

  private isDatabaseConnected(): boolean {
    if (process.env.DATABASE_CHECK === 'skip') {
      return true;
    }
    return Boolean(process.env.DATABASE_URL);
  }
}
