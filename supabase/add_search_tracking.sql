-- Add search tracking table for trending searches
-- This table tracks search queries to provide trending/popular search terms

-- Create search_queries table to track search frequency
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  search_type text NOT NULL DEFAULT 'posts', -- 'posts', 'users', 'comments', or 'all'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for query text for faster lookups
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
-- Add index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
-- Add index for user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on modification
CREATE TRIGGER update_search_queries_updated_at
  BEFORE UPDATE ON search_queries
  FOR EACH ROW EXECUTE FUNCTION update_search_queries_updated_at();

-- RLS Policies for search_queries
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Everyone can read search queries (for trending searches)
CREATE POLICY "Search queries are viewable by everyone"
  ON search_queries FOR SELECT USING (true);

-- Authenticated users can insert their own search queries
CREATE POLICY "Authenticated users can insert search queries"
  ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own search queries (though unlikely to be used)
CREATE POLICY "Users can update own search queries"
  ON search_queries FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own search queries
CREATE POLICY "Users can delete own search queries"
  ON search_queries FOR DELETE USING (auth.uid() = user_id);

-- Function to log a search query
CREATE OR REPLACE FUNCTION log_search_query(
  p_query text,
  p_user_id uuid DEFAULT NULL,
  p_search_type text DEFAULT 'posts'
)
RETURNS uuid AS $$
DECLARE
  v_search_id uuid;
BEGIN
  -- Insert the search query
  INSERT INTO search_queries (query, user_id, search_type)
  VALUES (p_query, p_user_id, p_search_type)
  RETURNING id INTO v_search_id;
  
  RETURN v_search_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return NULL
    RAISE WARNING 'Failed to log search query: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending searches (most popular queries in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit integer DEFAULT 10,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  query text,
  search_count bigint,
  last_searched timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sq.query,
    COUNT(*)::bigint as search_count,
    MAX(sq.created_at) as last_searched
  FROM search_queries sq
  WHERE sq.created_at >= NOW() - (p_days || ' days')::interval
    AND LENGTH(TRIM(sq.query)) > 0
  GROUP BY sq.query
  ORDER BY search_count DESC, last_searched DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending searches by type
CREATE OR REPLACE FUNCTION get_trending_searches_by_type(
  p_search_type text,
  p_limit integer DEFAULT 10,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  query text,
  search_count bigint,
  last_searched timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sq.query,
    COUNT(*)::bigint as search_count,
    MAX(sq.created_at) as last_searched
  FROM search_queries sq
  WHERE sq.created_at >= NOW() - (p_days || ' days')::interval
    AND LENGTH(TRIM(sq.query)) > 0
    AND sq.search_type = p_search_type
  GROUP BY sq.query
  ORDER BY search_count DESC, last_searched DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent searches
CREATE OR REPLACE FUNCTION get_user_recent_searches(
  p_user_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  query text,
  search_type text,
  searched_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sq.query,
    sq.search_type,
    sq.created_at as searched_at
  FROM search_queries sq
  WHERE sq.user_id = p_user_id
    AND LENGTH(TRIM(sq.query)) > 0
  ORDER BY sq.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear old search queries (for data retention)
CREATE OR REPLACE FUNCTION clear_old_search_queries(
  p_days_to_keep integer DEFAULT 90
)
RETURNS bigint AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  DELETE FROM search_queries
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::interval
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;