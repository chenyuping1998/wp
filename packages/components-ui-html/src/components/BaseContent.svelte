<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		maxWidth: '100%' | '500px';
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-popup-standard-content-wrap" style="--maxWidth: {props.maxWidth}; --zIndex: {100}">
	{@render props.children()}
</div>

<style lang="scss">
	.ui-popup-standard-content-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: var(--zIndex);
		max-width: var(--maxWidth);
		gap: 1rem;

		/*
		 * Bound the popup to the viewport so its scrollable region can actually
		 * scroll. BaseScrollable already carries overflow-y: auto (global .scrollY)
		 * and max-height: 100%, but a percentage max-height resolves against an
		 * auto-height parent as auto — so nothing ever overflowed and long content
		 * simply ran off screen. Popup's .top-layer has a definite height: 100%, so
		 * constraining this element gives the chain something real to measure
		 * against. min-height: 0 is required as well, or as a flex item it refuses
		 * to shrink below its content.
		 *
		 * Fixed elements outside the scroll region (title, CONFIRM button) keep
		 * their place; only the scrollable middle moves.
		 */
		max-height: 100%;
		min-height: 0;
	}
</style>
