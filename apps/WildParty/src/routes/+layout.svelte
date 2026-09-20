<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import IntroFeatures from '../components/ui/IntroFeatures.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	// Pixi canvas text can't late-bind fonts — it measures glyph advances when it
	// builds a Text and never re-measures — so hold the game until the face is
	// resident. The brand splash covers the wait.
	//
	// This used to construct the FontFace by hand. It no longer needs to: the
	// face is declared in app.html and the file is preloaded there, so all that
	// is left is waiting for it. Constructing a second FontFace for the same
	// family on top of that just registered a duplicate.
	let fontsReady = $state(false);
	onMount(async () => {
		try {
			await document.fonts.load('900 16px "Orbitron"');
		} catch {
			// fall back to the system sans silently
		}
		fontsReady = true;
	});

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

<!--
	One opening card, not two.

	The boot used to be: Stake Engine's platform splash, then the studio loader,
	then the pixi loading screen with its own PRESS ANYWHERE TO CONTINUE — three
	full-screen pages and two taps before the reels. Certification is explicit that
	the platform splash must go while the studio mark stays (two different things,
	easy to delete both by accident), and every competitive slot holds a single
	card. IntroFeatures is that card: it carries the studio mark, the wordmark, the
	volatility read and the three features, and its tap clears the pixi loader's
	gate as well as its own.

	The pixi loading screen still runs underneath — it owns asset loading and the
	progress bar — but it is never seen, because this card refuses the tap until
	loading has finished.

	WildPartyLoader.svelte and static/stake-engine-loader.gif are both left in the
	tree so either can be put back in one line.
-->
<IntroFeatures />

{@render props.children()}
