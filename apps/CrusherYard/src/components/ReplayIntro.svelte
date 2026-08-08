<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';
	import { socialTerms } from '../game/socialTerms';
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';

	/**
	 * The card a replay opens on.
	 *
	 * A replay link is not a bet: nothing is staked and no round is ended (see
	 * handleRequestEndRound's early return), so the same round can be watched as
	 * many times as the viewer likes. What the shared code does by default is play
	 * it immediately, once, the instant `betToResume` lands — which means someone
	 * following a link arrives mid-animation with no idea what they are looking at,
	 * and no way to see it again.
	 *
	 * This holds the round instead. The card names it, the viewer starts it, and
	 * when it finishes the card comes back so it can be run again.
	 *
	 * ── how the round is held ──
	 * The xstate resumeGame actor takes `stateBet.betToResume` and NULLS it before
	 * playing, so it is a one-shot by construction. The round is therefore lifted
	 * out of `betToResume` as soon as Authenticate puts it there — which also stops
	 * the machine from auto-playing it — kept here, and put back for each run.
	 */
	const context = getContext();
	const T = socialTerms();

	const isReplay = stateUrlDerived.replay();

	type Round = typeof stateBet.betToResume;
	let round = $state<Round>(null);
	let show = $state(false);

	// 'waiting'  — the card is up
	// 'starting' — the round has been handed back, the machine has not left idle
	// 'running'  — the machine is playing it
	//
	// The middle state exists because the machine leaves idle asynchronously:
	// without it, the same effect that starts the round would see idle still true
	// on the next tick and put the card straight back up.
	let phase = $state<'waiting' | 'starting' | 'running'>('waiting');

	$effect(() => {
		if (!isReplay) return;
		const pending = stateBet.betToResume;
		if (pending && !round) {
			round = pending;
			stateBet.betToResume = null;
			show = true;
		}
	});

	$effect(() => {
		if (!isReplay || !round) return;
		const idle = context.stateXstateDerived.isIdle();
		if (phase === 'starting' && !idle) phase = 'running';
		else if (phase === 'running' && idle) {
			phase = 'waiting';
			show = true;
		}
	});

	const start = () => {
		if (!round || phase !== 'waiting') return;
		show = false;
		phase = 'starting';
		// The actor consumes this and nulls it; `round` is the copy that survives.
		stateBet.betToResume = round;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_btn_general' });
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};

	// What the round was worth, if the replay link carried a multiplier. Shown
	// because it is generally the reason the link was sent at all.
	const wonAmount = $derived(
		round?.payoutMultiplier ? stateBet.betAmount * round.payoutMultiplier : 0,
	);
</script>

{#if isReplay}
	<FadeContainer {show}>
		<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.62} />

		<MainContainer>
			<Container
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
			>
				<!-- the hanging iron plaque the free-spin boards already use -->
				<Sprite
					key="cyFsSign"
					anchor={0.5}
					width={SYMBOL_SIZE * 6.4}
					height={SYMBOL_SIZE * 3.2}
				/>

				<Text
					anchor={0.5}
					y={-SYMBOL_SIZE * 0.72}
					text="REPLAY"
					style={{
						fontFamily: GAME_FONT,
						fontWeight: GAME_FONT_WEIGHT,
						fontSize: SYMBOL_SIZE * 0.52,
						letterSpacing: 6,
						fill: [0xfff3bd, 0xffd75e, 0xc9821a],
						stroke: 0x54330a,
						strokeThickness: 5,
						dropShadow: true,
						dropShadowColor: 0x000000,
						dropShadowBlur: 10,
						dropShadowDistance: 3,
					}}
				/>

				{#if wonAmount > 0}
					<GoldText
						y={SYMBOL_SIZE * 0.16}
						text={bookEventAmountToCurrencyString(wonAmount)}
						fontSize={SYMBOL_SIZE * 0.62}
						maxWidth={SYMBOL_SIZE * 5}
					/>
					<Text
						anchor={0.5}
						y={SYMBOL_SIZE * 0.96}
						text={`THIS ROUND ${T.paid.toUpperCase()}`}
						style={{
							fontFamily: GAME_FONT,
							fontWeight: GAME_FONT_WEIGHT,
							fontSize: SYMBOL_SIZE * 0.2,
							letterSpacing: 3,
							fill: 0xf5e3c3,
							stroke: 0x2c1c08,
							strokeThickness: 3,
						}}
					/>
				{/if}
			</Container>
		</MainContainer>

		<PressToContinue position="betweenBoardAndBottom" onpress={start} />
	</FadeContainer>
{/if}
