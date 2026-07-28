#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
APP_VERSION = "0.9.46"
ANDROID_VERSION_CODE = 9046
WEB_VERSION = "0.9.33"
BUILD_DATE = "2026-07-28"
CACHE_REVISION = "20260728-all-platforms-0.9.46"


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(path, old, new, label):
    text = read(path)
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected exactly one match in {path}, found {text.count(old)}")
    write(path, text.replace(old, new, 1))


def replace_all_required(path, old, new, label):
    text = read(path)
    count = text.count(old)
    if count < 1:
        raise SystemExit(f"{label}: no matches in {path}")
    write(path, text.replace(old, new))


def update_json(path, fn):
    target = ROOT / path
    data = json.loads(target.read_text(encoding="utf-8"))
    fn(data)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


update_json("package.json", lambda data: data.__setitem__("version", APP_VERSION))
update_json("package-lock.json", lambda data: (data.__setitem__("version", APP_VERSION), data["packages"][""].__setitem__("version", APP_VERSION)))
update_json("src-tauri/tauri.conf.json", lambda data: data.__setitem__("version", APP_VERSION))
update_json("src-tauri/tauri.android.conf.json", lambda data: (data.__setitem__("version", APP_VERSION), data["bundle"]["android"].__setitem__("versionCode", ANDROID_VERSION_CODE)))

replace_once("src-tauri/Cargo.toml", 'version = "0.9.41"', f'version = "{APP_VERSION}"', "Cargo application version")

replace_once("scripts/prepare-desktop.js", "const DESKTOP_VERSION='0.9.41';", f"const DESKTOP_VERSION='{APP_VERSION}';", "desktop version")
replace_once("scripts/prepare-desktop.js", "const DESKTOP_BUILD_DATE='2026-07-26';", f"const DESKTOP_BUILD_DATE='{BUILD_DATE}';", "desktop build date")
old_desktop_release = '''  const release={version:"${DESKTOP_VERSION}",date:"${DESKTOP_BUILD_DATE}",title:"UNIFIED SETTINGS & MOBILE LAYOUT V2",summary:"PC 설정을 한 화면으로 통합하고 모바일 ACTION·PULSE 버튼 위치를 직접 조정할 수 있게 했습니다.",changes:[
    {category:"SETTINGS",text:"플레이·입력·오디오·화면·접근성·고급 설정을 검색 가능한 PC 설정 허브로 통합했습니다."},
    {category:"MOBILE",text:"ACTION과 PULSE 버튼을 직접 드래그하고 크기·투명도·프리셋을 저장할 수 있습니다."},
    {category:"MIGRATION",text:"기존 커스텀 SCRATCH 좌표가 있으면 PULSE 위치로 자동 이전해 모바일 배치를 보존합니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 채보와 LOCAL .cmix 라이브러리는 그대로 유지됩니다."}
  ]};'''
new_desktop_release = '''  const release={version:"${DESKTOP_VERSION}",date:"${DESKTOP_BUILD_DATE}",title:"ALL-PLATFORM 0.9.46",summary:"모바일·PC 공통 본편 개선과 통합 설정, PULSE 동시치기 가독성을 최신 설치판에 반영했습니다.",changes:[
    {category:"SETTINGS",text:"플레이·입력·오디오·화면·접근성·시스템 설정을 모바일과 PC에서 같은 구조로 사용할 수 있습니다."},
    {category:"PULSE",text:"PULSE와 동시에 등장하는 CUT·HOLD·SLIDE·TRACE·SWING 계열을 주황색 언어로 명확히 구분합니다."},
    {category:"MOBILE",text:"ACTION과 PULSE 버튼을 직접 드래그하고 크기·투명도·프리셋을 저장할 수 있습니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 채보와 LOCAL .cmix 라이브러리는 그대로 유지됩니다."}
  ]};'''
replace_once("scripts/prepare-desktop.js", old_desktop_release, new_desktop_release, "desktop release notes")

replace_once("scripts/prepare-android.js", "const ANDROID_VERSION='0.9.45';", f"const ANDROID_VERSION='{APP_VERSION}';", "Android version")
replace_once("scripts/prepare-android.js", "const ANDROID_BUILD_DATE='2026-07-27';", f"const ANDROID_BUILD_DATE='{BUILD_DATE}';", "Android build date")
old_android_release = '''  const release={version:"${ANDROID_VERSION}",date:"${ANDROID_BUILD_DATE}",title:"ANDROID AUTO UPDATE",summary:"GitHub Releases 기반 Android 앱 업데이트 확인과 안전한 APK 설치 흐름을 추가했습니다.",changes:[
    {category:"UPDATE",text:"앱 실행 시 최신 Android Release를 확인하고 설정의 시스템 카테고리에서도 수동 확인할 수 있습니다."},
    {category:"VERIFY",text:"GitHub Release asset의 SHA-256 digest와 다운로드한 APK를 대조한 뒤에만 설치를 진행합니다."},
    {category:"INSTALL",text:"Android PackageInstaller를 사용하며 최초 한 번은 ‘이 출처의 앱 설치 허용’ 승인이 필요합니다."},
    {category:"SIGNING",text:"정식 업데이트 Release는 GitHub Secrets에 저장된 동일한 영구 서명키로만 게시합니다."}
  ]};'''
new_android_release = '''  const release={version:"${ANDROID_VERSION}",date:"${ANDROID_BUILD_DATE}",title:"ANDROID 0.9.46",summary:"최신 모바일·PC 공통 본편과 PULSE 동시치기 가독성 개선을 Android 설치판에 반영했습니다.",changes:[
    {category:"MOBILE",text:"접힘·펼침 자동 가로화면, 통합 설정 허브와 ACTION·PULSE 버튼 배치 편집을 포함합니다."},
    {category:"PULSE",text:"PULSE 동시치기 CUT·HOLD·SLIDE·TRACE·SWING 계열을 주황색으로 명확히 구분합니다."},
    {category:"UPDATE",text:"GitHub Release의 SHA-256을 검증한 뒤 Android PackageInstaller로 안전하게 업데이트합니다."},
    {category:"COMPATIBILITY",text:"설정, 기록과 LOCAL .cmix 데이터 형식은 그대로 유지됩니다."}
  ]};'''
replace_once("scripts/prepare-android.js", old_android_release, new_android_release, "Android release notes")

version_source = f'''(function(root){{
  "use strict";
  root.CircleMixVersion = Object.freeze({{
    version: "{WEB_VERSION}",
    buildDate: "{BUILD_DATE}",
    cacheRevision: "{CACHE_REVISION}"
  }});
}})(typeof window !== "undefined" ? window : self);
'''
write("src/version.js", version_source)

changelog_entry = f'''  {{ version: "{WEB_VERSION}", date: "{BUILD_DATE}", title: "ALL-PLATFORM UPDATE", summary: "모바일·PC·PWA에 최신 본편 개선과 통합 설정, Android 업데이트와 PULSE 동시치기 가독성을 배포했습니다.", changes: [
    {{ category: "PLATFORM", text: "Windows와 Android 설치판을 {APP_VERSION}, 웹/PWA를 {WEB_VERSION}으로 갱신" }},
    {{ category: "MOBILE", text: "폴더블 자동 가로화면, 통합 설정 허브, ACTION·PULSE 배치와 Android 앱 내 업데이트 포함" }},
    {{ category: "PULSE", text: "동시치기 CUT·HOLD·SLIDE·TRACE·SWING 계열을 방향성이 살아 있는 주황색으로 통일" }},
    {{ category: "DATA", text: "기존 설정, 점수 기록과 LOCAL .cmix 라이브러리를 유지" }}
  ] }},
'''
replace_once("src/changelog.js", "window.CircleMixChangelog = [\n", "window.CircleMixChangelog = [\n" + changelog_entry, "web changelog entry")
replace_all_required("editor.html", "20260726-unified-settings-mobile-layout-v2", CACHE_REVISION, "editor cache revision")

replace_all_required("tests/desktop-installer.test.js", "0.9.41", APP_VERSION, "desktop installer version expectations")
replace_once("tests/desktop-installer.test.js", "UNIFIED SETTINGS & MOBILE LAYOUT V2", "ALL-PLATFORM 0.9.46", "desktop release title expectation")
replace_all_required("tests/desktop-updater.test.js", "0.9.41", APP_VERSION, "desktop updater version expectation")
replace_all_required("tests/mobile-layout-v2-browser.test.js", "0.9.41", APP_VERSION, "mobile layout fixture version")

android_test = read("tests/android-app.test.js")
android_test = android_test.replace("uses the 0.9.45 fullscreen", "uses the 0.9.46 fullscreen", 1)
android_test = android_test.replace("assert.equal(config.version,'0.9.45');", "assert.equal(config.version,'0.9.46');", 1)
android_test = android_test.replace("assert.equal(config.bundle.android.versionCode,9045);", "assert.equal(config.bundle.android.versionCode,9046);", 1)
old_update_block = '''  assert.equal(Updater.compareVersions('0.9.45','0.9.44'),1);
  assert.equal(Updater.compareVersions('0.9.45','0.9.45'),0);
  assert.equal(Updater.releaseVersion('android-v0.9.46'),'0.9.46');
  assert.equal(Updater.releaseVersion('v0.9.46'),'');
  const release={
    tag_name:'android-v0.9.46',draft:false,prerelease:false,body:'notes',published_at:'2026-07-27T00:00:00Z',
    assets:[{name:'circle-mix-0.9.46-android-arm64-release.apk',state:'uploaded',size:123,digest:`sha256:${'a'.repeat(64)}`,browser_download_url:'https://github.com/EpicenterGUY/circle-mix/releases/download/android-v0.9.46/circle-mix-0.9.46-android-arm64-release.apk'}]
  };
  const update=Updater.releaseToUpdate(release,'0.9.45');
  assert.equal(update.version,'0.9.46');
  assert.equal(update.sha256,'a'.repeat(64));
  assert.equal(Updater.releaseToUpdate(release,'0.9.46'),null);
  assert.equal(Updater.releaseToUpdate({...release,assets:[{...release.assets[0],digest:null}]},'0.9.45'),null);'''
new_update_block = '''  assert.equal(Updater.compareVersions('0.9.46','0.9.45'),1);
  assert.equal(Updater.compareVersions('0.9.46','0.9.46'),0);
  assert.equal(Updater.releaseVersion('android-v0.9.47'),'0.9.47');
  assert.equal(Updater.releaseVersion('v0.9.47'),'');
  const release={
    tag_name:'android-v0.9.47',draft:false,prerelease:false,body:'notes',published_at:'2026-07-28T00:00:00Z',
    assets:[{name:'circle-mix-0.9.47-android-arm64-release.apk',state:'uploaded',size:123,digest:`sha256:${'a'.repeat(64)}`,browser_download_url:'https://github.com/EpicenterGUY/circle-mix/releases/download/android-v0.9.47/circle-mix-0.9.47-android-arm64-release.apk'}]
  };
  const update=Updater.releaseToUpdate(release,'0.9.46');
  assert.equal(update.version,'0.9.47');
  assert.equal(update.sha256,'a'.repeat(64));
  assert.equal(Updater.releaseToUpdate(release,'0.9.47'),null);
  assert.equal(Updater.releaseToUpdate({...release,assets:[{...release.assets[0],digest:null}]},'0.9.46'),null);'''
if android_test.count(old_update_block) != 1:
    raise SystemExit("Android updater fixture block did not match exactly")
android_test = android_test.replace(old_update_block, new_update_block, 1)
android_test = android_test.replace("assert.match(prepare,/ANDROID_VERSION='0\\.9\\.45'/);", "assert.match(prepare,/ANDROID_VERSION='0\\.9\\.46'/);", 1)
android_test = android_test.replace("assert.match(prepare,/ANDROID AUTO UPDATE/);", "assert.match(prepare,/ANDROID 0\\.9\\.46/);", 1)
android_trigger_assert = "  assert.match(workflow,/push:[\\s\\S]*branches:[\\s\\S]*- main[\\s\\S]*src-tauri\\/tauri\\.android\\.conf\\.json/);\n"
anchor = "  assert.match(workflow,/make_latest=false/);\n"
if anchor not in android_test:
    raise SystemExit("Android release trigger assertion anchor missing")
android_test = android_test.replace(anchor, anchor + android_trigger_assert, 1)
write("tests/android-app.test.js", android_test)

pwa_test = read("tests/pwa-update.test.js")
pwa_test = pwa_test.replace('"0.9.32"', f'"{WEB_VERSION}"', 1)
pwa_test = pwa_test.replace('"20260726-unified-settings-mobile-layout-v2"', f'"{CACHE_REVISION}"', 1)
pwa_test = pwa_test.replace(r'/window\.CircleMixChangelog\s*=\s*\[\s*\{ version: "0\.9\.32"/', r'/window\.CircleMixChangelog\s*=\s*\[\s*\{ version: "0\.9\.33"/', 1)
pwa_test = pwa_test.replace('/AIM FLOW & PULSE GUIDANCE/', '/ALL-PLATFORM UPDATE/', 1)
write("tests/pwa-update.test.js", pwa_test)

android_workflow = read(".github/workflows/android-release.yml")
old_trigger = '''on:
  workflow_dispatch:
'''
new_trigger = '''on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - src-tauri/tauri.android.conf.json
      - .github/workflows/android-release.yml
'''
if android_workflow.count(old_trigger) != 1:
    raise SystemExit("Android release workflow trigger block did not match")
write(".github/workflows/android-release.yml", android_workflow.replace(old_trigger, new_trigger, 1))

print(f"Prepared CIRCLE MIX Windows/Android {APP_VERSION} and Web/PWA {WEB_VERSION} release metadata.")
