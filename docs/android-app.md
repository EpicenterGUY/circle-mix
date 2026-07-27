# CIRCLE MIX Android app

CIRCLE MIX Android reuses the HTML/JavaScript game through Tauri 2 and adds a native Android shell for foldable viewport handling, automatic landscape play, immersive fullscreen, system Back navigation, and signed in-app updates.

## Distribution policy

- The APK does not bundle copyrighted songs, beatmaps, `.cmix` packages, or the web service worker cache.
- Players import locally obtained `.cmix` packages into the existing LOCAL SONGS library.
- Gameplay settings, ACTION/PULSE layout settings, records, and local library data remain inside the app WebView storage.
- ORBIT remains an experimental mode.

## Requirements

Install Rust, Node.js, Java 17, Android SDK platform 36, build tools 36.0.0, and Android NDK 27. The app supports Android SDK 24 and later.

## First local setup

```bash
npm ci
cargo install tauri-cli --version "^2.10.1" --locked
rustup target add aarch64-linux-android
npm run android:init
```

`android:init` creates `src-tauri/gen/android`, applies the CIRCLE MIX native patch, and audits the generated project. Generated Android and Gradle files are intentionally ignored by Git.

## Development and verification APKs

```bash
npm run android:dev
npm run android:build:apk
```

The `Android app verification` workflow builds an ARM64 debug APK, aligns it, signs it with an ephemeral test certificate, and verifies it with `apksigner`. These workflow artifacts are for device testing only and are not part of the auto-update channel.

## Production signing setup

Android updates only work when every production APK is signed with the same persistent key. Create one Android keystore offline, keep a secure backup, and configure the `android-release` GitHub environment with these repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The keystore file is Base64-encoded only for transport into the secret field; Base64 is not encryption by itself. The actual value must remain protected by GitHub Actions Secrets and must never be committed.

The `Publish Android release` workflow runs manually from `main`. It builds the release APK, signs it with the persistent secret key, verifies package identity and APK Signature Scheme v2, and publishes:

```text
android-v<version>
circle-mix-<version>-android-arm64-release.apk
sha256.txt
```

Android releases are created with `make_latest=false` so they do not replace the Windows updater's `releases/latest/download/latest.json` channel.

## In-app Android update flow

1. The app checks recent GitHub Releases shortly after launch or when **시스템 → Android 앱 업데이트** is pressed.
2. Only stable `android-vX.Y.Z` releases with the exact ARM64 APK name are accepted.
3. The expected SHA-256 value comes from the GitHub release asset digest.
4. Android `DownloadManager` downloads the APK into app-owned storage.
5. The native bridge calculates SHA-256 and rejects a mismatch.
6. `PackageInstaller.Session` stages the verified APK.
7. Android shows its required user confirmation screen; the app cannot silently bypass it.

On Android 8 and later, the user may need to enable **이 출처의 앱 설치 허용** once for CIRCLE MIX. The app opens the correct system settings page when permission is missing.

### First migration from 0.9.44

The 0.9.44 test APK was signed with an ephemeral CI certificate. The first persistent-signed production APK may therefore require uninstalling the old test app before installation. Uninstalling can remove app-local settings and imported LOCAL songs, so export or back up important data first. Every later production release uses the same persistent key and can update in place while preserving app data.

## Foldable and orientation behavior

The activity manifest requests `sensorLandscape`, so CIRCLE MIX automatically enters either landscape direction on both the folded outer display and the expanded inner display. The app remains categorized as a game through `android:appCategory="game"`.

The web UI recalculates its viewport, safe areas, HUD, settings sheet, and ACTION/PULSE layout after folding, rotation, fullscreen, and system-bar changes.

## Crash-safe native startup

The app does not call `requestedOrientation` from the activity startup path. Immersive system bars, cutout handling, keep-screen-on behavior, WebView options, update receivers, and Android Back registration are isolated behind `NATIVE_STARTUP_FAIL_OPEN`; a device-specific failure in one enhancement must not terminate the activity.
