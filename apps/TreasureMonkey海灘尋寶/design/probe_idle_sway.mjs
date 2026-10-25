// Does a character symbol actually sway on a SETTLED board, and do its parts
// move by different amounts and at different times?
//
// The table (game/idleSway.ts) is checked by check_idle_sway.mjs in plain node.
// This checks the other half — that the numbers reach the screen — by reading
// each rigged part's own rendered worldTransform every frame in a real Chrome,
// the same way probe_motion.mjs reads the landing.
//
// It exists because "the parts are drawn at rest" is a rendering decision that
// nothing else covers: a symbol whose stack is never mounted at rest would pass
// every table gate and stand perfectly still on screen.
//
// Usage: node design/probe_idle_sway.mjs <playtest url> [seconds]
import { spawn } from 'child_process';
const URL_ = process.argv[2], SECS = Number(process.argv[3] || 9), PORT = 9339;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-sway',
  '--no-first-run', '--no-default-browser-check', '--window-size=1200,800', URL_,
], { stdio: 'ignore', detached: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list = [];
for (let i = 0; i < 40; i++) { try { list = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).filter(t => t.type === 'page' && t.url.includes('localhost')); if (list.length) break; } catch {} await sleep(500); }
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const evaluate = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
const click = async (x, y) => { for (const t of ['mousePressed', 'mouseReleased']) { await send('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', clickCount: 1 }); await sleep(40); } };
await send('Runtime.enable'); await send('Page.enable'); await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
for (const w of [4500, 2500, 2500, 2000]) { await sleep(w); await click(600, 430); }
await sleep(1500);

// spin until an H1 or H2 is on the board, then let it settle
for (let i = 0; i < 30; i++) {
  const has = await evaluate(`window.__HM_REELS__().some(r => r.names.includes('H1') || r.names.includes('H2'))`);
  const still = await evaluate(`window.__HM_REELS__().every(r => r.motion === 'stopped')`);
  if (has && still) break;
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  for (let k = 0; k < 400; k++) { if (!(await evaluate(`window.__HM_REELS__().some(r=>r.motion!=='stopped')`))) break; await sleep(25); }
  await sleep(700);
}

await evaluate(`(() => {
  const app = window.__PIXI_APP__;
  window.__SWAY__ = [];
  const t0 = performance.now();
  const tick = () => {
    const out = [];
    const walk = (n) => {
      const lbl = (n.texture && n.texture.label) || '';
      // The cast beside the board is one flat sprite, so it is picked up by
      // texture label the same way, and reported alongside the rigged parts:
      // "does the figure at the edge of the screen actually move" is the same
      // question and has the same failure mode.
      if (lbl.includes('hotMiamiParts') || lbl.includes('hotMiamiCast')) {
        const m = n.worldTransform;
        const bits = lbl.split('/');
        out.push([bits[bits.length - 2] + '/' + bits[bits.length - 1].replace('.png',''),
          +m.tx.toFixed(2), +m.ty.toFixed(2), +Math.atan2(m.b, m.a).toFixed(5),
          +Math.hypot(m.c, m.d).toFixed(5)]);
        return;
      }
      (n.children || []).forEach(walk);
    };
    walk(app.stage);
    if (out.length) window.__SWAY__.push([+(performance.now() - t0).toFixed(0), out]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return 'armed';
})()`);

await sleep(SECS * 1000);
const frames = JSON.parse(await evaluate(`JSON.stringify(window.__SWAY__)`));
ws.close(); try { process.kill(-chrome.pid); } catch {}

if (!frames.length) { console.error('no rigged parts on screen — no H1/H2 landed, or the stack is not drawn at rest'); process.exit(1); }

// per part: rotation range, and where in the window its extreme fell
const byPart = new Map();
for (const [t, parts] of frames) {
  for (const [name, tx, ty, rot, sy] of parts) {
    if (!byPart.has(name)) byPart.set(name, { rot: [], tx: [], sy: [], t: [] });
    const p = byPart.get(name);
    p.rot.push(rot); p.tx.push(tx); p.sy.push(sy); p.t.push(t);
  }
}
const DEG = 180 / Math.PI;
let moving = 0;
console.log(`${frames.length} frames over ${SECS}s\n`);
for (const [name, p] of [...byPart.entries()].sort()) {
  const span = (Math.max(...p.rot) - Math.min(...p.rot)) * DEG;
  const dx = Math.max(...p.tx) - Math.min(...p.tx);
  const dsy = Math.max(...p.sy) - Math.min(...p.sy);
  const at = p.t[p.rot.indexOf(Math.max(...p.rot))];
  if (span > 0.05 || dx > 0.4 || dsy > 0.002) moving += 1;
  console.log(
    `${name.padEnd(18)} rotation ${span.toFixed(2).padStart(6)}deg span   x ${dx.toFixed(1).padStart(5)}px   scaleY ${(dsy * 100).toFixed(2)}%   peak@${String(at).padStart(5)}ms`,
  );
}
console.log(`\n${moving}/${byPart.size} parts moving`);
process.exit(moving >= 2 ? 0 : 1);
