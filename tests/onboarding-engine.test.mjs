import test from 'node:test'
import assert from 'node:assert/strict'
import { createOnboardingEngine, validateOnboardingPayload } from '../lib/onboarding/engine.mjs'
import { createAccessEnvelope } from '../lib/onboarding/accessEnvelope.mjs'

const PAYLOAD = { provider:'stripe', external_order_id:'cs_test_order', customer_email:'test@example.invalid', couple_display_name:'Test a Test', package_type:'signature', design_family:'botanique', slug:'test-wedding', test_mode:false }
function fixture() {
  const jobs = new Map(), sent = new Map(), calls = [], notifications = []
  const control = { configured:true, prepareFailure:false, deliveryFailure:false, saveDeliveryFailure:false, completeFailure:false, lostClaim:false }
  let identities = 0, projects = 0
  const envelope = createAccessEnvelope('test-only-key')
  const db = { async rpc(name,args) {
    calls.push(name)
    if (name === 'claim_paid_onboarding') {
      let job=jobs.get(args.p_payload.external_order_id)
      if (!job) { job={id:'job-a',status:'pending',payload_snapshot:{...args.p_payload}};jobs.set(args.p_payload.external_order_id,job) }
      if (job.status==='completed') return {data:{state:'completed',job:{...job}}}
      if(job.status==='processing') return {data:{state:'busy'}}
      Object.assign(job,{status:'processing',claim_token:args.p_token})
      return {data:{state:'claimed',job:{...job}}}
    }
    const job=jobs.get(PAYLOAD.external_order_id)
    if (control.lostClaim || job.claim_token!==args.p_token) return {error:{code:'claim_lost'}}
    if(name==='prepare_paid_onboarding') {
      if(control.prepareFailure) return {error:{code:'project_failed'}}
      if(!job.project_id) projects++
      Object.assign(job,{project_id:'project-a',slug:PAYLOAD.slug,auth_user_id:args.p_user_id,project_ready_at:'now',access_payload_encrypted:job.access_payload_encrypted||args.p_encrypted})
    }
    if(name==='begin_onboarding_delivery') { job.started=true; return {data:true} }
    if(name==='finish_onboarding_delivery') {
      if(control.saveDeliveryFailure){control.saveDeliveryFailure=false;return {error:{code:'checkpoint_failed'}}}
      Object.assign(job,{access_email_sent_at:'now',access_delivery_id:args.p_delivery_id})
    }
    if(name==='complete_paid_onboarding') {
      if(control.completeFailure){control.completeFailure=false;return {error:{code:'complete_failed'}}}
      Object.assign(job,{status:'completed',claim_token:null})
      if(!job.payload_snapshot.test_mode) job.access_payload_encrypted=null
    }
    if(name==='fail_paid_onboarding') { job.status='failed'; return {data:true} }
    return {data:{...job}}
  } }
  const run=createOnboardingEngine({db,envelope,palette:()=>[],emailConfigured:()=>control.configured,resolveIdentity:async()=> 'user-a',
    prepareAccess:async()=>{identities++;return {userId:'user-a',accessUrl:`https://example.invalid/reset-password?secret=${identities}`,existingUser:identities>1}},
    createMessage:(payload,access)=>({subject:'Welcome',html:`<a href="${access.accessUrl}">access</a>`,text:access.accessUrl,sender:'sender@example.invalid'}),
    sendEmail:async message=>{
      assert.ok(jobs.get(PAYLOAD.external_order_id).project_ready_at,'project is prepared before email')
      const previous=sent.get(message.idempotencyKey)
      if(previous) assert.deepEqual(message,previous,'uncertain retry preserves exact email body and link')
      else sent.set(message.idempotencyKey,message)
      if(control.deliveryFailure){control.deliveryFailure=false;throw new Error('timeout after provider acceptance')}
      return {id:'email-a'}
    },
    notifyOwner:async job=>{notifications.push(job.status)},
  })
  return {run,jobs,sent,calls,control,notifications,get identities(){return identities},get projects(){return projects}}
}

test('project is complete before access is sent; production never returns an access token',async()=>{
 const f=fixture();const result=await f.run(PAYLOAD)
 assert.equal(result.email_sent,true);assert.equal(result.access_url,null)
 assert.equal(f.projects,1);assert.equal(f.sent.size,1);assert.deepEqual(f.notifications,['completed'])
 assert.equal(f.jobs.get(PAYLOAD.external_order_id).access_payload_encrypted,null)
})
test('completed replay does not recreate identity, project or email',async()=>{
 const f=fixture();await f.run(PAYLOAD);await f.run(PAYLOAD)
 assert.equal(f.identities,1);assert.equal(f.projects,1);assert.equal(f.sent.size,1)
})
test('simultaneous webhook and checkout return allow only one processor',async()=>{
 const f=fixture();const results=await Promise.allSettled([f.run(PAYLOAD),f.run(PAYLOAD)])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
 assert.match(results.find(r=>r.status==='rejected').reason.message,/already being processed/)
 assert.equal(f.projects,1);assert.equal(f.sent.size,1)
})
test('failed project creation sends no access and is recoverable',async()=>{
 const f=fixture();f.control.prepareFailure=true;await assert.rejects(f.run(PAYLOAD))
 assert.equal(f.sent.size,0);assert.equal(f.jobs.get(PAYLOAD.external_order_id).status,'failed')
 f.control.prepareFailure=false;await f.run(PAYLOAD);assert.equal(f.projects,1);assert.equal(f.sent.size,1)
})
test('uncertain email retry reuses persisted encrypted body and one provider operation',async()=>{
 const f=fixture();f.control.deliveryFailure=true;await assert.rejects(f.run(PAYLOAD))
 const job=f.jobs.get(PAYLOAD.external_order_id)
 assert.ok(job.access_payload_encrypted);assert.ok(!job.access_payload_encrypted.includes('secret='))
 await f.run(PAYLOAD);assert.equal(f.identities,1);assert.equal(f.projects,1);assert.equal(f.sent.size,1)
})
test('accepted email followed by failed checkpoint safely replays the same delivery',async()=>{
 const f=fixture();f.control.saveDeliveryFailure=true;await assert.rejects(f.run(PAYLOAD));await f.run(PAYLOAD)
 assert.equal(f.sent.size,1);assert.equal(f.identities,1)
})
test('failure after email checkpoint never sends another access email',async()=>{
 const f=fixture();f.control.completeFailure=true;await assert.rejects(f.run(PAYLOAD));const sentCalls=f.calls.filter(c=>c==='begin_onboarding_delivery').length
 await f.run(PAYLOAD);assert.equal(f.calls.filter(c=>c==='begin_onboarding_delivery').length,sentCalls);assert.equal(f.sent.size,1)
})
test('production without configured sender fails before Auth, project or delivery',async()=>{
 const f=fixture();f.control.configured=false;await assert.rejects(f.run(PAYLOAD),/not configured/)
 assert.equal(f.identities,0);assert.equal(f.projects,0);assert.equal(f.sent.size,0)
})
test('explicit test mode supports private direct access without sending',async()=>{
 const f=fixture();f.control.configured=false;const result=await f.run({...PAYLOAD,test_mode:true})
 assert.equal(result.email_sent,false);assert.match(result.access_url,/reset-password/);assert.equal(f.sent.size,0)
 const replay=await f.run({...PAYLOAD,test_mode:true});assert.equal(replay.access_url,result.access_url)
})
test('encrypted outbox cannot be decrypted with another key or job identity',()=>{
 const e=createAccessEnvelope('one');const value=e.seal({token:'sensitive'},'job-a')
 assert.deepEqual(e.open(value,'job-a'),{token:'sensitive'});assert.ok(!value.includes('sensitive'))
 assert.throws(()=>e.open(value,'job-b'));assert.throws(()=>createAccessEnvelope('two').open(value,'job-a'))
 assert.throws(()=>e.open(value.slice(0,-4)+'AAAA','job-a'))
})
test('onboarding requires canonical Stripe order identity and known package/design',()=>{
 for(const patch of [{provider:'other'},{external_order_id:'custom-order'},{customer_email:'bad'},{package_type:'free'},{design_family:'unknown'}]) assert.throws(()=>validateOnboardingPayload({...PAYLOAD,...patch}))
})

test('legacy accepted email repairs missing project without replacing its access link',async()=>{
 const f=fixture();f.jobs.set(PAYLOAD.external_order_id,{id:'job-a',status:'failed',payload_snapshot:{...PAYLOAD,access_email_sent_at:'2026-11-19T12:00:00Z'}})
 const result=await f.run(PAYLOAD);assert.equal(result.email_sent,true);assert.equal(f.identities,0);assert.equal(f.projects,1);assert.equal(f.sent.size,0)
})
test('legacy persisted identity and accepted email resume without another send',async()=>{
 const f=fixture();f.jobs.set(PAYLOAD.external_order_id,{id:'job-a',status:'failed',auth_user_id:'user-a',payload_snapshot:{...PAYLOAD,access_email_sent_at:'2026-11-19T12:00:00Z'}})
 await f.run(PAYLOAD);assert.equal(f.identities,0);assert.equal(f.projects,1);assert.equal(f.sent.size,0)
})
test('slugs already accepted by checkout remain compatible and bounded',()=>{
 assert.equal(validateOnboardingPayload({...PAYLOAD,slug:'anna--adam-'}).slug,'anna--adam-')
 assert.throws(()=>validateOnboardingPayload({...PAYLOAD,slug:'a'.repeat(81)}))
})
