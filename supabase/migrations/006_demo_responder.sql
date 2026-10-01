-- NIRMAAN Migration 006: Demo Responder Support
-- Automatically progresses seed worker jobs when demo_responder is enabled.

-- 1. Ensure demo_responder default is set to 'true' in app_settings
insert into public.app_settings (key, value)
values ('demo_responder', 'true')
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- 2. Demo Advance Job RPC
create or replace function public.demo_advance_job(
  p_job_id uuid,
  p_next_status text,
  p_actor text default 'system:demo-responder'
)
returns json language plpgsql security definer as $$
declare
  v_job record;
  v_is_seed boolean := false;
  v_demo_enabled boolean := false;
  v_customer_id uuid;
  v_worker_name text;
  v_notif_title text;
  v_notif_body text;
begin
  -- 1. Check if demo_responder is enabled
  select (value = 'true') into v_demo_enabled 
  from public.app_settings 
  where key = 'demo_responder';

  if not coalesce(v_demo_enabled, false) then
    raise exception 'Demo responder is disabled in app_settings';
  end if;

  -- 2. Find job
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    raise exception 'Job % not found', p_job_id;
  end if;

  -- Don't advance if cancelled or disputed
  if v_job.status in ('cancelled', 'disputed', 'approved', 'settled') then
    return json_build_object('success', false, 'reason', 'Job already concluded', 'status', v_job.status);
  end if;

  -- 3. Check if worker is a seed worker
  select coalesce(is_seed, false) into v_is_seed
  from public.profiles
  where id = v_job.worker_id;

  if not v_is_seed then
    raise exception 'Job worker is not a seed profile. Demo responder only drives seed workers.';
  end if;

  -- 4. Advance status
  update public.jobs
  set 
    status = p_next_status,
    escrow_status = case 
      when p_next_status in ('approved', 'settled') then 'released'
      when p_next_status = 'cancelled' then 'refunded'
      when p_next_status = 'disputed' then 'disputed'
      else escrow_status
    end,
    updated_at = now()
  where id = p_job_id;

  -- 5. Record audit trail in job_events
  insert into public.job_events (job_id, actor_id, event, payload)
  values (
    p_job_id,
    p_actor,
    p_next_status,
    json_build_object(
      'prev_status', v_job.status,
      'new_status', p_next_status,
      'timestamp', extract(epoch from now())
    )
  );

  -- 6. Send notification to customer
  select full_name into v_worker_name from public.profiles where id = v_job.worker_id;
  v_worker_name := coalesce(v_worker_name, 'Kaarigar');

  if p_next_status = 'accepted' then
    v_notif_title := 'Booking Accepted!';
    v_notif_body := v_worker_name || ' has accepted your request and is preparing tools.';
  elsif p_next_status = 'on_the_way' then
    v_notif_title := 'Kaarigar on the way!';
    v_notif_body := v_worker_name || ' has left for your site. Live GPS tracking is active.';
  elsif p_next_status = 'arrived' then
    v_notif_title := 'Kaarigar Arrived!';
    v_notif_body := v_worker_name || ' has arrived at your location. Please share your on-spot OTP to start work.';
  elsif p_next_status = 'in_progress' then
    v_notif_title := 'Work Started!';
    v_notif_body := 'On-spot PIN verified. Work has begun on your site.';
  elsif p_next_status in ('work_submitted', 'completed') then
    v_notif_title := 'Work Completed!';
    v_notif_body := v_worker_name || ' has finished the job and uploaded proof photos for your approval.';
  end if;

  if v_notif_title is not null and v_job.customer_id is not null then
    insert into public.notifications (user_id, title, body, type, data)
    values (
      v_job.customer_id,
      v_notif_title,
      v_notif_body,
      'job_update',
      json_build_object('job_id', p_job_id, 'status', p_next_status)
    );
  end if;

  return json_build_object(
    'success', true,
    'job_id', p_job_id,
    'prev_status', v_job.status,
    'status', p_next_status
  );
end;
$$;

-- Grant execution to authenticated & anon roles
grant execute on function public.demo_advance_job(uuid, text, text) to authenticated, anon;
