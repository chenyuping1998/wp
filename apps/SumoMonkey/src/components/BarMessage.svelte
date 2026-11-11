<script lang="ts">
	// The bet bar's status line (uiTheme.barMessage, 'print' skin only): what the
	// game is waiting for, in the span between Win and the stepper that used to
	// sit empty. Idle it alternates the call to bet with the game's one rule;
	// during a round it wishes luck; in the free game it names the feature being played.
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateBet, stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { uiSkin } from '../game/uiTheme';

	const context = getContext();
	const IDLE_SWAP_MS = 4000;
	const FREE_GAME_TEXT: Record<string, 'heistOn' | 'yokozunaOn'> = { BONUS: 'heistOn', SUPERBONUS: 'yokozunaOn' };

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
		uiTheme.barMessageFill = 0x282828;
		if (context.stateGame.gameType === 'freegame') uiTheme.barMessage = gameText(FREE_GAME_TEXT[stateBet.activeBetModeKey.toUpperCase()] ?? 'freeSpinsOn');
		else if (!context.stateXstateDerived.isIdle()) uiTheme.barMessage = gameText('goodLuck');
		// social play may not say "bet" (restricted-word table)
		else if (tick % 2) uiTheme.barMessage = gameText('collectTip');
		else uiTheme.barMessage = gameText(stateUrlDerived.social() ? 'comePlay' : 'placeBet');
	});
</script>
