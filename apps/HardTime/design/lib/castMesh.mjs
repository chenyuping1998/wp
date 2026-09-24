/**
 * The cast mesh, posed and measured — shared by check_cast_motion.mjs (rule 10)
 * and measure_joint_limits.mjs, so the gate and the numbers it enforces are
 * measured by the same code.
 *
 * Posing calls castMotion.ts composeBoneMatrices / skinVertices, the SAME
 * functions skinnedFigure.ts renders with. Nothing here re-derives the matrix
 * maths: a measuring script with its own copy measures the copy.
 */
import fs from 'fs';
import path from 'path';

import { readAlpha } from './pngAlpha.mjs';

/** Alpha above this is ink. */
export const OPAQUE = 8;
/** An inked triangle may not shrink under this fraction of its rest area... */
export const FOLD_FLOOR = 0.5;
/** ...or grow past this. Both are the reference pipeline's own thresholds. */
export const STRETCH_CAP = 1.6;

/**
 * The texture that SHIPS for the mesh cast, read out of game/assets.ts rather
 * than written down a second time. Hard Time's static/assets/meshRigs/cast_guy/
 * holds a guy.png that is NOT what the player sees (a leftover Capo sheet), so a
 * gate that assumed `<rig>.png` would have measured ink on someone else's art.
 */
export function shippedTexturePath(appRoot, key = 'hmCastGuyMesh') {
	const assets = fs.readFileSync(path.join(appRoot, 'src/game/assets.ts'), 'utf8');
	// `new URL('../../assets/...')` is served from static/assets — the same
	// resolution check_assets_exist.mjs uses.
	const match = assets.match(new RegExp(`${key}:\\s*\\{[^}]*?new URL\\('\\.\\./\\.\\./assets/([^']+)'`));
	if (!match) throw new Error(`game/assets.ts has no '${key}' entry with a new URL('../../assets/...') src`);
	return path.join(appRoot, 'static/assets', match[1]);
}

/**
 * Load the rig and the shipped texture, work out which triangles carry ink, and
 * return a poser that yields every triangle's signed area.
 *
 * INK IS SAMPLED THROUGH THE UVs. The renderer maps UV = vertex / rig.size, so
 * a texture whose pixel size differs from rig.size is stretched to fit — which
 * is exactly Hard Time's case: prisoner.png is 441x1100, the rig is 512x1024
 * (kept that way on purpose, see design/build_cast_guy_rig.py). A vertex at rig
 * (x, y) shows texture pixel (x * texW / rigW, y * texH / rigH).
 */
export function loadCastMesh(appRoot, motion, { rigPath, texturePath } = {}) {
	const { buildWeightIndex, composeBoneMatrices, skinVertices } = motion;
	rigPath ??= path.join(appRoot, 'static/assets/meshRigs/cast_guy/guy.rig.json');
	texturePath ??= shippedTexturePath(appRoot);
	const rig = JSON.parse(fs.readFileSync(rigPath, 'utf8'));
	const { width: pngW, height: pngH, alpha } = readAlpha(fs.readFileSync(texturePath));
	const toTexX = pngW / rig.size[0];
	const toTexY = pngH / rig.size[1];
	const alphaAt = (x, y) => {
		const px = Math.min(pngW - 1, Math.max(0, Math.round(x * toTexX)));
		const py = Math.min(pngH - 1, Math.max(0, Math.round(y * toTexY)));
		return alpha[py * pngW + px];
	};

	// The mesh is a plain grid over the WHOLE image, so a large share of it sits
	// in transparent margin. Those triangles fold freely and invisibly; gating on
	// them fails the build for a defect no player can see. Seven samples per
	// triangle (corners, edge midpoints, centroid): a cell is 32x26px, so a
	// sliver of ink that slips between all seven is smaller than its own
	// anti-aliased edge.
	const tris = rig.tris;
	const inked = tris.map(([i, j, k]) => {
		const p = rig.verts[i];
		const q = rig.verts[j];
		const r = rig.verts[k];
		const samples = [
			p, q, r,
			[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2],
			[(q[0] + r[0]) / 2, (q[1] + r[1]) / 2],
			[(r[0] + p[0]) / 2, (r[1] + p[1]) / 2],
			[(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3],
		];
		return samples.some(([x, y]) => alphaAt(x, y) > OPAQUE);
	});

	const index = buildWeightIndex(rig);
	const matrices = rig.bones.map(() => new Float32Array(6));
	const chain = rig.bones.map(() => new Float32Array(6));
	const rest = new Float32Array(rig.verts.length * 2);
	rig.verts.forEach(([x, y], i) => {
		rest[i * 2] = x;
		rest[i * 2 + 1] = y;
	});
	const out = new Float32Array(rest);

	const signedAreas = (v) => {
		const areas = new Float64Array(tris.length);
		for (let t = 0; t < tris.length; t += 1) {
			const [i, j, k] = tris[t];
			const px = v[i * 2], py = v[i * 2 + 1];
			const qx = v[j * 2], qy = v[j * 2 + 1];
			const rx = v[k * 2], ry = v[k * 2 + 1];
			areas[t] = 0.5 * ((qx - px) * (ry - py) - (rx - px) * (qy - py));
		}
		return areas;
	};
	const a0 = signedAreas(rest);
	const poseAreas = (state) => {
		composeBoneMatrices(rig, state, matrices, chain);
		skinVertices(rest, index, matrices, out);
		return signedAreas(out);
	};

	// Which bone owns a triangle and where it is, so a failure names one joint
	// and one pixel instead of "a triangle folded".
	const triBone = tris.map(([i, j, k]) => {
		const total = new Array(rig.bones.length).fill(0);
		for (const v of [i, j, k]) rig.weights[v].forEach((w, b) => (total[b] += w));
		return rig.bones[total.indexOf(Math.max(...total))].name;
	});
	const triCentre = tris.map(([i, j, k]) => [
		Math.round((rig.verts[i][0] + rig.verts[j][0] + rig.verts[k][0]) / 3),
		Math.round((rig.verts[i][1] + rig.verts[j][1] + rig.verts[k][1]) / 3),
	]);

	const newAcc = () => ({ flips: 0, shrink: 1, grow: 1, shrinkAt: undefined, growAt: undefined });
	const measure = (areas, acc) => {
		for (let t = 0; t < areas.length; t += 1) {
			if (!inked[t]) continue;
			if (Math.sign(areas[t]) !== Math.sign(a0[t])) acc.flips += 1;
			const ratio = Math.abs(areas[t]) / Math.max(Math.abs(a0[t]), 1e-9);
			if (ratio < acc.shrink) {
				acc.shrink = ratio;
				acc.shrinkAt = t;
			}
			if (ratio > acc.grow) {
				acc.grow = ratio;
				acc.growAt = t;
			}
		}
		return acc;
	};
	const passes = (acc) => acc.flips === 0 && acc.shrink >= FOLD_FLOOR && acc.grow <= STRETCH_CAP;
	const where = (t) => (t === undefined ? 'nowhere' : `${triBone[t]} at ${triCentre[t][0]},${triCentre[t][1]}px`);

	return {
		rig,
		rigPath,
		texturePath,
		texture: { width: pngW, height: pngH },
		alphaAt,
		inked,
		inkedCount: inked.filter(Boolean).length,
		poseAreas,
		newAcc,
		measure,
		passes,
		where,
	};
}
