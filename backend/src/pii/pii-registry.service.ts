import { Injectable, OnModuleInit } from '@nestjs/common';
import { PiiClassification } from '../database/enums';
import {
  classifyRecord,
  getPiiFieldsForEntity,
  getRegisteredPiiEntities,
  registerPiiEntity,
} from './pii-classification.metadata';

@Injectable()
export class PiiRegistryService implements OnModuleInit {
  onModuleInit(): void {
    void import('../database/entities/contact.entity');
    void import('../database/entities/company.entity');
    registerPiiEntity('Contact', {
      firstName: PiiClassification.CONFIDENTIAL,
      lastName: PiiClassification.CONFIDENTIAL,
      email: PiiClassification.CONFIDENTIAL,
      phone: PiiClassification.CONFIDENTIAL,
    });
    registerPiiEntity('Company', {
      notes: PiiClassification.CONFIDENTIAL,
    });
  }

  listAllTaggedFields(): Array<{ entity: string; field: string; classification: PiiClassification }> {
    const rows: Array<{ entity: string; field: string; classification: PiiClassification }> = [];
    for (const [entity, fields] of getRegisteredPiiEntities().entries()) {
      for (const [field, classification] of fields.entries()) {
        rows.push({ entity, field, classification });
      }
    }
    return rows;
  }

  getPiiFieldsForEntity(entityName: string): Record<string, PiiClassification> {
    return getPiiFieldsForEntity(entityName);
  }

  classifyRecord(
    entityName: string,
    record: Record<string, unknown>,
  ): Record<string, PiiClassification> {
    return classifyRecord(entityName, record);
  }
}
