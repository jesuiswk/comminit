-- Comminit Database Schema

-- Enable RLS
alter table auth.users enable row level security;

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments table
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();