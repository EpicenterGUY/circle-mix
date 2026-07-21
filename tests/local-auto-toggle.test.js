'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('src/cmix-import-ui.js', 'utf8');
const listeners = new Map();
const scheduled = [];
let liveButton = null;
let fallbackClicks = 0;

const document = {
  addEventListener(type, handler, capture) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push({ handler, capture: !!capture });
  },
  getElementById(id) {
    if (id === 'safeAuto') {
      return {
        click() {
          fallbackClicks += 1;
          liveButton?.setState(!liveButton.state());
        }
      };
    }
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

function createAutoButton(on = false) {
  let enabled = !!on;
  const button = {
    textContent: '',
    classList: { contains(name) { return name === 'on' && enabled; } },
    getAttribute(name) { return name === 'aria-pressed' ? String(enabled) : null; },
    closest(selector) { return selector === '[data-auto-play]' ? button : null; },
    setState(next) {
      enabled = !!next;
      button.textContent = `AUTO PLAY ${enabled ? 'ON' : 'OFF'}`;
    },
    state() { return enabled; }
  };
  button.setState(on);
  return button;
}

function dispatch(type, target) {
  for (const { handler } of listeners.get(type) || []) handler({ target });
}

function flushScheduled() {
  while (scheduled.length) scheduled.shift()();
}

// Regression: the dynamically rendered LOCAL button received a click but its
// original binding did not change state. The bridge must toggle through the
// stable safeAuto control exactly once.
liveButton = createAutoButton(false);
fallbackClicks = 0;
dispatch('pointerdown', liveButton);
dispatch('click', liveButton);
flushScheduled();
assert.strictEqual(fallbackClicks, 1);
assert.strictEqual(liveButton.state(), true);

// Normal path: when the original song-select handler already changed the state,
// the bridge must remain idle and avoid a double toggle.
liveButton = createAutoButton(false);
fallbackClicks = 0;
dispatch('pointerdown', liveButton);
dispatch('click', liveButton);
liveButton.setState(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
assert.strictEqual(liveButton.state(), true);

// Re-render path: renderSongSelect may replace the clicked node. The current
// live AUTO button state is authoritative and must prevent a stale fallback.
const oldButton = createAutoButton(false);
liveButton = oldButton;
fallbackClicks = 0;
dispatch('pointerdown', oldButton);
dispatch('click', oldButton);
liveButton = createAutoButton(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
assert.strictEqual(liveButton.state(), true);

console.log('local auto toggle tests passed');
