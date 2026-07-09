<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	export type Props = { slotName: string; children: Snippet };
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import {
		getContextSpine,
		createContextParent,
		getContextSpineEventEmitter,
	} from '../context.svelte';

	const props: Props = $props();
	const spine = getContextSpine();
	const slotContainer = new PIXI.Container();
	const spineEventEmitter = getContextSpineEventEmitter();

	let show = $state(!Boolean(spineEventEmitter));

	onMount(() => {
		if (spineEventEmitter) {
			spineEventEmitter.on('beforeUpdateWorldTransforms', () => {
				const slot = spine.skeleton.findSlot(props.slotName);

				if (slot) {
					show = Boolean(slot?.attachment);
				}
			});
		}

		try {
			spine.addSlotObject(props.slotName, slotContainer);
		} catch (error) {
			// addSlotObject throws if the skeleton has no slot named
			// props.slotName (e.g. a stale/mismatched spine asset missing a
			// slot the calling code expects). Left uncaught, this exception
			// propagates out of onMount with nothing downstream to catch it,
			// which can leave the whole game stuck rather than just skipping
			// this one visual. Log it and let the rest of the scene keep
			// running instead.
			console.error(`[SpineSlot] addSlotObject("${props.slotName}") failed`, error);
		}
	});

	createContextParent(slotContainer);
</script>

{#if show}
	{@render props.children()}
{/if}
