# Security Deployment Guide — josealbertopr.com

Steps that cannot be done from the repository. Do them in order; each has a verification command.
Until steps 3–5 are done, the contact form runs on the **legacy path** (browser → EmailJS directly),
which has no server-side protection. After step 5 that path is no longer used.

## 1. Force HTTPS (Cloudflare)

SSL/TLS → Edge Certificates → **Always Use HTTPS = On**. SSL/TLS mode should be **Full (strict)**
(GitHub Pages serves a valid certificate for the custom domain).
Path, query string and fragment are preserved by this redirect.

```
curl -sI http://josealbertopr.com/ | head -3        # expect 301 + Location: https://josealbertopr.com/
curl -sIL http://josealbertopr.com/ | grep -E "^HTTP|^location"   # one redirect, then 200, no loop
```

DNS records for the site must be **proxied (orange cloud)**, otherwise none of the Cloudflare rules apply.

## 2. HTTP security headers (Cloudflare → Rules → Transform Rules → Modify Response Header)

Rule: When `Hostname equals josealbertopr.com` → Set static:

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| Content-Security-Policy | see below |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |

Before enabling `includeSubDomains`, confirm every subdomain (e.g. `www`) works over HTTPS only.
Do **not** add `preload` without reading https://hstspreload.org (removal takes months).

CSP (final, for when the Worker is live):

```
default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```

| Origin | Directive | Why |
|---|---|---|
| `'self'` | script, connect, img | own JS, own `/api/contact` Worker route, own images |
| challenges.cloudflare.com | script, frame, connect | Turnstile widget |
| fonts.googleapis.com | style | Google Fonts CSS |
| fonts.gstatic.com | font | Google Fonts files |
| `'unsafe-inline'` | style | inline style attributes in the page; no inline scripts exist |

While still on the legacy path, temporarily add `https://api.emailjs.com` to `connect-src`.
The `<meta>` CSP in `index.html` is only a fallback and already lists it; keep both in sync.

```
curl -sI https://josealbertopr.com/ | grep -iE "strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy"
```

## 3. Turnstile

Cloudflare → Turnstile → Add widget, domain `josealbertopr.com`, mode Managed.
Put the **site key** (public) in `main.js` as `TURNSTILE_SITEKEY`. Keep the **secret key** for step 4.

## 4. Deploy the Worker (`worker/`)

```
cd worker
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put EMAILJS_USER_ID
npx wrangler secret put EMAILJS_SERVICE_ID
npx wrangler secret put EMAILJS_TEMPLATE_ID
npx wrangler secret put EMAILJS_PRIVATE_KEY     # EmailJS → Account → Security: enable "Use Private Key"
npx wrangler deploy
```

`wrangler.toml` routes `josealbertopr.com/api/contact` (same origin, so no extra CSP host) and enables
native rate limiting (5 requests / 60 s / IP). The Worker checks Origin, Content-Type, size, field
limits, email format, Turnstile (single-use tokens, validated server-side) and never logs message content.
Offline tests: `node worker/contact-worker.test.mjs`.

EmailJS dashboard: restrict allowed domains to `josealbertopr.com`, set a monthly quota cap.

## 5. Switch the site to the Worker path

In `main.js` set `WORKER_URL = '/api/contact'` and `TURNSTILE_SITEKEY = '<site key>'`, commit, deploy.
Then (optional hardening) delete the legacy EmailJS branch and `vendor/emailjs-4.4.1.min.js`, and remove
`https://api.emailjs.com` from `connect-src`. Rotate the EmailJS public key afterwards, since the old
one was published in `main.js` history.

Verify (each test mail must have `[PRUEBA SEGURIDAD]` in the subject; max 3):

```
curl -si -X POST https://josealbertopr.com/api/contact -H "Content-Type: application/json" -H "Origin: https://josealbertopr.com" -d '{}'                      # 400
curl -si -X POST https://josealbertopr.com/api/contact -H "Content-Type: application/json" -H "Origin: https://evil.example" -d '{}'                         # 403
curl -si -X POST https://josealbertopr.com/api/contact -H "Content-Type: application/json" -H "Origin: https://josealbertopr.com" -d '{"cf-turnstile-response":"x"}'   # 403
```
Then submit once from the browser and confirm the email arrives and the console shows no CSP errors.

## 6. Bots, crawlers, monitoring

- Security → Bots: enable Bot Fight Mode (or Super Bot Fight Mode on paid plans). Prefer **Managed Challenge** over Block.
- Optional WAF rate-limit rule on `/api/contact` as a second layer.
- Cloudflare AI-crawler controls (Security → Bots → AI Scrapers and Crawlers) enforce training-bot blocking better than robots.txt.
- Allow authorised monitors with a narrow WAF Skip rule on their exact IPs and path; never disable the WAF globally.
- Search crawlers: robots.txt allows Googlebot/Bingbot and the JS needed to render the page.

## 7. Analytics

No analytics code exists in the repository. In Cloudflare → Analytics & Logs → Web Analytics, make sure no
site is enabled for this hostname (Cloudflare can auto-inject the beacon). If it is enabled, either disable it
or disclose it in `privacy.html`. Check with `curl -s https://josealbertopr.com/ | grep -i beacon`.

## Not verified from the repository

Live headers, redirects, Cloudflare/EmailJS settings and the real Turnstile flow could not be tested
(the build environment has no access to the live site or your panels).
