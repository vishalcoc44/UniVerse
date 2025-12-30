-- Fix: Add default value for Course ID
-- The error "null value in column id" happens because the table expects an ID but none is provided.
-- We fix this by telling the database to auto-generate one if it's missing.

-- 1. Alter the column to add a default value
-- We use gen_random_uuid()::text assuming the ID is of type TEXT.
-- If it's of type UUID, the ::text cast will be ignored or can be removed, but ::text is safer if unsure.

alter table public."Course"
alter column id set default gen_random_uuid()::text;

-- Verify the change (this is just a comment, running the above is enough)
-- Now when you insert { code: '...', name: '...' }, the DB will auto-fill 'id'.
