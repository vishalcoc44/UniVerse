-- 1. Fix Profile RLS (Ensure users can READ their own profile to check role)
alter table public."Profile" enable row level security;

drop policy if exists "Users can view own profile" on public."Profile";
create policy "Users can view own profile"
on public."Profile" for select
using ( auth.uid()::text = id );

-- 2. Fix Course RLS (Re-apply the ADMIN check)
alter table public."Course" enable row level security;

drop policy if exists "Enable insert for admins" on public."Course";
create policy "Enable insert for admins"
on public."Course" for insert
with check (
  exists (
    select 1 from public."Profile"
    where id = auth.uid()::text
    and role = 'ADMIN' 
  )
);

-- 3. Utility: Function to PROMOTE yourself to Admin (Run `select public.make_me_admin();`)
create or replace function public.make_me_admin()
returns text
language plpgsql
security definer -- Bypasses RLS to ensure update works
as $$
begin
  update public."Profile"
  set role = 'ADMIN'
  where id = auth.uid()::text;
  
  return 'Success: You are now an ADMIN. Try adding a course.';
end;
$$;

-- 4. Utility: Check if you are Admin (Run `select public.am_i_admin();`)
create or replace function public.am_i_admin()
returns boolean
language plpgsql
security definer
as $$
declare
  is_admin boolean;
begin
  select (role = 'ADMIN') into is_admin
  from public."Profile"
  where id = auth.uid()::text;
  
  return coalesce(is_admin, false);
end;
$$;
