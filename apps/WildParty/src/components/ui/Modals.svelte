<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table / game rules,
	// which we override locally with WildParty-specific content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	import ModalBuyBonus from 'components-ui-html/src/components/ModalBuyBonus.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
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
<ModalPayTable />
<ModalGameRules />
<ModalSettings />

<!-- version snippet retained for parity with the shared Modals API -->
<div style="display:none">{@render props.version()}</div>

<style lang="scss">
	:global(html) {
		font-size: 16px;
		@media screen and (max-width: 500px) {
			font-size: 50%;
		}
	}

	/* ═══════════════════════════════════════════════════════
	   Wild Party — Premium Button & Modal Styling
	   Targets the actual shared component class names:
	   - .button (components-shared/Button.svelte)
	   - .rectangle (components-ui-html/BaseIcon.svelte)
	   - .pop-up-wrap (components-shared/Popup.svelte)
	   - .close-button (components-shared/Popup.svelte)
	   ═══════════════════════════════════════════════════════ */

	/* Button icon background (the black rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: linear-gradient(
			160deg,
			rgba(30, 5, 50, 0.95) 0%,
			rgba(15, 2, 30, 0.98) 40%,
			rgba(25, 5, 45, 0.95) 100%
		) !important;
		border: 1px solid rgba(216, 168, 78, 0.55) !important;
		border-radius: 10px !important;
		box-shadow:
			0 2px 10px rgba(216, 168, 78, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
		transition: all 0.2s ease !important;
	}

	/* Button wrapper hover/active states */
	:global(.button:hover .rectangle) {
		border-color: rgba(255, 211, 77, 0.85) !important;
		box-shadow:
			0 4px 18px rgba(255, 211, 77, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
	}

	:global(.button:active .rectangle) {
		border-color: rgba(255, 230, 140, 0.9) !important;
		box-shadow:
			0 1px 6px rgba(200, 80, 255, 0.3),
			inset 0 2px 4px rgba(0, 0, 0, 0.4) !important;
		transform: scale(0.97);
	}

	/* Close button (×) */
	:global(.close-button) {
		color: rgba(242, 201, 106, 0.85) !important;
		transition: color 0.2s ease, text-shadow 0.2s ease !important;
	}

	:global(.close-button:hover) {
		color: #fff !important;
		text-shadow: 0 0 12px rgba(255, 211, 77, 0.9) !important;
	}

	/* headings + button labels take the display font; body copy stays sans */
	:global(.pop-up-wrap h1),
	:global(.pop-up-wrap h2),
	:global(.pop-up-wrap h3),
	:global(.pop-up-wrap .button) {
		font-family: 'Cinzel', Georgia, serif !important;
		letter-spacing: 0.08em;
	}
	:global(.pop-up-wrap h1),
	:global(.pop-up-wrap h2) {
		color: #ffd34d !important;
	}

	/* Modal backdrop blur layer */
	:global(.blur-layer) {
		background-color: rgba(5, 0, 15, 0.7) !important;
	}

	/* Content wrapper in modals */
	:global(.ui-popup-standard-content-wrap) {
		background: linear-gradient(
			180deg,
			rgba(18, 4, 35, 0.96) 0%,
			rgba(10, 2, 22, 0.98) 100%
		) !important;
		border: 1px solid rgba(216, 168, 78, 0.45) !important;
		border-radius: 14px !important;
		padding: 1.5rem !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.7),
			0 0 80px rgba(216, 168, 78, 0.08) !important;
	}

	/* Scrollbar premium styling */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(10, 0, 20, 0.4);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, rgba(180, 80, 255, 0.4), rgba(100, 30, 180, 0.4));
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, rgba(200, 100, 255, 0.6), rgba(120, 50, 200, 0.6));
	}

	/* Toggle / checkbox inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: rgba(20, 5, 40, 0.8) !important;
		border: 1px solid rgba(180, 80, 255, 0.25) !important;
		border-radius: 6px !important;
		color: #fff !important;
		transition: border-color 0.2s ease !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: rgba(200, 100, 255, 0.5) !important;
		outline: none !important;
		box-shadow: 0 0 8px rgba(180, 80, 255, 0.2) !important;
	}
</style>
