import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface CommentRecord {
  id: string;
  company_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CommentsService {
  private readonly comments = new Map<string, CommentRecord>();

  constructor(private readonly audit: AuditService) {}

  listByCompany(companyId: string): CommentRecord[] {
    return [...this.comments.values()]
      .filter((comment) => comment.company_id === companyId)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  }

  create(input: Omit<CommentRecord, 'id' | 'edited' | 'created_at' | 'updated_at'>): CommentRecord {
    const now = new Date().toISOString();
    const record: CommentRecord = {
      ...input,
      id: randomUUID(),
      edited: false,
      created_at: now,
      updated_at: now,
    };
    this.comments.set(record.id, record);
    this.audit.publishAuditEvent({
      actorId: input.user_id,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Comment',
      resourceId: record.id,
      metadata: { company_id: input.company_id },
    });
    return record;
  }

  edit(commentId: string, userId: string, body: string): CommentRecord {
    const existing = this.comments.get(commentId);
    if (!existing || existing.user_id !== userId) {
      throw new Error('Comment not found or not owned by user');
    }
    this.audit.publishAuditEvent({
      actorId: userId,
      actorRole: 'Director',
      operation: 'update',
      resourceType: 'Comment',
      resourceId: commentId,
      beforeState: { body: existing.body },
      afterState: { body },
    });
    const updated = { ...existing, body, edited: true, updated_at: new Date().toISOString() };
    this.comments.set(commentId, updated);
    return updated;
  }
}
