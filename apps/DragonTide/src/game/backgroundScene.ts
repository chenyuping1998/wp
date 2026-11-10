import { Container, Graphics, MeshPlane, Sprite, Texture } from 'pixi.js';
import { BACKGROUND_SIZE } from './backgroundMotion';

// Dragon Tide backdrops (art/backgrounds v2, 1920x1080): moonlit sea for the base game,
// the undersea palace hall for the free game, crossfaded on setNight. Both already fade
// to paper on the right where the cast stands (cast-reads-off-background).
//
// Background must move, with the painted props of art/gen-order-1109 (delivered as
// separate layers): on the sea, rolling wave crests, drifting lotus lanterns and a fish
// that now and then leaps, plus the drawn moon glints and wave light; in the hall, light
// shafts from the skylight, weeds swaying from the floor and rising bubbles. Every prop
// has a twin in the middle third of the backdrop, the part a phone held upright shows.
// All of it stays left of x 1500 so nothing moves behind the figure.

/** the painted props, loaded with the backdrops */
export const PROP_KEYS = ['bgMgWave1', 'bgMgWave2', 'bgMgWave3', 'bgMgLantern', 'bgMgFish1', 'bgMgFish2', 'bgMgFish3',
	'bgFgBubble1', 'bgFgBubble2', 'bgFgBubble3', 'bgFgBubble4', 'bgFgBubble5', 'bgFgBubble6', 'bgFgBubble7', 'bgFgBubble8',
	'bgFgSeaweed1', 'bgFgSeaweed2', 'bgFgSeaweed3', 'bgFgShaft'] as const;

type Glint = { g: Graphics; x: number; y: number; phase: number; speed: number };
type Streak = { g: Graphics; x: number; y: number; speed: number; phase: number; span: number };
type Wave = { s: Sprite; x: number; y: number; phase: number; sway: number };
type Lantern = { s: Sprite; glow: Graphics; x: number; y: number; phase: number; drift: number };
type Bubble = { s: Sprite; x: number; y: number; speed: number; sway: number; phase: number };
type Weed = { m: MeshPlane; base: Float32Array; phase: number; amp: number; rows: number };

// deterministic scatter, so a reload looks the same
let seed = 7;
/** nothing that moves may reach the cast strip right of this backdrop x */
export const FX_RIGHT = 1500;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
// a fish leaps every LEAP_EVERY s, alternating between the open sea left of the board
// and the middle of the backdrop (seen in portrait); each leap takes LEAP_S
const LEAP_EVERY = 5.5, LEAP_S = 1.15;
const LEAP_SPOTS = [{ x: 150, y: 760 }, { x: 860, y: 690 }, { x: 330, y: 650 }, { x: 1040, y: 820 }, { x: 210, y: 880 }, { x: 720, y: 600 }];

export function createBackgroundScene(textures: Record<string, Texture>) {
	seed = 7;
	const root = new Container(); root.label = 'Dragon Tide / moonlit sea + palace hall'; root.eventMode = 'none';
	const sea = new Sprite(textures.mgBgBase), hall = new Sprite(textures.mgBgFree);
	for (const sprite of [sea, hall]) { sprite.width = BACKGROUND_SIZE.width; sprite.height = BACKGROUND_SIZE.height; root.addChild(sprite); }
	hall.alpha = 0;
	const tex = (key: string) => textures[key] ?? Texture.EMPTY;   // a missing prop draws nothing rather than throwing

	// --- base game: wave crests, lanterns, a leaping fish, moon glints + wave light ------
	const seaFx = new Container(); seaFx.label = 'Waves / lanterns / fish / moon glints'; root.addChild(seaFx);
	// three crest lines from the horizon forward: far ones thinner and paler
	const waves: Wave[] = [['bgMgWave3', 560, 0.6], ['bgMgWave1', 720, 0.75], ['bgMgWave2', 905, 0.82]].map(([key, y, alpha], i) => {
		const s = new Sprite(tex(key as string)); s.anchor.set(0, 0.5);
		const k = 1300 / Math.max(1, s.texture.width); s.scale.set(k, k * (0.8 + i * 0.05)); s.alpha = alpha as number;
		seaFx.addChild(s);
		return { s, x: 30, y: y as number, phase: i * 2.2, sway: 14 + i * 4 };
	});
	const lanterns: Lantern[] = [{ x: 470, y: 880, k: 0.42 }, { x: 520, y: 610, k: 0.26 }, { x: 1130, y: 705, k: 0.26 }].map(({ x, y, k }, i) => {
		const glow = new Graphics().circle(0, 0, 60).fill({ color: 0xffe9a8, alpha: 1 }); glow.blendMode = 'add'; glow.scale.set(k * 1.6, k * 0.9); seaFx.addChild(glow);
		const s = new Sprite(tex('bgMgLantern')); s.anchor.set(0.5, 0.75); s.scale.set(k); seaFx.addChild(s);
		return { s, glow, x, y, phase: i * 1.9, drift: 26 + i * 6 };
	});
	const fish = ['bgMgFish1', 'bgMgFish2', 'bgMgFish3'].map((key) => {
		const s = new Sprite(tex(key)); s.anchor.set(0.5); s.scale.set(0.36); s.alpha = 0; seaFx.addChild(s); return s;
	});
	const glints: Glint[] = Array.from({ length: 18 }, () => {
		const w = 14 + random() * 30, g = new Graphics().ellipse(0, 0, w / 2, 1.6 + random() * 1.4).fill(0xffffff);
		g.blendMode = 'add'; seaFx.addChild(g);
		return { g, x: 250 + random() * 190, y: 505 + random() * 250, phase: random() * Math.PI * 2, speed: 1.2 + random() * 1.6 };
	});
	const streaks: Streak[] = Array.from({ length: 6 }, (_, i) => {
		const span = 140 + random() * 160, g = new Graphics().ellipse(0, 0, span / 2, 2.2).fill(0xffffff);
		g.blendMode = 'add'; seaFx.addChild(g);
		return { g, x: random() * 1400, y: 590 + i * 70 + random() * 30, speed: 10 + random() * 14, phase: random() * Math.PI * 2, span };
	});

	// --- free game: light shafts, swaying weeds, rising bubbles -----------------------------
	const hallFx = new Container(); hallFx.label = 'Light shafts / weeds / bubbles'; root.addChild(hallFx);
	// the painted shafts fall from the skylight down to the LEFT; these follow them (the art
	// slants the other way, so it is mirrored), so none reaches the cast strip on the right
	const shafts = [{ x: 1250, y: -30, k: 0.95 }, { x: 1080, y: -20, k: 0.8 }, { x: 760, y: 10, k: 0.62 }].map(({ x, y, k }, i) => {
		const s = new Sprite(tex('bgFgShaft')); s.anchor.set(0, 0); s.scale.set(-k, k); s.position.set(x, y); s.blendMode = 'add'; hallFx.addChild(s);
		return { s, phase: i * 2.1 };
	});
	const weeds: Weed[] = [{ key: 'bgFgSeaweed1', x: 70, k: 0.78 }, { key: 'bgFgSeaweed3', x: 250, k: 0.62 }, { key: 'bgFgSeaweed2', x: 470, k: 0.7 },
		{ key: 'bgFgSeaweed3', x: 800, k: 0.5 }, { key: 'bgFgSeaweed1', x: 1180, k: 0.46 }].map(({ key, x, k }, i) => {
		const texture = tex(key), rows = 9;
		const m = new MeshPlane({ texture, verticesX: 3, verticesY: rows });
		m.pivot.set(texture.width / 2, texture.height); m.position.set(x, 1080 + 12); m.scale.set(k);
		hallFx.addChild(m);
		return { m, base: Float32Array.from(m.geometry.positions), phase: i * 1.7, amp: 22 + (i % 3) * 6, rows };
	});
	const bubbles: Bubble[] = Array.from({ length: 26 }, (_, i) => {
		const s = new Sprite(tex(`bgFgBubble${(i % 8) + 1}`)); s.anchor.set(0.5); s.scale.set(0.32 + random() * 0.32); hallFx.addChild(s);
		const zone = i % 3;   // left of the board, the middle third, and the gap before the cast
		const x = zone === 0 ? 40 + random() * 520 : zone === 1 ? 700 + random() * 520 : 1260 + random() * 160;
		return { s, x, y: random() * 1080, speed: 26 + random() * 38, sway: 6 + random() * 10, phase: random() * Math.PI * 2 };
	});

	let elapsed = 0, nightness = 0, target = 0, reduced = false, disposed = false, burstAge = 2;
	function update(seconds: number) {
		if (disposed) return;
		const dt = Math.min(0.1, Math.max(0, seconds));
		if (!reduced) { elapsed += dt; burstAge = Math.min(2, burstAge + dt); }
		nightness += Math.sign(target - nightness) * Math.min(Math.abs(target - nightness), dt / 0.7);
		hall.alpha = nightness;
		const t = elapsed, burst = 1 + 0.8 * Math.max(0, 1 - burstAge / 1.5);
		seaFx.alpha = 1 - nightness; seaFx.visible = nightness < 0.999;
		hallFx.alpha = nightness; hallFx.visible = nightness > 0.001;
		for (const w of waves) {
			// crests roll in place: a slow sideways surge and a little heave
			w.s.position.set(w.x + Math.sin(t * 0.32 + w.phase) * w.sway * burst, w.y + Math.sin(t * 0.7 + w.phase) * 4);
		}
		for (const l of lanterns) {
			const x = l.x + Math.sin(t * 0.12 + l.phase) * l.drift, y = l.y + Math.sin(t * 0.9 + l.phase) * 4;
			l.s.position.set(x, y); l.s.rotation = Math.sin(t * 0.8 + l.phase) * 0.05;
			l.glow.position.set(x, y + 6); l.glow.alpha = (0.16 + 0.08 * Math.sin(t * 2.1 + l.phase)) * burst;
		}
		// one leap at a time: rise, turn over, dive, on a parabola
		const leap = Math.floor(t / LEAP_EVERY), into = t - leap * LEAP_EVERY;
		fish.forEach((s, i) => {
			const live = !reduced && i === leap % 3 && into < LEAP_S;
			s.alpha = live ? Math.min(1, into / 0.12, (LEAP_S - into) / 0.12) : 0;
			if (!live) return;
			const spot = LEAP_SPOTS[leap % LEAP_SPOTS.length], p = into / LEAP_S, dir = leap % 2 ? -1 : 1;
			const x = spot.x + dir * (p - 0.5) * 170, y = spot.y - 4 * p * (1 - p) * 120;
			s.position.set(x, y); s.scale.set(0.36 * dir, 0.36);
			s.rotation = Math.atan2(-(1 - 2 * p) * 480, 170) * dir;
		});
		for (const s of glints) {
			const twinkle = Math.max(0, Math.sin(s.phase + t * s.speed));
			s.g.position.set(s.x + Math.sin(t * 0.4 + s.phase) * 6, s.y);
			s.g.alpha = Math.min(1, 0.75 * twinkle * twinkle * burst);
		}
		for (const s of streaks) {
			// drift right, fading in from the left edge and out before the cast strip (x 1500)
			const x = ((s.x + t * s.speed) % FX_RIGHT) - s.span / 2;
			const edge = Math.min(1, Math.max(0, (x + s.span / 2) / 160), Math.max(0, (FX_RIGHT - s.span / 2 - x) / 220));
			s.g.position.set(x, s.y + Math.sin(t * 0.6 + s.phase) * 4);
			s.g.alpha = (0.10 + 0.08 * Math.sin(t * 0.9 + s.phase)) * burst * edge;
		}
		for (const s of shafts) { s.s.alpha = (0.16 + 0.08 * Math.sin(t * 0.7 + s.phase)) * burst; s.s.skew.x = Math.sin(t * 0.45 + s.phase) * 0.03; }
		for (const w of weeds) {
			// bend, not tilt: the tip travels furthest, the root stays put
			const positions = w.m.geometry.positions, h = w.m.texture.height;
			for (let v = 0; v < positions.length; v += 2) {
				const up = 1 - w.base[v + 1] / Math.max(1, h);
				positions[v] = w.base[v] + Math.sin(t * 0.9 + w.phase - up * 1.6) * w.amp * up * up * burst;
			}
			w.m.geometry.getBuffer('aPosition').update();
		}
		for (const b of bubbles) {
			const span = 1080 + 40, y = 1080 + 20 - ((1080 + 20 - b.y + t * b.speed * burst) % span);
			b.s.position.set(b.x + Math.sin(t * 1.3 + b.phase) * b.sway, y);
			b.s.alpha = 0.7 * Math.min(1, (1080 - y) / 200 + 0.2, Math.max(0, y + 20) / 120);
		}
	}
	function setBounds(width: number, height: number) {
		const scale = Math.max(width / BACKGROUND_SIZE.width, height / BACKGROUND_SIZE.height);
		root.scale.set(scale); root.position.set((width - BACKGROUND_SIZE.width * scale) / 2, (height - BACKGROUND_SIZE.height * scale) / 2);
		update(0);
	}
	update(0);
	return {
		root, update, setBounds,
		setNight(value: boolean) { target = value ? 1 : 0; },
		setReducedMotion(value: boolean) { reduced = value; update(0); },
		/** big win: the crests surge and the bubbles hurry for a moment */
		burstProps() { if (disposed || reduced || burstAge < 2) return false; burstAge = 0; update(0); return true; },
		snapshot() { return { elapsed, nightness, burstAge, reduced }; },
		destroy() { if (disposed) return; disposed = true; root.destroy({ children: true }); },
	};
}
