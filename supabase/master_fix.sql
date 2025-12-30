-- Comprehensive Schema Fix for Academic Page
-- Generated after full audit of frontend requirements vs backend schema

-- 1. Profiles Table Updates
-- Ensure all columns used by frontend exist
alter table public."Profile" 
  add column if not exists "universityId" text,
  add column if not exists "universityName" text,
  add column if not exists "role" text default 'STUDENT';

-- 2. University Table (Implicitly required for 'universityId' FKs, created if missing)
create table if not exists public."University" (
  id text primary key,
  name text not null,
  location text,
  domain text
);

-- 3. Course Table (Core for Academic Resources)
create table if not exists public."Course" (
  id text primary key default gen_random_uuid()::text,
  code text not null,
  name text not null,
  "universityId" text references public."University"(id) on delete cascade
);

-- Ensure Course RLS
alter table public."Course" enable row level security;
drop policy if exists "Enable read access for all users" on public."Course";
create policy "Enable read access for all users" on public."Course" for select using (true);
drop policy if exists "Enable insert for admins" on public."Course";
create policy "Enable insert for admins" on public."Course" for insert 
with check ( exists ( select 1 from public."Profile" where id = auth.uid()::text and role = 'ADMIN' ) );

-- 4. Resource Table (For File Uploads)
create table if not exists public."Resource" (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text default 'NOTE',
  "fileUrl" text not null,
  "courseId" text references public."Course"(id) on delete cascade,
  "uploaderId" text references public."Profile"(id) on delete set null,
  upvotes int default 0,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure Resource RLS
alter table public."Resource" enable row level security;
drop policy if exists "Everyone can view resources" on public."Resource";
create policy "Everyone can view resources" on public."Resource" for select using (true);
drop policy if exists "Users can upload their own resources" on public."Resource";
create policy "Users can upload their own resources" on public."Resource" for insert 
with check ( auth.uid()::text = "uploaderId" );

-- 5. StudySession Table (For Focus Timer)
create table if not exists public."StudySession" (
  id uuid default gen_random_uuid() primary key,
  "userId" text references public."Profile"(id) on delete cascade not null,
  duration int not null, -- in seconds
  mode text not null, -- 'focus' or 'break'
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure StudySession RLS
alter table public."StudySession" enable row level security;
drop policy if exists "Users can manage their own sessions" on public."StudySession";
create policy "Users can manage their own sessions" on public."StudySession"
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- 6. Storage Bucket Verification
insert into storage.buckets (id, name, public)
values ('academic-resources', 'academic-resources', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to Academic Resources" on storage.objects;
create policy "Public Access to Academic Resources"
  on storage.objects for select
  using ( bucket_id = 'academic-resources' );

drop policy if exists "Authenticated Users can upload files" on storage.objects;
create policy "Authenticated Users can upload files"
  on storage.objects for insert
  with check ( bucket_id = 'academic-resources' and auth.role() = 'authenticated' );

-- 7. NOTIFY PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
