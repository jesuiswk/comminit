-- Add full-text search support for posts
-- This migration adds tsvector column and GIN index for efficient text search

-- Add search_vector column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(search_vector);

-- Add search_vector column to comments table for comment search
ALTER TABLE comments ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED;

-- Create GIN index for comments
CREATE INDEX IF NOT EXISTS comments_search_idx ON comments USING GIN(search_vector);

-- Function to search posts with full-text search
CREATE OR REPLACE FUNCTION search_posts_fulltext(
  search_query text,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  search_rank real,
  total_count bigint
) AS $$
DECLARE
  offset_val integer;
BEGIN
  offset_val := (page_number - 1) * page_size;
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      p.*,
      ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) as rank
    FROM posts p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC, p.created_at DESC
  ),
  total AS (
    SELECT COUNT(*) as count FROM search_results
  )
  SELECT 
    sr.id,
    sr.user_id,
    sr.title,
    sr.content,
    sr.created_at,
    sr.updated_at,
    sr.rank as search_rank,
    t.count as total_count
  FROM search_results sr
  CROSS JOIN total t
  ORDER BY sr.rank DESC, sr.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search comments with full-text search
CREATE OR REPLACE FUNCTION search_comments_fulltext(
  search_query text,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  post_id uuid,
  user_id uuid,
  parent_comment_id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  search_rank real,
  total_count bigint
) AS $$
DECLARE
  offset_val integer;
BEGIN
  offset_val := (page_number - 1) * page_size;
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      c.*,
      ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)) as rank
    FROM comments c
    WHERE c.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC, c.created_at DESC
  ),
  total AS (
    SELECT COUNT(*) as count FROM search_results
  )
  SELECT 
    sr.id,
    sr.post_id,
    sr.user_id,
    sr.parent_comment_id,
    sr.content,
    sr.created_at,
    sr.updated_at,
    sr.rank as search_rank,
    t.count as total_count
  FROM search_results sr
  CROSS JOIN total t
  ORDER BY sr.rank DESC, sr.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update existing posts and comments to populate search_vector
-- This will trigger the generated column to be populated
UPDATE posts SET title = title WHERE true;
UPDATE comments SET content = content WHERE true;

-- Add comment about the migration
COMMENT ON COLUMN posts.search_vector IS 'Full-text search vector for title and content (title weighted higher)';
COMMENT ON COLUMN comments.search_vector IS 'Full-text search vector for comment content';
COMMENT ON INDEX posts_search_idx IS 'GIN index for fast full-text search on posts';
COMMENT ON INDEX comments_search_idx IS 'GIN index for fast full-text search on comments';