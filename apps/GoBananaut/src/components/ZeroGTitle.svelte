<script lang="ts">
	/**
	 * THE LOADING SCREEN'S TITLE, IN ZERO-G (2026-10-03).
	 *
	 * Go Bananas Boat's title hops (HopTitle): letters crouching and springing in a
	 * wave, which suits a deck. This game is set in a capsule, so the letters
	 * FLOAT instead —
	 *
	 *   ARRIVAL  each letter drifts in from somewhere of its own (scattered, a
	 *            little small and turned), slows, and DOCKS on its baseline with a
	 *            small squash, a few at a time rather than in a neat wave
	 *   AFTER    every letter drifts on its own clock — two slow motions that never
	 *            line up, so the line never moves as one block — and now and then
	 *            ONE letter, at random, gets nudged and settles back
	 *
	 * "盡量做的不要有ai感": nothing in it is regular. Every letter's numbers are
	 * seeded and different, the arrivals overlap unevenly, the nudges come at
	 * uneven intervals, and there is no glow.
	 *
	 * Takes the line as SEGMENTS, each with its own style (GO / BANANAUT), set one
	 * character at a time by measuring each. Timed on setInterval, not rAF, so a
	 * hidden tab cannot freeze it halfway in.
	 */
	import { onMount } from 'svelte';
	import { Container, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js';

	type Segment = { text: string; style: TextStyleOptions };
	type Props = {
		segments: Segment[];
		/** px between segments */
		gap?: number;
		/** ms before the first letter sets off */
		delay?: number;
	};
	const props: Props = $props();

	let seed = 11;
	const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

	const pieces = $derived.by(() => {
		seed = 11;
		const out: { ch: string; style: TextStyleOptions; cx: number; size: number; p: Record<string, number> }[] = [];
		let x = 0;
		props.segments.forEach((seg, si) => {
			if (si > 0) x += props.gap ?? 0;
			const style = new TextStyle({ ...seg.style, letterSpacing: 0 });
			const spacing = Number(seg.style.letterSpacing ?? 0);
			for (const ch of [...seg.text]) {
				const w = CanvasTextMetrics.measureText(ch, style).width;
				const size = Number(seg.style.fontSize ?? 40);
				out.push({
					ch,
					style: { ...seg.style, letterSpacing: 0 },
					cx: x + w / 2,
					size,
					p: {
						// where it comes from, in font sizes, and how it is turned
						fromX: (rnd() - 0.5) * 2.4,
						fromY: -0.4 - rnd() * 1.1,
						fromRot: (rnd() - 0.5) * 0.9,
						// when it sets off and how long it takes to dock
						start: rnd() * 380,
						travel: 620 + rnd() * 380,
						// its drift: two slow motions of its own
						ay: 0.025 + rnd() * 0.03,
						py1: 2300 + rnd() * 1900,
						py2: 3700 + rnd() * 2600,
						ph1: rnd() * Math.PI * 2,
						ph2: rnd() * Math.PI * 2,
						ar: 0.012 + rnd() * 0.02,
						pr: 2900 + rnd() * 2400,
					},
				});
				x += w + spacing;
			}
		});
		const total = x;
		return out.map((pc) => ({ ...pc, cx: pc.cx - total / 2 }));
	});

	// the nudges: uneven intervals, one letter each
	const nudges: { at: number; index: number; dir: number }[] = [];
	{
		let at = 2600;
		let s = 29;
		const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		for (let i = 0; i < 400; i++) {
			nudges.push({ at, index: Math.floor(r() * 64), dir: r() < 0.5 ? -1 : 1 });
			at += 1700 + r() * 2900;
		}
	}

	let now = $state(0);
	onMount(() => {
		const started = Date.now();
		const id = setInterval(() => (now = Date.now() - started), 16);
		return () => clearInterval(id);
	});

	const poses = $derived.by(() => {
		const t = now - (props.delay ?? 0);
		const n = pieces.length;
		return pieces.map((pc, i) => {
			const p = pc.p;
			const u = Math.max(0, Math.min(1, (t - p.start) / p.travel));
			const e = 1 - (1 - u) ** 3; // slows into its berth
			const away = 1 - e;
			// the dock: a short squash as it arrives
			const dockT = t - p.start - p.travel;
			const dock = dockT > 0 && dockT < 260 ? Math.sin((Math.PI * dockT) / 260) * (1 - dockT / 260) : 0;
			// drifting, once docked (eased in so it does not start with a jump)
			const settle = Math.max(0, Math.min(1, dockT / 900));
			const drift =
				settle * (p.ay * Math.sin((2 * Math.PI * t) / p.py1 + p.ph1) + p.ay * 0.6 * Math.sin((2 * Math.PI * t) / p.py2 + p.ph2));
			let rot = p.fromRot * away + settle * p.ar * Math.sin((2 * Math.PI * t) / p.pr + p.ph2);
			// a nudge, if this letter's came up
			let lift = 0;
			for (const nd of nudges) {
				if (nd.at > t) break;
				if (nd.index % n !== i) continue;
				const v = (t - nd.at) / 900;
				if (v < 0 || v > 1) continue;
				const kick = Math.exp(-v * 4) * Math.sin(v * 14);
				lift += 0.12 * kick;
				rot += nd.dir * 0.08 * kick;
			}
			return {
				x: pc.cx + p.fromX * pc.size * away,
				y: (p.fromY * away - drift - lift) * pc.size,
				rot,
				sx: 1 + 0.08 * dock,
				sy: 1 - 0.12 * dock,
				alpha: Math.min(1, u * 2.5),
				scale: 0.72 + 0.28 * e,
			};
		});
	});
</script>

<!-- each letter stands on its baseline (anchored at its foot) -->
<Container>
	{#each pieces as pc, i (i)}
		{@const pose = poses[i]}
		<Text
			anchor={{ x: 0.5, y: 1 }}
			x={pose.x}
			y={pose.y + pc.size * 0.5}
			rotation={pose.rot}
			scale={{ x: pose.sx * pose.scale, y: pose.sy * pose.scale }}
			alpha={pose.alpha}
			text={pc.ch}
			style={pc.style}
		/>
	{/each}
</Container>
