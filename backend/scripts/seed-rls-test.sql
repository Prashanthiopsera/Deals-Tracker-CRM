-- RLS validation seed data for all CRM tables (WO-026)
INSERT INTO users (email, full_name, role)
VALUES
  ('rls-director@test.p7vc.com', 'RLS Director', 'Director'),
  ('rls-principal@test.p7vc.com', 'RLS Principal', 'Principal'),
  ('rls-associate@test.p7vc.com', 'RLS Associate', 'Associate'),
  ('rls-intern@test.p7vc.com', 'RLS Intern', 'Intern')
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, p7vc_deal_lead, deal_lead_support_1, deal_lead_support_2)
SELECT 'RLS Test Co', u.id, u.id, u.id
FROM users u
WHERE u.email = 'rls-director@test.p7vc.com'
ON CONFLICT DO NOTHING;

INSERT INTO contacts (company_id, full_name, email, is_primary)
SELECT c.id, 'Primary Contact', 'contact@rls-test.com', TRUE
FROM companies c
WHERE c.name = 'RLS Test Co'
ON CONFLICT DO NOTHING;

INSERT INTO activities (company_id, activity_type, subject, created_by)
SELECT c.id, 'call', 'Intro call', u.id
FROM companies c
JOIN users u ON u.email = 'rls-director@test.p7vc.com'
WHERE c.name = 'RLS Test Co'
ON CONFLICT DO NOTHING;

INSERT INTO documents (company_id, file_name, s3_key, uploaded_by)
SELECT c.id, 'pitch-deck.pdf', 's3://test/pitch-deck.pdf', u.id
FROM companies c
JOIN users u ON u.email = 'rls-director@test.p7vc.com'
WHERE c.name = 'RLS Test Co'
ON CONFLICT DO NOTHING;
