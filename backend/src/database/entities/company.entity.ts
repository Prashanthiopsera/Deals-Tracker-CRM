import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyStatus, DealStage } from '../enums';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  sector!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  stage!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  geography!: string | null;

  @Column({ name: 'key_contacts', type: 'jsonb', default: () => "'[]'" })
  keyContacts!: Record<string, unknown>[];

  @Column({ name: 'lead_source', type: 'varchar', length: 255, nullable: true })
  leadSource!: string | null;

  @Column({ name: 'p7vc_deal_lead', type: 'uuid', nullable: true })
  p7vcDealLead!: string | null;

  @Column({ name: 'deal_lead_support_1', type: 'uuid', nullable: true })
  dealLeadSupport1!: string | null;

  @Column({ name: 'deal_lead_support_2', type: 'uuid', nullable: true })
  dealLeadSupport2!: string | null;

  @Column({ name: 'deal_stage', type: 'enum', enum: DealStage, enumName: 'deal_stage' })
  dealStage!: DealStage;

  @Column({ name: 'check_size_usd', type: 'numeric', precision: 18, scale: 2, nullable: true })
  checkSizeUsd!: string | null;

  @Column({ name: 'valuation_usd', type: 'numeric', precision: 18, scale: 2, nullable: true })
  valuationUsd!: string | null;

  @Column({ type: 'enum', enum: CompanyStatus, enumName: 'company_status' })
  status!: CompanyStatus;

  @Column({ name: 'first_contact_date', type: 'date', nullable: true })
  firstContactDate!: string | null;

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'source_documents', type: 'jsonb', default: () => "'[]'" })
  sourceDocuments!: Record<string, unknown>[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
