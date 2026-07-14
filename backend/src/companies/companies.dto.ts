import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { CompanyStatus, DealStage } from '../database/enums';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  company_name!: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  geography?: string;

  @IsOptional()
  @IsEnum(DealStage)
  deal_stage?: DealStage;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  deal_lead_id?: string;

  @IsOptional()
  @IsString()
  support1_id?: string;

  @IsOptional()
  @IsString()
  support2_id?: string;

  @IsOptional()
  @IsEnum(DealStage)
  deal_stage?: DealStage;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}

export class ListCompaniesQueryDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  sort_by?: string = 'created_at';

  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  deal_stage?: DealStage;

  @IsOptional()
  status?: CompanyStatus;

  @IsOptional()
  sector?: string;

  @IsOptional()
  geography?: string;

  @IsOptional()
  tags?: string;
}

export function validateCreateCompanyDto(payload: Record<string, unknown>): CreateCompanyDto {
  const dto = Object.assign(new CreateCompanyDto(), payload);
  if (!dto.company_name || typeof dto.company_name !== 'string' || !dto.company_name.trim()) {
    throw new Error('company_name is required');
  }
  return dto;
}
