/* ============================================================
   legal.js — Minimal JS for privacy/terms/accessibility pages
   Handles: footer year, nav hamburger, lang-block visibility
   Does NOT include EmailJS or animation code.
   ============================================================ */
(function () {
  // Footer year
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile hamburger (if present)
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
})();

(function () {
  var ids = {
    skip: ['skip-link-en', 'Skip to main content', 'Saltar al contenido principal'],
    back: ['back-link', '\u2190 Back to Portfolio', '\u2190 Volver al Portafolio'],
    rights: ['footer-rights', 'All rights reserved.', 'Todos los derechos reservados.'],
    home: ['footer-home', '\u2190 Portfolio', '\u2190 Portafolio'],
    priv: ['legal-privacy', 'Privacy Policy', 'Pol\u00edtica de Privacidad'],
    terms: ['legal-terms', 'Terms of Use', 'T\u00e9rminos de Uso'],
    a11y: ['legal-a11y', 'Accessibility', 'Accesibilidad']
  };
  function lang() { try { return localStorage.getItem('lang') === 'es' ? 'es' : 'en'; } catch (e) { return 'en'; } }
  function update() {
    var l = lang() === 'es' ? 2 : 1;
    Object.keys(ids).forEach(function (k) {
      var el = document.getElementById(ids[k][0]);
      if (el) el.textContent = ids[k][l];
    });
  }
  update();
  var btn = document.getElementById('lang-toggle');
  if (btn) btn.addEventListener('click', function () { setTimeout(update, 50); });
})();
