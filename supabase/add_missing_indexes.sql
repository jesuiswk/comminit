-- Add missing database indexes for common query patterns
-- This migration improves performance for frequently used queries

-- 1. Index for posts search_vector (already added in full-text search migration)
-- CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(search_vector);

-- 2. Index for comments search_vector (already added in full-text search migration)
-- CREATE INDEX IF NOT EXISTS comments_search_idx ON comments USING GIN(search_vector);

-- 3. Composite index for posts ordering by created_at with user_id filter
-- This improves performance for user profile pages showing user's posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at 
ON posts(user_id, created_at DESC);

-- 4. Composite index for comments ordering by created_at with post_id filter
-- This improves performance for post detail pages showing comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at 
ON comments(post_id, created_at DESC);

-- 5. Index for notifications by user_id and read status
-- This improves performance for fetching unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
ON notifications(user_id, read) 
WHERE read = false;

-- 6. Index for notifications by user_id and created_at
-- This improves performance for notification pagination
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

-- 7. Index for profiles username for case-insensitive search
-- This improves performance for user search
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON profiles(LOWER(username));

-- 8. Index for posts title for case-insensitive search (fallback for non-full-text search)
CREATE INDEX IF NOT EXISTS idx_posts_title_lower 
ON posts(LOWER(title));

-- 9. Index for posts content for case-insensitive search (fallback for non-full-text search)
CREATE INDEX IF NOT EXISTS idx_posts_content_lower 
ON posts(LOWER(content));

-- 10. Index for comments content for case-insensitive search (fallback for non-full-text search)
CREATE INDEX IF NOT EXISTS idx_comments_content_lower 
ON comments(LOWER(content));

-- 11. Index for posts updated_at for sorting by last updated
CREATE INDEX IF NOT EXISTS idx_posts_updated_at_desc 
ON posts(updated_at DESC);

-- 12. Index for comments updated_at for sorting by last updated
CREATE INDEX IF NOT EXISTS idx_comments_updated_at_desc 
ON comments(updated_at DESC);

-- 13. Partial index for active posts (posts created in last 30 days)
-- This improves performance for recent posts queries
CREATE INDEX IF NOT EXISTS idx_posts_recent 
ON posts(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 14. Partial index for active comments (comments created in last 30 days)
CREATE INDEX IF NOT EXISTS idx_comments_recent 
ON comments(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 15. Index for posts with user_id and updated_at for user activity tracking
CREATE INDEX IF NOT EXISTS idx_posts_user_activity 
ON posts(user_id, updated_at DESC);

-- 16. Index for comments with user_id and updated_at for user activity tracking
CREATE INDEX IF NOT EXISTS idx_comments_user_activity 
ON comments(user_id, updated_at DESC);

-- Function to analyze table statistics after index creation
CREATE OR REPLACE FUNCTION analyze_tables_after_indexing()
RETURNS void AS $$
BEGIN
  ANALYZE profiles;
  ANALYZE posts;
  ANALYZE comments;
  ANALYZE notifications;
END;
$$ LANGUAGE plpgsql;

-- Run analysis to update query planner statistics
SELECT analyze_tables_after_indexing();

-- Add comments for documentation
COMMENT ON INDEX idx_posts_user_id_created_at IS 'Composite index for efficient user posts pagination';
COMMENT ON INDEX idx_comments_post_id_created_at IS 'Composite index for efficient post comments pagination';
COMMENT ON INDEX idx_notifications_user_id_read IS 'Partial index for efficient unread notifications query';
COMMENT ON INDEX idx_notifications_user_id_created_at IS 'Composite index for efficient notification pagination';
COMMENT ON INDEX idx_profiles_username_lower IS 'Index for case-insensitive username search';
COMMENT ON INDEX idx_posts_title_lower IS 'Index for case-insensitive post title search (fallback)';
COMMENT ON INDEX idx_posts_content_lower IS 'Index for case-insensitive post content search (fallback)';
COMMENT ON INDEX idx_comments_content_lower IS 'Index for case-insensitive comment content search (fallback)';
COMMENT ON INDEX idx_posts_recent IS 'Partial index for recent posts (last 30 days)';
COMMENT ON INDEX idx_comments_recent IS 'Partial index for recent comments (last 30 days)';
COMMENT ON INDEX idx_posts_user_activity IS 'Index for user activity tracking (posts)';
COMMENT ON INDEX idx_comments_user_activity IS 'Index for user activity tracking (comments)';