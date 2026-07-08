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
	// corner radius, also as a fraction of the full sprite — the average of
	// the outer (rx56) and inner (rx34) corner radii, same 1080x900 space
	const RX_F = 45 / 1080;
	const RY_F = 45 / 900;

	let t = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			t = (t + 0.0022) % 1;
		}, 16);
		return () => clearInterval(id);
	});

	// walks a rounded-rect perimeter (straight edges + quarter-ellipse corners)
	// at a constant visual speed, sweeping both position and heading smoothly
	// through each corner instead of snapping direction at a hard 90° turn
	const pointAt = (phase: number) => {
		const w = props.width * (X1 - X0);
		const h = props.height * (Y1 - Y0);
		const rx = Math.min(props.width * RX_F, w / 2);
		const ry = Math.min(props.height * RY_F, h / 2);
		const straightW = w - 2 * rx;
		const straightH = h - 2 * ry;
		const arcLen = (Math.PI / 2) * ((rx + ry) / 2);
		const perimeter = 2 * straightW + 2 * straightH + 4 * arcLen;
		let d = (((phase % 1) + 1) % 1) * perimeter;

		// position + heading along an elliptical quarter-arc from thetaStart to
		// thetaEnd (degrees), centered at (cx, cy), parametrized 0..1 by p
		const arcPoint = (cx: number, cy: number, thetaStart: number, thetaEnd: number, p: number) => {
			const theta = ((thetaStart + (thetaEnd - thetaStart) * p) * Math.PI) / 180;
			const x = cx + rx * Math.cos(theta);
			const y = cy + ry * Math.sin(theta);
			const angle = (Math.atan2(ry * Math.cos(theta), -rx * Math.sin(theta)) * 180) / Math.PI;
			return { localX: x, localY: y, angle };
		};

		let out: { localX: number; localY: number; angle: number };
		if (d <= straightW) {
			out = { localX: rx + d, localY: 0, angle: 0 };
		} else if ((d -= straightW) <= arcLen) {
			out = arcPoint(w - rx, ry, -90, 0, d / arcLen);
		} else if ((d -= arcLen) <= straightH) {
			out = { localX: w, localY: ry + d, angle: 90 };
		} else if ((d -= straightH) <= arcLen) {
			out = arcPoint(w - rx, h - ry, 0, 90, d / arcLen);
		} else if ((d -= arcLen) <= straightW) {
			out = { localX: w - rx - d, localY: h, angle: 0 };
		} else if ((d -= straightW) <= arcLen) {
			out = arcPoint(rx, h - ry, 90, 180, d / arcLen);
		} else if ((d -= arcLen) <= straightH) {
			out = { localX: 0, localY: h - ry - d, angle: 90 };
		} else {
			out = arcPoint(rx, ry, 180, 270, (d - straightH) / arcLen);
		}

		return {
			x: (X0 - 0.5) * props.width + out.localX,
			y: (Y0 - 0.5) * props.height + out.localY,
			angle: out.angle,
		};
	};

	// two glints, half a lap apart, so there's never a long dead stretch
	const glints = $derived([pointAt(t), pointAt(t + 0.5)]);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#each glints as g, i (i)}
		<Sprite
			key="fxStreak"
			anchor={0.5}
			x={g.x}
			y={g.y}
			rotation={(g.angle * Math.PI) / 180}
			tint={0xfff6d0}
			blendMode="add"
			width={props.width * 0.16}
			height={props.width * 0.045}
			alpha={0.75}
		/>
	{/each}
</Container>
