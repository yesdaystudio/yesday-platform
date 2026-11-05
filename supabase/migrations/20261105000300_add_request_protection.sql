create table public.request_limit_buckets (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_seconds integer not null,
  window_start timestamptz not null,
  hits integer not null,
  expires_at timestamptz not null,
  primary key(key_hash,window_seconds,window_start)
);
create index request_limit_expiry_idx on public.request_limit_buckets(expires_at);
create table public.request_operations (
  operation_key text primary key check(operation_key ~ '^[a-f0-9]{64}$'),
  payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
  state text not null check(state in ('processing','retryable','completed')),
  claim_token uuid not null,
  lease_until timestamptz not null,
  result jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '48 hours')
);
create index request_operation_expiry_idx on public.request_operations(expires_at);
alter table public.request_limit_buckets enable row level security;
alter table public.request_operations enable row level security;
revoke all on public.request_limit_buckets,public.request_operations from public,anon,authenticated;
grant all on public.request_limit_buckets,public.request_operations to service_role;

create function public.consume_request_limit(p_key_hash text,p_limit integer,p_window_seconds integer)
returns jsonb language plpgsql set search_path='' as $$
declare stamp timestamptz:=clock_timestamp(); start_at timestamptz; hit_count integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 10000 or p_window_seconds not between 1 and 86400 then raise exception 'Invalid limit parameters'; end if;
  start_at:=to_timestamp(floor(extract(epoch from stamp)/p_window_seconds)*p_window_seconds);
  delete from public.request_limit_buckets where (key_hash,window_seconds,window_start) in
    (select key_hash,window_seconds,window_start from public.request_limit_buckets where expires_at<stamp limit 100);
  insert into public.request_limit_buckets(key_hash,window_seconds,window_start,hits,expires_at)
    values(p_key_hash,p_window_seconds,start_at,1,start_at+make_interval(secs=>p_window_seconds))
    on conflict(key_hash,window_seconds,window_start) do update set hits=least(public.request_limit_buckets.hits+1,p_limit+1)
    returning hits into hit_count;
  return jsonb_build_object('allowed',hit_count<=p_limit,'retry_after',greatest(1,ceil(extract(epoch from start_at+make_interval(secs=>p_window_seconds)-stamp))::integer));
end $$;

create function public.claim_request_operation(p_operation_key text,p_payload_hash text,p_claim_token uuid)
returns jsonb language plpgsql set search_path='' as $$
declare operation public.request_operations; stamp timestamptz:=clock_timestamp();
begin
  if p_operation_key !~ '^[a-f0-9]{64}$' or p_payload_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid operation hash'; end if;
  delete from public.request_operations where operation_key in
    (select operation_key from public.request_operations where expires_at<stamp limit 100);
  insert into public.request_operations(operation_key,payload_hash,state,claim_token,lease_until)
    values(p_operation_key,p_payload_hash,'processing',p_claim_token,stamp+interval '90 seconds') on conflict do nothing;
  select * into operation from public.request_operations where operation_key=p_operation_key for update;
  if operation.payload_hash<>p_payload_hash then return jsonb_build_object('status','conflict'); end if;
  if operation.state='completed' then return jsonb_build_object('status','replay','result',operation.result); end if;
  if operation.created_at<stamp-interval '23 hours' then return jsonb_build_object('status','expired'); end if;
  if operation.claim_token=p_claim_token then return jsonb_build_object('status','claimed'); end if;
  if operation.state='processing' and operation.lease_until>stamp then return jsonb_build_object('status','busy'); end if;
  update public.request_operations set state='processing',claim_token=p_claim_token,lease_until=stamp+interval '90 seconds' where operation_key=p_operation_key;
  return jsonb_build_object('status','claimed');
end $$;

create function public.finish_request_operation(p_operation_key text,p_claim_token uuid,p_result jsonb)
returns boolean language plpgsql set search_path='' as $$
begin
  if octet_length(p_result::text)>16000 then raise exception 'Result too large'; end if;
  update public.request_operations set state='completed',result=p_result
    where operation_key=p_operation_key and claim_token=p_claim_token and state='processing';
  return found;
end $$;
create function public.release_request_operation(p_operation_key text,p_claim_token uuid)
returns void language sql set search_path='' as $$
  update public.request_operations set state='retryable',lease_until=now()
    where operation_key=p_operation_key and claim_token=p_claim_token and state='processing';
$$;
revoke all on function public.consume_request_limit(text,integer,integer),public.claim_request_operation(text,text,uuid),public.finish_request_operation(text,uuid,jsonb),public.release_request_operation(text,uuid) from public,anon,authenticated;
grant execute on function public.consume_request_limit(text,integer,integer),public.claim_request_operation(text,text,uuid),public.finish_request_operation(text,uuid,jsonb),public.release_request_operation(text,uuid) to service_role;

create function public.cleanup_request_protection() returns void language sql set search_path='' as $$
  delete from public.request_limit_buckets where expires_at<now();
  delete from public.request_operations where expires_at<now();
$$;
revoke all on function public.cleanup_request_protection() from public,anon,authenticated;
grant execute on function public.cleanup_request_protection() to service_role;

-- A regular UNIQUE constraint also permits multiple NULLs and supports atomic upsert.
drop index if exists public.rsvp_responses_invitation_recipient_id_unique;
alter table public.rsvp_responses add constraint rsvp_responses_invitation_recipient_id_key unique(invitation_recipient_id);
notify pgrst,'reload schema';
