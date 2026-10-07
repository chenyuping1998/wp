<script lang="ts">
	/**
	 * THE TITLE RISES OUT OF THE SAND — the loading screen's name, letter by
	 * letter. Go Bananas Boat's letters hop (HopTitle), which is right for a
	 * crate of bananas on a deck; a tomb's name is carved stone set with gold,
	 * so here each letter is RAISED: it comes up out of the floor, sand running
	 * off it, and settles with a stone's weight — a small squash on the line, a
	 * puff of dust at its foot. Reading order, 70ms a letter.
	 *
	 * Then, every few seconds, light passes across the gilding: a glint that
	 * runs letter to letter (an additive copy of each, flaring in turn) and a
	 * lift of a few px riding with it, so the name is never quite still.
	 *
	 * The parts keep their own styles ("GO BAN" gold, "ANUBIS" white — see
	 * LoadingScreen), so the seam inside the word survives being cut into
	 * letters. Each part's letters are measured one at a time and set at the
	 * style's letterSpacing; `gap` is the space between parts that are words.
	 *
	 * Scripts whose letters join cannot be cut; this title is the brand name,
	 * Latin in every language. Timed on setInterval: a hidden tab must not
	 * freeze it halfway out of the ground.
	 */
	import { onMount } from 'svelte';
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js';

	type Part = { text: string; style: TextStyleOptions; gapBefore?: number };
	type Props = { parts: Part[]; y?: number; delay?: number };

	const props: Props = $props();

	const STAGGER = 70;
	const RISE = 520;
	const GLINT_EVERY = 3200;
	const GLINT_STAGGER = 45;
	const GLINT_LEN = 380;

	const size = $derived(Number(props.parts[0]?.style.fontSize ?? 40));

	const letters = $derived.by(() => {
		const out: { ch: string; cx: number; w: number; style: TextStyleOptions }[] = [];
		let x = 0;
		for (const part of props.parts) {
			x += part.gapBefore ?? 0;
			const spacing = Number(part.style.letterSpacing ?? 0);
			const style = new TextStyle({ ...part.style, letterSpacing: 0 });
			for (const ch of part.text) {
				const w = CanvasTextMetrics.measureText(ch, style).width;
				out.push({ ch, cx: x + w / 2, w, style: { ...part.style, letterSpacing: 0 } });
				x += w + spacing;
			}
		}
		const total = x;
		return out.map((l) => ({ ...l, cx: l.cx - total / 2 }));
	});

	let now = $state(0);
	onMount(() => {
		const started = Date.now();
		const id = setInterval(() => (now = Date.now() - started), 16);
		return () => clearInterval(id);
	});

	const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
	const easeOut = (v: number) => 1 - (1 - v) ** 3;

	// one letter, u 0..1 through its rise: [depth below the line (font sizes),
	// scaleX, scaleY, alpha, dust 0..1]
	const rise = (u: number): [number, number, number, number, number] => {
		if (u <= 0) return [0.7, 1, 1, 0, 0];
		if (u >= 1) return [0, 1, 1, 1, 0];
		if (u < 0.62) {
			// coming up, stretched a little by the push, sand-dark until it clears
			const a = easeOut(u / 0.62);
			return [0.7 * (1 - a) - 0.06 * Math.sin(Math.PI * a), 1 - 0.05 * (1 - a), 1 + 0.08 * (1 - a), clamp01(u / 0.3), 0];
		}
		// settling: a short squash onto the line, the dust at its foot
		const b = (u - 0.62) / 0.38;
		const k = Math.sin(Math.PI * b) * (1 - b * 0.4);
		return [0, 1 + 0.07 * k, 1 - 0.1 * k, 1, Math.sin(Math.PI * clamp01(b * 1.3))];
	};

	const delay = $derived(props.delay ?? 0);
	const poses = $derived.by(() => {
		const t = now - delay;
		const lastLanded = (letters.length - 1) * STAGGER + RISE;
		const since = t - lastLanded - 600;
		const sweepAt = since < 0 ? -1 : since % GLINT_EVERY;
		return letters.map((_, i) => {
			const [depth, sx, sy, alpha, dust] = rise((t - i * STAGGER) / RISE);
			const g = sweepAt < 0 ? 0 : clamp01((sweepAt - i * GLINT_STAGGER) / GLINT_LEN);
			const glint = g > 0 && g < 1 ? Math.sin(Math.PI * g) : 0;
			return { depth, sx, sy, alpha, dust, glint };
		});
	});
</script>

<!-- each letter stands on its foot (anchor at the baseline), so it rises out of
     the line and squashes onto it rather than scaling about its middle -->
<Container y={(props.y ?? 0) + size * 0.5}>
	{#each letters as letter, i (i)}
		{@const pose = poses[i]}
		{#if pose}
			{#if pose.dust > 0.01}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={letter.cx}
					y={-size * 0.04}
					width={letter.w * 2.2 * (0.6 + 0.6 * pose.dust)}
					height={size * 0.38 * (0.6 + 0.4 * pose.dust)}
					tint={0xe8c98a}
					alpha={0.5 * pose.dust}
				/>
			{/if}
			<Text
				anchor={{ x: 0.5, y: 1 }}
				x={letter.cx}
				y={pose.depth * size - pose.glint * size * 0.06}
				scale={{ x: pose.sx, y: pose.sy }}
				alpha={pose.alpha}
				text={letter.ch}
				style={letter.style}
			/>
			{#if pose.glint > 0.01}
				<!-- the light crossing the gilding: the same letter, added over itself -->
				<Text
					anchor={{ x: 0.5, y: 1 }}
					x={letter.cx}
					y={-pose.glint * size * 0.06}
					text={letter.ch}
					style={letter.style}
					blendMode="add"
					alpha={0.55 * pose.glint}
				/>
			{/if}
		{/if}
	{/each}
</Container>
