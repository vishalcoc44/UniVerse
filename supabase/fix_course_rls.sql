-- 1. Enable RLS on Course table (if not already)
alter table public."Course" enable row level security;

-- 2. Drop existing policies to avoid conflicts (optional but safer)
drop policy if exists "Enable read access for all users" on public."Course";
drop policy if exists "Enable insert for admins" on public."Course";

-- 3. Allow READ access for everyone (authenticated & anon)
create policy "Enable read access for all users"
on public."Course" for select
using (true);

-- 4. Allow INSERT access only for ADMINs
-- Checks if the current user's ID exists in the Profile table with role = 'ADMIN'
create policy "Enable insert for admins"
on public."Course" for insert
with check (
  exists (
    select 1 from public."Profile"
    where id = auth.uid()::text
    and role = 'ADMIN'
  )
);
