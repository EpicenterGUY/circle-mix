'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const tauri=JSON.parse(fs.readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
const cargo=fs.readFileSync(path.join(root,'src-tauri/Cargo.toml'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/windows-desktop.yml'),'utf8');
const prepare=fs.readFileSync(path.join(root,'scripts/prepare-desktop.js'),'utf8');
const audit=fs.readFileSync(path.join(root,'scripts/audit-desktop-dist.js'),'utf8');

assert.equal(tauri.bundle?.active,true,'desktop bundling must stay enabled');
assert.deepEqual(tauri.bundle?.targets,['nsis'],'Windows v1 must produce only the NSIS installer');
assert.equal(tauri.bundle?.windows?.nsis?.installMode,'currentUser','the test installer must not require administrator privileges');
assert.match(pkg.scripts?.['desktop:build']||'',/cargo tauri build$/,'desktop build must bundle the configured installer');
assert.doesNotMatch(pkg.scripts?.['desktop:build']||'',/--no-bundle/,'desktop build must not suppress installer generation');
assert.match(cargo,new RegExp(`version = "${tauri.version.replaceAll('.','\\.')}"`),'Cargo and Tauri desktop versions must match');
assert.equal(tauri.version,'0.9.31','Windows installer follow-up must publish the PULSE release version');
assert.match(prepare,/DESKTOP_VERSION='0\.9\.31'/,'desktop distribution must expose the installer release version');
assert.match(prepare,/desktop-release\.js/,'desktop build must inject release metadata before game startup');
assert.match(prepare,/PULSE & WINDOWS INSTALLER/,'desktop changelog must announce PULSE');
assert.match(prepare,/DESKTOP · READY/,'desktop offline data must report ready instead of using the web service worker flow');
assert.match(audit,/desktop offline-ready shim is missing/,'desktop audit must verify the offline-ready shim');
assert.match(workflow,/\*-setup\.exe/,'Windows CI must locate the NSIS setup executable');
assert.match(workflow,/ArgumentList '\/S'/,'Windows CI must exercise silent NSIS install and uninstall');
assert.match(workflow,/DisplayName -like 'CIRCLE MIX\*'/,'Windows CI must verify the installed application entry');
assert.match(workflow,/InstallLocation\)\.Trim\(\)\.Trim\('\"'\)/,'Windows CI must remove registry quotes before joining the install path');
assert.match(workflow,/UninstallString/,'Windows CI must verify and execute the uninstaller');
assert.match(workflow,/circle-mix-windows-installer-x64/,'Windows CI must publish the installer artifact');

console.log('desktop installer configuration tests passed');
