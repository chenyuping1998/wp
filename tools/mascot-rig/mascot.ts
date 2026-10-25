#!/usr/bin/env node
// mascot-rig: front-facing mascot layers → weighted-mesh Spine rig + motion library → checks, preview, Spine 4.3 (or
// 4.2) for the game. See README.md.
//
//   node tools/mascot-rig/mascot.ts mannequin [out dir]          placeholder mascot drawn to the template
//   node tools/mascot-rig/mascot.ts brief [out.md]               art brief (layers, joints, proportions) from the template
//   node tools/mascot-rig/mascot.ts build <character dir> [-o out] [--name n] [--reels left|right] [--scale s] [--spine 4.3|4.2] [--grid px] [--no-gif]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HERE, checkKit, core42, core42Version, core43, kitModule } from './lib/kit.ts';
import { jointWarnings, readJoints, readTemplate } from './lib/template.ts';
import type { Layer } from './lib/rig.ts';
import { buildRig, makeDeformer } from './lib/rig.ts';
import { CUES, LABELS, mascotMotions, registerPresets } from './lib/motions.ts';
import { jointLabel, runChecks } from './lib/checks.ts';
import { scaleJson, to42, verify42, verify43 } from './lib/export42.ts';

const PY = process.env.PYTHON ?? 'python';
const py = (script: string, ...args: string[]) => {
  const r = spawnSync(PY, [path.join(HERE, 'py', script), ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.status !== 0) throw new Error(`${script} 失敗：${r.stderr || r.error}`);
};
const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(n);
const opt = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--no-gif'].includes(argv[i - 1])) && !(i > 0 && argv[i - 1] === '-o') && a !== '-o');

const cmd = positional[0];
if (cmd === 'mannequin') {
  const out = path.resolve(positional[1] ?? 'mannequin');
  py('mannequin.py', path.join(HERE, 'template.json'), out);
  console.log(`下一步：node ${path.relative(process.cwd(), path.join(HERE, 'mascot.ts'))} build ${out}`);
} else if (cmd === 'brief') {
  const out = path.resolve(positional[1] ?? '生圖規格.md');
  fs.writeFileSync(out, brief());
  console.log(`寫好 ${out}`);
} else if (cmd === 'build') {
  await build(path.resolve(positional[1] ?? '.'));
} else {
  console.log(fs.readFileSync(path.join(HERE, 'mascot.ts'), 'utf8').split('\n').slice(1, 7).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(cmd ? 1 : 0);
}

function brief(): string {
  const T = readTemplate();
  const L = ['# 正面吉祥物生圖規格', '', T.description, '', `畫布 ${T.canvas[0]}×${T.canvas[1]}，透明 PNG；每個圖層都是**整張畫布**、部件留在畫好的位置（疊起來就是完整角色）。`, '',
    '參考：`node tools/mascot-rig/mascot.ts mannequin` 會畫出一隻照這份規格的佔位猴子（圖層、關節都在），交件長得像它就對了。', '',
    '## 圖層（由後往前疊）', '', '| 檔名 | 部件 | 必要 | 被擋住的地方要畫什麼 |', '|---|---|---|---|',
    ...T.layers.map((l) => `| \`${l.name}.png\` | ${l.label} | ${l.required ? '✓' : '選用'} | ${l.paint} |`), '',
    '疊圖順序不同（例如某隻手畫在臉前面）時，附 `layers.json`：`{ "order": ["tail", …, "head"] }`。', '',
    '## 關節點 `joints.json`', '', '畫布像素、y 向下：`{ "hip": [512, 905], … , "tail": [[x, y], …] }`。', '', '| 名稱 | 位置 | 必要 |', '|---|---|---|',
    ...T.joints.map((j) => `| \`${j.id}\` | ${j.label} | ${j.required ? '✓' : '有耳朵圖層時'} |`), `| \`tail\` | ${T.tail.label} | 有尾巴圖層時 |`, '',
    '## 比例（從動作反推，畫之前先確認）', '', ...Object.values(T.proportions).map((p) => `- ${p}`), '',
    '## 為什麼', '', '- 手腳尾巴要一整條：骨架用加權網格在關節處彎曲，分節畫會在關節露出切口。', '- 肩膀頂端是圓：手臂繞肩關節轉（舉手到 130°），圓心對準關節才不會露縫。', '- 被擋住的地方要畫完：舉手、蹲下時會露出來。', ''];
  return L.join('\n');
}

async function build(dir: string) {
  checkKit();
  const T = readTemplate();
  const layersDir = fs.existsSync(path.join(dir, 'layers')) ? path.join(dir, 'layers') : dir;
  const find = (f: string) => [path.join(dir, f), path.join(layersDir, f), path.join(path.dirname(dir), f)].find((p) => fs.existsSync(p));
  const cfgFile = find('mascot.json');
  const cfg = cfgFile ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
  const name = opt('--name') ?? cfg.name ?? (path.basename(layersDir === dir ? dir : path.dirname(layersDir)).replace(/[^\w-]/g, '') || 'mascot');
  const reels = (opt('--reels') ?? cfg.reels ?? 'left') as 'left' | 'right';
  const scale = Number(opt('--scale') ?? cfg.scale ?? 1);
  const target = String(opt('--spine') ?? cfg.spine ?? '4.3');
  if (target !== '4.3' && target !== '4.2') throw new Error(`--spine 只能是 4.3 或 4.2（收到 ${target}）`);
  const out = path.resolve(opt('-o') ?? path.join(path.dirname(dir), `${name}_mascot`));
  const work = path.join(out, '_work');
  const game = path.join(out, 'game');
  fs.mkdirSync(game, { recursive: true });
  const jointsFile = find('joints.json');
  if (!jointsFile) throw new Error(`找不到 joints.json（${dir}）；格式見 README 或跑 mascot.ts brief`);
  const joints = readJoints(jointsFile);
  const missingJoints = T.joints.filter((j) => j.required && !joints[j.id]).map((j) => j.id);
  if (missingJoints.length) throw new Error(`joints.json 缺少：${missingJoints.join('、')}`);

  // ---- layers
  py('prep.py', layersDir, path.join(work, 'alpha'));
  const info = JSON.parse(fs.readFileSync(path.join(work, 'alpha', 'layers.json'), 'utf8'));
  const layers = new Map<string, Layer & { file: string }>();
  const unknown: string[] = [];
  for (const [n, v] of Object.entries<any>(info.layers)) {
    if (!T.layers.some((l) => l.name === n)) { unknown.push(v.file); continue; }
    layers.set(n, { name: n, file: v.file, width: info.width, height: info.height, alpha: new Uint8Array(fs.readFileSync(path.join(work, 'alpha', n + '.alpha'))) });
  }
  const missing = T.layers.filter((l) => l.required && !layers.has(l.name)).map((l) => `${l.name}.png`);
  if (missing.length) throw new Error(`缺少必要圖層：${missing.join('、')}`);
  const orderFile = find('layers.json');
  const custom: string[] | undefined = orderFile && orderFile !== path.join(work, 'alpha', 'layers.json') ? (([] as string[]).concat(JSON.parse(fs.readFileSync(orderFile, 'utf8')).order ?? JSON.parse(fs.readFileSync(orderFile, 'utf8')))) : undefined;
  const order = (custom ?? T.layers.map((l) => l.name)).map((n) => n.replace(/\.png$/i, '')).filter((n) => layers.has(n));
  for (const n of layers.keys()) if (!order.includes(n)) order.splice(T.layers.findIndex((l) => l.name === n), 0, n);

  // ---- rig, motions, checks (Spine 4.3: the kit's runtime)
  const [{ compileRecipe }, { PRESETS }, { checkSkeleton }, { parseSkeleton }, { estimateSize }, c43] = await Promise.all([
    kitModule('recipe.ts'), kitModule('presets.ts'), kitModule('check.ts'), kitModule('spineJson.ts'), kitModule('roles.ts'), core43(),
  ]);
  const rt = { Skeleton: c43.Skeleton, Physics: c43.Physics, parseSkeleton };
  const grid = opt('--grid') ? Number(opt('--grid')) : cfg.grid;
  const rig = buildRig(T, joints, layers, order, rt, { grid, name });
  registerPresets(PRESETS);
  const motions = mascotMotions(rig.measure, { reels });
  const { json: j43, summary } = compileRecipe(rig.json, { fps: 30, facing: 1, size: estimateSize(rig.json), roles: motions.roles, animations: motions.anims });
  // FK arms: the arm IK keyed off for the whole animation (the drawn pose is the IK's rest pose, so it doesn't pop)
  for (const [anim, chains] of Object.entries(motions.fk)) {
    if (chains.length) j43.animations[anim].ik = Object.fromEntries(chains.map((n) => [n, [{ mix: 0, softness: j43.constraints.find((c: any) => c.name === n).softness }]]));
  }
  const deform = makeDeformer({ ...rig, json: j43 }, rt);
  const checks = runChecks(rig, j43, summary, deform, rt, checkSkeleton);
  fs.writeFileSync(path.join(out, `${name}.spine43.json`), JSON.stringify(j43));

  // ---- preview frames: every move with idle between, mixed like the game (0.12 s), 25 fps
  const FPS = 25;
  const dur = (n: string) => summary.find((s: any) => s.name === n).duration;
  const moves = summary.filter((s: any) => s.name !== 'idle' && s.name !== 'dance').map((s: any) => s.name);
  const seq = [{ anim: 'idle', loop: true, seconds: 1.6 }, ...moves.flatMap((a: string) => [{ anim: a, loop: false, seconds: dur(a) + 0.1 }, { anim: 'idle', loop: true, seconds: 0.4 }]),
    ...(summary.some((s: any) => s.name === 'dance') ? [{ anim: 'dance', loop: true, seconds: 2 * dur('dance') }, { anim: 'idle', loop: true, seconds: 0.5 }] : [])];
  const data = parseSkeleton(j43);
  const sk = new c43.Skeleton(data);
  const sd = new c43.AnimationStateData(data); sd.defaultMix = 0.12;
  const state = new c43.AnimationState(sd);
  const raw: { label: string; v: Map<string, Float32Array> }[] = [];
  const segments: { anim: string; start: number; n: number }[] = [];
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
  sk.setupPose();
  for (const s of seq) {
    state.setAnimation(0, s.anim, s.loop);
    const n = Math.round(s.seconds * FPS);
    segments.push({ anim: s.anim, start: raw.length, n });
    for (let i = 0; i < n; i++) {
      if (raw.length) { state.update(1 / FPS); sk.update(1 / FPS); }
      sk.setupPose(); state.apply(sk); sk.updateWorldTransform(c43.Physics.update);
      const v = deform(sk);
      for (const a of v.values()) for (let k = 0; k < a.length; k += 2) { X0 = Math.min(X0, a[k]); X1 = Math.max(X1, a[k]); Y0 = Math.min(Y0, a[k + 1]); Y1 = Math.max(Y1, a[k + 1]); }
      raw.push({ label: LABELS[s.anim] ?? s.anim, v });
    }
  }
  const OH = 640, pad = 40;
  Y0 = Math.min(Y0, -20);
  const S = (OH - 2 * pad) / (Y1 - Y0), OW = Math.round(((X1 - X0) * S + 2 * pad) / 2) * 2;
  const names = [...rig.meshes.keys()];
  const nv = names.reduce((s, n) => s + rig.meshes.get(n)!.verts.length, 0);
  const bin = new Float32Array(raw.length * nv * 2);
  raw.forEach((f, i) => {
    let o = i * nv * 2;
    for (const n of names) { const a = f.v.get(n)!; for (let k = 0; k < a.length; k += 2) { bin[o++] = pad + (a[k] - X0) * S; bin[o++] = pad + (Y1 - a[k + 1]) * S; } }
  });
  fs.writeFileSync(path.join(work, 'frames.bin'), Buffer.from(bin.buffer));
  fs.writeFileSync(path.join(work, 'meta.json'), JSON.stringify({
    width: OW, height: OH, fps: FPS, frames: raw.length, labels: raw.map((f) => f.label), ground: [pad + (0 - X0) * S, pad + Y1 * S], segments,
    texScale: Math.min(1, Math.max(0.25, S * 1.25)), footer: `mascot-rig・${j43.bones.length} 骨・加權網格`,
    slots: names.map((n) => ({ name: n, file: layers.get(n)!.file, verts: rig.meshes.get(n)!.verts, tris: rig.meshes.get(n)!.tris })),
  }));

  // ---- the game files: atlas from the mesh crops, skeleton scaled (and converted for a 4.2 game), then replayed on
  // that runtime with the real atlas. New games ship the 4.3 runtime; --spine 4.2 is for games still on 4.2.74.
  const crops = Object.fromEntries(names.map((n) => [n, { file: layers.get(n)!.file, ...rig.meshes.get(n)!.crop }]));
  fs.writeFileSync(path.join(work, 'crops.json'), JSON.stringify(crops));
  py('pack.py', layersDir, path.join(work, 'crops.json'), game, name, String(scale));
  const atlasText = fs.readFileSync(path.join(game, `${name}.atlas`), 'utf8');
  let v42: string, ver;
  if (target === '4.2') {
    v42 = core42Version();
    const j42 = scaleJson(to42(j43, v42), scale);
    fs.writeFileSync(path.join(game, `${name}.json`), JSON.stringify(j42));
    ver = verify42(c43, await core42(), j43, j42, atlasText, deform, parseSkeleton, scale);
  } else {
    v42 = j43.skeleton.spine;
    const jg = scaleJson(structuredClone(j43), scale);
    fs.writeFileSync(path.join(game, `${name}.json`), JSON.stringify(jg));
    ver = verify43(c43, j43, jg, atlasText, deform, parseSkeleton, scale);
  }

  // ---- preview
  py('render.py', work, layersDir, out, ...(flag('--no-gif') ? ['--no-gif'] : []));

  // ---- report
  const jw = jointWarnings(joints);
  const ok42 = ver.missingRegions.length === 0 && ver.vertexMax < 0.05 * Math.max(scale, 0.1) && ver.boneMax < 0.05 * Math.max(scale, 0.1) && ver.mirrorMax < 0.05;
  const bad = checks.filter((c) => c.score < 80 || c.flipped > 0);
  const SLIDE = 0.004 * rig.measure.H; // a planted foot moving 0.4 % of the height shows as sliding
  const soft = checks.filter((c) => c.handLag > 0.03 || c.footSlide > SLIDE || (c.name === 'idle' && c.firstFrame > 5));
  const verdict = ok42 && !bad.length ? (jw.length || soft.length ? '可以用，有幾項提醒（見下面）' : '可以用') : '需要看一下';
  const pages = atlasText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.endsWith('.png'));
  const R: string[] = [
    `# ${name} · 吉祥物骨架與動作報告`, '', `**結論：${verdict}。** ${checks.length} 個動作、${j43.bones.length} 根骨、${rig.meshes.size} 塊加權網格；Spine ${v42} 遊戲檔用同版 runtime 逐格重播，與骨架計算一致。`, '',
    '## 動作', '', '| 動畫 | 用在 | 長度 | 流暢度 | 網格摺疊／擠扁 | 手追不上 | 腳底滑動 | 第一格離原圖 |', '|---|---|---|---|---|---|---|---|',
    ...checks.map((c) => `| \`${c.name}\` ${LABELS[c.name] ?? ''} | ${CUES[c.name] ?? ''} | ${c.duration.toFixed(2)} s${c.loop ? ' 循環' : ''} | ${c.score}${c.score < 80 ? ' ⚠' : ''} | ${c.flipped}／${c.squashed}${c.flipped ? ' ⚠' : ''}${c.foldAt ? `<br><small>${c.foldAt}</small>` : ''} | ${(Math.max(0, c.handLag) * 100).toFixed(1)}%${c.handLag > 0.03 ? ' ⚠' : ''} | ${c.footSlide.toFixed(1)} px${c.footSlide > SLIDE ? ' ⚠' : ''} | ${c.name === 'idle' ? `${c.firstFrame.toFixed(0)}°${c.firstFrame > 5 ? ' ⚠' : ''}` : '—'} |`),
    '', '- 流暢度：spine-generator 的檢查（頓挫、停頓、折角、循環接縫），80 以上就順。',
    '- 網格摺疊：只算蓋到圖的三角形；摺疊（翻面）> 0 會看到鋸齒，擠扁（面積 < 25%）多半在關節內側、正常。',
    '- 手追不上：IK 手離動作規劃的位置多遠（扣掉柔化 IK 在原圖就有的距離），以臂長計；超過 3% 表示動作要的伸展超過這隻手臂，手會停在半路。',
    `- 腳底滑動：腳的 IK 目標沒動時，腳踝最多移動幾 px；超過身高 0.4%（這隻是 ${SLIDE.toFixed(1)} px）看得出腳在滑或浮起來。`,
    '- 第一格離原圖：只看循環，遊戲從靜態圖切進待機時會跳一下的角度。', '',
    ...checks.flatMap((c) => c.issues.length ? [`- ${c.name}：${c.issues.join('；')}`] : []),
    '## 關節轉幅（+ 逆時針／− 順時針，離畫好的姿勢）', '', `| 動畫 | ${Object.keys(checks[0].turns).map(jointLabel).join(' | ')} |`, `|---|${Object.keys(checks[0].turns).map(() => '---').join('|')}|`,
    ...checks.map((c) => `| ${c.name} | ${Object.values(c.turns).map((t) => `+${t.plus.toFixed(0)}／−${t.minus.toFixed(0)}`).join(' | ')} |`), '',
    '## 比例與關節', '', ...(jw.length ? jw.map((w) => `- ⚠ ${w}`) : ['- ✓ 手臂長度、手肘膝蓋彎度、脖子方向都沒問題']), ...rig.warnings.map((w) => `- ⚠ ${w}`), ...(unknown.length ? [`- 不在模板裡、沒有用的圖層：${unknown.join('、')}`] : []), '',
    '## 骨架', '', `- ${j43.bones.length} 根骨：脊椎三段、鎖骨、手臂／腿各兩節＋手掌腳掌、手肘膝蓋半角輔助骨${rig.measure.tail.length ? `、尾巴 ${rig.measure.tail.length} 節` : ''}${rig.measure.ears ? '、雙耳' : ''}、4 個 IK 目標`,
    `- 約束：手腳 IK（有 softness，不會啪一下打直）、4 個半角輔助（transform）；物理已烘成關鍵影格，遊戲不需要跑物理`,
    `- ${rig.meshes.size} 塊網格、${names.reduce((s, n) => s + rig.meshes.get(n)!.verts.length, 0)} 頂點、${names.reduce((s, n) => s + rig.meshes.get(n)!.tris.length / 3, 0)} 三角形（格距 ${grid ?? Math.max(10, Math.round(rig.measure.H / 70))} px）`,
    `- 手臂：要把手放到定點的動作用 IK（${Object.entries(motions.fk).filter(([, c]) => c.length < 2).map(([a, c]) => `${a}${c.length ? `：${['arm-l', 'arm-r'].filter((x) => !c.includes(x)).map((x) => (x === 'arm-l' ? '左手' : '右手')).join('')}` : ''}`).join('、')}），其餘都是 FK（那段動畫把手臂 IK 的 mix 設 0，手臂跟著肩膀走）`, '',
    `## Spine ${v42} 輸出（給遊戲${target === '4.3' ? '；app 要裝 @esotericsoftware/spine-pixi-v8 4.3.x' : ''}）`, '', `- \`game/${name}.json\`、\`game/${name}.atlas\`、${pages.map((p) => `\`game/${p}\``).join('、')}（縮放 ${scale}）`,
    `- 用 spine-core ${v42} 載入、逐格重播 ${ver.frames} 格：骨頭位置最大差 ${ver.boneMax.toExponential(1)} px、網格頂點最大差 ${ver.vertexMax.toExponential(1)} px、左右鏡像（skeleton.scaleX = -1）最大差 ${ver.mirrorMax.toExponential(1)} px${ver.missingRegions.length ? `；⚠ atlas 缺 ${ver.missingRegions.join('、')}` : '；atlas 每個圖都有對應區塊'}${ver.vertexMax > 0.05 ? `（最大在 ${ver.at}）` : ''}`,
    `- 事件：point（指出去那一下）、release（丟出手）、takeoff／land（歡呼起跳、落地）`, '',
    '放進遊戲（assets.ts）：', '', '```ts', `${name}Mascot: {`, `\ttype: 'spine',`, `\tsrc: {`, `\t\tatlas: new URL('../../assets/spines/${name}/${name}.atlas', import.meta.url).href,`, `\t\tskeleton: new URL('../../assets/spines/${name}/${name}.json', import.meta.url).href,`, '\t\tscale: 1,', '\t},', '},', '```', '',
    '## 檔案', '', '| 檔案 | 用途 |', '|---|---|', `| \`game/\` | Spine ${v42} 骨架＋atlas＋貼圖，直接放進 app 的 static/assets/spines/ |`, `| \`${name}.spine43.json\` | 同一份的 Spine 4.3 版（spine-generator 的檢查、預覽工具可以直接讀） |`,
    '| `預覽.gif` | 全部動作連播（待機穿插，0.12 s 混合，和遊戲一樣） |', '| `逐格.png` | 每個動作三格 |', '| `_work/` | 中間檔（alpha、頂點、裁切），可刪 |', '',
  ];
  fs.writeFileSync(path.join(out, '報告.md'), R.join('\n'));
  console.log('');
  for (const c of checks) console.log(`  ${c.name.padEnd(11)} 流暢度 ${String(c.score).padStart(3)}  摺疊 ${c.flipped}／擠扁 ${c.squashed}  手追不上 ${(Math.max(0, c.handLag) * 100).toFixed(1)}%  腳滑 ${c.footSlide.toFixed(1)}px`);
  console.log(`\n  ${v42} 重播：骨頭差 ${ver.boneMax.toExponential(1)} px、頂點差 ${ver.vertexMax.toExponential(1)} px、鏡像差 ${ver.mirrorMax.toExponential(1)} px${ver.missingRegions.length ? `、atlas 缺 ${ver.missingRegions.join(',')}` : ''}`);
  console.log(`\n結論：${verdict}。\n輸出：${out}`);
}
