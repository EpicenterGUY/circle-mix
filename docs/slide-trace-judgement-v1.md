# SLIDE and TRACE judgement v1

This pass follows the PC aim-input rebuild and changes judgement only. Rendering, scoring values, chart data, touch routing and AUTO routing remain separate.

## SLIDE

- Uses the existing 13.5 degree dial arc plus a 4.5 degree extension, for an 18 degree total angular window.
- GREAT requires 52% sustained path coverage instead of 58%.
- PERFECT requires 84% sustained path coverage instead of 88%.
- The moving target still has to be followed while the hold input is active; this is not endpoint-only forgiveness.

## TRACE

- Start, travel, reverse-motion and endpoint tolerance values are unchanged.
- Endpoint capture only opens after GREAT-level directed travel and the minimum motion time are satisfied, so full-turn paths cannot capture their shared start/end angle immediately.
- The first eligible endpoint arrival is latched, and small aim movement after that arrival cannot erase it before evaluation.
- PERFECT still requires a 15-degree endpoint sample inside the authored timing window; arriving early and holding the endpoint remains valid.

## Regression coverage

Smoke tests verify the SLIDE profile and exercise TRACE endpoint capture, post-capture drift, best-error preservation, timing and uncaptured failure.
