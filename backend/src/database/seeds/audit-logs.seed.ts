export const auditLogsSeedSql = `
INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_state, after_state, changed_fields, metadata, timestamp)
SELECT u.id, 'create', 'company', c.id, NULL, jsonb_build_object('name', c.name), NULL, '{}'::jsonb, NOW() - INTERVAL '1 day'
FROM users u JOIN companies c ON c.name = 'Nova AI' WHERE u.email = 'rls-director@test.p7vc.com'
UNION ALL
SELECT u.id, 'update', 'company', c.id, jsonb_build_object('notes', 'old'), jsonb_build_object('notes', 'new'), ARRAY['notes'], '{}'::jsonb, NOW() - INTERVAL '2 days'
FROM users u JOIN companies c ON c.name = 'Nova AI' WHERE u.email = 'rls-director@test.p7vc.com'
UNION ALL
SELECT u.id, 'reassign', 'company', c.id, jsonb_build_object('deal_lead_id', u.id), jsonb_build_object('deal_lead_id', u.id), ARRAY['deal_lead_id'], '{}'::jsonb, NOW() - INTERVAL '3 days'
FROM users u JOIN companies c ON c.name = 'GreenGrid Energy' WHERE u.email = 'rls-director@test.p7vc.com'
UNION ALL
SELECT u.id, 'permission_denied', 'company', c.id, NULL, NULL, NULL, jsonb_build_object('cedar_action', 'delete'), NOW() - INTERVAL '4 hours'
FROM users u JOIN companies c ON c.name = 'Nova AI' WHERE u.email = 'rls-intern@test.p7vc.com'
UNION ALL
SELECT u.id, 'login', 'user', u.id, NULL, jsonb_build_object('status', 'active'), NULL, '{}'::jsonb, NOW() - INTERVAL '30 minutes'
FROM users u WHERE u.email = 'rls-director@test.p7vc.com'
UNION ALL
SELECT u.id, 'ai_retrieval', 'company', c.id, NULL, NULL, NULL, jsonb_build_object('prompt', 'summarize deck'), NOW() - INTERVAL '1 hour'
FROM users u JOIN companies c ON c.name = 'Nova AI' WHERE u.email = 'rls-director@test.p7vc.com';
`;
