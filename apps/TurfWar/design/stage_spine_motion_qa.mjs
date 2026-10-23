// @ts-nocheck -- local QA only; none of these controls enter build/ or upload/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require(require.resolve('esbuild', { paths: [path.dirname(require.resolve('vite/package.json'))] }));

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(app, '../../..');
const out = path.join(root, 'dist/turf-spine-motion');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(app, 'build'), path.join(out, 'game'), { recursive: true });
for (const file of ['stub.js','stub-data.js']) fs.copyFileSync(path.join(root,'dist/turfwar-playtest',file),path.join(out,'game',file));
fs.copyFileSync('/Users/stone/.codex/skills/stake-engine-slot/scripts/social_text_audit.js',path.join(out,'game/text-audit.js'));
const index = path.join(out,'game/index.html');
fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('<head>', '<head><script src="./text-audit.js"></script><script src="./stub-data.js"></script><script src="./stub.js"></script>'));

await build({ entryPoints: [path.join(app,'design/spine_motion_preview.ts')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: path.join(out,'preview.js') });
fs.writeFileSync(path.join(out,'index.html'), `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>Turf · Spine 動作實播</title>
<style>*{box-sizing:border-box}body{margin:0;background:#20252e;color:#f7f5f0;font:14px system-ui}nav{padding:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}button,select{background:#f5893d;border:0;border-radius:5px;color:#121212;padding:8px;cursor:pointer}#preview{max-width:900px;margin:auto}canvas{max-width:100%;height:auto;display:block}iframe{display:block;width:100%;height:calc(100vh - 60px);border:0}output{padding:6px}p{padding:0 12px}.hidden{display:none!important}</style>
<nav><b>Turf · Spine 4.3</b><button id="showPreview">角色預覽</button><button id="showGame">遊戲實播</button>
<button data-reaction="win">得獎</button><button data-reaction="winBig">大獎</button><button data-reaction="trigger">觸發免費遊戲</button>
<select id="speed" aria-label="播放速度"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select>
<button id="export">儲存動作影格</button><output id="status">載入中</output></nav>
<div id="preview"><p>左：蒙面打手（MG）　右：Kingpin（FG） · 同一套實際遊戲 Spine renderer</p></div>
<section id="gamePanel" class="hidden"><nav><button id="base">主遊戲</button><button id="bonus">Kingpin 免費遊戲</button><button data-book="11">Lookout</button><button data-book="29">Muscle</button><button data-book="821">大獎 fixture</button><select id="viewport" aria-label="遊戲尺寸"><option value="1280,720">1280 × 720</option><option value="1024,768">1024 × 768</option><option value="390,844">390 × 844</option></select><button id="captureGame">儲存遊戲畫面</button><button id="diagnose">診斷</button><button id="recordGame">錄製場景</button><button id="touchTest">觸控測試</button><button id="socialMode">社交模式</button><button id="replayMode">重播模式</button><span>選好後按遊戲 SPIN；本機 fixture，無真實下注。</span></nav><div id="gameWrap"><iframe id="game" src="./game/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en"></iframe></div></section>
<pre id="diagnostics" style="white-space:pre-wrap;font-size:11px"></pre><script type="module" src="./preview.js"></script></html>`);
console.log(out);
