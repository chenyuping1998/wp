// What does a TEASING reel actually scroll?
//
// This exists because the same thing was reported wrong twice, and both times a
// screenshot was the only evidence available — a board mid-spin, with the one
// reel in question motion-blurred:
//
//   「MG 聽牌時後面輪整輪變成 SC」      the strip was 100% scatter
//   「假轉變成兩顆有一顆 SC 很奇怪」     the strip was 1-in-2, a repeating pair
//
// So it reads the symbol names off the reel instead, through `__HM_REELS__`
// under ?hmdebug=1, and asserts two separate things:
//
//   the strip is ORDINARY     scatter density near the real strip's 1-in-12,
//                             and no short repeating pattern
//   the tease is EARNED       the reels that have already stopped carry the
//                             2+ scatters that armed it
//
// Usage:
//   node design/probe_tease.mjs <playtest url> [samples]

// The spin/observe loop runs INSIDE the page. The first version drove it over CDP
// at a 20ms poll and never finished: every sample was a round trip, so the probe
// was slower than the thing it was watching.
import { spawn } from 'child_process';
const URL_ = process.argv[2], N = Number(process.argv[3] || 8), PORT = 9338;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-tease3',
  '--no-first-run', '--no-default-browser-check', '--window-size=1000,700', URL_,
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
for (const w of [4500, 2500, 2500, 2000]) { await sleep(w); await click(480, 380); }
await sleep(1500);

await evaluate(`(() => {
  window.__T = { hits: [], spins: 0, armedSpins: 0, done: false };
  const reels = () => window.__HM_REELS__();
  const stopped = () => reels().every(r => r.motion === 'stopped');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    for (let s = 0; s < 400 && window.__T.hits.length < ${N}; s++) {
      let w = 0; while (!stopped() && w < 40000) { await sleep(30); w += 30; }
      await sleep(500);
      window.__HM_EMIT__({ type: 'bet' });
      window.__T.spins++;
      let seen = false;
      let armed = false;
      for (let i = 0; i < 900; i++) {
        const a = window.__HM_GAME__().anticipation || [];
        if (a.some(v => v > 0)) armed = true;
        if (!seen && a.some(v => v > 0)) {
          const rs = reels();
          // The teasing reel must still be MOVING and everything before it must
          // already have STOPPED. Without the second half the sample lands at the
          // start of the reveal, when no reel has landed yet — and then
          // "how many scatters are on the stopped reels" is 0 because there are no
          // stopped reels, not because the tease armed wrongly. That is exactly
          // how the first version of this probe reported a false BAD.
          const t = rs.findIndex((r, i2) => a[i2] > 0 && r.motion !== 'stopped');
          if (t >= 1 && rs.slice(0, t).every((r) => r.motion === 'stopped')) {
            seen = true;
            window.__T.hits.push({
              anticipation: a.slice(),
              reel: t,
              stoppedScatters: rs.filter(r => r.motion === 'stopped').flatMap(r => r.names).filter(n => n === 'S').length,
              scrolling: rs[t].names.slice(),
            });
          }
        }
        if (i > 20 && stopped()) break;
        await sleep(20);
      }
      if (armed) window.__T.armedSpins = (window.__T.armedSpins || 0) + 1;
    }
    window.__T.done = true;
  })();
  return 'armed';
})()`);

for (let i = 0; i < 100; i++) {
  const st = JSON.parse(await evaluate(`JSON.stringify({ n: window.__T.hits.length, spins: window.__T.spins, done: window.__T.done })`));
  if (st.done || st.n >= N) break;
  await sleep(3000);
}
const hits = JSON.parse(await evaluate(`JSON.stringify(window.__T.hits)`));
const spins = await evaluate(`window.__T.spins`);
const armedSpins = await evaluate(`window.__T.armedSpins`);
// The real strip carries one scatter in twelve (0.083). The two rejected strips
// were 1.0 and 0.5. Anything at or below a quarter is the ordinary mix — a raw
// count is the wrong test, because a 60-symbol padding sequence legitimately
// contains two or three scatters and the first version of this probe failed the
// game for that.
const MAX_SCATTER_DENSITY = 0.25;

// A strip is "patterned" if it repeats with period 2 or 3 — which is what made
// the 1-in-2 version read as broken rather than dense. Checked over the first 12,
// which is where the eye would pick it up.
const isPatterned = (names) => {
  for (const period of [2, 3]) {
    const head = names.slice(0, 12);
    if (head.length < period * 3) continue;
    if (head.every((n, i) => n === head[i % period])) return true;
  }
  return false;
};

let bad = 0;
for (const h of hits) {
  const density = h.scrolling.filter(n => n === 'S').length / h.scrolling.length;
  const dense = density > MAX_SCATTER_DENSITY;
  const patterned = isPatterned(h.scrolling);
  const unearned = h.stoppedScatters < 2;
  const ok = !dense && !patterned && !unearned;
  if (!ok) bad++;
  const why = [dense && 'scatter-dense', patterned && 'repeating pattern', unearned && 'armed with <2 scatters'].filter(Boolean).join(', ');
  console.log(
    `${ok ? 'ok  ' : 'BAD '} reel ${h.reel + 1} | scatter density ${(density * 100).toFixed(1)}% | ` +
    `stopped reels carry ${h.stoppedScatters} | ${ok ? h.scrolling.slice(0, 14).join(' ') + ' …' : why}`
  );
}
console.log(`\n${spins} spins, ${armedSpins} armed anticipation, ${hits.length} sampled mid-tease, ${bad} unexpected`);
ws.close(); try { process.kill(-chrome.pid); } catch {} process.exit(bad ? 1 : 0);
