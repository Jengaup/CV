# Third-Party Services Audit

This document inventories all external services and resources loaded or referenced by josealbertopr.com.
Audited: October 25, 2026.

---

## Services Inventory

### 1. Google Fonts

**Purpose:** Web font delivery  
**Resources loaded:**
- `https://fonts.googleapis.com` — CSS stylesheet (font declarations)
- `https://fonts.gstatic.com` — Font binary files (woff2)

**Fonts loaded:**
- Space Grotesk (weights: 400, 600, 700, 800)
- Inter (weights: 300, 400, 500)

**Note:** JetBrains Mono is referenced in `styles.css` as a monospace fallback but is not loaded via Google Fonts (it falls back to system monospace).

**Data sent to Google:** Browser makes a request to `fonts.googleapis.com` which includes the user's IP address, user agent, and referer header. Google may log this as part of standard CDN infrastructure.  
**Cookies set:** None by this site's loading of Google Fonts.  
**Personal data collected by this site:** None.  
**Privacy policy:** https://policies.google.com/privacy  
**CSP coverage:** `style-src https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`

---

### 2. EmailJS

**Purpose:** Contact form email delivery  
**Resources loaded:**
- `vendor/emailjs-4.4.1.min.js` — EmailJS SDK hosted locally (no CDN)

**How it is used:**
- Loaded on `index.html` only (not on legal pages).
- Initialized with a public key (obfuscated in source; this is expected — EmailJS public keys are client-side credentials by design, not secrets).
- `emailjs.send()` is called only when the user submits the contact form.
- Data transmitted: name, email, subject, message body — exactly the fields the user entered.
- Data is transmitted to EmailJS's API (`api.emailjs.com`) over HTTPS.
- EmailJS delivers the message to the site owner's email inbox.

**Data sent to EmailJS:** Contact form submission content (name, email, subject, message).  
**Data stored by EmailJS:** Per EmailJS's terms, messages are processed for delivery and not persistently stored by EmailJS beyond delivery. See EmailJS privacy policy.  
**Cookies set:** None by EmailJS on this site.  
**Personal data collected by this site:** Only what the user voluntarily enters in the contact form.  
**Privacy policy:** https://www.emailjs.com/legal/privacy-policy/  
**CSP coverage:** `connect-src https://api.emailjs.com`, `script-src 'self'`

**Note on public key:** The EmailJS public key (`7z10gcbrRNaKaHB5m`) is obfuscated in `main.js` by splitting into segments that are reassembled at runtime. This is a mild deterrent to automated scraping but is not a security measure — any determined actor can recover the key from the rendered page. EmailJS public keys are designed to be safe in client-side code; they are scoped to specific service/template combinations and do not grant access to the owner's EmailJS account.

---

### 3. Cloudflare (proxy and Turnstile)

**Purpose:** DNS/proxy in front of GitHub Pages; Turnstile bot check on the contact form; Worker `/api/contact` that validates the check and relays the message to EmailJS.
**Data:** IP address and browser signals are processed by Cloudflare for delivery, security and Turnstile. Form content passes through the Worker, which does not store or log it.
**Cookies:** none set by this site; Turnstile does not use advertising cookies.
**Privacy policy:** https://www.cloudflare.com/privacypolicy/

### 4. GitHub Pages

**Purpose:** Static site hosting  
**Domain:** josealbertopr.com (CNAME to GitHub Pages)

**Data processed by GitHub:** GitHub's CDN and hosting infrastructure handles all HTTP requests. GitHub may log access data (IP address, user agent, request path, timestamp) as part of standard hosting operations. This is infrastructure-level logging, not analytics.  
**Cookies set by GitHub:** None specifically for this site.  
**Privacy policy:** https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement

---

### 5. LinkedIn (External Link Only)

**Purpose:** Professional networking profile link  
**Nature:** Outbound hyperlink only — no SDK, no embed, no pixel, no iframe.

**Data processed:** When a user clicks the LinkedIn link and navigates to LinkedIn, their IP address and browser information are transmitted to LinkedIn's servers. This is standard external navigation behavior and not within the control of this site.  
**Data collected by this site:** None from the LinkedIn link.  
**Privacy policy:** https://www.linkedin.com/legal/privacy-policy

---

## Services NOT Present

The following were confirmed absent during the audit:

| Service | Status |
|---|---|
| Google Analytics / GA4 | Not present |
| Google Tag Manager | Not present |
| Facebook Pixel | Not present |
| Any other analytics SDK | Not present |
| Any advertising network | Not present |
| Any social media tracking pixel | Not present |
| Hotjar / FullStory / session recording | Not present |
| Intercom / Drift / chat widgets | Not present |
| Sentry / Datadog / error tracking | Not present |
| Any third-party cookie | Not present |

---

## localStorage Usage (First-Party Only)

| Key | Purpose | Transmitted? |
|---|---|---|
| `lang` | Language preference (en/es) | Never |
| `_frq` | Contact form rate-limit counter (max 3/hour) | Never |

Both entries are set by first-party JavaScript and are never read by or transmitted to any external service.

---

## Summary

This site uses **4 active external services** (Google Fonts, EmailJS, Cloudflare incl. Turnstile; GitHub Pages as origin) and includes **1 outbound link** to LinkedIn. There is no analytics, no advertising, no tracking, and no third-party cookies. The only personal data collected is the contact form submission, processed by EmailJS for delivery to the site owner's inbox.
