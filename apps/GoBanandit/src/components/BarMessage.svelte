<script lang="ts">
	// The bet bar's status line (uiTheme.barMessage, 'print' skin only): what the
	// game is waiting for, in the span between Win and the stepper that used to
	// sit empty. Idle it alternates the call to bet with the game's one rule;
	// during a round it wishes luck; in the free game it says the heist is on.
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { uiSkin } from '../game/uiTheme';

	const context = getContext();
	const IDLE_SWAP_MS = 4000;

	let tick = $state(0);
	onMount(() => {
		if (uiSkin !== 'print') return;
		const id = setInterval(() => (tick += 1), IDLE_SWAP_MS);
		return () => {
			clearInterval(id);
			uiTheme.barMessage = '';
		};
	});

	$effect(() => {
		if (uiSkin !== 'print') return;
		uiTheme.barMessageFill = 0x1f5c4a;
		if (context.stateGame.gameType === 'freegame') uiTheme.barMessage = gameText('heistOn');
		else if (!context.stateXstateDerived.isIdle()) uiTheme.barMessage = gameText('goodLuck');
		else uiTheme.barMessage = gameText(tick % 2 ? 'collectTip' : 'placeBet');
	});
</script>
