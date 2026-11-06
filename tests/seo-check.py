#!/usr/bin/env python3
"""Static SEO validator (stdlib only). Run from repo root: python3 tests/seo-check.py"""
import json, os, re, sys, urllib.robotparser, xml.dom.minidom
from html.parser import HTMLParser
from urllib.parse import urlparse, urldefrag

ORIGIN = 'https://josealbertopr.com'
PAGES = ['index.html', 'privacy.html', 'terms.html', 'accessibility.html']
ok = fail = 0
def check(c, m):
    global ok, fail
    if c: ok += 1
    else: fail += 1; print('  FAIL:', m)

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.meta = {}; s.links = []; s.h = []; s.ids = set(); s.ld = []; s.imgs = []
        s.title = ''; s._t = False; s._ld = False; s.hidden_depth = 0; s.stack = []; s.refs = []; s.canon = []; s.robots = None
    def handle_starttag(s, tag, a):
        a = dict(a)
        hid = 'hidden' in a
        s.stack.append(hid)
        if a.get('id'): s.ids.add(a['id'])
        if tag == 'title': s._t = True
        if tag == 'meta':
            k = a.get('name') or a.get('property')
            if k: s.meta[k] = a.get('content', '')
        if tag == 'link':
            if a.get('rel') == 'canonical': s.canon.append(a.get('href'))
            if a.get('href'): s.refs.append(('link', a['href']))
        if tag == 'script':
            if a.get('type') == 'application/ld+json': s._ld = True
            if a.get('src'): s.refs.append(('script', a['src']))
        if tag == 'a' and a.get('href'): s.links.append(a)
        if tag == 'img': s.imgs.append(a)
        if re.fullmatch(r'h[1-6]', tag): s.h.append((int(tag[1]), any(s.stack[:-1]) or hid))
    def handle_endtag(s, tag):
        if tag == 'title': s._t = False
        if tag == 'script': s._ld = False
        if s.stack: s.stack.pop()
    def handle_data(s, d):
        if s._t: s.title += d
        if s._ld: s.ld.append(d)

def local_target(href, base):
    u = urlparse(href)
    if u.scheme or href.startswith('//') or href.startswith('mailto:') or href.startswith('tel:'): return None
    path = u.path
    if path == '' : return base
    path = path.lstrip('/') if href.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(base), path))
    return path or 'index.html'

print('# sitemap.xml')
dom = xml.dom.minidom.parse('sitemap.xml')
locs = [n.firstChild.data.strip() for n in dom.getElementsByTagName('loc')]
check(len(locs) == len(set(locs)), 'duplicate <loc>')
for l in locs:
    f = urlparse(l).path.lstrip('/') or 'index.html'
    check(l.startswith(ORIGIN + '/') and os.path.exists(f), f'sitemap url has no file: {l}')
    check('xhtml' not in open('sitemap.xml').read(), 'unexpected hreflang annotations')

print('# robots.txt')
rp = urllib.robotparser.RobotFileParser(); rp.parse(open('robots.txt').read().splitlines())
for ua in ('Googlebot', 'Bingbot', '*', 'OAI-SearchBot'):
    for path in ('/', '/index.html', '/privacy.html', '/styles.css', '/main.js', '/i18n.js', '/og-image.jpg', '/fonts/inter-latin-wght-normal.woff2'):
        check(rp.can_fetch(ua, ORIGIN + path), f'{ua} blocked from {path}')
for ua in ('GPTBot', 'ClaudeBot', 'CCBot'):
    check(not rp.can_fetch(ua, ORIGIN + '/'), f'{ua} should be disallowed')
check(rp.site_maps() == [ORIGIN + '/sitemap.xml'], 'Sitemap line missing/incorrect')

print('# pages')
allids = {}
for f in PAGES + ['404.html']:
    src = open(f, encoding='utf-8').read(); p = P(); p.feed(src); allids[f] = p.ids
    check(len(p.title.strip()) > 10, f'{f}: title'); 
    if f != '404.html':
        check(len(p.title.strip()) <= 70, f'{f}: title length {len(p.title.strip())}')
    d = p.meta.get('description', '')
    check(50 <= len(d) <= 160, f'{f}: description length {len(d)}')
    robots = p.meta.get('robots', '')
    if f == '404.html':
        check('noindex' in robots, '404 should be noindex'); continue
    check('noindex' not in robots.lower() and 'noindex' not in p.meta.get('googlebot', '').lower(), f'{f}: noindex present')
    url = ORIGIN + ('/' if f == 'index.html' else '/' + f)
    check(p.canon == [url], f'{f}: canonical {p.canon} != {url}')
    check(url in locs, f'{f}: not in sitemap')
    check(p.meta.get('og:url') == url and p.meta.get('og:image', '').endswith('og-image.jpg') and p.meta.get('og:title') and p.meta.get('og:description'), f'{f}: open graph incomplete')
    check(os.path.exists(urlparse(p.meta.get('og:image', '')).path.lstrip('/')), f'{f}: og:image file missing')
    check('hreflang' not in src, f'{f}: unexpected hreflang')
    visible = [h for h in p.h if not h[1]]
    check(sum(1 for l, _ in visible if l == 1) == 1, f'{f}: visible h1 count {sum(1 for l,_ in visible if l==1)}')
    prev = 0
    for lvl, _ in visible:
        check(prev == 0 or lvl <= prev + 1, f'{f}: heading jump h{prev}->h{lvl}'); prev = lvl
    for im in p.imgs: check('alt' in im, f'{f}: img without alt')
    # JSON-LD
    ld = json.loads(''.join(p.ld)) if p.ld else []
    ld = ld if isinstance(ld, list) else [ld]
    valid = {'ProfilePage', 'WebSite', 'Person', 'ItemList', 'WebPage', 'EmployeeRole', 'BreadcrumbList'}
    def types(o):
        if isinstance(o, dict):
            if '@type' in o: yield o['@type']
            for v in o.values(): yield from types(v)
        elif isinstance(o, list):
            for v in o: yield from types(v)
    t = set(types(ld))
    check(bool(ld), f'{f}: no JSON-LD')
    check('WorkExperience' not in t, f'{f}: invalid schema type WorkExperience')
    check('issuedBy' not in json.dumps(ld), f'{f}: invalid issuedBy on credential')
    check(all(d.get('@context') == 'https://schema.org' for d in ld), f'{f}: @context')

print('# links and references')
for f in PAGES + ['404.html']:
    p = P(); p.feed(open(f, encoding='utf-8').read())
    for a in p.links:
        h = a['href']; u = urlparse(h)
        if u.scheme in ('http', 'https'):
            if u.netloc.endswith('josealbertopr.com'): check(False, f'{f}: absolute internal link {h}')
            else: check('noopener' in a.get('rel', '') or a.get('target') != '_blank', f'{f}: external {h} missing noopener')
            continue
        if h.startswith(('mailto:', 'tel:', 'javascript:')): continue
        t = local_target(h, f)
        check(t is not None and os.path.exists(t), f'{f}: broken link {h}')
        if t and u.fragment and os.path.exists(t) and t.endswith('.html'):
            ids = allids.get(t) or (P().__class__ and None)
            if ids is None:
                q = P(); q.feed(open(t, encoding='utf-8').read()); ids = q.ids
            check(u.fragment in ids, f'{f}: anchor #{u.fragment} not found in {t}')
    for kind, r in p.refs:
        if r.startswith(('http', '//', 'data:')): continue
        t = local_target(r, f)
        check(t and os.path.exists(t), f'{f}: missing asset {r}')

print(f'\nPASSED {ok}  FAILED {fail}')
sys.exit(1 if fail else 0)
