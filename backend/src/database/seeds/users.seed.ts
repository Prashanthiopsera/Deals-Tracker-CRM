export const usersSeedSql = `
INSERT INTO users (email, display_name, full_name, role, status, auth0_sub, auth0_subject)
VALUES
  ('director@test.p7vc.com', 'Test Director', 'Test Director', 'Director', 'active', 'auth0|director-test', 'auth0|director-test'),
  ('principal@test.p7vc.com', 'Test Principal', 'Test Principal', 'Principal', 'active', 'auth0|principal-test', 'auth0|principal-test'),
  ('associate@test.p7vc.com', 'Test Associate', 'Test Associate', 'Associate', 'active', 'auth0|associate-test', 'auth0|associate-test'),
  ('intern@test.p7vc.com', 'Test Intern', 'Test Intern', 'Intern', 'active', 'auth0|intern-test', 'auth0|intern-test'),
  ('admin@test.p7vc.com', 'Test Admin', 'Test Admin', 'Admin', 'active', 'auth0|admin-test', 'auth0|admin-test')
ON CONFLICT (email) DO NOTHING;
`;
