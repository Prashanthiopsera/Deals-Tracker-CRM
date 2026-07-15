import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './data-source';
import { Activity } from './entities/activity.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Comment } from './entities/comment.entity';
import { Company } from './entities/company.entity';
import { Contact } from './entities/contact.entity';
import { Document } from './entities/document.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions()),
    TypeOrmModule.forFeature([User, Company, Contact, Activity, Document, AuditLog, Comment]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
