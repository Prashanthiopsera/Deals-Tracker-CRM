import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ReassignOwnerDto } from './companies.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CompanyOwnershipService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async validateTargets(dto: ReassignOwnerDto): Promise<void> {
    const ids = [dto.deal_lead_user_id, dto.deal_support_1_user_id, dto.deal_support_2_user_id].filter(
      Boolean,
    ) as string[];
    for (const id of ids) {
      if (process.env.COMPANIES_IN_MEMORY === 'true') {
        if (!UUID_RE.test(id)) {
          throw new BadRequestException({ message: `Invalid user ID: ${id}` });
        }
        continue;
      }
      const user = await this.users.findOne({ where: { id } });
      if (!user) {
        throw new BadRequestException({ message: `Invalid user ID: ${id}` });
      }
    }
  }
}
