-- 1. Voting System
CREATE TABLE "ForumVote" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "threadId" TEXT REFERENCES "ForumThread"("id") ON DELETE CASCADE,
  "replyId" TEXT REFERENCES "ForumReply"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "value" INTEGER NOT NULL CHECK ("value" IN (1, -1)),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "one_vote_per_target" UNIQUE ("userId", "threadId", "replyId"),
  CONSTRAINT "either_thread_or_reply" CHECK (
    ("threadId" IS NOT NULL AND "replyId" IS NULL) OR
    ("threadId" IS NULL AND "replyId" IS NOT NULL)
  )
);

-- 2. Multi-tagging
ALTER TABLE "ForumThread" ADD COLUMN "tags" TEXT[] DEFAULT '{}';

-- 3. Polls
CREATE TABLE "ForumPoll" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "threadId" TEXT NOT NULL REFERENCES "ForumThread"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "ForumPollOption" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "pollId" TEXT NOT NULL REFERENCES "ForumPoll"("id") ON DELETE CASCADE,
  "optionText" TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE TABLE "ForumPollVote" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "optionId" TEXT NOT NULL REFERENCES "ForumPollOption"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("optionId", "userId") -- Simple version: one vote per user per option? No, usually one vote per poll.
);
-- Better unique constraint for poll:
ALTER TABLE "ForumPollVote" ADD COLUMN "pollId" TEXT REFERENCES "ForumPoll"("id") ON DELETE CASCADE;
ALTER TABLE "ForumPollVote" DROP CONSTRAINT IF EXISTS "ForumPollVote_optionId_userId_key";
ALTER TABLE "ForumPollVote" ADD CONSTRAINT "one_vote_per_poll" UNIQUE ("pollId", "userId");

-- 4. Reporting
CREATE TABLE "ForumReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "threadId" TEXT REFERENCES "ForumThread"("id") ON DELETE CASCADE,
  "replyId" TEXT REFERENCES "ForumReply"("id") ON DELETE CASCADE,
  "reporterId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    ("threadId" IS NOT NULL AND "replyId" IS NULL) OR
    ("threadId" IS NULL AND "replyId" IS NOT NULL)
  )
);

-- 5. Pinned Threads
ALTER TABLE "ForumThread" ADD COLUMN "isPinned" BOOLEAN DEFAULT FALSE;

-- 6. Thread Views
ALTER TABLE "ForumThread" ADD COLUMN "viewCount" INTEGER DEFAULT 0;

-- 8. Dynamic Anonymous Avatars
ALTER TABLE "ForumThread" ADD COLUMN "anonymousSeed" TEXT;
ALTER TABLE "ForumReply" ADD COLUMN "anonymousSeed" TEXT;

-- 9. Bookmarking
CREATE TABLE "ForumBookmark" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "threadId" TEXT NOT NULL REFERENCES "ForumThread"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("threadId", "userId")
);

-- 10. Rich content/Attachments
ALTER TABLE "ForumThread" ADD COLUMN "attachments" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "ForumReply" ADD COLUMN "attachments" JSONB DEFAULT '[]'::jsonb;

-- RLS POLICIES

-- ForumVote
ALTER TABLE "ForumVote" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all votes" ON "ForumVote" FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON "ForumVote" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can change their vote" ON "ForumVote" FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can remove their vote" ON "ForumVote" FOR DELETE USING (auth.uid()::text = "userId");

-- ForumPoll
ALTER TABLE "ForumPoll" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls are viewable by everyone" ON "ForumPoll" FOR SELECT USING (true);
CREATE POLICY "Thread authors can create polls" ON "ForumPoll" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "ForumThread" WHERE id = "threadId" AND "authorId" = auth.uid()::text)
);

-- ForumPollOption
ALTER TABLE "ForumPollOption" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Options are viewable by everyone" ON "ForumPollOption" FOR SELECT USING (true);
CREATE POLICY "Poll authors can create options" ON "ForumPollOption" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "ForumPoll" p JOIN "ForumThread" t ON p."threadId" = t.id WHERE p.id = "pollId" AND t."authorId" = auth.uid()::text)
);

-- ForumPollVote
ALTER TABLE "ForumPollVote" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are viewable by everyone" ON "ForumPollVote" FOR SELECT USING (true);
CREATE POLICY "Users can vote once per poll" ON "ForumPollVote" FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- ForumReport
ALTER TABLE "ForumReport" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view reports" ON "ForumReport" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Profile" WHERE id = auth.uid()::text AND role = 'ADMIN')
);
CREATE POLICY "Users can report content" ON "ForumReport" FOR INSERT WITH CHECK (auth.uid()::text = "reporterId");

-- ForumBookmark
ALTER TABLE "ForumBookmark" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookmarks" ON "ForumBookmark" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can bookmark threads" ON "ForumBookmark" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can remove bookmarks" ON "ForumBookmark" FOR DELETE USING (auth.uid()::text = "userId");
