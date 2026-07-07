<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	type Props = { scale?: number; dotCount?: number; speed?: number };
	const props: Props = $props();
	// 2x compensates the ~0.5x scale that content injected via SpineSlot
	// (addSlotObject) renders at compared to the skeleton's own attachments —
	// same empirical pattern as WinLevelSymbolIntro.svelte's base scale.
	const s = $derived(props.scale ?? 2.0);
	const dotCount = $derived(props.dotCount ?? 20);
	const speed = $derived(props.speed ?? 1);

	// outer gem hex offsets from center, matching HEX_PTS in
	// design/generate_presentation.mjs banner()
	const HEX: [number, number][] = [
		[-520, 0],
		[-370, -95],
		[370, -95],
		[520, 0],
		[370, 95],
		[-370, 95],
	];

	const points = $derived.by(() => {
		const edges = HEX.map((p, i) => {
			const next = HEX[(i + 1) % HEX.length];
			return { from: p, to: next, len: Math.hypot(next[0] - p[0], next[1] - p[1]) };
		});
		const total = edges.reduce((sum, e) => sum + e.len, 0);
		const pts: { x: number; y: number }[] = [];
		for (let i = 0; i < dotCount; i++) {
			let d = (i / dotCount) * total;
			for (const e of edges) {
				if (d <= e.len) {
					const t = e.len === 0 ? 0 : d / e.len;
					pts.push({
						x: (e.from[0] + (e.to[0] - e.from[0]) * t) * s,
						y: (e.from[1] + (e.to[1] - e.from[1]) * t) * s,
					});
					break;
				}
				d -= e.len;
			}
		}
		return pts;
	});

	let phase = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			phase += 0.045 * speed;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Container>
	{#each points as pt, i (i)}
		{@const wave = 0.5 + 0.5 * Math.sin(phase - i * 0.55)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={pt.x}
			y={pt.y}
			tint={0xffe066}
			blendMode="add"
			width={26 * s * (0.6 + 0.4 * wave)}
			height={26 * s * (0.6 + 0.4 * wave)}
			alpha={0.3 + 0.7 * wave}
		/>
	{/each}
</Container>
