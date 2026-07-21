'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('src/cmix-import-ui.js', 'utf8');
const listeners = new Map();
const scheduled = [];
let liveButton = null;
let stableButton = null;
let fallbackClicks = 0;
let blockedStableClicks = 0;

function createAutoButton(on = false, label = 'AUTO PLAY') {
  let enabled = !!on;
  let ariaPressed = String(enabled);
  const stateLabel = { textContent: enabled ? 'ON' : 'OFF' };
  const button = {
    textContent: '',
    classList: {
      contains(name) { return name === 'on' && enabled; },
      toggle(name, next) { if(name === 'on') enabled = !!next; }
    },
    getAttribute(name) { return name === 'aria-pressed' ? ariaPressed : null; },
    setAttribute(name, value) { if(name === 'aria-pressed') ariaPressed = String(value); },
    querySelector(selector) { return selector === 'span' ? stateLabel : null; },
    closest(selector) { return selector === '[data-auto-play]' ? button : null; },
    setState(next) {
      enabled = !!next;
      ariaPressed = String(enabled);
      stateLabel.textContent = enabled ? 'ON' : 'OFF';
      button.textContent = `${label} ${enabled ? 'ON' : 'OFF'}`;
    },
    state() { return enabled; },
    stateLabel
  };
  button.setState(on);
  return button;
}

const document = {
  addEventListener(type, handler, capture) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push({ handler, capture: !!capture });
  },
  getElementById(id) {
    if (id === 'safeAuto') return stableButton;
    return null;
  },
  querySelector(selector) {
    return selector === '[data-auto-play]' ? liveButton : null;
  }
};

const window = {};
vm.runInNewContext(source, {
  window,
  document,
  setTimeout(fn) { scheduled.push(fn); return scheduled.length; },
  clearTimeout() {},
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
  console
});

const api = window.CircleMixCmixImportUi;
assert(api, 'cmix import UI API must be exported');
assert.strictEqual(api.installAutoToggleFallback(document), true, 'fallback must install once');
assert.strictEqual(api.installAutoToggleFallback(document), false, 'fallback must not install twice');

function reset(on = false) {
  liveButton = createAutoButton(on);
  stableButton = createAutoButton(on, 'AUTO');
  blockedStableClicks = 0;
  stableButton.click = () => {
    fallbackClicks += 1;
    if(blockedStableClicks > 0){ blockedStableClicks -= 1; return; }
    stableButton.setState(!stableButton.state());
  };
  fallbackClicks = 0;
}

function dispatch(type, target = liveButton) {
  for (const { handler } of listeners.get(type) || []) handler({ target });
}

function flushScheduled() {
  while (scheduled.length) scheduled.shift()();
}

// Windows/WebView2 regression: pointerup is delivered but the target binding and
// synthetic click are lost. Capture-phase verification must recover the toggle.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
flushScheduled();
assert.strictEqual(fallbackClicks, 1);
assert.strictEqual(stableButton.state(), true);
assert.strictEqual(liveButton.state(), true);
assert.strictEqual(liveButton.stateLabel.textContent, 'ON');

// A recent safeBind activation can suppress the first bridge click for 180 ms.
// The fallback must verify the stable state and retry once after the guard.
reset(false);
blockedStableClicks = 1;
dispatch('pointerdown');
dispatch('pointerup');
flushScheduled();
assert.strictEqual(fallbackClicks, 2);
assert.strictEqual(stableButton.state(), true);
assert.strictEqual(liveButton.state(), true);
assert.strictEqual(liveButton.stateLabel.textContent, 'ON');

// pointerup and click from one physical gesture must still produce one toggle.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
dispatch('click');
flushScheduled();
assert.strictEqual(fallbackClicks, 1);
assert.strictEqual(liveButton.state(), true);

// Normal production path: the target handler already changed both controls.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
liveButton.setState(true);
stableButton.setState(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
assert.strictEqual(liveButton.state(), true);

// The game state may change before the dynamic LOCAL button repaints. The stable
// control is authoritative; synchronize the LOCAL visual without toggling again.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
stableButton.setState(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
assert.strictEqual(liveButton.state(), true);
assert.strictEqual(liveButton.stateLabel.textContent, 'ON');

// Keyboard/accessibility activation has no pointerdown, so click starts its own
// verification gesture and still recovers if the target handler is absent.
reset(false);
dispatch('click');
flushScheduled();
assert.strictEqual(fallbackClicks, 1);
assert.strictEqual(liveButton.state(), true);

// Re-render path: a replacement button showing the changed state prevents a
// stale fallback from undoing the production toggle.
reset(false);
const oldButton = liveButton;
dispatch('pointerdown', oldButton);
dispatch('pointerup', oldButton);
stableButton.setState(true);
liveButton = createAutoButton(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
assert.strictEqual(liveButton.state(), true);

console.log('local auto toggle tests passed');
