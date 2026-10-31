<script lang="ts">
	
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import IntroFeatures from '../components/ui/TreasureIntro.svelte';
	import { setContext } from '../game/context';
	import { stateLayout } from '../game/stateLayout';
	import { fade } from 'svelte/transition';

	import messagesMap from '../i18n/messagesMap';

	

	

	// One opening card, not three. IntroFeatures now carries the studio mark, the
	// wordmark, the volatility, what the game does and the tap that starts it, so
	// the separate studio loader is gone from the boot path (the component is left
	// in the tree — restoring it is one import). It skips itself in replay mode.
	let showIntro = $state(true);

	setContext();
	stateLayout.showLoadingScreen=true;
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!--
	No platform splash in front of this. Stake's certification notes are explicit
	that the Stake Engine splash must be removed while your own studio logo stays —
	two different things, easy to delete both by accident. The studio mark is
	inside IntroFeatures. LoaderStakeEngine is out of the boot path AND
	static/stake-engine-loader.gif is deleted — the checklist line is "does not
	CONTAIN the Stake Engine Loader", and an asset left in static/ still lands in
	build/ and is still served. Keeping it "so restoring it is one line" is
	precisely what that line forbids (approval-guidelines.md, PreChecks).
-->
{#if showIntro}
	<div class="opening" out:fade={{duration:280}}><IntroFeatures onclose={() => {stateLayout.showLoadingScreen=false;showIntro=false;}} /></div>
{/if}



<style>.opening{position:fixed;inset:0;z-index:100}:global(body){overflow:hidden;background:#000}</style>
