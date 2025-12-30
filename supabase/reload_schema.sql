-- 1. Explicitly drop and recreate the constraints to ensure they are registered
-- (This step is technically redundant but helps 'wake up' the schema tracker if it missed the previous one)

alter table public."Resource" 
  drop constraint if exists "Resource_uploaderId_fkey";

alter table public."Resource" 
  add constraint "Resource_uploaderId_fkey" 
  foreign key ("uploaderId") 
  references public."Profile"(id) 
  on delete set null;

alter table public."Resource" 
  drop constraint if exists "Resource_courseId_fkey";

alter table public."Resource" 
  add constraint "Resource_courseId_fkey" 
  foreign key ("courseId") 
  references public."Course"(id) 
  on delete cascade;

-- 2. Force PostgREST schema cache reload
-- This is the critical command to make the API 'see' the new relationships
NOTIFY pgrst, 'reload config';
