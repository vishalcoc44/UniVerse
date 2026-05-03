-- Run this script in your Supabase SQL Editor to retrieve Policy and Constraint details

-- 1. Get all RLS Policies
SELECT * FROM pg_policies;

-- 2. Get all Constraints (including Check constraints)
SELECT * FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- 3. Get all Triggers
SELECT * FROM information_schema.triggers
WHERE event_object_schema = 'public';

-- 4. Get Tables and Columns (Table Dump)
SELECT 
  table_schema, 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
-- 5. Get all Database Functions
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.prokind = 'a' THEN 'Aggregate (See pg_aggregate for details)'
    ELSE pg_get_functiondef(p.oid) 
  END as definition,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- 6. Get all Custom Types and Enums
SELECT 
  t.typname as type_name,
  e.enumlabel as enum_value
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;


-- 7. Get Storage Buckets
SELECT * FROM storage.buckets;
npm run update-schema
