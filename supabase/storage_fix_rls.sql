-- Fix RLS Policies for Profile Picture Uploads
-- Run this in Supabase SQL Editor with "No limit" selected

-- ===================================================================
-- STEP 1: Check current storage setup
-- ===================================================================

SELECT 
  'Current Storage Status:' as description,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures')
    THEN '✅ profile-pictures bucket exists'
    ELSE '❌ profile-pictures bucket missing'
  END as bucket_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage')
    THEN '✅ storage.objects table exists'
    ELSE '❌ storage.objects table missing'
  END as table_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND rowsecurity = true
    )
    THEN '✅ RLS is enabled on storage.objects'
    ELSE '❌ RLS is NOT enabled on storage.objects'
  END as rls_status;

-- ===================================================================
-- STEP 2: Create bucket if it doesn't exist (try with permissions)
-- ===================================================================

DO $$ 
BEGIN
  -- Try to create the bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures') THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
      'profile-pictures',
      'profile-pictures',
      true,
      false,
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
    
    RAISE NOTICE '✅ Created profile-pictures bucket';
  ELSE
    RAISE NOTICE '✅ profile-pictures bucket already exists';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Could not create bucket: %', SQLERRM;
    RAISE NOTICE '   Please create the bucket manually via Supabase UI:';
    RAISE NOTICE '   1. Go to Storage';
    RAISE NOTICE '   2. Click "Create New Bucket"';
    RAISE NOTICE '   3. Name: profile-pictures';
    RAISE NOTICE '   4. Public: ON';
    RAISE NOTICE '   5. File size limit: 5MB';
END $$;

-- ===================================================================
-- STEP 3: Enable RLS on storage.objects if not already enabled
-- ===================================================================

DO $$ 
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND rowsecurity = true
  ) THEN
    -- Try to enable RLS
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Enabled RLS on storage.objects';
  ELSE
    RAISE NOTICE '✅ RLS is already enabled on storage.objects';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Could not enable RLS: %', SQLERRM;
END $$;

-- ===================================================================
-- STEP 4: Drop existing policies to avoid conflicts
-- ===================================================================

DO $$ 
BEGIN
  -- Drop existing policies for the profile-pictures bucket
  EXECUTE 'DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects';
  RAISE NOTICE '✅ Cleared existing policies';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '✅ No existing policies to clear (or permission error)';
END $$;

-- ===================================================================
-- STEP 5: Create SIMPLIFIED policies for testing
-- ===================================================================

-- Policy 1: Allow public read access (so profile pictures are publicly viewable)
CREATE POLICY IF NOT EXISTS "Public can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Policy 2: Allow ANY authenticated user to upload ANY file to this bucket
-- This is permissive for testing - we'll restrict it later
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to profile-pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update any file in the bucket (temporary for testing)
CREATE POLICY IF NOT EXISTS "Authenticated users can update files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow users to delete any file in the bucket (temporary for testing)
CREATE POLICY IF NOT EXISTS "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

RAISE NOTICE '✅ Created simplified policies for testing';

-- ===================================================================
-- STEP 6: Verify the setup
-- ===================================================================

SELECT 
  'Verification Results:' as description,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'profile-pictures') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') as total_policies,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload to profile-pictures'
    )
    THEN '✅ INSERT policy exists'
    ELSE '❌ INSERT policy missing'
  END as insert_policy_status;

-- ===================================================================
-- STEP 7: Test query to verify authentication
-- ===================================================================

-- This query shows what auth.uid() would return for the current session
-- In Supabase SQL Editor, this will show NULL (no authenticated user)
-- But when your app makes requests, auth.uid() will return the user's ID
SELECT 
  'Authentication Info:' as description,
  current_user as current_db_user,
  auth.uid() as auth_uid,
  auth.role() as auth_role,
  CASE 
    WHEN auth.role() = 'authenticated' THEN '✅ Appears authenticated'
    WHEN auth.role() = 'anon' THEN '⚠️  Anonymous user (using anon key)'
    ELSE '❌ Unknown auth state'
  END as auth_status;

-- ===================================================================
-- STEP 8: Next steps after successful uploads
-- ===================================================================

/*
AFTER YOU CAN SUCCESSFULLY UPLOAD PROFILE PICTURES:

1. Run this SQL to create more secure policies:

-- Delete the permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload to profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Create secure policies
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.filename(name) LIKE auth.uid() || '-%')
);

CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid() || '-%')
);

CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid() || '-%')
);

2. Test that uploads still work with the more restrictive policies.
*/