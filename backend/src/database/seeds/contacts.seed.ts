export const contactsSeedSql = `
INSERT INTO contacts (first_name, last_name, email, pii_classification, company_id, created_by_id)
SELECT 'Alex', 'Founder', 'alex@nova.ai', 'confidential', c.id, u.id
FROM companies c
JOIN users u ON u.email = 'rls-director@test.p7vc.com'
WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'Blake', 'CTO', 'blake@nova.ai', 'restricted', c.id, u.id
FROM companies c
JOIN users u ON u.email = 'rls-director@test.p7vc.com'
WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'Casey', 'CEO', 'casey@greengrid.com', 'confidential', c.id, u.id
FROM companies c
JOIN users u ON u.email = 'rls-director@test.p7vc.com'
WHERE c.name = 'GreenGrid Energy';
`;

export const dsarDiscoverySql = `
SELECT id, first_name, last_name, email, company_id
FROM contacts
WHERE email = $1 AND deleted_at IS NULL;
`;
