-- Supabase Storage Setup for Profile Pictures
-- Run this in Supabase SQL Editor with "No limit" selected

-- ===================================================================
-- METHOD 1: SQL INSERT (might work with your permissions)
-- ===================================================================

-- Try this first. If you get "must be owner of table objects" error,
-- skip to METHOD 2 below (UI method).

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  false,
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify if the bucket was created
SELECT 
  'METHOD 1: SQL Insert Status:' as description,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures')
    THEN '✅ profile-pictures bucket created successfully!'
    ELSE '❌ Bucket creation failed - Use METHOD 2 (UI method) below'
  END as bucket_status;

-- ===================================================================
-- METHOD 2: SUPABASE DASHBOARD UI (Recommended if METHOD 1 fails)
-- ===================================================================

/*

STEP-BY-STEP UI INSTRUCTIONS:

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/pemmcbbjuerysbnufqwb

2. In the left sidebar, click on "Storage"

3. Click the "Create New Bucket" button

4. Configure the bucket:
   - Bucket Name: "profile-pictures" (exactly this name, lowercase with hyphen)
   - Public: ✅ CHECKED (this makes profile pictures publicly viewable)
   - File size limit: 5MB (5242880 bytes)
   - Allowed MIME types: Add the following types:
        • image/jpeg
        • image/png  
        • image/gif
        • image/webp
        • image/svg+xml

5. Click "Create Bucket"

6. Once created, click on your new "profile-pictures" bucket

7. Go to the "Policies" tab

8. Create the following policies (click "Create policy" for each):

   POLICY 1: Public read access
   - Policy name: "Public can view profile pictures"
   - Allowed operations: ✅ SELECT
   - Using expression: bucket_id = 'profile-pictures'

   POLICY 2: Authenticated users can upload
   - Policy name: "Authenticated users can upload profile pictures"
   - Allowed operations: ✅ INSERT
   - Using expression: 
        bucket_id = 'profile-pictures' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'avatars'
        AND (storage.filename(name) LIKE auth.uid() || '-%')

   POLICY 3: Users can update own files
   - Policy name: "Users can update own profile pictures"
   - Allowed operations: ✅ UPDATE
   - Using expression: 
        bucket_id = 'profile-pictures' 
        AND auth.role() = 'authenticated'
        AND (storage.filename(name) LIKE auth.uid() || '-%')

   POLICY 4: Users can delete own files
   - Policy name: "Users can delete own profile pictures"
   - Allowed operations: ✅ DELETE
   - Using expression: 
        bucket_id = 'profile-pictures' 
        AND auth.role() = 'authenticated'
        AND (storage.filename(name) LIKE auth.uid() || '-%')

9. Save all policies

10. Test the setup by uploading a profile picture in your app!

*/

-- ===================================================================
-- VERIFICATION QUERY (Run after setting up the bucket)
-- ===================================================================

SELECT 
  'Final Verification:' as description,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures')
    THEN '✅ Bucket exists and is ready for uploads!'
    ELSE '❌ Bucket not found - Please complete setup using METHOD 2'
  END as final_status;
