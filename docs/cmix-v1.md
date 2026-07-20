# `.cmix` v1 package specification

Status: **v1 baseline**. This document defines the file contract and validation boundary only. Import UI, ZIP extraction, IndexedDB installation, library management, export, Electron integration, and Windows file association are separate changes.

## 1. Container and trust model

A `.cmix` file is a ZIP-compatible archive with the extension `.cmix`. Readers must treat every archive member as data. JavaScript, HTML, executables, dynamic modules, WebAssembly, and shell scripts are forbidden and must never be executed.

The root file is always `manifest.json`. Paths use `/`, are relative to the archive root, and may not contain absolute paths, backslashes, empty segments, `.` or `..` segments.

Only files declared by `manifest.json` are permitted:

```text
manifest.json
<audio, FULL only>
<optional jacket>
charts/<chart-id>.json
```

## 2. Package types

### FULL

A FULL package contains charts and an audio file. It is intended for original music, freely licensed music, or music whose redistribution has been authorized.

Required manifest field: `audio`.

### CHART

A CHART package contains charts and optional artwork but no audio. It is the default public distribution form when audio redistribution rights are not established.

Required manifest field: `audioMatch`. The installer asks the user to select a legally obtained local audio file. Duration is the baseline check; SHA-256, suggested filename, title, artist, and preview metadata may improve matching. A future importer may allow an explicit user override after warning when a non-hash match is used.

## 3. Identifiers and versions

Song and chart IDs use lowercase kebab-case:

```text
camellia-routing
lasses-extra
reverb
```

IDs are stable keys, not display labels. Renaming a song or difficulty does not change its ID.

- `formatVersion` describes the `.cmix` structural contract and is exactly `1` in this version.
- `packageVersion` is an integer beginning at `1` and increments when the same song package is updated.
- Each chart JSON also has `formatVersion: 1`.

A v1 reader rejects higher format versions instead of guessing. Compatible vendor metadata belongs under `extensions`; incompatible core changes require a new format version.

## 4. Manifest

Required core fields:

| Field | Rule |
|---|---|
| `format` | `circle-mix-song` |
| `formatVersion` | `1` |
| `packageType` | `full` or `chart` |
| `packageVersion` | integer `>= 1` |
| `id` | lowercase kebab-case, max 64 characters |
| `title` | 1–200 characters |
| `artist` | 1–200 characters |
| `bpm` | finite number, 20–1000 |
| `charts` | 1–32 descriptors |

Optional fields include `offset`, `jacket`, `preview`, `audioMatch`, and `extensions`. FULL requires `audio`. CHART forbids `audio` and requires `audioMatch`.

Every chart descriptor contains `id`, `name`, `level`, and `file`. The file path is canonical and must equal `charts/<id>.json`. `level` is a display difficulty from 1 to 20. `style`, when present, is an uppercase identifier such as `TECH`.

The normative machine-readable contract is `schemas/cmix-manifest-v1.schema.json`. The hand-written runtime validator also enforces duplicate IDs, canonical chart paths, safe paths, package type conditions, and extension rules.

## 5. Chart JSON

A chart file uses angle-based CIRCLE MIX notes only. Legacy lane numbers are not part of `.cmix` v1.

```json
{
  "format": "circle-mix-chart",
  "formatVersion": 1,
  "id": "reverb",
  "notes": [
    {"type": "cut", "beat": 0, "angle": 0}
  ]
}
```

Notes must be sorted by non-decreasing `beat`. Simultaneous notes are allowed. Angles are degrees in `[0, 360)`, with 0° at the top and positive movement clockwise.

Supported types:

```text
cut, fx,
slideCW, slideCCW,
trace, traceCW, traceCCW,
swingCW, swingCCW,
scratchCW, scratchCCW
```

`fx`, slides, traces, and scratches require `durationBeat > 0`. Slides and traces require `endAngle`. Traces additionally require a non-zero `signedSweepAngle`, which preserves direction and travel beyond one full turn. For example, `-450` means 450° counter-clockwise.

The normative chart schema is `schemas/cmix-chart-v1.schema.json`.

## 6. Supported media

Audio extensions:

```text
.ogg  .mp3  .wav
```

Image extensions:

```text
.webp  .png  .jpg  .jpeg
```

Extension validation is only the first layer. The import PR must also inspect file signatures and verify browser decoding before installation.

## 7. Size and archive limits

| Limit | v1 value |
|---|---:|
| Files per package | 64 |
| Charts per package | 32 |
| Notes per chart | 100,000 |
| `manifest.json` | 256 KiB |
| Each chart JSON | 8 MiB |
| Audio | 256 MiB |
| Jacket | 10 MiB |
| Total uncompressed data | 512 MiB |
| Per-entry compression ratio | 200:1 |

These are validation ceilings, not recommended targets. ZIP extraction must still enforce streaming or incremental limits before allocating the full declared output.

## 8. Duplicate and update policy

The library key is the song `id`; chart identity is `(song id, chart id)`.

- No installed song with the ID: install.
- Same ID and higher `packageVersion`: offer update.
- Same ID and equal/lower `packageVersion`: warn and offer cancel or explicit replacement.
- “Install as copy” must create a new song ID. It must not silently duplicate the same key.
- During update, matching chart IDs are replaced, new chart IDs are added, and removed chart IDs require explicit confirmation in the library PR.

The importer stores a SHA-256 hash of the original `.cmix` bytes as installation metadata. That hash is not trusted from inside the package.

## 9. Validator API

`src/cmix-validator.js` is dependency-free and works in Node and browsers:

```js
const validator = require("./src/cmix-validator.js");

validator.validateManifest(manifest);
validator.validateChart(chart, {descriptor, path: "/charts/reverb"});
validator.validatePackage({
  manifest,
  charts: {"charts/reverb.json": chart},
  entries: [
    {path: "manifest.json", uncompressedSize: 1200, compressedSize: 500},
    {path: "charts/reverb.json", uncompressedSize: 64000, compressedSize: 9000}
  ]
});
```

Every result has this shape:

```json
{
  "ok": false,
  "errors": [{"code": "MISSING_DECLARED_FILE", "path": "/manifest/audio", "message": "..."}],
  "warnings": []
}
```

The validator does not unzip files, read user storage, mutate the song list, decode media, or execute package content.
