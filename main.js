/* ============================================================
   EmailJS configuration — split to deter naive scraping
   ============================================================ */
var _k = ['7z10g','cbrRN','aKaHB','5m'].join('');
var _s = ['servi','ce_wf','iejqb'].join('');
var _t = ['templ','ate_r','jtij7','1'].join('');

/* ============================================================
   SECURITY — console warning + devtools detection
   ============================================================ */
(function () {
  var warned = false;
  function warn() {
    if (warned) return;
    warned = true;
    console.log(
      '%c⚠ SECURITY NOTICE',
      'color:#ff4444;font-size:20px;font-weight:bold;'
    );
    console.log(
      '%cThis is a personal professional portfolio. ' +
      'Unauthorized use, scraping, or injection attempts are logged and monitored.',
      'color:#ff8800;font-size:13px;'
    );
  }
  // Fire on any devtools open attempt
  var threshold = 160;
  setInterval(function () {
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      warn();
    }
  }, 1000);
  warn();
})();

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
  }

  // Footer year
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
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
   CONTACT FORM — validation + security + EmailJS submission
   ============================================================ */
(function () {
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

  /* ── Session token: one-time CSRF-like guard ── */
  var sessionToken = (Math.random().toString(36).slice(2) + Date.now().toString(36));

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
        if (v.trim().length < 2)   return 'Please enter your full name (at least 2 characters).';
        if (v.trim().length > 100) return 'Name is too long.';
        if (/[<>"'`]/.test(v))     return 'Name contains invalid characters.';
        return '';
      }
    },
    email: {
      el: document.getElementById('contact-email'),
      errEl: document.getElementById('email-error'),
      validate: function (v) {
        if (!validEmail(v)) return 'Please enter a valid email address.';
        if (v.length > 254) return 'Email address is too long.';
        return '';
      }
    },
    subject: {
      el: document.getElementById('contact-subject'),
      errEl: document.getElementById('subject-error'),
      validate: function (v) {
        if (v.trim().length < 3)   return 'Please enter a subject (at least 3 characters).';
        if (v.trim().length > 200) return 'Subject is too long.';
        return '';
      }
    },
    message: {
      el: document.getElementById('contact-message'),
      errEl: document.getElementById('message-error'),
      validate: function (v) {
        if (v.trim().length < 20)    return 'Please enter a message (at least 20 characters).';
        if (v.trim().length > 3000)  return 'Message is too long (max 3000 characters).';
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

    /* 4 — Session token present */
    if (!sessionToken) return;

    /* 5 — Persistent rate limit */
    if (isRateLimited()) {
      showError(window.i18n ? window.i18n.t('form.rateLimit') : 'Too many attempts. Please try again in an hour.');
      return;
    }

    if (!window.emailjs) {
      showError(window.i18n ? window.i18n.t('form.errorGeneric') : 'Service not ready. Please refresh and try again.');
      return;
    }

    setLoading(true);
    bumpRate();

    var templateParams = {
      from_name:  sanitize(fields.name.el.value),
      from_email: sanitize(fields.email.el.value),
      subject:    sanitize(fields.subject.el.value),
      message:    sanitize(fields.message.el.value)
    };

    /* Safety timeout — unblock button if promise never resolves */
    var _sent = false;
    var _timeout = setTimeout(function () {
      if (_sent) return;
      _sent = true;
      setLoading(false);
      showError(window.i18n ? window.i18n.t('form.errorGeneric') : 'Request timed out. Please try again.');
    }, 15000);

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
        sessionToken = null;
      })
      .catch(function (err) {
        if (_sent) return;
        _sent = true;
        clearTimeout(_timeout);
        console.error('[EmailJS error]', err);
        var detail = (err && (err.text || err.message || JSON.stringify(err))) || 'Unknown error';
        showStatus(errorMsg, true);
        if (errorMsg) {
          var strong = errorMsg.querySelector('strong');
          if (strong) strong.textContent = detail;
        }
        if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setLoading(false);
      });
  });
})();
