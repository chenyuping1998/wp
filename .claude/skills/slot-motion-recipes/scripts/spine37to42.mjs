// Spine 3.7 JSON (what Pragmatic Play ships) -> the 4.2 shape. Shared by pp_extract.mjs and template tools.
// 4.x silently misreads 3.7 rather than rejecting it, so every changed field has to be rewritten:
//  - skins object -> array; rotate `angle` -> `value`; slot `color`/`twoColor` -> `rgba`/`rgba2`
//  - bezier handles: fractions of the segment -> absolute (time, value), one set per animated component
//  - deform moved from animations.deform[skin][slot][att] to animations.attachments[skin][slot][att].deform
//  - transform constraint mixes renamed (rotateMix -> mixRotate, translateMix -> mixX+mixY, ...). A missing mix
//    defaults to 1 in 4.x, so an unconverted -0.6 "back of the head" constraint would silently become +1.
const hex = (c, i) => parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255;
const comps = {
	rotate: (k) => [k.angle ?? k.value ?? 0],
	translate: (k) => [k.x ?? 0, k.y ?? 0], scale: (k) => [k.x ?? 1, k.y ?? 1], shear: (k) => [k.x ?? 0, k.y ?? 0],
	color: (k) => [0, 1, 2, 3].map((i) => hex(k.color ?? 'ffffffff', i)),
	twoColor: (k) => [0, 1, 2, 3].map((i) => hex(k.light ?? 'ffffffff', i)).concat([0, 1, 2].map((i) => hex(k.dark ?? '000000', i))),
	ik: (k) => [k.mix ?? 1, k.softness ?? 0],
	transform: (k) => [k.rotateMix ?? 1, k.translateMix ?? 1, k.translateMix ?? 1, k.scaleMix ?? 1, k.scaleMix ?? 1, k.shearMix ?? 1],
	deform: () => [0], // 4.x deform curves interpolate a 0..1 blend between the two vertex sets
};
const curve = (kind, keys) => keys.map((k, i) => {
	const o = { ...k };
	const next = keys[i + 1];
	if (Array.isArray(k.curve) && next) {
		const c = k.curve, t1 = k.time ?? 0, dt = (next.time ?? 0) - t1;
		const a = comps[kind](k), b = kind === 'deform' ? [1] : comps[kind](next);
		o.curve = a.flatMap((v, j) => [t1 + c[0] * dt, v + c[1] * (b[j] - v), t1 + c[2] * dt, v + c[3] * (b[j] - v)]);
	} else if (Array.isArray(k.curve)) delete o.curve;
	return o;
});
export const convert = (j) => {
	const out = { ...j, skeleton: { ...j.skeleton, spine: '4.2.00' } };
	if (j.skins && !Array.isArray(j.skins)) out.skins = Object.entries(j.skins).map(([name, attachments]) => ({ name, attachments }));
	for (const s of out.skins ?? []) for (const slot of Object.values(s.attachments)) for (const a of Object.values(slot)) {
		if (a.type === 'linkedmesh' && 'deform' in a) { a.timelines = a.deform ? 1 : 0; delete a.deform; }
	}
	out.bones = (j.bones ?? []).map((b) => { const o = { ...b }; if (o.transform) { o.inherit = o.transform; delete o.transform; } return o; });
	out.transform = (j.transform ?? []).map((t) => {
		const o = { ...t };
		const mix = (from, ...to) => { if (from in o) { for (const k of to) o[k] = o[from]; } else for (const k of to) o[k] = 1; delete o[from]; };
		mix('rotateMix', 'mixRotate'); mix('translateMix', 'mixX', 'mixY'); mix('scaleMix', 'mixScaleX', 'mixScaleY'); mix('shearMix', 'mixShearY');
		return o;
	});
	out.animations = {};
	for (const [name, a] of Object.entries(j.animations ?? {})) {
		const o = {};
		if (a.bones) o.bones = Object.fromEntries(Object.entries(a.bones).map(([b, tls]) => [b, Object.fromEntries(Object.entries(tls).map(([k, keys]) => [k, curve(k, keys).map((x) => { if ('angle' in x) { x.value = x.angle; delete x.angle; } return x; })]))]));
		if (a.slots) o.slots = Object.fromEntries(Object.entries(a.slots).map(([s, tls]) => [s, Object.fromEntries(Object.entries(tls).map(([k, keys]) =>
			k === 'color' ? ['rgba', curve('color', keys)] : k === 'twoColor' ? ['rgba2', curve('twoColor', keys)] : [k, keys]))]));
		if (a.ik) o.ik = Object.fromEntries(Object.entries(a.ik).map(([n, keys]) => [n, curve('ik', keys)]));
		if (a.transform) o.transform = Object.fromEntries(Object.entries(a.transform).map(([n, keys]) => [n, curve('transform', keys).map((x) => {
			const r = { ...x };
			for (const [from, to] of [['rotateMix', ['mixRotate']], ['translateMix', ['mixX', 'mixY']], ['scaleMix', ['mixScaleX', 'mixScaleY']], ['shearMix', ['mixShearY']]]) {
				for (const t of to) r[t] = x[from] ?? 1;
				delete r[from];
			}
			return r;
		})]));
		if (a.deform) {
			o.attachments = {};
			for (const [skin, slots] of Object.entries(a.deform)) for (const [slot, atts] of Object.entries(slots)) for (const [att, keys] of Object.entries(atts)) {
				((o.attachments[skin] ??= {})[slot] ??= {})[att] = { deform: curve('deform', keys) };
			}
		}
		for (const k of ['events', 'drawOrder', 'draworder', 'path']) if (a[k]) o[k === 'draworder' ? 'drawOrder' : k] = a[k];
		out.animations[name] = o;
	}
	return out;
};
