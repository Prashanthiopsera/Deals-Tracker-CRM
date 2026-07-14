import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Contact } from './entities/contact.entity';
import { Company } from './entities/company.entity';
import { AuditLog } from './entities/audit-log.entity';

export function buildDataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required for database migrations');
  }

  return {
    type: 'postgres',
    url,
    entities: [User, Company, Contact, AuditLog],
    migrations: [`${__dirname}/migrations/*.{ts,js}`],
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
  };
}

const AppDataSource = new DataSource(buildDataSourceOptions());

export default AppDataSource;
