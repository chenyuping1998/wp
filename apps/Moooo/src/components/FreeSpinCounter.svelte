<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622)
	const PANEL_RATIO = 824 / 622;
	const panelWidth = $derived(SYMBOL_SIZE * 1.8);
	// BoardFrame draws the housing this much larger than the reel area, so the
	// board's real left edge is boardLayout().width * scale * this / 2 out from
	// centre — NOT half the raw width. Positioning off the raw width is what this
	// used to do, which meant the plaque stayed put while the board grew past it.
	const FRAME_SCALE = 1280 / 1000;
	const housingHalfWidth = $derived(
		context.stateGameDerived.boardLayout().width *
			context.stateGameDerived.boardLayout().scale *
			FRAME_SCALE *
			0.5,
	);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centered above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - panelSizes.width * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 0.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						housingHalfWidth -
						panelSizes.width -
						SYMBOL_SIZE * 0.1,
					// Pinned near the top of the screen rather than to the board's top
					// edge. With the side-rail UI the Buy Bonus button is centred in
					// the left rail, and the board now fills 94% of the height — the
					// old board-relative position put this plaque straight through it.
					y: context.stateLayoutDerived.mainLayout().height * 0.05,
				},
	);

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	// 2026-08-27: this was gated on `stateBet.activeBetModeKey === 'SUPERSPIN'`,
	// and no such mode exists here — Moooo's keys are BASE / BONUS / SUPER (see
	// game/betModeMeta.ts and `modes` in the maths bundle). The comparison could
	// never be true, so everything behind it was unreachable: a "RESPINS" title,
	// a big remaining-respins figure, and a row of pips. All of it describes Hot
	// Miami's hold'n'spin.
	//
	// Deleted rather than repointed at 'SUPER'. Repointing would have SHOWN the
	// hold'n'spin counter during Super Free Spins, which is worse than dead code:
	// it would tell a player they have 3 respins left in a ten-spin feature.
	// Moooo's Super Free Spins is ten ordinary free spins whose meters start a
	// step higher, and it counts exactly like the plain ones.
	const title = $derived(gameText('freeSpins'));

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
	<FadeContainer {show} {...position}>
		<Sprite key="mooooFsPanel" {...panelSizes} />

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				// warm gold ramp; the third stop was 0xff8ede (Miami pink)
				fill: [0xffe98a, 0xffd75e, 0xe8a13c],
				stroke: 0x1a0f06,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		<!-- current spin of total -->
		<GoldText
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.58}
			text={`${Math.min(current, total)} / ${total}`}
			fontSize={panelSizes.width * 0.19}
			maxWidth={panelSizes.width * 0.72}
		/>
	</FadeContainer>
</MainContainer>
