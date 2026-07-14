export const activitiesSeedSql = `
INSERT INTO activities (type, subject, occurred_at, source, external_id, company_id, user_id)
SELECT 'email', 'Intro email', NOW() - INTERVAL '2 days', 'gmail', 'gmail-msg-1', c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'meeting', 'Partner sync', NOW() - INTERVAL '1 day', 'google_calendar', 'gcal-evt-1', c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'note', 'Manual note', NOW(), 'manual', NULL, c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'GreenGrid Energy';
`;
