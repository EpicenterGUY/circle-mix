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
  if(/\s*\/>$/.test(tag))return tag.replace(/\s*\/>$/,` ${name}="${value}" />`);
  return tag.replace(/\s*>$/,` ${name}="${value}">`);
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

import android.app.DownloadManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import org.json.JSONObject
import java.security.MessageDigest
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Executors

class MainActivity : TauriActivity() {
  companion object {
    private const val UPDATE_INSTALL_ACTION = "com.epicenterguy.circlemix.UPDATE_INSTALL_STATUS"
  }

  private var gameWebView: WebView? = null
  private val updateExecutor = Executors.newSingleThreadExecutor()
  @Volatile private var updateStatus = "idle"
  @Volatile private var updateProgress = 0
  @Volatile private var updateMessage = ""
  @Volatile private var updateVersion = ""
  private var updateDownloadId = -1L
  private var updateExpectedSha256 = ""
  private var updateInstallToken = ""
  private var downloadReceiverRegistered = false
  private var installReceiverRegistered = false

  private inline fun nativeStartupStep(name: String, block: () -> Unit) {
    try {
      block()
    } catch (error: Throwable) {
      Log.e("CircleMix", "NATIVE_STARTUP_FAIL_OPEN:" + name, error)
    }
  }

  private val updateDownloadReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      val completedId = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) ?: -1L
      if (completedId != updateDownloadId || completedId < 0) return
      verifyAndInstallDownloadedApk(completedId)
    }
  }

  private val updateInstallReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action != UPDATE_INSTALL_ACTION) return
      if (intent.getStringExtra("circleMixUpdateToken") != updateInstallToken) return
      when (val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
        PackageInstaller.STATUS_PENDING_USER_ACTION -> {
          updateStatus = "awaiting_confirmation"
          updateMessage = "안드로이드 설치 확인 화면에서 업데이트를 승인해주세요."
          notifyUpdateState()
          pendingUserAction(intent)?.let { confirmation ->
            nativeStartupStep("update-confirmation") {
              confirmation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              startActivity(confirmation)
            }
          }
        }
        PackageInstaller.STATUS_SUCCESS -> {
          updateStatus = "installed"
          updateProgress = 100
          updateMessage = "업데이트 설치가 완료되었습니다."
          notifyUpdateState()
        }
        else -> {
          val detail = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: "status " + status
          setUpdateError("업데이트 설치 실패: " + detail)
        }
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    nativeStartupStep("keep-screen-on") {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    nativeStartupStep("immersive-post") {
      window.decorView.post { applyImmersiveMode() }
    }
    nativeStartupStep("update-receivers") {
      registerReceiverCompat(updateDownloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), true)
      downloadReceiverRegistered = true
      registerReceiverCompat(updateInstallReceiver, IntentFilter(UPDATE_INSTALL_ACTION), true)
      installReceiverRegistered = true
    }
    nativeStartupStep("back-dispatcher") {
      onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          val webView = gameWebView
          if (webView == null) {
            finish()
            return
          }
          nativeStartupStep("back-evaluate") {
            webView.evaluateJavascript(
              "(function(){try{return !!(window.androidBackCallback&&window.androidBackCallback());}catch(e){return true;}})()"
            ) { result -> if (result == "true") finish() }
          }
        }
      })
    }
  }

  override fun onWebViewCreate(webView: WebView) {
    gameWebView = webView
    nativeStartupStep("webview-options") {
      webView.isHapticFeedbackEnabled = true
      webView.overScrollMode = View.OVER_SCROLL_NEVER
      webView.addJavascriptInterface(AndroidUpdaterBridge(), "CircleMixAndroidUpdaterNative")
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    nativeStartupStep("configuration-immersive") {
      window.decorView.post { applyImmersiveMode() }
    }
    nativeStartupStep("configuration-webview") {
      gameWebView?.evaluateJavascript(
        "window.dispatchEvent(new Event('resize'));window.dispatchEvent(new CustomEvent('circlemix:nativeconfigurationchange'));",
        null
      )
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) nativeStartupStep("focus-immersive") {
      window.decorView.post { applyImmersiveMode() }
    }
  }

  override fun onDestroy() {
    nativeStartupStep("update-cleanup") {
      if (downloadReceiverRegistered) unregisterReceiver(updateDownloadReceiver)
      if (installReceiverRegistered) unregisterReceiver(updateInstallReceiver)
      updateExecutor.shutdownNow()
    }
    gameWebView = null
    super.onDestroy()
  }

  private inner class AndroidUpdaterBridge {
    @JavascriptInterface
    fun getState(): String {
      refreshDownloadProgress()
      return updateStateJson()
    }

    @JavascriptInterface
    fun canInstallPackages(): Boolean {
      return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || packageManager.canRequestPackageInstalls()
    }

    @JavascriptInterface
    fun requestInstallPermission(): String {
      if (canInstallPackages()) return updateStateJson()
      updateStatus = "permission_required"
      updateMessage = "이 출처의 앱 설치 권한을 허용해주세요."
      runOnUiThread {
        nativeStartupStep("update-install-permission") {
          startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + packageName)))
        }
      }
      return updateStateJson()
    }

    @JavascriptInterface
    fun downloadAndInstall(url: String, expectedSha256: String, version: String): String {
      if (!allowedUpdateUrl(url)) return updateErrorJson("허용되지 않은 업데이트 주소입니다.")
      val normalizedSha = expectedSha256.trim().lowercase(Locale.US)
      if (!normalizedSha.matches(Regex("^[a-f0-9]{64}$"))) return updateErrorJson("APK SHA-256 값이 올바르지 않습니다.")
      val safeVersion = version.trim()
      if (!safeVersion.matches(Regex("^[0-9A-Za-z._-]{1,40}$"))) return updateErrorJson("업데이트 버전이 올바르지 않습니다.")
      if (!canInstallPackages()) {
        updateStatus = "permission_required"
        updateMessage = "이 출처의 앱 설치 권한을 먼저 허용해주세요."
        return updateStateJson()
      }
      runOnUiThread { enqueueUpdateDownload(url, normalizedSha, safeVersion) }
      return updateStateJson()
    }
  }

  private fun allowedUpdateUrl(value: String): Boolean {
    return try {
      val uri = Uri.parse(value)
      uri.scheme == "https" && uri.host.equals("github.com", ignoreCase = true) &&
        uri.path.orEmpty().startsWith("/EpicenterGUY/circle-mix/releases/download/") &&
        uri.path.orEmpty().endsWith(".apk")
    } catch (_: Throwable) { false }
  }

  private fun enqueueUpdateDownload(url: String, expectedSha256: String, version: String) {
    nativeStartupStep("update-download-enqueue") {
      val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      if (updateDownloadId >= 0) manager.remove(updateDownloadId)
      val filename = "circle-mix-update-" + version + ".apk"
      getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)?.resolve(filename)?.delete()
      val request = DownloadManager.Request(Uri.parse(url))
        .setTitle("CIRCLE MIX " + version)
        .setDescription("Android 업데이트 다운로드")
        .setMimeType("application/vnd.android.package-archive")
        .setAllowedOverMetered(true)
        .setAllowedOverRoaming(false)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, filename)
      updateExpectedSha256 = expectedSha256
      updateVersion = version
      updateProgress = 0
      updateStatus = "downloading"
      updateMessage = "업데이트 APK를 다운로드하는 중입니다…"
      updateDownloadId = manager.enqueue(request)
      notifyUpdateState()
    }
  }

  private fun refreshDownloadProgress() {
    if (updateStatus != "downloading" || updateDownloadId < 0) return
    nativeStartupStep("update-download-progress") {
      val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      manager.query(DownloadManager.Query().setFilterById(updateDownloadId)).use { cursor ->
        if (!cursor.moveToFirst()) return
        val downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
        val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
        if (total > 0) updateProgress = ((downloaded * 100L) / total).toInt().coerceIn(0, 99)
        when (cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))) {
          DownloadManager.STATUS_FAILED -> setUpdateError("APK 다운로드에 실패했습니다.")
          DownloadManager.STATUS_PAUSED -> updateMessage = "APK 다운로드가 일시 중지되었습니다."
        }
      }
    }
  }

  private fun verifyAndInstallDownloadedApk(downloadId: Long) {
    val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val uri = manager.getUriForDownloadedFile(downloadId)
    if (uri == null) {
      setUpdateError("다운로드된 APK를 찾을 수 없습니다.")
      return
    }
    updateStatus = "verifying"
    updateProgress = 99
    updateMessage = "APK 무결성을 확인하는 중입니다…"
    notifyUpdateState()
    updateExecutor.execute {
      try {
        val actual = contentResolver.openInputStream(uri)?.use { input ->
          val digest = MessageDigest.getInstance("SHA-256")
          val buffer = ByteArray(1024 * 64)
          while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            if (count > 0) digest.update(buffer, 0, count)
          }
          digest.digest().joinToString("") { byte -> (byte.toInt() and 0xff).toString(16).padStart(2, '0') }
        } ?: throw IllegalStateException("APK stream unavailable")
        if (!actual.equals(updateExpectedSha256, ignoreCase = true)) {
          setUpdateError("APK SHA-256 검증에 실패했습니다.")
          return@execute
        }
        installVerifiedApk(uri)
      } catch (error: Throwable) {
        Log.e("CircleMix", "ANDROID_UPDATE_VERIFY_FAILED", error)
        setUpdateError("APK 검증 실패: " + (error.message ?: error.javaClass.simpleName))
      }
    }
  }

  private fun installVerifiedApk(uri: Uri) {
    try {
      updateStatus = "installing"
      updateProgress = 100
      updateMessage = "안드로이드 설치 프로그램을 준비하는 중입니다…"
      notifyUpdateState()
      val installer = packageManager.packageInstaller
      val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
      params.setAppPackageName(packageName)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED)
      val sessionId = installer.createSession(params)
      installer.openSession(sessionId).use { session ->
        contentResolver.openInputStream(uri).use { input ->
          if (input == null) throw IllegalStateException("APK stream unavailable")
          session.openWrite("base.apk", 0, -1).use { output ->
            input.copyTo(output)
            session.fsync(output)
          }
        }
        updateInstallToken = UUID.randomUUID().toString()
        val callback = Intent(UPDATE_INSTALL_ACTION).setPackage(packageName).putExtra("circleMixUpdateToken", updateInstallToken)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
        val pending = PendingIntent.getBroadcast(this, sessionId, callback, flags)
        session.commit(pending.intentSender)
      }
    } catch (error: Throwable) {
      Log.e("CircleMix", "ANDROID_UPDATE_INSTALL_FAILED", error)
      setUpdateError("설치 준비 실패: " + (error.message ?: error.javaClass.simpleName))
    }
  }

  @Suppress("DEPRECATION")
  private fun pendingUserAction(intent: Intent): Intent? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
    else intent.getParcelableExtra(Intent.EXTRA_INTENT)
  }

  @Suppress("DEPRECATION")
  private fun registerReceiverCompat(receiver: BroadcastReceiver, filter: IntentFilter, exported: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(receiver, filter, if (exported) Context.RECEIVER_EXPORTED else Context.RECEIVER_NOT_EXPORTED)
    } else registerReceiver(receiver, filter)
  }

  private fun updateErrorJson(message: String): String {
    setUpdateError(message)
    return updateStateJson()
  }

  private fun setUpdateError(message: String) {
    updateStatus = "error"
    updateMessage = message
    updateProgress = 0
    notifyUpdateState()
  }

  private fun updateStateJson(): String {
    return JSONObject()
      .put("status", updateStatus)
      .put("progress", updateProgress)
      .put("message", updateMessage)
      .put("version", updateVersion)
      .put("permission", Build.VERSION.SDK_INT < Build.VERSION_CODES.O || packageManager.canRequestPackageInstalls())
      .toString()
  }

  private fun notifyUpdateState() {
    gameWebView?.post {
      gameWebView?.evaluateJavascript("window.dispatchEvent(new CustomEvent('circlemix:android-native-update'));", null)
    }
  }

  @Suppress("DEPRECATION")
  private fun applyImmersiveMode() {
    nativeStartupStep("system-bars") {
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
    }
    nativeStartupStep("display-cutout") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        window.attributes = window.attributes.apply {
          layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
      }
    }
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
  let next=setAttribute(tag,'android:screenOrientation','sensorLandscape');
  next=setAttribute(next,'android:resizeableActivity','true');
  next=setAttribute(next,'android:configChanges','orientation|screenSize|smallestScreenSize|screenLayout|keyboard|keyboardHidden|uiMode');
  return next;
});
if(!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')){
  manifest=manifest.replace(/(<manifest\b[^>]*>)/,`$1\n    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`);
}
if(!manifest.includes('android.hardware.touchscreen')){
  manifest=manifest.replace(/(<manifest\b[^>]*>)/,`$1\n    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />\n    <uses-feature android:name="android.hardware.screen.landscape" android:required="false" />`);
}
if(!manifest.includes('android:appCategory="game"')||!manifest.includes('android:screenOrientation="sensorLandscape"')||!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES'))throw new Error('Android manifest patch did not apply.');
fs.writeFileSync(manifestPath,manifest);

let gradle=fs.readFileSync(gradlePath,'utf8');
gradle=setGradleSdk(gradle,'compileSdk',36);
gradle=setGradleSdk(gradle,'minSdk',24);
gradle=setGradleSdk(gradle,'targetSdk',36);
fs.writeFileSync(gradlePath,gradle);

console.log(`Patched Android project: ${path.relative(root,activityPath)}, ${path.relative(root,manifestPath)}, ${path.relative(root,gradlePath)}`);
