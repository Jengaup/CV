/**
 * Contact form Worker (standalone Cloudflare Worker, route: josealbertopr.com/api/contact).
 * Validates origin, size, JSON shape, Turnstile (server-side) and rate limit, then sends via EmailJS.
 * Secrets (wrangler secret put): TURNSTILE_SECRET_KEY, EMAILJS_USER_ID, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID.
 * Never logs message content. Returns generic errors only.
 */
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EMAILJS_URL   = 'https://api.emailjs.com/api/v1.0/email/send';
const MAX_BODY      = 16384;
const LIMITS = { name: [2, 100], email: [5, 254], subject: [3, 200], message: [20, 3000] };
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function reply(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    }
  });
}

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/[<>"'`]/g, '').replace(/\s{3,}/g, '  ').trim().slice(0, max);
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN;
    const url = new URL(request.url);
    if (!allowed) return new Response('Misconfigured', { status: 500 });

    if (url.pathname !== '/api/contact') return new Response('Not found', { status: 404 });
    if (request.method === 'OPTIONS') return reply(204, null, allowed);
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' }, allowed);
    if (request.headers.get('Origin') !== allowed) return reply(403, { error: 'Forbidden' }, allowed);
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) {
      return reply(415, { error: 'Unsupported media type' }, allowed);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return reply(429, { error: 'Too many requests' }, allowed);
    }

    let raw;
    try { raw = await request.text(); } catch { return reply(400, { error: 'Bad request' }, allowed); }
    if (raw.length > MAX_BODY) return reply(413, { error: 'Payload too large' }, allowed);
    let body;
    try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Bad request' }, allowed); }
    if (!body || typeof body !== 'object') return reply(400, { error: 'Bad request' }, allowed);

    const token = typeof body['cf-turnstile-response'] === 'string' ? body['cf-turnstile-response'] : '';
    if (!token || token.length > 2048) return reply(400, { error: 'Bad request' }, allowed);

    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET_KEY || '');
    form.append('response', token);
    form.append('remoteip', ip);
    let verdict;
    try { verdict = await (await fetch(TURNSTILE_URL, { method: 'POST', body: form })).json(); }
    catch { return reply(502, { error: 'Service error' }, allowed); }
    if (!verdict || verdict.success !== true) return reply(403, { error: 'Forbidden' }, allowed);

    const f = {};
    for (const k of Object.keys(LIMITS)) {
      f[k] = clean(body[k], LIMITS[k][1]);
      if (f[k].length < LIMITS[k][0]) return reply(400, { error: 'Bad request' }, allowed);
    }
    if (!EMAIL_RE.test(f.email)) return reply(400, { error: 'Bad request' }, allowed);

    try {
      const res = await fetch(EMAILJS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: env.EMAILJS_SERVICE_ID,
          template_id: env.EMAILJS_TEMPLATE_ID,
          user_id: env.EMAILJS_USER_ID,
          accessToken: env.EMAILJS_PRIVATE_KEY || undefined,
          template_params: { from_name: f.name, from_email: f.email, subject: f.subject, message: f.message }
        })
      });
      if (!res.ok) return reply(502, { error: 'Service error' }, allowed);
    } catch { return reply(502, { error: 'Service error' }, allowed); }

    return reply(200, { success: true }, allowed);
  }
};
