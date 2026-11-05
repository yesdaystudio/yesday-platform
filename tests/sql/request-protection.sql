-- Run after request protection migration; all fixtures and counters are rolled back.
begin;
create temporary table request_test_results(test text,passed boolean);
do $$
declare key_a text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
 key_b text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
 payload_a text:=repeat('a',64); token_a uuid:=gen_random_uuid(); token_b uuid:=gen_random_uuid(); result jsonb;
 p uuid:=gen_random_uuid(); recipient uuid:=gen_random_uuid();
begin
 result:=public.consume_request_limit(key_a,2,86400);
 insert into request_test_results values('first request allowed',(result->>'allowed')::boolean);
 result:=public.consume_request_limit(key_a,2,86400);
 insert into request_test_results values('request within limit allowed',(result->>'allowed')::boolean);
 result:=public.consume_request_limit(key_a,2,86400);
 insert into request_test_results values('limit exceeded rejected',not (result->>'allowed')::boolean);
 insert into request_test_results values('retry after is bounded',(result->>'retry_after')::integer between 1 and 86400);
 update public.request_limit_buckets set expires_at=now()-interval '1 minute' where key_hash=key_a;
 perform public.cleanup_request_protection();
 result:=public.consume_request_limit(key_a,2,86400);
 insert into request_test_results values('expired quota resets',(result->>'allowed')::boolean);
 result:=public.claim_request_operation(key_a,payload_a,token_a);
 insert into request_test_results values('first action claims operation',result->>'status'='claimed');
 result:=public.claim_request_operation(key_a,payload_a,token_b);
 insert into request_test_results values('concurrent worker rejected',result->>'status'='busy');
 insert into request_test_results values('stale worker cannot finish',not public.finish_request_operation(key_a,token_b,'{"url":"https://example.invalid"}'));
 insert into request_test_results values('owner worker finishes',public.finish_request_operation(key_a,token_a,'{"url":"https://example.invalid"}'));
 result:=public.claim_request_operation(key_a,payload_a,token_b);
 insert into request_test_results values('retry replays completed result',result->>'status'='replay' and result->'result'->>'url'='https://example.invalid');
 result:=public.claim_request_operation(key_a,repeat('b',64),token_b);
 insert into request_test_results values('changed payload rejected',result->>'status'='conflict');
 update public.request_operations set created_at=now()-interval '30 hours' where operation_key=key_a;
 result:=public.claim_request_operation(key_a,payload_a,token_b);
 insert into request_test_results values('completed action replays beyond provider 24h cache',result->>'status'='replay');
 perform public.claim_request_operation(key_b,payload_a,token_a);
 perform public.release_request_operation(key_b,token_a);
 result:=public.claim_request_operation(key_b,payload_a,token_b);
 insert into request_test_results values('failed action can retry',result->>'status'='claimed');
 update public.request_operations set lease_until=now()-interval '1 second' where operation_key=key_b;
 result:=public.claim_request_operation(key_b,payload_a,token_a);
 insert into request_test_results values('stale lease recoverable',result->>'status'='claimed');
 update public.request_operations set created_at=now()-interval '24 hours' where operation_key=key_b;
 result:=public.claim_request_operation(key_b,payload_a,token_b);
 insert into request_test_results values('uncertain old action does not repeat',result->>'status'='expired');
 insert into request_test_results values('anonymous quota RPC unavailable',not has_function_privilege('anon','public.consume_request_limit(text,integer,integer)','EXECUTE'));
 insert into request_test_results values('authenticated action RPC unavailable',not has_function_privilege('authenticated','public.claim_request_operation(text,text,uuid)','EXECUTE'));
 insert into request_test_results values('operation results inaccessible to clients',not has_table_privilege('authenticated','public.request_operations','SELECT'));
 insert into public.projects(id,slug,package_type) values(p,'request-qa-'||p,'signature');
 insert into public.invitation_recipients(id,project_id,recipient_label) values(recipient,p,'Synthetic guest');
 insert into public.rsvp_responses(project_id,invitation_recipient_id,guest_name,attending,adults_count,children_count,people)
 values(p,recipient,'First','yes',1,0,'[]'::jsonb) on conflict(invitation_recipient_id) do update set guest_name=excluded.guest_name;
 insert into public.rsvp_responses(project_id,invitation_recipient_id,guest_name,attending,adults_count,children_count,people)
 values(p,recipient,'Corrected','yes',1,0,'[]'::jsonb) on conflict(invitation_recipient_id) do update set guest_name=excluded.guest_name;
 insert into request_test_results select 'personalized RSVP atomic upsert preserves one response',count(*)=1 and min(guest_name)='Corrected' from public.rsvp_responses where invitation_recipient_id=recipient;
 insert into public.rsvp_responses(project_id,guest_name,attending,adults_count,children_count,people)
 values(p,'Generic A','yes',1,0,'[]'::jsonb),(p,'Generic B','yes',1,0,'[]'::jsonb);
 insert into request_test_results select 'generic RSVP still permits multiple households',count(*)=2 from public.rsvp_responses where project_id=p and invitation_recipient_id is null;
end $$;
select * from request_test_results;
rollback;
