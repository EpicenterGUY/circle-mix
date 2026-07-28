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
replace_exact(Path('scripts/audit-desktop-dist.js'),[
    ("if(!desktopRelease.includes('version:\"0.9.41\"')||!desktopRelease.includes('UNIFIED SETTINGS & MOBILE LAYOUT V2')||!desktopRelease.includes('CircleMixChangelog'))throw new Error('desktop 0.9.41 release metadata is missing');","if(!desktopRelease.includes('version:\"0.9.46\"')||!desktopRelease.includes('ALL-PLATFORM 0.9.46')||!desktopRelease.includes('CircleMixChangelog'))throw new Error('desktop 0.9.46 release metadata is missing');"),
    ("if(releaseWindow.CircleMixVersion?.version!=='0.9.41'||releaseWindow.CircleMixChangelog?.[0]?.version!=='0.9.41'||releaseWindow.CircleMixChangelog?.[0]?.title!=='UNIFIED SETTINGS & MOBILE LAYOUT V2')throw new Error('desktop release metadata override did not expose 0.9.41');","if(releaseWindow.CircleMixVersion?.version!=='0.9.46'||releaseWindow.CircleMixChangelog?.[0]?.version!=='0.9.46'||releaseWindow.CircleMixChangelog?.[0]?.title!=='ALL-PLATFORM 0.9.46')throw new Error('desktop release metadata override did not expose 0.9.46');"),
    ("const seenWindow={CircleMixVersion:{version:'0.9.40'},CircleMixChangelog:[],localStorage:{getItem(){return '0.9.41';}}};","const seenWindow={CircleMixVersion:{version:'0.9.40'},CircleMixChangelog:[],localStorage:{getItem(){return '0.9.46';}}};"),
])
print('Updated release expectations for Web/PWA 0.9.33 and desktop 0.9.46.')
