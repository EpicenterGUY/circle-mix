// UI module boundary for CIRCLE MIX.
// Menu, overlay, tuner, editor-panel, fullscreen, and HUD update routines are
// imported by src/game.js and kept in this file as the target home for UI code.
// The current stable implementation remains orchestrated from game.js to avoid
// behavior changes during this structure-only refactor.

// Keep the primary title action's hit box stationary. The visual pressStart
// animation used a transform on every frame, which prevents real browser input
// automation from ever observing the button as stable after closing SELF TEST.
const safeStartButton = document.getElementById("safeStart");
if (safeStartButton) safeStartButton.style.animation = "none";
