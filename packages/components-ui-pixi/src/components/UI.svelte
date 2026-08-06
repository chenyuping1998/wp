<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateReplay, stateUi } from 'state-shared';

	import UIDefault from './UIDefault.svelte';
	import UIReplay from './UIReplay.svelte';

	type Props = {
		gameName: Snippet;
		logo: Snippet;
	};

	const props: Props = $props();

	const UI_COMPONENT_MAP = {
		default: UIDefault,
		replay: UIReplay,
	};

	// A game that drives replay playback itself keeps its own bar rather than the
	// template's stripped-down replay layout. Two reasons: the reviewer then sees
	// the same interface the game actually ships with, and the replay control has
	// somewhere to live — UIReplay is a centred WIN/BET stack with no room for it.
	// Games that have not opted in are unaffected; `enabled` stays false for them.
	const UIComponent = $derived(
		stateReplay.enabled ? UIDefault : UI_COMPONENT_MAP[stateUi.config.mode],
	);
</script>

<UIComponent>
	{#snippet gameName()}
		{@render props.gameName()}
	{/snippet}

	{#snippet logo()}
		{@render props.logo()}
	{/snippet}
</UIComponent>
