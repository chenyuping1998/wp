// Seam check for the ninja's joints (2026-10-23, ported from SaucerMonkey's
// design/arms/check_seams.mjs, itself spine-generator's checkSeams idea done on
// every drawn triangle): does any joint open onto the background as the parts
// turn? Background inside the outline the two sides of a joint were meant to
// fill, beyond what the rest pose already shows, fails over THRESHOLD px².
// Every clip is played the way the game plays it: `flutter` on track 1 and
// physics stepped at 60fps (the cloth hides or opens joints too).
//
//   node design/spine43/check_seams.mjs [clip...]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);
const { PNG } = createRequire(path.join(process.env.GEN_TOOLS ?? 'E:/stake/tools/gen', 'package.json'))('pngjs');

const CELL = 2, RADIUS = 40, NOTCH = 4, THRESHOLD = 48;
const JOINTS = [
	{ bone: 'armL', label: '左肩', parent: ['torso_0_trunk', 'left_arm_0_upper_arm'] },
	{ bone: 'armL_fore', label: '左手肘', parent: ['left_arm_0_upper_arm', 'left_arm_1_forearm'] },
	{ bone: 'armR', label: '右肩', parent: ['torso_0_trunk', 'right_arm_0_upper_arm'] },
	{ bone: 'armR_fore', label: '右手肘', parent: ['right_arm_0_upper_arm', 'right_arm_1_forearm'] },
	{ bone: 'head', label: '脖子', parent: ['torso_0_trunk', 'head_2_face'] },
	{ bone: 'legL_calf', label: '左膝', parent: ['left_leg_0_thigh', 'left_leg_1_calf'] },
	{ bone: 'legR_calf', label: '右膝', parent: ['right_leg_0_thigh', 'right_leg_1_calf'] },
];
const ONLY = process.argv.slice(2);

let failed = 0;
{
	const DIR = path.join(process.env.SEAM_SPINES ?? path.join(appRoot, 'static/assets/spines'), 'goBananinjaMascot');
	const png = PNG.sync.read(fs.readFileSync(path.join(DIR, 'ninja.png')));
	const atlasText = fs.readFileSync(path.join(DIR, 'ninja.atlas'), 'utf8');
	const atlas = new core.TextureAtlas(atlasText);
	for (const p of atlas.pages) p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: png.width, height: png.height }) });
	const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(DIR, 'ninja.json'), 'utf8')));
	const texIndex = (u, v) => {
		const x = Math.min(png.width - 1, Math.max(0, Math.floor(u * png.width)));
		const y = Math.min(png.height - 1, Math.max(0, Math.floor(v * png.height)));
		return (y * png.width + x) * 4;
	};
	// each visible slot's triangles in world space
	const drawsOf = (sk) => {
		const out = [];
		for (const slot of sk.drawOrder) {
			const att = slot.getAttachment();
			if (!att || slot.color.a < 0.05) continue;
			if (slot.data.name.startsWith('shuriken_')) continue; // glints are not body
			let xy, uv, tri;
			if (att instanceof core.RegionAttachment) {
				xy = new Float32Array(8);
				att.computeWorldVertices(slot, xy, 0, 2);
				uv = att.uvs;
				tri = [0, 1, 2, 2, 3, 0];
			} else if (att instanceof core.MeshAttachment) {
				xy = new Float32Array(att.worldVerticesLength);
				att.computeWorldVertices(slot, 0, att.worldVerticesLength, xy, 0, 2);
				uv = att.uvs;
				tri = att.triangles;
			} else continue;
			out.push({ name: slot.data.name, xy, uv, tri });
		}
		return out;
	};

	const R = Math.ceil(RADIUS / CELL), S = 2 * R + 1;
	/** coverage of the given draws in the window round (cx, cy) */
	const cover = (draws, cx, cy, rgb = null) => {
		const m = new Uint8Array(S * S);
		const x0 = cx - R * CELL, y0 = cy - R * CELL;
		for (const d of draws) {
			for (let t = 0; t < d.tri.length; t += 3) {
				const i = d.tri[t], j = d.tri[t + 1], k = d.tri[t + 2];
				const ax = d.xy[i * 2], ay = d.xy[i * 2 + 1], bx = d.xy[j * 2], by = d.xy[j * 2 + 1], qx = d.xy[k * 2], qy = d.xy[k * 2 + 1];
				const minx = Math.min(ax, bx, qx), maxx = Math.max(ax, bx, qx), miny = Math.min(ay, by, qy), maxy = Math.max(ay, by, qy);
				if (maxx < x0 || minx > x0 + S * CELL || maxy < y0 || miny > y0 + S * CELL) continue;
				const det = (by - qy) * (ax - qx) + (qx - bx) * (ay - qy);
				if (Math.abs(det) < 1e-9) continue;
				const gx0 = Math.max(0, Math.floor((minx - x0) / CELL)), gx1 = Math.min(S - 1, Math.ceil((maxx - x0) / CELL));
				const gy0 = Math.max(0, Math.floor((miny - y0) / CELL)), gy1 = Math.min(S - 1, Math.ceil((maxy - y0) / CELL));
				for (let gy = gy0; gy <= gy1; gy++) {
					for (let gx = gx0; gx <= gx1; gx++) {
						if (m[gy * S + gx] && !rgb) continue;
						const px = x0 + gx * CELL, py = y0 + gy * CELL;
						const l1 = ((by - qy) * (px - qx) + (qx - bx) * (py - qy)) / det;
						const l2 = ((qy - ay) * (px - qx) + (ax - qx) * (py - qy)) / det;
						const l3 = 1 - l1 - l2;
						if (l1 < 0 || l2 < 0 || l3 < 0) continue;
						const u = l1 * d.uv[i * 2] + l2 * d.uv[j * 2] + l3 * d.uv[k * 2];
						const v = l1 * d.uv[i * 2 + 1] + l2 * d.uv[j * 2 + 1] + l3 * d.uv[k * 2 + 1];
						const ti = texIndex(u, v);
						if (png.data[ti + 3] > 128) {
							m[gy * S + gx] = 1;
							// later draws are on top
							if (rgb) for (let c = 0; c < 3; c++) rgb[(gy * S + gx) * 3 + c] = png.data[ti + c];
						}
					}
				}
			}
		}
		return m;
	};
	const morph = (m, r, grow) => {
		const o = new Uint8Array(S * S);
		for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
			let v = grow ? 0 : 1;
			for (let dy = -r; dy <= r && (grow ? !v : v); dy++) for (let dx = -r; dx <= r; dx++) {
				const xx = x + dx, yy = y + dy;
				const c = xx >= 0 && yy >= 0 && xx < S && yy < S ? m[yy * S + xx] : 0;
				if (grow && c) { v = 1; break; }
				if (!grow && !c) { v = 0; break; }
			}
			o[y * S + x] = v;
		}
		return o;
	};
	const rN = Math.round(NOTCH / CELL);
	const gapAt = (sk, jt, shot = null) => {
		const b = sk.findBone(jt.bone);
		const cx = b.worldX, cy = b.worldY;
		const draws = drawsOf(sk);
		const rgb = shot ? new Uint8Array(S * S * 3) : null;
		const all = cover(draws, cx, cy, rgb);
		const intended = morph(morph(cover(draws.filter((d) => jt.parent.includes(d.name) || d.name === jt.bone), cx, cy), rN, true), rN, false);
		// the gap is the LARGEST connected run of open cells: a crack is one
		// piece, while a rotating edge only flickers single cells along the
		// outline (anti-aliased ink sampled on a 2px grid)
		const open = new Uint8Array(S * S);
		for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
			if ((x - R) ** 2 + (y - R) ** 2 > R * R) continue;
			if (intended[y * S + x] && !all[y * S + x]) open[y * S + x] = 1;
		}
		let n = 0;
		const seen = new Uint8Array(S * S);
		for (let k0 = 0; k0 < S * S; k0++) {
			if (!open[k0] || seen[k0]) continue;
			let size = 0;
			const stack = [k0];
			seen[k0] = 1;
			while (stack.length) {
				const k = stack.pop();
				size++;
				const x = k % S, y = (k - x) / S;
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const xx = x + dx, yy = y + dy, kk = yy * S + xx;
					if (xx >= 0 && yy >= 0 && xx < S && yy < S && open[kk] && !seen[kk]) { seen[kk] = 1; stack.push(kk); }
				}
			}
			n = Math.max(n, size);
		}
		if (shot) {
			// the window, 4x, y up as on screen; the gap cells in magenta
			const Z = 4, out = new PNG({ width: S * Z, height: S * Z });
			for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
				const k = y * S + x, inR = (x - R) ** 2 + (y - R) ** 2 <= R * R;
				const gap = inR && intended[k] && !all[k];
				const col = gap ? [255, 0, 255] : all[k] ? [rgb[k * 3], rgb[k * 3 + 1], rgb[k * 3 + 2]] : [60, 110, 160];
				for (let yy = 0; yy < Z; yy++) for (let xx = 0; xx < Z; xx++) {
					const o = (((S - 1 - y) * Z + yy) * S * Z + x * Z + xx) * 4;
					out.data[o] = col[0]; out.data[o + 1] = col[1]; out.data[o + 2] = col[2]; out.data[o + 3] = 255;
				}
			}
			fs.writeFileSync(shot, PNG.sync.write(out));
		}
		return n * CELL * CELL;
	};

	/** the clip on track 0 with flutter on track 1, physics stepped at 60fps, visited at 30fps */
	const play = (name, visit) => {
		const anim = data.findAnimation(name);
		const s2 = new core.Skeleton(data);
		const st = new core.AnimationState(new core.AnimationStateData(data));
		st.setAnimation(0, name, false);
		if (data.findAnimation('flutter')) st.setAnimation(1, 'flutter', true);
		s2.setToSetupPose();
		st.apply(s2);
		s2.updateWorldTransform(core.Physics.reset);
		const n = Math.max(1, Math.round(anim.duration * 30));
		for (let i = 0; i <= n * 2; i++) {
			if (i) { st.update(1 / 60); s2.update(1 / 60); st.apply(s2); s2.updateWorldTransform(core.Physics.update); }
			if (i % 2 === 0) visit(s2, i / 60);
		}
	};

	const sk = new core.Skeleton(data);
	sk.setToSetupPose();
	sk.updateWorldTransform(core.Physics.reset);
	const base = Object.fromEntries(JOINTS.map((jt) => [jt.bone, gapAt(sk, jt)]));
	for (const anim of data.animations) {
		if (['flutter', 'blink', 'glint'].includes(anim.name) || (ONLY.length && !ONLY.includes(anim.name))) continue;
		const worst = {};
		play(anim.name, (s2, t) => {
			for (const jt of JOINTS) {
				const g = gapAt(s2, jt) - base[jt.bone];
				if (g > (worst[jt.bone]?.g ?? 0)) worst[jt.bone] = { g, t, label: jt.label };
			}
		});
		const bad = Object.values(worst).filter((w) => w.g > THRESHOLD);
		if (process.env.SEAM_SHOTS) {
			fs.mkdirSync(process.env.SEAM_SHOTS, { recursive: true });
			for (const [bone, w] of Object.entries(worst)) {
				if (w.g <= THRESHOLD) continue;
				play(anim.name, (s2, t) => {
					if (Math.abs(t - w.t) < 1e-6) gapAt(s2, JOINTS.find((j) => j.bone === bone), path.join(process.env.SEAM_SHOTS, `${anim.name}_${bone}.png`));
				});
			}
		}
		failed += bad.length;
		const top = Object.values(worst).sort((a, b) => b.g - a.g)[0];
		console.log(`${anim.name.padEnd(13)} ${bad.length ? 'GAP ' + bad.map((w) => `${w.label} ${w.g}px² @${w.t.toFixed(2)}s`).join(', ') : `ok${top ? ` (worst ${top.label} ${top.g}px²)` : ''}`}`);
	}
}
if (failed) {
	console.log(`check_seams: ${failed} joint(s) open past ${THRESHOLD}px²`);
	process.exitCode = 1;
} else console.log('check_seams: no joint opens');
