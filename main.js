/* ============================================================
   EmailJS configuration
   ============================================================ */
var EMAILJS_PUBLIC_KEY  = '7z10gcbrRNaKaHB5m';
var EMAILJS_SERVICE_ID  = 'service_wfiejqb';
var EMAILJS_TEMPLATE_ID = 'template_rjtij71';

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
   CONTACT FORM — validation + EmailJS submission
   ============================================================ */
(function () {
  // Init EmailJS
  if (window.emailjs) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  var form       = document.getElementById('contact-form');
  if (!form) return;

  // Rate limiting: max 3 submissions per session
  var submitCount = 0;
  var MAX_SUBMITS = 3;

  // Strip HTML tags and control characters from user input
  function sanitize(str) {
    return str
      .replace(/[<>'"]/g, function(c) {
        return { '<': '', '>': '', "'": '', '"': '' }[c];
      })
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 2000);
  }

  var submitBtn  = document.getElementById('form-submit');
  var btnText    = submitBtn && submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn && submitBtn.querySelector('.btn__spinner');
  var successMsg = document.getElementById('form-success');
  var errorMsg   = document.getElementById('form-error-msg');

  // Ensure both status messages are hidden on load
  if (successMsg) successMsg.hidden = true;
  if (errorMsg)   errorMsg.hidden   = true;

  var fields = {
    name: {
      el: document.getElementById('contact-name'),
      errEl: document.getElementById('name-error'),
      validate: function (v) {
        return v.trim().length >= 2 ? '' : 'Please enter your full name (at least 2 characters).';
      }
    },
    email: {
      el: document.getElementById('contact-email'),
      errEl: document.getElementById('email-error'),
      validate: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
      }
    },
    subject: {
      el: document.getElementById('contact-subject'),
      errEl: document.getElementById('subject-error'),
      validate: function (v) {
        return v.trim().length >= 3 ? '' : 'Please enter a subject (at least 3 characters).';
      }
    },
    message: {
      el: document.getElementById('contact-message'),
      errEl: document.getElementById('message-error'),
      validate: function (v) {
        return v.trim().length >= 20 ? '' : 'Please enter a message (at least 20 characters).';
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

  // Live validation on blur / input
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
  });

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (btnText)    btnText.textContent  = loading ? (window.i18n ? window.i18n.t('form.sending') : 'Sending…') : (window.i18n ? window.i18n.t('form.submit') : 'Send Message');
    if (btnSpinner) btnSpinner.hidden    = !loading;
  }

  function showStatus(el, visible) {
    if (!el) return;
    if (visible) {
      el.removeAttribute('style');
      el.hidden = false;
    } else {
      el.hidden = true;
      el.style.display = 'none';
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Hide both status banners before every attempt
    showStatus(successMsg, false);
    showStatus(errorMsg,   false);

    if (!validateAll()) {
      var firstInvalid = Object.keys(fields).find(function (k) {
        return fields[k].el && fields[k].el.getAttribute('aria-invalid') === 'true';
      });
      if (firstInvalid) fields[firstInvalid].el.focus();
      return;
    }

    // Honeypot check (basic bot guard)
    var honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    // Rate limit check
    if (submitCount >= MAX_SUBMITS) {
      showStatus(errorMsg, true);
      if (errorMsg) {
        errorMsg.textContent = window.i18n ? window.i18n.t('form.rateLimit') : 'Too many attempts. Please try again later.';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    setLoading(true);
    submitCount++;

    // Build template params with sanitized values
    var templateParams = {
      from_name:  sanitize(fields.name.el.value),
      from_email: sanitize(fields.email.el.value),
      subject:    sanitize(fields.subject.el.value),
      message:    sanitize(fields.message.el.value)
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(function () {
        form.reset();
        Object.keys(fields).forEach(function (k) {
          if (fields[k].el) fields[k].el.removeAttribute('aria-invalid');
          if (fields[k].errEl) fields[k].errEl.textContent = '';
        });
        showStatus(successMsg, true);
        if (successMsg) successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setLoading(false);
      })
      .catch(function () {
        showStatus(errorMsg, true);
        if (errorMsg) errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setLoading(false);
      });
  });
})();
