-- Add notifications table for comminit
-- This migration adds a notifications system to support real-time user notifications

-- Notifications table
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  content text,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for notifications
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_created_at on notifications(created_at desc);
create index idx_notifications_read on notifications(read) where not read;

-- Trigger to update updated_at
create trigger update_notifications_updated_at
  before update on notifications
  for each row execute function update_updated_at_column();

-- RLS Policies for notifications
alter table notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

-- System can insert notifications for users
create policy "System can insert notifications"
  on notifications for insert with check (true);

-- Function to create notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text default null,
  p_data jsonb default null
)
returns uuid as $$
declare
  v_notification_id uuid;
begin
  insert into notifications (user_id, type, title, content, data)
  values (p_user_id, p_type, p_title, p_content, p_data)
  returning id into v_notification_id;
  
  return v_notification_id;
end;
$$ language plpgsql security definer;

-- Function to get unread notification count for a user
create or replace function public.get_unread_notification_count(p_user_id uuid)
returns integer as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from notifications
  where user_id = p_user_id and not read;
  
  return v_count;
end;
$$ language plpgsql security definer;

-- Function to mark notifications as read
create or replace function public.mark_notifications_as_read(p_user_id uuid, p_notification_ids uuid[] default null)
returns integer as $$
declare
  v_updated_count integer;
begin
  if p_notification_ids is null then
    -- Mark all notifications as read
    update notifications
    set read = true
    where user_id = p_user_id and not read
    returning count(*) into v_updated_count;
  else
    -- Mark specific notifications as read
    update notifications
    set read = true
    where user_id = p_user_id and id = any(p_notification_ids) and not read
    returning count(*) into v_updated_count;
  end if;
  
  return v_updated_count;
end;
$$ language plpgsql security definer;

-- Function to create comment notification
create or replace function public.create_comment_notification()
returns trigger as $$
declare
  v_post_author_id uuid;
  v_commenter_username text;
  v_post_title text;
begin
  -- Get post author and title
  select p.user_id, p.title, pr.username
  into v_post_author_id, v_post_title, v_commenter_username
  from posts p
  join profiles pr on pr.id = new.user_id
  where p.id = new.post_id;
  
  -- Don't notify if user is commenting on their own post
  if v_post_author_id != new.user_id then
    perform public.create_notification(
      v_post_author_id,
      'comment',
      'New comment on your post',
      format('%s commented on your post "%s"', v_commenter_username, v_post_title),
      jsonb_build_object(
        'post_id', new.post_id,
        'comment_id', new.id,
        'commenter_id', new.user_id,
        'commenter_username', v_commenter_username
      )
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for comment notifications
create trigger on_comment_created
  after insert on comments
  for each row execute procedure public.create_comment_notification();