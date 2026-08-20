// Measure the LANDING animation as it is actually rendered.
//
// The browser-pane MCP tab does not paint between screenshots — its Pixi ticker
// is frozen (app.ticker.lastTime does not advance), so nothing animated can be
// observed there at all. This drives a real, visible Chrome over CDP, where rAF
// runs, and reads the symbols' own worldTransform every frame: the rendered
// scale, rotation and position, not a screenshot and not the source table.
//
// Usage:
//   node design/probe_motion.mjs <url> [spins] [out.json]
//   SHOT_DIR=<dir> node design/probe_motion.mjs …      # also burst screenshots
//
// The URL must carry the playtest query string or the stub never intercepts:
//   http://localhost:4190/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en
// and `&forceBook=<id>` forces a specific book (50 = five scatters, 4 = Collector,
// 1862 = max win), which is the only way to see a rare symbol land.
import { spawn } from 'child_process';
import fs from 'fs';

const URL_ = process.argv[2];
const SPINS = Number(process.argv[3] || 1);
const PORT = 9333;
const PROFILE = '/tmp/hm-cdp-profile';

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
const consoleLines = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type)) {
    consoleLines.push(m.params.type + ': ' + (m.params.args||[]).map(a => a.value ?? a.description ?? a.type).join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    consoleLines.push('exception: ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
  }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
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

await send('Runtime.enable');
await sleep(4000);
// dismiss the intro overlay
await click(450, 400);
await sleep(2500);

// probe: every rAF, every symbol sprite's rendered transform
await evaluate(`(() => {
  const app = window.__PIXI_APP__;
  window.__LAND__ = { frames: [] };
  const collect = () => {
    const out = [];
    const walk = (n) => {
      const lbl = (n.texture && n.texture.label) || '';
      if (lbl.includes('hotMiamiSymbols')) {
        const m = n.worldTransform;
        out.push([lbl.split('/').pop().replace('.png',''),
          +m.tx.toFixed(1), +m.ty.toFixed(1),
          +Math.hypot(m.a,m.b).toFixed(4), +Math.hypot(m.c,m.d).toFixed(4),
          +Math.atan2(m.b,m.a).toFixed(4), +(n.alpha||0).toFixed(2), +(n.blendMode==='add'?1:0)]);
        return;
      }
      if (lbl.includes('fx')) {
        const m = n.worldTransform;
        out.push(['FX:'+lbl.split('/').pop().replace('.png',''), +m.tx.toFixed(1), +m.ty.toFixed(1),
          +n.width.toFixed(1), +n.height.toFixed(1), 0, +(n.alpha||0).toFixed(2), 1]);
        return;
      }
      (n.children||[]).forEach(walk);
    };
    walk(app.stage);
    return out.concat((window.__HM_REELS__ ? window.__HM_REELS__() : []).map((r,i)=>['REEL'+i, r.motion==='spinning'?1:0, r.anticipating?1:0, 0,0,0,0,0]));
  };
  const t0 = performance.now();
  const tick = () => { window.__LAND__.frames.push([+(performance.now()-t0).toFixed(1), collect()]); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  return 'armed';
})()`);

const spinButton = await evaluate(`(() => {
  const el = [...document.querySelectorAll('*')].find(e => /spin/i.test(e.getAttribute('data-testid')||'') || /spin/i.test(e.getAttribute('aria-label')||''));
  if (!el) return null; const r = el.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2];
})()`);
const spinAt = spinButton || [769, 469];
console.log('spin button at', spinAt, spinButton ? '(found)' : '(fallback)');

// EMIT=<json> summons a presentation directly through the ?hmdebug=1 hook
// instead of waiting for the maths to produce one. This is the only way to see a
// rare beat — a 100x Neon Frame arriving, say — because no book in the catalogue
// is guaranteed to contain one.
const shotDir = process.env.SHOT_DIR;
if (shotDir) await send('Page.enable');
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${shotDir}/${name}.png`, Buffer.from(r.result.data, 'base64'));
};

if (process.env.EMIT) {
  // Without a spin to click, nothing has focused the window since it opened and
  // Chrome throttles rAF in an unfocused one — the sampler recorded zero frames
  // for a full run before this was found. Bring the page to the front and turn
  // on focus emulation so the ticker runs while only the probe is driving it.
  await send('Page.bringToFront');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await sleep(300);
  await evaluate(`window.__HM_EMIT__(${process.env.EMIT})`);
  // HOLD_MS keeps recording after the emit; with spins=0 this is the whole run.
  const hold = Number(process.env.HOLD_MS || 2500);
  if (shotDir) {
    for (let i = 0; i * 120 < hold; i++) { await shot(`emit_${String(i).padStart(2, '0')}`); await sleep(120); }
  } else {
    await sleep(hold);
  }
}

for (let s = 0; s < SPINS; s++) {
  await click(spinAt[0], spinAt[1]);
  if (shotDir) {
    // burst through the whole spin: reels stopping, the tease, the landings
    for (let i = 0; i < 30; i++) { await shot(`spin${s}_${String(i).padStart(2, '0')}`); await sleep(120); }
  } else {
    await sleep(4500);
  }
}

const frames = await evaluate('JSON.stringify(window.__LAND__.frames)');
fs.writeFileSync(process.argv[4] || '/tmp/land_frames.json', frames);
const n = JSON.parse(frames).length;
console.log('captured', n, 'frames');
console.log(consoleLines.length ? 'CONSOLE:\n' + consoleLines.join('\n') : 'console: no errors or warnings');
ws.close();
process.kill(-chrome.pid);
