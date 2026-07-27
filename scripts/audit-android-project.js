#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const androidRoot=path.join(root,'src-tauri','gen','android');
function walk(directory,predicate){if(!fs.existsSync(directory))return null;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory()){const found=walk(full,predicate);if(found)return found;}else if(predicate(full))return full;}return null;}
const activityPath=walk(path.join(androidRoot,'app','src','main','java'),file=>file.endsWith('MainActivity.kt'));
const manifestPath=walk(path.join(androidRoot,'app','src','main'),file=>file.endsWith('AndroidManifest.xml'));
const gradlePath=walk(path.join(androidRoot,'app'),file=>path.basename(file)==='build.gradle.kts');
if(!activityPath||!manifestPath||!gradlePath)throw new Error('Generated Android project has not been initialized and patched');
const activity=fs.readFileSync(activityPath,'utf8');
const manifest=fs.readFileSync(manifestPath,'utf8');
const gradle=fs.readFileSync(gradlePath,'utf8');
for(const needle of ['FLAG_KEEP_SCREEN_ON','BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE','LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES','onBackPressedDispatcher','androidBackCallback','onConfigurationChanged','NATIVE_STARTUP_FAIL_OPEN','nativeStartupStep','window.decorView.post'])if(!activity.includes(needle))throw new Error(`MainActivity is missing ${needle}`);
for(const needle of ['DownloadManager','PackageInstaller.SessionParams','AndroidUpdaterBridge','CircleMixAndroidUpdaterNative','JavascriptInterface','canRequestPackageInstalls','ACTION_MANAGE_UNKNOWN_APP_SOURCES','MessageDigest.getInstance("SHA-256")','UPDATE_INSTALL_STATUS','USER_ACTION_REQUIRED','ANDROID_UPDATE_VERIFY_FAILED','circleMixUpdateToken'])if(!activity.includes(needle))throw new Error(`Android updater bridge is missing ${needle}`);
for(const forbidden of ['SCREEN_ORIENTATION_SENSOR_LANDSCAPE','requestedOrientation ='])if(activity.includes(forbidden))throw new Error(`MainActivity must not change orientation through the startup runtime path: ${forbidden}`);
for(const needle of ['android:appCategory="game"','android:resizeableActivity="true"','android:screenOrientation="sensorLandscape"','android.permission.REQUEST_INSTALL_PACKAGES','smallestScreenSize','android.hardware.touchscreen','android.hardware.screen.landscape'])if(!manifest.includes(needle))throw new Error(`AndroidManifest is missing ${needle}`);
if(!/compileSdk\s*=\s*36/.test(gradle)||!/targetSdk\s*=\s*36/.test(gradle)||!/minSdk\s*=\s*24/.test(gradle))throw new Error('Android SDK levels are not compile 36 / target 36 / min 24');
console.log('Generated Android project audit passed.');
