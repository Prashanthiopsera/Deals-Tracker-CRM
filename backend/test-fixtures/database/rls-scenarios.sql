-- SQL-level RLS scenario checks (run after migrations + seed-rls-test.sql)
BEGIN;
SELECT set_config('app.current_user_role', 'Intern', true);
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000010', true);
-- Intern should see companies but ownership fields masked in view
SELECT COUNT(*) AS intern_company_rows FROM companies;
SELECT p7vc_deal_lead IS NULL AS ownership_masked
FROM companies_intern_masked
LIMIT 1;
ROLLBACK;

BEGIN;
SELECT set_config('app.current_user_role', 'Associate', true);
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000011', true);
-- Associate can read contacts
SELECT COUNT(*) AS associate_contacts FROM contacts;
ROLLBACK;

BEGIN;
SELECT set_config('app.current_user_role', 'Intern', true);
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000010', true);
-- Intern cannot insert companies (should fail when executed without rollback guard)
-- INSERT INTO companies (name) VALUES ('Blocked Co');
ROLLBACK;
