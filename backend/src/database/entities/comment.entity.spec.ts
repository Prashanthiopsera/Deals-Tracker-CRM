import { getMetadataArgsStorage } from 'typeorm';
import { Comment } from './comment.entity';
import { CommentRecordType } from '../enums';

describe('Comment entity', () => {
  it('supports polymorphic record types', () => {
    expect(CommentRecordType.COMPANY).toBe('company');
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Comment);
    expect(columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['body', 'recordType', 'recordId', 'parentCommentId', 'mentions']),
    );
  });

  it('defines self-referencing parent comment relation', () => {
    const relations = getMetadataArgsStorage().relations.filter((r) => r.target === Comment);
    expect(relations.some((r) => r.propertyName === 'parentComment')).toBe(true);
  });
});
