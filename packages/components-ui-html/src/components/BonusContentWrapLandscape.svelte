<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContextLayout } from 'utils-layout';
	import { resizeObserver, type ContentRect } from 'utils-resize-observer';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		maxListLength: number;
		betAmount: Snippet;
		bonusCardsActivate: Snippet;
		bonusCardsBuy: Snippet;
	};

	const props: Props = $props();

	const { stateLayoutDerived } = getContextLayout();

	let contentRect = $state({ width: 0, height: 0, left: 0, top: 0 } as ContentRect);

	const verticalScale = $derived(stateLayoutDerived.canvasSizes().height / (270 * 2)); // 2 rows, 270 is the height benchmark
	const horizontalScale = $derived(
		(stateLayoutDerived.canvasSizes().width - 250) / (contentRect?.width || 0),
	);
	// Floor on the shrink factor.
	//
	// This scale is a CSS transform, so it shrinks the rendered result regardless
	// of any font-size the cards ask for — which is why per-element sizing could
	// not fix the unreadable text certification reported on the small popout and
	// mobile views. Below about 0.72 the descriptions stop being legible at all,
	// and a card the player cannot read is worse than one that overflows: the
	// wrapper scrolls, so overflow is recoverable.
	const MIN_SCALE = 0.72;
	const scale = $derived(Math.max(MIN_SCALE, Math.min(verticalScale, horizontalScale)));
</script>

<BaseContent maxWidth="100%">
	<div class="bonuses-wrap" use:resizeObserver={(value) => (contentRect = value)}>
		<div class="bonuses" style="transform: scale({Math.min(scale, 1)});">
			<!-- Scrollable, not noScroll.
			     MIN_SCALE above accepts overflow on the grounds that "the wrapper
			     scrolls, so overflow is recoverable" — but both rows passed
			     noScroll, so it did not, and the tiers were simply cut off at the
			     window edge. Certification reported exactly that on Popout S/L.
			     Honouring the floor's own bargain is the smaller fix. -->
			<BaseScrollable type="row">
				{@render props.bonusCardsActivate()}
			</BaseScrollable>

			<BaseScrollable type="row">
				{@render props.bonusCardsBuy()}
			</BaseScrollable>
		</div>
	</div>

	<div class="badge-amount-wrap">
		{@render props.betAmount()}
	</div>
</BaseContent>

<style lang="scss">
	// The cards sit 7rem left of centre to clear the amount badge, which is
	// pinned to the right of the VIEWPORT rather than to this panel. On a wide
	// window those two never meet. On a narrow one — the small popout — the badge
	// walks inwards while the cards, already at the MIN_SCALE floor, cannot give
	// any more ground, and the two overlap: certification's screenshot shows the
	// stake amount printed on top of its own +/- controls.
	//
	// Below the width where that reserve stops being affordable, the side-by-side
	// arrangement is abandoned rather than squeezed: cards centre themselves and
	// the badge drops beneath them.
	$narrow: 900px;

	.bonuses-wrap {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(calc(-50% - 7rem), -50%);

		@media (max-width: $narrow) {
			transform: translate(-50%, calc(-50% - 2.5rem));
		}
	}

	.bonuses {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		transform-origin: center center;
	}

	.badge-amount-wrap {
		position: fixed;
		top: calc(50% + 1.2rem);
		right: 1rem;
		transform: translateY(-50%);

		@media (max-width: $narrow) {
			top: auto;
			right: auto;
			left: 50%;
			bottom: 1.5rem;
			transform: translateX(-50%);
		}
	}
</style>
