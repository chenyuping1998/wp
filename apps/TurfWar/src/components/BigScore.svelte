<script lang="ts" module>
	export type EmitterEventBigScore =
		| { type: 'bigScorePlay'; mult: number; pays: boolean }
		| { type: 'bigScoreClear' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import { TITLE_FONT, TITLE_FONT_WEIGHT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { featureScaled } from '../game/timeScale';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();
	const charge = new Tween(0, { duration: 0 });
	const frame = new Tween(0, { duration: 0 });
	const callout = new Tween(0, { duration: 0 });
	let visible = $state(false);
	let badgeShown = $state(false);
	let multiplier = $state(0);
	let sequence = 0;
	const scaled = (ms: number) => featureScaled(ms);
	const pause = (ms: number) => waitForTimeout(scaled(ms));

	context.eventEmitter.subscribeOnMount({
		bigScoreClear: () => {
			sequence += 1;
			visible = false;
			badgeShown = false;
			void charge.set(0, { duration: 0 });
			void frame.set(0, { duration: 0 });
			void callout.set(0, { duration: 0 });
		},
		bigScorePlay: async ({ mult, pays }) => {
			const ownSequence = ++sequence;
			multiplier = mult;
			visible = true;
			badgeShown = false;
			void charge.set(0, { duration: 0 });
			void frame.set(0, { duration: 0 });
			void callout.set(0, { duration: 0 });

			// The edge reaches around the board before the Loot Bag lands. The
			// printed value arrives on the impact, never before its own sound.
			await charge.set(1, { duration: scaled(390), easing: cubicOut });
			if (ownSequence !== sequence) return;
			context.eventEmitter.broadcast({ type: 'soundFrameBigLand' });
			await Promise.all([
				frame.set(1, { duration: scaled(235), easing: backOut }),
				callout.set(1, { duration: scaled(175), easing: backOut }),
			]);
			await pause(430);
			if (ownSequence !== sequence) return;
			await callout.set(0, { duration: scaled(190), easing: cubicOut });
			if (pays) {
				// Keep the board-wide multiplier legible during the win-line volley.
				badgeShown = true;
			} else {
				// A full-board Bag can land on a losing spin. Its near-miss beat ends
				// here instead of leaving a large multiplier over a zero payout.
				await Promise.all([
					frame.set(0, { duration: scaled(190), easing: cubicOut }),
					charge.set(0, { duration: scaled(190), easing: cubicOut }),
				]);
				if (ownSequence === sequence) visible = false;
			}
		},
	});
</script>

{#if visible}
	<BoardContainer>
		<Container x={BOARD_SIZES.width / 2} y={BOARD_SIZES.height / 2}>
			<Sprite
				key="turfFrameFullEdge"
				anchor={0.5}
				width={BOARD_SIZES.width}
				height={BOARD_SIZES.height}
				alpha={0.52 * charge.current}
				blendMode="screen"
			/>
			<Sprite
				key="turfFrameFull"
				anchor={0.5}
				width={BOARD_SIZES.width}
				height={BOARD_SIZES.height}
				scale={1.09 - 0.09 * frame.current}
				alpha={frame.current}
			/>
			<Text
				text="THE BIG SCORE"
				anchor={0.5}
				y={-SYMBOL_SIZE * 0.32}
				alpha={callout.current}
				style={{
					fontFamily: TITLE_FONT,
					fontWeight: TITLE_FONT_WEIGHT,
					fontSize: 36,
					letterSpacing: 3,
					fill: 0xffe9c6,
					stroke: { color: 0x0e0f11, width: 6 },
				}}
			/>
			<Text
				text={`${multiplier}×`}
				anchor={0.5}
				y={SYMBOL_SIZE * 0.18}
				scale={0.8 + 0.2 * callout.current}
				alpha={callout.current}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					fontSize: 76,
					fill: 0xf5893d,
					stroke: { color: 0x0e0f11, width: 8 },
				}}
			/>
			{#if badgeShown}
				<Text
					text={`${multiplier}×`}
					anchor={{ x: 0.5, y: 0 }}
					y={-BOARD_SIZES.height / 2 + 7}
					style={{
						fontFamily: DISPLAY_FONT,
						fontWeight: DISPLAY_FONT_WEIGHT,
						fontSize: 32,
						fill: 0xffe9c6,
						stroke: { color: 0x0e0f11, width: 5 },
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
{/if}
