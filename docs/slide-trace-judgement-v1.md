# SLIDE and TRACE judgement v1

This pass follows the PC aim-input rebuild and changes judgement only. Rendering, scoring values, chart data, touch routing and AUTO routing remain separate.

## SLIDE

- Uses the existing 13.5 degree dial arc plus a 4.5 degree extension, for an 18 degree total angular window.
- GREAT requires 52% sustained path coverage instead of 58%.
- PERFECT requires 84% sustained path coverage instead of 88%.
- The moving target still has to be followed while the hold input is active; this is not endpoint-only forgiveness.

## TRACE

- Start, travel, reverse-motion and endpoint tolerance values are unchanged.
- The first valid endpoint arrival is latched.
- Small aim movement after that arrival cannot erase a valid endpoint capture before evaluation.
- PERFECT still requires a best endpoint error within 15 degrees and an endpoint arrival within the authored timing window.

## Regression coverage

Smoke tests verify the SLIDE profile and exercise TRACE endpoint capture, post-capture drift, best-error preservation, timing and uncaptured failure.
