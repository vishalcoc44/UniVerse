---
agent: agent
---
# Supabase Schema Management Rules

1.  **Source of Truth:** Before proposing any SQL fixes, migrations, or queries, you MUST always reference the current schema definitions located in `supabase/current_schema/`.
    *   `tables_dump.json` (Table definitions)
    *   `All_Constraints.json` (Foreign Keys and Checks)
    *   `All_RLS_Policies.json` (Security Policies)
    *   `All_Triggers.json` (Database Triggers)
    *   `All_Functions.json` (Custom Functions)
    *   `All_Types.json` (Enum Types and Custom Types)
    *   `Storage_Buckets.json` (Storage Bucket Configurations)

2.  **Verify Before Fix:** Do not assume the state of the database. Check these files to see if a column, constraint, policy, function, type, or bucket already exists or conflicts with your proposed change.

