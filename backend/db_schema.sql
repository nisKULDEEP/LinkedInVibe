-- Create the scheduled_posts table
create table public.scheduled_posts (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  scheduled_time timestamp with time zone not null,
  auto_post boolean null default false,
  custom_instructions text null,
  status text not null default 'pending'::text,
  constraint scheduled_posts_pkey primary key (id)
) tablespace pg_default;

-- Enable Row Level Security (RLS)
alter table public.scheduled_posts enable row level security;

-- Create Policies
create policy "Users can view their own scheduled posts"
on public.scheduled_posts
for select
using ((select auth.uid()) = user_id);

create policy "Users can insert their own scheduled posts"
on public.scheduled_posts
for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their own scheduled posts"
on public.scheduled_posts
for update
using ((select auth.uid()) = user_id);

create policy "Users can delete their own scheduled posts"
on public.scheduled_posts
for delete
using ((select auth.uid()) = user_id);
