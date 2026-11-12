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
	import { HUD_ART } from '../game/assetsHud';

	// The parchment card (waPanel, ui-modal-b, 1060×673) that drops in from the
	// top and settles with a swing. Children render at the centre of its cream
	// field, and the TEXT_AREA they get is that field — measured off the art.
	// Text on it is sepia ink (GoldText variant="ink"), never light-on-cream.
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
	const SIGN_RATIO = HUD_ART.panel.w / HUD_ART.panel.h;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// cream field 70..1337 × 74..821 of the 1409×895 source, centred
	const TEXT_AREA = {
		width: SIGN_SIZES.width * HUD_ART.panel.fieldW,
		height: SIGN_SIZES.height * HUD_ART.panel.fieldH,
	};

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	// Turbo-scaled like Searchlights. FreeSpinIntro times its number slam to land as
	// this sign settles (SIGN_DROP_MS), so if the drop stopped scaling the two
	// would come apart in turbo — the number would hit an sign still in the air.
	const scaled = (ms: number) => featureScaled(ms);

	onMount(() => {
		dropY.set(0, { duration: scaled(SIGN_DROP_MS), easing: backOut });
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
			SIGN_SIZES.height * (props.scale ?? 1) * (props.offsetY ?? 0)}
		rotation={swing.current}
		scale={props.scale ?? 1}
	>
		<Sprite key="waPanel" anchor={0.5} {...SIGN_SIZES} />
		<!-- children sit centred on the cream field -->
		<Container>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>
