<script lang="ts">
	// The game's UI root, in place of components-ui-pixi's <UI>: the same
	// pieces as the shared UI.svelte + UIDefault.svelte (space-hold, the shift
	// shortcuts when uiTheme.platformUx asks for them, the fade on uiShow /
	// uiHide), with bar v3 (./MummyBar.svelte) as the one layout in every
	// orientation. The shared package in this workspace has no customLayout
	// hook to plug a game's bar into, and the bar replaces all of its layouts
	// anyway, so the game mounts it here and the package stays untouched for the
	// other games built from it. Static Shift, 2026-11-10 (from Pickle Panic's).
	//
	// Replay: as in the shared UI, a replay the game drives itself
	// (stateReplay.enabled, set by ResumeBet) keeps the game's own bar, which
	// then shows its replay control; the template's bare replay strip is only
	// for a replay the game has not taken over.
	import type { Snippet } from 'svelte';
	import { stateReplay, stateUi } from 'state-shared';
	import { EnableSpaceHold } from 'components-shared';
	import UIReplay from 'components-ui-pixi/src/components/UIReplay.svelte';
	import UiFadeContainer from 'components-ui-pixi/src/components/UiFadeContainer.svelte';
	import EnableShortcuts from 'components-ui-pixi/src/components/EnableShortcuts.svelte';
	import { platformUx } from 'components-ui-pixi/src/platformUx.svelte';

	import MummyBar from './MummyBar.svelte';

	const props: { gameName: Snippet; logo: Snippet } = $props();
	const bareReplay = $derived(!stateReplay.enabled && stateUi.config.mode === 'replay');
</script>

{#if bareReplay}
	<UIReplay gameName={props.gameName} logo={props.logo} />
{:else}
	<EnableSpaceHold />
	{#if platformUx()?.shortcuts}
		<EnableShortcuts />
	{/if}
	<UiFadeContainer>
		<MummyBar gameName={props.gameName} logo={props.logo} />
	</UiFadeContainer>
{/if}
