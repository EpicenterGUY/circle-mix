# Mobile SLIDE and TRACE judgement v1

The SLIDE and TRACE judgement rules merged in PR #120 are shared by desktop and touch aim. This follow-up fixes the missing mobile ACTION hold route so those rules are usable on coarse-pointer devices.

## Mobile ACTION

- A held mobile ACTION button now remains part of the production SLIDE/HOLD input state across animation frames.
- Releasing the AIM finger does not release a separately held ACTION finger.
- Releasing ACTION recomputes the shared hold state so keyboard, AUTO or legacy SCRATCH sources are not cleared incorrectly.

## TRACE

- Touch aim already uses the direct shared judgement angle and directed-travel accumulator.
- No separate mobile TRACE tolerance is introduced; start, travel, reverse and endpoint rules remain identical across devices.

## Regression coverage

The mobile browser regression holds ACTION over multiple frames, moves and releases a second AIM pointer, verifies that the ACTION pointer and shared hold state remain active, and then checks clean ACTION release.
