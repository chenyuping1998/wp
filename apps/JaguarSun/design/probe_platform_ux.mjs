// Verify the platform-UX conventions HotMiami opted into (game/uiTheme.ts →
// uiTheme.platformUx), in a real, focused Chrome.
//
// It has to be a real Chrome. The browser-pane MCP tab does not run the Pixi
// ticker and does not reliably deliver input to the canvas — a spacebar
// dispatched there produced no spin at all, on both this build AND the shipped
// one, which is a property of the pane rather than of either build. Everything
// below is measured the way probe_motion.mjs measures: CDP input into a window
// that has been given focus emulation, with __HM_REELS__ read as the ground
// truth for "a round started".
//
// Usage:
//   node design/probe_platform_ux.mjs <playtest-url>
//
// The URL must carry the playtest query string or the stub never intercepts:
//   http://localhost:4190/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en
import { spawn } from 'child_process';

const URL_ = process.argv[2];
const PORT = 9334;
const PROFILE = '/tmp/hm-cdp-ux-profile';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--window-size=900,620', URL_,
], { stdio: 'ignore', detached: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = async () => (await fetch(`http://127.0.0.1:${PORT}/json`)).json();

let list = [];
for (let i = 0; i < 40; i++) {
  try { list = (await targets()).filter((t) => t.type === 'page' && t.url.includes('localhost')); if (list.length) break; } catch {}
  await sleep(500);
}
if (!list.length) { console.error('no page target'); process.exit(1); }

const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
const click = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    await sleep(40);
  }
};
// modifiers bitmask: 8 = shift
const key = async (text, code, vk, modifiers = 0, downOnly = false) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: text, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
  if (downOnly) return;
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: text, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
};
const space = () => key(' ', 'Space', 32);
const shiftKeyPress = (text, code, vk) => key(text, code, vk, 8);

await send('Runtime.enable');
await send('Page.enable');
await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });

// UX=off reruns the whole table with the conventions disabled, through the
// same runtime kill switch a deployed build has. It is the control: a probe
// that cannot tell the feature's absence from its presence is not measuring it,
// and the cooldown check in particular is a NEGATIVE — "no round started" is
// exactly what a blind probe reports too. With UX=off the cooldown check is
// expected to FAIL, and that failure is the proof the probe can see the target.
const CONTROL = process.env.UX === 'off';
if (CONTROL) {
  await evaluate(`localStorage.setItem('platformUx','off')`);
  await send('Page.reload');
  await sleep(1500);
} else {
  await evaluate(`localStorage.removeItem('platformUx')`);
  await send('Page.reload');
  await sleep(1500);
}
console.log(CONTROL ? '── control run: platformUx OFF ──' : '── platformUx ON ──');

// Press-anywhere gates, plural — loading screen then the feature intro card.
for (const wait of [4000, 2500, 2500, 2000]) { await sleep(wait); await click(450, 400); }
await sleep(1200);

const moving = () => evaluate(`window.__HM_REELS__().some(r => r.motion !== 'stopped')`);
const isTurbo = () => evaluate(`window.__HM_GAME__().isTurbo`);
const modalName = () => evaluate(`(document.querySelector('.pop-up-wrap')||{}).innerText ? document.querySelector('.pop-up-wrap').innerText.split('\\n').find(Boolean) : null`);

// Waits for a round to start, then for it to finish. Returns how long the start
// took, or null if no round started inside `limit`.
const waitStart = async (limit) => {
  const t0 = Date.now();
  while (Date.now() - t0 < limit) { if (await moving()) return Date.now() - t0; await sleep(25); }
  return null;
};
const waitIdle = async (limit = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < limit) { if (!(await moving())) { await sleep(400); if (!(await moving())) return true; } await sleep(50); }
  return false;
};

const results = [];
const check = (name, pass, detail) => { results.push({ name, pass, detail }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + '  —  ' + detail); };

await waitIdle(15000);

// ── control: a plain spacebar places a bet ──────────────────────────────────
await space();
let started = await waitStart(3000);
check('spacebar places a bet', started !== null, started === null ? 'no round started in 3s' : `round started after ${started}ms`);
await waitIdle();

// ── the 500ms stake-change cooldown ─────────────────────────────────────────
// Hacksaw's `now - _lastBetChange < 500` guard: a press landing in the same
// gesture as a stake change must not bet an amount the player has not read.
//
// Measured as "was the press DISCARDED", not as "did the round start late".
// A round takes ~380ms to show motion even when nothing blocks it, so any
// window short enough to sit inside the 500ms cooldown is also short enough to
// miss an accepted bet — the first version of this waited 350ms and passed
// identically on the UX=off control, which is to say it measured nothing. The
// guard drops the press outright, so the honest test is a long wait: no round
// at all inside 1.5s means it was refused.
await shiftKeyPress('ArrowUp', 'ArrowUp', 38);
await sleep(80);
await space();
const insideWindow = await waitStart(1500);
check('a bet pressed inside the 500ms cooldown is discarded', insideWindow === null,
  insideWindow === null ? 'no round started in 1.5s' : `round started after ${insideWindow}ms — the guard did not hold`);
await waitIdle();
await space();
const afterWindow = await waitStart(3000);
check('a bet pressed after the cooldown is accepted', afterWindow !== null,
  afterWindow === null ? 'still refused — the guard never releases' : `round started after ${afterWindow}ms`);
await waitIdle();
// put the stake back
await shiftKeyPress('ArrowDown', 'ArrowDown', 40);
await sleep(600);

// ── the shortcut table ──────────────────────────────────────────────────────
const t0 = await isTurbo();
await shiftKeyPress('T', 'KeyT', 84);
await sleep(200);
const t1 = await isTurbo();
check('Shift+T toggles turbo', t1 !== t0, `${t0} → ${t1}`);

await key('t', 'KeyT', 84);            // bare t, no shift
await sleep(200);
const t2 = await isTurbo();
check('a bare letter key does nothing', t2 === t1, `still ${t2} — shortcuts stay behind Shift`);

// two inside the 100ms throttle window must land as ONE toggle
await shiftKeyPress('T', 'KeyT', 84);
await shiftKeyPress('T', 'KeyT', 84);
await sleep(250);
const t3 = await isTurbo();
check('the 100ms throttle swallows the second press', t3 !== t2, `${t2} → ${t3} (one toggle, not two)`);
if (t3 !== t0) { await sleep(200); await shiftKeyPress('T', 'KeyT', 84); await sleep(200); }

await shiftKeyPress('I', 'KeyI', 73);
await sleep(500);
const rules = await modalName();
check('Shift+I opens the rules', !!rules, rules || 'nothing opened');
await shiftKeyPress('I', 'KeyI', 73);
await sleep(500);
check('Shift+I closes it again', (await modalName()) === null, 'panel dismissed');

await shiftKeyPress('P', 'KeyP', 80);
await sleep(500);
const pay = await modalName();
check('Shift+P opens the pay table', !!pay, pay || 'nothing opened');

// ── closePanelsOnSpin ───────────────────────────────────────────────────────
// A modal left open covers the board for the whole spin it is paying for.
// Only meaningful if something is actually open — with the shortcuts off
// nothing opened above, and "nothing was left open" would otherwise read as a
// pass for a behaviour that never ran.
if (!pay) {
  check('starting a round closes what is open', false, 'skipped — no panel was open to close');
} else {
  await space();
  // Report whether the ROUND started as well as whether the panel closed. A
  // press that was never accepted leaves the panel open too, and the two
  // failures need telling apart: one is closePanelsOnSpin not firing, the other
  // is the bet being refused while a panel is open.
  const roundStarted = await waitStart(1500);
  // POLL for the panel to go, do not sample once. The popup leaves on an out
  // transition, so a single read taken a fixed delay after the press catches it
  // mid-fade about one run in three — which showed up as a flaky FAIL on a
  // behaviour that was working every time.
  let stillOpen = await modalName();
  for (let i = 0; i < 40 && stillOpen !== null; i++) { await sleep(50); stillOpen = await modalName(); }
  check('starting a round closes what is open', stillOpen === null,
    stillOpen
      ? `still showing "${stillOpen}" (round ${roundStarted === null ? 'never started — the press was refused' : 'started after ' + roundStarted + 'ms'})`
      : `panel closed by the bet (round started after ${roundStarted}ms)`);
  await waitIdle();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
ws.close();
try { process.kill(-chrome.pid); } catch {}
try { chrome.kill(); } catch {}
process.exit(failed.length ? 1 : 0);
