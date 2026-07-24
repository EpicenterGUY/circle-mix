# Mobile/PWA 0.9.31 test plan

## Target devices

- folded phone landscape around 844×390
- unfolded square landscape around 720×680
- unfolded square portrait around 680×720
- installed Android PWA and normal mobile browser tab

## Manual verification

1. Open title, song select, settings, and LOCAL/.cmix import in folded landscape.
2. Fold and unfold while staying on song select; confirm the shell, LOCAL tab, cards, footer, and PLAY remain reachable.
3. Start a chart, fold/unfold or reveal/hide the browser address bar, and confirm the canvas, HUD, PULSE/ACTION buttons, and pause button realign without page scroll.
4. While playing, install a waiting PWA update and confirm the button reads `UPDATE AFTER PLAY` and cannot interrupt the chart.
5. Return to a non-playing scene, apply the update, and confirm the app reloads once into web version 0.9.31.
6. Confirm LOCAL songs, linked audio, records, settings, and installed `.cmix` packages remain available.
