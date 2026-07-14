import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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

  @Post()
  create(@Body() body: { name: string }) {
    return this.companies.create(body.name);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.companies.delete(id);
  }

  @Patch(':id/owner')
  reassign(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.companies.patch(id, body);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.companies.patch(id, body);
  }
}
