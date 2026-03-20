-- Add post categories support
-- This adds a category column to posts table and functions to manage categories

-- Add category column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category text;

-- Add index for category to improve query performance
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category) WHERE category IS NOT NULL;

-- Add index for category + draft status for filtering
CREATE INDEX IF NOT EXISTS idx_posts_category_draft ON posts(category, draft) WHERE category IS NOT NULL AND draft = false;

-- Function to get all unique categories (for dropdown/selector)
CREATE OR REPLACE FUNCTION get_post_categories()
RETURNS TABLE (
  category text,
  post_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(*)::bigint as post_count
  FROM posts p
  WHERE p.category IS NOT NULL
    AND p.draft = false  -- Only count published posts
  GROUP BY p.category
  ORDER BY post_count DESC, category ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get posts by category with pagination
CREATE OR REPLACE FUNCTION get_posts_by_category(
  p_category text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  draft boolean,
  category text,
  author_id uuid,
  author_username text,
  author_avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.created_at,
    p.updated_at,
    p.draft,
    p.category,
    pr.id as author_id,
    pr.username as author_username,
    pr.avatar_url as author_avatar_url
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.category = p_category
    AND p.draft = false  -- Only published posts
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count posts by category
CREATE OR REPLACE FUNCTION count_posts_by_category(
  p_category text
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM posts
  WHERE category = p_category
    AND draft = false;  -- Only published posts
  
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular categories (most used categories)
CREATE OR REPLACE FUNCTION get_popular_categories(
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  category text,
  post_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(*)::bigint as post_count
  FROM posts p
  WHERE p.category IS NOT NULL
    AND p.draft = false  -- Only published posts
  GROUP BY p.category
  ORDER BY post_count DESC, category ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing posts view to include category
-- Note: This assumes the view exists; if not, it will be created
CREATE OR REPLACE VIEW post_reaction_stats AS
SELECT 
  p.id as post_id,
  p.title,
  p.user_id as post_author_id,
  p.category,
  COALESCE(r.reaction_type, 'like') as reaction_type,
  COUNT(r.id) as reaction_count,
  ARRAY_AGG(DISTINCT r.user_id) as user_ids
FROM posts p
LEFT JOIN reactions r ON p.id = r.post_id
WHERE p.draft = false  -- Only published posts
GROUP BY p.id, p.title, p.user_id, p.category, r.reaction_type;

-- Common categories for suggestions (can be extended)
-- These are just suggestions, users can enter any category they want
INSERT INTO posts (id, user_id, title, content, created_at, draft, category)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Example Post for ' || category_name,
  'This is an example post in the ' || category_name || ' category.',
  NOW() - (random() * interval '30 days'),
  false,
  category_name
FROM (VALUES 
  ('General'),
  ('Technology'),
  ('Programming'),
  ('Design'),
  ('Business'),
  ('Science'),
  ('Education'),
  ('Entertainment'),
  ('Health'),
  ('Sports')
) AS categories(category_name)
WHERE NOT EXISTS (
  SELECT 1 FROM posts WHERE category = category_name LIMIT 1
)
LIMIT 10;

-- Note: RLS policies already allow users to insert/update posts with category
-- No additional RLS policies needed since category is just another column in posts table