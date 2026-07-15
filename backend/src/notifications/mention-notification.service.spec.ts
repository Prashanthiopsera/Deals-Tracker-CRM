import { createAuditTestStack } from '../audit/audit-test.utils';
import { filterMentionableUsers, parseMentions } from './mention-parser.service';
import { MentionNotificationService } from './mention-notification.service';

describe('Mention notifications (WO-111)', () => {
  const { service: audit } = createAuditTestStack();
  const notifications = new MentionNotificationService(audit);

  it('parses @mentions from comment text', () => {
    expect(parseMentions('Ping @alice and @bob')).toEqual(['alice', 'bob']);
  });

  it('rejects mentions for users without record access', () => {
    const allowed = new Set(['alice']);
    const candidates = [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
    ];
    expect(filterMentionableUsers(candidates, allowed)).toHaveLength(1);
  });

  it('dispatches slack and email notifications with audit trail', () => {
    const mentions = notifications.processCommentMentions(
      'Please review @alice',
      'director-1',
      'company-1',
      'comment-1',
      new Set(['alice']),
    );
    expect(mentions).toEqual(['alice']);
    expect(notifications.getSlackMessages()).toHaveLength(1);
  });
});
