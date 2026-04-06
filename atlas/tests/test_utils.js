/**
 * Unit tests for pure colour functions in atlas/src/js/colors.js.
 * Run with:  node atlas/tests/test_utils.js
 */

"use strict";
const assert = require("node:assert/strict");

// ── Inline the functions under test (no module system in the source) ──────────

function lerp(a, b, t) { return a + (b - a) * t; }

function viridis(v) {
  v = Math.max(0, Math.min(1, v));
  const s = [
    [68,1,84],[72,40,120],[62,83,160],[49,122,183],
    [38,157,199],[53,183,171],[109,204,117],[180,221,66],[253,231,37]
  ];
  const i = (s.length - 1) * v, lo = Math.floor(i),
        hi = Math.min(lo + 1, s.length - 1), f = i - lo;
  return `rgb(${Math.round(s[lo][0]+(s[hi][0]-s[lo][0])*f)},`
       + `${Math.round(s[lo][1]+(s[hi][1]-s[lo][1])*f)},`
       + `${Math.round(s[lo][2]+(s[hi][2]-s[lo][2])*f)})`;
}

function seqColor(v, r1, g1, b1, r2, g2, b2) {
  v = Math.max(0, Math.min(1, v));
  return `rgb(${Math.round(lerp(r1,r2,v))},${Math.round(lerp(g1,g2,v))},${Math.round(lerp(b1,b2,v))})`;
}

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

// ── lerp ─────────────────────────────────────────────────────────────────────

console.log("\nlerp");

test("lerp(0, 1, 0) === 0", () => assert.equal(lerp(0, 1, 0), 0));
test("lerp(0, 1, 1) === 1", () => assert.equal(lerp(0, 1, 1), 1));
test("lerp(0, 1, 0.5) === 0.5", () => assert.equal(lerp(0, 1, 0.5), 0.5));
test("lerp(0, 100, 0.25) === 25", () => assert.equal(lerp(0, 100, 0.25), 25));
test("lerp(10, 20, 0.3) === 13", () => assert.equal(lerp(10, 20, 0.3), 13));
test("lerp(a, b, t) is linear: lerp(0,10,0.7) + lerp(0,10,0.3) === 10",
  () => assert.ok(Math.abs(lerp(0,10,0.7) + lerp(0,10,0.3) - 10) < 1e-10));
test("lerp with negative range: lerp(10, 0, 0.5) === 5",
  () => assert.equal(lerp(10, 0, 0.5), 5));

// ── viridis ───────────────────────────────────────────────────────────────────

console.log("\nviridis");

test("viridis(0) === first stop rgb(68,1,84)", () =>
  assert.equal(viridis(0), "rgb(68,1,84)"));

test("viridis(1) === last stop rgb(253,231,37)", () =>
  assert.equal(viridis(1), "rgb(253,231,37)"));

test("viridis returns rgb(...) string format", () =>
  assert.match(viridis(0.5), /^rgb\(\d+,\d+,\d+\)$/));

test("viridis clamps below 0 to v=0", () =>
  assert.equal(viridis(-1), viridis(0)));

test("viridis clamps above 1 to v=1", () =>
  assert.equal(viridis(2), viridis(1)));

test("viridis(0.5) is between first and last stops (not an endpoint)", () => {
  const mid = viridis(0.5);
  assert.notEqual(mid, viridis(0));
  assert.notEqual(mid, viridis(1));
});

test("viridis values increase in brightness from 0→1 (r-channel)", () => {
  // Viridis goes dark→light; r-channel increases overall 68→253
  const r0 = parseInt(viridis(0).match(/\d+/)[0]);
  const r1 = parseInt(viridis(1).match(/\d+/)[0]);
  assert.ok(r1 > r0, `expected r(1)=${r1} > r(0)=${r0}`);
});

test("viridis(0.125) interpolates at segment boundary (1/8 = between stop 0 and 1)", () => {
  // v=0.125 → i=1.0 exactly → lo=1, hi=1, f=0 → stop[1] = rgb(72,40,120)
  assert.equal(viridis(0.125), "rgb(72,40,120)");
});

test("viridis(0.25) hits stop 2 exactly (2/8 = index 2)", () => {
  // v=0.25 → i=2.0 → stop[2] = rgb(62,83,160)
  assert.equal(viridis(0.25), "rgb(62,83,160)");
});

// ── seqColor ──────────────────────────────────────────────────────────────────

console.log("\nseqColor");

test("seqColor(0, ...) returns start colour", () =>
  assert.equal(seqColor(0, 255,0,0, 0,0,255), "rgb(255,0,0)"));

test("seqColor(1, ...) returns end colour", () =>
  assert.equal(seqColor(1, 255,0,0, 0,0,255), "rgb(0,0,255)"));

test("seqColor(0.5, ...) returns midpoint", () =>
  assert.equal(seqColor(0.5, 0,0,0, 100,200,50), "rgb(50,100,25)"));

test("seqColor clamps v < 0 to 0", () =>
  assert.equal(seqColor(-5, 255,0,0, 0,255,0), seqColor(0, 255,0,0, 0,255,0)));

test("seqColor clamps v > 1 to 1", () =>
  assert.equal(seqColor(99, 255,0,0, 0,255,0), seqColor(1, 255,0,0, 0,255,0)));

test("seqColor returns rgb(...) string format", () =>
  assert.match(seqColor(0.3, 10,20,30, 40,50,60), /^rgb\(\d+,\d+,\d+\)$/));

test("seqColor with identical start/end is constant across v", () => {
  assert.equal(seqColor(0, 128,128,128, 128,128,128),
               seqColor(1, 128,128,128, 128,128,128));
});

test("seqColor(0.75, white→black) ≈ rgb(64,64,64)", () =>
  assert.equal(seqColor(0.75, 255,255,255, 0,0,0), "rgb(64,64,64)"));

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
