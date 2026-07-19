"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const versionSource = read("src/version.js");
const versionMatch = /version:\s*["']([^"']+)["']/.exec(versionSource);
assert.ok(versionMatch, "src/version.js must export CircleMixVersion.version");
const version = versionMatch[1];

const changelog = read("src/changelog.js");
const changelogMatch = /window\.CircleMixChangelog\s*=\s*\[\s*\{\s*version:\s*["']([^"']+)["']/.exec(changelog);
assert.ok(changelogMatch, "src/changelog.js must begin with a versioned release entry");
assert.equal(changelogMatch[1], version, "latest changelog entry must match src/version.js");

const pwa = read("src/pwa.js");
assert.match(pwa, new RegExp(`const VERSION\\s*=\\s*["']${escapeRegExp(version)}["']`), "PWA version must match src/version.js");

const worker = read("service-worker.js");
assert.match(worker, new RegExp(`const VERSION\\s*=\\s*["']${escapeRegExp(version)}["']`), "service worker version must match src/version.js");
assert.match(worker, /APP_CACHE\s*=\s*`\$\{CACHE_PREFIX\}\$\{VERSION\}-app`/, "service worker app cache must derive from the release version");

const browserTest = read("tests/browser-regression.test.js");
assert.doesNotMatch(browserTest, /circle-mix-v\d+\.\d+\.\d+-app|assert\.equal\(releaseMetadata\.version,\s*["']\d+\.\d+\.\d+["']/, "browser release expectations must derive from CircleMixVersion instead of a hard-coded version");

console.log(`PASS release metadata consistency (${version})`);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
