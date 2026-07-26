#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const androidRoot=path.join(root,'src-tauri','gen','android');

function walk(directory,predicate){
  if(!fs.existsSync(directory))return null;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory()){
      const found=walk(full,predicate);if(found)return found;
    }else if(predicate(full))return full;
  }
  return null;
}
function setAttribute(tag,name,value){
  const expression=new RegExp(`\\s${name}="[^"]*"`);
  if(expression.test(tag))return tag.replace(expression,` ${name}="${value}"`);
  return tag.replace(/\s*\/$/,` ${name}="${value}" /`).replace(/\s*>$/,` ${name}="${value}">`);
}
function setGradleSdk(source,name,value){
  const expression=new RegExp(`${name}\\s*=\\s*\\d+`);
  const current=source.match(expression)?.[0];
  if(!current)throw new Error(`Unable to locate ${name} in generated Gradle configuration.`);
  if(new RegExp(`=\\s*${value}$`).test(current))return source;
  return source.replace(expression,`${name} = ${value}`);
}

if(!fs.existsSync(androidRoot))throw new Error('Run `cargo tauri android init --ci` before patching the Android project.');
const activityPath=walk(path.join(androidRoot,'app','src','main','java'),file=>file.endsWith('MainActivity.kt'));
const manifestPath=walk(path.join(androidRoot,'app','src','main'),file=>file.endsWith('AndroidManifest.xml'));
const gradlePath=walk(path.join(androidRoot,'app'),file=>path.basename(file)==='build.gradle.kts');
if(!activityPath||!manifestPath||!gradlePath)throw new Error('Generated Android activity, manifest, or Gradle file is missing.');

const originalActivity=fs.readFileSync(activityPath,'utf8');
const packageName=originalActivity.match(/^package\s+([^\s]+)/m)?.[1];
if(!packageName)throw new Error('Unable to resolve the generated Android package name.');
const activity=`package ${packageName}

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import kotlin.math.max
import kotlin.math.min

class MainActivity : TauriActivity() {
  private var gameWebView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    applyImmersiveMode()
    updateFoldOrientation()
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        val webView = gameWebView
        if (webView == null) {
          finish()
          return
        }
        webView.evaluateJavascript(
          "(function(){try{return !!(window.androidBackCallback&&window.androidBackCallback());}catch(e){return true;}})()"
        ) { result -> if (result == "true") finish() }
      }
    })
  }

  override fun onWebViewCreate(webView: WebView) {
    gameWebView = webView
    webView.isHapticFeedbackEnabled = true
    webView.overScrollMode = View.OVER_SCROLL_NEVER
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applyImmersiveMode()
    updateFoldOrientation()
    gameWebView?.evaluateJavascript(
      "window.dispatchEvent(new Event('resize'));window.dispatchEvent(new CustomEvent('circlemix:nativeconfigurationchange'));",
      null
    )
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) applyImmersiveMode()
  }

  @Suppress("DEPRECATION")
  private fun applyImmersiveMode() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false)
      window.insetsController?.let { controller ->
        controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
        controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      window.decorView.systemUiVisibility =
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
        View.SYSTEM_UI_FLAG_FULLSCREEN or
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      window.attributes = window.attributes.apply {
        layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
    }
  }

  private fun updateFoldOrientation() {
    val config = resources.configuration
    val shortest = min(config.screenWidthDp, config.screenHeightDp)
    val longest = max(config.screenWidthDp, config.screenHeightDp)
    val unfolded = config.smallestScreenWidthDp >= 600 || (longest >= 720 && shortest >= 480)
    val target = if (unfolded) ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    if (requestedOrientation != target) requestedOrientation = target
  }
}
`;
fs.writeFileSync(activityPath,activity);

let manifest=fs.readFileSync(manifestPath,'utf8').replace(/\r\n/g,'\n');
manifest=manifest.replace(/<application\b[^>]*>/,tag=>{
  let next=setAttribute(tag,'android:appCategory','game');
  next=setAttribute(next,'android:resizeableActivity','true');
  return next;
});
manifest=manifest.replace(/<activity\b[^>]*android:name="(?:\.MainActivity|[^\"]*MainActivity)"[^>]*>/,tag=>{
  let next=setAttribute(tag,'android:screenOrientation','unspecified');
  next=setAttribute(next,'android:resizeableActivity','true');
  next=setAttribute(next,'android:configChanges','orientation|screenSize|smallestScreenSize|screenLayout|keyboard|keyboardHidden|uiMode');
  return next;
});
if(!manifest.includes('android.hardware.touchscreen')){
  manifest=manifest.replace(/(<manifest\b[^>]*>)/,`$1\n    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />\n    <uses-feature android:name="android.hardware.screen.landscape" android:required="false" />`);
}
if(!manifest.includes('android:appCategory="game"')||!manifest.includes('android:screenOrientation="unspecified"'))throw new Error('Android manifest patch did not apply.');
fs.writeFileSync(manifestPath,manifest);

let gradle=fs.readFileSync(gradlePath,'utf8');
gradle=setGradleSdk(gradle,'compileSdk',36);
gradle=setGradleSdk(gradle,'minSdk',24);
gradle=setGradleSdk(gradle,'targetSdk',36);
fs.writeFileSync(gradlePath,gradle);

console.log(`Patched Android project: ${path.relative(root,activityPath)}, ${path.relative(root,manifestPath)}, ${path.relative(root,gradlePath)}`);
