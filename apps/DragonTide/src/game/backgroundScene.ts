import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { BACKGROUND_SIZE } from './backgroundMotion';

// Dragon Tide backdrops (art/backgrounds v2, 1920x1080): moonlit sea for the base game,
// the undersea palace hall for the free game, crossfaded on setNight. Both already fade
// to paper on the right where the cast stands (cast-reads-off-background).
//
// Background must move. Until the painted moving parts arrive (ART_REQUEST §C: waves,
// lanterns, fish / bubbles, light shafts, weeds) the motion is drawn here: moon glints
// and drifting wave light on the sea; swaying light shafts and rising bubbles in the hall.
// All of it stays left of x 1500 so nothing moves behind the figure.

type Glint = { g: Graphics; x: number; y: number; phase: number; speed: number };
type Streak = { g: Graphics; x: number; y: number; speed: number; phase: number; span: number };
type Bubble = { g: Graphics; x: number; y: number; r: number; speed: number; sway: number; phase: number };

// deterministic scatter, so a reload looks the same
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

export function createBackgroundScene(textures: Record<string, Texture>) {
	const root = new Container(); root.label = 'Dragon Tide / moonlit sea + palace hall'; root.eventMode = 'none';
	const sea = new Sprite(textures.mgBgBase), hall = new Sprite(textures.mgBgFree);
	for (const sprite of [sea, hall]) { sprite.width = BACKGROUND_SIZE.width; sprite.height = BACKGROUND_SIZE.height; root.addChild(sprite); }
	hall.alpha = 0;

	// --- base game: moon path glints + wave light -------------------------------------
	const seaFx = new Container(); seaFx.label = 'Moon glints / wave light'; root.addChild(seaFx);
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

	// --- free game: light shafts + bubbles ---------------------------------------------
	const hallFx = new Container(); hallFx.label = 'Light shafts / bubbles'; root.addChild(hallFx);
	// the painted shafts fall from the skylight down to the LEFT; these follow them, so
	// none reaches the cast strip on the right
	const shafts = [1000, 1120, 1240].map((x, i) => {
		const g = new Graphics().poly([-24, 0, 24, 0, 120, 760, -120, 760]).fill({ color: 0xeafffb, alpha: 1 });
		g.blendMode = 'add'; g.position.set(x, -10); g.rotation = 0.30 - i * 0.05; hallFx.addChild(g); // +θ = clockwise: the foot swings left
		return { g, base: g.rotation, phase: i * 2.1 };
	});
	const bubbles: Bubble[] = Array.from({ length: 24 }, (_, i) => {
		const r = 3 + random() * 6, g = new Graphics().circle(0, 0, r).stroke({ color: 0xffffff, width: 1.6, alpha: 0.85 }).circle(-r * 0.35, -r * 0.35, r * 0.28).fill({ color: 0xffffff, alpha: 0.8 });
		hallFx.addChild(g);
		const left = i % 3 !== 2;
		return { g, x: left ? 40 + random() * 520 : 820 + random() * 560, y: random() * 1080, r, speed: 26 + random() * 38, sway: 6 + random() * 10, phase: random() * Math.PI * 2 };
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
		for (const s of glints) {
			const twinkle = Math.max(0, Math.sin(s.phase + t * s.speed));
			s.g.position.set(s.x + Math.sin(t * 0.4 + s.phase) * 6, s.y);
			s.g.alpha = Math.min(1, 0.75 * twinkle * twinkle * burst);
		}
		for (const s of streaks) {
			const x = ((s.x + t * s.speed) % 1560) - 80;
			s.g.position.set(x, s.y + Math.sin(t * 0.6 + s.phase) * 4);
			s.g.alpha = (0.10 + 0.08 * Math.sin(t * 0.9 + s.phase)) * burst;
		}
		for (const s of shafts) { s.g.rotation = s.base + Math.sin(t * 0.55 + s.phase) * 0.035; s.g.alpha = (0.03 + 0.02 * Math.sin(t * 0.8 + s.phase)) * burst; }
		for (const b of bubbles) {
			const span = 1080 + 40, y = 1080 + 20 - ((1080 + 20 - b.y + t * b.speed * burst) % span);
			b.g.position.set(b.x + Math.sin(t * 1.3 + b.phase) * b.sway, y);
			b.g.alpha = 0.55 * Math.min(1, (1080 - y) / 200 + 0.2);
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
		/** big win: the glints flare / the bubbles hurry for a moment */
		burstProps() { if (disposed || reduced || burstAge < 2) return false; burstAge = 0; update(0); return true; },
		snapshot() { return { elapsed, nightness, burstAge, reduced }; },
		destroy() { if (disposed) return; disposed = true; root.destroy({ children: true }); },
	};
}
