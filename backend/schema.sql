-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  -- Subscription Fields
  subscription_status text default 'free', -- 'active', 'past_due', 'canceled', 'free'
  stripe_customer_id text,
  credits int default 3, -- Free tier credits
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup
-- Automatically creates a profile entry when a new user signs up via Auth
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, subscription_status, credits)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'free', 3);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Scheduled Posts Table (Phase 4)
create table scheduled_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  scheduled_time timestamp with time zone not null,
  topic text not null,
  custom_instructions text,
  status text default 'pending', -- 'pending', 'posted', 'failed'
  auto_post boolean default false, -- User must explicitly opt-in
  
  -- Validation
  constraint scheduled_future_check check (scheduled_time > now())
);

-- RLS for Scheduled Posts
alter table scheduled_posts enable row level security;

create policy "Users can view own schedule"
  on scheduled_posts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own schedule"
  on scheduled_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own schedule"
  on scheduled_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own schedule"
  on scheduled_posts for delete
  using ( auth.uid() = user_id );
