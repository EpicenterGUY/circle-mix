'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Android=require('../src/android-platform');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Android platform configuration uses a fullscreen local-library shell',()=>{
  const config=JSON.parse(read('src-tauri/tauri.android.conf.json'));
  assert.equal(config.version,'0.9.42');
  assert.equal(config.build.frontendDist,'../android-dist');
  assert.equal(config.app.windows[0].fullscreen,true);
  assert.equal(config.app.windows[0].decorations,false);
  assert.equal(config.bundle.android.minSdkVersion,24);
  assert.equal(config.bundle.android.versionCode,9042);
});

test('mobile build gates the Windows updater while retaining a Tauri mobile entrypoint',()=>{
  const cargo=read('src-tauri/Cargo.toml');
  const rust=read('src-tauri/src/lib.rs');
  assert.match(cargo,/cfg\(not\(any\(target_os = "android", target_os = "ios"\)\)\)/);
  assert.match(cargo,/tauri-plugin-updater = "2"/);
  assert.match(rust,/cfg_attr\(mobile, tauri::mobile_entry_point\)/);
  assert.match(rust,/cfg\(desktop\)[\s\S]*check_desktop_update/);
  assert.match(rust,/cfg\(mobile\)[\s\S]*android_shell_info/);
});

test('fold viewport classification and Android back policy are deterministic',()=>{
  assert.equal(Android.foldExpanded({width:884,height:1104}),true);
  assert.equal(Android.foldExpanded({width:904,height:420}),false);
  assert.equal(Android.foldExpanded({width:412,height:915}),false);
  const classes=new Set(['safeTitle']);
  const body={classList:{contains:name=>classes.has(name)}};
  const doc={body,getElementById:()=>null};
  assert.equal(Android.handleAndroidBack(doc,{}),true,'top-level title exits the native activity');
  let backClicks=0;
  classes.delete('safeTitle');classes.add('safeSongSelect');
  const elements={songSelect:{hidden:false,style:{display:'block'},getAttribute:()=>null,ownerDocument:{defaultView:{getComputedStyle:()=>({display:'block'})}}},songSelectBack:{disabled:false,click(){backClicks++;}}};
  doc.getElementById=id=>elements[id]||null;
  assert.equal(Android.handleAndroidBack(doc,{}),false);
  assert.equal(backClicks,1);
});

test('Android native startup fails open and leaves orientation to the device',()=>{
  const patch=read('scripts/patch-android-project.js');
  const audit=read('scripts/audit-android-project.js');
  for(const needle of ['NATIVE_STARTUP_FAIL_OPEN','nativeStartupStep','window.decorView.post','Log.e("CircleMix"','FLAG_KEEP_SCREEN_ON','BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE','LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES']){
    assert.ok(patch.includes(needle),`native patch contains ${needle}`);
  }
  assert.doesNotMatch(patch,/SCREEN_ORIENTATION_SENSOR_LANDSCAPE/);
  assert.doesNotMatch(patch,/requestedOrientation\s*=/);
  assert.match(patch,/android:screenOrientation','unspecified'/);
  assert.match(audit,/must not force startup orientation/);
  assert.match(audit,/NATIVE_STARTUP_FAIL_OPEN/);
});

test('Android distribution, native patch, icon generation, and APK workflow stay wired together',()=>{
  const packageJson=JSON.parse(read('package.json'));
  const prepare=read('scripts/prepare-android.js');
  const patch=read('scripts/patch-android-project.js');
  const distAudit=read('scripts/audit-android-dist.js');
  const projectAudit=read('scripts/audit-android-project.js');
  const workflow=read('.github/workflows/android-app.yml');
  for(const needle of ['includeBundledSongs:false','enableServiceWorker:false','src/android-platform.js'])assert.match(prepare,new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(prepare,/ANDROID_VERSION='0\.9\.42'/);
  assert.match(prepare,/ANDROID LAUNCH HOTFIX/);
  assert.match(distAudit,/data:audio\//,'distribution audit rejects embedded audio');
  for(const needle of ['android:appCategory','FLAG_KEEP_SCREEN_ON','androidBackCallback','NATIVE_STARTUP_FAIL_OPEN'])assert.ok(patch.includes(needle),`patch contains ${needle}`);
  assert.doesNotMatch(patch,/import app\.tauri\.TauriActivity/);
  assert.match(patch,/setGradleSdk\(gradle,'compileSdk',36\)/);
  assert.match(patch,/setGradleSdk\(gradle,'minSdk',24\)/);
  assert.match(patch,/setGradleSdk\(gradle,'targetSdk',36\)/);
  assert.match(distAudit,/Android distribution audit passed/);
  assert.match(projectAudit,/Generated Android project audit passed/);
  assert.equal(packageJson.scripts.tauri,'tauri');
  assert.match(packageJson.scripts['android:icons'],/tauri icon src-tauri\/app-icon\.svg -o src-tauri\/icons/);
  assert.match(packageJson.scripts['android:init'],/^npm run android:icons/);
  assert.match(packageJson.scripts['android:build:apk'],/^npm run android:icons/);
  assert.match(workflow,/@tauri-apps\/cli@\$TAURI_CLI_VERSION icon src-tauri\/app-icon\.svg -o src-tauri\/icons/);
  assert.match(workflow,/test -f src-tauri\/icons\/icon\.png/);
  assert.match(workflow,/@tauri-apps\/cli@\$TAURI_CLI_VERSION android init --ci --skip-targets-install/);
  assert.match(workflow,/@tauri-apps\/cli@\$TAURI_CLI_VERSION android build --debug --apk --target aarch64 --ci/);
  assert.match(workflow,/circle-mix-0\.9\.42-android-arm64-debug\.apk/);
  assert.match(workflow,/circle-mix-android-arm64-debug/);
  assert.doesNotMatch(workflow,/KEYSTORE_PASSWORD|SIGNING_PRIVATE_KEY|base64.*keystore/i);
});
