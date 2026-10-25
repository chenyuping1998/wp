<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import WildPartyLoader from '../components/WildPartyLoader.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';
	import { page } from '$app/state';

	type Props = { children: Snippet };

	const props: Props = $props();

	setContext();
	const artReview = $derived(import.meta.env.DEV && page.url.searchParams.get('artReview') === '1');
	let ArtReview = $state<typeof import('../components/ArtReview.svelte').default>();
	onMount(async () => {
		if (import.meta.env.DEV && artReview) ArtReview = (await import('../components/ArtReview.svelte')).default;
	});
</script>

<GlobalStyle>
	{#if artReview}
		<LoadI18n {messagesMap}>
			<Game />
			{#if ArtReview}<ArtReview />{/if}
		</LoadI18n>
	{:else}
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
	{/if}
</GlobalStyle>

<!--
	The Stake Engine splash that used to gate this has been removed at
	certification's request. The loader below is our own studio logo and stays.
-->
<WildPartyLoader />

{@render props.children()}
