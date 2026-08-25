// Measure WHEN each reel stops, in turbo, in both games.
//
// The claim being checked is the user's complaint: with turbo on, a free spin
// dropped all five reels at once, so a bought feature was over before it read as
// having happened. SPIN_OPTIONS_FAST_FREEGAME now carries `reelStaggerInTurbo`,
// which is only meaningful as a set of TIMES — a screenshot of a landed board
// looks the same either way, and the source table cannot tell you what the
// renderer did with it.
//
// So: drive a real Chrome (the browser-pane tab never repaints), sample
// `__HM_REELS__()` every frame, and record for each spin the moment each reel
// leaves 'spinning'. Base game and free game are separated by `__HM_GAME__()`.
//
// Usage:
//   node design/probe_turbo_stagger.mjs "<playtest url>" [seconds]
//
// The URL needs the playtest query string, and &forceBook= picks the round:
//   ?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en
import { spawn } from 'child_process';

const URL_ = process.argv[2];
const SECONDS = Number(process.argv[3] || 90);
const PORT = 9337;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hm-cdp-turbo',
  '--no-first-run', '--no-default-browser-check', '--window-size=900,620', URL_,
], { stdio: 'ignore', detached: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list = [];
for (let i = 0; i < 40; i++) {
  try {
    const all = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    list = all.filter((t) => t.type === 'page' && t.url.includes('localhost'));
    if (list.length) break;
  } catch {}
  await sleep(500);
}
if (!list.length) { console.error('no page target'); process.exit(1); }

const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
// Spin with the SPACE BAR, not by clicking.
//
// Every control in this game is drawn on the canvas, so a probe clicking the
// spin button is clicking a guessed pixel — and when the guess is wrong the run
// ends with "0 spins measured", which looks exactly like a game that would not
// spin. The keyboard path (utils-slots' hotKey handler, Space) is the same code
// path the player's spacebar takes and needs no coordinates at all.
const pressSpace = async () => {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32,
    });
    await sleep(40);
  }
};

const click = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    await sleep(60);
  }
};

await send('Runtime.enable');
await send('Page.enable');
await send('Page.bringToFront');
// Chrome throttles requestAnimationFrame in an unfocused window, and the
// sampler below IS a rAF loop — without this it records nothing at all and the
// run ends with "0 spins measured", which reads as a game that would not spin
// rather than as a probe that was never awake. Same fix as probe_motion.mjs.
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
// Press-anywhere gates, plural: the loading screen and then the feature intro
// card. A single click at a fixed moment only works if the 40MB build happened
// to be ready by then — when it was not, the click landed on the loader, the
// intro card came up behind it and stayed, and the probe reported "0 complete
// spins" as though the game had refused to spin.
for (const wait of [4500, 2500, 2500, 2000]) {
  await sleep(wait);
  await click(450, 400);
}
await sleep(1500);

// Sampler: one row per frame per reel-state change. Records the first frame on
// which each reel is no longer 'spinning', which is the moment the player sees
// it arrive.
await evaluate(`(() => {
  window.__STOPS__ = [];
  let prev = null, spinIndex = -1, t0 = 0;
  const tick = () => {
    const reels = window.__HM_REELS__ ? window.__HM_REELS__() : [];
    const now = performance.now();
    const spinning = reels.map((r) => r.motion === 'spinning');
    if (prev) {
      if (spinning.some(Boolean) && !prev.some(Boolean)) {
        spinIndex += 1; t0 = now;
        window.__STOPS__.push({ spin: spinIndex, game: window.__HM_GAME__().gameType,
                                turbo: window.__HM_GAME__().isTurbo, type: reels[0].spinType, at: [] });
      }
      const row = window.__STOPS__[window.__STOPS__.length - 1];
      if (row) {
        reels.forEach((r, i) => {
          if (prev[i] && !spinning[i] && row.at[i] === undefined) row.at[i] = +(now - t0).toFixed(0);
        });
      }
    }
    prev = spinning;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return 'armed';
})()`);

// Turbo on, then spin. The turbo toggle is the lightning button at the far right
// of the bar; clicking it is what a player does, and reading stateBet directly
// would prove nothing about the control.
// The toggle is drawn on the canvas, so there is nothing to click by label —
// `__HM_TURBO__` (hmdebug only) is the only reliable way to put the game in
// turbo from a probe. An earlier version guessed at coordinates and silently
// measured nothing.
await evaluate('window.__HM_TURBO__ ? window.__HM_TURBO__(true) : null');
await sleep(300);
console.log('turbo state:', await evaluate('JSON.stringify(window.__HM_GAME__())'));

const spinAt = await evaluate(`(() => {
  const el = [...document.querySelectorAll('*')].find((e) => /spin/i.test(e.getAttribute('data-testid') || '') || /spin/i.test(e.getAttribute('aria-label') || ''));
  if (!el) return null; const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
})()`);
// The spin button is canvas too. Its place is stable as a FRACTION of the
// window (0.838, 0.895 of the 900x620 the probe opens), which a hardcoded pixel
// pair is not — the previous literal sat in the middle of the reels and every
// click missed, which the probe reported as "0 complete spins" rather than as a
// failure to click.
const spin = spinAt || [Math.round(900 * 0.838), Math.round(620 * 0.929)];

// Diagnostics on the loop itself. A probe that clicks nothing and a probe that
// clicks a game which refuses to spin both end with an empty report, and the
// difference matters: the first is a broken probe, the second is a broken game.
let clicks = 0;
const deadline = Date.now() + SECONDS * 1000;
while (Date.now() < deadline) {
  const busy = await evaluate(`(() => { const r = window.__HM_REELS__(); return r.some((x) => x.motion !== 'stopped'); })()`);
  if (!busy) {
    await pressSpace();
    clicks += 1;
  }
  await sleep(1200);
}
console.log(`spun ${clicks}x, sampler rows: ${await evaluate('window.__STOPS__ ? window.__STOPS__.length : -1')}`);

const rows = await evaluate('JSON.stringify(window.__STOPS__)').then(JSON.parse);
const done = rows.filter((r) => r.at.filter((x) => x !== undefined).length === 5);
const summarise = (label, set) => {
  if (!set.length) return console.log(`  ${label.padEnd(22)} (no spins)`);
  const spreads = set.map((r) => r.at[4] - r.at[0]);
  const gaps = set.flatMap((r) => r.at.slice(1).map((v, i) => v - r.at[i]));
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  console.log(`  ${label.padEnd(22)} spins=${String(set.length).padEnd(3)} ` +
    `first→last ${med(spreads)}ms (min ${Math.min(...spreads)}, max ${Math.max(...spreads)})  ` +
    `median gap ${med(gaps)}ms`);
  console.log(`    example stops: ${set[set.length - 1].at.join(', ')} ms`);
};
console.log(`\n${done.length} complete spins measured`);
summarise('basegame turbo', done.filter((r) => r.game === 'basegame' && r.turbo && r.type === 'fast'));
summarise('freegame turbo', done.filter((r) => r.game === 'freegame' && r.turbo && r.type === 'fast'));
summarise('basegame normal', done.filter((r) => r.game === 'basegame' && !r.turbo));
summarise('freegame normal', done.filter((r) => r.game === 'freegame' && !r.turbo));

ws.close();
try { process.kill(-chrome.pid); } catch {}
process.exit(0);
