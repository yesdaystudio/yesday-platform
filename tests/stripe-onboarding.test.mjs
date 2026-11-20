import test from 'node:test'
import assert from 'node:assert/strict'
import { createStripeOnboardingApi, paidSessionPayload } from '../lib/stripeOnboardingApi.mjs'
const SESSION={id:'cs_test_a',status:'complete',payment_status:'paid',mode:'payment',currency:'eur',amount_total:24900,livemode:true,customer_email:'test@example.invalid',metadata:{package_type:'signature',couple_display_name:'Test a Test',design_family:'botanique',external_order_id:'never-trust-this'}}
function setup({session=SESSION,eventType='checkout.session.completed',badSignature=false,fail=false}={}){
 const called=[]
 const api=createStripeOnboardingApi({env:{STRIPE_SECRET_KEY:'fake',STRIPE_WEBHOOK_SECRET:'fake',VERCEL_ENV:'production'},log:()=>{},getStripe:()=>({webhooks:{constructEvent:()=>{if(badSignature)throw Error();return {id:'evt_a',type:eventType,data:{object:session}}}},checkout:{sessions:{retrieve:async()=>session}}}),runOnboarding:async p=>{called.push(p);if(fail)throw Error('test');return {project_slug:'test',email_sent:true,access_url:'SECRET'}}})
 const request=()=>new Request('https://example.invalid/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'test'})
 return {api,called,request}
}
test('signed paid session uses canonical session id and never exposes production access URL',async()=>{
 const f=setup();assert.equal((await f.api.webhook(f.request())).status,200);assert.equal(f.called[0].external_order_id,SESSION.id)
 const result=await f.api.complete(SESSION.id);assert.equal(result.access_url,null);assert.equal(result.ready,true)
})
test('unsigned or tampered webhook cannot activate a project',async()=>{
 const f=setup({badSignature:true});assert.equal((await f.api.webhook(f.request())).status,400);assert.equal(f.called.length,0)
 assert.equal((await f.api.webhook(new Request('https://example.invalid'))).status,400)
})
test('unpaid completed event waits; delayed success can finish onboarding',async()=>{
 const f=setup({session:{...SESSION,payment_status:'unpaid'}});assert.equal((await f.api.webhook(f.request())).status,200);assert.equal(f.called.length,0)
 assert.equal((await f.api.complete(SESSION.id)).ready,false)
 const success=setup({eventType:'checkout.session.async_payment_succeeded'});assert.equal((await success.api.webhook(success.request())).status,200);assert.equal(success.called.length,1)
})
test('failed async payment or unrelated event never activates a project',async()=>{
 for(const eventType of ['checkout.session.async_payment_failed','charge.refunded']){const f=setup({eventType});await f.api.webhook(f.request());assert.equal(f.called.length,0)}
})
test('wrong currency, package price, payment mode and public production test session are rejected',()=>{
 for(const patch of [{currency:'usd'},{amount_total:12900},{mode:'subscription'},{livemode:false}]) assert.throws(()=>paidSessionPayload({...SESSION,...patch},null,{VERCEL_ENV:'production'}))
})
test('onboarding error returns retryable webhook response; malformed session is rejected',async()=>{
 const f=setup({fail:true});assert.equal((await f.api.webhook(f.request())).status,500)
 await assert.rejects(f.api.complete('garbage'),/Invalid checkout/)
})

test('expired checkout stops polling and never provisions a project',async()=>{
 const f=setup({session:{...SESSION,status:'expired',payment_status:'unpaid'}});assert.deepEqual(await f.api.complete(SESSION.id),{ready:false,expired:true,livemode:true});assert.equal(f.called.length,0)
})
