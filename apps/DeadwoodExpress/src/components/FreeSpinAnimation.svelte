<script lang="ts" module>
	// How long the sign takes to drop in. Exported so FreeSpinIntro can hold its
	// number back until the sign is under it instead of guessing.
	export const SIGN_DROP_MS = 700;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { featureScaled } from '../game/timeScale';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { PLATE_BODY, PLATE_INSET, PLATE_KEY } from '../game/plate';

	// The painted brass nameplate (see game/plate.ts) drops in from the top and
	// settles with a swing. Children render centred on its dark inset.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		/**
		 * Lift the plaque off the board's centre line, in fractions of its own
		 * height. Default 0 — exactly where it has always hung. FreeSpinIntro uses
		 * it to make room for the tier's description panel underneath.
		 */
		offsetY?: number;
		/**
		 * Uniform scale on the whole plaque. Default 1 — the size it has always
		 * been. FreeSpinIntro shrinks it when it also has a description panel to
		 * show: at full size the plaque alone fills the height between the board's
		 * top edge and the bet strip, and there is no room left underneath it.
		 */
		scale?: number;
	};

	const props: Props = $props();

	const context = getContext();
	// Square canvas; the riveted body is about half its height, so the side is
	// sized for the body to span the board the way the old plank did.
	const SIGN_SIDE = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 1.02;
	const SIGN_SIZES = { width: SIGN_SIDE, height: SIGN_SIDE };
	const BODY_HEIGHT = SIGN_SIDE * PLATE_BODY.height;
	const TEXT_AREA = {
		width: SIGN_SIDE * PLATE_INSET.width,
		height: SIGN_SIDE * PLATE_INSET.height,
	};

	const dropY = new Tween(-SIGN_SIDE * 1.1);
	const swing = new Tween(0);
	// one bright pass over the brass as it lands — the plate catching the light
	const glint = new Tween(0);

	// Turbo-scaled like NeonFrames. FreeSpinIntro times its number slam to land as
	// this sign settles (SIGN_DROP_MS), so if the drop stopped scaling the two
	// would come apart in turbo — the number would hit an sign still in the air.
	const scaled = (ms: number) => featureScaled(ms);

	onMount(() => {
		dropY.set(0, { duration: scaled(SIGN_DROP_MS), easing: backOut });
		(async () => {
			await glint.set(0.55, { duration: scaled(120), delay: scaled(SIGN_DROP_MS * 0.55) });
			await glint.set(0, { duration: scaled(520), easing: cubicOut });
		})();
		(async () => {
			await swing.set(0.035, { duration: scaled(380), easing: cubicOut, delay: scaled(250) });
			await swing.set(-0.022, { duration: scaled(420), easing: cubicOut });
			await swing.set(0.01, { duration: scaled(420), easing: cubicOut });
			await swing.set(0, { duration: scaled(380), easing: cubicOut });
		})();
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y +
			dropY.current +
			BODY_HEIGHT * (props.scale ?? 1) * (props.offsetY ?? 0)}
		rotation={swing.current}
		scale={props.scale ?? 1}
	>
		<Sprite key={PLATE_KEY} anchor={0.5} {...SIGN_SIZES} />
		{#if glint.current > 0.01}
			<Sprite key={PLATE_KEY} anchor={0.5} {...SIGN_SIZES} blendMode="add" alpha={glint.current} />
		{/if}
		<!-- children sit centred on the dark inset, under the crest -->
		<Container y={SIGN_SIDE * PLATE_INSET.centerY}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>
