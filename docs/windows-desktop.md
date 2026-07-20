# Windows desktop development

CIRCLE MIX uses **Tauri v2** for the Windows desktop foundation. Windows 10/11 development requires Node, Rust stable, Microsoft C++ Build Tools with **Desktop development with C++**, and the WebView2 Runtime.

```powershell
npm ci
npm run desktop:dev # generates Tauri icons from src-tauri/app-icon.svg first
npm run desktop:build
```

`desktop:dev` and `desktop:build` generate ignored platform icons from the committed SVG before invoking Tauri.

The no-bundle test executable is written below `src-tauri/target/release/`. It is unsigned and is only a CI/development verification artifact, not an installer or portable release.

The first launch intentionally has an empty LOCAL library: copyrighted bundled songs are physically excluded. Use **IMPORT .CMIX** (or drag one into the app) to install a local package. Browser/PWA storage and the WebView2 IndexedDB store are separate. To reset desktop data, use Windows Settings > Apps > CIRCLE MIX > Advanced options, or clear the app's WebView2 data while debugging. Open DevTools only in a debug build to inspect console and IndexedDB issues.
