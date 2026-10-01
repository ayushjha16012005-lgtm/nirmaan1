-- ============================================================================
-- NIRMAAN MIGRATION 001: CORE DATABASE SCHEMA
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- App settings (runtime flags, e.g. demo_responder)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Initial default settings
insert into public.app_settings (key, value)
values ('demo_responder', 'false')
on conflict (key) do nothing;

-- 1. Profiles Table (All users: Customer, Kaarigar, Admin)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  phone text,
  full_name text not null,
  avatar_url text,
  active_role text not null default 'user' check (active_role in ('user', 'kaarigar', 'admin')),
  city text default 'Noida',
  sector text default 'Sector 62',
  lat double precision default 28.6280,
  lng double precision default 77.3649,
  is_admin boolean default false,
  is_seed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_active_role on public.profiles(active_role);
create index if not exists idx_profiles_is_seed on public.profiles(is_seed);
create index if not exists idx_profiles_phone on public.profiles(phone);

-- 2. Worker Profiles Table (Extended details for Kaarigars)
create table if not exists public.worker_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  trade text not null,
  trade_label text,
  headline text,
  experience_years integer not null default 3 check (experience_years >= 0 and experience_years <= 60),
  rate numeric(10,2) not null default 500 check (rate >= 0),
  rate_type text not null default 'day' check (rate_type in ('day', 'hour')),
  skills text[] default '{}',
  languages text[] default '{"Hindi"}',
  bio text,
  radius_km integer default 10 check (radius_km > 0),
  rating_avg numeric(3,2) default 4.80 check (rating_avg >= 1.0 and rating_avg <= 5.0),
  rating_count integer default 1 check (rating_count >= 0),
  jobs_completed integer default 0 check (jobs_completed >= 0),
  verified boolean default false,
  aadhaar_verified boolean default false,
  availability text default 'Available' check (availability in ('Available', 'Busy', 'Offline')),
  lat double precision default 28.6280,
  lng double precision default 77.3649,
  locality text default 'Noida Sector 62',
  is_seed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_worker_profiles_trade on public.worker_profiles(trade);
create index if not exists idx_worker_profiles_lat_lng on public.worker_profiles(lat, lng);
create index if not exists idx_worker_profiles_rating on public.worker_profiles(rating_avg desc);

-- 3. Jobs Table (Escrow and Job lifecycle)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  worker_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  trade text not null,
  address text not null,
  sector text,
  lat double precision default 28.6280,
  lng double precision default 77.3649,
  worker_lat double precision,
  worker_lng double precision,
  scheduled_for timestamptz default now(),
  days integer not null default 1 check (days >= 1),
  rate numeric(10,2) not null check (rate >= 0),
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'posted' check (status in (
    'posted', 'offered', 'accepted', 'on_the_way', 'arrived', 
    'in_progress', 'completed', 'approved', 'settled', 'cancelled', 'disputed'
  )),
  otp_hash text,
  escrow_status text default 'pending' check (escrow_status in (
    'pending', 'locked', 'captured', 'released', 'refunded', 'disputed'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_customer_id on public.jobs(customer_id);
create index if not exists idx_jobs_worker_id on public.jobs(worker_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);

-- 4. Job Events Table (Append-only immutable audit trail)
create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  actor_id text not null, -- profile UUID or 'system:demo-responder'
  event text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_job_events_job_id on public.job_events(job_id);

-- 5. Job Proofs Table (Arrival, Progress, Completion photos)
create table if not exists public.job_proofs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('arrival', 'completion', 'progress')),
  storage_path text not null,
  taken_at timestamptz default now(),
  lat double precision,
  lng double precision,
  distance_m numeric(10,2),
  sha256 text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'retake')),
  created_at timestamptz default now(),
  constraint unique_proof_hash_per_job unique (job_id, sha256)
);

create index if not exists idx_job_proofs_job_id on public.job_proofs(job_id);

-- 6. Payments Table (Razorpay Order / Ledger Tracking)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'created' check (status in (
    'created', 'authorized', 'captured', 'refunded', 'failed'
  )),
  mode text not null default 'test' check (mode in ('test', 'live')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_job_id on public.payments(job_id);
create index if not exists idx_payments_provider_order_id on public.payments(provider_order_id);

-- 7. Reviews Table (Ratings & Feedback)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  constraint unique_review_per_job_reviewer unique (job_id, reviewer_id)
);

create index if not exists idx_reviews_reviewee_id on public.reviews(reviewee_id);

-- 8. Messages Table (Job Chat Thread)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_messages_job_id on public.messages(job_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- 9. Notifications Table (User alerts & messages)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id, read_at);

-- 10. PMS (Project Management System) Tables
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  location text,
  progress_pct integer default 0 check (progress_pct >= 0 and progress_pct <= 100),
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists public.project_crew (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  worker_id uuid references public.profiles(id) on delete set null,
  role_name text not null,
  daily_wage numeric(10,2) not null check (daily_wage >= 0),
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  crew_id uuid references public.project_crew(id) on delete cascade not null,
  date date default current_date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'half_day')),
  created_at timestamptz default now(),
  constraint unique_crew_attendance_per_day unique (crew_id, date)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  item_name text not null,
  category text,
  used_qty numeric(10,2) not null default 0,
  total_qty numeric(10,2) not null check (total_qty > 0),
  unit text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  category text not null,
  amount numeric(10,2) not null check (amount >= 0),
  description text,
  receipt_url text,
  spent_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  step text not null,
  note text,
  photo_url text,
  completed boolean default false,
  created_at timestamptz default now()
);

-- 11. Genuine Welfare Schemes & News Content Table
create table if not exists public.content (
  id text primary key,
  type text not null check (type in ('scheme', 'news')),
  title_en text not null,
  title_hi text not null,
  desc_en text,
  desc_hi text,
  badge text,
  link text,
  tag text,
  published_at date default current_date
);
