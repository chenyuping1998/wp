<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { anchorToPivot, Container, Sprite, Text, type Sizes } from 'pixi-svelte';

	const context = getContext();
	const PANEL_KEY_DESKTOP = 'Frame_FSCounter.png';
	const PANEL_RATIO_DESKTOP = 824 / 622;
	const panelKey = PANEL_KEY_DESKTOP;
	const panelWidth = $derived(SYMBOL_SIZE * 2);
	const panelSizes = $derived({
		width: panelWidth,
		height: panelWidth / PANEL_RATIO_DESKTOP,
	});
	const scale = 1;
	// The old offset (board left − panel − SYMBOL_SIZE*0.7) put the panel's left
	// edge at roughly −38px, so the ornate frame was sliced by the canvas edge and
	// read as a bright sliver in the top-left corner. Clamp it to a margin so the
	// whole panel always stays on-canvas.
	const position = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const boardLeft = board.x - board.width * 0.5;
		const MARGIN = SYMBOL_SIZE * 0.2;
		const GAP = SYMBOL_SIZE * 0.22;
		return {
			x: Math.max(MARGIN, boardLeft - panelSizes.width - GAP),
			y: board.y - board.height * 0.5,
		};
	});

	const fontSize = SYMBOL_SIZE * 0.22;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	let titleSizes: Sizes = $state({ width: 0, height: 0 });
	let counterSizes: Sizes = $state({ width: 0, height: 0 });

	const textContainerSizes = $derived({
		width: titleSizes.width,
		height: titleSizes.height + counterSizes.height,
	});
	const counterPosition = $derived({ x: titleSizes.width / 2, y: titleSizes.height });

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});
</script>

<MainContainer>
	<FadeContainer {show} {...position} {scale}>
		<Sprite key={panelKey} {...panelSizes} />
		<Container
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.48}
			pivot={anchorToPivot({
				sizes: textContainerSizes,
				anchor: { x: 0.5, y: 0.5 },
			})}
		>
			<!-- same type treatment as the WILD PARTY title -->
			<Text
				text={'FREE SPIN'}
				style={{
					fontFamily: 'Cinzel, Georgia, serif',
					fontSize,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 2,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 8,
					dropShadowDistance: 0,
				}}
				onresize={(sizes) => (titleSizes = sizes)}
			/>
			<Text
				text={`${current} OF ${total}`}
				{...counterPosition}
				anchor={{ x: 0.5, y: 0 }}
				style={{
					fontFamily: 'Cinzel, Georgia, serif',
					fontSize,
					fontWeight: '900',
					fill: 0xfff4cf,
					letterSpacing: 2,
					dropShadow: true,
					dropShadowColor: 0xff9edf,
					dropShadowBlur: 8,
					dropShadowDistance: 0,
				}}
				onresize={(sizes) => (counterSizes = sizes)}
			/>
		</Container>
	</FadeContainer>
</MainContainer>
