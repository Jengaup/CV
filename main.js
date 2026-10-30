/* ============================================================
   CONTACT FORM CONFIG
   WORKER_URL: Cloudflare Worker endpoint (validates Turnstile, rate-limits, sends mail).
   TURNSTILE_SITEKEY: public Turnstile site key (safe to publish; the secret lives in the Worker).
   While WORKER_URL is unset the form uses the legacy direct-EmailJS path, which has NO
   server-side protection. Set both values to enable the protected path. See SECURITY_DEPLOYMENT.md.
   ============================================================ */
var WORKER_URL        = '';
var TURNSTILE_SITEKEY = '';

/* EmailJS identifiers: public by EmailJS design. Used only by the legacy path above. */
var _k = ['7z10g','cbrRN','aKaHB','5m'].join('');
var _s = ['servi','ce_wf','iejqb'].join('');
var _t = ['templ','ate_r','jtij7','1'].join('');

/* ============================================================
   PORTFOLIO NOTICE
   ============================================================ */
console.log(
  '%cJosealbertopr.com — Personal professional portfolio.',
  'color:#2563eb;font-size:13px;'
);

/* ============================================================
   NAVIGATION — mobile toggle
   ============================================================ */
(function () {
  var hamburger  = document.querySelector('.nav__hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.hidden = expanded;
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
        hamburger.focus();
      }
    });
  }

  // Footer year
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ============================================================
   STAT COUNTER ANIMATION
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function parseTarget(el) {
    var raw = el.getAttribute('data-stat-raw') || el.textContent.trim();
    var prefix = raw.match(/^[\$]/) ? raw[0] : '';
    var suffix = raw.match(/[+%KM]+$/) ? raw.match(/[+%KM]+$/)[0] : '';
    var num    = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
    return { prefix: prefix, suffix: suffix, num: num, decimals: (raw.indexOf('.') > -1) ? 1 : 0 };
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(el, duration) {
    var parsed = parseTarget(el);
    if (parsed.num === 0) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var val = easeOutQuart(t) * parsed.num;
      el.textContent = parsed.prefix +
        (parsed.decimals ? val.toFixed(parsed.decimals) : Math.round(val)) +
        parsed.suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var stats = document.querySelectorAll('.hero__stat-value');
  stats.forEach(function (el) {
    el.setAttribute('data-stat-raw', el.textContent.trim());
    el.textContent = '0';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target, 1400);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  stats.forEach(function (el) { observer.observe(el); });
})();

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = document.querySelectorAll(
    '.value-card, .expertise-card, .impact-card, .timeline-item__content, ' +
    '.education__item, .about__text, .about__values, .section__title, ' +
    '.section__sub, .contact__info, .contact__form-wrap'
  );

  targets.forEach(function (el) { el.classList.add('reveal'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();

/* ============================================================
   NAV — active section highlight + shared sliding indicator
   ============================================================ */
(function () {
  var sections = document.querySelectorAll('main section[id]');
  var list = document.querySelector('.nav__links');
  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  var indicator = document.querySelector('.nav__indicator');
  if (!sections.length || !navLinks.length) return;

  var activeLink = null;
  var lockUntil = 0;
  var placed = false;

  function place() {
    if (!indicator || !list) return;
    /* Hidden (mobile) or no active link, or the CTA button which carries its own highlight */
    if (!activeLink || activeLink.classList.contains('nav__cta') || !activeLink.offsetWidth) {
      indicator.classList.remove('is-visible');
      return;
    }
    var x = activeLink.offsetLeft;
    var y = activeLink.offsetTop + activeLink.offsetHeight;
    var w = activeLink.offsetWidth;
    indicator.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scaleX(' + w + ')';
    if (!placed) {
      placed = true;
      indicator.classList.add('is-visible');
      requestAnimationFrame(function () { indicator.classList.add('is-animated'); });
    } else {
      indicator.classList.add('is-visible');
    }
  }

  function setActive(id) {
    var next = null;
    navLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('nav__link--active', active);
      if (active) { link.setAttribute('aria-current', 'true'); next = link; }
      else link.removeAttribute('aria-current');
    });
    activeLink = next;
    place();
  }

  var observer = new IntersectionObserver(function (entries) {
    if (Date.now() < lockUntil) return;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { threshold: 0, rootMargin: '-45% 0px -50% 0px' }); /* thin reading band: works for sections of any height */
  sections.forEach(function (s) { observer.observe(s); });

  /* Clicking a link selects it immediately; ignore intermediate sections while smooth-scrolling */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      lockUntil = Date.now() + 900;
      setActive(link.getAttribute('href').slice(1));
    });
  });

  /* Initial state from hash */
  if (location.hash) setActive(location.hash.slice(1));

  /* Re-measure on resize (ResizeObserver also covers font load and language text changes) */
  if (window.ResizeObserver && list) new ResizeObserver(function () { place(); }).observe(list);
  window.addEventListener('resize', function () { requestAnimationFrame(place); });
  document.addEventListener('i18n:change', function () { requestAnimationFrame(place); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();

/* ============================================================
   CERTIFICATIONS — accessible filters (progressive enhancement)
   ============================================================ */
(function () {
  var group = document.getElementById('certs-filters');
  var grid = document.querySelector('.certs-grid');
  var counter = document.getElementById('certs-count');
  if (!group || !grid) return;

  var buttons = Array.prototype.slice.call(group.querySelectorAll('button[data-filter]'));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.cert-card'));
  var indicator = group.querySelector('.certs-legend__indicator');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FADE_MS = 150;
  var current = 'all';
  var pending = null;   /* latest requested filter during a fade */
  var timer = null;
  var announce = false; /* only announce after a user selection */

  function t(key, fb) { return window.i18n ? window.i18n.t(key) : fb; }

  function matches(card, f) {
    if (f === 'all') return true;
    return (card.getAttribute('data-category') || '').split(/\s+/).indexOf(f) !== -1;
  }

  function renderCount(live) {
    if (!counter) return;
    var shown = cards.filter(function (c) { return !c.hidden; }).length;
    var tpl = t('certs.count', 'Showing {n} of {total} credentials');
    var text = tpl.replace('{n}', shown).replace('{total}', cards.length);
    if (live) { counter.textContent = text; return; }
    counter.setAttribute('aria-live', 'off');
    counter.textContent = text;
    setTimeout(function () { counter.setAttribute('aria-live', 'polite'); }, 150);
  }

  function placeIndicator() {
    if (!indicator) return;
    var btn = group.querySelector('button[aria-pressed="true"]');
    if (!btn || !btn.offsetWidth) return;
    indicator.style.transform = 'translate3d(' + btn.offsetLeft + 'px,' + (btn.offsetTop + btn.offsetHeight - 3) + 'px,0) scaleX(' + btn.offsetWidth + ')';
    if (!indicator.classList.contains('is-visible')) {
      indicator.classList.add('is-visible');
      requestAnimationFrame(function () { indicator.classList.add('is-animated'); });
    }
  }

  function setPressed(f) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)); });
    placeIndicator();
  }

  function apply(f) {
    cards.forEach(function (c) { c.hidden = !matches(c, f); });
    current = f;
    renderCount(announce);
  }

  function select(f, userInitiated, btn) {
    announce = userInitiated;
    setPressed(f);
    if (btn && group.scrollWidth > group.clientWidth) {
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    if (reduce.matches) {
      clearTimeout(timer); timer = null; pending = null;
      grid.classList.remove('is-fading');
      apply(f);
      return;
    }
    pending = f;
    if (timer) return; /* a swap is already scheduled; it will use the latest filter */
    grid.classList.add('is-fading');
    timer = setTimeout(function () {
      timer = null;
      try { apply(pending); }
      finally { requestAnimationFrame(function () { grid.classList.remove('is-fading'); }); }
    }, FADE_MS);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      if (f === (pending || current) && !timer) return;
      select(f, true, b);
    });
  });

  /* Initial state, language changes, resize */
  renderCount(false);
  document.addEventListener('i18n:change', function () { renderCount(false); requestAnimationFrame(placeIndicator); });
  if (window.ResizeObserver) new ResizeObserver(function () { placeIndicator(); }).observe(group);
  window.addEventListener('resize', function () { requestAnimationFrame(placeIndicator); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);
  requestAnimationFrame(placeIndicator);
})();

/* ============================================================
   CONTACT FORM — validation + security + EmailJS submission
   ============================================================ */
(function () {
  /* Mount Turnstile once its script and a site key are available */
  var tsWidgetId = null;
  (function mountTurnstile() {
    var slot = document.getElementById('turnstile-widget');
    if (!slot || !WORKER_URL || !TURNSTILE_SITEKEY) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (window.turnstile) {
        clearInterval(iv);
        tsWidgetId = window.turnstile.render(slot, { sitekey: TURNSTILE_SITEKEY, theme: 'auto' });
      } else if (++tries > 50) { clearInterval(iv); }
    }, 200);
  })();

  /* Wait for EmailJS SDK to be ready before init */
  function initEmailJS() {
    if (window.emailjs) { emailjs.init(_k); return true; }
    return false;
  }
  if (!initEmailJS()) {
    var _ejs_retries = 0;
    var _ejs_poll = setInterval(function () {
      if (initEmailJS() || ++_ejs_retries > 20) clearInterval(_ejs_poll);
    }, 200);
  }

  var form = document.getElementById('contact-form');
  if (!form) return;

  /* ── Rate limiting: persistent across page reloads via localStorage ── */
  var RATE_KEY    = '_frq';
  var RATE_WINDOW = 60 * 60 * 1000; // 1 hour window
  var MAX_SUBMITS = 3;

  function getRateData() {
    try {
      var d = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
      if (!d.ts || Date.now() - d.ts > RATE_WINDOW) return { count: 0, ts: Date.now() };
      return d;
    } catch (e) { return { count: 0, ts: Date.now() }; }
  }
  function bumpRate() {
    var d = getRateData();
    d.count++;
    try { localStorage.setItem(RATE_KEY, JSON.stringify(d)); } catch (e) {}
  }
  function isRateLimited() {
    return getRateData().count >= MAX_SUBMITS;
  }

  /* ── Bot timing detection: form must take >4s to fill ── */
  var pageLoadTime = Date.now();
  var MIN_FILL_MS  = 4000;

  /* ── Submission flag: prevents double-submit on slow network ── */
  var sessionToken = true; /* placeholder; actual anti-replay is enforced server-side by the Worker */

  /* ── Input sanitization ── */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[<>"'`]/g, '')            // strip injection chars
      .replace(/javascript:/gi, '')        // block js: URIs
      .replace(/on\w+\s*=/gi, '')          // strip event handlers
      .replace(/[\x00-\x1F\x7F]/g, '')    // strip control chars
      .replace(/\s{3,}/g, '  ')           // collapse whitespace
      .trim()
      .slice(0, 2000);
  }

  /* ── Email stricter validation ── */
  function validEmail(v) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v.trim());
  }

  var submitBtn  = document.getElementById('form-submit');
  var btnText    = submitBtn && submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn && submitBtn.querySelector('.btn__spinner');
  var successMsg = document.getElementById('form-success');
  var errorMsg   = document.getElementById('form-error-msg');

  if (successMsg) successMsg.hidden = true;
  if (errorMsg)   errorMsg.hidden   = true;

  var fields = {
    name: {
      el: document.getElementById('contact-name'),
      errEl: document.getElementById('name-error'),
      validate: function (v) {
        var t = window.i18n ? window.i18n.t.bind(window.i18n) : function (k, fb) { return fb; };
        if (v.trim().length < 2)   return t('form.err.nameMin',  'Please enter your full name (at least 2 characters).');
        if (v.trim().length > 100) return t('form.err.nameMax',  'Name is too long.');
        if (/[<>"'`]/.test(v))     return t('form.err.nameChars','Name contains invalid characters.');
        return '';
      }
    },
    email: {
      el: document.getElementById('contact-email'),
      errEl: document.getElementById('email-error'),
      validate: function (v) {
        var t = window.i18n ? window.i18n.t.bind(window.i18n) : function (k, fb) { return fb; };
        if (!validEmail(v)) return t('form.err.emailInvalid', 'Please enter a valid email address.');
        if (v.length > 254) return t('form.err.emailMax',     'Email address is too long.');
        return '';
      }
    },
    subject: {
      el: document.getElementById('contact-subject'),
      errEl: document.getElementById('subject-error'),
      validate: function (v) {
        var t = window.i18n ? window.i18n.t.bind(window.i18n) : function (k, fb) { return fb; };
        if (v.trim().length < 3)   return t('form.err.subjectMin', 'Please enter a subject (at least 3 characters).');
        if (v.trim().length > 200) return t('form.err.subjectMax', 'Subject is too long.');
        return '';
      }
    },
    message: {
      el: document.getElementById('contact-message'),
      errEl: document.getElementById('message-error'),
      validate: function (v) {
        var t = window.i18n ? window.i18n.t.bind(window.i18n) : function (k, fb) { return fb; };
        if (v.trim().length < 20)   return t('form.err.msgMin', 'Please enter a message (at least 20 characters).');
        if (v.trim().length > 3000) return t('form.err.msgMax', 'Message is too long (max 3000 characters).');
        return '';
      }
    }
  };

  function setFieldError(field, message) {
    if (!field.el || !field.errEl) return;
    field.el.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.errEl.textContent = message;
  }

  function validateAll() {
    var valid = true;
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.el) return;
      var err = field.validate(field.el.value);
      setFieldError(field, err);
      if (err) valid = false;
    });
    return valid;
  }

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    if (!field.el) return;
    field.el.addEventListener('blur', function () {
      setFieldError(field, field.validate(field.el.value));
    });
    field.el.addEventListener('input', function () {
      if (field.el.getAttribute('aria-invalid') === 'true') {
        setFieldError(field, field.validate(field.el.value));
      }
    });
    // Enforce max length at DOM level too
    var maxLen = { name: 100, email: 254, subject: 200, message: 3000 };
    if (maxLen[key] && field.el.tagName !== 'INPUT') {
      field.el.setAttribute('maxlength', maxLen[key]);
    }
  });

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (btnText)    btnText.textContent = loading
      ? (window.i18n ? window.i18n.t('form.sending') : 'Sending…')
      : (window.i18n ? window.i18n.t('form.submit')  : 'Send Message');
    if (btnSpinner) btnSpinner.hidden = !loading;
  }

  function showStatus(el, visible) {
    if (!el) return;
    if (visible) { el.removeAttribute('style'); el.hidden = false; }
    else         { el.hidden = true; el.style.display = 'none'; }
  }

  function showError(msg) {
    showStatus(errorMsg, true);
    if (errorMsg && msg) {
      var strong = errorMsg.querySelector('strong');
      if (strong) strong.textContent = msg;
    }
    if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    showStatus(successMsg, false);
    showStatus(errorMsg,   false);

    /* 1 — Validate fields */
    if (!validateAll()) {
      var firstInvalid = Object.keys(fields).find(function (k) {
        return fields[k].el && fields[k].el.getAttribute('aria-invalid') === 'true';
      });
      if (firstInvalid) fields[firstInvalid].el.focus();
      return;
    }

    /* 2 — Honeypot */
    var honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    /* 3 — Bot timing (filled too fast) */
    if (Date.now() - pageLoadTime < MIN_FILL_MS) return;

    /* 4 — Submission guard (double-submit) */
    if (!sessionToken) return;

    /* 5 — Client-side rate limit (last line of defence; Worker enforces by IP) */
    if (isRateLimited()) {
      showError(window.i18n ? window.i18n.t('form.rateLimit') : 'Too many attempts. Please try again in an hour.');
      return;
    }

    /* 6 — Turnstile token (required only on the Worker path) */
    var useWorker = !!WORKER_URL;
    var turnstileToken = '';
    if (useWorker) {
      turnstileToken = (window.turnstile && tsWidgetId !== null) ? window.turnstile.getResponse(tsWidgetId) : '';
      if (!turnstileToken) {
        showError(window.i18n ? window.i18n.t('form.turnstileRequired') : 'Please complete the verification before sending.');
        return;
      }
    }

    setLoading(true);
    bumpRate();
    sessionToken = false; /* prevent double-submit */

    var payload = {
      name:            sanitize(fields.name.el.value),
      email:           sanitize(fields.email.el.value),
      subject:         sanitize(fields.subject.el.value),
      message:         sanitize(fields.message.el.value),
      'cf-turnstile-response': turnstileToken
    };

    /* Safety timeout */
    var _sent = false;
    var _timeout = setTimeout(function () {
      if (_sent) return;
      _sent = true;
      setLoading(false);
      sessionToken = true;
      showError(window.i18n ? window.i18n.t('form.errorGeneric') : 'Request timed out. Please try again.');
    }, 15000);

    /* ── Production path: POST to Cloudflare Worker ── */
    if (useWorker) {
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (result) {
          if (_sent) return;
          _sent = true;
          clearTimeout(_timeout);
          if (!result.ok) {
            /* Worker returned a structured error — show generic message only */
            console.warn('[Worker] submission rejected:', result.data && result.data.error);
            showStatus(errorMsg, true);
            if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setLoading(false);
            sessionToken = true;
            if (window.turnstile) window.turnstile.reset(tsWidgetId);
            return;
          }
          form.reset();
          Object.keys(fields).forEach(function (k) {
            if (fields[k].el)    fields[k].el.removeAttribute('aria-invalid');
            if (fields[k].errEl) fields[k].errEl.textContent = '';
          });
          showStatus(successMsg, true);
          if (successMsg) successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setLoading(false);
        })
        .catch(function (err) {
          if (_sent) return;
          _sent = true;
          clearTimeout(_timeout);
          console.error('[Worker fetch error]', err);
          showStatus(errorMsg, true);
          if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setLoading(false);
          sessionToken = true;
          if (window.turnstile) window.turnstile.reset(tsWidgetId);
        });

    } else {
      /* ── Development fallback: direct EmailJS (Worker not yet configured) ── */
      if (!window.emailjs) {
        clearTimeout(_timeout);
        setLoading(false);
        sessionToken = true;
        showError(window.i18n ? window.i18n.t('form.errorGeneric') : 'Service not ready. Please refresh and try again.');
        return;
      }
      var templateParams = {
        from_name:  payload.name,
        from_email: payload.email,
        subject:    payload.subject,
        message:    payload.message
      };
      emailjs.send(_s, _t, templateParams)
        .then(function () {
          if (_sent) return;
          _sent = true;
          clearTimeout(_timeout);
          form.reset();
          Object.keys(fields).forEach(function (k) {
            if (fields[k].el)    fields[k].el.removeAttribute('aria-invalid');
            if (fields[k].errEl) fields[k].errEl.textContent = '';
          });
          showStatus(successMsg, true);
          if (successMsg) successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setLoading(false);
        })
        .catch(function (err) {
          if (_sent) return;
          _sent = true;
          clearTimeout(_timeout);
          console.error('[EmailJS error]', err);
          showStatus(errorMsg, true);
          if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setLoading(false);
          sessionToken = true;
        });
    }
  });
})();

/* ============================================================
   ANIMATION 1 — Scroll progress bar
   ============================================================ */
(function () {
  var bar = document.getElementById('scroll-progress');
  if (!bar) return;
  function update() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = (docH > 0 ? (scrollTop / docH) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ============================================================
   ANIMATION 2 — Cursor spotlight (hero)
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var hero = document.getElementById('hero');
  if (!hero) return;

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2) + '%';
    var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(2) + '%';
    hero.style.setProperty('--mx', x);
    hero.style.setProperty('--my', y);
  });
})();

/* ============================================================
   ANIMATION 3 — Magnetic buttons
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.btn--magnetic').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var cx = rect.left + rect.width  / 2;
      var cy = rect.top  + rect.height / 2;
      var dx = (e.clientX - cx) * 0.25;
      var dy = (e.clientY - cy) * 0.25;
      btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
    });
    btn.addEventListener('mousedown', function () {
      btn.style.transform = 'scale(0.97)';
    });
    btn.addEventListener('mouseup', function () {
      btn.style.transform = '';
    });
  });
})();

/* ============================================================
   ANIMATION 4 — 3D card tilt
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var MAX_TILT = 8;

  document.querySelectorAll('.impact-card, .expertise-card, .hero__stat').forEach(function (card) {
    card.classList.add('tilt-ready');

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width  - 0.5;
      var y = (e.clientY - rect.top)  / rect.height - 0.5;
      var rx = (-y * MAX_TILT).toFixed(2);
      var ry = ( x * MAX_TILT).toFixed(2);
      card.style.transform = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.03)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
})();

/* ============================================================
   ANIMATION 5 — Timeline line draw-in
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var timeline = document.querySelector('.timeline');
  if (!timeline) return;

  var obs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      timeline.classList.add('line-drawn');
      obs.disconnect();
    }
  }, { threshold: 0.1 });

  obs.observe(timeline);
})();

/* ============================================================
   ANIMATION 6 — Section title shimmer
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.section__title').forEach(function (title) {
    var sweep = document.createElement('span');
    sweep.className = 'shimmer-sweep';
    sweep.setAttribute('aria-hidden', 'true');
    title.appendChild(sweep);

    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        title.classList.add('shimmer-run');
        obs.disconnect();
      }
    }, { threshold: 0.6 });

    obs.observe(title);
  });
})();

/* ============================================================
   ANIMATION 7 — Impact metric flash on count complete +
                  enhanced counter for impact-card__metric
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function parseTarget(el) {
    var raw = el.getAttribute('data-metric-raw') || el.textContent.trim();
    var prefix = /^\$/.test(raw) ? '$' : '';
    var suffix = raw.match(/[+%KM]+$/) ? raw.match(/[+%KM]+$/)[0] : '';
    var num = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
    return { prefix: prefix, suffix: suffix, num: num, raw: raw,
             decimals: (raw.indexOf('.') > -1 ? 1 : 0) };
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateMetric(el) {
    var parsed = parseTarget(el);
    if (parsed.num === 0) { return; }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var val = easeOutQuart(t) * parsed.num;
      el.textContent = parsed.prefix +
        (parsed.decimals ? val.toFixed(parsed.decimals) : Math.round(val)) +
        parsed.suffix;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = parsed.raw;
        el.classList.add('flash-done');
        el.addEventListener('animationend', function () {
          el.classList.remove('flash-done');
        }, { once: true });
      }
    }
    requestAnimationFrame(step);
  }

  var metrics = document.querySelectorAll('.impact-card__metric');
  metrics.forEach(function (el) {
    el.setAttribute('data-metric-raw', el.textContent.trim());
    var parsed = parseTarget(el);
    if (parsed.num > 0) el.textContent = parsed.prefix + '0' + parsed.suffix;
  });

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateMetric(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  metrics.forEach(function (el) { obs.observe(el); });
})();

/* ============================================================
   ANIMATION 8 — Stagger cascade (cert, expertise, impact, value cards)
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GROUPS = [
    '.cert-grid .cert-card',
    '.expertise-grid .expertise-card',
    '.impact-grid .impact-card',
    '.values-grid .value-card'
  ];

  GROUPS.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.style.setProperty('--stagger-delay', (i * 55) + 'ms');
    });
  });
})();
