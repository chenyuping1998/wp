/**
 * Matter, not light, round a winning symbol (2026-10-24, user: 繼續強化獎圖的動態
 * 效果). This game's wins lost their light on 2026-10-04 (「整個很亮太刺眼」),
 * so the extra punch is STUFF and INK, in normal blend:
 *
 *   sigil   (behind the subject) a transmutation circle — ring, triangle, the
 *           four small elements — inked on the plate as the subject lands,
 *           swelling out from its feet and fading. The game's one verb, drawn.
 *   shards  (behind; the amethyst only) chips of the same cut amethyst as the
 *           big-win spray burst off the top of the crystals and fall away
 *   vapor   (in front) a puff of the lab's green fumes where the subject
 *           lands, and a smaller one as it springs
 *
 * Canvas units (the 256 art), in SymbolMeshWin's content container: `behind`
 * goes under the subject, `front` over it. One burst per win, then still.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';

const VAPOR_TINT = 0x5fdcb0;
const SIGIL = 0x7fe9c8;
const SIGIL_DEEP = 0x1f5a4a;
/** winCrystals frames that are amethyst (the others were recoloured green/amber) */
const AMETHYST = [0, 1, 2, 3, 4, 9];

type Puff = { at: number; x: number; y: number; size: number; alpha: number; life: number };
type Shard = { vx: number; vy: number; spin: number; size: number; sprite: Sprite };

const rand = (seed: number) => {
	let s = seed >>> 0 || 1;
	return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

export type WinFx = { behind: Container; front: Container; update: (t: number, lift: number) => void };

export const makeWinFx = (opts: {
	symbol: string;
	/** where the subject stands, canvas y */
	feetY: number;
	/** the act's take-off, peak and landing, ms */
	crouchMs: number;
	peakMs: number;
	landMs: number;
	fog: Texture[];
	crystals: Texture[] | undefined;
	/** a different burst per cell */
	seed: number;
	/** the subject IS its tile (panel mode): the sigil then rings the tile's
	 *  edge, over it, with no triangle across the face */
	panel?: boolean;
}): WinFx => {
	const behind = new Container();
	const front = new Container();
	behind.label = 'winFx behind';
	front.label = 'winFx front';
	const r = rand(opts.seed);
	const low = opts.symbol.startsWith('L');
	const ringOnly = low || !!opts.panel;

	// ── the sigil ───────────────────────────────────────────────────────────
	const sigil = new Graphics();
	behind.addChild(sigil);
	const SIGIL_AT = opts.landMs - 30;
	const SIGIL_LIFE = low ? 650 : 900;
	// centred on the TILE, inside it at its widest: this container rides on
	// top of the neighbouring cells, so a ring past the edge would ink on them
	const sigilCentre = { x: 128, y: 128 };
	const drawSigil = (t: number) => {
		sigil.clear();
		const u = (t - SIGIL_AT) / SIGIL_LIFE;
		if (u <= 0 || u >= 1) return;
		// inks on fast, then swells and thins out
		const ink = Math.min(1, u / 0.18);
		const R = (opts.panel ? 104 : low ? 70 : 92) * (0.72 + 0.4 * (1 - (1 - u) ** 2));
		const a = (1 - u) ** 1.3;
		const { x, y } = sigilCentre;
		const sweep = Math.PI * 2 * ink;
		const turn = -Math.PI / 2 + u * 0.5;
		// a dark under-stroke first so the line reads on the bright plates too
		for (const [w, c, k] of [[7, SIGIL_DEEP, 0.55], [3.2, SIGIL, 1]] as const) {
			sigil.arc(x, y, R, turn, turn + sweep).stroke({ width: w, color: c, alpha: a * k, cap: 'round' });
			if (!low) sigil.arc(x, y, R * (opts.panel ? 0.92 : 0.8), -turn, -turn - sweep, true).stroke({ width: w * 0.7, color: c, alpha: a * k * 0.9, cap: 'round' });
			if (ink >= 1 && !ringOnly) {
				// the triangle and its four small circles: drawn once the ring is closed
				const pts: number[] = [];
				for (let i = 0; i < 3; i++) {
					const q = turn + (i * Math.PI * 2) / 3;
					pts.push(x + Math.cos(q) * R * 0.8, y + Math.sin(q) * R * 0.8);
				}
				sigil.poly(pts).stroke({ width: w * 0.7, color: c, alpha: a * k, join: 'round' });
				for (let i = 0; i < 4; i++) {
					const q = turn + Math.PI / 4 + (i * Math.PI) / 2;
					sigil.circle(x + Math.cos(q) * R, y + Math.sin(q) * R, R * 0.09).stroke({ width: w * 0.6, color: c, alpha: a * k });
				}
			}
		}
	};

	// ── the amethyst's shards ───────────────────────────────────────────────
	const shards: Shard[] = [];
	const chips = opts.crystals ? AMETHYST.map((i) => opts.crystals![i]).filter(Boolean) : [];
	if (opts.symbol === 'H2' && chips.length) {
		for (let i = 0; i < 6; i++) {
			// off the crown of the cluster, out to either side, never straight up
			const side = i % 2 ? 1 : -1;
			const a = -Math.PI / 2 + side * (0.55 + r() * 0.6);
			const speed = 0.2 + r() * 0.1;
			const sprite = new Sprite(chips[Math.floor(r() * chips.length)]);
			sprite.anchor.set(0.5);
			sprite.visible = false;
			behind.addChild(sprite);
			shards.push({ vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, spin: (r() - 0.5) * 0.02, size: 46 + r() * 20, sprite });
		}
	}

	// ── vapor ───────────────────────────────────────────────────────────────
	const puffs: (Puff & { sprite: Sprite })[] = [];
	const addPuff = (p: Puff) => {
		const tex = opts.fog[puffs.length % opts.fog.length];
		if (!tex) return;
		const sprite = new Sprite(tex);
		sprite.anchor.set(0.5);
		sprite.tint = VAPOR_TINT;
		sprite.alpha = 0;
		front.addChild(sprite);
		puffs.push({ ...p, sprite });
	};
	const k = low ? 0.7 : 1;
	// the spring: a small puff kicked off the plate
	addPuff({ at: opts.crouchMs, x: 128, y: opts.feetY - 6, size: 160 * k, alpha: 0.7, life: 560 });
	// the landing: one either side of the feet, and a wide one behind
	addPuff({ at: opts.landMs - 20, x: 96, y: opts.feetY - 10, size: 210 * k, alpha: 0.9, life: 860 });
	addPuff({ at: opts.landMs, x: 164, y: opts.feetY - 8, size: 200 * k, alpha: 0.85, life: 820 });
	if (!low) addPuff({ at: opts.landMs + 40, x: 128, y: opts.feetY - 26, size: 250, alpha: 0.55, life: 940 });

	const update = (t: number, lift: number) => {
		drawSigil(t);
		for (const p of puffs) {
			const u = (t - p.at) / p.life;
			if (u <= 0 || u >= 1) {
				p.sprite.alpha = 0;
				continue;
			}
			// swells fast, thins slowly, drifts up a little
			const grow = 0.55 + 0.75 * (1 - (1 - u) ** 3);
			p.sprite.position.set(p.x, p.y - 18 * u);
			p.sprite.width = p.size * grow;
			p.sprite.height = p.size * 0.5 * grow;
			p.sprite.alpha = p.alpha * Math.min(1, u / 0.12) * (1 - u) ** 1.6;
		}
		const ts = t - opts.peakMs;
		for (const s of shards) {
			if (ts <= 0 || ts > 560) {
				s.sprite.visible = false;
				continue;
			}
			s.sprite.visible = true;
			// from the crown where it is at the peak; gravity in px/ms²
			const x = 128 + s.vx * ts;
			const y = 54 + lift * 0.8 + s.vy * ts + 0.0009 * ts * ts;
			s.sprite.position.set(x, y);
			s.sprite.rotation = s.spin * ts;
			s.sprite.width = s.sprite.height = s.size * Math.min(1, ts / 70);
			s.sprite.alpha = ts < 360 ? 1 : 1 - (ts - 360) / 200;
		}
	};

	return { behind, front, update };
};
