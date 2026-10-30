/* Run: python3 -m http.server 8765 (from repo root) then: node tests/ui-motion.e2e.cjs
   Network is mocked: fonts/Turnstile/EmailJS are aborted or stubbed. No real mail is sent. */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
const EXPECT = { all: 17, education: 1, quality: 1, itsm: 1, brm: 2, cybersecurity: 1, infrastructure: 2, automation: 4, emergency: 4, leadership: 2 };
let pass = 0, fail = 0; const failures = [];
const ok = (c, m) => { if (c) pass++; else { fail++; failures.push(m); console.log('  FAIL:', m); } };

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: opts.js !== false });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.route(/challenges\.cloudflare\.com|api\.emailjs\.com/, r => r.abort());
  await page.goto(BASE + '/index.html' + (opts.hash || '')); await page.waitForTimeout(700);
  return { ctx, page, errs };
}
const visibleCards = p => p.evaluate(() => [...document.querySelectorAll('.cert-card')].filter(c => !c.hidden && c.offsetParent !== null).length);

(async () => {
  const browser = await chromium.launch();

  console.log('# Filters (desktop)');
  let { ctx, page, errs } = await open(browser);
  ok(await page.locator('.cert-card').count() === 17, 'total cards is 17');
  ok(await page.locator('#certs-count').textContent() === 'Showing 17 of 17 credentials', 'initial counter EN');
  ok(await page.locator('#certs-filters button[aria-pressed="true"]').count() === 1, 'one pressed at start');
  for (const [f, n] of Object.entries(EXPECT)) {
    await page.click(`[data-filter="${f}"]`); await page.waitForTimeout(450);
    ok(await visibleCards(page) === n, `filter ${f} shows ${n}`);
    ok(await page.locator('#certs-filters button[aria-pressed="true"]').count() === 1, `${f}: exactly one pressed`);
    ok(await page.getAttribute(`[data-filter="${f}"]`, 'aria-pressed') === 'true', `${f}: pressed is clicked one`);
    ok((await page.locator('#certs-count').textContent()) === `Showing ${n} of 17 credentials`, `${f}: counter text`);
    const hiddenFocusable = await page.evaluate(() => [...document.querySelectorAll('.cert-card[hidden]')].some(c => getComputedStyle(c).display !== 'none' || c.offsetParent !== null));
    ok(!hiddenFocusable, `${f}: hidden cards removed from flow`);
    const grid = await page.evaluate(() => { const g = document.querySelector('.certs-grid'); const c = getComputedStyle(g); return { op: c.opacity, fading: g.classList.contains('is-fading') }; });
    ok(grid.op === '1' && !grid.fading, `${f}: grid fully visible after transition`);
    const align = await page.evaluate((f) => { const b = document.querySelector(`[data-filter="${f}"]`).getBoundingClientRect(); const i = document.querySelector('.certs-legend__indicator').getBoundingClientRect(); return { dl: Math.abs(b.left - i.left), dw: Math.abs(b.width - i.width) }; }, f);
    ok(align.dl < 2 && align.dw < 2, `${f}: indicator aligned (dl=${align.dl.toFixed(1)}, dw=${align.dw.toFixed(1)})`);
  }
  // multi-category card appears in both
  await page.click('[data-filter="leadership"]'); await page.waitForTimeout(450);
  ok((await page.locator('.cert-card:visible .cert-card__name').allTextContents()).some(t => t.includes('IS-240.C')), 'IS-240.C listed under leadership');
  await page.click('[data-filter="emergency"]'); await page.waitForTimeout(450);
  ok((await page.locator('.cert-card:visible .cert-card__name').allTextContents()).some(t => t.includes('IS-240.C')), 'IS-240.C listed under emergency');
  await page.click('[data-filter="all"]'); await page.waitForTimeout(450);
  ok(await visibleCards(page) === 17, 'All restores 17');
  // keyboard
  await page.focus('[data-filter="cybersecurity"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(450);
  ok(await visibleCards(page) === 1, 'Enter activates filter');
  await page.focus('[data-filter="brm"]'); await page.keyboard.press('Space'); await page.waitForTimeout(450);
  ok(await visibleCards(page) === 2, 'Space activates filter');
  ok(await page.evaluate(() => document.activeElement.getAttribute('data-filter')) === 'brm', 'focus stays on filter button');
  // tab order never lands on hidden cards
  const focusables = await page.evaluate(() => [...document.querySelectorAll('.cert-card[hidden] a, .cert-card[hidden] button')].length);
  ok(focusables === 0, 'no focusable content in cards');
  // rapid clicks
  for (const f of ['quality', 'itsm', 'automation', 'emergency', 'leadership', 'education']) await page.click(`[data-filter="${f}"]`, { delay: 0 });
  await page.waitForTimeout(600);
  ok(await visibleCards(page) === 1, 'rapid clicks: final filter (education) applied');
  ok(await page.getAttribute('[data-filter="education"]', 'aria-pressed') === 'true', 'rapid clicks: final pressed');
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('.certs-grid')).opacity);
  ok(op === '1', 'rapid clicks: grid opacity 1');
  // language after filter
  await page.click('[data-filter="automation"]'); await page.waitForTimeout(450);
  await page.click('#lang-toggle'); await page.waitForTimeout(600);
  ok((await page.locator('#certs-count').textContent()) === 'Mostrando 4 de 17 credenciales', 'counter in Spanish keeps filter');
  ok(await page.getAttribute('#certs-filters', 'aria-label') === 'Filtrar credenciales por área', 'filter group label translated');
  ok((await page.locator('[data-filter="all"]').textContent()).trim() === 'Todas', 'All label translated');
  ok(await visibleCards(page) === 4, 'filter preserved after language change');
  const al = await page.evaluate(() => { const b = document.querySelector('[aria-pressed="true"][data-filter]').getBoundingClientRect(); const i = document.querySelector('.certs-legend__indicator').getBoundingClientRect(); return Math.abs(b.left - i.left) + Math.abs(b.width - i.width); });
  ok(al < 3, 'filter indicator re-aligned after language change (' + al.toFixed(1) + ')');
  // resize
  await page.setViewportSize({ width: 900, height: 800 }); await page.waitForTimeout(400);
  const al2 = await page.evaluate(() => { const b = document.querySelector('[aria-pressed="true"][data-filter]').getBoundingClientRect(); const i = document.querySelector('.certs-legend__indicator').getBoundingClientRect(); return Math.abs(b.left - i.left) + Math.abs(b.width - i.width); });
  ok(al2 < 3, 'filter indicator re-aligned after resize (' + al2.toFixed(1) + ')');
  ok(errs.length === 0, 'no console errors (filters): ' + errs.join(' | '));
  await ctx.close();

  console.log('# Language crossfade');
  ({ ctx, page, errs } = await open(browser));
  await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(200);
  await page.focus('#lang-toggle'); const y0 = await page.evaluate(() => scrollY);
  await page.click('#lang-toggle'); await page.waitForTimeout(80);
  const mid = await page.evaluate(() => getComputedStyle(document.querySelector('main')).opacity);
  await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.documentElement.lang) === 'es', 'lang=es after click');
  ok(await page.evaluate(() => localStorage.getItem('lang')) === 'es', 'persisted es');
  ok(await page.evaluate(() => document.activeElement.id) === 'lang-toggle', 'focus kept on toggle');
  ok(Math.abs((await page.evaluate(() => scrollY)) - y0) < 400, 'scroll position retained (approx)');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('main')).opacity) === '1', 'main opacity restored');
  for (const n of [2, 3, 5, 7]) {
    const start = await page.evaluate(() => document.documentElement.lang);
    for (let i = 0; i < n; i++) await page.click('#lang-toggle', { delay: 0 });
    await page.waitForTimeout(700);
    const exp = n % 2 ? (start === 'es' ? 'en' : 'es') : start;
    ok(await page.evaluate(() => document.documentElement.lang) === exp, `rapid x${n}: final lang parity (${exp})`);
    ok(await page.evaluate(() => !document.documentElement.classList.contains('lang-fading') && getComputedStyle(document.querySelector('main')).opacity === '1'), `rapid x${n}: nothing left faded`);
  }
  ok(await page.evaluate(() => localStorage.getItem('lang') === document.documentElement.lang), 'storage matches final lang');
  ok(errs.length === 0, 'no console errors (language): ' + errs.join(' | '));
  await ctx.close();

  console.log('# Nav indicator');
  ({ ctx, page, errs } = await open(browser, { viewport: { width: 1440, height: 900 } }));
  for (const id of ['about', 'experience', 'impact', 'expertise']) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), id); await page.waitForTimeout(700);
    const r = await page.evaluate((id) => { const a = document.querySelector(`.nav__links a[href="#${id}"]`); const i = document.querySelector('.nav__indicator').getBoundingClientRect(); const b = a.getBoundingClientRect(); return { cur: document.querySelector('.nav__links a[aria-current="true"]')?.getAttribute('href'), n: document.querySelectorAll('.nav__links a[aria-current]').length, dl: Math.abs(i.left - b.left), dw: Math.abs(i.width - b.width), vis: getComputedStyle(document.querySelector('.nav__indicator')).opacity }; }, id);
    ok(r.cur === '#' + id && r.n === 1, `${id}: aria-current`);
    ok(r.dl < 2 && r.dw < 2 && r.vis === '1', `${id}: indicator aligned dl=${r.dl.toFixed(1)} dw=${r.dw.toFixed(1)}`);
  }
  // click updates immediately, indicator does not block clicks
  await page.click('.nav__links a[href="#about"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector('.nav__links a[aria-current]').getAttribute('href')) === '#about', 'click sets active immediately');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.nav__indicator')).pointerEvents) === 'none', 'indicator pointer-events none');
  await page.waitForTimeout(1500);
  ok(await page.evaluate(() => document.querySelector('.nav__links a[aria-current]')?.getAttribute('href')) === '#about', 'about remains active after scroll settles');
  // language change realigns (ES widths differ)
  await page.click('#lang-toggle'); await page.waitForTimeout(700);
  const rl = await page.evaluate(() => { const a = document.querySelector('.nav__links a[aria-current]'); const i = document.querySelector('.nav__indicator').getBoundingClientRect(); const b = a.getBoundingClientRect(); return Math.abs(i.left - b.left) + Math.abs(i.width - b.width); });
  ok(rl < 3, 'nav indicator realigned after language change (' + rl.toFixed(1) + ')');
  // hash load
  const p2 = await ctx.newPage(); await p2.route(/fonts\.(googleapis|gstatic)\.com|challenges\.cloudflare\.com|api\.emailjs\.com/, r => r.abort());
  await p2.goto(BASE + '/index.html#impact'); await p2.waitForTimeout(1200);
  ok(await p2.evaluate(() => document.querySelector('.nav__links a[aria-current]')?.getAttribute('href')) === '#impact', 'hash load activates #impact');
  ok(errs.length === 0, 'no console errors (nav): ' + errs.join(' | '));
  await ctx.close();

  console.log('# Mobile 390');
  ({ ctx, page, errs } = await open(browser, { viewport: { width: 390, height: 800 } }));
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no horizontal page overflow');
  const sc = await page.evaluate(() => { const g = document.getElementById('certs-filters'); return { s: g.scrollWidth > g.clientWidth, ox: getComputedStyle(g).overflowX, h: Math.min(...[...g.querySelectorAll('button')].map(b => b.getBoundingClientRect().height)) }; });
  ok(sc.s && sc.ox === 'auto', 'filter row scrolls inside its own container');
  ok(sc.h >= 44, 'filter targets >= 44px (' + sc.h + ')');
  await page.click('[data-filter="leadership"]'); await page.waitForTimeout(700);
  const vis = await page.evaluate(() => { const b = document.querySelector('[data-filter="leadership"]').getBoundingClientRect(); const g = document.getElementById('certs-filters').getBoundingClientRect(); return b.left >= g.left - 1 && b.right <= g.right + 1; });
  ok(vis, 'active filter scrolled into view');
  ok(await visibleCards(page) === 2, 'leadership works on mobile');
  await page.click('.nav__hamburger'); await page.waitForTimeout(250);
  ok(await page.getAttribute('.nav__hamburger', 'aria-expanded') === 'true', 'mobile menu opens');
  await page.click('#mobile-menu a[href="#impact"]'); await page.waitForTimeout(900);
  ok(await page.getAttribute('.nav__hamburger', 'aria-expanded') === 'false', 'mobile menu closes after selection');
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no overflow after interactions');
  ok(errs.length === 0, 'no console errors (mobile): ' + errs.join(' | '));
  await ctx.close();

  console.log('# Reduced motion');
  ({ ctx, page, errs } = await open(browser, { reduced: true }));
  await page.click('[data-filter="automation"]');
  ok(await visibleCards(page) === 4, 'filter applied immediately (no wait)');
  ok(!(await page.evaluate(() => document.querySelector('.certs-grid').classList.contains('is-fading'))), 'no fade class');
  await page.click('#lang-toggle');
  ok(await page.evaluate(() => document.documentElement.lang) === 'es', 'language switched immediately');
  const rm = await page.evaluate(() => { const card = document.querySelector('.cert-card'); const badge = card.querySelector('.cert-badge'); return { t: getComputedStyle(document.querySelector('.nav__indicator')).transitionDuration }; });
  ok(parseFloat(rm.t) < 0.01, 'indicator transition off (' + rm.t + ')');
  await page.hover('.cert-card:not([hidden])'); await page.waitForTimeout(100);
  const tr = await page.evaluate(() => getComputedStyle(document.querySelector('.cert-card:not([hidden]) .cert-badge')).transform);
  ok(tr === 'none', 'no badge magnification with reduced motion (' + tr + ')');
  await ctx.close();

  console.log('# Badge magnification (motion allowed, fine pointer)');
  ({ ctx, page, errs } = await open(browser));
  await page.hover('.cert-card'); await page.waitForTimeout(400);
  const m = await page.evaluate(() => { const c = document.querySelector('.cert-card'); return { b: getComputedStyle(c.querySelector('.cert-badge')).transform, c: getComputedStyle(c).transform }; });
  ok(/matrix\(1\.06/.test(m.b), 'badge scales to 1.06 (' + m.b + ')');
  ok(/matrix\(1, 0, 0, 1, 0, -2\)/.test(m.c), 'card lifts 2px (' + m.c + ')');
  await ctx.close();

  console.log('# No JavaScript');
  ({ ctx, page } = await open(browser, { js: false }));
  ok(await page.evaluate(() => [...document.querySelectorAll('.cert-card')].every(c => c.offsetParent !== null)) , 'all 17 cards visible without JS');
  ok(await page.locator('.cert-card:visible').count() === 17, '17 visible without JS');
  await ctx.close();

  await browser.close();
  console.log(`\nPASSED ${pass}  FAILED ${fail}`); if (fail) { console.log(failures.join('\n')); process.exit(1); }
})();
