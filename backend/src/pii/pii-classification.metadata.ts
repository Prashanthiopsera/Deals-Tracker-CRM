import { PiiClassification } from '../database/enums';

export const PII_FIELD_METADATA_KEY = 'pii:field';

export interface PiiFieldMetadata {
  propertyKey: string;
  classification: PiiClassification;
}

const entityRegistry = new Map<string, Map<string, PiiClassification>>();

export function PiiField(classification: PiiClassification): PropertyDecorator {
  return (target, propertyKey) => {
    const entityName = target.constructor.name;
    const fields = entityRegistry.get(entityName) ?? new Map<string, PiiClassification>();
    fields.set(String(propertyKey), classification);
    entityRegistry.set(entityName, fields);
    Reflect.defineMetadata(PII_FIELD_METADATA_KEY, { propertyKey, classification }, target, propertyKey);
  };
}

export function registerPiiEntity(
  entityName: string,
  fields: Record<string, PiiClassification>,
): void {
  const map = entityRegistry.get(entityName) ?? new Map<string, PiiClassification>();
  for (const [field, classification] of Object.entries(fields)) {
    map.set(field, classification);
  }
  entityRegistry.set(entityName, map);
}

export function getRegisteredPiiEntities(): Map<string, Map<string, PiiClassification>> {
  return entityRegistry;
}

export function getPiiFieldsForEntity(entityName: string): Record<string, PiiClassification> {
  const fields = entityRegistry.get(entityName);
  if (!fields) return {};
  return Object.fromEntries(fields.entries());
}

export function classifyRecord(
  entityName: string,
  record: Record<string, unknown>,
): Record<string, PiiClassification> {
  const fields = getPiiFieldsForEntity(entityName);
  const result: Record<string, PiiClassification> = {};
  for (const [field, classification] of Object.entries(fields)) {
    if (record[field] !== undefined && record[field] !== null) {
      result[field] = classification;
    }
  }
  return result;
}
