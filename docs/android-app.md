# CIRCLE MIX Android app

CIRCLE MIX Android v1 reuses the existing HTML/JavaScript game through Tauri 2 and adds a native Android shell for foldable viewport handling, automatic landscape play, immersive fullscreen, screen-on behavior, and system back navigation.

## Distribution policy

- The APK does not bundle copyrighted songs, beatmaps, `.cmix` packages, or the web service worker cache.
- Players import locally obtained `.cmix` packages into the existing LOCAL SONGS library.
- Gameplay settings, ACTION/PULSE layout settings, records, and local library data remain inside the app WebView storage.
- ORBIT remains an experimental mode.

## Requirements

Install the current Tauri Android prerequisites: Rust, Node.js, Java 17, Android SDK platform 36, build tools 36.0.0, and Android NDK 27. The app supports Android SDK 24 and later.

## First local setup

```bash
npm ci
cargo install tauri-cli --version "^2.10.1" --locked
rustup target add aarch64-linux-android
npm run android:init
```

`android:init` creates `src-tauri/gen/android`, applies the CIRCLE MIX native patch, and audits the generated project. Generated Android and Gradle files are intentionally ignored by Git.

## Development and APK builds

```bash
npm run android:dev
npm run android:build:apk
```

The GitHub workflow builds an ARM64 debug APK, aligns it with `zipalign`, signs it with an ephemeral debug certificate, and rejects the artifact unless `apksigner verify` succeeds. Only the verified signed APK is published in the `circle-mix-android-arm64-debug` workflow artifact.

Install the 0.9.44 signed landscape hotfix APK with ADB:

```bash
adb install -r circle-mix-0.9.44-android-arm64-debug-signed.apk
```

The ephemeral CI debug certificate can differ between workflow runs. If Android reports an update-incompatible signature, uninstall the previous CIRCLE MIX debug app before installing the replacement. Uninstalling clears app-local settings and imported LOCAL data unless backed up first.

## Foldable and orientation behavior

The activity manifest requests `sensorLandscape`, so CIRCLE MIX automatically enters either landscape direction on both the folded outer display and the expanded inner display. Android can choose the landscape side that matches the device sensor.

The app remains categorized as a game through `android:appCategory="game"`. This preserves game-specific orientation behavior on Android large-screen devices while the web UI still adapts to the actual available window.

The web UI recalculates its visual viewport, safe areas, HUD, and mobile ACTION/PULSE layout after folding, rotation, fullscreen, and system-bar changes.

## Crash-safe native startup

The app does not call `requestedOrientation` from the activity startup path. Immersive system bars, display-cutout handling, keep-screen-on behavior, WebView options, and Android Back registration are treated as optional enhancements. Each native startup step is isolated and logged with `NATIVE_STARTUP_FAIL_OPEN`; a manufacturer-specific failure in one enhancement must not terminate the activity.

## Native controls

- System bars are hidden in immersive mode and can temporarily appear with an edge swipe when the device supports it.
- The display stays awake while CIRCLE MIX is open when the platform accepts the flag.
- Android Back closes the current layout editor, settings, result, pause, tutorial, or song-select layer before exiting.
- The app exits only when Back is pressed from the top-level title screen.

## Release signing

The CI debug APK uses a temporary test certificate and is intended only for direct device testing. No persistent Android keystore or password is committed to the repository. A future Google Play AAB release must use a persistent private upload key stored in GitHub Actions secrets, and the first Play Console upload should be reviewed manually.
