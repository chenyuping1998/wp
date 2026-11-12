<script lang="ts">
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { canvasLine, gameText, trackingFor } from '../game/i18nText';

	type Props = {
		/** wording for the hint; defaults to the generic press-to-continue line */
		label?: string;
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
		/** false keeps the tap/space handlers but draws no label */
		showLabel?: boolean;
		/**
		 * 'ink' (default): dark-brown ink with a paper edge, for the parchment
		 * screens (the loading screen). 'light': bone with an ink keyline, for
		 * prompts drawn over the free-game panels' dark scrim.
		 */
		tone?: 'ink' | 'light';
	};

	const props: Props = $props();
	const context = getContext();

	const label = $derived(canvasLine(props.label ?? gameText('pressToContinue')));
	const tone = $derived(props.tone ?? 'ink');
	/** GameClock's ink and paper edge; palette.ts bone for the light tone */
	const INK = 0x3b2414;
	const PAPER_EDGE = 0xf2e4c4;
	const BONE = 0xf1ead8;

	// Soft breathing pulse so the prompt reads as interactive. On the frame clock:
	// it was a 50 ms interval — 20 steps a second — and visibly stepped.
	let pulse = $state(1);
	onMount(() => {
		let raf = 0;
		const tick = (now: number) => {
			pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now / 480));
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// Clear of the screen's foot. Anchored at the very bottom the free-game
	// intro's prompt sat flush on the edge with its lower half cut off.
	const BOTTOM_MARGIN = 22;

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			return context.stateLayoutDerived.mainLayout().height - BOTTOM_MARGIN;
		}
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		return (board.y + board.height * 0.5 + main.height) * 0.5;
	});
</script>

{#if props.showLabel !== false}
<MainContainer alignVertical="bottom">
	<Text
		text={label}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		y={yPosition}
		alpha={pulse}
		style={{
			fontFamily: TITLE_FONT,
			fontSize: 28,
			fontWeight: TITLE_FONT_WEIGHT,
			letterSpacing: trackingFor(4),
			// Same treatment as GameClock.svelte: the game's dark-brown ink with a
			// thin paper-tone edge, so the prompt reads on the parchment loading
			// screen (the old pale bone fill on a dark keyline barely separated
			// from the paper). Over the free-game panels' dark scrim the tone flips.
			fill: tone === 'ink' ? INK : BONE,
			stroke: { color: tone === 'ink' ? PAPER_EDGE : INK, width: tone === 'ink' ? 3 : 4 },
		}}
	/>
</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
