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
let shortcutToggles = 0;

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

class FakeKeyboardEvent {
  constructor(type, init={}) { this.type=type; Object.assign(this,init); }
}

const window = {
  KeyboardEvent: FakeKeyboardEvent,
  dispatchEvent(event) {
    if(event?.type==='keydown' && event.code==='KeyO' && !event.repeat){
      shortcutToggles += 1;
      liveButton?.setState(!liveButton.state());
      return true;
    }
    return false;
  }
};

const document = {
  defaultView: window,
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

function reset(on = false, {stable=true}={}) {
  liveButton = createAutoButton(on);
  stableButton = stable ? createAutoButton(on, 'AUTO') : null;
  blockedStableClicks = 0;
  shortcutToggles = 0;
  if(stableButton){
    stableButton.click = () => {
      fallbackClicks += 1;
      if(blockedStableClicks > 0){ blockedStableClicks -= 1; return; }
      stableButton.setState(!stableButton.state());
    };
  }
  fallbackClicks = 0;
}

function dispatch(type, target = liveButton) {
  for (const { handler } of listeners.get(type) || []) handler({ target });
}

function flushScheduled() {
  while (scheduled.length) scheduled.shift()();
}

// Actual current DOM: the LOCAL AUTO button exists but neither safeAuto nor
// autoToggle exists. Recover through the production KeyO handler.
reset(false,{stable:false});
dispatch('pointerdown');
dispatch('pointerup');
flushScheduled();
assert.strictEqual(shortcutToggles, 1);
assert.strictEqual(liveButton.state(), true);
assert.strictEqual(liveButton.stateLabel.textContent, 'ON');

// pointerup and click from one physical gesture must still produce one toggle.
reset(false,{stable:false});
dispatch('pointerdown');
dispatch('pointerup');
dispatch('click');
flushScheduled();
assert.strictEqual(shortcutToggles, 1);
assert.strictEqual(liveButton.state(), true);

// Normal production path changes the dynamic button before verification. The
// bridge must remain idle even when there is no stable AUTO control.
reset(false,{stable:false});
dispatch('pointerdown');
dispatch('pointerup');
liveButton.setState(true);
flushScheduled();
assert.strictEqual(shortcutToggles, 0);
assert.strictEqual(liveButton.state(), true);

// Keyboard/accessibility activation has no pointerdown, so click starts its own
// verification gesture and still recovers if the target handler is absent.
reset(false,{stable:false});
dispatch('click');
flushScheduled();
assert.strictEqual(shortcutToggles, 1);
assert.strictEqual(liveButton.state(), true);

// Legacy/future DOM safety: when a stable AUTO control exists, use it and keep
// the LOCAL visual synchronized.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
flushScheduled();
assert.strictEqual(fallbackClicks, 1);
assert.strictEqual(stableButton.state(), true);
assert.strictEqual(liveButton.state(), true);

// A recent safeBind activation can suppress the first stable bridge click for
// 180 ms. Verify and retry once after the guard.
reset(false);
blockedStableClicks = 1;
dispatch('pointerdown');
dispatch('pointerup');
flushScheduled();
assert.strictEqual(fallbackClicks, 2);
assert.strictEqual(stableButton.state(), true);
assert.strictEqual(liveButton.state(), true);

// The stable game state may change before the LOCAL button repaints.
reset(false);
dispatch('pointerdown');
dispatch('pointerup');
stableButton.setState(true);
flushScheduled();
assert.strictEqual(fallbackClicks, 0);
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
