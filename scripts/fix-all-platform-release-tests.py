#!/usr/bin/env python3
from pathlib import Path

root=Path(__file__).resolve().parents[1]


def replace_exact(path, replacements):
    target=root/path
    text=target.read_text(encoding='utf-8')
    for old,new in replacements:
        if text.count(old)!=1:
            raise SystemExit(f'{path} release expectation mismatch for: {old}')
        text=text.replace(old,new,1)
    target.write_text(text,encoding='utf-8')


replace_exact(Path('tests/smoke.test.js'),[
    ('assert.match(version, /version:\\s*"0\\.9\\.32"/);','assert.match(version, /version:\\s*"0\\.9\\.33"/);'),
    ('assert.doesNotMatch(pwa, /const VERSION="0\\.9\\.32"/);','assert.doesNotMatch(pwa, /const VERSION="0\\.9\\.33"/);'),
    ('assert.doesNotMatch(sw, /const VERSION = "0\\.9\\.32"/);','assert.doesNotMatch(sw, /const VERSION = "0\\.9\\.33"/);'),
    ('assert.match(changelog, /version:\\s*"0\\.9\\.32"/);','assert.match(changelog, /version:\\s*"0\\.9\\.33"/);'),
])
replace_exact(Path('tests/desktop-installer.test.js'),[
    ("assert.match(prepare,/DESKTOP_VERSION='0\\.9\\.41'/,'desktop distribution must expose version 0.9.46');","assert.match(prepare,/DESKTOP_VERSION='0\\.9\\.46'/,'desktop distribution must expose version 0.9.46');"),
])
print('Updated release expectations for Web/PWA 0.9.33 and desktop 0.9.46.')
