-- Add likes system for posts and comments
-- This migration creates the likes table, RLS policies, and notification triggers

-- Likes table for posts and comments
CREATE TABLE IF NOT EXISTS likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure a like is either for a post OR a comment, not both
  CONSTRAINT like_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Prevent duplicate likes from same user on same target
  CONSTRAINT unique_like_per_user_target UNIQUE (user_id, post_id, comment_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Composite index for counting likes per post/comment
CREATE INDEX IF NOT EXISTS idx_likes_target_created_at ON likes(
  COALESCE(post_id, comment_id), 
  created_at DESC
);

-- RLS Policies for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (true);

-- Authenticated users can create their own likes
CREATE POLICY "Authenticated users can create likes"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- Function to get like count for a post or comment
CREATE OR REPLACE FUNCTION get_like_count(
  target_post_id uuid DEFAULT NULL,
  target_comment_id uuid DEFAULT NULL
)
RETURNS bigint AS $$
BEGIN
  IF target_post_id IS NOT NULL THEN
    RETURN (
      SELECT COUNT(*) 
      FROM likes 
      WHERE post_id = target_post_id
    );
  ELSIF target_comment_id IS NOT NULL THEN
    RETURN (
      SELECT COUNT(*) 
      FROM likes 
      WHERE comment_id = target_comment_id
    );
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if the current user has liked a post or comment
-- SECURITY FIX: Use auth.uid() internally instead of accepting user_id as parameter
CREATE OR REPLACE FUNCTION has_user_liked(
  p_post_id uuid DEFAULT NULL,
  p_comment_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_post_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM likes 
      WHERE user_id = current_user_id AND post_id = p_post_id
    );
  ELSIF p_comment_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM likes 
      WHERE user_id = current_user_id AND comment_id = p_comment_id
    );
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to create notification when a post is liked
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS trigger AS $$
DECLARE
  post_author_id uuid;
BEGIN
  -- Get the post author's ID
  SELECT user_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Only create notification if the liker is not the post author
  IF NEW.user_id != post_author_id THEN
    PERFORM create_notification(
      post_author_id,
      'like',
      'Someone liked your post',
      NULL,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'like_id', NEW.id,
        'liker_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when a comment is liked
CREATE OR REPLACE FUNCTION notify_on_comment_like()
RETURNS trigger AS $$
DECLARE
  comment_author_id uuid;
BEGIN
  -- Get the comment author's ID
  SELECT user_id INTO comment_author_id
  FROM comments
  WHERE id = NEW.comment_id;
  
  -- Only create notification if the liker is not the comment author
  IF NEW.user_id != comment_author_id THEN
    PERFORM create_notification(
      comment_author_id,
      'like',
      'Someone liked your comment',
      NULL,
      jsonb_build_object(
        'comment_id', NEW.comment_id,
        'post_id', (SELECT post_id FROM comments WHERE id = NEW.comment_id),
        'like_id', NEW.id,
        'liker_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for like notifications
DROP TRIGGER IF EXISTS after_post_like_insert ON likes;
CREATE TRIGGER after_post_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION notify_on_post_like();

DROP TRIGGER IF EXISTS after_comment_like_insert ON likes;
CREATE TRIGGER after_comment_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.comment_id IS NOT NULL)
  EXECUTE FUNCTION notify_on_comment_like();

-- Function to toggle a like (insert if not exists, delete if exists)
-- SECURITY FIX: Use auth.uid() internally instead of accepting p_user_id as parameter
-- This prevents users from liking on behalf of other users
CREATE OR REPLACE FUNCTION toggle_like(
  p_post_id uuid DEFAULT NULL,
  p_comment_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  existing_like_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to like';
  END IF;

  -- Check if like already exists
  IF p_post_id IS NOT NULL THEN
    SELECT id INTO existing_like_id
    FROM likes
    WHERE user_id = current_user_id AND post_id = p_post_id;
  ELSE
    SELECT id INTO existing_like_id
    FROM likes
    WHERE user_id = current_user_id AND comment_id = p_comment_id;
  END IF;
  
  -- If exists, delete it (unlike)
  IF existing_like_id IS NOT NULL THEN
    DELETE FROM likes WHERE id = existing_like_id;
    RETURN false; -- Unliked
  ELSE
    -- Insert new like
    INSERT INTO likes (user_id, post_id, comment_id)
    VALUES (current_user_id, p_post_id, p_comment_id);
    RETURN true; -- Liked
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to toggle like: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENT NOTIFICATION TRIGGER
-- Notifies post author when someone comments on their post
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS trigger AS $$
DECLARE
  post_author_id uuid;
  post_title text;
BEGIN
  -- Get the post author's ID and title
  SELECT user_id, title INTO post_author_id, post_title
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Only create notification if the commenter is not the post author
  IF NEW.user_id != post_author_id THEN
    PERFORM create_notification(
      post_author_id,
      'comment',
      'New comment on your post',
      LEFT(NEW.content, 100),
      jsonb_build_object(
        'post_id', NEW.post_id,
        'post_title', post_title,
        'comment_id', NEW.id,
        'commenter_id', NEW.user_id
      )
    );
  END IF;
  
  -- Also notify parent comment author if this is a reply
  IF NEW.parent_comment_id IS NOT NULL THEN
    DECLARE
      parent_author_id uuid;
    BEGIN
      SELECT user_id INTO parent_author_id
      FROM comments
      WHERE id = NEW.parent_comment_id;
      
      -- Notify parent comment author (unless they're the one replying or the post author)
      IF parent_author_id IS NOT NULL 
         AND parent_author_id != NEW.user_id 
         AND parent_author_id != post_author_id THEN
        PERFORM create_notification(
          parent_author_id,
          'reply',
          'Someone replied to your comment',
          LEFT(NEW.content, 100),
          jsonb_build_object(
            'post_id', NEW.post_id,
            'post_title', post_title,
            'comment_id', NEW.id,
            'parent_comment_id', NEW.parent_comment_id,
            'replier_id', NEW.user_id
          )
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS after_comment_insert ON comments;
CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE likes IS 'Likes system for posts and comments';
COMMENT ON COLUMN likes.post_id IS 'Post being liked (nullable if comment_id is set)';
COMMENT ON COLUMN likes.comment_id IS 'Comment being liked (nullable if post_id is set)';
COMMENT ON CONSTRAINT unique_like_per_user_target ON likes IS 'Prevents duplicate likes from same user on same target';
COMMENT ON FUNCTION get_like_count IS 'Returns like count for a post or comment';
COMMENT ON FUNCTION has_user_liked IS 'Checks if current user (auth.uid()) has liked a specific post or comment - secure, no user impersonation possible';
COMMENT ON FUNCTION toggle_like IS 'Toggles like status for current user (auth.uid()) - secure, no user impersonation possible';
COMMENT ON FUNCTION notify_on_comment IS 'Creates notification for post author and parent comment author when a comment is added';
