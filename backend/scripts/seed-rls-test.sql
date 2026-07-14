-- RLS validation seed data (WO-019)
INSERT INTO users (email, full_name, role)
VALUES
  ('rls-director@test.p7vc.com', 'RLS Director', 'Director'),
  ('rls-intern@test.p7vc.com', 'RLS Intern', 'Intern')
ON CONFLICT (email) DO NOTHING;
