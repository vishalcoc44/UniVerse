-- Adds Company + University scoping to InterviewQuestion so admins can pool
-- a question under a real Company record and target it to one university.
--
-- Run once via the Supabase SQL editor (or `psql`).

-- 1. Add the foreign key columns. universityId NULL = visible to everyone
--    (preserves current behavior for existing rows).
ALTER TABLE "InterviewQuestion"
  ADD COLUMN IF NOT EXISTS "companyId" text REFERENCES "Company"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "universityId" text REFERENCES "University"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_InterviewQuestion_companyId" ON "InterviewQuestion"("companyId");
CREATE INDEX IF NOT EXISTS "idx_InterviewQuestion_universityId" ON "InterviewQuestion"("universityId");

-- 2. Replace the open SELECT policy with a scoped one.
--    Students can only see questions that are either global (universityId IS NULL)
--    or match their own university.
DROP POLICY IF EXISTS "Questions are publicly viewable" ON "InterviewQuestion";

CREATE POLICY "Questions visible by university scope"
  ON "InterviewQuestion"
  FOR SELECT
  TO authenticated
  USING (
    "universityId" IS NULL
    OR "universityId" = (
      SELECT p."universityId"
      FROM "Profile" p
      WHERE p.id = (auth.uid())::text
    )
  );

-- The "Platform admins manage interview questions" policy (cmd: ALL) remains
-- intact, so platform admins can still create/edit/delete any question.
