-- 1. Create Resource Table (Corrected for TEXT IDs)
create table if not exists public."Resource" (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text default 'NOTE',
  "fileUrl" text not null,
  
  -- CHANGED: FKs are TEXT to match Profile.id and Course.id
  "courseId" text references public."Course"(id) on delete cascade not null,
  "uploaderId" text references public."Profile"(id) on delete set null,
  
  upvotes int default 0,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public."Resource" enable row level security;

-- 3. RLS Policies
-- Allow everyone to view resources
create policy "Everyone can view resources"
  on public."Resource" for select
  using ( true );

-- Allow authenticated users to upload resources (Fixed UUID casting)
create policy "Users can upload their own resources"
  on public."Resource" for insert
  with check ( auth.uid()::text = "uploaderId" );

-- 4. Storage Bucket Setup
insert into storage.buckets (id, name, public)
values ('academic-resources', 'academic-resources', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access to Academic Resources"
  on storage.objects for select
  using ( bucket_id = 'academic-resources' );

create policy "Authenticated Users can upload files"
  on storage.objects for insert
  with check ( bucket_id = 'academic-resources' and auth.role() = 'authenticated' );
