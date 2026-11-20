begin;

alter table public.onboarding_jobs
  add column if not exists claim_token uuid,
  add column if not exists lease_until timestamptz,
  add column if not exists project_ready_at timestamptz,
  add column if not exists access_payload_encrypted text,
  add column if not exists access_prepared_at timestamptz,
  add column if not exists access_send_started_at timestamptz,
  add column if not exists access_email_sent_at timestamptz,
  add column if not exists access_delivery_id text;

alter table public.onboarding_jobs enable row level security;
revoke all on public.onboarding_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.onboarding_jobs to service_role;

create or replace function public.claim_paid_onboarding(p_payload jsonb, p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.onboarding_jobs; k text;
begin
  if p_token is null or p_payload->>'provider' <> 'stripe' or coalesce(p_payload->>'external_order_id','') not like 'cs_%' then raise exception 'Invalid order'; end if;
  insert into public.onboarding_jobs(provider,external_order_id,external_event_id,status,payload_snapshot,retries)
    values ('stripe',p_payload->>'external_order_id',nullif(p_payload->>'external_event_id',''),'pending',p_payload,0)
    on conflict (provider,external_order_id) do nothing;
  select * into strict j from public.onboarding_jobs where provider='stripe' and external_order_id=p_payload->>'external_order_id' for update;
  foreach k in array array['customer_email','package_type','couple_display_name','design_family'] loop
    if coalesce(j.payload_snapshot->>k, case when k='design_family' then 'diana' else '' end) is distinct from p_payload->>k then raise exception 'Order payload conflict'; end if;
  end loop;
  if coalesce((j.payload_snapshot->>'test_mode')::boolean,false) is distinct from coalesce((p_payload->>'test_mode')::boolean,false) then raise exception 'Order mode conflict'; end if;
  if j.project_id is not null and not exists(select 1 from public.projects where id=j.project_id and (j.auth_user_id is null or owner_user_id=j.auth_user_id) and payment_status='paid' and (project_status='active' or (j.status<>'completed' and project_status='onboarding'))) then raise exception 'Project is no longer active'; end if;
  if j.status='completed' and j.project_id is not null and j.auth_user_id is not null and j.slug is not null and
    (j.access_email_sent_at is not null or coalesce(j.payload_snapshot->>'access_email_sent_at','')<>'' or
      (coalesce((j.payload_snapshot->>'test_mode')::boolean,false) and j.access_payload_encrypted is not null)) then
    return jsonb_build_object('state','completed','job',to_jsonb(j));
  end if;
  if j.status='processing' and coalesce(j.lease_until,j.updated_at+interval '5 minutes')>clock_timestamp() then
    return jsonb_build_object('state','busy');
  end if;
  update public.onboarding_jobs set status='processing',claim_token=p_token,lease_until=clock_timestamp()+interval '5 minutes',
    retries=retries+1,error_message=null,external_event_id=coalesce(external_event_id,nullif(p_payload->>'external_event_id','')),updated_at=clock_timestamp()
    where id=j.id returning * into j;
  return jsonb_build_object('state','claimed','job',to_jsonb(j));
end $$;

create or replace function public.prepare_paid_onboarding(p_id uuid,p_token uuid,p_user_id uuid,p_encrypted text,p_palette jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.onboarding_jobs; p public.projects; base text; candidate text; suffix integer:=0;
begin
  select * into strict j from public.onboarding_jobs where id=p_id for update;
  if p_token is null or j.claim_token is distinct from p_token or j.status<>'processing' or j.lease_until is null or j.lease_until<=clock_timestamp() then raise exception 'Onboarding claim lost'; end if;
  if p_user_id is null or p_encrypted is null then raise exception 'Missing access checkpoint'; end if;
  if j.auth_user_id is not null and j.auth_user_id<>p_user_id then raise exception 'Identity conflict'; end if;
  if j.project_id is not null then
    select * into strict p from public.projects where id=j.project_id for update;
  else
    select * into p from public.projects where stripe_checkout_session_id=j.external_order_id for update;
    if not found then
      base:=nullif(j.payload_snapshot->>'slug','');
      if base is null then base:='svadba-'||substr(j.id::text,1,8); end if;
      loop
        candidate:=base||case when suffix=0 then '' else '-'||suffix::text end;
        insert into public.projects(slug,couple_display_name,package_type,design_family,client_email,owner_user_id,payment_status,project_status,
          stripe_checkout_session_id,accommodation_reminder_days,accommodation_reminder_setting_updated_at,timezone)
        values(candidate,j.payload_snapshot->>'couple_display_name',j.payload_snapshot->>'package_type',j.payload_snapshot->>'design_family',
          j.payload_snapshot->>'customer_email',p_user_id,'paid','onboarding',j.external_order_id,
          case when j.payload_snapshot->>'package_type'='essential' then null else 2 end,
          case when j.payload_snapshot->>'package_type'='essential' then null else clock_timestamp() end,'Europe/Bratislava')
        on conflict(slug) do nothing returning * into p;
        exit when found;
        suffix:=suffix+1;
        if suffix>100 then raise exception 'Slug unavailable'; end if;
      end loop;
    end if;
  end if;
  -- Only an exact paid session can resolve a legacy project. Never match by email.
  if p.payment_status is distinct from 'paid' or (p.project_status is null or p.project_status not in ('active','onboarding')) then raise exception 'Project is no longer active'; end if;
  if p.owner_user_id is not null and p.owner_user_id<>p_user_id then raise exception 'Project owner conflict'; end if;
  if p.stripe_checkout_session_id is not null and p.stripe_checkout_session_id<>j.external_order_id then raise exception 'Project order conflict'; end if;
  perform 1 from public.website_content where project_id=p.id;
  if not found then
    insert into public.website_content(project_id,dresscode_palette_enabled,dresscode_palette) values(p.id,true,p_palette);
  end if;
  update public.projects set owner_user_id=p_user_id,package_type=j.payload_snapshot->>'package_type',design_family=j.payload_snapshot->>'design_family',
    stripe_checkout_session_id=j.external_order_id,payment_status='paid',project_status='active' where id=p.id;
  update public.onboarding_jobs set auth_user_id=p_user_id,project_id=p.id,slug=p.slug,project_ready_at=coalesce(project_ready_at,clock_timestamp()),
    access_payload_encrypted=coalesce(access_payload_encrypted,p_encrypted),access_prepared_at=coalesce(access_prepared_at,clock_timestamp()),
    updated_at=clock_timestamp(),lease_until=clock_timestamp()+interval '5 minutes'
    where id=j.id returning * into j;
  return to_jsonb(j);
end $$;

create or replace function public.begin_onboarding_delivery(p_id uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.onboarding_jobs;
begin
  select * into strict j from public.onboarding_jobs where id=p_id for update;
  if p_token is null or j.claim_token is distinct from p_token or j.status<>'processing' or j.lease_until is null or j.lease_until<=clock_timestamp() or j.project_ready_at is null then raise exception 'Onboarding claim lost'; end if;
  if j.access_send_started_at<clock_timestamp()-interval '23 hours' and j.access_email_sent_at is null then raise exception 'Delivery requires manual review'; end if;
  update public.onboarding_jobs set access_send_started_at=coalesce(access_send_started_at,clock_timestamp()),updated_at=clock_timestamp(),lease_until=clock_timestamp()+interval '5 minutes' where id=p_id;
  return true;
end $$;

create or replace function public.finish_onboarding_delivery(p_id uuid,p_token uuid,p_delivery_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.onboarding_jobs;
begin
  update public.onboarding_jobs set access_email_sent_at=coalesce(access_email_sent_at,clock_timestamp()),access_delivery_id=coalesce(access_delivery_id,p_delivery_id),updated_at=clock_timestamp()
    where id=p_id and claim_token=p_token and status='processing' and lease_until>clock_timestamp() and project_ready_at is not null returning * into j;
  if not found then raise exception 'Onboarding claim lost'; end if;
  return to_jsonb(j);
end $$;

create or replace function public.complete_paid_onboarding(p_id uuid,p_token uuid,p_test_without_email boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.onboarding_jobs;
begin
  select * into strict j from public.onboarding_jobs where id=p_id for update;
  if p_token is null or j.claim_token is distinct from p_token or j.status<>'processing' or j.lease_until is null or j.lease_until<=clock_timestamp() or j.project_ready_at is null then raise exception 'Onboarding claim lost'; end if;
  if j.access_email_sent_at is null and coalesce(j.payload_snapshot->>'access_email_sent_at','')='' and
    not (p_test_without_email and coalesce((j.payload_snapshot->>'test_mode')::boolean,false)) then raise exception 'Access email not accepted'; end if;
  update public.onboarding_jobs set status='completed',claim_token=null,lease_until=null,error_message=null,updated_at=clock_timestamp(),
    access_payload_encrypted=case when coalesce((payload_snapshot->>'test_mode')::boolean,false) then access_payload_encrypted else null end
    where id=p_id returning * into j;
  return to_jsonb(j);
end $$;

create or replace function public.fail_paid_onboarding(p_id uuid,p_token uuid,p_code text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.onboarding_jobs set status='failed',claim_token=null,lease_until=null,error_message=left(p_code,80),updated_at=clock_timestamp()
    where id=p_id and claim_token=p_token and status='processing' and lease_until>clock_timestamp();
  return found;
end $$;

revoke all on function public.claim_paid_onboarding(jsonb,uuid),public.prepare_paid_onboarding(uuid,uuid,uuid,text,jsonb),
  public.begin_onboarding_delivery(uuid,uuid),public.finish_onboarding_delivery(uuid,uuid,text),public.complete_paid_onboarding(uuid,uuid,boolean),public.fail_paid_onboarding(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_paid_onboarding(jsonb,uuid),public.prepare_paid_onboarding(uuid,uuid,uuid,text,jsonb),
  public.begin_onboarding_delivery(uuid,uuid),public.finish_onboarding_delivery(uuid,uuid,text),public.complete_paid_onboarding(uuid,uuid,boolean),public.fail_paid_onboarding(uuid,uuid,text) to service_role;
create or replace function public.mark_onboarding_notification(p_id uuid)
returns void language sql security definer set search_path = public, pg_temp as $$
  update public.onboarding_jobs set payload_snapshot=jsonb_set(coalesce(payload_snapshot,'{}'::jsonb),'{order_notification_sent_at}',to_jsonb(clock_timestamp())),updated_at=clock_timestamp()
    where id=p_id and status='completed' and coalesce(payload_snapshot->>'order_notification_sent_at','')='';
$$;
revoke all on function public.mark_onboarding_notification(uuid) from public,anon,authenticated;
grant execute on function public.mark_onboarding_notification(uuid) to service_role;

-- Production access URLs from the legacy flow are not retained in plaintext.
update public.onboarding_jobs set payload_snapshot=payload_snapshot-'test_access_url'
where coalesce((payload_snapshot->>'test_mode')::boolean,false)=false and payload_snapshot ? 'test_access_url';
commit;
