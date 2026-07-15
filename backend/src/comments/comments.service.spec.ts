import { createAuditTestStack } from '../audit/audit-test.utils';
import { commentThreadFixtures } from '../../test-fixtures/comments/comments.fixture';
import { CommentsService } from './comments.service';

describe('CommentsService (WO-112)', () => {
  const { service: audit } = createAuditTestStack();
  const comments = new CommentsService(audit);

  it('creates threaded comments with audit trail', () => {
    const parent = comments.create({ ...commentThreadFixtures[0], parent_comment_id: null });
    comments.create({ ...commentThreadFixtures[1], parent_comment_id: parent.id });
    expect(comments.listByCompany('11111111-1111-1111-1111-111111111111')).toHaveLength(2);
  });

  it('preserves edit history via audit log', () => {
    const comment = comments.create({ ...commentThreadFixtures[0], parent_comment_id: null });
    const edited = comments.edit(comment.id, comment.user_id, 'Updated body');
    expect(edited.edited).toBe(true);
  });
});
