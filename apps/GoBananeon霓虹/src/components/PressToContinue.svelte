<script lang="ts">
	import { onMount } from 'svelte';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import TextMesh from './TextMesh.svelte';

	// a slow wave running through the letters, under the breathing alpha
	const PROMPT_ACT = { hop: 0, boing: 0, wiggle: 0, wave: 0.6 };
	const FILL = 0xf5e3c3;

	type Props = {
		onpress: () => void;
		position?: 'bottom' | 'betweenBoardAndBottom';
	};

	const props: Props = $props();
	const context = getContext();

	const label = gameText('pressToContinue');

	// soft breathing pulse so the prompt reads as interactive
	let pulse = $state(1);
	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Date.now() / 480));
		}, 50);
		return () => clearInterval(id);
	});

	const yPosition = $derived.by(() => {
		if (props.position !== 'betweenBoardAndBottom') {
			return context.stateLayoutDerived.mainLayout().height;
		}
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		return (board.y + board.height * 0.5 + main.height) * 0.5;
	});
</script>

<MainContainer alignVertical="bottom">
	<Container alpha={pulse}>
		<TextMesh
			text={label}
			anchor={{ x: 0.5, y: 1 }}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={yPosition}
			fontSize={28}
			letterSpacing={4}
			fill={[FILL]}
			stroke={0x2c1c08}
			strokeWidth={4}
			shadow={{ blur: 8, distance: 2 }}
			act={PROMPT_ACT}
		/>
	</Container>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
