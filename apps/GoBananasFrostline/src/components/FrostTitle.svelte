<script lang="ts">
	/**
	 * THE LOADING-SCREEN WORDMARK, LETTER BY LETTER — Go Bananas Boat's HopTitle,
	 * in ice. Boat's letters are rubber: they crouch, spring and land squashed.
	 * Ice does not squash, so these do what frozen letters would:
	 *
	 *   DROP    each letter falls into place from above, stiffly (gravity, no
	 *           stretch), lands with a short CLINK — a small rebound and a tilt —
	 *           and its sheen flashes as it hits. Staggered left to right.
	 *   GROW    the icicles under it (FROSTLINE's) grow down once it has landed.
	 *   SHIVER  every few seconds a cold shiver runs along the word: each letter
	 *           chatters side to side for a moment, and a glint of light travels
	 *           across the lit top edge with it.
	 *
	 * Each letter is drawn in the same stacked passes the static wordmark used
	 * (`layers`: under-pass, body, sheen…), so the bevel survives being cut up;
	 * `iciclesAfter` is the layer the icicles are drawn on top of.
	 *
	 * Scripts whose letters JOIN cannot be set a character at a time, so there
	 * the whole line moves as one piece (the name is English today; this is for
	 * when it is not).
	 *
	 * Timed on setInterval, not rAF: a hidden tab must not freeze it mid-fall.
	 */
	import { onMount } from 'svelte';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js';

	type Layer = { style: TextStyleOptions; dy?: number; alpha?: number; sheen?: boolean };
	type Icicles = {
		count: number;
		/** y of the icicles' root, relative to the line centre */
		top: number;
		color: number;
		litColor: number;
		/** the cap height they are proportioned to */
		size: number;
	};
	type Props = {
		text: string;
		/** the pass the letters are measured with (the readable body) */
		style: TextStyleOptions;
		layers: Layer[];
		/** the line's centre */
		y?: number;
		/** ms before the first letter falls */
		delay?: number;
		icicles?: Icicles;
		/** index into `layers` the icicles are drawn just after */
		iciclesAfter?: number;
	};

	const props: Props = $props();

	const STAGGER = 60;
	const DROP_MS = 440;
	/** the share of the drop spent falling; the rest is the clink */
	const FALL = 0.68;
	const SHIVER_EVERY = 3600;
	const SHIVER_MS = 400;
	const SHIVER_STAGGER = 45;
	const GROW_MS = 320;

	const JOINING = /[֐-ࣿऀ-෿฀-໿က-႟יִ-﷿ﹰ-﻿]/;

	const fontSize = $derived(Number(props.style.fontSize ?? 32));
	const spacing = $derived(Number(props.style.letterSpacing ?? 0));

	// Re-measured every quarter second, not once: the display face is
	// self-hosted and lands AFTER this screen is up, and measuring once would
	// keep the fallback face's spacing for good.
	let measureTick = $state(0);
	const pieces = $derived.by(() => {
		measureTick;
		const style = new TextStyle({ ...props.style, letterSpacing: 0 });
		const parts = JOINING.test(props.text) ? [props.text] : [...props.text];
		const widths = parts.map((ch) => CanvasTextMetrics.measureText(ch === ' ' ? ' ' : ch, style).width + spacing);
		const total = widths.reduce((a, b) => a + b, 0) - spacing;
		let x = -total / 2;
		return parts.map((ch, i) => {
			const cx = x + (widths[i] - spacing) / 2;
			const left = x;
			x += widths[i];
			return { ch, cx, left, right: x - spacing, blank: ch.trim() === '' };
		});
	});
	const total = $derived(pieces.length ? pieces[pieces.length - 1].right - pieces[0].left : 0);

	// Icicles hang under the word, varied by a hash of their index (stable: the
	// same pattern every load) and each belongs to the letter it hangs from, so
	// it falls, clinks and shivers with that letter.
	const icicles = $derived.by(() => {
		const ic = props.icicles;
		if (!ic) return [];
		return Array.from({ length: ic.count }, (_, i) => {
			const h = Math.abs(Math.sin(i * 78.233) * 43758.5453) % 1;
			const h2 = Math.abs(Math.sin(i * 12.9898 + 4.1) * 24634.6345) % 1;
			const t = (i + 0.5) / ic.count;
			const x = -total / 2 + total * (0.06 + 0.88 * t);
			let owner = pieces.findIndex((p) => !p.blank && x >= p.left && x <= p.right);
			if (owner < 0) owner = pieces.reduce((best, p, j) => (Math.abs(p.cx - x) < Math.abs(pieces[best].cx - x) ? j : best), 0);
			return {
				owner,
				// relative to its letter's centre
				x: x - (pieces[owner]?.cx ?? 0),
				len: ic.size * (0.2 + 0.34 * h),
				// stubby: 1:2 to 1:4 is where the eye files the shape as ice
				halfWidth: ic.size * (0.07 + 0.06 * h2),
			};
		});
	});

	let now = $state(0);
	onMount(() => {
		const started = Date.now();
		const id = setInterval(() => (now = Date.now() - started), 16);
		const measure = setInterval(() => (measureTick += 1), 250);
		return () => {
			clearInterval(id);
			clearInterval(measure);
		};
	});

	const smooth = (v: number) => {
		const x = Math.max(0, Math.min(1, v));
		return x * x * (3 - 2 * x);
	};

	type Pose = { dx: number; dy: number; rot: number; alpha: number; glint: number; grow: number };
	const delay = $derived(props.delay ?? 0);
	// when the last letter is down: the shivers start a beat after
	const settledAt = $derived(delay + pieces.length * STAGGER + DROP_MS);
	const poses = $derived.by((): Pose[] => {
		const size = fontSize;
		return pieces.map((_, i) => {
			const u = (now - delay - i * STAGGER) / DROP_MS;
			const pose: Pose = { dx: 0, dy: 0, rot: 0, alpha: 1, glint: 0, grow: 0 };
			if (u < 0) return { ...pose, alpha: 0, dy: -0.9 * size };
			if (u < FALL) {
				// falling: it accelerates, as a dropped thing does
				const f = u / FALL;
				pose.dy = -0.9 * size * (1 - f * f);
				pose.alpha = Math.min(1, u / 0.22);
			} else if (u < 1) {
				// the clink: a small rebound and a tilt, alternating letter to letter
				const c = (u - FALL) / (1 - FALL);
				const k = Math.sin(Math.PI * c) * (1 - 0.4 * c);
				pose.dy = -0.07 * size * k;
				pose.rot = (i % 2 ? 1 : -1) * 0.05 * k;
				pose.glint = 1 - c;
			}
			const landed = delay + i * STAGGER + DROP_MS * FALL;
			pose.grow = smooth((now - landed) / GROW_MS);

			// the shiver wave, once everything is down
			const since = now - settledAt - SHIVER_EVERY * 0.45;
			if (since > 0) {
				const a = ((since % SHIVER_EVERY) - i * SHIVER_STAGGER) / SHIVER_MS;
				if (a > 0 && a < 1) {
					const chatter = Math.sin(2 * Math.PI * a * 6) * (1 - a);
					pose.dx = 0.03 * size * chatter;
					pose.rot += 0.022 * chatter;
					pose.glint = Math.max(pose.glint, Math.sin(Math.PI * a));
				}
			}
			return pose;
		});
	});
</script>

<Container y={props.y ?? 0}>
	{#each pieces as piece, i (i)}
		{@const pose = poses[i]}
		<!-- always mounted, hidden by alpha: a block mounted LATER is appended at
		     its parent's end, which would put a late letter (or its icicles)
		     over the passes it belongs under -->
		{#if !piece.blank && pose}
			<Container x={piece.cx + pose.dx} y={pose.dy} rotation={pose.rot} alpha={pose.alpha} visible={pose.alpha > 0.001}>
				{#each props.layers as layer, l (l)}
					<Text
						anchor={{ x: 0.5, y: 0.5 }}
						y={layer.dy ?? 0}
						alpha={layer.sheen ? Math.min(1, (layer.alpha ?? 1) + 0.55 * pose.glint) : (layer.alpha ?? 1)}
						text={piece.ch}
						style={{ ...layer.style, letterSpacing: 0 }}
					/>
					{#if props.icicles && l === (props.iciclesAfter ?? 0)}
						<Graphics
							draw={(g) => {
								const ic = props.icicles!;
								g.clear();
								if (pose.grow <= 0) return;
								for (const c of icicles) {
									if (c.owner !== i) continue;
									const len = c.len * pose.grow;
									// body: a tapered spike in the under-pass's deep blue
									g.moveTo(c.x - c.halfWidth, ic.top);
									g.lineTo(c.x + c.halfWidth, ic.top);
									g.lineTo(c.x, ic.top + len);
									g.fill({ color: ic.color, alpha: 0.95 });
									// a lit face down one side, or it reads as a spine
									g.moveTo(c.x - c.halfWidth * 0.55, ic.top);
									g.lineTo(c.x - c.halfWidth * 0.05, ic.top);
									g.lineTo(c.x, ic.top + len * 0.92);
									g.fill({ color: ic.litColor, alpha: 0.5 });
								}
							}}
						/>
					{/if}
				{/each}
			</Container>
		{/if}
	{/each}
</Container>
