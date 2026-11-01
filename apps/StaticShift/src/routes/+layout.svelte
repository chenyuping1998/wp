<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import WildPartyLoader from '../components/WildPartyLoader.svelte';
	import { setContext } from '../game/context';
	import { stateConfig } from 'state-shared';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	// Authenticate finishes before LoadI18n and Game mount, so server-only social
	// sessions choose English and social copy before any game text is created.
	stateConfig.useJurisdictionSocial = true;
	stateConfig.replayAmountFallback = 1_000_000;
	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!--
	The Stake Engine splash that used to gate this has been removed at
	certification's request. The loader below is our own studio logo and stays.
-->
<WildPartyLoader />

{@render props.children()}
