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
import { PiiClassification } from '../enums';
import { PiiField } from '../../pii/pii-classification.metadata';
import { Company } from './company.entity';
import { User } from './user.entity';

@Entity({ name: 'contacts' })
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  @PiiField(PiiClassification.CONFIDENTIAL)
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  @PiiField(PiiClassification.CONFIDENTIAL)
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @PiiField(PiiClassification.CONFIDENTIAL)
  email!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @PiiField(PiiClassification.CONFIDENTIAL)
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ name: 'linkedin_url', type: 'varchar', length: 512, nullable: true })
  linkedinUrl!: string | null;

  @Column({
    name: 'pii_classification',
    type: 'enum',
    enum: PiiClassification,
    enumName: 'pii_classification',
    default: PiiClassification.CONFIDENTIAL,
  })
  piiClassification!: PiiClassification;

  @Column({ name: 'pii_tags', type: 'jsonb', default: () => "'{}'" })
  piiTags!: Record<string, { classification: PiiClassification }>;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
