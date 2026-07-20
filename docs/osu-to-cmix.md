# osu!standard to CIRCLE MIX draft CLI

Use locally only: `node scripts/osu-to-cmix.js input.osz --output converted`. The converter accepts osu!standard (`Mode: 0`) and produces a **CHART** package only. It makes no network requests, never copies audio/background assets into the package, and does not create FULL packages.

Audio is inspected only for `audioMatch` metadata. MP3 (including ID3-tagged and frame-chain VBR), OGG Vorbis, and RIFF/WAV are supported. Signatures, truncated containers/frames, and extension/signature mismatches are rejected. The report records type and duration, never an absolute audio path.

Beat zero is the first valid red timing point; objects before it are omitted with a warning because CIRCLE MIX validation does not allow negative beats. BPM changes are accumulated by timing segment. Slider span duration in beats is `pixelLength / (100 * SliderMultiplier * inheritedSV)`, multiplied by repeat count; absent inherited SV is 1.0.

Linear, Bezier, Catmull-Rom, and valid perfect-circle paths are sampled deterministically. Degenerate perfect circles fall back to Bezier. Repeating sliders require manual review: their terminal position follows odd=end/even=start traversal parity. Automated charts and provisional levels remain drafts; inspect warnings and manual-review timestamps, verify chart permissions, and separately clear audio/background rights.
