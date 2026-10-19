<script lang="ts">
	import { type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import WildPartyLoader from '../components/WildPartyLoader.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();
	const artReview = $derived(import.meta.env.DEV && page.url.pathname === '/art-review');

	setContext();
</script>

{#if !artReview}
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
{/if}

{@render props.children()}
