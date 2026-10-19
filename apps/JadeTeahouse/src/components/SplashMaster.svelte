<script lang="ts">
	/**
	 * The Tea Master on the free-spin splashes (FreeSpinIntro / FreeSpinOutro).
	 *
	 * By the time either splash is up the board's own mascot is the Apprentice
	 * (gameType flips to 'freegame' under the transition's cover), so the Master
	 * stands on the OTHER side of the board, mirrored to face it, and the two read
	 * as a hand-over rather than as one figure drawn twice. He is drawn on the near
	 * side of the splash's scrim, so the dimming never touches him.
	 *
	 * One beat and then stillness (user rule: motion that keeps going reads as
	 * AI): he steps in from the left edge, plays ONE act when `cueNow` first goes
	 * true, and returns to idle.
	 *
	 * THE POUR (intro). He produces the teapot (TeapotProp, on his `sack` slot),
	 * tips it, and the tea leaves the spout in a long arc onto the board's paper
	 * — the teahouse's long-spout pour, the performance a tea master gives — and
	 * the count is stamped where it lands. The arc is drawn here, from the spout
	 * TeapotProp reports to `target`.
	 *
	 * Placement: game/splashCast.ts (Mascot.svelte's rule, mirrored). Below the
	 * minimum gap (tablet, portrait) he is simply not drawn.
	 */
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { DropShadowFilter } from 'pixi-filters';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { MASTER_ART, POUR_MS, STREAM_TRAVEL_MS, masterPlacement } from '../game/splashCast';
	import TeapotProp from './TeapotProp.svelte';

	type Props = {
		/** the one act he plays */
		cue: 'cheer' | 'nod' | 'pour';
		/** the moment to play it */
		cueNow: boolean;
		/** ms after mount that his step-in starts */
		enterAt?: number;
		/** where the pour lands, in main-layout coordinates */
		target?: { x: number; y: number };
	};
	const props: Props = $props();
	const context = getContext();

	const ENTER_MS = 460;

	// the same misregistered ink shadow Mascot.svelte prints under the cast
	const castShadow = [
		new DropShadowFilter({ offset: { x: 7, y: 6 }, color: 0x1e1b1a, alpha: 0.72, blur: 0, quality: 1 }),
	];

	const placement = $derived(
		masterPlacement(context.stateLayoutDerived.mainLayout(), context.stateGameDerived.boardLayout()),
	);

	let animationName = $state('idle');
	let loop = $state(true);
	let cued = false;
	let cueStart = $state(-1);
	$effect(() => {
		if (!props.cueNow || cued) return;
		cued = true;
		animationName = props.cue;
		loop = false;
		cueStart = performance.now();
	});

	let now = $state(performance.now());
	let mountedAt = performance.now();
	onMount(() => {
		mountedAt = performance.now();
		let raf = 0;
		// runs until he has stepped in and any pour has finished
		const tick = (time: number) => {
			now = time;
			const entering = time - mountedAt < (props.enterAt ?? 0) + ENTER_MS;
			const pouring = props.cue === 'pour' && (cueStart < 0 || time - cueStart < POUR_MS.duration);
			if (entering || pouring) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// 0 = off the left edge, 1 = in place; eased out, no overshoot
	const enter = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (now - mountedAt - (props.enterAt ?? 0)) / ENTER_MS));
		return 1 - (1 - k) ** 3;
	});
	const containerX = $derived(
		placement ? placement.x - (1 - enter) * (placement.gapWidth * 0.5 + MASTER_ART.width * placement.scale) : 0,
	);

	// ms into the pour, or -1
	const pourT = $derived(props.cue === 'pour' && cueStart >= 0 ? now - cueStart : -1);
	const potShown = $derived(pourT >= 0 && pourT < POUR_MS.duration - 150);
	let spout = $state<{ x: number; y: number } | null>(null);

	// the stream: its head runs out to the board, then its tail follows it in
	const stream = $derived.by(() => {
		if (pourT < POUR_MS.flowFrom || !spout || !props.target || !placement) return null;
		const head = Math.min(1, (pourT - POUR_MS.flowFrom) / STREAM_TRAVEL_MS);
		const tail = Math.min(1, Math.max(0, (pourT - POUR_MS.flowTo) / 220));
		if (tail >= 1) return null;
		return { head, tail, end: { x: props.target.x - containerX, y: props.target.y - placement.y } };
	});

	const TEA = 0xc7893a;
	const TEA_LIGHT = 0xf3d39a;
	const INK = 0x1e1b1a;
	const drawStream = (g: PixiGraphics) => {
		g.clear();
		if (!stream || !spout) return;
		const p0 = spout;
		const p2 = stream.end;
		const dist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
		// an arc that rises over the gap and drops onto the paper
		const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - dist * 0.32 };
		const at = (t: number) => ({
			x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
			y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
		});
		const N = 28;
		const pts = Array.from({ length: N + 1 }, (_, i) => at(stream.tail + ((stream.head - stream.tail) * i) / N));
		const path = () => {
			g.moveTo(pts[0].x, pts[0].y);
			for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
		};
		path();
		g.stroke({ width: 11, color: INK, cap: 'round', join: 'round' });
		path();
		g.stroke({ width: 7, color: TEA, cap: 'round', join: 'round' });
		// the light running down the stream: short highlights travelling with it
		const phase = (pourT / 260) % 1;
		for (let i = 0; i < 6; i++) {
			const t0 = stream.tail + (stream.head - stream.tail) * ((i + phase) / 6);
			const t1 = Math.min(stream.head, t0 + 0.05);
			if (t1 <= t0) continue;
			const a = at(t0);
			const b = at(t1);
			g.moveTo(a.x, a.y).lineTo(b.x, b.y);
		}
		g.stroke({ width: 2.5, color: TEA_LIGHT, cap: 'round' });
		// where it lands: a few drops kicked up off the paper
		if (stream.head >= 1 && stream.tail <= 0) {
			for (let i = 0; i < 5; i++) {
				const k = ((pourT / 340 + i / 5) % 1);
				const dir = -0.5 + i / 4;
				const x = p2.x + dir * 46 * k;
				const y = p2.y - 34 * k + 50 * k * k;
				const r = 4.5 * (1 - k * 0.6);
				g.circle(x, y, r + 1.5).fill(INK);
				g.circle(x, y, r).fill(TEA);
			}
		}
	};
</script>

{#if placement}
	<Container x={containerX} y={placement.y} alpha={Math.min(1, enter * 1.6)} filters={castShadow}>
		<!-- the cast is cut facing left (toward a board on his left); mirrored -->
		<SpineProvider key="gbBandit" scale={{ x: -placement.scale, y: placement.scale }}>
			<SpineTrack
				trackIndex={0}
				{animationName}
				{loop}
				{...{ mixDuration: 0.16 }}
				listener={{
					complete: (entry) => {
						if (entry.animation?.name === props.cue) {
							animationName = 'idle';
							loop = true;
						}
					},
				}}
			/>
			<SpineTrack trackIndex={1} animationName="flutter" loop />
			{#if props.cue === 'pour'}
				<TeapotProp show={potShown} onspout={(p) => (spout = p)} />
			{/if}
		</SpineProvider>
		{#if props.cue === 'pour'}
			<Graphics draw={drawStream} />
		{/if}
	</Container>
{/if}
