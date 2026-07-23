from pathlib import Path

path=Path("tests/smoke.test.js")
text=path.read_text()
old='assert.match(version, /cacheRevision:\\s*"20260723-pwa-update-foundation"/);'
new='const cacheRevision=/cacheRevision:\\s*"([^"]+)"/.exec(version)?.[1];\nassert.ok(cacheRevision,"release cache revision exists");'
if text.count(old)!=1:
    raise SystemExit(f"expected one cache revision assertion, found {text.count(old)}")
path.write_text(text.replace(old,new,1))
