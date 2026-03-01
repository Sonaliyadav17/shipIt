-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('builder', 'investor')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Security
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Mock Projects table for stats queries (if you don't already have one)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  builder_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  status text not null check (status in ('Active', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Example Insert for testing stats (Optional):
-- INSERT INTO public.projects (builder_id, name, status) VALUES ('your-uuid-here', 'Project A', 'Completed');
-- INSERT INTO public.projects (builder_id, name, status) VALUES ('your-uuid-here', 'Project B', 'Active');
