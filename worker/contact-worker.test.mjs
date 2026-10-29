import assert from 'node:assert/strict';
import worker from './contact-worker.js';

const env = { ALLOWED_ORIGIN: 'https://josealbertopr.com', TURNSTILE_SECRET_KEY: 's', EMAILJS_USER_ID: 'u', EMAILJS_SERVICE_ID: 'sv', EMAILJS_TEMPLATE_ID: 't', RATE_LIMITER: { limit: async () => ({ success: true }) } };
const good = { name: 'Test User', email: 'test@example.com', subject: '[PRUEBA SEGURIDAD] test', message: 'This is a mocked message for tests.', 'cf-turnstile-response': 'tok' };
let sent = 0, tsOk = true;
globalThis.fetch = async (u) => {
  if (String(u).includes('siteverify')) return new Response(JSON.stringify({ success: tsOk }));
  sent++; return new Response('OK', { status: 200 });
};
const call = (over = {}, hdr = {}, method = 'POST', e = env) => worker.fetch(new Request('https://josealbertopr.com/api/contact', {
  method, headers: { Origin: 'https://josealbertopr.com', 'Content-Type': 'application/json', ...hdr },
  body: method === 'POST' ? JSON.stringify({ ...good, ...over }) : undefined }), e);

assert.equal((await call()).status, 200); assert.equal(sent, 1);
assert.equal((await call({}, { Origin: 'https://evil.example' })).status, 403);
assert.equal((await call({}, { 'Content-Type': 'text/plain' })).status, 415);
assert.equal((await call({ 'cf-turnstile-response': '' })).status, 400);
tsOk = false; assert.equal((await call()).status, 403); tsOk = true;
assert.equal((await call({ message: 'short' })).status, 400);
assert.equal((await call({ email: 'bad' })).status, 400);
assert.equal((await call({ message: 'x'.repeat(20000) })).status, 413);
assert.equal((await call({}, {}, 'GET')).status, 405);
assert.equal((await call({}, {}, 'POST', { ...env, RATE_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
assert.equal(sent, 1);
console.log('worker tests: all passed');
