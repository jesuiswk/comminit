-- Follows system for comminit
-- Creates the follows table and related functions

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Ensure a user can't follow themselves
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    
    -- Ensure unique follow relationships
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows table
CREATE POLICY "Users can view all follows"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own follows"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Function to toggle follow (follow/unfollow)
CREATE OR REPLACE FUNCTION public.toggle_follow(p_following_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_follower_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Get current user ID
    v_follower_id := auth.uid();
    
    -- Check if already following
    SELECT EXISTS (
        SELECT 1 FROM public.follows 
        WHERE follower_id = v_follower_id 
        AND following_id = p_following_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Unfollow
        DELETE FROM public.follows 
        WHERE follower_id = v_follower_id 
        AND following_id = p_following_id;
        RETURN FALSE;
    ELSE
        -- Follow
        INSERT INTO public.follows (follower_id, following_id)
        VALUES (v_follower_id, p_following_id);
        RETURN TRUE;
    END IF;
    
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to toggle follow: %', SQLERRM;
END;
$$;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION public.is_following(p_following_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_follower_id UUID;
    v_result BOOLEAN;
BEGIN
    v_follower_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM public.follows 
        WHERE follower_id = v_follower_id 
        AND following_id = p_following_id
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION public.get_follower_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.follows
    WHERE following_id = p_user_id;
    
    RETURN v_count;
END;
$$;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION public.get_following_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.follows
    WHERE follower_id = p_user_id;
    
    RETURN v_count;
END;
$$;

-- Function to get followers list (paginated)
CREATE OR REPLACE FUNCTION public.get_followers(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    follow_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        p.created_at,
        f.created_at as follow_created_at
    FROM public.follows f
    JOIN public.profiles p ON f.follower_id = p.id
    WHERE f.following_id = p_user_id
    ORDER BY f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get following list (paginated)
CREATE OR REPLACE FUNCTION public.get_following(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    follow_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        p.created_at,
        f.created_at as follow_created_at
    FROM public.follows f
    JOIN public.profiles p ON f.following_id = p.id
    WHERE f.follower_id = p_user_id
    ORDER BY f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get mutual follows
CREATE OR REPLACE FUNCTION public.get_mutual_follows(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        p.created_at
    FROM public.follows f1
    JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
    JOIN public.profiles p ON f1.following_id = p.id
    WHERE f1.follower_id = p_user_id
    AND f2.follower_id = p_user_id
    ORDER BY f1.created_at DESC;
END;
$$;

-- Create notification trigger for new follows
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Don't notify if user follows themselves (should be prevented by constraint)
    IF NEW.follower_id != NEW.following_id THEN
        PERFORM public.create_notification(
            NEW.following_id,
            'follow',
            'New follower',
            CONCAT('@', (SELECT username FROM public.profiles WHERE id = NEW.follower_id), ' started following you'),
            jsonb_build_object('follower_id', NEW.follower_id, 'follow_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for follow notifications
CREATE TRIGGER after_follow_insert
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_follow();

-- Add bio, website, location fields to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    
    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_updated_at();

-- Create view for user stats including follow counts
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.bio,
    p.website,
    p.location,
    COALESCE(followers.count, 0) as follower_count,
    COALESCE(following.count, 0) as following_count,
    COALESCE(posts.count, 0) as post_count,
    COALESCE(comments.count, 0) as comment_count
FROM public.profiles p
LEFT JOIN (
    SELECT following_id, COUNT(*) as count
    FROM public.follows
    GROUP BY following_id
) followers ON p.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as count
    FROM public.follows
    GROUP BY follower_id
) following ON p.id = following.follower_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.posts
    GROUP BY user_id
) posts ON p.id = posts.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.comments
    GROUP BY user_id
) comments ON p.id = comments.user_id;

-- Grant permissions
GRANT SELECT ON public.follows TO authenticated, anon;
GRANT INSERT, DELETE ON public.follows TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_follow TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_following TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follower_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_following_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_followers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_following TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_mutual_follows TO authenticated, anon;
GRANT SELECT ON public.user_stats TO authenticated, anon;

-- Add comment about the migration
COMMENT ON TABLE public.follows IS 'Tracks user follow relationships';
COMMENT ON COLUMN public.follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN public.follows.following_id IS 'The user being followed';
COMMENT ON COLUMN public.profiles.bio IS 'User biography';
COMMENT ON COLUMN public.profiles.website IS 'User website URL';
COMMENT ON COLUMN public.profiles.location IS 'User location';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of last profile update';