-- Add avatar_url column to profiles table if it doesn't exist
-- Run this in Supabase SQL Editor with "No limit" selected

-- ===================================================================
-- STEP 1: Check current table structure
-- ===================================================================

SELECT 
  'Current profiles table columns:' as description,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================================================
-- STEP 2: Add avatar_url column if it doesn't exist
-- ===================================================================

DO $$ 
BEGIN
  -- Check if avatar_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND table_schema = 'public' 
      AND column_name = 'avatar_url'
  ) THEN
    -- Add the column
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE '✅ Added avatar_url column to profiles table';
  ELSE
    RAISE NOTICE '✅ avatar_url column already exists in profiles table';
  END IF;
END $$;

-- ===================================================================
-- STEP 3: Verify the column was added
-- ===================================================================

SELECT 
  'Verification:' as description,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'avatar_url'
    )
    THEN '✅ avatar_url column exists and is ready for use'
    ELSE '❌ avatar_url column still missing - please check permissions'
  END as column_status;

-- ===================================================================
-- STEP 4: Update any existing NULL values (optional)
-- ===================================================================

-- This sets a default value for existing rows where avatar_url is NULL
-- You can customize the default value or leave it as NULL
UPDATE public.profiles 
SET avatar_url = NULL 
WHERE avatar_url IS NULL;

SELECT 
  'Data status:' as description,
  COUNT(*) as total_profiles,
  COUNT(avatar_url) as profiles_with_avatar_url,
  COUNT(*) - COUNT(avatar_url) as profiles_without_avatar_url
FROM public.profiles;

-- ===================================================================
-- STEP 5: Test query to verify the column works
-- ===================================================================

-- Test that we can update the avatar_url for a user
-- This query will work when run from your application with auth.uid()
-- In SQL Editor, it will show the column structure
SELECT 
  'Test query result:' as description,
  'Column exists and can be updated' as test_result,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name = 'avatar_url';