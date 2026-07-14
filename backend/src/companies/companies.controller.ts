import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import {
  CreateCompanyDto,
  ListCompaniesQueryDto,
  StageTransitionDto,
  UpdateCompanyDto,
  validateCreateCompanyDto,
} from './companies.dto';
import { CompaniesService } from './companies.service';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard, OwnershipPatchGuard)
@UseInterceptors(OwnershipFieldInterceptor)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Query() query: ListCompaniesQueryDto) {
    return this.companies.list(query);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      return await this.companies.getById(id);
    } catch {
      throw new NotFoundException({ message: 'Company not found' });
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateCompanyDto,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    try {
      validateCreateCompanyDto(body as unknown as Record<string, unknown>);
    } catch (error) {
      throw new BadRequestException({ message: String(error) });
    }
    return this.companies.create(body, req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Patch(':id/stage')
  @CedarAuthorize('stage_transition', 'Company')
  async transitionStage(
    @Param('id') id: string,
    @Body() body: StageTransitionDto,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    try {
      return await this.companies.transitionStage(
        id,
        body.deal_stage,
        req.user.p7vcUserId,
        req.user.p7vcRole,
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new NotFoundException({ message: 'Company not found' });
    }
  }

  @Patch(':id/owner')
  reassign(
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.patch(id, body, req);
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    try {
      return await this.companies.patch(id, body, req.user.p7vcUserId, req.user.p7vcRole);
    } catch {
      throw new NotFoundException({ message: 'Company not found' });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CedarAuthorize('delete', 'Company')
  async delete(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    try {
      await this.companies.softDelete(id, req.user.p7vcUserId, req.user.p7vcRole);
    } catch {
      throw new NotFoundException({ message: 'Company not found' });
    }
  }
}
