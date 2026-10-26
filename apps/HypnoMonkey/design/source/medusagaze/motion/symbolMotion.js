// @ts-nocheck
// Generated browser review module; types are checked in the original app TypeScript.
/** Original app-owned motion. No competitor pixels, rigs or keyframes. */
export const clamp01 = (x        ) => Math.max(0, Math.min(1, x));
export const smooth = (x        ) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const windowPulse = (t        ) => Math.sin(Math.PI * clamp01(t));
const local = (x        , y        , cx        , cy        , rx        , ry        ) =>
	Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));

export const symbolPose = (name        , time        ) => {
	const t = clamp01(time), hit = windowPulse(t), recoil = Math.sin(t * Math.PI * 3) * hit;
	const pose = { x: 0, y: 0, rotation: 0, sx: 1, sy: 1, glint: hit ** 3 * 0.28 };
	if (name === 'H1') { pose.y = -0.045 * hit; pose.rotation = -0.035 * recoil; }
	else if (name === 'H2') { pose.y = -0.023 * hit; pose.rotation = 0.045 * recoil; }
	else if (name === 'H3') { pose.rotation = -0.065 * hit; pose.y = -0.015 * hit; }
	else if (name === 'H4') { pose.rotation = 0.115 * recoil; pose.y = -0.02 * hit; }
	else if (name === 'H5') { pose.y = -0.025 * hit; pose.rotation = 0.025 * recoil; }
	else if (name === 'S') { pose.sx = 1 + 0.055 * hit; pose.sy = 1 + 0.055 * hit; }
	else { pose.sx = 1 - 0.12 * hit; pose.rotation = (name === 'L2' || name === 'L4' ? -1 : 1) * 0.055 * hit; pose.y = -0.025 * hit; }
	return pose;
};

/** Guides measured from 1254px originals and transformed into the 512px canvas. */
export const SYMBOL_ART_GUIDES = {
	H1: { head: [0.3057, 0.2587], neck: [0.4926, 0.3270] },
	H2: { crest: [0.6051, 0.2378], eyeL: [0.2784, 0.6145], eyeR: [0.4361, 0.6286] },
	H3: { strings: [0.4980, 0.4274], broken: [0.6490, 0.5278] },
	H4: { handleL: [0.2280, 0.3237], handleR: [0.7598, 0.3237] },
	H5: { leaf: [0.8134, 0.8134] },
}         ;

/** Preserve the painted texture during local acting. No flat eyes or leaves
 * cover the polished artwork. These modest actions are not a layered Spine rig. */
export const symbolPoint = (name        , u        , v        , time        ) => {
	const t = clamp01(time), hit = windowPulse(t), lag = Math.sin(t * Math.PI * 3) * hit;
	let x = u - 0.5, y = v - 0.5;
	if (name === 'H1') {
		const head = local(u, v, ...SYMBOL_ART_GUIDES.H1.head, 0.17, 0.12);
		const neck = local(u, v, ...SYMBOL_ART_GUIDES.H1.neck, 0.14, 0.13);
		x += head * 0.016 * lag + neck * 0.009 * lag;
		y -= head * 0.032 * hit + neck * 0.010 * hit;
	} else if (name === 'H2') {
		x += local(u, v, ...SYMBOL_ART_GUIDES.H2.crest, 0.23, 0.15) * 0.030 * lag;
		for (const eye of [SYMBOL_ART_GUIDES.H2.eyeL, SYMBOL_ART_GUIDES.H2.eyeR]) {
			const weight = local(u, v, eye[0], eye[1], 0.065, 0.075);
			x += (u - eye[0]) * weight * 0.12 * hit;
			y += (v - eye[1]) * weight * 0.12 * hit;
		}
	} else if (name === 'H3') {
		const string = local(u, v, ...SYMBOL_ART_GUIDES.H3.strings, 0.11, 0.22);
		const broken = local(u, v, ...SYMBOL_ART_GUIDES.H3.broken, 0.08, 0.12);
		x += string * 0.012 * Math.sin(t * Math.PI * 10) * hit;
		y += broken * 0.022 * lag;
	} else if (name === 'H4') {
		const guide = u < 0.5 ? SYMBOL_ART_GUIDES.H4.handleL : SYMBOL_ART_GUIDES.H4.handleR;
		const handle = local(u, v, guide[0], guide[1], 0.09, 0.14);
		y += handle * 0.016 * lag * (u < 0.5 ? 1 : -1);
	} else if (name === 'H5') {
		const leaf = local(u, v, ...SYMBOL_ART_GUIDES.H5.leaf, 0.10, 0.10);
		x += (u - 0.5) * 0.06 * hit * Math.max(0, 1 - v) + leaf * 0.040 * hit;
		y -= Math.abs(u - 0.5) * 0.020 * lag;
		y += leaf * 0.060 * hit;
	}
	return { x, y };
};

                                                                                                                                                                                 
/** Retained review API; production artwork supplies all its painted details. */
export const symbolAccents = (_name        , _time        )           => [];

/** Foot stays planted while a falling object compresses, overshoots and settles. */
export const landingPose = (time        , weight = 1) => {
	const t = clamp01(time), k = Math.max(0, Math.min(1.5, weight));
	const keys = [
		[0, 1, 1], [0.24, 1 + 0.055 * k, 1 - 0.09 * k],
		[0.57, 1 - 0.018 * k, 1 + 0.038 * k], [1, 1, 1],
	];
	let i = 1; while (i < keys.length - 1 && t > keys[i][0]) i++;
	const a = keys[i - 1], b = keys[i], f = smooth((t - a[0]) / (b[0] - a[0]));
	const sx = a[1] + (b[1] - a[1]) * f, sy = a[2] + (b[2] - a[2]) * f;
	return { sx, sy, y: (1 - sy) * 0.5 };
};

export const gravityProgress = (time        ) => { const t = clamp01(time); return t * t * (0.82 + 0.18 * t); };
export const fallDuration = (rows        , budgetMs        ) => rows <= 0 ? 0 : budgetMs * (0.72 + 0.28 * Math.sqrt(Math.min(6, rows) / 6));
const travels = new WeakMap                                      ();
export const recordSymbolTravel = (carrier        , from        , to        ) => travels.set(carrier, { from, to });
export const symbolTravelBlur = (carrier        , y        ) => {
	const move = travels.get(carrier);
	if (!move || move.to <= move.from) return 0;
	const progress = clamp01((y - move.from) / (move.to - move.from));
	return Math.min(0.55, (move.to - move.from) / 588 * 0.55) * windowPulse(progress) ** 0.6;
};

                                                                                                            
/** Actual refill contract shared by the game and the motion review. Padding is
 * retained; the old top padding becomes the last incoming visible symbol. */
export const planCascadeColumn =    (column     , removed          , incoming     , visibleRows = 6) => {
	if (column.length !== visibleRows + 2) throw new Error('Unexpected padded column length');
	const rows = new Set(removed), free = [...rows].sort((a, b) => a - b);
	if (free.some((row) => row < 1 || row > visibleRows)) throw new Error('Cannot remove padding');
	if (!free.length) return { column: [...column], moves: []                     };
	if (incoming.length !== free.length) throw new Error('Refill count does not match removed cells');
	const survivors = Array.from({ length: visibleRows }, (_, i) => i + 1).filter((row) => !rows.has(row));
	const falling = [...incoming.slice(1), column[0]];
	const moves                   = [
		...survivors.map((from, i) => ({ carrier: from, from, to: 1 + falling.length + i, rawSymbol: column[from], incoming: false })),
		...falling.map((rawSymbol, i) => ({ carrier: free[i], from: 1 - falling.length + i, to: 1 + i, rawSymbol, incoming: true })),
	];
	return { column: [incoming[0], ...falling, ...survivors.map((row) => column[row]), column[visibleRows + 1]], moves };
};

// Five irregular, gap-free pieces. UVs remain on the original symbol texture.
export const FRACTURE_PIECES = [
	[[-0.025, -0.015], [-0.5, -0.5], [0.10, -0.5]],
	[[-0.025, -0.015], [0.10, -0.5], [0.5, -0.5], [0.5, 0.12]],
	[[-0.025, -0.015], [0.5, 0.12], [0.5, 0.5], [0.05, 0.5]],
	[[-0.025, -0.015], [0.05, 0.5], [-0.5, 0.5], [-0.5, 0.06]],
	[[-0.025, -0.015], [-0.5, 0.06], [-0.5, -0.5]],
]         ;
export const fragmentPose = (index        , time        , seed = 0) => {
	const t = clamp01(time), angle = [-2.15, -0.78, 0.36, 1.45, 2.95][index];
	const burst = 0.35 + (index % 3) * 0.085 + (seed % 7) * 0.006;
	return { x: Math.cos(angle) * burst * t, y: Math.sin(angle) * burst * t - 0.18 * t + 0.83 * t * t,
		rotation: (index % 2 ? 1 : -1) * (0.55 + index * 0.16) * t,
		scale: 1 - 0.20 * t, alpha: 1 - smooth((t - 0.4) / 0.6) };
};
