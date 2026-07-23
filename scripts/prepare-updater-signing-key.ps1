$ErrorActionPreference = 'Stop'

$secret = [string]$env:TAURI_SIGNING_PRIVATE_KEY
if ([string]::IsNullOrWhiteSpace($secret)) {
  throw 'TAURI_SIGNING_PRIVATE_KEY GitHub Actions secret is missing.'
}

$normalized = $secret.Trim().TrimStart([char]0xFEFF)
if ($normalized.Length -ge 2) {
  $first = $normalized[0]
  $last = $normalized[$normalized.Length - 1]
  if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
    $normalized = $normalized.Substring(1, $normalized.Length - 2).Trim().TrimStart([char]0xFEFF)
  }
}

if ($normalized -match '^untrusted comment:\s+rsign\s+(encrypted\s+)?secret key') {
  $rawKey = $normalized.TrimEnd() + "`n"
  $normalized = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($rawKey))
} else {
  $normalized = $normalized -replace '\s', ''
}

try {
  $decodedBytes = [Convert]::FromBase64String($normalized)
} catch {
  throw 'TAURI_SIGNING_PRIVATE_KEY must contain the complete base64 updater private key backup.'
}

$decoded = [Text.Encoding]::UTF8.GetString($decodedBytes).TrimStart([char]0xFEFF)
if ($decoded -notmatch '^untrusted comment:\s+rsign\s+(encrypted\s+)?secret key') {
  throw 'TAURI_SIGNING_PRIVATE_KEY does not decode to a Tauri updater private key.'
}

$keyPath = Join-Path $env:RUNNER_TEMP 'circle-mix-updater.key'
[IO.File]::WriteAllText($keyPath, $normalized, [Text.UTF8Encoding]::new($false))
"TAURI_SIGNING_PRIVATE_KEY_PATH=$keyPath" >> $env:GITHUB_ENV

$keyKind = if ($decoded -match '^untrusted comment:\s+rsign\s+encrypted\s+secret key') { 'encrypted' } else { 'unencrypted' }
Write-Host "Prepared $keyKind updater signing key at a runner-temporary path."
