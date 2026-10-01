-- ============================================================================
-- NIRMAAN MIGRATION 003: CONSTRAINED FUNCTIONS, RPCS & TRIGGERS
-- ============================================================================

-- 1. Automatic updated_at Trigger Function
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 2. Nearby Workers Spatial Haversine Query Function
create or replace function public.nearby_workers(
  lat double precision,
  lng double precision,
  radius_km double precision default 10.0,
  trade_filter text default 'all',
  min_rating double precision default 0.0,
  only_available boolean default false,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  id uuid,
  name text,
  phone text,
  avatar text,
  trade text,
  trade_label text,
  role text,
  experience integer,
  rate numeric,
  rate_type text,
  rating numeric,
  rating_count integer,
  jobs_completed integer,
  distance_km numeric,
  verified boolean,
  aadhaar_verified boolean,
  skills text[],
  languages text[],
  bio text,
  availability text,
  locality text,
  lat double precision,
  lng double precision,
  is_seed boolean
)
language plpgsql security definer as $$
begin
  return query
  select
    w.id,
    p.full_name as name,
    p.phone,
    p.avatar_url as avatar,
    w.trade,
    w.trade_label,
    coalesce(w.headline, w.trade_label, w.trade) as role,
    w.experience_years as experience,
    w.rate,
    w.rate_type,
    w.rating_avg as rating,
    w.rating_count,
    w.jobs_completed,
    round(
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(lat)) * cos(radians(w.lat)) *
          cos(radians(w.lng) - radians(lng)) +
          sin(radians(lat)) * sin(radians(w.lat))
        ))
      ))::numeric, 2
    ) as distance_km,
    w.verified,
    w.aadhaar_verified,
    w.skills,
    w.languages,
    w.bio,
    w.availability,
    w.locality,
    w.lat,
    w.lng,
    w.is_seed
  from public.worker_profiles w
  join public.profiles p on p.id = w.id
  where
    (trade_filter is null or trade_filter = 'all' or w.trade = trade_filter)
    and (w.rating_avg >= min_rating)
    and (not only_available or w.availability = 'Available')
    and (
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(lat)) * cos(radians(w.lat)) *
          cos(radians(w.lng) - radians(lng)) +
          sin(radians(lat)) * sin(radians(w.lat))
        ))
      )) <= radius_km
    )
  order by distance_km asc, w.rating_avg desc
  limit page_limit
  offset page_offset;
end;
$$;

-- 3. Create Job RPC (Server-side validation, rate calculation & OTP hash)
create or replace function public.create_job(
  worker_id uuid,
  title text,
  description text default '',
  trade text default 'mason',
  address text default 'Noida Sector 62',
  sector text default 'Sector 62',
  lat double precision default 28.6280,
  lng double precision default 77.3649,
  days integer default 1
)
returns json language plpgsql security definer as $$
declare
  v_customer_id uuid := auth.uid();
  v_worker_rate numeric;
  v_worker_rate_type text;
  v_worker_lat double precision;
  v_worker_lng double precision;
  v_total_amount numeric;
  v_raw_otp text;
  v_otp_hash text;
  v_new_job_id uuid;
begin
  if v_customer_id is null then
    raise exception 'Authentication required to post a job';
  end if;

  -- Fetch worker profile details
  select rate, rate_type, lat, lng into v_worker_rate, v_worker_rate_type, v_worker_lat, v_worker_lng
  from public.worker_profiles
  where id = worker_id;

  if v_worker_rate is null then
    raise exception 'Worker profile not found';
  end if;

  -- Compute total server-side
  v_total_amount := v_worker_rate * greatest(1, days);

  -- Generate 4-digit numeric verification OTP
  v_raw_otp := lpad(floor(1000 + random() * 9000)::text, 4, '0');
  v_otp_hash := encode(digest(v_raw_otp, 'sha256'), 'hex');

  -- Insert Job record
  insert into public.jobs (
    customer_id,
    worker_id,
    title,
    description,
    trade,
    address,
    sector,
    lat,
    lng,
    worker_lat,
    worker_lng,
    days,
    rate,
    amount,
    status,
    otp_hash,
    escrow_status
  ) values (
    v_customer_id,
    worker_id,
    title,
    description,
    trade,
    address,
    sector,
    lat,
    lng,
    v_worker_lat,
    v_worker_lng,
    greatest(1, days),
    v_worker_rate,
    v_total_amount,
    'offered',
    v_otp_hash,
    'pending'
  )
  returning id into v_new_job_id;

  -- Record audit trail
  insert into public.job_events (job_id, actor_id, event, payload)
  values (
    v_new_job_id,
    v_customer_id::text,
    'created',
    json_build_object('amount', v_total_amount, 'days', days, 'rate', v_worker_rate)
  );

  -- Return created job with raw OTP visible ONLY to the customer at creation
  return json_build_object(
    'id', v_new_job_id,
    'amount', v_total_amount,
    'status', 'offered',
    'otp', v_raw_otp
  );
end;
$$;

-- 4. Advance Job State Machine RPC
create or replace function public.advance_job(
  job_id uuid,
  next_status text
)
returns json language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_job record;
  v_is_admin boolean;
begin
  select * into v_job from public.jobs where id = job_id;
  if not found then
    raise exception 'Job with id % not found', job_id;
  end if;

  select is_admin into v_is_admin from public.profiles where id = v_user_id;
  v_is_admin := coalesce(v_is_admin, false);

  -- Enforce transition rules and actors
  if next_status = 'accepted' then
    if v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only the assigned worker can accept this job';
    end if;
    if v_job.status != 'offered' and v_job.status != 'posted' then
      raise exception 'Cannot accept job in state %', v_job.status;
    end if;

  elsif next_status = 'on_the_way' then
    if v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only the assigned worker can start journey';
    end if;
    if v_job.status != 'accepted' then
      raise exception 'Job must be accepted before dispatching';
    end if;

  elsif next_status = 'arrived' then
    if v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only the assigned worker can report arrival';
    end if;
    if v_job.status != 'on_the_way' then
      raise exception 'Job must be on the way before arrival';
    end if;

  elsif next_status = 'in_progress' then
    -- Started on site via OTP handshake
    if v_job.status != 'arrived' and v_job.status != 'accepted' then
      raise exception 'Job must be at arrival stage to begin work';
    end if;

  elsif next_status = 'completed' then
    if v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only the assigned worker can mark work completed';
    end if;
    if v_job.status != 'in_progress' then
      raise exception 'Job must be in progress to complete';
    end if;

  elsif next_status = 'approved' or next_status = 'signed_off' then
    if v_user_id != v_job.customer_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only the customer can approve the work and release escrow';
    end if;
    next_status := 'approved';

  elsif next_status = 'settled' then
    next_status := 'settled';

  elsif next_status = 'cancelled' then
    if v_user_id != v_job.customer_id and v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only parties or admin can cancel';
    end if;

  elsif next_status = 'disputed' then
    if v_user_id != v_job.customer_id and v_user_id != v_job.worker_id and not v_is_admin and v_user_id is not null then
      raise exception 'Only parties or admin can open dispute';
    end if;
  else
    raise exception 'Unrecognized status transition: %', next_status;
  end if;

  -- Apply status change
  update public.jobs
  set 
    status = next_status,
    escrow_status = case 
      when next_status = 'approved' or next_status = 'settled' then 'released'
      when next_status = 'cancelled' then 'refunded'
      when next_status = 'disputed' then 'disputed'
      else escrow_status
    end,
    updated_at = now()
  where id = job_id;

  -- Record audit trail
  insert into public.job_events (job_id, actor_id, event, payload)
  values (
    job_id,
    coalesce(v_user_id::text, 'system:advance_job'),
    next_status,
    json_build_object('prev_status', v_job.status, 'new_status', next_status)
  );

  return json_build_object('id', job_id, 'status', next_status, 'success', true);
end;
$$;

-- 5. Verify Job OTP Handshake RPC
create or replace function public.verify_job_otp(
  job_id uuid,
  otp text
)
returns json language plpgsql security definer as $$
declare
  v_job record;
  v_hash text;
begin
  select * into v_job from public.jobs where id = job_id;
  if not found then
    return json_build_object('valid', false, 'error', 'Job not found');
  end if;

  v_hash := encode(digest(trim(otp), 'sha256'), 'hex');

  if v_job.otp_hash = v_hash then
    -- Advance status to in_progress if currently arrived
    if v_job.status = 'arrived' or v_job.status = 'accepted' then
      perform public.advance_job(job_id, 'in_progress');
    end if;

    insert into public.job_events (job_id, actor_id, event, payload)
    values (job_id, coalesce(auth.uid()::text, 'system:otp_verify'), 'otp_verified', json_build_object('verified_at', now()));

    return json_build_object('valid', true, 'status', 'in_progress');
  else
    return json_build_object('valid', false, 'error', 'Incorrect PIN code');
  end if;
end;
$$;

-- 6. Submit Review & Trigger Rating Recalculation
create or replace function public.submit_review(
  job_id uuid,
  rating integer,
  comment text default ''
)
returns json language plpgsql security definer as $$
declare
  v_reviewer_id uuid := auth.uid();
  v_job record;
  v_reviewee_id uuid;
begin
  if v_reviewer_id is null then
    raise exception 'Authentication required to submit review';
  end if;

  select * into v_job from public.jobs where id = job_id;
  if not found then
    raise exception 'Job not found';
  end if;

  -- Determine who is being reviewed
  if v_reviewer_id = v_job.customer_id then
    v_reviewee_id := v_job.worker_id;
  elsif v_reviewer_id = v_job.worker_id then
    v_reviewee_id := v_job.customer_id;
  else
    raise exception 'Only customer or worker can review this job';
  end if;

  insert into public.reviews (job_id, reviewer_id, reviewee_id, rating, comment)
  values (job_id, v_reviewer_id, v_reviewee_id, rating, comment)
  on conflict (job_id, reviewer_id) do update
  set rating = excluded.rating, comment = excluded.comment;

  -- Recalculate worker's rating if reviewee is worker
  update public.worker_profiles
  set 
    rating_avg = (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.reviewee_id = v_reviewee_id),
    rating_count = (select count(r.id) from public.reviews r where r.reviewee_id = v_reviewee_id),
    jobs_completed = jobs_completed + 1
  where id = v_reviewee_id;

  return json_build_object('success', true, 'rating', rating);
end;
$$;

-- 7. Automated Notification Trigger on Job Events
create or replace function public.notify_on_job_event()
returns trigger language plpgsql security definer as $$
declare
  v_target_user uuid;
  v_title text;
  v_body text;
begin
  -- Notify opposite party
  if new.status = 'offered' then
    v_target_user := new.worker_id;
    v_title := 'नया काम का अनुरोध (New Job Offer)';
    v_body := 'Customer offered job: ' || new.title || ' (₹' || new.amount || ')';
  elsif new.status = 'accepted' then
    v_target_user := new.customer_id;
    v_title := 'काम स्वीकार किया गया (Job Accepted)';
    v_body := 'Kaarigar has accepted your booking for ' || new.title;
  elsif new.status = 'on_the_way' then
    v_target_user := new.customer_id;
    v_title := 'कारीगर रास्ते में हैं (On the way)';
    v_body := 'Kaarigar is heading to your site.';
  elsif new.status = 'arrived' then
    v_target_user := new.customer_id;
    v_title := 'कारीगर साइट पर पहुंच गए (Arrived on site)';
    v_body := 'Kaarigar has arrived. Please verify on-spot PIN.';
  elsif new.status = 'completed' then
    v_target_user := new.customer_id;
    v_title := 'काम पूरा हुआ (Work Completed)';
    v_body := 'Work marked complete. Inspect photo proofs & release payment.';
  elsif new.status = 'approved' or new.status = 'settled' then
    v_target_user := new.worker_id;
    v_title := 'भुगतान स्वीकृत! (Payment Released)';
    v_body := '₹' || new.amount || ' has been approved and released to your account.';
  end if;

  if v_target_user is not null and (old is null or old.status != new.status) then
    insert into public.notifications (user_id, title, body, link)
    values (v_target_user, v_title, v_body, '#/track/' || new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_notify_job_status on public.jobs;
create trigger trigger_notify_job_status
  after insert or update of status on public.jobs
  for each row execute function public.notify_on_job_event();

-- 8. Add Tables to Realtime Publication
do $$
begin
  alter publication supabase_realtime add table public.jobs;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.job_proofs;
exception when others then null;
end $$;
