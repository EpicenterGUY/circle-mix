# Windows signed updater release

`0.9.34` is the one-time manual bootstrap installer. Later Windows releases can be discovered and installed inside CIRCLE MIX.

## Required GitHub Actions secrets

Repository **Settings → Secrets and variables → Actions**:

- `TAURI_SIGNING_PRIVATE_KEY`: the complete base64 value supplied in the private updater key backup
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: leave empty for the current unencrypted CI key

Never commit the private key, paste it into workflow YAML, upload it to an issue, or replace the public/private pair after users install `0.9.34`. Losing the matching private key prevents future installations from accepting updates.

## Release procedure

1. Bump the same SemVer in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and `scripts/prepare-desktop.js`.
2. Merge the version PR after normal CI and Windows installer verification pass.
3. Open **Actions → Windows updater release → Run workflow**.
4. Enter the committed version without a leading `v` and the release notes.
5. Create a draft first. Inspect these assets:
   - `circle-mix-<version>-windows-x64-setup.exe`
   - matching `.sig`
   - `latest.json`
6. Publish the draft release. Installed clients only see published releases through `/releases/latest/download/latest.json`.

The release workflow enables `createUpdaterArtifacts` only for signed releases. Pull-request and test installers keep it disabled so they do not require or access the private key.
