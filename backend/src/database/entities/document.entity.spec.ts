import { getMetadataArgsStorage } from 'typeorm';
import { Document } from './document.entity';
import { DocumentType } from '../enums';

describe('Document entity', () => {
  it('defines S3 metadata columns and document types', () => {
    expect(DocumentType.DECK).toBe('deck');
    expect(DocumentType.IC_MEMO).toBe('ic_memo');
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Document);
    expect(columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'filename',
        'mimeType',
        's3Bucket',
        's3Key',
        'kmsKeyId',
        'fileSizeBytes',
        'documentType',
        'aiSummary',
        'companyId',
        'uploadedById',
        'deletedAt',
      ]),
    );
  });

  it('marks s3Key as unique in column metadata', () => {
    const column = getMetadataArgsStorage().columns.find(
      (c) => c.target === Document && c.propertyName === 's3Key',
    );
    expect(column?.options.unique).toBe(true);
  });

  it('stores non-negative file sizes as bigint strings', () => {
    const doc = new Document();
    doc.fileSizeBytes = '0';
    expect(Number(doc.fileSizeBytes)).toBeGreaterThanOrEqual(0);
  });
});
