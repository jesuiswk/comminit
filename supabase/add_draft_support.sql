-- Add draft support for posts
-- This adds a draft column to posts table and functions to manage drafts

-- Add draft column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS draft boolean DEFAULT false;

-- Add index for draft posts to improve query performance
CREATE INDEX IF NOT EXISTS idx_posts_draft ON posts(draft) WHERE draft = true;

-- Add index for user's draft posts
CREATE INDEX IF NOT EXISTS idx_posts_user_draft ON posts(user_id, draft) WHERE draft = true;

-- Function to save a post as draft
CREATE OR REPLACE FUNCTION save_post_as_draft(
  p_title text,
  p_content text,
  p_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_post_id uuid;
BEGIN
  -- Insert the post as a draft
  INSERT INTO posts (title, content, user_id, draft)
  VALUES (p_title, p_content, p_user_id, true)
  RETURNING id INTO v_post_id;
  
  RETURN v_post_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to save draft: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a draft post
CREATE OR REPLACE FUNCTION update_draft_post(
  p_post_id uuid,
  p_title text,
  p_content text,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Update the draft post
  UPDATE posts
  SET 
    title = p_title,
    content = p_content,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_post_id
    AND user_id = p_user_id
    AND draft = true;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update draft: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to publish a draft (convert draft to published post)
CREATE OR REPLACE FUNCTION publish_draft(
  p_post_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Update the post to mark it as published (draft = false)
  UPDATE posts
  SET 
    draft = false,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_post_id
    AND user_id = p_user_id
    AND draft = true;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to publish draft: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's draft posts
CREATE OR REPLACE FUNCTION get_user_drafts(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    p.updated_at
  FROM posts p
  WHERE p.user_id = p_user_id
    AND p.draft = true
  ORDER BY p.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count user's draft posts
CREATE OR REPLACE FUNCTION count_user_drafts(
  p_user_id uuid
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM posts
  WHERE user_id = p_user_id
    AND draft = true;
  
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a draft post
CREATE OR REPLACE FUNCTION delete_draft(
  p_post_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Delete the draft post
  DELETE FROM posts
  WHERE id = p_post_id
    AND user_id = p_user_id
    AND draft = true;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to delete draft: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-delete old drafts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_drafts(
  p_days_to_keep integer DEFAULT 30
)
RETURNS bigint AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  DELETE FROM posts
  WHERE draft = true
    AND updated_at < NOW() - (p_days_to_keep || ' days')::interval
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to include draft posts
-- Users can only see their own draft posts, but everyone can see published posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- New policy: Published posts are viewable by everyone
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (draft = false);

-- Policy: Users can see their own draft posts
CREATE POLICY "Users can see own draft posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id AND draft = true);

-- Policy: Users can create draft posts
CREATE POLICY "Authenticated users can create draft posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own draft posts
CREATE POLICY "Users can update own draft posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id AND draft = true);

-- Policy: Users can delete their own draft posts
CREATE POLICY "Users can delete own draft posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id AND draft = true);

-- Note: Existing policies for published posts remain unchanged
-- Users can update/delete their own published posts (these policies already exist)