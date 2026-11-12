<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { WIN_SCENES } from '../game/assetsHud';

	// The big-win SCENE behind the title and the amount: one of four alchemist's
	// halls (BIG / SUPER / MEGA / EPIC; MAX reuses EPIC), drawn in canvas px.
	//
	//   BG    the 1920×1080 plate, cover-scaled to the canvas, fading in
	//   FG    the two side pieces (drapes, stills, vapour rings, armillaries)
	//         sliding in from the edges and then drifting on a slow bob
	//   motes ochre and verdigris specks rising through the hall
	//
	// Landscape keeps the FG at its place on the 1920×1080 composition. Portrait
	// cover-crops the plate to its middle, so the FG pieces would fall off the
	// sides — there they move to the top-left and bottom-right corners instead,
	// clear of the text block the caller centres on the canvas (the text never
	// lands on a piece: house rule E1).
	type Props = {
		alias: string;
		/** seconds since the presentation slammed in (-1 = not running) */
		t: number;
		intensity?: number;
		/** half-height of the caller's text block, canvas px (portrait keep-out) */
		textHalfHeight?: number;
	};

	const props: Props = $props();
	const context = getContext();

	const scene = $derived(
		WIN_SCENES[(props.alias === 'max' ? 'epic' : props.alias) as keyof typeof WIN_SCENES] ?? WIN_SCENES.big,
	);
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const portrait = $derived(canvas.height > canvas.width);
	const sc = $derived(Math.max(canvas.width / 1920, canvas.height / 1080));
	const t = $derived(Math.max(0, props.t));

	const backOut = (p: number) => {
		const c = 1.70158;
		return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2;
	};
	const slide = $derived(backOut(Math.min(1, Math.max(0, (t - 0.06) / 0.5))));
	const bob = (phase: number) => Math.sin(t * 1.3 + phase) * 6;

	// portrait corner placement: each piece fitted into a corner box above /
	// below the text block
	const corner = $derived.by(() => {
		const keep = props.textHalfHeight ?? canvas.height * 0.17;
		const boxH = Math.max(40, canvas.height / 2 - keep - 12);
		const fit = (p: { w: number; h: number }) => Math.min(boxH / p.h, (canvas.width * 0.46) / p.w);
		return { boxH, l: fit(scene.fl), r: fit(scene.fr) };
	});

	const MOTE_TINTS = [0xc8973a, 0x3f8a6e, 0xa53e2b, 0xc8973a];
	const motes = Array.from({ length: 16 }, (_, i) => ({
		x: Math.random(),
		speed: 0.05 + Math.random() * 0.06,
		phase: Math.random(),
		size: 10 + Math.random() * 16,
		tint: MOTE_TINTS[i % MOTE_TINTS.length],
		sway: Math.random() * Math.PI * 2,
	}));
	const moteCount = $derived(Math.round(8 + 8 * Math.min(1, ((props.intensity ?? 1) - 1) / 0.5)));
</script>

<Container x={canvas.width / 2} y={canvas.height / 2} alpha={Math.min(1, t / 0.22)}>
	<Sprite key={scene.bg} anchor={0.5} width={1920 * sc * (1.012 + 0.006 * Math.sin(t * 0.8))} height={1080 * sc * (1.012 + 0.006 * Math.sin(t * 0.8))} />

	{#each motes.slice(0, moteCount) as mote, index (index)}
		{@const life = (mote.phase + t * mote.speed) % 1}
		<Sprite
			key="fxStar"
			anchor={0.5}
			x={(mote.x - 0.5) * canvas.width + Math.sin(t * 1.1 + mote.sway) * 14}
			y={(0.5 - life) * canvas.height * 1.05}
			width={mote.size * sc * 1.6}
			height={mote.size * sc * 1.6}
			rotation={t * 0.8 + mote.sway}
			tint={mote.tint}
			alpha={0.75 * Math.sin(Math.PI * life)}
		/>
	{/each}

	{#if !portrait}
		<Sprite
			key={scene.l}
			x={(scene.fl.x - 960) * sc - (1 - slide) * 520 * sc}
			y={(scene.fl.y - 540) * sc + bob(0)}
			width={scene.fl.w * sc}
			height={scene.fl.h * sc}
		/>
		<Sprite
			key={scene.r}
			x={(scene.fr.x - 960) * sc + (1 - slide) * 520 * sc}
			y={(scene.fr.y - 540) * sc + bob(1.7)}
			width={scene.fr.w * sc}
			height={scene.fr.h * sc}
		/>
	{:else}
		<Sprite
			key={scene.l}
			anchor={{ x: 0, y: 0 }}
			x={-canvas.width / 2 + 6 - (1 - slide) * canvas.width * 0.6}
			y={-canvas.height / 2 + 8 + (corner.boxH - scene.fl.h * corner.l) / 2 + bob(0) * 0.5}
			width={scene.fl.w * corner.l}
			height={scene.fl.h * corner.l}
		/>
		<Sprite
			key={scene.r}
			anchor={{ x: 1, y: 1 }}
			x={canvas.width / 2 - 6 + (1 - slide) * canvas.width * 0.6}
			y={canvas.height / 2 - 8 - (corner.boxH - scene.fr.h * corner.r) / 2 + bob(1.7) * 0.5}
			width={scene.fr.w * corner.r}
			height={scene.fr.h * corner.r}
		/>
	{/if}
</Container>
