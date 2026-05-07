-- Adds a linkedinUrl column to the Profile table so users can link their LinkedIn profile.
-- Run once via the Supabase SQL editor (or `psql`).

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "linkedinUrl" text;
