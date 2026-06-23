/* ============================================================
   NAVIGATION — mobile toggle & active link highlighting
   ============================================================ */
(function () {
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger?.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });

  // Close mobile menu when a link is clicked
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
    });
  });

  // Footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.value-card, .expertise-card, .impact-card, .timeline-item__content, .education__item, .about__text, .about__values, .section__title, .section__sub, .contact__info, .contact__form-wrap'
  );

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
})();

/* ============================================================
   CONTACT FORM — validation & Formspree submission
   ============================================================ */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('form-submit');
  const btnText = submitBtn?.querySelector('.btn__text');
  const btnSpinner = submitBtn?.querySelector('.btn__spinner');
  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error-msg');

  const fields = {
    name: { el: document.getElementById('contact-name'), errEl: document.getElementById('name-error'), validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name (at least 2 characters).' },
    email: { el: document.getElementById('contact-email'), errEl: document.getElementById('email-error'), validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
    subject: { el: document.getElementById('contact-subject'), errEl: document.getElementById('subject-error'), validate: v => v.trim().length >= 3 ? '' : 'Please enter a subject (at least 3 characters).' },
    message: { el: document.getElementById('contact-message'), errEl: document.getElementById('message-error'), validate: v => v.trim().length >= 20 ? '' : 'Please enter a message (at least 20 characters).' },
  };

  function setFieldError(field, message) {
    field.el.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.errEl.textContent = message;
  }

  function validateAll() {
    let valid = true;
    Object.values(fields).forEach(field => {
      const err = field.validate(field.el.value);
      setFieldError(field, err);
      if (err) valid = false;
    });
    return valid;
  }

  // Live validation on blur
  Object.values(fields).forEach(field => {
    field.el.addEventListener('blur', () => {
      const err = field.validate(field.el.value);
      setFieldError(field, err);
    });
    field.el.addEventListener('input', () => {
      if (field.el.getAttribute('aria-invalid') === 'true') {
        const err = field.validate(field.el.value);
        setFieldError(field, err);
      }
    });
  });

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (btnText) btnText.textContent = loading ? 'Sending…' : 'Send Message';
    if (btnSpinner) btnSpinner.hidden = !loading;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    successMsg.hidden = true;
    errorMsg.hidden = true;

    if (!validateAll()) {
      // Focus first invalid field
      const first = Object.values(fields).find(f => f.el.getAttribute('aria-invalid') === 'true');
      first?.el.focus();
      return;
    }

    setLoading(true);

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        form.reset();
        Object.values(fields).forEach(f => f.el.removeAttribute('aria-invalid'));
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        errorMsg.hidden = false;
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {
      errorMsg.hidden = false;
    } finally {
      setLoading(false);
    }
  });
})();
