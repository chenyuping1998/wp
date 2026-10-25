<script lang="ts" module>
	import { CANVAS, boneFrame, type Point, type PointFrame, type Pose, type Rig } from '../game/meshWin/meshRig';
	import { P } from '../game/meshWin/saucerWins';

	// Prize tiers follow the math weights: 1–3 are ~90% of tags, 5–10 most of
	// the rest, 15+ are rare and 100+ only appear in free spins. The tier paints
	// the tag's face; the number stays cream with a stroke in the tier's dark.
	type Tier = { min: number; face: number; shine: number; ink: number; flash?: boolean };
	const TIERS: Tier[] = [
		{ min: 100, face: 0xffc21a, shine: 0xfff0a0, ink: 0x8c1300, flash: true }, // gold
		{ min: 40, face: 0xf05a1a, shine: 0xffa070, ink: 0x5c1200 }, // red-orange
		{ min: 15, face: 0x8e3fe0, shine: 0xc69bff, ink: 0x2e0b5c }, // purple
		{ min: 5, face: 0x2a7de1, shine: 0x8cc4ff, ink: 0x0b2f66 }, // blue
		{ min: 0, face: 0x2f9e44, shine: 0x8fdc9c, ink: 0x0f3d1b }, // pasture green
	];
	export const prizeTier = (prize: number) => TIERS.find((t) => prize >= t.min)!;

	// The cow's round collar tag (p.png, 512 art: centre 278,388, 107×100) is
	// redrawn 1.25× wide, 1.2× tall over the painted one, grown from just under
	// the bail so it keeps clear of the collar and stays inside her chest.
	// Its centre in the mesh's 256 canvas rides the rig's tag bone (tagFrame),
	// so it swings, squashes and leaps with the cow instead of floating on her.
	const GROW_X = 1.25;
	const GROW_Y = 1.2;
	const HANG = 360;
	const TAG: Point = [278.5 / 2, (HANG + (388 - HANG) * GROW_Y) / 2];
	const REST: PointFrame = { x: TAG[0], y: TAG[1], rot: 0, sx: 1, sy: 1 };
	export const tagFrame = (rig: Rig, pose: Pose): PointFrame => {
		const f = boneFrame(rig, pose, P.feetY, 'tag', TAG);
		// SymbolMeshWin scales the whole drawing by plateHit about its centre
		const k = pose.plateHit;
		return { x: CANVAS / 2 + (f.x - CANVAS / 2) * k, y: CANVAS / 2 + (f.y - CANVAS / 2) * k, rot: f.rot, sx: f.sx * k, sy: f.sy * k };
	};
	/** the tag on a sprite stretched `sy` tall about its centre (a spinning reel) */
	export const tagStretch = (sy: number): PointFrame => ({ ...REST, y: CANVAS / 2 + (TAG[1] - CANVAS / 2) * sy, sy });
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		prize: number;
		x?: number;
		y?: number;
		scale?: number;
		alpha?: number;
		landing?: boolean;
		/** where the cow's mesh has carried the tag this frame (tagFrame) */
		frame?: PointFrame | null;
	};
	const props: Props = $props();
	const K = (SYMBOL_SIZE * 0.88) / 512;
	const F = 2 * K; // the 256 canvas → px
	const frame = $derived(props.frame ?? REST);
	// from the bail down to the tag's centre: the gold pop swings from the bail
	const DROP = (TAG[1] * 2 - HANG) * K;
	const RX = 53.5 * GROW_X * K;
	const RY = 50 * GROW_Y * K;
	const value = $derived(`${props.prize}x`);
	const tier = $derived(prizeTier(props.prize));
	// Anton: 0.88em tall, digits ~0.49em and "x" ~0.47em wide; fit inside the face.
	const valueSize = $derived(Math.min((RY * 1.2) / 0.88, (RX * 1.55) / ((value.length - 1) * 0.49 + 0.47)));

	// Gold tier only: one flash as the cow lands, then it sits still. A warm
	// bloom swells behind the tag, the tag pops, a glint crosses its rim (~650ms).
	const flash = new Tween(1);
	$effect(() => {
		if (props.landing && tier.flash) {
			flash.set(0, { duration: 0 });
			flash.set(1, { duration: 650 });
		}
	});
	const t = $derived(flash.current);
	const flashing = $derived(t < 1);
	const rise = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
	const bloom = $derived(Math.sin(Math.PI * rise(0, 1)) ** 1.5);
	const pop = $derived(1 + 0.16 * Math.sin(Math.PI * rise(0.05, 0.55)));
	const glint = $derived(Math.sin(Math.PI * rise(0.2, 0.8)));
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Container
		x={(frame.x - CANVAS / 2) * F}
		y={(frame.y - CANVAS / 2) * F}
		rotation={frame.rot}
		scale={{ x: frame.sx, y: frame.sy }}
	>
		{#if flashing}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				tint={0xffd34d}
				width={RX * (3 + 1.6 * rise(0, 0.6))}
				height={RX * (3 + 1.6 * rise(0, 0.6))}
				alpha={bloom * 0.85}
			/>
		{/if}
		<Container y={-DROP} scale={pop}>
			<Container y={DROP}>
				{#key tier}
					<Graphics
						draw={(g) => {
							g.clear();
							g.ellipse(0, 0, RX, RY).fill(0x0a1530);
							g.ellipse(0, 0, RX - 1.6, RY - 1.6).fill(0xb4bcc8);
							g.ellipse(0, 0, RX - 3.2, RY - 3.2).fill(0x0a1530);
							g.ellipse(0, 0, RX - 4, RY - 4).fill(tier.face);
							g.ellipse(-RX * 0.22, -RY * 0.3, RX * 0.5, RY * 0.32).fill({ color: tier.shine, alpha: 0.45 });
						}}
					/>
				{/key}
				<Text
					text={value}
					anchor={0.5}
					y={RY * 0.04}
					style={{
						fontFamily: NUMBER_FONT,
						fontSize: valueSize,
						fontWeight: '400',
						fill: 0xfff8e6,
						stroke: { color: tier.ink, width: Math.max(3, valueSize * 0.16), join: 'round' },
					}}
				/>
		</Container>
		</Container>
		{#if flashing && glint > 0}
			<Sprite
				key="fxStar"
				anchor={0.5}
				x={RX * 0.62}
				y={-RY * 0.62}
				rotation={t * 1.2}
				tint={0xfff4c2}
				blendMode="add"
				width={RX * 1.2 * glint}
				height={RX * 1.2 * glint}
				alpha={glint}
			/>
		{/if}
	</Container>
</Container>
