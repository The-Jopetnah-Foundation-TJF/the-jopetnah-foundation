#!/usr/bin/env python3
"""
Site checker for The Jopetnah Foundation website (static HTML on GitHub Pages).

Default mode (fast, offline, fails the build on any error):
  * every local link, stylesheet, script and image points at a file that exists
  * every #anchor points at an id that exists on the target page
  * canonical URL, title, meta description, one <h1>, lang attribute on every page
  * JSON-LD blocks parse
  * sitemap.xml lists every public page, and every sitemap URL exists

  python3 scripts/check_links.py

External mode (needs internet; used by the weekly workflow):
  python3 scripts/check_links.py --external
  Confirmed dead links (404/410) fail. Sites that block bots (social networks)
  or temporary errors (timeouts, 403, 429, 5xx) are reported as warnings only.

Standard library only, no installs.
"""
import argparse, json, os, re, sys, urllib.request, urllib.error, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin, unquote

SITE = 'https://the-jopetnah-foundation-tjf.github.io/the-jopetnah-foundation/'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# Root-level html files that are not public pages
NON_PAGES = re.compile(r'^(google[0-9a-f]+\.html|TJF_Email_Signature\.html)$')
BOT_BLOCKERS = ('facebook.com', 'linkedin.com', 'x.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'youtube.com')
SKIP_SCHEMES = ('mailto:', 'tel:', 'javascript:', 'data:', 'sms:')


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []          # (attr, url, tag)
        self.ids = set()
        self.h1 = 0
        self.title = ''
        self._in_title = False
        self.desc = None
        self.canonical = None
        self.lang = None
        self.jsonld = []
        self._in_ld = False
        self._ld = ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag == 'a' and a.get('name'): self.ids.add(a['name'])
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self._in_title = True
        if tag == 'meta':
            if a.get('name') == 'description': self.desc = a.get('content', '')
            if a.get('property') in ('og:image', 'og:url') or a.get('name') == 'twitter:image':
                self.refs.append(('content', a.get('content', ''), 'meta'))
        if tag == 'link':
            rel = (a.get('rel') or '').lower()
            if 'canonical' in rel: self.canonical = a.get('href')
            if a.get('href') and ('icon' in rel or 'stylesheet' in rel or 'preload' in rel or 'canonical' in rel):
                self.refs.append(('href', a['href'], 'link'))
        elif tag in ('a', 'area') and a.get('href') is not None:
            self.refs.append(('href', a['href'], tag))
        elif tag in ('script', 'img', 'source', 'iframe', 'video', 'audio') and a.get('src'):
            self.refs.append(('src', a['src'], tag))
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self._in_ld = True; self._ld = ''

    def handle_endtag(self, tag):
        if tag == 'title': self._in_title = False
        if tag == 'script' and self._in_ld:
            self._in_ld = False; self.jsonld.append(self._ld)

    def handle_data(self, data):
        if self._in_title: self.title += data
        if self._in_ld: self._ld += data


def parse(path):
    p = Page()
    with open(path, encoding='utf-8') as f: p.feed(f.read())
    return p


def local_from_site_url(url):
    """Map an absolute URL on our own site to a local path (or None)."""
    if not url.startswith(SITE): return None
    rel = unquote(urlparse(url).path[len(urlparse(SITE).path):])
    return rel or 'index.html'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--external', action='store_true', help='also check external links (needs internet)')
    args = ap.parse_args()

    errors, warnings = [], []
    err = lambda f, m: errors.append((f, m))
    warn = lambda f, m: warnings.append((f, m))

    pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and not NON_PAGES.match(f))
    parsed = {f: parse(os.path.join(ROOT, f)) for f in pages}
    all_html = {f: parsed[f] if f in parsed else parse(os.path.join(ROOT, f))
                for f in os.listdir(ROOT) if f.endswith('.html')}
    externals = {}

    for f, p in parsed.items():
        # -- basics
        if not p.lang: err(f, 'missing lang attribute on <html>')
        if not p.title.strip(): err(f, 'missing <title>')
        if not (p.desc or '').strip(): err(f, 'missing meta description')
        if p.h1 != 1: err(f, f'expected exactly one <h1>, found {p.h1}')
        want = SITE if f == 'index.html' else SITE + f
        if p.canonical != want: err(f, f'canonical is {p.canonical!r}, expected {want!r}')
        for i, block in enumerate(p.jsonld, 1):
            try: json.loads(block)
            except ValueError as e: err(f, f'JSON-LD block {i} is not valid JSON ({e})')

        # -- references
        for attr, url, tag in p.refs:
            url = url.strip()
            if not url or url.startswith(SKIP_SCHEMES): continue
            target_local = None
            if url.startswith('#'):
                frag = url[1:]
                if frag and frag != 'top' and frag not in p.ids: err(f, f'anchor {url} not found on this page')
                continue
            if url.startswith(('http://', 'https://')):
                mapped = local_from_site_url(url.split('#')[0])
                if mapped is None:
                    if url.startswith('http://'): warn(f, f'insecure http:// link: {url}')
                    externals.setdefault(url.split('#')[0], set()).add(f)
                    continue
                target_local, frag = mapped, (url.split('#', 1)[1] if '#' in url else '')
            elif url.startswith('//'):
                externals.setdefault('https:' + url.split('#')[0], set()).add(f); continue
            else:
                u = urlparse(url)
                path = unquote(u.path) or f
                frag = u.fragment
                target_local = os.path.normpath(os.path.join(os.path.dirname(f), path)) if path != f else f
                if path.endswith('/'): target_local = os.path.join(target_local, 'index.html')
            full = os.path.join(ROOT, target_local)
            if target_local.startswith('..'): err(f, f'link escapes the site folder: {url}'); continue
            if not os.path.exists(full):
                err(f, f'{tag} {attr} points to a missing file: {url}'); continue
            if os.path.isdir(full): full = os.path.join(full, 'index.html'); target_local = os.path.relpath(full, ROOT)
            # exact-case match (GitHub Pages is case-sensitive; macOS/Windows are not)
            real = os.listdir(os.path.dirname(full))
            if os.path.basename(full) not in real: err(f, f'case mismatch in link: {url}')
            if frag and target_local.endswith('.html'):
                tp = all_html.get(os.path.basename(target_local)) if '/' not in target_local else None
                if tp is not None and frag not in tp.ids: err(f, f'anchor #{frag} not found in {target_local}')

    # -- sitemap
    sm = os.path.join(ROOT, 'sitemap.xml')
    listed = set()
    if not os.path.exists(sm): err('sitemap.xml', 'file is missing')
    else:
        try:
            ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for loc in ET.parse(sm).getroot().findall('s:url/s:loc', ns):
                u = (loc.text or '').strip(); m = local_from_site_url(u)
                if m is None: err('sitemap.xml', f'URL not on this site: {u}'); continue
                listed.add(m)
                if not os.path.exists(os.path.join(ROOT, m)): err('sitemap.xml', f'lists a page that does not exist: {u}')
        except ET.ParseError as e: err('sitemap.xml', f'invalid XML ({e})')
        for f in parsed:
            if f not in listed: err('sitemap.xml', f'{f} is not listed in the sitemap')

    # -- external
    ext_results = []
    if args.external:
        def check(url):
            host = urlparse(url).hostname or ''
            soft = host.endswith(BOT_BLOCKERS)
            hdr = {'User-Agent': 'Mozilla/5.0 (compatible; TJF-LinkChecker/1.0; +https://github.com/The-Jopetnah-Foundation-TJF)', 'Accept': '*/*'}
            last = None
            for method in ('HEAD', 'GET'):
                try:
                    req = urllib.request.Request(url, headers=hdr, method=method)
                    with urllib.request.urlopen(req, timeout=20) as r:
                        return url, 'ok', r.status
                except urllib.error.HTTPError as e:
                    last = e.code
                    if e.code in (404, 410) and method == 'GET': return url, ('warn' if soft else 'dead'), e.code
                    if e.code in (404, 410) and method == 'HEAD': continue
                    if method == 'HEAD': continue
                except Exception as e:
                    last = type(e).__name__
            return url, 'warn', last
        with ThreadPoolExecutor(8) as ex: ext_results = list(ex.map(check, sorted(externals)))
        for url, status, code in ext_results:
            where = ', '.join(sorted(externals[url]))
            if status == 'dead': err(where, f'dead external link ({code}): {url}')
            elif status == 'warn': warn(where, f'could not verify ({code}): {url}')

    # -- report
    gha = os.environ.get('GITHUB_ACTIONS') == 'true'
    for f, m in errors: print((f'::error file={f}::{m}') if gha else f'ERROR   {f}: {m}')
    for f, m in warnings: print((f'::warning file={f}::{m}') if gha else f'warning {f}: {m}')
    n_ext = len(externals) if args.external else 0
    print(f'\nChecked {len(parsed)} pages' + (f' and {n_ext} external links' if args.external else '') +
          f': {len(errors)} error(s), {len(warnings)} warning(s).')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
