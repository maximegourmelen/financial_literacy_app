-- 1. Generate hashes locally:
--    npm run hash-password -- "your-password-here"
--
-- 2. Replace the placeholder hashes below.
-- 3. Run this SQL after schema.sql.

insert into public.app_users (username, password_hash, role, display_name)
values
  ('sibling-one', '<replace-with-scrypt-hash>', 'child', 'Sibling One'),
  ('sibling-two', '<replace-with-scrypt-hash>', 'child', 'Sibling Two'),
  ('parents-admin', '<replace-with-scrypt-hash>', 'admin', 'Parents Admin');
