import { Body, Controller, Get, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard, OwnershipPatchGuard)
@UseInterceptors(OwnershipFieldInterceptor)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list() {
    return this.companies.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.companies.getById(id);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.companies.patch(id, body);
  }
}
