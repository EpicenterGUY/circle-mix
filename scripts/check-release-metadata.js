"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const versionSource = read("src/version.js");
const versionMatch = /version:\s*["']([^"']+)["']/.exec(versionSource);
const revisionMatch = /cacheRevision:\s*["']([^"']+)["']/.exec(versionSource);
assert.ok(versionMatch, "src/version.js must export CircleMixVersion.version");
assert.ok(revisionMatch, "src/version.js must export CircleMixVersion.cacheRevision");
const version = versionMatch[1];
const cacheRevision = revisionMatch[1];

const changelog = read("src/changelog.js");
const changelogMatch = /window\.CircleMixChangelog\s*=\s*\[\s*\{\s*version:\s*["']([^"']+)["']/.exec(changelog);
assert.ok(changelogMatch, "src/changelog.js must begin with a versioned release entry");
assert.equal(changelogMatch[1], version, "latest changelog entry must match src/version.js");

const pwa = read("src/pwa.js");
assert.match(pwa, /const RELEASE=window\.CircleMixVersion/, "PWA must consume the shared CircleMixVersion metadata");
assert.match(pwa, /const VERSION=String\(RELEASE\?\.version\|\|""\)\.trim\(\)/, "PWA version must derive from CircleMixVersion");
assert.match(pwa, /const CACHE_REVISION=String\(RELEASE\?\.cacheRevision\|\|VERSION\)\.trim\(\)/, "PWA cache revision must derive from CircleMixVersion");
assert.doesNotMatch(pwa, /const VERSION\s*=\s*["']\d+\.\d+\.\d+["']/, "PWA must not hard-code a release version");

const worker = read("service-worker.js");
assert.match(worker, /^importScripts\("\.\/src\/version\.js"\);/, "service worker must import the shared release metadata");
assert.match(worker, /const RELEASE = self\.CircleMixVersion/, "service worker must consume CircleMixVersion");
assert.match(worker, /const VERSION = String\(RELEASE\.version\)/, "service worker version must derive from CircleMixVersion");
assert.match(worker, /const CACHE_REVISION = String\(RELEASE\.cacheRevision \|\| VERSION\)/, "service worker cache revision must derive from CircleMixVersion");
assert.match(worker, /APP_CACHE\s*=\s*`\$\{CACHE_PREFIX\}\$\{VERSION\}-\$\{CACHE_REVISION\}-app`/, "service worker app cache must derive from version and cache revision");
assert.doesNotMatch(worker, /const VERSION\s*=\s*["']\d+\.\d+\.\d+["']/, "service worker must not hard-code a release version");

const browserTest = read("tests/browser-regression.test.js");
assert.doesNotMatch(browserTest, /circle-mix-v\d+\.\d+\.\d+-app|assert\.equal\(releaseMetadata\.version,\s*["']\d+\.\d+\.\d+["']/, "browser release expectations must derive from CircleMixVersion instead of a hard-coded version");

console.log(`PASS release metadata consistency (${version}, ${cacheRevision})`);
