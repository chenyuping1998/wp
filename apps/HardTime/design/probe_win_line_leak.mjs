// Regression probe: win lines must never be drawn while a reel is moving.
//
// Reported 2026-08-20 as "lines appearing from nowhere before the reels stop".
// The idle replay redraws last round's lines on a loop while the board sits
// still, and `playBet` stops it — but playBet does not run at the press, it runs
// when the book comes back from the RGS. A pass landing in that window drew last
// round's lines, and lit last round's symbols, over a board already spinning.
// Fixed by cancelling at the press in actor.ts's onNewGameStart.
//
// This times the press deliberately: it waits until a replay pass is actually on
// screen, presses spin on that exact frame, and samples __HM_LINES__ (win lines
// currently drawn) against __HM_REELS__ (which reels are moving) every frame.
// Win lines are Graphics, so no screenshot or scene-graph probe can see them —
// __HM_LINES__ exists under ?hmdebug=1 for this reason.
//
// Usage (the URL needs hmdebug, and forceBook a winning book so there is
// something to replay — 4 is the Collector book in BASE):
//
//   ROUNDS=6 node design/probe_win_line_leak.mjs \
//     "http://localhost:4190/?hmdebug=1&rgs_url=stub.local&sessionID=playtest\
//      &currency=USD&lang=en&forceBook=4"
//
// Measured: 1 leak frame with the fix disabled, 0 with it in place over 7
// presses. One frame sounds small because the local stub answers instantly —
// against a real RGS the press-to-reply window is a network round trip, which is
// why a player sees it "sometimes".
import { spawn } from 'child_process';
const URL_ = process.argv[2];
const PORT = 9338;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-leak',
  '--no-first-run', '--no-default-browser-check', '--window-size=900,620', URL_,
], { stdio: 'ignore', detached: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list = [];
for (let i = 0; i < 40; i++) {
  try { list = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).filter((t) => t.type === 'page' && t.url.includes('localhost')); if (list.length) break; } catch {}
  await sleep(500);
}
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) { await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(40); } };

await sleep(5000);
await click(450, 400);            // dismiss the intro
await sleep(2500);
await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });

// sampler: every animation frame, lines on screen + which reels are spinning
await evaluate(`(() => {
  window.__LEAK__ = [];
  const t0 = performance.now();
  const tick = () => {
    const lines = window.__HM_LINES__ ? window.__HM_LINES__().count : -1;
    const spinning = (window.__HM_REELS__ ? window.__HM_REELS__() : []).filter(r => r.motion !== 'stopped').length;
    window.__LEAK__.push([+(performance.now() - t0).toFixed(0), lines, spinning]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return 'armed';
})()`);

const SPIN = [769, 469];
let presses = 0;
for (let round = 0; round < Number(process.env.ROUNDS || 8); round++) {
  await click(SPIN[0], SPIN[1]);
  presses++;
  // let the round play out
  await sleep(6500);
  // now idle: wait for a replay pass to appear, then press spin ON it
  let caught = false;
  for (let i = 0; i < 40; i++) {
    const lines = await evaluate('window.__HM_LINES__().count');
    if (lines > 0) { await click(SPIN[0], SPIN[1]); presses++; caught = true; break; }
    await sleep(150);
  }
  if (caught) await sleep(6500);
}

const rows = await evaluate('JSON.stringify(window.__LEAK__)');
const data = JSON.parse(rows || '[]');
const leaks = data.filter(([, lines, spinning]) => lines > 0 && spinning > 0);
console.log(`presses=${presses} samples=${data.length} frames-with-lines=${data.filter(r => r[1] > 0).length}`);
console.log(`LEAK FRAMES (lines drawn while a reel was moving): ${leaks.length}`);
if (leaks.length) console.log('  first few:', JSON.stringify(leaks.slice(0, 6)));
ws.close();
try { process.kill(-chrome.pid); } catch {}
