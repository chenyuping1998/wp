<script lang="ts">
	/**
	 * The bet bar's status line (uiTheme.barMessage): one short line in the span
	 * between the Win readout and the − stepper, which otherwise sits empty.
	 *
	 *   idle        alternates the call to play with the game's one rule
	 *   a round     wishes luck
	 *   free game   says the multipliers add up
	 *
	 * Draws nothing itself; the shared bar renders the text.
	 */
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { barText } from '../game/barText';

	const context = getContext();
	const IDLE_PROMPT_MS = 6500;
	const IDLE_TIP_MS = 12000;

	let tick = $state(0);
	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const swap = () => {
			tick += 1;
			timer = setTimeout(swap, tick % 2 ? IDLE_TIP_MS : IDLE_PROMPT_MS);
		};
		timer = setTimeout(swap, IDLE_PROMPT_MS);
		return () => {
			clearTimeout(timer);
			uiTheme.barMessage = '';
		};
	});

	$effect(() => {
		if (context.stateGame.gameType === 'freegame') uiTheme.barMessage = barText('multipliersAddUp');
		else if (!context.stateXstateDerived.isIdle()) uiTheme.barMessage = barText('goodLuck');
		else if (tick % 2) uiTheme.barMessage = barText('medusaTip');
		// social play may not say "bet" (restricted-word table)
		else uiTheme.barMessage = barText(stateUrlDerived.social() ? 'comePlay' : 'placeBet');
	});
</script>
