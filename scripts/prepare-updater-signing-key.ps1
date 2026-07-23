$ErrorActionPreference = 'Stop'

$secret = [string]$env:TAURI_SIGNING_PRIVATE_KEY
if ([string]::IsNullOrWhiteSpace($secret)) {
  throw 'TAURI_SIGNING_PRIVATE_KEY GitHub Actions secret is missing.'
}

function Remove-OuterQuotes([string]$value) {
  $value = $value.Trim().TrimStart([char]0xFEFF)
  if ($value.Length -ge 2) {
    $first = $value[0]
    $last = $value[$value.Length - 1]
    if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
      return $value.Substring(1, $value.Length - 2).Trim().TrimStart([char]0xFEFF)
    }
  }
  return $value
}

$normalized = Remove-OuterQuotes $secret
$assignment = [regex]::Match($normalized, '^(?:\$env:)?TAURI_SIGNING_PRIVATE_KEY\s*=\s*(.+)$', [Text.RegularExpressions.RegexOptions]::Singleline)
if ($assignment.Success) {
  $normalized = Remove-OuterQuotes $assignment.Groups[1].Value
}

if ($normalized -match '\\(?:r\\n|n)') {
  $expanded = $normalized -replace '\\r\\n', "`r`n" -replace '\\n', "`n"
  if ($expanded.TrimStart().StartsWith('untrusted comment:', [StringComparison]::OrdinalIgnoreCase)) {
    $normalized = $expanded.Trim().TrimStart([char]0xFEFF)
  }
}

if ([IO.Path]::IsPathRooted($normalized) -and $normalized -notmatch "[`r`n]") {
  throw 'TAURI_SIGNING_PRIVATE_KEY contains a local file path. GitHub Actions needs the key file contents, not a path from another computer.'
}

$privateHeader = '^untrusted comment:\s+(?:rsign|minisign)\s+(?:encrypted\s+)?secret key'
$publicHeader = '^untrusted comment:\s+minisign\s+public key'
$keyKind = 'opaque key content'

if ($normalized -match $publicHeader) {
  throw 'TAURI_SIGNING_PRIVATE_KEY contains the public updater key. Save the matching private .key file contents instead.'
}

if ($normalized -match $privateHeader) {
  $rawKey = $normalized.TrimEnd() + "`n"
  $keyMaterial = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($rawKey))
  $keyKind = if ($normalized -match '^untrusted comment:\s+(?:rsign|minisign)\s+encrypted\s+secret key') { 'raw encrypted private key' } else { 'raw unencrypted private key' }
} else {
  $compact = $normalized -replace '\s', ''
  $keyMaterial = $compact
  $decoded = $null
  try {
    $decodedBytes = [Convert]::FromBase64String($compact)
    $decoded = [Text.Encoding]::UTF8.GetString($decodedBytes).TrimStart([char]0xFEFF)
  } catch {
    # Tauri officially accepts private-key content as well as the generated base64 backup.
    # Preserve other opaque content and let the signer preflight provide the authoritative validation error.
    $keyMaterial = $normalized
  }

  if ($null -ne $decoded) {
    if ($decoded -match $publicHeader) {
      throw 'TAURI_SIGNING_PRIVATE_KEY contains the base64 public updater key. Save the matching private .key file contents instead.'
    }
    if ($decoded -match $privateHeader) {
      $keyKind = if ($decoded -match '^untrusted comment:\s+(?:rsign|minisign)\s+encrypted\s+secret key') { 'base64 encrypted private key' } else { 'base64 unencrypted private key' }
    } else {
      $keyKind = 'base64 key content'
    }
  }
}

$keyPath = Join-Path $env:RUNNER_TEMP 'circle-mix-updater.key'
[IO.File]::WriteAllText($keyPath, $keyMaterial, [Text.UTF8Encoding]::new($false))
"TAURI_SIGNING_PRIVATE_KEY_PATH=$keyPath" >> $env:GITHUB_ENV

Write-Host "Prepared $keyKind at a runner-temporary path; Tauri signer preflight will validate it."
