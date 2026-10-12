<script lang="ts">
	// The bet bar's status line (uiTheme.barMessage, 'print' skin only): what the
	// game is waiting for, in the span between Win and the stepper that used to
	// sit empty. Idle it alternates the call to bet with the game's one rule;
	// during a round it wishes luck; in the free game it says the heist is on.
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { uiSkin } from '../game/uiTheme';

	const context = getContext();
	const IDLE_PROMPT_MS = 6500;
	const IDLE_RULE_MS = 20000;

	let tick = $state(0);
	onMount(() => {
		if (uiSkin !== 'print') return;
		let timer: ReturnType<typeof setTimeout>;
		const swap = () => {
			tick += 1;
			timer = setTimeout(swap, tick % 2 ? IDLE_RULE_MS : IDLE_PROMPT_MS);
		};
		timer = setTimeout(swap, IDLE_PROMPT_MS);
		return () => {
			clearTimeout(timer);
			uiTheme.barMessage = '';
		};
	});

	$effect(() => {
		if (uiSkin !== 'print') return;
		uiTheme.barMessageFill = 0x4a4846;
		if (context.stateGame.gameType === 'freegame') uiTheme.barMessage = gameText('heistOn');
		else if (!context.stateXstateDerived.isIdle()) uiTheme.barMessage = gameText('goodLuck');
		// social play may not say "bet" (restricted-word table)
		else if (tick % 2) uiTheme.barMessage = gameText('collectTip');
		else uiTheme.barMessage = gameText(stateUrlDerived.social() ? 'comePlay' : 'placeBet');
	});
</script>
