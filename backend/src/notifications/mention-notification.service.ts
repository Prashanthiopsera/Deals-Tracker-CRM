import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { parseMentions } from './mention-parser.service';

export interface MentionNotificationPayload {
  mentionerId: string;
  mentionedUserId: string;
  companyId: string;
  commentId: string;
  body: string;
}

@Injectable()
export class MentionNotificationService {
  private readonly slackMessages: MentionNotificationPayload[] = [];
  private readonly emailMessages: MentionNotificationPayload[] = [];

  constructor(private readonly audit: AuditService) {}

  dispatch(payload: MentionNotificationPayload, channels: Array<'slack' | 'email'>): void {
    if (channels.includes('slack')) this.slackMessages.push(payload);
    if (channels.includes('email')) this.emailMessages.push(payload);
    this.audit.publishAuditEvent({
      actorId: payload.mentionerId,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Mention',
      resourceId: payload.commentId,
      metadata: {
        mentioned_user_id: payload.mentionedUserId,
        company_id: payload.companyId,
      },
    });
  }

  processCommentMentions(
    body: string,
    mentionerId: string,
    companyId: string,
    commentId: string,
    allowedUserIds: Set<string>,
  ): string[] {
    const mentions = parseMentions(body).filter((userId) => allowedUserIds.has(userId));
    for (const mentionedUserId of mentions) {
      this.dispatch(
        { mentionerId, mentionedUserId, companyId, commentId, body },
        ['slack', 'email'],
      );
    }
    return mentions;
  }

  getSlackMessages(): MentionNotificationPayload[] {
    return [...this.slackMessages];
  }
}
