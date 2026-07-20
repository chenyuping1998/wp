<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { base } from '$app/paths';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import WildPartyLoader from '../components/WildPartyLoader.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	let showYourLoader = $state(false);
	// pixi canvas text can't late-bind fonts — hold the game until Cinzel is
	// registered (the brand splash covers the wait)
	let fontsReady = $state(false);
	onMount(async () => {
		try {
			const face = new FontFace('Cinzel', `url(${base}/fonts/cinzel.woff2)`, {
				weight: '100 900',
			});
			await face.load();
			document.fonts.add(face);
		} catch {
			// fall back to Georgia/serif silently
		}
		fontsReady = true;
	});

	// static/*.gif — must use kit base path (Stake hosts games under a subpath, not site root)
	const loaderUrlStakeEngine = `${base}/stake-engine-loader.gif`;

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			{#if fontsReady}
				<Game />
			{/if}
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<LoaderStakeEngine src={loaderUrlStakeEngine} oncomplete={() => (showYourLoader = true)} />

{#if showYourLoader}
	<WildPartyLoader />
{/if}

{@render props.children()}
