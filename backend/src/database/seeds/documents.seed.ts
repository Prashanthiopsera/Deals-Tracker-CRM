export const documentsSeedSql = `
INSERT INTO documents (filename, mime_type, s3_bucket, s3_key, kms_key_id, file_size_bytes, document_type, ai_summary, company_id, uploaded_by_id)
SELECT 'pitch-deck.pdf', 'application/pdf', 'p7vc-docs-dev', 'companies/nova-ai/pitch-deck.pdf', 'arn:aws:kms:us-east-1:123:key/nova', 1048576, 'deck', 'Series A robotics startup focused on warehouse automation.', c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'ic-memo.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'p7vc-docs-dev', 'companies/greengrid/ic-memo.docx', 'arn:aws:kms:us-east-1:123:key/green', 524288, 'ic_memo', NULL, c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'GreenGrid Energy'
UNION ALL
SELECT 'term-sheet.pdf', 'application/pdf', 'p7vc-docs-dev', 'companies/nova-ai/term-sheet.pdf', 'arn:aws:kms:us-east-1:123:key/nova', 262144, 'term_sheet', NULL, c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'financial-model.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'p7vc-docs-dev', 'companies/greengrid/financial-model.xlsx', 'arn:aws:kms:us-east-1:123:key/green', 2097152, 'financial_model', NULL, c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'GreenGrid Energy'
UNION ALL
SELECT 'investment-memo.pdf', 'application/pdf', 'p7vc-docs-dev', 'companies/nova-ai/investment-memo.pdf', 'arn:aws:kms:us-east-1:123:key/nova', 786432, 'memo', 'Strong team, large TAM, early revenue traction.', c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'Nova AI'
UNION ALL
SELECT 'data-room-index.pdf', 'application/pdf', 'p7vc-docs-dev', 'companies/greengrid/data-room-index.pdf', 'arn:aws:kms:us-east-1:123:key/green', 131072, 'other', NULL, c.id, u.id
FROM companies c JOIN users u ON u.email = 'rls-director@test.p7vc.com' WHERE c.name = 'GreenGrid Energy'
ON CONFLICT (s3_key) DO NOTHING;
`;
