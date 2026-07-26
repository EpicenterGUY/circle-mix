# CIRCLE MIX Android app

CIRCLE MIX Android v1 reuses the existing HTML/JavaScript game through Tauri 2 and adds a native Android shell for foldable viewport handling, immersive fullscreen, screen-on behavior, and system back navigation.

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

Install the 0.9.42 launch hotfix APK with ADB:

```bash
adb install -r circle-mix-0.9.42-android-arm64-debug.apk
```

A CI debug APK may use a different temporary debug certificate from an APK installed previously. If Android reports a signature conflict, uninstall the previous CIRCLE MIX debug app before installing the replacement.

## Foldable behavior

The web UI recalculates its visual viewport, safe areas, HUD, and mobile ACTION/PULSE layout after folding, rotation, fullscreen, and system-bar changes.

The native activity deliberately leaves screen orientation under Android and the user’s rotation settings. Forcing sensor landscape during activity startup is avoided because large-screen and foldable orientation policy differs by Android version and manufacturer, and a nonessential orientation request must never prevent the game from opening.

Both folded phone layouts and expanded inner-screen layouts remain responsive in portrait and landscape.

## Crash-safe native startup

Immersive system bars, display-cutout handling, keep-screen-on behavior, WebView options, and Android Back registration are treated as optional enhancements. Each native startup step is isolated and logged with `NATIVE_STARTUP_FAIL_OPEN`; a manufacturer-specific failure in one enhancement must not terminate the activity.

## Native controls

- System bars are hidden in immersive mode and can temporarily appear with an edge swipe when the device supports it.
- The display stays awake while CIRCLE MIX is open when the platform accepts the flag.
- Android Back closes the current layout editor, settings, result, pause, tutorial, or song-select layer before exiting.
- The app exits only when Back is pressed from the top-level title screen.

## Release signing

No Android keystore or password is committed to the repository. A future Google Play AAB release must use a persistent private upload key stored in GitHub Actions secrets, and the first Play Console upload should be reviewed manually.
