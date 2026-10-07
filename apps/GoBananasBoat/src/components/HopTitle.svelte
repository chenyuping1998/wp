<script lang="ts">
	/**
	 * A LIVE, TRANSLATED TITLE WHOSE LETTERS HOP — the free-spins sign's
	 * "FREE SPINS" / "TOTAL WIN", in the same wave the big-win plaques' names
	 * hop in (WinBannerLetters). Those names are baked art cut into letters;
	 * this one is gameText, in whatever language the player has, so it is cut
	 * at runtime instead: one Text per character, laid out by measuring each.
	 *
	 * Scripts whose letters JOIN (Arabic, Hebrew's final forms, Thai, Devanagari
	 * ...) cannot be set a character at a time without breaking the word, so
	 * there the whole line hops as one piece.
	 *
	 * The wave: after `delay` (the sign's drop), each letter crouches, springs
	 * up stretched and lands squashed, 55ms after the one before; then a smaller
	 * wave every WAVE_EVERY, so the title stays alive while the sign is up.
	 * Timed on setInterval, not rAF: a hidden tab must not freeze it mid-hop.
	 */
	import { onMount } from 'svelte';
	import { Container, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js';

	type Props = {
		text: string;
		style: TextStyleOptions;
		y?: number;
		/** ms before the first wave */
		delay?: number;
	};

	const props: Props = $props();

	const STAGGER = 55;
	const HOP = 440;
	const WAVE_EVERY = 2400;

	const JOINING = /[֐-ࣿऀ-෿฀-໿က-႟יִ-﷿ﹰ-﻿]/;

	const fontSize = $derived(Number(props.style.fontSize ?? 32));
	const pieces = $derived.by(() => {
		const style = new TextStyle(props.style);
		const parts = JOINING.test(props.text) ? [props.text] : [...props.text];
		const widths = parts.map((ch) => CanvasTextMetrics.measureText(ch === ' ' ? ' ' : ch, style).width);
		const total = widths.reduce((a, b) => a + b, 0);
		let x = -total / 2;
		return parts.map((ch, i) => {
			const cx = x + widths[i] / 2;
			x += widths[i];
			return { ch, cx };
		});
	});

	// one hop, u 0..1: [lift as a fraction of the font size, scaleX, scaleY]
	const hop = (u: number, size: number): [number, number, number] => {
		if (u <= 0 || u >= 1) return [0, 1, 1];
		if (u < 0.16) {
			const k = Math.sin((Math.PI * u) / 0.16);
			return [0, 1 + 0.14 * size * k, 1 - 0.22 * size * k];
		}
		if (u < 0.74) {
			const a = (u - 0.16) / 0.58;
			const stretch = 0.14 * size * Math.cos(Math.PI * a) * (a < 0.5 ? 1 : 0.5);
			return [0.32 * size * Math.sin(Math.PI * a), 1 - stretch * 0.6, 1 + stretch];
		}
		const b = (u - 0.74) / 0.26;
		const k = Math.sin(Math.PI * b) * (1 - b * 0.3);
		return [0, 1 + 0.12 * size * k, 1 - 0.18 * size * k];
	};

	let now = $state(0);
	onMount(() => {
		const started = Date.now();
		const id = setInterval(() => (now = Date.now() - started), 16);
		return () => clearInterval(id);
	});

	const delay = $derived(props.delay ?? 0);
	const poses = $derived.by(() => {
		const t = now - delay;
		const first = t < WAVE_EVERY;
		const waveStart = first ? 0 : WAVE_EVERY + Math.floor((t - WAVE_EVERY) / WAVE_EVERY) * WAVE_EVERY;
		const size = first ? 1 : 0.4;
		return pieces.map((_, i) => hop((t - waveStart - i * STAGGER) / HOP, size));
	});
</script>

<!-- each piece stands on its baseline (anchor at its foot), so it squashes
     onto the line and lifts off it rather than scaling about its middle -->
<Container y={(props.y ?? 0) + fontSize * 0.5}>
	{#each pieces as piece, i (i)}
		{@const pose = poses[i] ?? [0, 1, 1]}
		<Text
			anchor={{ x: 0.5, y: 1 }}
			x={piece.cx}
			y={-pose[0] * fontSize}
			scale={{ x: pose[1], y: pose[2] }}
			text={piece.ch}
			style={{ ...props.style, letterSpacing: 0 }}
		/>
	{/each}
</Container>
