<script lang="ts">
	import type { Snippet } from 'svelte';

	// Shared modals for everything except the pay table and game rules, which are
	// this game's own content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from './ModalBetMenu.svelte';
	import ModalBuyBonus from 'components-ui-html/src/components/ModalBuyBonus.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from './ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
	// Plain notifications — the insufficient-balance notice the bet button raises.
	// Distinct from ModalAutoSpinMessage, which opens with "AUTO PLAY HAS STOPPED
	// DUE TO" and is only correct when a run actually stopped.
	import ModalMessage from 'components-ui-html/src/components/ModalMessage.svelte';
	import ModalSettings from 'components-ui-html/src/components/ModalSettings.svelte';

	import ModalPayTable from './ModalPayTable.svelte';
	import ModalGameRules from './ModalGameRules.svelte';

	type Props = {
		version: Snippet;
	};

	const props: Props = $props();
</script>

<ModalError />
<ModalBetMenu />
<ModalBuyBonus />
<ModalBuyBonusConfirm />
<ModalAutoSpin />
<ModalAutoSpinMessage />
<ModalMessage />
<ModalPayTable />
<ModalGameRules />
<ModalSettings />

<!-- version snippet retained for parity with the shared Modals API -->
<div style="display:none">{@render props.version()}</div>

<style lang="scss">
	:global(html) {
		font-size: 16px;
		/*
		 * Never drop the root to 50% on small screens: every rem-based size in the
		 * modals halves with it, and certification reports 6px buy-menu text as
		 * unreadable on Mobile S. 75% (12px) buys back the space a narrow layout
		 * needs while keeping body text legible; the cards below set their own
		 * floor on top of that.
		 */
		@media screen and (max-width: 500px) {
			font-size: 75%;
		}
	}

	/* ══════════════════════════════════════════════════════
	   Medusa Gaze modal skin — flat sitcom cartoon, like the rest of the game:
	   marble paper, one ink colour for every outline, gold and coral accents, no
	   gradients. Targets the shared component class names:
	   - .button (components-shared/Button.svelte)
	   - .rectangle (components-ui-html/BaseIcon.svelte)
	   - .pop-up-wrap (components-shared/Popup.svelte)
	   - .close-button (components-shared/Popup.svelte)
	   ═════════════════════════════════════════════════════ */

	/* ── typography: headings in the display face, paragraphs in a plain sans,
	   because these panels carry real paragraphs. Stacks come from game/fonts.ts
	   via custom properties; the shared components still declare the template's
	   'proxima-nova', which never loads. */
	:global(.pop-up-wrap),
	:global(.pop-up-wrap p),
	:global(.pop-up-wrap li),
	:global(.pop-up-wrap td),
	:global(.pop-up-wrap th) {
		font-family: var(--gb-body-font) !important;
	}

	:global(.pop-up-wrap h1),
	:global(.pop-up-wrap h2),
	:global(.pop-up-wrap h3),
	:global(.pop-up-wrap h4) {
		font-family: var(--gb-display-font) !important;
		/* Titan One is single-weight — a requested bold would only be synthesised */
		font-weight: 400 !important;
		letter-spacing: 0.02em;
	}

	/* ── Bonus buy menu sizing ───────────────────────────────────────────────
	   Certification has flagged buy menus as unreadable on Mobile S and hard to
	   trigger in Popout S: text scaled with the root size, and two fixed-width
	   cards side by side are too narrow on a phone. Scoped under
	   .bonus-card-wrap because .title/.description/.price are generic names.
	   clamp() floors the text in px whatever the root size does. */
	:global(.bonus-card-wrap) {
		min-width: 0 !important;
		max-width: none !important;
		padding: 0.75rem !important;
		gap: 0.6rem !important;
	}

	:global(.bonus-card-wrap .title) {
		font-size: clamp(13px, 1.05rem, 20px) !important;
		line-height: 1.25 !important;
	}

	:global(.bonus-card-wrap .description) {
		font-size: clamp(11px, 0.8rem, 15px) !important;
		line-height: 1.35 !important;
		/* a fixed min-height pushed the buy button out of reach in Popout S */
		min-height: 0 !important;
	}

	:global(.bonus-card-wrap .price) {
		font-size: clamp(14px, 1.05rem, 20px) !important;
		font-weight: 700 !important;
	}

	/* Narrow screens: stack the cards, one full-width card per row. */
	@media screen and (max-width: 560px) {
		:global(.ui-popup-standard-content-wrap .content.row) {
			flex-direction: column !important;
			align-items: stretch !important;
			width: 100% !important;
		}

		:global(.bonus-card-wrap) {
			width: 100% !important;
		}
	}

	/* Short viewports (Popout S): name, price and button only, so the cards and
	   the stepper stay on screen together (Stake review 2026-10-04). */
	@media screen and (max-height: 420px) {
		:global(.bonus-card-wrap) {
			padding: 0.5rem !important;
			gap: 0.4rem !important;
		}

		:global(.bonus-card-wrap .description) {
			display: none !important;
		}
	}

	/* Button face (the rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: #1e4950 !important;
		border: 2px solid #2a1f24 !important;
		border-radius: 10px !important;
		box-shadow: 0 3px 0 #2a1f24 !important;
		transition: transform 0.12s ease, background 0.12s ease !important;
	}

	:global(.button:hover .rectangle) {
		background: #24555d !important;
	}

	:global(.button:active .rectangle) {
		transform: translateY(2px) scale(0.98);
		box-shadow: 0 1px 0 #2a1f24 !important;
	}

	/* Close button (×) */
	:global(.close-button) {
		color: #102f36 !important;
		background: #fff4ce !important;
		border: 3px solid #c59135 !important;
		border-radius: 50% !important;
		width: 48px !important;
		height: 48px !important;
		font: 700 34px/38px sans-serif !important;
		box-shadow: 0 3px 12px #0009 !important;
		transition: color 0.15s ease, transform .15s ease !important;
	}
	:global(.close-button-wrap) {top:12px !important;right:12px !important}

	:global(.close-button:hover) {
		color: #e8725e !important;
		transform: scale(1.08);
	}
	:global(.pop-up-wrap .base-button-content){color:#fffaf0 !important;font-weight:700 !important;text-shadow:0 1px 1px #071f2b}
	:global(.pop-up-wrap .ui-popup-standard-content-wrap){color:#102f36 !important}
	:global(.pop-up-wrap .ui-popup-standard-content-wrap .subtitle){color:#102f36 !important}
	:global(.pop-up-wrap .ui-popup-standard-content-wrap .value),
	:global(.pop-up-wrap .ui-popup-standard-content-wrap .amount){color:#102f36 !important;font-weight:700 !important}

	/* Bonus stepper sits on the dark backdrop outside the cream cards. */
	:global(.pop-up-wrap .ui-popup-standard-content-wrap:has(.bonuses-wrap) .toggle-wrap .amount),
	:global(.pop-up-wrap .ui-popup-standard-content-wrap:has(.bonuses) .toggle-wrap .amount){color:#fff4ce !important;text-shadow:0 2px 3px #10242d;font-weight:800 !important}

	/* Modal backdrop */
	:global(.blur-layer) {
		background-color: rgba(18, 12, 15, 0.66) !important;
	}

	/* The buy-bonus layouts take both their children out of flow, so the content
	   wrapper would collapse to its own padding and paint an empty plate. */
	:global(.ui-popup-standard-content-wrap:has(.bonuses-wrap)) {
		background: none !important;
		border: none !important;
		box-shadow: none !important;
		padding: 0 !important;
	}

	/* Content wrapper in modals (Buy Bonus, Bet Menu, Auto Spin, Settings…) */
	:global(.ui-popup-standard-content-wrap) {
		background: #efe8d8 !important;
		color: #2a1f24 !important;
		border: 4px solid #2a1f24 !important;
		border-radius: 16px !important;
		padding: 1.5rem !important;
		box-shadow: 0 6px 0 rgba(42, 31, 36, 0.55) !important;
	}

	/* Buy Bonus cards: marble plate, ink outline, gold title */
	:global(.bonus-card-wrap) {
		background: #efe8d8 !important;
		border: 3px solid #2a1f24 !important;
		border-radius: 16px !important;
		box-shadow: 0 5px 0 #2a1f24 !important;
		transition: transform 0.15s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		transform: translateY(-2px);
	}

	/* Buy Bonus cards enlarged 60%. The card's children carry no font-size of
	   their own, so one on the wrap scales them all by the same factor. */
	:global(.bonus-card-wrap) {
		min-width: 248px !important;
		max-width: 288px !important;
		padding: 0.8rem !important;
		gap: 0.8rem !important;
		font-size: 1.6rem !important;
	}

	:global(.bonus-card-wrap .info) {
		gap: 0.8em !important;
	}

	:global(.bonus-card-wrap .rectangle) {
		--height-value: 3.2rem !important;
	}

	:global(.bonus-card-wrap span) {
		font-size: 1.6rem !important;
	}

	:global(.bonus-card-wrap .title) {
		color: #c85a4a !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #2a1f24 !important;
		font-weight: 800 !important;
	}

	:global(.bonus-card-wrap .description) {
		color: rgba(42, 31, 36, 0.8) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 6px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(42, 31, 36, 0.12);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: #2a1f24;
		border-radius: 3px;
	}

	/* Inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: #fffaf0 !important;
		border: 2px solid #2a1f24 !important;
		border-radius: 6px !important;
		color: #2a1f24 !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: #e8725e !important;
		outline: none !important;
	}
</style>
