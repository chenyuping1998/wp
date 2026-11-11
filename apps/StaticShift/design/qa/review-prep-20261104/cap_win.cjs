const { chromium } = require('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const [,, book, out, w, h, waitStart, n, step] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:4198/?rgs_url=stub.local&sessionID=playtest&lang=en');
  await p.waitForTimeout(7000);
  await p.mouse.click(+w/2, +h/2); await p.waitForTimeout(2500);
  await p.evaluate((id) => window.__stub.force(+id), book);
  await p.keyboard.press('Space');
  await p.waitForTimeout(+waitStart);
  for (let i = 0; i < +n; i++) { await p.screenshot({ path: `${out}/f${String(i).padStart(3,'0')}.png` }); await p.waitForTimeout(+step); }
  await b.close();
})();
