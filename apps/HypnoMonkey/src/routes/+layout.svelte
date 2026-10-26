<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import StudioLoader from '../components/WildPartyLoader.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

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
	The Stake Engine loader gif used to run here first, and the studio splash only
	appeared once it finished. Removed: it is a second full-screen wait in front of
	a game that already has its own loading screen, and it was pushing the studio
	splash — and everything after it — roughly two seconds later.

	The splash now shows immediately instead of being gated on that gif.
-->
<StudioLoader />

{@render props.children()}
