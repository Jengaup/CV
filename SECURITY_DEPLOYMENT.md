# Security Deployment Guide

**josealbertopr.com — manual configuration steps**  
Date: 2026-10-29  
Author: security audit session

This document contains the exact steps to complete the security hardening that cannot be done from the repository alone. All steps require access to external control panels.

---

## Status overview

| Finding | Fixed in repo? | Requires external action? |
|---|---|---|
| 1. HTTP → HTTPS redirect | No | **Yes — Cloudflare** |
| 2. HTTP security headers (HSTS, CSP, etc.) | Partial (meta tags updated) | **Yes — Cloudflare Worker** |
| 3. EmailJS SRI hash missing | Partially (commented procedure) | **Yes — owner generates hash** |
| 4. Form controls only in browser | Worker code in repo | **Yes — Cloudflare Worker deploy + Turnstile setup** |
| 5. EmailJS identifiers obfuscated | Documented | No (public by design) |
| 6. robots.txt blocks render resources | **Fixed in repo** | No |

---

## §1 — HTTP → HTTPS permanent redirect (Cloudflare)

**Why:** The passive scan showed HTTP responses without a 301/308 redirect. GitHub Pages alone does not guarantee a redirect for HTTP requests to a custom domain. Cloudflare must enforce it.

**Steps (Cloudflare dashboard):**

1. Log in → select zone **josealbertopr.com**
2. Go to **SSL/TLS** → **Edge Certificates**
3. Enable **Always Use HTTPS** (toggle ON)
   - This creates a 301 redirect for all HTTP requests
4. Verify:
   ```
   curl -I http://josealbertopr.com/
   ```
   Expected: `HTTP/1.1 301 Moved Permanently` with `Location: https://josealbertopr.com/`

**Preserve path:** Cloudflare's "Always Use HTTPS" preserves path, query parameters, and fragment. No additional redirect rule is needed.

**Verify no redirect loop:**
```
curl -IL http://josealbertopr.com/
```
Should resolve to a final 200 on `https://josealbertopr.com/` with no loop.

---

## §2 — HTTP security response headers (Cloudflare Worker or Transform Rules)

**Why:** `<meta http-equiv>` tags do not set actual HTTP headers. `frame-ancestors` in a meta CSP is ignored by all browsers. HSTS cannot be set via meta tag at all.

**Two options — choose one:**

### Option A: Cloudflare Response Header Transform Rules (simpler, no code)

1. Cloudflare dashboard → **Rules** → **Transform Rules** → **Modify Response Header**
2. Create a rule:
   - **When:** `Hostname equals josealbertopr.com`
   - **Then (Set headers):**

| Header name | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Content-Security-Policy` | *(see CSP value below)* |

**CSP header value (copy exactly — replace WORKER_HOSTNAME first):**
```
default-src 'none'; script-src 'self' https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://josealbertopr.com; connect-src 'self' https://api.emailjs.com https://challenges.cloudflare.com https://WORKER_HOSTNAME; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```

**CSP origin justification:**

| Origin | Directive | Reason |
|---|---|---|
| `https://cdn.jsdelivr.net` | script-src | EmailJS SDK CDN |
| `https://challenges.cloudflare.com` | script-src, frame-src, connect-src | Turnstile widget |
| `https://fonts.googleapis.com` | style-src | Google Fonts CSS |
| `https://fonts.gstatic.com` | font-src | Google Fonts binary files |
| `https://api.emailjs.com` | connect-src | EmailJS API (dev fallback only; remove after Worker is live) |
| `https://WORKER_HOSTNAME` | connect-src | Cloudflare Worker contact endpoint |
| `'self'` | multiple | Own origin for scripts, styles, images, fetch |
| `'unsafe-inline'` | style-src | Required for CSS custom properties set inline; no script inline |

**Note:** Once the Worker is live and `WORKER_URL` in `main.js` is set to the real Worker hostname, remove `https://api.emailjs.com` from `connect-src` — the browser will no longer call EmailJS directly.

### Option B: Cloudflare Worker (used together with §4 Worker)

The `_worker.js` file in the repository already sets these headers on every response it handles. If using Cloudflare Pages with `_worker.js`, responses from the Worker carry all headers automatically.

For responses that bypass the Worker (static asset requests), add a Transform Rule as in Option A, or configure a Cloudflare Page Rule to add headers globally.

---

## §3 — EmailJS SDK SRI hash

**Why:** The script tag loads `email.min.js` from jsDelivr CDN without an `integrity=` attribute. An SRI hash ensures the browser rejects any modified version of the file.

**Option A (recommended): host the SDK locally**

1. Download the pinned file:
   ```
   curl -o vendor/emailjs.min.js \
     "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
   ```
2. Commit `vendor/emailjs.min.js` to the repository
3. In `index.html`, replace:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   ```
   with:
   ```html
   <script src="vendor/emailjs.min.js"></script>
   ```
4. Remove `https://cdn.jsdelivr.net` from `script-src` in both the CSP meta tag and the Cloudflare header rule
5. When upgrading EmailJS: repeat steps 1–4 with the new version

**Option B: SRI hash on CDN URL**

1. Download the file and compute the hash:
   ```
   curl -sS "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" \
     | openssl dgst -sha384 -binary | openssl base64 -A
   ```
2. In `index.html`, replace the script tag with:
   ```html
   <script
     src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
     integrity="sha384-HASH_FROM_STEP_1"
     crossorigin="anonymous">
   </script>
   ```
3. **Important:** If jsDelivr ever reserialises the file (even whitespace changes), the hash will break and the script will be blocked. Pin to the exact version in the URL (already done with `@4`) and regenerate the hash if the file changes.

**Verification:** Open browser DevTools → Console. If the hash is wrong, you will see a `Failed to find a valid digest in the 'integrity' attribute` error.

---

## §4 — Cloudflare Turnstile + Worker deployment

**Why:** The contact form previously relied on client-side controls only (localStorage, timing, Math.random token). These can be bypassed by sending direct HTTP requests. The Worker validates the Turnstile token server-side and applies server-enforced rate limiting.

### Step 4a: Create a Turnstile site

1. Cloudflare dashboard → **Turnstile** → **Add Site**
2. Name: `josealbertopr.com contact form`
3. Domain: `josealbertopr.com`
4. Widget type: **Managed** (recommended; falls back to challenge if suspicious)
5. Save → copy **Site Key** (public) and **Secret Key** (keep secret)

6. In `index.html`, replace the placeholder sitekey:
   ```html
   data-sitekey="0x4AAAAAABBBBBBBBBBBBBBBsitekey"
   ```
   with your actual Site Key:
   ```html
   data-sitekey="0x4AAAAAAA-YOUR-ACTUAL-SITE-KEY"
   ```

### Step 4b: Deploy the Worker

**Option 1: Cloudflare Pages with `_worker.js` (simplest)**

If the site is already on Cloudflare Pages (not just GitHub Pages with a CNAME), `_worker.js` in the repository root is automatically deployed as the Worker for that Pages project.

1. In Cloudflare Pages → your project → **Settings** → **Functions** → **Environment variables**
2. Add these variables (mark all as **Secret** / encrypted):

| Variable name | Value | Secret? |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Your Turnstile secret key | YES |
| `EMAILJS_USER_ID` | Your EmailJS public key | YES |
| `EMAILJS_SERVICE_ID` | Your EmailJS service ID | YES |
| `EMAILJS_TEMPLATE_ID` | Your EmailJS template ID | YES |
| `ALLOWED_ORIGIN` | `https://josealbertopr.com` | No |

3. Redeploy the Pages project

**Option 2: Standalone Cloudflare Worker**

1. Cloudflare dashboard → **Workers & Pages** → **Create Worker**
2. Paste the contents of `_worker.js` into the editor
3. Set the environment variables listed above
4. Deploy → note the Worker URL (e.g. `https://contact.josealbertopr.workers.dev`)
5. In `main.js`, replace:
   ```js
   var WORKER_URL = 'https://WORKER_HOSTNAME/contact';
   ```
   with:
   ```js
   var WORKER_URL = 'https://contact.josealbertopr.workers.dev/contact';
   ```
   (or your custom route)
6. Add a custom route in Cloudflare if you want `https://josealbertopr.com/contact` instead of the `.workers.dev` URL

### Step 4c: Verify Worker deployment

```bash
# Should return {"error":"Missing verification token"} with 400
curl -X POST https://YOUR_WORKER_URL/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"This is a test message for security verification."}'

# Should return {"error":"Forbidden"} with 403 (wrong origin)
curl -X POST https://YOUR_WORKER_URL/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.example.com" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"This is a test message."}'

# Should return {"error":"Forbidden"} with 403 (invalid Turnstile token)
curl -X POST https://YOUR_WORKER_URL/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://josealbertopr.com" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"This is a test message.","cf-turnstile-response":"invalid-token"}'
```

### Step 4d: Cloudflare rate limiting (recommended)

Add a rate limiting rule in Cloudflare dashboard → **Security** → **WAF** → **Rate limiting rules**:

- **Rule name:** Contact form rate limit
- **When:** `http.request.uri.path eq "/contact"` and `http.request.method eq "POST"`
- **Rate:** 5 requests per 60 seconds per IP
- **Action:** Block (or Managed Challenge)

This enforces rate limiting at the network edge, before the Worker runs.

---

## §5 — robots.txt and bot protection

**What was changed:** `robots.txt` was rewritten (see the file in the repository). The previous version disallowed `/main.js` and `/i18n.js`, which prevented search engines from rendering the page correctly. Those disallows have been removed.

**Cloudflare bot protection (recommended):**

1. Cloudflare dashboard → **Security** → **Bots** → enable **Bot Fight Mode** (free) or **Super Bot Fight Mode** (Pro)
2. For the contact form endpoint (`/contact` or `/#contact`), add a **Managed Challenge** rule:
   - **When:** `http.request.uri contains "contact"` and bot score is low
   - **Action:** Managed Challenge

**Do not use robots.txt to block scrapers.** Malicious bots ignore it. Use Cloudflare WAF rules for real enforcement.

---

## §6 — HSTS `preload` — NOT enabled (decision required)

The HSTS header is set to `max-age=31536000; includeSubDomains` but **without `preload`**.

Adding `preload` would submit the domain to browser HSTS preload lists. Once submitted:
- All browsers enforce HTTPS for the domain even on the first visit
- Removing it from the list takes months and browsers may not update for years
- **All subdomains must also work exclusively over HTTPS before enabling**

**Action required from owner:** Confirm that all subdomains (`www.josealbertopr.com`, any others) serve exclusively over HTTPS before adding `preload`. If confirmed, add `; preload` to the HSTS value and submit at https://hstspreload.org.

---

## §7 — EmailJS credentials (finding #5)

The EmailJS public key, service ID, and template ID are split across array literals in `main.js` to deter automated scraping. These are **public-facing credentials** by EmailJS's design — they are safe to be in client-side code, and the split is cosmetic deterrence only.

Once the Worker is live:
- The Worker uses `env.EMAILJS_USER_ID`, `env.EMAILJS_SERVICE_ID`, `env.EMAILJS_TEMPLATE_ID` from encrypted environment variables
- The browser no longer calls EmailJS directly
- The credential variables in `main.js` become dead code and should be removed

**EmailJS dashboard hardening (recommended):**
1. In EmailJS dashboard → **Email Services** → set **Allowed Domains** to `josealbertopr.com` only
2. Set a **monthly quota** cap appropriate for a personal portfolio (e.g. 50–100 messages/month)
3. Enable email notification when quota is nearly exhausted

---

## §8 — Monitoring and allowlist

**Authorised monitoring:**
- Cloudflare dashboard **Analytics** tab provides traffic and security metrics without any client-side beacon
- Uptime monitoring services (e.g. UptimeRobot) should be added to a Cloudflare WAF rule or allowlisted by IP to bypass bot challenges

**Creating an allowlist rule (Cloudflare):**
1. **Security** → **WAF** → **Tools** → **IP Access Rules**
2. Add the monitoring service's IP range with action **Allow**
3. Scope to **This zone only**

**Do not:**
- Disable the WAF globally to accommodate monitoring
- Add broad IP ranges as allowlists

---

## Verification checklist (post-deployment)

Run these after completing all steps above:

```bash
# 1. HTTP → HTTPS redirect
curl -I http://josealbertopr.com/
# Expect: 301 or 308 with Location: https://josealbertopr.com/

# 2. No redirect loop
curl -IL http://josealbertopr.com/ | grep -E "HTTP/|Location:"
# Expect: one 301/308 then one 200

# 3. Security headers present
curl -I https://josealbertopr.com/ | grep -E "strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy"
# Expect: all five headers present

# 4. CSP does not block legitimate resources
# Open the site in browser → DevTools → Console: no CSP errors

# 5. Turnstile widget loads and shows
# Load https://josealbertopr.com/#contact in browser
# Expect: Cloudflare "Verify you are human" widget visible

# 6. Form submission with valid data reaches Worker
# (use browser, complete Turnstile, submit form with [PRUEBA SEGURIDAD] subject)
# Expect: success message displayed, email received

# 7. robots.txt
curl https://josealbertopr.com/robots.txt
# Expect: no Disallow: /main.js, no Disallow: /i18n.js

# 8. HSTS
curl -I https://josealbertopr.com/ | grep -i strict-transport
# Expect: max-age=31536000; includeSubDomains
```

---

## Residual risks after full deployment

| Risk | Severity | Notes |
|---|---|---|
| EmailJS SDK without SRI | Medium | Mitigated if vendor/emailjs.min.js approach used; mitigated if Worker is primary path |
| Turnstile sitekey in HTML | Low | Public by design; secret key is server-side only |
| `'unsafe-inline'` in style-src | Low | Required for CSS custom properties; no script inline exists |
| EmailJS public key in main.js (dev fallback) | Low | Remove once Worker is live and confirmed working |
| No formal WCAG audit | Low | Partial conformance declared in accessibility statement |
| No automated security scanning | Info | Consider periodic Cloudflare Observatory scans |
