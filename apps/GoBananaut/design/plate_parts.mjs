// Shared parts for the game's three "plaque" families: the win-tier banners
// (generate_win_banners.mjs), and the free-spin sign and counter panel
// (generate_theme_jungle.mjs).
//
// THE SAME KIT ON ALL THREE, and the reason is the reason Go Bananubis built its
// tablets the same way: the player reads the sign at the START of the feature,
// the counter all the way through it, and the banner at the moment it pays. Three
// different frames would say three different products.
//
// THE FRAME IS PLAIN GUNMETAL, AND THAT IS A REVERSAL. The first version of this
// kit carried a band of status lights round every plate — cells in ice, white and
// signal yellow — and a satellite with inlaid wings. It looked like a control
// panel, and it put a ring of saturated colour round the one thing on each plate
// that is supposed to be the picture. So the frame now carries no colour at all:
// dark steel, a lit edge, hex bolts. Everything that says SPACE moved onto the
// FACE of the plate, where it can be a sky.
//
// WHAT IS LEFT OF THE OLD KIT:
//
//   hex bolt housings    six-sided steel bolts at the corners, no LED.
//   the satellite        a metal core with a dark solar array a side and an
//                        antenna beside it — the same construction as the winged
//                        sun it stands in for, drawn in the frame's own steel.
//
// WHAT IS NEW: a starfield and a galaxy band, below. They are what the plates are
// FOR now.
//
// IDS ARE PREFIXED `sp` so this can be dropped into any document alongside the
// generators' own gradients (`brass`, `rivet`, `signVign` ...) without a clash.

export const PLATE_DEFS = `
	<!-- The setting: gunmetal, lit from the top left. It is a DARK ramp on purpose —
	     the earlier one ran to #f4f8fa and read as a white border round every plate,
	     which is the opposite of a frame that is meant to hold a picture. -->
	<linearGradient id="spSteel" x1="0.15" y1="0" x2="0.6" y2="1">
		<stop offset="0" stop-color="#aab7c0"/>
		<stop offset="0.28" stop-color="#6f7e8a"/>
		<stop offset="0.62" stop-color="#3f4a53"/>
		<stop offset="1" stop-color="#1b2329"/>
	</linearGradient>
	<radialGradient id="spHex" cx="0.35" cy="0.3" r="0.9">
		<stop offset="0" stop-color="#8f9ca6"/>
		<stop offset="0.6" stop-color="#4b5761"/>
		<stop offset="1" stop-color="#1f272d"/>
	</radialGradient>
	<linearGradient id="spPanel" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#2c3842"/>
		<stop offset="1" stop-color="#10161b"/>
	</linearGradient>
	<radialGradient id="spIce" cx="0.35" cy="0.3" r="0.8">
		<stop offset="0" stop-color="#f2fdff"/>
		<stop offset="0.45" stop-color="#7fdcf7"/>
		<stop offset="1" stop-color="#1b7d9c"/>
	</radialGradient>
	<filter id="spSoft" x="-60%" y="-60%" width="220%" height="220%">
		<feGaussianBlur stdDeviation="14"/>
	</filter>
	<filter id="spGlow" x="-200%" y="-200%" width="500%" height="500%">
		<feGaussianBlur stdDeviation="2.4"/>
	</filter>`;

/** Six-sided steel bolt housings. No LED: the frame carries no colour. */
export const hexStuds = (points, r) =>
	points
		.map(([x, y]) => {
			const hex = Array.from({ length: 6 }, (_, k) => {
				const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
				return `${(x + Math.cos(a) * r * 1.08).toFixed(1)},${(y + Math.sin(a) * r * 1.08).toFixed(1)}`;
			}).join(' ');
			return (
				`<polygon points="${hex}" fill="url(#spHex)" stroke="#0e1418" stroke-width="3" stroke-linejoin="round"/>` +
				`<circle cx="${x}" cy="${y}" r="${r * 0.44}" fill="#12181d" stroke="#6d7c88" stroke-width="2"/>` +
				`<ellipse cx="${x - r * 0.14}" cy="${y - r * 0.18}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#c9d3da" opacity="0.55"/>`
			);
		})
		.join('');

/**
 * The satellite, centred on (cx, cy) and scaled about it.
 *
 * Built the way the winged sun it stands in for was: a disc, three rows of
 * segments running out each side, and something rising beside the disc. Here it
 * is all frame metal — a dark array, a steel core, an antenna — so it sits on the
 * setting like part of it rather than as a coloured badge.
 */
export const satellite = (cx, cy, scale = 1) => {
	let out = '';
	for (const d of [-1, 1]) {
		for (let row = 0; row < 3; row++) {
			const len = [170, 140, 108][row];
			const y0 = -16 + row * 11;
			const n = 9;
			for (let i = 0; i < n; i++) {
				const x0 = d * (32 + (i / n) * len);
				const x1 = d * (32 + ((i + 1) / n) * len);
				const drop = (i / n) * 12;
				out += `<path d="M ${x0.toFixed(1)} ${(y0 + drop).toFixed(1)} L ${x1.toFixed(1)} ${(y0 + drop + 1.3).toFixed(1)} L ${x1.toFixed(1)} ${(y0 + drop + 12.3).toFixed(1)} L ${x0.toFixed(1)} ${(y0 + drop + 11).toFixed(1)} Z" fill="url(#spPanel)" stroke="#5b6a76" stroke-width="1.6"/>`;
			}
		}
		out +=
			`<path d="M ${d * 26} 20 L ${d * 26} -32" stroke="#8a97a1" stroke-width="5" stroke-linecap="round"/>` +
			`<path d="M ${d * 26} 20 L ${d * 26} -32" stroke="#2a343b" stroke-width="1.6" stroke-linecap="round"/>` +
			`<circle cx="${d * 26}" cy="-38" r="6.5" fill="url(#spHex)" stroke="#0e1418" stroke-width="2.5"/>`;
	}
	out +=
		`<circle cx="0" cy="0" r="27" fill="url(#spSteel)" stroke="#0e1418" stroke-width="3"/>` +
		`<circle cx="0" cy="0" r="17" fill="#141b20" stroke="#6d7c88" stroke-width="2.4"/>` +
		`<circle cx="0" cy="0" r="7" fill="url(#spHex)"/>` +
		`<ellipse cx="-6" cy="-8" rx="6" ry="3.4" fill="#c9d3da" opacity="0.5"/>`;
	return `<g transform="translate(${cx} ${cy}) scale(${scale})">${out}</g>`;
};

/** A small ringed planet — the counter panel's emblem, on the face. */
export const ringedPlanet = (cx, cy, s = 1) => `
<g transform="translate(${cx} ${cy}) scale(${s})">
	<path d="M -62 6 A 62 16 0 0 1 62 6" fill="none" stroke="#a9b6bf" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
	<circle cx="0" cy="0" r="27" fill="url(#spIce)" stroke="#0a3a4c" stroke-width="3"/>
	<ellipse cx="-8" cy="-9" rx="8" ry="5" fill="#ffffff" opacity="0.55"/>
	<path d="M -62 6 A 62 16 0 0 0 62 6" fill="none" stroke="#c9d3da" stroke-width="6" stroke-linecap="round"/>
	<path d="M -62 6 A 62 16 0 0 0 62 6" fill="none" stroke="#1a232a" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
</g>`;

// ── THE SKY ─────────────────────────────────────────────────────────────────

const rng = (seedStart) => {
	let seed = seedStart >>> 0;
	return () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 4294967296;
	};
};

const inAny = (x, y, rects) => rects.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);

/**
 * A starfield in three depths, deterministic per `seed` so a regenerated plate
 * does not churn in git.
 *
 *   far    a great many pin-pricks, dim, in every colour of starlight. These are
 *          allowed everywhere, keep-out or not: at 0.5-1px and a third opacity
 *          they sit under the type as texture, and a sky with a hole cut in it for
 *          the text is what a placard looks like.
 *   mid    fewer, larger, brighter.
 *   near   a handful of bright stars with a glow and a cross of spikes. These are
 *          the ones the eye lands on, so they stay OUT of `keepOut` — the regions
 *          the frontend draws its type and numbers into.
 *
 * Starlight is not white. The colours are a cool blue-white, a warm cream and a
 * faint orange, in the proportions of the real thing: mostly cool.
 */
export const starfield = ({ x0, y0, x1, y1, seed = 1, far = 130, mid = 44, near = 9, keepOut = [] }) => {
	const r = rng(seed);
	const COOL = ['#dfe9ff', '#cfe3ff', '#e8f1ff', '#dfe9ff'];
	const WARM = ['#fff1d6', '#ffe9c4', '#ffd9a8'];
	const pick = () => (r() < 0.78 ? COOL[Math.floor(r() * COOL.length)] : WARM[Math.floor(r() * WARM.length)]);
	const at = () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)];
	let out = '';

	for (let i = 0; i < far; i++) {
		const [x, y] = at();
		out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + r() * 0.6).toFixed(2)}" fill="${pick()}" opacity="${(0.22 + r() * 0.34).toFixed(2)}"/>`;
	}
	for (let i = 0, placed = 0; placed < mid && i < mid * 6; i++) {
		const [x, y] = at();
		if (inAny(x, y, keepOut)) continue;
		placed++;
		out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + r() * 0.9).toFixed(2)}" fill="${pick()}" opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`;
	}
	for (let i = 0, placed = 0; placed < near && i < near * 12; i++) {
		const [x, y] = at();
		if (inAny(x, y, keepOut)) continue;
		placed++;
		const c = pick();
		const rad = 2 + r() * 1.4;
		const spike = rad * (4 + r() * 3);
		out +=
			`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad * 3.4).toFixed(1)}" fill="${c}" opacity="0.32" filter="url(#spGlow)"/>` +
			`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="#ffffff"/>` +
			`<path d="M ${(x - spike).toFixed(1)} ${y.toFixed(1)} L ${(x + spike).toFixed(1)} ${y.toFixed(1)} M ${x.toFixed(1)} ${(y - spike).toFixed(1)} L ${x.toFixed(1)} ${(y + spike).toFixed(1)}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" opacity="0.75"/>`;
	}
	return out;
};

/**
 * A galaxy band: a long soft smear of light across the sky, with the fine dust
 * that lies along it. Rotated about its own centre by `angle` degrees.
 *
 * Its job is DEPTH. A field of independent dots is a flat sheet with holes in it;
 * something large and faint behind them is what makes the dots read as being at
 * different distances.
 */
export const galaxyBand = ({ cx, cy, rx, ry, angle = -16, colour = '#dfe9ff', seed = 7, dust = 110, strength = 0.16 }) => {
	const r = rng(seed);
	let specks = '';
	for (let i = 0; i < dust; i++) {
		// gaussian-ish: the mean of three uniforms, so specks pile up on the axis
		const gx = ((r() + r() + r()) / 3 - 0.5) * 2;
		const gy = ((r() + r() + r()) / 3 - 0.5) * 2;
		specks += `<circle cx="${(gx * rx).toFixed(1)}" cy="${(gy * ry * 0.7).toFixed(1)}" r="${(0.5 + r() * 0.9).toFixed(2)}" fill="${colour}" opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`;
	}
	return (
		`<g transform="translate(${cx} ${cy}) rotate(${angle})">` +
		`<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${colour}" opacity="${strength}" filter="url(#spSoft)"/>` +
		`<ellipse cx="0" cy="0" rx="${rx * 0.7}" ry="${ry * 0.4}" fill="#ffffff" opacity="${strength * 0.7}" filter="url(#spSoft)"/>` +
		specks +
		`</g>`
	);
};

/** A soft cloud of one colour: the nebula a tier is tinted by. */
export const nebula = (cx, cy, rx, ry, colour, opacity = 0.3) =>
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${colour}" opacity="${opacity}" filter="url(#spSoft)"/>`;

/** A planet's limb: the curved edge of something large, lit along its rim. */
export const planetLimb = ({ cx, cy, rx, ry, rim = '#8fb4ff', body = '#04070d' }) =>
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${body}"/>` +
	// THE GLOW IS STACKED STROKES, NOT A BLUR. These ellipses are far larger than
	// the plate with their centre below it, and resvg panics (geom.rs unwrap on an
	// empty rect) when a filter region on such a shape misses the canvas.
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="30" opacity="0.05"/>` +
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="18" opacity="0.09"/>` +
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="8" opacity="0.2"/>` +
	`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="2.4" opacity="0.7"/>`;

/** A shooting star: a bright head and a tail that fades along its length. */
export const shootingStar = (x, y, length, angleDeg, colour = '#ffffff') => {
	const a = (angleDeg * Math.PI) / 180;
	const tx = x - Math.cos(a) * length;
	const ty = y - Math.sin(a) * length;
	return (
		`<defs><linearGradient id="ss${Math.round(x)}${Math.round(y)}" gradientUnits="userSpaceOnUse" x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${x}" y2="${y}">` +
		`<stop offset="0" stop-color="${colour}" stop-opacity="0"/><stop offset="1" stop-color="${colour}" stop-opacity="0.95"/></linearGradient></defs>` +
		`<path d="M ${tx.toFixed(1)} ${ty.toFixed(1)} L ${x} ${y}" stroke="url(#ss${Math.round(x)}${Math.round(y)})" stroke-width="3" stroke-linecap="round"/>` +
		`<circle cx="${x}" cy="${y}" r="3.4" fill="#ffffff"/>` +
		`<circle cx="${x}" cy="${y}" r="9" fill="${colour}" opacity="0.4" filter="url(#spGlow)"/>`
	);
};
