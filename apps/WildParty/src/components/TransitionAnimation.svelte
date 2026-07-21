<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';

	type Props = {
		// 'enter' = stepping into the Free Spins room (grand ornate doors),
		// 'exit'  = returning to base play (quick neon wipe)
		variant?: 'enter' | 'exit';
		// fires when the screen is fully covered — safe to swap the scene behind
		oncovered?: () => void;
		// fires when the transition has cleared and the component can unmount
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const variant = props.variant ?? 'exit';
	// the grand entrance is deliberately slower; the return is snappy
	const T_COVERED = variant === 'enter' ? 0.55 : 0.34;
	const T_TOTAL = variant === 'enter' ? 1.68 : 0.8;

	let t = $state(0);
	let coveredFired = false;

	onMount(() => {
		let raf = 0;
		let start = 0;
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: variant === 'enter' ? 'sfx_anticipation_start' : 'sfx_btn_general',
		});
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			if (!coveredFired && t >= T_COVERED) {
				coveredFired = true;
				if (variant === 'enter') {
					context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
				props.oncovered?.();
			}
			if (t >= T_TOTAL) {
				props.oncomplete();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
	const easeOutCubic = (p: number) => 1 - (1 - clamp01(p)) ** 3;
	const easeInOut = (p: number) => {
		const c = clamp01(p);
		return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
	};
	const lerpHex = (a: number, b: number, p: number) => {
		const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
		const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
		return (
			(Math.round(ar + (br - ar) * p) << 16) |
			(Math.round(ag + (bg - ag) * p) << 8) |
			Math.round(ab + (bb - ab) * p)
		);
	};

	// ── grand entrance: ornate gold doors ─────────────────────────────────
	const DOOR_TOP = 0x2c1139;
	const DOOR_BOTTOM = 0x120620;
	const GOLD = 0xd8a84e;
	const GOLD_BRIGHT = 0xffe9a8;
	// doors are drawn oversized so the impact shake never reveals a screen edge
	const OVERSCAN = 90;

	let sparkSeed = 9137;
	const srand = () => {
		sparkSeed = (sparkSeed * 1103515245 + 12345) & 0x7fffffff;
		return sparkSeed / 0x7fffffff;
	};
	// sparks thrown sideways out of the seam on impact
	const SPARKS = Array.from({ length: 22 }, () => ({
		y: srand(),
		vx: 320 + srand() * 900,
		vy: (srand() - 0.5) * 320,
		size: 2 + srand() * 3.5,
		dir: srand() < 0.5 ? -1 : 1,
		life: 0.32 + srand() * 0.3,
	}));

	// Doors ACCELERATE into contact. An ease-out close drifted the last few
	// percent shut well before T_COVERED, so the impact read as "bang, after the
	// doors already shut". A power curve keeps them travelling at full speed
	// right up to the moment they meet, landing the slam on the contact frame.
	const slamIn = (p: number) => clamp01(p) ** 1.9;

	// how closed the doors are: 0 fully open (off-screen), 1 shut
	const doorProgress = $derived.by(() => {
		if (t < T_COVERED) return slamIn(t / T_COVERED);
		const hold = 0.3;
		if (t < T_COVERED + hold) return 1;
		return 1 - easeInOut((t - T_COVERED - hold) / (T_TOTAL - T_COVERED - hold));
	});

	// impact envelopes — everything below keys off the moment the doors meet
	const impactT = $derived(t - T_COVERED);
	// 1 → 0, fast decay: drives the shake and the door recoil
	const impact = $derived(impactT >= 0 ? Math.exp(-impactT * 8.5) : 0);
	// slower 1 → 0 ramp for the light burst
	const burst = $derived(impactT >= 0 ? Math.max(0, 1 - impactT / 0.5) : 0);

	const drawDoorPanel = (
		g: PixiGraphics,
		x0: number,
		w: number,
		h: number,
		innerAtRight: boolean,
		dy: number,
	) => {
		// body is drawn past the top/bottom so the shake never exposes an edge
		const top = dy - OVERSCAN;
		const full = h + OVERSCAN * 2;

		// velvet body faked as a vertical gradient of flat bands
		const BANDS = 14;
		for (let i = 0; i < BANDS; i++) {
			const p = i / (BANDS - 1);
			g.beginFill(lerpHex(DOOR_TOP, DOOR_BOTTOM, p), 1);
			g.drawRect(x0, top + (full / BANDS) * i, w, full / BANDS + 1);
			g.endFill();
		}

		// panel moulding: two inset gold outlines
		const inset = Math.min(w, h) * 0.055;
		g.lineStyle(2.5, GOLD, 0.55);
		g.drawRect(x0 + inset, dy + inset, w - inset * 2, h - inset * 2);
		g.lineStyle(1.2, GOLD_BRIGHT, 0.3);
		g.drawRect(x0 + inset * 1.7, dy + inset * 1.7, w - inset * 3.4, h - inset * 3.4);
		g.lineStyle(0);

		// horizontal ornament rules
		for (const f of [0.28, 0.5, 0.72]) {
			g.beginFill(GOLD, 0.22);
			g.drawRect(x0 + inset * 2.4, dy + h * f, w - inset * 4.8, 2);
			g.endFill();
		}

		// bevelled inner edge — the lit lip where the two doors meet
		const lipW = Math.max(6, w * 0.02);
		const lipX = innerAtRight ? x0 + w - lipW : x0;
		g.beginFill(GOLD, 0.85);
		g.drawRect(lipX, top, lipW, full);
		g.endFill();
		g.beginFill(GOLD_BRIGHT, 0.9);
		g.drawRect(innerAtRight ? lipX + lipW * 0.55 : lipX, top, lipW * 0.45, full);
		g.endFill();
	};

	const drawDoors = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const p = doorProgress;
		g.clear();
		if (p <= 0.001) return;

		// slam recoil: the leaves bounce apart a hair on contact, then settle
		const recoil = impact * Math.sin(impactT * 26) * 0.022;
		const pd = Math.max(0, Math.min(1, p) - Math.max(0, recoil));
		// collision shake, whole-assembly
		const sx = impact * Math.sin(impactT * 63) * width * 0.013;
		const sy = impact * Math.sin(impactT * 47 + 1.1) * height * 0.011;

		const half = width / 2;
		const leftX = -half + pd * half + sx;
		const rightX = width - pd * half + sx;
		// each leaf is drawn OVERSCAN wider on its outer side, same reason as above
		drawDoorPanel(g, leftX - OVERSCAN, half + OVERSCAN, height, true, sy);
		drawDoorPanel(g, rightX, half + OVERSCAN, height, false, sy);

		const cx = width / 2 + sx;

		// centre seam bloom as the doors close in / part again
		const seam = Math.max(0, (p - 0.82) / 0.18);
		if (seam > 0) {
			for (const [wFrac, alpha] of [
				[0.16, 0.1],
				[0.07, 0.16],
				[0.025, 0.34],
			] as const) {
				g.beginFill(GOLD_BRIGHT, alpha * seam);
				g.drawRect(cx - width * wFrac * 0.5, sy, width * wFrac, height);
				g.endFill();
			}
		}

		if (burst <= 0) return;
		const b2 = burst * burst;

		// impact bloom: a hot column at the seam blowing outward as it fades
		for (const [wFrac, alpha] of [
			[0.5, 0.16],
			[0.24, 0.26],
			[0.09, 0.5],
		] as const) {
			const bw = width * wFrac * (0.35 + 0.65 * (1 - burst));
			g.beginFill(GOLD_BRIGHT, alpha * b2);
			g.drawRect(cx - bw * 0.5, sy, bw, height);
			g.endFill();
		}
		// white-hot core line
		g.beginFill(0xffffff, 0.85 * b2);
		g.drawRect(cx - width * 0.006, sy, width * 0.012, height);
		g.endFill();

		// horizontal shock rays firing out of the seam
		const reach = width * 0.55 * (1 - burst);
		for (const [yf, thick] of [
			[0.5, 10],
			[0.34, 5],
			[0.66, 5],
			[0.2, 3],
			[0.8, 3],
		] as const) {
			const ry = sy + height * yf;
			g.beginFill(GOLD_BRIGHT, 0.5 * b2);
			g.drawRect(cx - reach, ry - thick * 0.5, reach * 2, thick);
			g.endFill();
		}

		// sparks flung sideways from the contact line
		for (const s of SPARKS) {
			const age = impactT / s.life;
			if (age < 0 || age > 1) continue;
			const px = cx + s.dir * s.vx * impactT;
			const py = sy + height * s.y + s.vy * impactT + 900 * impactT * impactT;
			g.beginFill(0xfff2c8, (1 - age) * 0.9);
			g.drawRect(px - s.size * 0.5, py - s.size * 0.5, s.size, s.size);
			g.endFill();
		}
	};

	// ── quick return: neon diagonal wipe ──────────────────────────────────
	const SKEW = 0.18; // how slanted the wipe edge is

	const drawSweep = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		const skew = width * SKEW;
		const span = width + skew;

		// phase 1 covers left→right; phase 2 uncovers left→right
		const covering = t < T_COVERED;
		const p = covering
			? easeOutCubic(t / T_COVERED)
			: easeInOut((t - T_COVERED) / (T_TOTAL - T_COVERED));
		const edge = -skew + p * (span + skew);

		// solid plum cover on the filled side of the slanted edge
		g.beginFill(0x150822, 1);
		if (covering) {
			g.drawPolygon([-skew, 0, edge, 0, edge - skew, height, -skew, height]);
		} else {
			g.drawPolygon([edge, 0, width + skew, 0, width + skew, height, edge - skew, height]);
		}
		g.endFill();

		// neon band riding the edge: soft trail → body → hot leading line
		const band = width * 0.09;
		for (const [off, wFrac, color, alpha] of [
			[band * 1.9, 1.9, 0xff2fa0, 0.16],
			[band * 1.0, 1.0, 0xff8ede, 0.3],
			[band * 0.35, 0.35, GOLD_BRIGHT, 0.55],
		] as const) {
			const x1 = edge;
			const x0 = edge - off * wFrac;
			g.beginFill(color, alpha);
			g.drawPolygon([x0, 0, x1, 0, x1 - skew, height, x0 - skew, height]);
			g.endFill();
		}
		// hot leading line
		g.beginFill(0xffffff, 0.85);
		g.drawPolygon([edge - 4, 0, edge, 0, edge - skew, height, edge - skew - 4, height]);
		g.endFill();
	};

	// white punch right at the swap beat (stronger for the grand entrance)
	const flashAlpha = $derived.by(() => {
		const peak = variant === 'enter' ? 0.75 : 0.3;
		if (t < T_COVERED - 0.06 || t > T_COVERED + 0.24) return 0;
		const p = (t - (T_COVERED - 0.06)) / 0.3;
		return p < 0.25 ? (p / 0.25) * peak : peak * (1 - (p - 0.25) / 0.75);
	});
</script>

{#if variant === 'enter'}
	<Graphics draw={drawDoors} />
{:else}
	<Graphics draw={drawSweep} />
{/if}

{#if flashAlpha > 0}
	<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flashAlpha} />
{/if}
