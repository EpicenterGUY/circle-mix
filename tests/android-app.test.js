'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const Android=require('../src/android-platform');
const Updater=require('../src/android-updater');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Android platform configuration uses the 0.9.50 fullscreen local-library shell',()=>{
  const config=JSON.parse(read('src-tauri/tauri.android.conf.json'));
  assert.equal(config.version,'0.9.50');
  assert.equal(config.build.frontendDist,'../android-dist');
  assert.equal(config.app.windows[0].fullscreen,true);
  assert.equal(config.app.windows[0].decorations,false);
  assert.equal(config.bundle.android.minSdkVersion,24);
  assert.equal(config.bundle.android.versionCode,9050);
  assert.match(config.app.security.csp,/connect-src 'self' https:\/\/api\.github\.com/);
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

test('Android release metadata selects only a newer exact signed ARM64 APK',()=>{
  assert.equal(Updater.VERSION,'android-updater-v1');
  assert.equal(Updater.compareVersions('0.9.50','0.9.49'),1);
  assert.equal(Updater.compareVersions('0.9.50','0.9.50'),0);
  assert.equal(Updater.releaseVersion('android-v0.9.51'),'0.9.51');
  assert.equal(Updater.releaseVersion('v0.9.51'),'');
  const release={
    tag_name:'android-v0.9.51',draft:false,prerelease:false,body:'notes',published_at:'2026-07-29T00:00:00Z',
    assets:[{name:'circle-mix-0.9.51-android-arm64-release.apk',state:'uploaded',size:123,digest:`sha256:${'a'.repeat(64)}`,browser_download_url:'https://github.com/EpicenterGUY/circle-mix/releases/download/android-v0.9.51/circle-mix-0.9.51-android-arm64-release.apk'}]
  };
  const update=Updater.releaseToUpdate(release,'0.9.50');
  assert.equal(update.version,'0.9.51');
  assert.equal(update.sha256,'a'.repeat(64));
  assert.equal(Updater.releaseToUpdate(release,'0.9.51'),null);
  assert.equal(Updater.releaseToUpdate({...release,assets:[{...release.assets[0],digest:null}]},'0.9.50'),null);
  assert.match(Updater.RELEASE_API,/releases\?per_page=20/);
});

test('Android startup fails open while adding a hash-verified PackageInstaller bridge',()=>{
  const patch=read('scripts/patch-android-project.js');
  const audit=read('scripts/audit-android-project.js');
  for(const needle of [
    'NATIVE_STARTUP_FAIL_OPEN','nativeStartupStep','window.decorView.post','Log.e("CircleMix"',
    'FLAG_KEEP_SCREEN_ON','BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE','LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES',
    'DownloadManager','PackageInstaller.SessionParams','addJavascriptInterface(AndroidUpdaterBridge()',
    'MessageDigest.getInstance("SHA-256")','REQUEST_INSTALL_PACKAGES','canRequestPackageInstalls',
    'STATUS_PENDING_USER_ACTION','circleMixUpdateToken','allowedUpdateUrl'
  ])assert.ok(patch.includes(needle),`native patch contains ${needle}`);
  assert.doesNotMatch(patch,/SCREEN_ORIENTATION_SENSOR_LANDSCAPE/);
  assert.doesNotMatch(patch,/requestedOrientation\s*=/);
  assert.match(patch,/android:screenOrientation','sensorLandscape'/);
  assert.match(patch,/android:appCategory','game'/);
  assert.match(audit,/PackageInstaller\.SessionParams/);
  assert.match(audit,/android\.permission\.REQUEST_INSTALL_PACKAGES/);
  assert.match(audit,/ANDROID_UPDATE_VERIFY_FAILED/);
});

test('Android verification artifact remains isolated from the persistent production key',()=>{
  const workflow=read('.github/workflows/android-app.yml');
  assert.match(workflow,/zipalign" -f -p 4/);
  assert.match(workflow,/keytool -genkeypair -noprompt/);
  assert.match(workflow,/apksigner" sign/);
  assert.match(workflow,/apksigner" verify --verbose --print-certs/);
  assert.match(workflow,/Verified using v2 scheme \(APK Signature Scheme v2\): true/);
  assert.match(workflow,/circle-mix-\$VERSION-android-arm64-debug-signed\.apk/);
  assert.match(workflow,/versionCode='\$VERSION_CODE' versionName='\$VERSION'/);
  assert.match(workflow,/sha256sum "\$FINAL_APK"/);
  assert.doesNotMatch(workflow,/ANDROID_KEYSTORE_BASE64|ANDROID_KEYSTORE_PASSWORD/);
});

test('Android production release uses persistent secrets and does not replace desktop latest',()=>{
  const workflow=read('.github/workflows/android-release.yml');
  for(const secret of ['ANDROID_KEYSTORE_BASE64','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD'])assert.match(workflow,new RegExp(`secrets\\.${secret}`));
  assert.match(workflow,/base64 --decode/);
  assert.match(workflow,/circle-mix-\$VERSION-android-arm64-release\.apk/);
  assert.match(workflow,/android-v\$VERSION/);
  assert.match(workflow,/PackageInstaller|SHA-256/);
  assert.match(workflow,/make_latest=false/);
  assert.match(workflow,/push:[\s\S]*branches:[\s\S]*- main[\s\S]*src-tauri\/tauri\.android\.conf\.json/);
  assert.match(workflow,/\.assets\[\].*digest/);
  assert.doesNotMatch(workflow,/keytool -genkeypair/,'production workflow must never generate a replacement signing key');
});

test('Android distribution, editor safety, updater bridge, native patch, and release workflow stay wired together',()=>{
  const packageJson=JSON.parse(read('package.json'));
  const prepare=read('scripts/prepare-android.js');
  const releasePass=read('scripts/prepare-android-0.9.50.js');
  const patch=read('scripts/patch-android-project.js');
  const distAudit=read('scripts/audit-android-dist.js');
  const projectAudit=read('scripts/audit-android-project.js');
  const verificationWorkflow=read('.github/workflows/android-app.yml');
  const releaseWorkflow=read('.github/workflows/android-release.yml');
  for(const needle of ['includeBundledSongs:false','enableServiceWorker:false','src/android-platform.js','src/android-updater.js','enableAndroidUpdater:true'])assert.match(prepare,new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(releasePass,/VERSION='0\.9\.50'/);
  assert.match(releasePass,/ANDROID 0\.9\.50/);
  assert.match(releasePass,/song-select-fixes\.css/);
  assert.match(releasePass,/sortDifficultyEntriesByStars/);
  assert.match(releasePass,/mergeLocalDifficulty/);
  assert.match(distAudit,/data:audio\//,'distribution audit rejects embedded audio');
  assert.match(distAudit,/src\/android-updater\.js/);
  assert.match(distAudit,/api\.github\.com/);
  assert.match(distAudit,/version:"0\.9\.50"/);
  assert.match(distAudit,/mergeLocalDifficulty/);
  for(const needle of ['android:appCategory','sensorLandscape','FLAG_KEEP_SCREEN_ON','androidBackCallback','NATIVE_STARTUP_FAIL_OPEN','PackageInstaller.SessionParams'])assert.ok(patch.includes(needle),`patch contains ${needle}`);
  assert.doesNotMatch(patch,/import app\.tauri\.TauriActivity/);
  assert.match(patch,/setGradleSdk\(gradle,'compileSdk',36\)/);
  assert.match(patch,/setGradleSdk\(gradle,'minSdk',24\)/);
  assert.match(patch,/setGradleSdk\(gradle,'targetSdk',36\)/);
  assert.match(distAudit,/Android distribution audit passed/);
  assert.match(projectAudit,/Generated Android project audit passed/);
  assert.equal(packageJson.scripts.tauri,'tauri');
  assert.match(packageJson.scripts['android:prepare'],/prepare-android-0\.9\.50\.js/);
  assert.match(packageJson.scripts['android:icons'],/tauri icon src-tauri\/app-icon\.svg -o src-tauri\/icons/);
  assert.match(packageJson.scripts['android:init'],/^npm run android:icons/);
  assert.match(packageJson.scripts['android:build:apk'],/^npm run android:icons/);
  assert.match(verificationWorkflow,/@tauri-apps\/cli@\$TAURI_CLI_VERSION android build --debug --apk --target aarch64 --ci/);
  assert.match(releaseWorkflow,/@tauri-apps\/cli@\$TAURI_CLI_VERSION android build --apk --target aarch64 --ci/);
});
