<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	// x/y/width/height must match whatever the frame_edge Sprite is rendered
	// at, so the traveling glint tracks the ring's midline regardless of
	// board size/position
	type Props = { x?: number; y?: number; width: number; height: number };
	const props: Props = $props();

	// midline of the gold ring in frame_edge.png's own 1080x900 texture space,
	// as fractions of the full sprite — halfway between the outer edge (x24 y24
	// w1032 h852 rx56) and the hollow cutout (x86 y86 w908 h728 rx34) in
	// design/generate_frames_party.mjs's frameEdgeSvg
	const X0 = 0.0509;
	const X1 = 0.9491;
	const Y0 = 0.0611;
	const Y1 = 0.9389;

	let t = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			t = (t + 0.0022) % 1;
		}, 16);
		return () => clearInterval(id);
	});

	// walks the rectangle perimeter (top -> right -> bottom -> left) at a
	// constant visual speed, weighted by the actual on-screen edge lengths
	const pointAt = (phase: number) => {
		const w = props.width * (X1 - X0);
		const h = props.height * (Y1 - Y0);
		const perimeter = 2 * (w + h);
		let d = ((phase % 1) + 1) % 1 * perimeter;
		if (d <= w) return { x: X0 + (d / w) * (X1 - X0), y: Y0, angle: 0 };
		d -= w;
		if (d <= h) return { x: X1, y: Y0 + (d / h) * (Y1 - Y0), angle: 90 };
		d -= h;
		if (d <= w) return { x: X1 - (d / w) * (X1 - X0), y: Y1, angle: 0 };
		d -= w;
		return { x: X0, y: Y1 - (d / h) * (Y1 - Y0), angle: 90 };
	};

	// two glints, half a lap apart, so there's never a long dead stretch
	const glints = $derived([pointAt(t), pointAt(t + 0.5)]);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#each glints as g, i (i)}
		<Sprite
			key="fxStreak"
			anchor={0.5}
			x={(g.x - 0.5) * props.width}
			y={(g.y - 0.5) * props.height}
			rotation={(g.angle * Math.PI) / 180}
			tint={0xfff6d0}
			blendMode="add"
			width={props.width * 0.16}
			height={props.width * 0.045}
			alpha={0.75}
		/>
	{/each}
</Container>
