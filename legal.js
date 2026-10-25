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
