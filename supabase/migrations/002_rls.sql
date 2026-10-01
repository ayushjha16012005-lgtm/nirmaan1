-- ============================================================================
-- NIRMAAN MIGRATION 002: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Enable RLS on all public tables
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.job_proofs enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_crew enable row level security;
alter table public.attendance enable row level security;
alter table public.materials enable row level security;
alter table public.expenses enable row level security;
alter table public.progress_entries enable row level security;
alter table public.content enable row level security;

-- ----------------------------------------------------------------------------
-- 1. App Settings
-- ----------------------------------------------------------------------------
drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings"
  on public.app_settings for select using (true);

drop policy if exists "Only admins can edit app settings" on public.app_settings;
create policy "Only admins can edit app settings"
  on public.app_settings for all using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. Profiles Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Public profiles are viewable by all users" on public.profiles;
create policy "Public profiles are viewable by all users"
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id or is_seed = true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete using (auth.uid() = id or public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Worker Profiles Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Worker profiles are discoverable by everyone" on public.worker_profiles;
create policy "Worker profiles are discoverable by everyone"
  on public.worker_profiles for select using (true);

drop policy if exists "Workers can insert their own profile" on public.worker_profiles;
create policy "Workers can insert their own profile"
  on public.worker_profiles for insert with check (auth.uid() = id or is_seed = true);

drop policy if exists "Workers can update their own profile" on public.worker_profiles;
create policy "Workers can update their own profile"
  on public.worker_profiles for update using (auth.uid() = id or public.is_admin());

drop policy if exists "Workers can delete their own profile" on public.worker_profiles;
create policy "Workers can delete their own profile"
  on public.worker_profiles for delete using (auth.uid() = id or public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Jobs Policies (Customer, Worker & Admin access)
-- ----------------------------------------------------------------------------
drop policy if exists "Parties and admins can view job details" on public.jobs;
create policy "Parties and admins can view job details"
  on public.jobs for select using (
    auth.uid() = customer_id or 
    auth.uid() = worker_id or 
    public.is_admin()
  );

drop policy if exists "Customers can create new jobs" on public.jobs;
create policy "Customers can create new jobs"
  on public.jobs for insert with check (
    auth.uid() = customer_id or 
    public.is_admin()
  );

drop policy if exists "Parties can update jobs" on public.jobs;
create policy "Parties can update jobs"
  on public.jobs for update using (
    auth.uid() = customer_id or 
    auth.uid() = worker_id or 
    public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 5. Job Events Policies (Append-only audit trail)
-- ----------------------------------------------------------------------------
drop policy if exists "Parties can view audit events for their jobs" on public.job_events;
create policy "Parties can view audit events for their jobs"
  on public.job_events for select using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Job parties can record events" on public.job_events;
create policy "Job parties can record events"
  on public.job_events for insert with check (
    actor_id = auth.uid()::text or 
    actor_id = 'system:demo-responder' or 
    public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 6. Job Proofs Policies (Strict photo confidentiality)
-- ----------------------------------------------------------------------------
drop policy if exists "Only job parties can view proofs" on public.job_proofs;
create policy "Only job parties can view proofs"
  on public.job_proofs for select using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Workers or customers on job can upload proofs" on public.job_proofs;
create policy "Workers or customers on job can upload proofs"
  on public.job_proofs for insert with check (
    auth.uid() = actor_id and
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Customers can approve or request retake on proofs" on public.job_proofs;
create policy "Customers can approve or request retake on proofs"
  on public.job_proofs for update using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or public.is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- 7. Payments Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Customer and Admin can view job payment records" on public.payments;
create policy "Customer and Admin can view job payment records"
  on public.payments for select using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Allow payment creation and updates" on public.payments;
create policy "Allow payment creation and updates"
  on public.payments for all using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or public.is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- 8. Reviews Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public"
  on public.reviews for select using (true);

drop policy if exists "Reviewer can submit review" on public.reviews;
create policy "Reviewer can submit review"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 9. Messages Policies (Chat thread confidentiality)
-- ----------------------------------------------------------------------------
drop policy if exists "Parties can read job messages" on public.messages;
create policy "Parties can read job messages"
  on public.messages for select using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Parties can send messages on active jobs" on public.messages;
create policy "Parties can send messages on active jobs"
  on public.messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.jobs j
      where j.id = job_id and (j.customer_id = auth.uid() or j.worker_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 10. Notifications Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Users can only see their own notifications" on public.notifications;
create policy "Users can only see their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "System and users can insert notifications" on public.notifications;
create policy "System and users can insert notifications"
  on public.notifications for insert with check (true);

-- ----------------------------------------------------------------------------
-- 11. PMS (Project Management System) Policies
-- ----------------------------------------------------------------------------
drop policy if exists "Owners have full access to their projects" on public.projects;
create policy "Owners have full access to their projects"
  on public.projects for all using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners have full access to project tasks" on public.project_tasks;
create policy "Owners have full access to project tasks"
  on public.project_tasks for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "Owners have full access to project crew" on public.project_crew;
create policy "Owners have full access to project crew"
  on public.project_crew for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "Owners have full access to attendance" on public.attendance;
create policy "Owners have full access to attendance"
  on public.attendance for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "Owners have full access to materials" on public.materials;
create policy "Owners have full access to materials"
  on public.materials for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "Owners have full access to expenses" on public.expenses;
create policy "Owners have full access to expenses"
  on public.expenses for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "Owners have full access to progress entries" on public.progress_entries;
create policy "Owners have full access to progress entries"
  on public.progress_entries for all using (
    exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

-- ----------------------------------------------------------------------------
-- 12. Content (Schemes & News)
-- ----------------------------------------------------------------------------
drop policy if exists "Content is public" on public.content;
create policy "Content is public"
  on public.content for select using (true);
