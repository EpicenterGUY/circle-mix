# osu!standard to CIRCLE MIX draft CLI

Use locally only: `node scripts/osu-to-cmix.js input.osz --output converted` (or pass an extracted directory). The converter reads `[General]`, `[Metadata]`, `[Difficulty]`, `[Events]`, `[TimingPoints]`, and `[HitObjects]`; it accepts only `Mode: 0` and creates a **CHART** package through the existing exporter. It never copies audio/background assets, makes network requests, or creates FULL packages.

Input ZIP reading is separate from `.cmix` import and rejects traversal, absolute/NUL/backslash paths, symlinks, unsupported compression, excessive entries/size, and high declared compression ratios. Only `.osu` text and the named audio bytes needed for local WAV duration/hash metadata are read.

Circles become `cut`. Short moving sliders become directional slides; longer/repeating sliders become traces based on sampled polar angular travel; stationary sliders become `fx` with a warning. Spinners default to `scratchCW` and can be `trace` or `skip`. Angle 0° is right and positive direction is clockwise (screen coordinates), preserving osu playfield direction; center objects reuse the preceding angle. BPM changes use timing segments and are reported for manual review. A 10-chart set remains one package; the report lists lower-five and upper-five groups.

The CLI currently requires a readable local WAV named by `AudioFilename`, solely to populate the required `audioMatch.durationSeconds`; it does not write it. Automated charts are drafts: inspect all warnings/manual-review sections, confirm creator/license permission for chart data, and separately clear audio and background-image rights. Put real beatmaps only in ignored `.local-beatmaps/`, `tmp/osu-convert/`, or `out/cmix/` locations.
