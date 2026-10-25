<script lang="ts" module>
	import { CANVAS, boneFrame, type Point, type PointFrame, type Pose, type Rig } from '../game/meshWin/meshRig';
	import { P } from '../game/meshWin/puttWins';

	// Prize tiers follow the math weights: 1–3 are ~90% of balls, 5–10 most of
	// the rest, 15+ are rare and 100+ only appear in free spins.
	type Tier = { min: number; fill: number; stroke: number; shadow?: number; flash?: boolean };
	const TIERS: Tier[] = [
		{ min: 100, fill: 0xffc81e, stroke: 0x8c1300, shadow: 0x4a0a00, flash: true }, // gold
		{ min: 40, fill: 0xff5a1f, stroke: 0x6e1400, shadow: 0x3a0a00 }, // flag red-orange
		{ min: 15, fill: 0xa64dff, stroke: 0x3a0f6e, shadow: 0x1e0838 }, // purple
		{ min: 5, fill: 0x2a8cff, stroke: 0x0b2f66 }, // sky blue
		{ min: 0, fill: 0x2fa84a, stroke: 0x0f3d1b }, // fairway green
	];
	export const prizeTier = (prize: number) => TIERS.find((t) => prize >= t.min)!;

	// The value is printed on the ball, so it rides the ball's mesh: squashed on
	// the landing, tipped and lifted in the collection beat (ballFrame). Its
	// place at rest is the symbol's centre.
	const CENTRE: Point = [CANVAS / 2, CANVAS / 2];
	const REST: PointFrame = { x: CENTRE[0], y: CENTRE[1], rot: 0, sx: 1, sy: 1 };
	export const ballFrame = (rig: Rig, pose: Pose): PointFrame => {
		const f = boneFrame(rig, pose, P.feetY, 'body', CENTRE);
		// SymbolMeshWin scales the whole drawing by plateHit about its centre
		const k = pose.plateHit;
		return { x: CANVAS / 2 + (f.x - CANVAS / 2) * k, y: CANVAS / 2 + (f.y - CANVAS / 2) * k, rot: f.rot, sx: f.sx * k, sy: f.sy * k };
	};
	/** the ball on a sprite stretched `sy` tall about its centre (a spinning reel) */
	export const ballStretch = (sy: number): PointFrame => ({ ...REST, sy });
</script>

<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { SYMBOL_SIZE } from '../game/constants';
	import { NUMBER_FONT } from '../game/fonts';

	// Keep prize numbers centred on the white ball; digits are about a third of
	// the ball's diameter (ball = 385/512 of the 0.88 symbol sprite).
	type Props = {
		prize: number;
		x?: number;
		y?: number;
		scale?: number;
		alpha?: number;
		landing?: boolean;
		/** where the ball's mesh has carried its centre this frame (ballFrame) */
		frame?: PointFrame | null;
	};
	const props: Props = $props();
	const F = (SYMBOL_SIZE * 0.88) / CANVAS; // the 256 canvas → px
	const frame = $derived(props.frame ?? REST);
	const BALL = SYMBOL_SIZE * 0.88 * (385 / 512);
	const value = $derived(`${props.prize}x`);
	const tier = $derived(prizeTier(props.prize));
	// Anton digits are 0.88em tall; four characters shrink to stay inside the ball.
	const valueSize = $derived(Math.round((BALL / 3 / 0.88) * (value.length > 3 ? 0.88 : 1)));

	// Gold tier only: one flash as the ball lands, then it sits still. A warm
	// bloom swells behind the number, the number pops, a glint crosses its top
	// right corner (~650ms in all).
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
				blendMode="normal"
				width={BALL * (0.7 + 0.5 * rise(0, 0.6))}
				height={BALL * (0.7 + 0.5 * rise(0, 0.6))}
				alpha={bloom * 0.85}
			/>
		{/if}
		<Text
			text={value}
			anchor={0.5}
			scale={pop}
			style={{
				fontFamily: NUMBER_FONT,
				fontSize: valueSize,
				fontWeight: '400',
				fill: tier.fill,
				stroke: { color: tier.stroke, width: Math.max(4, valueSize * 0.14), join: 'round' },
				dropShadow: tier.shadow
					? { color: tier.shadow, alpha: 0.55, blur: 2, distance: 2, angle: Math.PI / 2 }
					: undefined,
			}}
		/>
		{#if flashing && glint > 0}
			<Sprite
				key="fxStar"
				anchor={0.5}
				x={BALL * 0.3}
				y={-valueSize * 0.4}
				rotation={t * 1.2}
				tint={0xffe27a}
				blendMode="normal"
				width={valueSize * 1.1 * glint}
				height={valueSize * 1.1 * glint}
				alpha={glint}
			/>
		{/if}
	</Container>
</Container>
