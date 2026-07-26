# CIRCLE MIX Android app

CIRCLE MIX Android v1 reuses the existing HTML/JavaScript game through Tauri 2 and adds a native Android shell for foldable orientation, immersive fullscreen, screen-on behavior, and system back navigation.

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

The GitHub workflow builds an installable ARM64 debug APK and publishes it as the `circle-mix-android-arm64-debug` workflow artifact. A debug APK is intended for direct testing and sideloading; it is not the final Google Play release package.

Install a downloaded APK with ADB:

```bash
adb install -r circle-mix-0.9.41-android-arm64-debug.apk
```

## Foldable behavior

The native activity watches Android configuration changes. A wide internal display requests sensor-based landscape when one of these conditions is met:

- `smallestScreenWidthDp >= 600`, or
- longest side is at least 720 dp and shortest side is at least 480 dp.

A folded phone-sized display returns orientation control to the device. The web UI also recalculates its visual viewport, safe areas, HUD, and mobile ACTION/PULSE layout after folding, rotation, and system-bar changes.

Android can override requested orientation on some large-screen configurations, so both portrait and landscape layouts remain supported.

## Native controls

- System bars are hidden in immersive mode and can temporarily appear with an edge swipe.
- The display stays awake while CIRCLE MIX is open.
- Android Back closes the current layout editor, settings, result, pause, tutorial, or song-select layer before exiting.
- The app exits only when Back is pressed from the top-level title screen.

## Release signing

No Android keystore or password is committed to the repository. A future Google Play AAB release must use a persistent private upload key stored in GitHub Actions secrets, and the first Play Console upload should be reviewed manually.
