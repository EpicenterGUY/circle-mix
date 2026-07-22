# Windows installer v1

CIRCLE MIX desktop test builds use a Tauri NSIS installer.

## Output

The Windows desktop workflow uploads the `circle-mix-windows-installer-x64` artifact containing:

- `CIRCLE MIX_*_x64-setup.exe`: current-user NSIS installer
- `circle-mix.exe`: raw executable for debugging
- `README.txt`: unsigned-build warning and artifact notes

## Install behavior

- installs for the current Windows user
- does not request administrator privileges
- installs under the user's local application data area
- creates the standard Windows uninstall entry
- can be removed from Windows installed-app settings or through its uninstaller

The CI workflow performs a silent install with `/S`, verifies the uninstall registry entry and installed executable, and then silently uninstalls the application.

## Test-build limitations

- the installer and executable are not code signed, so Windows SmartScreen may show a warning
- automatic updates are not enabled
- this workflow validates installation and removal, but user-setting and local-library migration across app upgrades will be covered separately
- the desktop package intentionally excludes bundled copyrighted songs and charts
