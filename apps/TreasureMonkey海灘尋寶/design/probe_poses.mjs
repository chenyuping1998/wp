// Do the pose DRAWINGS reach the screen, and is each one held long enough?
//
// check_poses.mjs proves the plan is shaped right. It cannot prove the plan is
// running: a table that nothing reads passes every gate and puts nothing on the
// board. This watches the real textures.
//
// The whole sampler runs INSIDE the page — a CDP round trip per frame is slower
// than the thing being measured, which is how an earlier probe in this repo
// timed out without ever seeing its target.
//
// Usage: node design/probe_poses.mjs <playtest url> [wins to catch]
import { spawn } from 'child_process';
const URL_ = process.argv[2], WANT = Number(process.argv[3] || 3), PORT = 9346;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-poses',
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

await evaluate(`(() => {
  const app = window.__PIXI_APP__;
  window.__P = { runs: [], spins: 0, done: false };
  let open = null;
  const posesOnStage = () => {
    const found = new Set();
    const walk = (n) => {
      const lbl = (n.texture && n.texture.label) || '';
      const m = lbl.match(/hotMiamiParts\\/(h[0-9])\\/pose_(wind|peak|settle)\\.png/);
      if (m) found.add(m[1] + '/' + m[2]);
      (n.children || []).forEach(walk);
    };
    walk(app.stage);
    return found;
  };
  const tick = () => {
    const now = performance.now();
    const set = posesOnStage();
    if (set.size) {
      if (!open) open = { start: now, seen: {} };
      for (const k of set) open.seen[k] = (open.seen[k] || 0) + 1;
      open.last = now;
    } else if (open && now - open.last > 200) {
      window.__P.runs.push(open); open = null;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const stopped = () => window.__HM_REELS__().every(r => r.motion === 'stopped');
  const sleep2 = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    for (let i = 0; i < 120 && window.__P.runs.length < ${WANT}; i++) {
      let w = 0; while (!stopped() && w < 40000) { await sleep2(40); w += 40; }
      await sleep2(500);
      window.__HM_EMIT__({ type: 'bet' });
      window.__P.spins++;
      await sleep2(800);
      let e = 0; while (!stopped() && e < 40000) { await sleep2(40); e += 40; }
      await sleep2(900);
    }
    window.__P.done = true;
  })();
  return 'armed';
})()`);

for (let i = 0; i < 200; i++) {
  const st = JSON.parse(await evaluate(`JSON.stringify({ n: window.__P.runs.length, spins: window.__P.spins, done: window.__P.done })`));
  if (st.done || st.n >= WANT) break;
  await sleep(3000);
}
const runs = JSON.parse(await evaluate(`JSON.stringify(window.__P.runs)`));
const spins = await evaluate(`window.__P.spins`);
ws.close(); try { process.kill(-chrome.pid); } catch {}

console.log(`${spins} spins, ${runs.length} wins that put a pose on screen\n`);
let bad = 0;
for (const run of runs) {
  const rows = Object.entries(run.seen).sort();
  const total = rows.reduce((a, [, n]) => a + n, 0);
  // frames at ~60fps -> ms. A pose the plan holds for 136ms should show ~8 frames.
  const line = rows.map(([k, n]) => `${k} ${Math.round((n / 60) * 1000)}ms`).join('  ');
  const poses = new Set(rows.map(([k]) => k.split('/')[1]));
  const ok = poses.has('wind') && poses.has('peak') && poses.has('settle');
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${line}   (${total} frames)`);
}
if (!runs.length) { console.error('\nno pose ever reached the stage'); process.exit(1); }
console.log(`\n${runs.length - bad}/${runs.length} wins played all three drawings`);
process.exit(bad ? 1 : 0);
