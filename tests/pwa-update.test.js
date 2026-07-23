const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function test(name, fn){
  try{ fn(); console.log(`PASS ${name}`); }
  catch(error){ console.error(`FAIL ${name}`); throw error; }
}

const versionSource = fs.readFileSync("src/version.js", "utf8");
const pwaSource = fs.readFileSync("src/pwa.js", "utf8");
const serviceWorkerSource = fs.readFileSync("service-worker.js", "utf8");

test("release metadata loads in both window and service worker contexts", () => {
  const browser = {window:{}};
  vm.createContext(browser);
  vm.runInContext(versionSource, browser, {filename:"src/version.js"});
  assert.equal(browser.window.CircleMixVersion.version, "0.9.30");
  assert.ok(browser.window.CircleMixVersion.cacheRevision);
  assert.equal(Object.isFrozen(browser.window.CircleMixVersion), true);

  const worker = {self:{}};
  vm.createContext(worker);
  vm.runInContext(versionSource, worker, {filename:"src/version.js"});
  assert.equal(worker.self.CircleMixVersion.version, browser.window.CircleMixVersion.version);
  assert.equal(worker.self.CircleMixVersion.cacheRevision, browser.window.CircleMixVersion.cacheRevision);
});

test("PWA and service worker consume the shared release metadata", () => {
  assert.match(pwaSource, /const RELEASE=window\.CircleMixVersion/);
  assert.match(pwaSource, /circleMixOfflineReady\.\$\{VERSION\}\.\$\{CACHE_REVISION\}/);
  assert.doesNotMatch(pwaSource, /const VERSION\s*=\s*["'][0-9]/);
  assert.match(serviceWorkerSource, /^importScripts\("\.\/src\/version\.js"\);/);
  assert.match(serviceWorkerSource, /const RELEASE = self\.CircleMixVersion/);
  assert.match(serviceWorkerSource, /\$\{CACHE_PREFIX\}\$\{VERSION\}-\$\{CACHE_REVISION\}-app/);
  assert.doesNotMatch(serviceWorkerSource, /const VERSION\s*=\s*["'][0-9]/);
  assert.match(serviceWorkerSource, /cacheRevision/);
});

test("online static assets refresh before cached fallback", () => {
  assert.match(serviceWorkerSource, /async function networkFirstStatic\(request\)/);
  assert.match(serviceWorkerSource, /fetch\(new Request\(request, \{cache:"no-cache"\}\)\)/);
  assert.match(serviceWorkerSource, /if\(isStatic\)\{ event\.respondWith\(networkFirstStatic\(request\)\); return; \}/);
  assert.doesNotMatch(serviceWorkerSource, /cached=>cached \?\? fetch|cached=>cached \|\| fetch/);
});

test("installed PWA explicitly checks for service worker updates", () => {
  assert.match(pwaSource, /updateViaCache:"none"/);
  assert.match(pwaSource, /serviceWorkerRegistration\.update\(\)/);
  assert.match(pwaSource, /window\.addEventListener\("focus",\(\)=>checkForUpdate\(\)\)/);
  assert.match(pwaSource, /String\(result\.version\)!==VERSION/);
  assert.match(pwaSource, /String\(result\.revision\|\|result\.version\)!==CACHE_REVISION/);
});
