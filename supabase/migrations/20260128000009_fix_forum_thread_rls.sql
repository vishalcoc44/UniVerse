-- Fix RLS policies for ForumThread
CREATE POLICY "Users can create threads" ON "ForumThread"
FOR INSERT WITH CHECK (
  auth.uid()::text = "authorId"
);

CREATE POLICY "Users can update their own threads" ON "ForumThread"
FOR UPDATE USING (
  auth.uid()::text = "authorId"
);

CREATE POLICY "Users can delete their own threads" ON "ForumThread"
FOR DELETE USING (
  auth.uid()::text = "authorId"
);
