# CIRCLE MIX PULSE v1

PULSE is a position-independent rhythm note intended to replace new SCRATCH charting without breaking legacy charts.

## Chart contract

```json
{"id":"pulse-1","type":"pulse","beat":16}
```

- `type` is exactly `pulse`.
- `beat` is required and must be finite and non-negative.
- `id` is optional under the existing chart rules.
- PULSE has no `angle`, `endAngle`, `durationBeat`, direction, or sweep.
- At most one PULSE may exist at the same timestamp.
- PULSE may share a timestamp with an aimed note such as CUT, FX, SLIDE, TRACE, or SWING.

## Input

- PC: tap either Left Shift or Right Shift.
- Holding Shift cannot repeatedly trigger PULSE.
- Both Shift keys share one release gate. Pressing the other Shift while one is held does not create another input.
- Every accepted PULSE requires all Shift keys to be released before the next accepted input.
- Window blur, pause, restart, and scene change reset held input safely.
- AUTO activates PULSE at its hit time through the same judgement path.

## Mobile

- Use one large PULSE touch button positioned away from the aim field.
- Touch down creates one input; holding the button does not repeat.
- The button must remain reachable in folded landscape and unfolded square layouts.

## Visual language

- A ring begins near the centre and expands toward the judgement circle.
- The hit moment is when the expanding ring matches the judgement circle.
- The effect must remain visible behind aimed notes without obscuring their targets or TRACE paths.
- PERFECT/GREAT/MISS use the normal judgement system and scoring rules.

## Difficulty and charting

- Early charts use isolated PULSE notes or alternate PULSE and aimed notes.
- Mid-level charts may combine one PULSE with one aimed note.
- High-level charts may require PULSE rhythm while following SLIDE or TRACE.
- PULSE density must be scored separately from cursor travel so simultaneous hand separation is represented without double-counting aim.

## SCRATCH compatibility

- `scratchCW` and `scratchCCW` remain valid during the PULSE transition.
- Existing `.cmix` packages must continue to import and play unchanged.
- New official charts stop adding SCRATCH only after playable PULSE support and tutorial coverage ship.
- A later migration pass may convert suitable SCRATCH notes to PULSE, TRACE, or SWING; conversion must never happen silently during import until its mapping is tested.
