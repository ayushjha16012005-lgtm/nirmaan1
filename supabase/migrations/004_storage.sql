-- ============================================================================
-- NIRMAAN MIGRATION 004: STORAGE BUCKETS AND ACCESS POLICIES
-- ============================================================================

-- 1. Create Buckets
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false)
on conflict (id) do update set public = false;

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- 2. Avatars Bucket Policies
drop policy if exists "Avatars are publicly viewable" on storage.objects;
create policy "Avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload and update their own avatar" on storage.objects;
create policy "Users can upload and update their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own avatar" on storage.objects;
create policy "Users can replace their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Proofs Bucket Policies (Strict job party confidentiality)
drop policy if exists "Job parties can view job proofs" on storage.objects;
create policy "Job parties can view job proofs"
  on storage.objects for select
  using (
    bucket_id = 'proofs' and
    exists (
      select 1 from public.jobs j
      where j.id::text = (storage.foldername(name))[1]
      and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Job parties can upload job proofs" on storage.objects;
create policy "Job parties can upload job proofs"
  on storage.objects for insert with check (
    bucket_id = 'proofs' and
    exists (
      select 1 from public.jobs j
      where j.id::text = (storage.foldername(name))[1]
      and (j.customer_id = auth.uid() or j.worker_id = auth.uid() or public.is_admin())
    )
  );

-- 4. Project Photos Bucket Policies
drop policy if exists "Project owners can view project photos" on storage.objects;
create policy "Project owners can view project photos"
  on storage.objects for select
  using (
    bucket_id = 'project-photos' and
    exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
      and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Project owners can upload project photos" on storage.objects;
create policy "Project owners can upload project photos"
  on storage.objects for insert with check (
    bucket_id = 'project-photos' and
    exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
      and (p.owner_id = auth.uid() or public.is_admin())
    )
  );
