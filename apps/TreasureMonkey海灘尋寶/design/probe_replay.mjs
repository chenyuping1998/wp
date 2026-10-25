// Drive REPLAY MODE end to end and report what actually happens.
//
// Replay had never been run in this project until 2026-08-20 — the handoff
// listed it as the single most likely functional rejection, and the
// collaborator's own notes record three of their replays shipping broken
// because "the build passed" was treated as verification.
//
// It reads the start card out of the DOM, clicks Start, then watches the round
// by reading the win meter out of the PIXI SCENE GRAPH (the bar is canvas, not
// DOM), and finally exercises the replay-again button — the part that has to
// reset the board between runs.
//
// Usage:
//   node design/probe_replay.mjs "<replay url>" <shot dir>
//   WATCH_MS=120000 WATCH2_MS=100000 node design/probe_replay.mjs …
//
// A replay URL needs every one of these; the shell serves it from dist/playtest
// with the stub in design/playtest_stub.js answering /bet/replay/:
//
//   ?replay=true&rgs_url=stub.local&game=hot_miami&version=1
//   &mode=BASE&event=50&amount=1000000&currency=USD&lang=en
//
// Two things that cost time and are easy to repeat:
//   · the loading screen is a press-anywhere gate, and so are the free-spin
//     intro and outro — nothing clicks them in a replay, so a round that is
//     waiting looks exactly like a round that has hung;
//   · Pixi's worldTransform here is already in CSS pixels. Dividing by
//     devicePixelRatio put the replay-again click in the middle of the board,
//     the second run never started, and the leftover total from the first run
//     made a naive check report success.
import { spawn } from 'child_process';
import fs from 'fs';

const URL_ = process.argv[2];
const OUT = process.argv[3];
const PORT = 9336;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-replay',
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
let id = 0; const pending = new Map(); const console_ = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    const text = (m.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ');
    if (!/Uncompiled message|lingui|ICU/i.test(text)) console_.push(m.params.type + ': ' + text.slice(0, 300));
  }
  if (m.method === 'Runtime.exceptionThrown') console_.push('EXCEPTION: ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 400));
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64'));
};
const click = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) { await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(50); } };

await send('Runtime.enable');
await send('Page.enable');
await sleep(6000);
await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await sleep(1500);
await shot('replay_00_loading');
// the loading screen is a "press anywhere to continue" gate, in replay too
await click(450, 400);
await sleep(2500);
await shot('replay_01_intro');

// what is on screen, and what the replay state believes
console.log('--- visible text ---');
console.log(await evaluate(`document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0, 1200)`));

// The replay card is drawn in Pixi, not the DOM, so the button has to be found
// in the scene graph. Every Text node's string is collected as well, which is
// how the card's numbers get read back.
const domBtn = await evaluate(`(() => {
  const el = [...document.querySelectorAll('button')].find(e => /start replay/i.test(e.textContent || ''));
  if (!el) return null; const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: el.textContent.trim().slice(0, 40) };
})()`);
const texts = await evaluate(`(() => {
  const out = [];
  const walk = (n) => {
    if (typeof n.text === 'string' && n.text.trim()) {
      const m = n.worldTransform;
      out.push({ text: n.text.slice(0, 60), x: +m.tx.toFixed(0), y: +m.ty.toFixed(0), visible: n.visible, alpha: +(n.alpha||0).toFixed(2) });
    }
    (n.children || []).forEach(walk);
  };
  walk(window.__PIXI_APP__.stage);
  return JSON.stringify(out);
})()`);
console.log('--- pixi texts ---');
console.log(texts);
const ratio = await evaluate('window.devicePixelRatio');
const parsed = JSON.parse(texts || '[]');
const hit = parsed.find((t) => /start replay/i.test(t.text));
const btn = domBtn || (hit ? { x: hit.x / (ratio || 1), y: hit.y / (ratio || 1), text: hit.text } : null);
console.log('--- start button:', JSON.stringify(btn));

if (!btn) { console.log('NO START BUTTON — aborting'); }
else {
  await click(btn.x, btn.y);

  // Watch the round to its end rather than screenshotting blind. The win meter
  // is Pixi text, so it is read out of the scene graph.
  const readBar = async () => JSON.parse(await evaluate(`(() => {
    const out = {};
    const walk = (n) => {
      if (typeof n.text === 'string') {
        const t = n.text.trim();
        if (/^\\$[\\d,]+\\.\\d\\d$/.test(t)) (out.money = out.money || []).push(t);
        if (/^[\\d.]+x$/.test(t)) (out.mult = out.mult || []).push(t);
        if (/REPLAY|FREE|SPIN|WIN|COLLECT/i.test(t)) (out.labels = out.labels || []).push(t.slice(0, 24));
      }
      (n.children || []).forEach(walk);
    };
    walk(window.__PIXI_APP__.stage);
    return JSON.stringify(out);
  })()`) || '{}');

  const watch = async (label, ms) => {
  const timeline = [];
  const t0 = Date.now();
  let shots = 0;
  while (Date.now() - t0 < ms) {
    const bar = await readBar();
    const line = `money=${(bar.money || []).join(',')} mult=${(bar.mult || []).join(',')} labels=${(bar.labels || []).join('|')}`;
    // The free-spin intro and outro are press-to-continue gates. Nothing clicks
    // them in a replay unless a player does, and the first watch of this round
    // sat on the intro card for 90 seconds looking like a hang. Tap a neutral
    // corner every few samples so the round can walk itself through.
    if (Math.round((Date.now() - t0) / 1500) % 3 === 0) await click(60, 60);
    if (timeline[timeline.length - 1] !== line) {
      timeline.push(line);
      console.log(`   [${label}] ${((Date.now() - t0) / 1000).toFixed(0)}s  ${line}`);
      if (shots < 8) await shot(`${label}_${String(shots++).padStart(2, '0')}`);
    }
    await sleep(1500);
  }
  console.log(`--- [${label}] distinct states seen:`, timeline.length);
  return timeline;
  };

  const first = await watch('run1', Number(process.env.WATCH_MS || 120000));

  // Second run: the "replay again" button in the bar. The collaborator shipped a
  // broken replay three times; re-running is the part nobody had ever exercised.
  // Pixi's worldTransform here is already in CSS pixels — the stage is sized in
  // CSS units and the screenshots are 2x because of devicePixelRatio. Dividing
  // by the ratio (as the first attempt did) put the click in the middle of the
  // board and the second run silently never started, while the leftover win
  // total from run 1 made a naive check say it had.
  //
  // The button is the circular glyph left of the word, so aim at the glyph.
  const again = JSON.parse((await evaluate(`(() => {
    let hit = null;
    const walk = (n) => {
      if (typeof n.text === 'string' && /^(REPLAY|↺)$/i.test(n.text.trim())) {
        const m = n.worldTransform;
        if (!hit || m.tx < hit.x) hit = { x: m.tx, y: m.ty };
      }
      (n.children || []).forEach(walk);
    };
    walk(window.__PIXI_APP__.stage);
    return JSON.stringify(hit);
  })()`)) || 'null');
  console.log('--- replay-again button:', JSON.stringify(again));
  if (again) {
    await click(again.x, again.y);
    const second = await watch('run2', Number(process.env.WATCH2_MS || 100000));
    console.log('--- run1 states:', first.length, ' run2 states:', second.length);
    console.log('--- run2 reached the same total:', second.some((l) => l.includes('$1,453.80')));
  }
}

console.log('--- after run, visible text ---');
console.log(await evaluate(`document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0, 600)`));
console.log('--- balance/bet state ---');
console.log(await evaluate(`JSON.stringify({ url: location.search })`));
console.log('--- console ---');
console.log(console_.length ? console_.join('\n') : 'no errors or warnings');
ws.close();
try { process.kill(-chrome.pid); } catch {}
