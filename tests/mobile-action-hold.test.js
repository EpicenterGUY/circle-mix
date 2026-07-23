'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/game.js', 'utf8');

assert.match(
  source,
  /function isActionHoldActive\(\)\{[\s\S]*mobileActionPointerId!==null[\s\S]*keys\.KeyZ[\s\S]*keys\.KeyX[\s\S]*keys\.Space;[\s\S]*\}/,
  'shared action-hold resolver includes the mobile ACTION pointer and desktop hold sources'
);
assert.ok(source.includes('filterHeld = isActionHoldActive();'), 'production frame refresh uses the shared hold resolver');
assert.ok(source.includes('mobileActionPointerId=e.pointerId; keys.MouseLeft=true; filterHeld=true;'), 'mobile ACTION press enters the sustained hold path immediately');
assert.ok(source.includes('mobileActionPointerId=null; filterHeld=isActionHoldActive();'), 'mobile ACTION release recomputes the remaining shared hold sources');
assert.ok(source.includes('holdInputActive:!!filterHeld'), 'browser diagnostics expose the production hold state');

console.log('PASS mobile ACTION shared hold regression');
