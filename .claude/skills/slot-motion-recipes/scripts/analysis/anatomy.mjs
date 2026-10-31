// Rig anatomy of each symbol / character: where the bones sit (in units of the symbol frame), which ones move in the
// win animation and by how much, how the art is cut (parts, glow copies, shadows, masks) and how meshes are weighted.
//   node anatomy.mjs [skeleton ...]  > ../analysis/anatomy.md
import { load, poser, bounds, spine, r2 } from './lib.mjs';

const names = process.argv.slice(2).length ? process.argv.slice(2) : [
	'swpl_hv_1', 'swpl_hv_2', 'swpl_hv_3', 'swpl_hv_4', 'swpl_lv_1', 'swpl_lv_2', 'swpl_lv_3', 'swpl_lv_4', 'swpl_lv_5', 'swpl_lv_6',
	'swpl_scatter', 'swpl_super_scatter', 'swpl_fullbody_character'];

const kind = (s) => {
	const n = s.name.toLowerCase();
	if (s.blendMode === spine.BlendMode.Additive) return 'additive';
	if (/mask/.test(n)) return 'mask';
	if (/shadow|shdw|_sh$|_sh_/.test(n)) return 'shadow';
	if (/glow|light|shine|spark|flash|fx|ray|partic/.test(n)) return 'light';
	if (/frame|bg$|^bg|block|pink_bg/.test(n)) return 'frame';
	return 'art';
};

for (const name of names) {
	const { data } = load(name);
	const p = poser(data);
	const setup = p.pose(null, 0);
	const frame = bounds(setup, /^(frame_(left|right|top|bottom)|frame_0\d|bg)$/);
	const all = bounds(setup);
	const U = isFinite(frame.h) && frame.h > 0 ? frame.h : Math.max(all.w, all.h);
	const C = isFinite(frame.h) && frame.h > 0 ? frame : all;
	const out = [`\n## ${name}\n`, `單位 U = ${isFinite(frame.h) && frame.h > 0 ? '框高' : '整體外框'} ${r2(U)}；骨 ${data.bones.length}、slot ${data.slots.length}、IK ${data.ikConstraints.length}、TC ${data.transformConstraints.length}\n`];

	// --- art cut
	const counts = {};
	for (const s of data.slots) { const k = kind(s); counts[k] = (counts[k] ?? 0) + 1; }
	out.push(`切件：${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join('、')}`);

	// --- meshes and weights
	let meshes = 0, regions = 0, weighted = 0, maxInf = 0, infSum = 0, vtx = 0;
	const skin = data.defaultSkin;
	for (const e of skin.getAttachments()) {
		const a = e.attachment;
		if (a instanceof spine.RegionAttachment) regions++;
		if (!(a instanceof spine.MeshAttachment)) continue;
		meshes++;
		if (a.bones) {
			weighted++;
			for (let i = 0; i < a.bones.length;) { const n = a.bones[i]; maxInf = Math.max(maxInf, n); infSum += n; vtx++; i += n + 1; }
		}
	}
	out.push(`網格：mesh ${meshes}（加權 ${weighted}）、region ${regions}；加權頂點平均受 ${vtx ? r2(infSum / vtx) : 0} 骨影響、最多 ${maxInf} 骨`);

	// --- bones: placement and motion in the main win/active animation
	const win = data.animations.find((a) => /win_1$|_win$|win$/.test(a.name)) ?? data.animations[0];
	const N = 60;
	const track = new Map();
	for (let i = 0; i <= N; i++) {
		const s = p.pose(win, win.duration * i / N);
		for (const b of s.bones) {
			let t = track.get(b.data.name);
			if (!t) track.set(b.data.name, t = { x: [], y: [], r: [], sx: [], sy: [] });
			t.x.push(b.worldX); t.y.push(b.worldY); t.r.push(b.getWorldRotationX()); t.sx.push(b.getWorldScaleX()); t.sy.push(b.getWorldScaleY());
		}
	}
	const depth = (b) => { let d = 0; for (let x = b.parent; x; x = x.parent) d++; return d; };
	const span = (a) => Math.max(...a) - Math.min(...a);
	// World rotations wrap at ±180°; unwrap before measuring so a 2° wobble across the seam doesn't read as 358°.
	const unwrap = (a) => a.reduce((o, v, i) => { if (!i) return [v]; let d = v - o[i - 1]; while (d > 180) d -= 360; while (d < -180) d += 360; o.push(o[i - 1] + d); return o; }, []);
	const animated = new Set();
	for (const tl of win.timelines) if (tl.boneIndex !== undefined) animated.add(data.bones[tl.boneIndex].name);
	const rows = data.bones.map((b) => {
		const t = track.get(b.name);
		const sb = setup.findBone(b.name);
		return {
			name: b.name, parent: b.parent?.name ?? '', depth: depth(b),
			x: r2((sb.worldX - C.cx) / U), y: r2((sb.worldY - C.cy) / U), len: r2(b.length / U),
			keyed: animated.has(b.name),
			move: r2(Math.hypot(span(t.x), span(t.y)) / U), rot: r2(span(unwrap(t.r))), scale: r2(Math.max(span(t.sx), span(t.sy))),
		};
	});
	out.push(`\n${win.name}（${r2(win.duration)}s）—— 位置以框中心為原點、U 為單位；move＝世界位移幅度/U，rot＝世界旋轉幅度°\n`);
	out.push('| 骨 | 父 | 深 | x | y | 長 | key? | move | rot° | scale |', '|---|---|---|---|---|---|---|---|---|---|');
	for (const r of rows) out.push(`| ${r.name} | ${r.parent} | ${r.depth} | ${r.x} | ${r.y} | ${r.len} | ${r.keyed ? '●' : ''} | ${r.move} | ${r.rot} | ${r.scale} |`);
	console.log(out.join('\n'));
}
