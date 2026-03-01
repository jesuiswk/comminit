-- Comminit Database Schema

-- Enable RLS
alter table auth.users enable row level security;

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments table
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_comment_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for common query patterns
create index idx_posts_user_id on posts(user_id);
create index idx_posts_created_at on posts(created_at desc);
create index idx_posts_updated_at on posts(updated_at desc);
create index idx_comments_post_id on comments(post_id);
create index idx_comments_user_id on comments(user_id);
create index idx_comments_parent_id on comments(parent_comment_id) where parent_comment_id is not null;

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers to update updated_at on modification
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_posts_updated_at
  before update on posts
  for each row execute function update_updated_at_column();

create trigger update_comments_updated_at
  before update on comments
  for each row execute function update_updated_at_column();

-- RLS Policies

-- Profiles: users can read all, update own
alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Posts: users can read all, create/update/delete own
alter table posts enable row level security;

create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Authenticated users can create posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = user_id);

-- Comments: users can read all, create/update/delete own
alter table comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Authenticated users can create comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  username_value text;
begin
  -- Extract username from raw_user_meta_data
  username_value := new.raw_user_meta_data->>'username';
  
  -- Check if username is provided
  if username_value is null or trim(username_value) = '' then
    -- Fallback to email prefix if username is not provided
    username_value := split_part(new.email, '@', 1);
  end if;
  
  -- Ensure username is unique by appending random number if needed
  if exists (select 1 from public.profiles where username = username_value) then
    username_value := username_value || '_' || floor(random() * 10000)::text;
  end if;
  
  -- Insert profile
  insert into public.profiles (id, username)
  values (new.id, username_value)
  on conflict (id) do update
  set username = excluded.username;
  
  return new;
exception
  when others then
    -- Log error and continue (don't block user creation)
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to ensure profile exists for existing users (one-time fix)
create or replace function public.ensure_profiles_exist()
returns void as $$
declare
  user_record record;
begin
  for user_record in 
    select au.id, 
           coalesce(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username
    from auth.users au
    left join public.profiles p on au.id = p.id
    where p.id is null
  loop
    begin
      insert into public.profiles (id, username)
      values (user_record.id, user_record.username)
      on conflict (id) do nothing;
    exception
      when others then
        raise warning 'Failed to create profile for existing user %: %', user_record.id, sqlerrm;
    end;
  end loop;
end;
$$ language plpgsql security definer;
