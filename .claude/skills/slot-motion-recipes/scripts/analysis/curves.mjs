// Curve craft across the symbol and character animations (reads the shipped 3.7 JSON, where bezier handles are still
// fractions of the segment and therefore comparable): frame grid, easing presets, holds, overshoot, volume in squash,
// and how far each child key lags its parent.
//   node curves.mjs > ../analysis/curves.md
import fs from 'node:fs';

const DIR = `${(process.env.RESEARCH ?? 'E:/stake/archive/research/sweet-loot').replaceAll('\\', '/')}/spine`;
const SYMBOLS = ['swpl_hv_1', 'swpl_hv_2', 'swpl_hv_3', 'swpl_hv_4', 'swpl_lv_1', 'swpl_lv_2', 'swpl_lv_3', 'swpl_lv_4', 'swpl_lv_5', 'swpl_lv_6', 'swpl_scatter', 'swpl_super_scatter'];
const CHAR = ['swpl_fullbody_character'];
const r2 = (n) => +(+n).toFixed(2);
const pct = (a, b) => `${Math.round(100 * a / Math.max(b, 1))}%`;

function study(files, filter) {
	const handles = new Map();
	let keys = 0, onGrid = 0, linear = 0, stepped = 0, bez = 0, holds = 0, segs = 0;
	const kinds = { 'ease-in-out': 0, 'ease-out (快起慢停)': 0, 'ease-in (慢起快停)': 0, '近線性': 0, 'S 反向/特殊': 0 };
	const intervals = new Map();
	let overshoots = 0, reversals = 0, rotTimelines = 0;
	const volume = [];
	for (const f of files) {
		const j = JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
		for (const [an, a] of Object.entries(j.animations)) {
			if (filter && !filter.test(an)) continue;
			for (const [bone, tls] of Object.entries(a.bones ?? {})) {
				for (const [tl, ks] of Object.entries(tls)) {
					for (let i = 0; i < ks.length; i++) {
						const k = ks[i], t = k.time ?? 0;
						keys++;
						if (Math.abs(t * 30 - Math.round(t * 30)) < 0.02) onGrid++;
						if (i + 1 >= ks.length) continue;
						segs++;
						const n = ks[i + 1], dt = (n.time ?? 0) - t;
						const fr = Math.round(dt * 30);
						intervals.set(fr, (intervals.get(fr) ?? 0) + 1);
						const val = (x) => tl === 'rotate' ? [x.angle ?? 0] : tl === 'scale' ? [x.x ?? 1, x.y ?? 1] : [x.x ?? 0, x.y ?? 0];
						if (val(k).every((v, q) => Math.abs(v - val(n)[q]) < 1e-3)) holds++;
						if (k.curve === 'stepped') { stepped++; continue; }
						if (!Array.isArray(k.curve)) { linear++; continue; }
						bez++;
						const [x1, y1, x2, y2] = k.curve;
						const key = k.curve.map((c) => r2(c)).join(',');
						handles.set(key, (handles.get(key) ?? 0) + 1);
						// classify by how the handles bend the 0..1 curve
						const startSlope = x1 > 1e-3 ? y1 / x1 : 9, endSlope = (1 - x2) > 1e-3 ? (1 - y2) / (1 - x2) : 9;
						if (y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1) kinds['S 反向/特殊']++;
						else if (startSlope < 0.6 && endSlope < 0.6) kinds['ease-in-out']++;
						else if (startSlope >= 0.6 && endSlope < 0.6) kinds['ease-out (快起慢停)']++;
						else if (startSlope < 0.6 && endSlope >= 0.6) kinds['ease-in (慢起快停)']++;
						else kinds['近線性']++;
					}
					if (tl === 'rotate' && ks.length >= 4) {
						rotTimelines++;
						const v = ks.map((k) => k.angle ?? 0);
						let rev = 0;
						for (let i = 1; i < v.length - 1; i++) if ((v[i] - v[i - 1]) * (v[i + 1] - v[i]) < 0) rev++;
						reversals += rev;
						// overshoot: a move that passes its final resting value then comes back to it
						for (let i = 1; i < v.length - 1; i++) {
							const d1 = v[i] - v[i - 1], d2 = v[i + 1] - v[i];
							if (d1 * d2 < 0 && Math.abs(d2) < Math.abs(d1) * 0.5 && Math.abs(d2) > 0.3) overshoots++;
						}
					}
					if (tl === 'scale') for (const k of ks) if (k.x !== undefined || k.y !== undefined) {
						const x = k.x ?? 1, y = k.y ?? 1;
						if (Math.abs(x - y) > 0.02) volume.push(x * y);
					}
				}
			}
		}
	}
	const top = [...handles].sort((a, b) => b[1] - a[1]).slice(0, 8);
	const iv = [...intervals].sort((a, b) => b[1] - a[1]).slice(0, 10);
	const vol = volume.length ? `${volume.length} 個非等比 scale 關鍵影格，x·y 乘積中位數 ${r2(volume.sort((a, b) => a - b)[volume.length >> 1])}、範圍 ${r2(volume[0])}–${r2(volume[volume.length - 1])}` : '無非等比 scale';
	return [
		`- 關鍵影格 ${keys}，落在 30fps 整格上 ${pct(onGrid, keys)}`,
		`- 段落 ${segs}：貝茲 ${pct(bez, segs)}、線性 ${pct(linear, segs)}、stepped ${pct(stepped, segs)}；前後同值（hold）${pct(holds, segs)}`,
		`- 貝茲型態：${Object.entries(kinds).map(([k, v]) => `${k} ${pct(v, bez)}`).join('、')}`,
		`- 最常用的把手（x1,y1,x2,y2）：${top.map(([k, v]) => `[${k}]×${v}`).join('  ')}`,
		`- 相鄰關鍵影格間隔（格@30fps）：${iv.map(([k, v]) => `${k}格×${v}`).join('、')}`,
		`- 旋轉 timeline ${rotTimelines} 條，方向反轉 ${reversals} 次（平均每條 ${r2(reversals / Math.max(rotTimelines, 1))} 次）；像過衝後回落的 ${overshoots} 處`,
		`- 擠壓伸展：${vol}`,
	].join('\n');
}

// Lag of a child behind its parent: shift the child's rotate keys until their times match the parent's best.
function lags(file, anim) {
	const j = JSON.parse(fs.readFileSync(`${DIR}/${file}.json`, 'utf8'));
	const a = j.animations[anim];
	const parent = Object.fromEntries(j.bones.map((b) => [b.name, b.parent]));
	const out = [];
	for (const [bone, tls] of Object.entries(a.bones ?? {})) {
		const p = parent[bone];
		const mine = tls.rotate ?? tls.translate, theirs = a.bones?.[p]?.rotate ?? a.bones?.[p]?.translate;
		if (!mine || !theirs || mine.length < 3 || theirs.length < 3) continue;
		const tm = mine.map((k) => k.time ?? 0), tp = theirs.map((k) => k.time ?? 0);
		const diffs = [];
		for (let i = 1; i < Math.min(tm.length, tp.length) - 1; i++) diffs.push(tm[i] - tp[i]);
		if (!diffs.length) continue;
		const med = diffs.sort((x, y) => x - y)[diffs.length >> 1];
		const amp = (ks) => { const v = ks.map((k) => k.angle ?? Math.hypot(k.x ?? 0, k.y ?? 0)); return Math.max(...v) - Math.min(...v); };
		out.push({ bone, p, lag: r2(med), ratio: r2(amp(mine) / Math.max(amp(theirs), 1e-3)) });
	}
	return out.filter((o) => Math.abs(o.lag) > 0.001 || o.ratio !== 1);
}

console.log('# 曲線手法統計\n');
console.log('## 獎圖 win\n'); console.log(study(SYMBOLS, /win/));
console.log('\n## 獎圖 idle\n'); console.log(study(SYMBOLS, /idle|loop/));
console.log('\n## 人物（全部動作）\n'); console.log(study(CHAR));
console.log('\n## 人物 idle 系列\n'); console.log(study(CHAR, /idle/));
console.log('\n## 人物 win / blast\n'); console.log(study(CHAR, /win|blast/));
for (const [f, an] of [['swpl_hv_3', 'swpl_hv_3_win'], ['swpl_hv_1', 'swpl_hv_1_win'], ['swpl_hv_4', 'swpl_hv_4_win'], ['swpl_fullbody_character', 'swpl_character_idle'], ['swpl_fullbody_character', 'swpl_character_win_1']]) {
	console.log(`\n## 子骨落後父骨（${an}）——lag 秒，ratio＝子幅度/父幅度\n`);
	console.log(lags(f, an).map((o) => `${o.p} → ${o.bone}: lag ${o.lag}s, ×${o.ratio}`).join('\n'));
}
