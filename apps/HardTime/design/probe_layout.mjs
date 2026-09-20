// Layout audit at the small window sizes Stake calls Popout S and Popout L.
//
// "Game functions correctly on Popout S/L" is one of the 51 approval checkpoints
// and a sibling game failed it: its feature panel had a shrink floor justified by
// "the wrapper scrolls, so overflow is recoverable" — the wrapper had been passed
// noScroll, so it did not, and the tiers were simply cut off. Nothing about that
// is visible at desktop size.
//
// Stake does not publish the popout pixel sizes, so this brackets them: two
// portrait windows and two short landscape ones, plus a desktop baseline. What it
// measures at each size:
//
//   · does the page scroll at all (the frame must not be scrollable)
//   · does anything overflow horizontally
//   · for each modal: is its content fully reachable — either inside the viewport
//     or inside its own scroll container — and is any interactive control off
//     screen, which is the specific way the sibling game failed
//
// Usage: node design/probe_layout.mjs <playtest url> <out dir>
import { spawn } from 'child_process';
import fs from 'fs';

const URL_ = process.argv[2];
const OUT = process.argv[3] || '/tmp';
const PORT = 9343;
const SIZES = [
  { name: 'popout-s-portrait', w: 400, h: 720 },
  { name: 'popout-l-portrait', w: 480, h: 854 },
  { name: 'popout-s-landscape', w: 640, h: 420 },
  { name: 'popout-l-landscape', w: 900, h: 560 },
  { name: 'desktop', w: 1280, h: 800 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

for (const size of SIZES) {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    // Fresh profile per run, and the cache disabled below. A reused profile
    // served index.html from disk cache and reported a bug that had already been
    // fixed — the measurement was of the previous build, which is the worst kind
    // of wrong answer because it looks like a reproduction.
    `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/hm-cdp-layout-${size.name}-${Date.now()}`,
    '--no-first-run', '--no-default-browser-check', `--window-size=${size.w},${size.h}`, URL_,
  ], { stdio: 'ignore', detached: true });

  let list = [];
  for (let i = 0; i < 40; i++) {
    try { list = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).filter((t) => t.type === 'page' && t.url.includes('localhost')); if (list.length) break; } catch {}
    await sleep(500);
  }
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${n}.png`, Buffer.from(r.result.data, 'base64')); };
  const click = async (x, y) => { for (const t of ['mousePressed', 'mouseReleased']) { await send('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', clickCount: 1 }); await sleep(60); } };

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.reload', { ignoreCache: true });
  await sleep(6000);
  await click(size.w / 2, size.h * 0.62);   // dismiss the intro
  await sleep(2500);
  await send('Page.bringToFront');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });

  const frame = await ev(`(() => ({
    scrollY: document.scrollingElement.scrollHeight - window.innerHeight,
    scrollX: document.scrollingElement.scrollWidth - window.innerWidth,
    dpr: window.devicePixelRatio,
  }))()`);
  if (frame.scrollY > 0) problems.push(`${size.name}: the frame scrolls vertically by ${frame.scrollY}px — the checklist requires it not to`);
  if (frame.scrollX > 0) problems.push(`${size.name}: the frame scrolls horizontally by ${frame.scrollX}px`);
  await shot(`${size.name}_board`);

  // each modal: open it through the pixi button, then measure whether every
  // control inside it can actually be reached
  const openers = [
    ['buy', /buy|play|get/i, /bonus|feature/i],
  ];
  for (const [label, textRe, textRe2] of openers) {
    const btn = await ev(`(() => {
      let hit = null;
      const walk = (n) => {
        if (typeof n.text === 'string' && ${textRe}.test(n.text) && ${textRe2}.test(n.text)) { const m = n.worldTransform; hit = { x: m.tx, y: m.ty }; }
        (n.children || []).forEach(walk);
      };
      walk(window.__PIXI_APP__.stage);
      return hit;
    })()`);
    if (!btn) { problems.push(`${size.name}: could not find the ${label} button on screen`); continue; }
    await click(btn.x, btn.y);
    await sleep(1200);
    await shot(`${size.name}_${label}`);

    const reach = await ev(`(() => {
      // Popup renders its children TWICE — once in normal flow and once inside
      // the fixed overlay — so the first .hm-buy in the document is an invisible
      // ghost sitting below the canvas. Measuring that one is how this reported a
      // panel "below the fold" while the real one was centred on screen.
      const roots = document.querySelectorAll('.hm-buy');
      const root = roots[roots.length - 1];
      if (!root) return { open: false };
      const scroller = root.scrollHeight > root.clientHeight + 2 ? root : null;
      const controls = [...root.querySelectorAll('button')];
      // "Can the player get to it?" is answered by asking the browser to get to
      // it. Comparing rects against the viewport was the first version and it
      // reported every button on a desktop window as unreachable while a
      // screenshot showed them all sitting in the middle of the screen — the
      // arithmetic was guessing at what the scroll containers would allow.
      const offscreen = controls.filter((el) => {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        return r.bottom > window.innerHeight + 1 || r.top < -1 || r.right > window.innerWidth + 1 || r.left < -1;
      }).map((el) => el.textContent.trim().slice(0, 18));
      // and the click test the reported bug needed: is the panel actually on top
      // where the player presses, or is Popup's click-to-close layer over it?
      const blocked = controls.filter((el) => {
        // scroll it into view FIRST. Without that, a control below the panel's
        // own scroll fold is tested at a point outside the panel, which lands on
        // the click-to-close layer and looks like it is covered — the player
        // would simply have scrolled.
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(top && (top === el || el.contains(top)));
      }).map((el) => el.textContent.trim().slice(0, 18));
      return { open: true, copies: roots.length, controls: controls.length, offscreen, blocked, scrolls: !!scroller, clipped: root.scrollWidth > root.clientWidth + 2 };
    })()`);
    if (!reach.open) problems.push(`${size.name}: the ${label} panel did not open`);
    else {
      if (reach.offscreen?.length) problems.push(`${size.name}: ${label} controls unreachable: ${reach.offscreen.join(', ')}`);
      if (reach.clipped) problems.push(`${size.name}: ${label} panel is clipped horizontally`);
      if (reach.blocked?.length) problems.push(`${size.name}: ${label} controls are covered by something and cannot be clicked: ${reach.blocked.join(', ')}`);
      console.log(`  ${size.name.padEnd(20)} ${label}: ${reach.controls} controls, scrolls=${reach.scrolls}, blocked=${reach.blocked.length}`);
    }
  }

  console.log(`${size.name.padEnd(20)} ${size.w}x${size.h} dpr=${frame.dpr} frameScroll=${frame.scrollY}/${frame.scrollX}`);
  ws.close();
  try { process.kill(-chrome.pid); } catch {}
  await sleep(800);
}

console.log(problems.length ? `\n${problems.length} layout problem(s):\n  ` + problems.join('\n  ') : '\nOK: no layout problems at any tested size');
