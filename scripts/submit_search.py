"""Validate public discovery resources and notify IndexNow and the Google WebSub hub.

These are discovery notifications, not Search Console submissions or indexing proof.
"""
import argparse
import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = 'https://pubsubhubbub.appspot.com/'
AGENT = {'User-Agent': 'Similora-Search-Submission/1.1', 'Accept': '*/*'}
PUBLIC_FILES = {'standalone/home.html', 'standalone/home.css',
                'standalone/similora-launcher.png', 'standalone/similora-mark-v1.png',
                'cloudflare/search.mjs', 'cloudflare/search-config.json'}


def fetch(url, data=None, content_type=None):
    headers = dict(AGENT)
    if content_type:
        headers['Content-Type'] = content_type
    request = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.status, response.read().decode(), response.headers


def validate_public(base, key):
    for path in ['/', '/robots.txt', '/sitemap.xml', '/updates.atom', '/' + key + '.txt']:
        status, body, headers = fetch(base + path)
        if status != 200 or 'noindex' in headers.get('X-Robots-Tag', '').lower():
            raise ValueError('Public discovery resource is not crawlable: ' + path)
        if path == '/' and ('<h1>Similora' not in body or 'rel="canonical" href="' + base + '/"' not in body):
            raise ValueError('Homepage or canonical URL is missing')
        if path == '/robots.txt' and 'Sitemap: ' + base + '/sitemap.xml' not in body:
            raise ValueError('Sitemap discovery is missing')
        if path == '/sitemap.xml':
            locations = [n.text for n in ET.fromstring(body).findall('{*}url/{*}loc')]
            if locations != [base + '/']:
                raise ValueError('Only the public homepage belongs in the sitemap')
        if path == '/updates.atom':
            feed = ET.fromstring(body)
            links = feed.findall('{http://www.w3.org/2005/Atom}entry/{http://www.w3.org/2005/Atom}link')
            if [n.get('href') for n in links] != [base + '/']:
                raise ValueError('Only the public homepage belongs in the feed')
        if path.endswith(key + '.txt') and body.strip() != key:
            raise ValueError('IndexNow proof does not match')


def notify(base, key):
    payload = {'host': urllib.parse.urlsplit(base).netloc, 'key': key,
               'keyLocation': base + '/' + key + '.txt', 'urlList': [base + '/']}
    requests = [
        ('IndexNow participants', 'https://api.indexnow.org/indexnow',
         json.dumps(payload).encode(), 'application/json', {200, 202}),
        ('Google WebSub hub', HUB,
         urllib.parse.urlencode({'hub.mode': 'publish', 'hub.url': base + '/updates.atom'}).encode(),
         'application/x-www-form-urlencoded', {200, 202, 204}),
    ]
    results = []
    for engine, url, body, content_type, accepted in requests:
        try:
            status, _, _ = fetch(url, body, content_type)
            results.append({'service': engine, 'httpStatus': status, 'accepted': status in accepted})
        except urllib.error.HTTPError as error:
            results.append({'service': engine, 'httpStatus': error.code, 'accepted': False})
        except urllib.error.URLError:
            results.append({'service': engine, 'accepted': False, 'error': 'Network error; retry needed'})
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    changed = subprocess.check_output(['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], cwd=ROOT, text=True).splitlines()
    if not args.force and not PUBLIC_FILES.intersection(changed):
        print('No public page change; skipping duplicate search notifications.')
        return
    config = json.loads((ROOT / 'cloudflare/search-config.json').read_text())
    base, key = config['origin'], config['indexNowKey']
    validate_public(base, key)
    results = notify(base, key)
    receipt = {'url': base + '/', 'notifications': results,
               'meaning': 'Discovery notification only. Not proof of Google crawling, indexing or ranking. No Search Console submission was made.'}
    (ROOT / 'cloudflare/.build').mkdir(exist_ok=True)
    (ROOT / 'cloudflare/.build/search-submission.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as output:
            output.write('\n### Search discovery\n\n' + '\n'.join(
                '- ' + r['service'] + ': ' + ('accepted' if r['accepted'] else 'failed') + ' (HTTP ' + str(r.get('httpStatus', 'unavailable')) + ')' for r in results))
            output.write('\n\nNotifications do not prove indexing. Search Console access is still required for Google URL Inspection.\n')
    if not all(r['accepted'] for r in results):
        raise SystemExit('A discovery notification failed. Website deployment succeeded; review receipt before retrying.')


if __name__ == '__main__':
    main()
