# Fix for "posts_user_id_fkey" Foreign Key Constraint Violation

## Problem Analysis
The error occurs because the `posts` table has a foreign key constraint that references the `profiles(id)` column. When a user tries to create a post, their user ID must exist in the `profiles` table first.

## Root Causes
1. **Missing profiles for existing users**: Users created before the profile trigger was working don't have corresponding entries in the `profiles` table.
2. **Race condition in registration**: The profile creation trigger might fail silently, leaving users without profiles.

## Solutions Implemented

### 1. Database Schema Improvements
Updated `supabase/schema.sql` with:
- **Enhanced `handle_new_user()` function**: Better error handling, username fallback, and uniqueness checks
- **New `ensure_profiles_exist()` function**: One-time fix for existing users without profiles

### 2. Application-Level Safeguards
- **`usePosts.ts` composable**: Added `ensureUserProfile()` method that checks and creates profiles before post creation
- **`posts.ts` store**: Added profile validation in `createPost()` method
- **`pages/posts/new.vue`**: Added inline profile checking and creation in the form submission handler

## Steps to Apply Fix

### Option A: Run Database Migration (Recommended)
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Run the following SQL to create profiles for existing users:
   ```sql
   SELECT public.ensure_profiles_exist();
   ```
4. Verify profiles were created:
   ```sql
   SELECT COUNT(*) FROM auth.users;
   SELECT COUNT(*) FROM profiles;
   -- Both counts should match
   ```

### Option B: Manual Profile Creation
If you can't run the migration function, manually create profiles for existing users:
```sql
INSERT INTO profiles (id, username)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1))
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Testing the Fix

### 1. For Existing Users
1. Log in with an existing account
2. Try to create a new post
3. The system should automatically create a profile if missing
4. Post creation should succeed

### 2. For New Users
1. Register a new account
2. The profile should be created automatically via the trigger
3. Create a post immediately - should work without issues

## Fallback Mechanisms

The application now has three layers of protection:

1. **Database trigger**: Primary profile creation on user registration
2. **Composable check**: `usePosts.ensureUserProfile()` verifies profile exists
3. **Inline validation**: Direct profile check in the new post form

If post creation still fails, check the browser console for detailed error messages.

## Verification Commands

Run these SQL queries to verify the fix:

```sql
-- Check for users without profiles
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check profile counts
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM posts) as total_posts;

-- Test the ensure_profiles_exist function
SELECT * FROM public.ensure_profiles_exist();
```

## Common Issues

1. **Username conflicts**: The system now appends random numbers if usernames collide
2. **Email as username fallback**: If no username in metadata, uses email prefix
3. **User ID fallback**: If all else fails, uses `user_{id_prefix}` format

## Next Steps

1. ✅ Apply database migration (run `ensure_profiles_exist()`)
2. ✅ Test with existing user accounts
3. ✅ Test with new user registration
4. ✅ Monitor error logs for any remaining issues

The foreign key constraint violation should now be resolved through both preventive (better triggers) and corrective (profile validation) measures.