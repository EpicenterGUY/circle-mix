#!/usr/bin/env python3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
path=root/'tests/smoke.test.js'
text=path.read_text(encoding='utf-8')
replacements=[
    ('assert.match(version, /version:\\s*"0\\.9\\.32"/);','assert.match(version, /version:\\s*"0\\.9\\.33"/);'),
    ('assert.doesNotMatch(pwa, /const VERSION="0\\.9\\.32"/);','assert.doesNotMatch(pwa, /const VERSION="0\\.9\\.33"/);'),
    ('assert.doesNotMatch(sw, /const VERSION = "0\\.9\\.32"/);','assert.doesNotMatch(sw, /const VERSION = "0\\.9\\.33"/);'),
    ('assert.match(changelog, /version:\\s*"0\\.9\\.32"/);','assert.match(changelog, /version:\\s*"0\\.9\\.33"/);'),
]
for old,new in replacements:
    if text.count(old)!=1:
        raise SystemExit(f'smoke release expectation mismatch for: {old}')
    text=text.replace(old,new,1)
path.write_text(text,encoding='utf-8')
print('Updated smoke release expectations for Web/PWA 0.9.33.')
