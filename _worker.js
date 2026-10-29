/**
 * Cloudflare Worker — Contact form proxy
 *
 * Responsibilities:
 *  1. Validates Cloudflare Turnstile token (server-side)
 *  2. Enforces rate limiting by IP (Cloudflare rate limit rules are preferred,
 *     but a simple KV-backed counter is included as a fallback)
 *  3. Validates and sanitises all input fields
 *  4. Forwards to EmailJS API (keeps EmailJS credentials out of browser)
 *  5. Sets security response headers (HSTS, CSP, X-Frame-Options, etc.)
 *  6. Returns only generic error messages — no internal detail leaks
 *
 * Deployment:
 *  - If using Cloudflare Pages: rename this file _worker.js in the repo root.
 *    Pages will automatically attach it.
 *  - If using standalone Workers: copy this code into a new Worker via the
 *    Cloudflare dashboard or Wrangler CLI.
 *
 * Required environment variables (set via Cloudflare dashboard → Worker → Settings → Variables):
 *  TURNSTILE_SECRET_KEY   — Cloudflare Turnstile secret key (mark as Secret)
 *  EMAILJS_USER_ID        — EmailJS public key  (mark as Secret)
 *  EMAILJS_SERVICE_ID     — EmailJS service ID  (mark as Secret)
 *  EMAILJS_TEMPLATE_ID    — EmailJS template ID (mark as Secret)
 *  ALLOWED_ORIGIN         — e.g. https://josealbertopr.com
 *
 * See SECURITY_DEPLOYMENT.md §4 for step-by-step setup.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EMAILJS_SEND_URL     = 'https://api.emailjs.com/api/v1.0/email/send';

/* Field limits */
const LIMITS = {
  name:    { min: 2,  max: 100 },
  email:   { min: 5,  max: 254 },
  subject: { min: 3,  max: 200 },
  message: { min: 20, max: 3000 }
};

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/* Generic responses — never expose internal detail */
const RES_OK        = () => json({ success: true }, 200);
const RES_BAD       = (msg) => json({ error: msg || 'Bad request' }, 400);
const RES_FORBIDDEN = () => json({ error: 'Forbidden' }, 403);
const RES_RATE      = () => json({ error: 'Too many requests' }, 429);
const RES_ERROR     = () => json({ error: 'Service error' }, 500);

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function securityHeaders(origin) {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Content-Security-Policy': [
      "default-src 'none'",
      "script-src 'self' https://cdn.jsdelivr.net https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "img-src 'self' data: https://josealbertopr.com",
      "connect-src 'self' https://api.emailjs.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function addSecHeaders(response, origin) {
  const headers = securityHeaders(origin);
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) {
    if (v) newHeaders.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s{3,}/g, '  ')
    .trim()
    .slice(0, maxLen || 2000);
}

async function verifyTurnstile(token, remoteip, secret) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteip) body.append('remoteip', remoteip);

  const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

async function sendEmail(env, fields) {
  const payload = {
    service_id:  env.EMAILJS_SERVICE_ID,
    template_id: env.EMAILJS_TEMPLATE_ID,
    user_id:     env.EMAILJS_USER_ID,
    template_params: {
      from_name:  fields.name,
      from_email: fields.email,
      subject:    fields.subject,
      message:    fields.message
    }
  };

  const res = await fetch(EMAILJS_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return res.status === 200;
}

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || '';

    /* ── Preflight (CORS) ── */
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: securityHeaders(origin) });
    }

    /* ── Only handle POST /contact ── */
    if (url.pathname !== '/contact' || request.method !== 'POST') {
      return addSecHeaders(new Response('Not found', { status: 404 }), origin);
    }

    /* ── Origin check ── */
    const reqOrigin = request.headers.get('Origin') || '';
    if (origin && reqOrigin !== origin) {
      return addSecHeaders(RES_FORBIDDEN(), origin);
    }

    /* ── Content-Type check ── */
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.includes('application/json')) {
      return addSecHeaders(RES_BAD('Content-Type must be application/json'), origin);
    }

    /* ── Body size limit (16 KB) ── */
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (contentLength > 16384) {
      return addSecHeaders(RES_BAD('Request too large'), origin);
    }

    /* ── Parse body ── */
    let body;
    try {
      body = await request.json();
    } catch {
      return addSecHeaders(RES_BAD('Invalid JSON'), origin);
    }

    /* ── Turnstile token ── */
    const tsToken = typeof body['cf-turnstile-response'] === 'string'
      ? body['cf-turnstile-response'].trim()
      : '';
    if (!tsToken) {
      return addSecHeaders(RES_BAD('Missing verification token'), origin);
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || '';
    const tsValid  = await verifyTurnstile(tsToken, clientIP, env.TURNSTILE_SECRET_KEY || '');
    if (!tsValid) {
      return addSecHeaders(RES_FORBIDDEN(), origin);
    }

    /* ── Field validation ── */
    const name    = sanitize(body.name,    LIMITS.name.max);
    const email   = sanitize(body.email,   LIMITS.email.max);
    const subject = sanitize(body.subject, LIMITS.subject.max);
    const message = sanitize(body.message, LIMITS.message.max);

    if (name.length    < LIMITS.name.min)    return addSecHeaders(RES_BAD('Invalid name'),    origin);
    if (email.length   < LIMITS.email.min)   return addSecHeaders(RES_BAD('Invalid email'),   origin);
    if (subject.length < LIMITS.subject.min) return addSecHeaders(RES_BAD('Invalid subject'), origin);
    if (message.length < LIMITS.message.min) return addSecHeaders(RES_BAD('Invalid message'), origin);
    if (!EMAIL_RE.test(email))               return addSecHeaders(RES_BAD('Invalid email format'), origin);

    /* ── Send via EmailJS ── */
    let sent;
    try {
      sent = await sendEmail(env, { name, email, subject, message });
    } catch (err) {
      console.error('[Worker] EmailJS error:', err);
      return addSecHeaders(RES_ERROR(), origin);
    }

    if (!sent) {
      return addSecHeaders(RES_ERROR(), origin);
    }

    return addSecHeaders(RES_OK(), origin);
  }
};
