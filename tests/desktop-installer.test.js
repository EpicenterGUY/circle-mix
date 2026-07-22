'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const tauri=JSON.parse(fs.readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
const cargo=fs.readFileSync(path.join(root,'src-tauri/Cargo.toml'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/windows-desktop.yml'),'utf8');

assert.equal(tauri.bundle?.active,true,'desktop bundling must stay enabled');
assert.deepEqual(tauri.bundle?.targets,['nsis'],'Windows v1 must produce only the NSIS installer');
assert.equal(tauri.bundle?.windows?.nsis?.installMode,'currentUser','the test installer must not require administrator privileges');
assert.match(pkg.scripts?.['desktop:build']||'',/cargo tauri build$/,'desktop build must bundle the configured installer');
assert.doesNotMatch(pkg.scripts?.['desktop:build']||'',/--no-bundle/,'desktop build must not suppress installer generation');
assert.match(cargo,new RegExp(`version = "${pkg.version.replaceAll('.','\\.')}"`),'Cargo and package versions must match');
assert.match(workflow,/\*-setup\.exe/,'Windows CI must locate the NSIS setup executable');
assert.match(workflow,/ArgumentList '\/S'/,'Windows CI must exercise silent NSIS install and uninstall');
assert.match(workflow,/DisplayName -like 'CIRCLE MIX\*'/,'Windows CI must verify the installed application entry');
assert.match(workflow,/UninstallString/,'Windows CI must verify and execute the uninstaller');
assert.match(workflow,/circle-mix-windows-installer-x64/,'Windows CI must publish the installer artifact');

console.log('desktop installer configuration tests passed');
