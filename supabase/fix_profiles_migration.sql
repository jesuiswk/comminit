-- Fix for missing profiles and foreign key constraint violation
-- Run this in Supabase SQL Editor with "No limit" selected

-- 1. Update the existing handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_value text;
BEGIN
  -- Extract username from raw_user_meta_data
  username_value := new.raw_user_meta_data->>'username';
  
  -- Check if username is provided
  IF username_value IS NULL OR trim(username_value) = '' THEN
    -- Fallback to email prefix if username is not provided
    username_value := split_part(new.email, '@', 1);
  END IF;
  
  -- Ensure username is unique by appending random number if needed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = username_value) THEN
    username_value := username_value || '_' || floor(random() * 10000)::text;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, username_value)
  ON CONFLICT (id) DO UPDATE
  SET username = excluded.username;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error and continue (don't block user creation)
    RAISE WARNING 'Failed to create profile for user %: %', new.id, sqlerrm;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the ensure_profiles_exist function for existing users
CREATE OR REPLACE FUNCTION public.ensure_profiles_exist()
RETURNS void AS $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN 
    SELECT 
      au.id, 
      au.email,
      COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username)
      VALUES (user_record.id, user_record.username)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'Failed to create profile for existing user %: %', user_record.id, sqlerrm;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run the function to create missing profiles for existing users
SELECT public.ensure_profiles_exist();

-- 4. Verify the fix
SELECT 
  'User counts:' as description,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
    THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '❌ SOME USERS ARE MISSING PROFILES'
  END as status;

-- 5. Show any remaining users without profiles (should be empty)
SELECT 
  au.id, 
  au.email, 
  au.created_at,
  'Missing profile' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;