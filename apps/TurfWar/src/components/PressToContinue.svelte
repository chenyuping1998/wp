<script lang="ts">
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';

	type Props = {
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
		/** false keeps the tap/space handlers but draws no label */
		showLabel?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	const label = gameText('pressToContinue');

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

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			// clear of the screen's foot, not flush on it (shadow and descenders)
			return context.stateLayoutDerived.mainLayout().height - 22;
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
			letterSpacing: 4,
			// Was cream 0xf5e3c3 on a dark BROWN stroke 0x2c1c08 — GoBananas' brass
			// again, found by reading the live scene graph rather than by grep,
			// because neither value is in the jungle-colour list anyone searched.
			// bone white, the concrete-and-paint palette; 0xffe6f7 was Hot Miami's pink
			fill: 0xf1e9dc,
			stroke: { color: 0x0e0f11, width: 4 },
			dropShadow: { color: 0x000000, blur: 8, distance: 2, angle: Math.PI / 6, alpha: 1 },
		}}
	/>
</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
