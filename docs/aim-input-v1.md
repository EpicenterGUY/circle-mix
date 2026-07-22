# PC aim input v1

This change separates authoritative judgement aim from optional visual smoothing.

## Direct input

- `AIM STABILIZER: OFF` updates judgement aim directly from each pointer sample.
- Pointer coordinates are converted through the canvas CSS rectangle before calculating the angle.
- Coalesced pointer samples are processed in timestamp order.
- Sample intervals are clamped to a finite range so duplicate or non-monotonic timestamps cannot create infinite angular velocity.
- The only OFF-mode dead zone is a 1–2 pixel guard around the mathematical center singularity.

## LOW and MEDIUM stabilization

- LOW and MEDIUM now calculate their stabilized judgement target during the pointer event instead of waiting for the next animation frame.
- Their center guards are much smaller than before.
- Large-angle jumps and high-speed movement bypass magnetism and slow interpolation.
- Magnet release uses absolute velocity and symmetric moving-away checks for clockwise and counter-clockwise input.

## Visual aim

- `DIRECT` displays the authoritative judgement angle immediately.
- `SMOOTH` affects only the rendered arm.
- FAST, NORMAL and SOFT responses are faster, while sufficiently large visible errors snap to the judgement target rather than trailing behind.

## Isolation

- Touch input remains direct.
- AUTO and keyboard aim paths remain isolated from PC pointer stabilization.
- Note judgement, scoring, timing windows and chart data are not changed by this pass.

## Regression coverage

Tests cover immediate event-driven judgement, large-angle jumps, bounded timestamp handling, small center guards, symmetric magnet disengagement and visual catch-up.
