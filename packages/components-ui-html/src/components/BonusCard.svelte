<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: Snippet;
		description: Snippet;
		price: Snippet;
		button: Snippet;
		/**
		 * Optional full-bleed background for the card, as an image URL.
		 *
		 * Opt-in by construction, the same way `assets.icon` is: a game supplies
		 * `assets.dialogImage` on its bet mode or it does not, and every other game
		 * in this repo sets it to the empty string, so none of them change. Without
		 * it the card keeps the flat translucent black it has always had.
		 *
		 * The reason it exists: the cards are identical rectangles distinguished
		 * only by their text and a 28px glyph, and a player scanning four of them
		 * has nothing to look at. A cover gives each option a surface.
		 */
		cover?: string;
	};

	const props: Props = $props();
</script>

<div class="bonus-card-wrap" class:has-cover={Boolean(props.cover)}>
	{#if props.cover}
		<!--
			A background element rather than a CSS background-image, so the URL comes
			through as data and is never interpolated into a style string.
			aria-hidden: it carries no information the text does not.
		-->
		<img class="cover" src={props.cover} alt="" aria-hidden="true" />
		<!--
			A scrim over it, in CSS rather than baked into the art.

			The art carries its own top and bottom fades, and they were not enough,
			for a reason worth writing down: the card's HEIGHT is set by its text, so
			its aspect changes with the locale and the layout, and `object-fit: cover`
			then crops whichever axis is surplus. On a short wide card the crop takes
			the middle band of a tall image - which is exactly the part with no fade
			on it - and every word ends up over the brightest part of the motif.

			A scrim drawn HERE is in the card's own coordinates, so it cannot be
			cropped away whatever shape the card ends up.
		-->
		<div class="scrim" aria-hidden="true"></div>
	{/if}
	<div class="info">
		{@render props.title()}
		{@render props.description()}
		{@render props.price()}
	</div>
	{@render props.button()}
</div>

<style lang="scss">
	.bonus-card-wrap {
		padding: 0.5rem;
		flex-direction: column;
		display: flex;
		justify-content: space-between;

		border-radius: 10px;
		background: rgba(0, 0, 0, 0.5);
		text-align: left;
		min-width: 155px;
		max-width: 180px;
		gap: 0.5rem;
	}

	/* The cover needs a positioning context and needs to be clipped to the
	   card's own corners; neither applies when there is no cover, so both are
	   scoped to the modifier rather than added to every card. */
	.bonus-card-wrap.has-cover {
		position: relative;
		overflow: hidden;
	}

	.cover {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		/* Cover, not contain: the art is drawn at the card's proportion but the
		   card's height follows its text, which varies with the locale. */
		object-fit: cover;
		z-index: 0;
		pointer-events: none;
	}

	/* Dark at both ends where the words are, open through the middle so the art
	   still has somewhere to be seen. Tuned so the motif reads at a glance and
	   every line of text sits on something. */
	.scrim {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			rgba(6, 12, 20, 0.94) 0%,
			rgba(6, 12, 20, 0.72) 26%,
			rgba(6, 12, 20, 0.38) 50%,
			rgba(6, 12, 20, 0.82) 78%,
			rgba(6, 12, 20, 0.95) 100%
		);
	}

	/* Everything the card actually says sits above the cover. Without this the
	   art paints over the text, since it comes first in the DOM but the siblings
	   are not positioned. */
	.bonus-card-wrap.has-cover .info,
	.bonus-card-wrap.has-cover :global(> *:not(.cover)) {
		position: relative;
		z-index: 1;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
</style>
