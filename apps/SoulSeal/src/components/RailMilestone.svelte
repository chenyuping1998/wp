<script lang="ts" module>
	/**
	 * The plaque shown when the talisman rail reaches a milestone.
	 *
	 * A milestone is the loudest thing the feature does short of a big win: it adds
	 * free spins AND steps the collect multiplier, and it can happen three times in
	 * a run. Until now the only thing that marked it was a "+8" floating off the
	 * rail - the same rail that is already showing twelve small sockets - so the
	 * single most consequential moment in the feature was also one of the quietest
	 * things on screen.
	 *
	 * ── why this is not the free-spin intro ──
	 *
	 * A retrigger reuses FreeSpinIntro, and the obvious move was to reuse it here
	 * too: it is the same news. It is not the same INTERRUPTION. That sign waits on
	 * PressToContinue, which is correct for a retrigger (once, and the player is
	 * being handed a whole new run) and wrong for a milestone, which can fire three
	 * times inside one feature. Three taps to get through one feature is a worse
	 * outcome than the quiet "+8" this replaces.
	 *
	 * So it is the same OBJECT - FreeSpinAnimation drops the same carved sign in
	 * the same way - on its own clock, holding just long enough to be read and then
	 * taking itself away.
	 */
	export type EmitterEventRailMilestone = {
		type: 'railMilestoneShow';
		awardedFs: number;
		collectMultiplier: number;
	};
</script>

<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { waitForTimeout } from 'utils-shared/wait';

	import { displayFontFor, displayWeightFor } from '../game/fonts';
	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// Long enough to read three short lines, short enough that three of them in one
	// feature do not become the feature. The sign's own drop-and-swing is about
	// 700ms of that.
	const HOLD_MS = 1500;

	let show = $state(false);
	let awardedFs = $state(0);
	let collectMultiplier = $state(1);

	const title = gameText('freeSpins');

	context.eventEmitter.subscribeOnMount({
		railMilestoneShow: async (event) => {
			awardedFs = event.awardedFs;
			collectMultiplier = event.collectMultiplier;
			show = true;
			await waitForTimeout(HOLD_MS);
			show = false;
			// let the fade finish before the caller moves on
			await waitForTimeout(220);
		},
	});
</script>

<FadeContainer {show}>
	<FreeSpinAnimation>
		{#snippet children({ sizes })}
			<Text
				anchor={0.5}
				y={-sizes.height * 0.28}
				text={title}
				style={{
					fontFamily: displayFontFor(title),
					fontSize: Math.min(sizes.width * 0.11, (sizes.width * 1.3) / title.length),
					fontWeight: displayWeightFor(title),
					letterSpacing: 5,
					fill: [0xfff3bd, 0xffd75e, 0xc9821a],
					stroke: { color: 0x54330a, width: 5 },
				}}
			/>
			<!--
				The spins are the headline and the multiplier is the consequence, so the
				spins take the big slot and the multiplier sits under them. A milestone
				gives both and the player has to leave with both.
			-->
			<GoldText y={sizes.height * 0.04} text={`+${awardedFs}`} fontSize={sizes.width * 0.2} />
			{#if collectMultiplier > 1}
				{@const line = `COLLECT x${collectMultiplier}`}
				<Text
					anchor={0.5}
					y={sizes.height * 0.31}
					text={line}
					style={{
						fontFamily: displayFontFor(line),
						fontSize: Math.min(sizes.width * 0.055, (sizes.width * 1.1) / line.length),
						fontWeight: displayWeightFor(line),
						letterSpacing: 3,
						fill: 0xf2d544,
						stroke: { color: 0x2c1c08, width: 3 },
					}}
				/>
			{/if}
		{/snippet}
	</FreeSpinAnimation>
</FadeContainer>
