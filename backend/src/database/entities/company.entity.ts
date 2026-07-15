import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyFundingStage, CompanyStatus, DealStage, PiiClassification } from '../enums';
import { PiiField } from '../../pii/pii-classification.metadata';
import { User } from './user.entity';

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

  @Column({ name: 'company_stage', type: 'enum', enum: CompanyFundingStage, enumName: 'company_stage', nullable: true })
  companyStage!: CompanyFundingStage | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  geography!: string | null;

  @Column({ name: 'lead_source', type: 'varchar', length: 255, nullable: true })
  leadSource!: string | null;

  @Column({ name: 'deal_lead_id', type: 'uuid', nullable: true })
  dealLeadId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deal_lead_id' })
  dealLead!: User | null;

  @Column({ name: 'support_1_id', type: 'uuid', nullable: true })
  support1Id!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'support_1_id' })
  support1!: User | null;

  @Column({ name: 'support_2_id', type: 'uuid', nullable: true })
  support2Id!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'support_2_id' })
  support2!: User | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @Column({ name: 'deal_stage', type: 'enum', enum: DealStage, enumName: 'deal_stage' })
  dealStage!: DealStage;

  @Column({ name: 'check_size', type: 'numeric', precision: 18, scale: 2, nullable: true })
  checkSize!: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  valuation!: string | null;

  @Column({ type: 'enum', enum: CompanyStatus, enumName: 'company_status' })
  status!: CompanyStatus;

  @Column({ name: 'key_dates', type: 'jsonb', default: () => "'{}'" })
  keyDates!: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  @PiiField(PiiClassification.CONFIDENTIAL)
  notes!: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
