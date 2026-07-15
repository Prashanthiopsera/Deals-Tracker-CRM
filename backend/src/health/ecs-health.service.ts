import { Injectable } from '@nestjs/common';

@Injectable()
export class EcsHealthService {
  checkTaskHealth(): { status: 'ok'; task_count: number } {
    return { status: 'ok', task_count: Number(process.env.ECS_DESIRED_COUNT ?? 1) };
  }
}
