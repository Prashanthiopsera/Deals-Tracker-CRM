export const commentsSeedSql = `
WITH company AS (
  SELECT id FROM companies WHERE name = 'Nova AI' LIMIT 1
), author AS (
  SELECT id FROM users WHERE email = 'director@test.p7vc.com' LIMIT 1
), parent AS (
  INSERT INTO comments (body, record_type, record_id, user_id, mentions)
  SELECT 'Initial diligence note on Nova AI.', 'company', company.id, author.id, ARRAY[]::text[]
  FROM company, author
  RETURNING id
)
INSERT INTO comments (body, record_type, record_id, user_id, parent_comment_id, mentions)
SELECT 'Reply with @mention follow-up.', 'company', company.id, author.id, parent.id, ARRAY[author.id::text]
FROM company, author, parent;
`;
