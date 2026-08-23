// Shared surface finishes for the SVG art generators.
//
// The certification feedback called out "gradient fills that don't meet visual
// quality standards". The pipeline had ~180 gradient definitions and almost no
// surface detail on top of them, so every panel read as flat vector: one linear
// ramp, one stroke, done. Real painted/rendered art carries four things a bare
// gradient does not —
//
//   · TOOTH      fine grain, so flats are never mathematically smooth
//   · WEAR       mottling and scratches that follow the object's history
//   · OPTICS     a specular sweep and a lit top edge, so it reads as a material
//   · CONTACT    ambient occlusion where surfaces meet, so parts sit *in* each
//                other rather than floating side by side
//
// These helpers supply all four as reusable SVG. Import the defs once per
// document, then drop the overlay elements on top of the existing fills — the
// gradients stay as the base tone and stop being the whole story.

/** Filter/gradient definitions. Drop inside <defs>. `p` prefixes every id so
 *  two generators can share one document without colliding. */
export const surfaceDefs = (p = 'sf') => `
	<!-- fine tooth: keeps large flats from reading as mathematically smooth -->
	<filter id="${p}Grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="31" result="t"/>
		<feColorMatrix in="t" type="matrix"
			values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.07 0.07 0.07 0 0"/>
	</filter>

	<!-- brushed metal: noise stretched along x so it streaks like a grind -->
	<filter id="${p}Brushed" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.006 0.85" numOctaves="3" seed="12" result="t"/>
		<feColorMatrix in="t" type="matrix"
			values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.16 0.16 0.16 0 0"/>
	</filter>

	<!-- sparse long scratches: same trick, far lower density, brighter -->
	<filter id="${p}Scratch" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.004 1.4" numOctaves="1" seed="53" result="t"/>
		<feColorMatrix in="t" type="matrix"
			values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.85  0 0 0 2.2 -1.35"/>
	</filter>

	<!-- broad mottling: uneven patina, the opposite of an even gradient -->
	<filter id="${p}Mottle" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="88" result="t"/>
		<feColorMatrix in="t" type="matrix"
			values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.22 0.22 0.22 0 -0.06"/>
	</filter>

	<!-- inner shadow: the single strongest cue that a panel is recessed -->
	<filter id="${p}Inner" x="-20%" y="-20%" width="140%" height="140%">
		<feOffset dx="0" dy="5" in="SourceAlpha" result="o"/>
		<feGaussianBlur in="o" stdDeviation="6" result="b"/>
		<feComposite operator="out" in="SourceAlpha" in2="b" result="inv"/>
		<feFlood flood-color="#000000" flood-opacity="0.55" result="c"/>
		<feComposite operator="in" in="c" in2="inv" result="sh"/>
		<feComposite operator="over" in="sh" in2="SourceGraphic"/>
	</filter>

	<!-- emboss for small shapes (icons): lit from above, shadowed below -->
	<filter id="${p}Emboss" x="-30%" y="-30%" width="160%" height="160%">
		<feDropShadow dx="0" dy="-2" stdDeviation="1.4" flood-color="#FFF0C4" flood-opacity="0.75"/>
		<feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#241408" flood-opacity="0.85"/>
	</filter>

	<!-- diagonal specular band; sweep across a surface to read as a highlight -->
	<linearGradient id="${p}Spec" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0.10" stop-color="#ffffff" stop-opacity="0"/>
		<stop offset="0.36" stop-color="#ffffff" stop-opacity="0.30"/>
		<stop offset="0.46" stop-color="#ffffff" stop-opacity="0.06"/>
		<stop offset="0.60" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>

	<!-- lit top edge / shaded bottom, applied over the whole piece -->
	<linearGradient id="${p}Edge" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.26"/>
		<stop offset="0.14" stop-color="#ffffff" stop-opacity="0"/>
		<stop offset="0.82" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.34"/>
	</linearGradient>

	<!-- contact shadow: darkens the inside border so contents sit *in* the frame -->
	<radialGradient id="${p}Ao" cx="0.5" cy="0.5" r="0.72">
		<stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
	</radialGradient>`;

/** Stack the finish passes over a rect. Call after the base fill is drawn. */
export const finishRect = (x, y, w, h, rx, p = 'sf', o = {}) => {
	const { grain = 0.55, brushed = 0, scratch = 0, mottle = 0.5, spec = 1, edge = 1, ao = 0 } = o;
	const r = (fill, op, filter) =>
		op > 0
			? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${filter ? `filter="url(#${p}${filter})"` : `fill="${fill}"`} opacity="${op}"/>`
			: '';
	return [
		r(null, grain, 'Grain'),
		r(null, brushed, 'Brushed'),
		r(null, mottle, 'Mottle'),
		r(null, scratch, 'Scratch'),
		r(`url(#${p}Spec)`, spec),
		r(`url(#${p}Edge)`, edge),
		r(`url(#${p}Ao)`, ao),
	].join('');
};

// ── material presets ────────────────────────────────────────────────────────
// Picked per material rather than per element: cloth has no specular sweep to
// speak of, brass does, and painted steel sits between the two. Using one
// generic finish everywhere is what makes procedural art look procedural.

/** Olive drill canvas — tooth and uneven dye, almost no specular. */
export const CANVAS_FINISH = { grain: 0.6, mottle: 0.5, spec: 0.22, edge: 0.9, ao: 0.45 };

/** Brass / gold trim — ground finish, scratches, a real highlight. */
export const BRASS_FINISH = { grain: 0.25, brushed: 0.5, scratch: 0.5, mottle: 0.28, spec: 1, edge: 1, ao: 0.3 };

/** Painted steel — between the two: some sheen, visible wear. */
export const STEEL_FINISH = { grain: 0.4, brushed: 0.28, scratch: 0.3, mottle: 0.45, spec: 0.5, edge: 1, ao: 0.35 };

/** Matte backdrop (the plate behind the reels). Texture only — no specular
 *  sweep and almost no edge light: a highlight band there competes with the
 *  symbols sitting on top of it, which is the one thing this surface must not
 *  do. */
export const BACKDROP_FINISH = { grain: 0.65, mottle: 0.55, spec: 0, edge: 0.3, ao: 0.5 };
