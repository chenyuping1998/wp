<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table, the game rules
	// and the feature-buy menu, which are overridden locally.
	//
	// The buy menu is the newest of the three. The shared one renders each mode as
	// a title, a description and a price — three text tiers in a list — and the
	// only free-text comment a sibling game's review left was "Bonus buy menu is
	// too simple". See ModalBuyBonus.svelte.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';

	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
	import ModalMessage from 'components-ui-html/src/components/ModalMessage.svelte';
	import ModalSettings from 'components-ui-html/src/components/ModalSettings.svelte';

	import ModalBuyBonus from './ModalBuyBonus.svelte';
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
<!-- Manual bet and spacebar affordability failures use the plain notification
     modal; autoplay keeps its dedicated "autoplay stopped" message above. -->
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
		 * Small screens used to drop the root to 50% — 8px — which halved every
		 * rem-based size in the modals at once. The bonus-buy descriptions are
		 * 0.75rem, so on a Mobile S screen they rendered at 6px: certification
		 * reported them as unreadable, and it was the root size doing it rather
		 * than the component.
		 *
		 * 75% (12px) still buys back the space the layout needs on a narrow
		 * screen while leaving body text legible; the smallest text in the modals
		 * then lands at 9px rather than 6px, and the cards below set their own
		 * floor on top of that.
		 */
		@media screen and (max-width: 500px) {
			font-size: 75%;
		}
	}

	/* ══════════════════════════════════════════════════════
	   Deadwood modal skin — the bet strip's palette (game/uiTheme.ts), so the
	   pop-ups read as part of the same game.
	   Targets the shared component class names:
	   - .button (components-shared/Button.svelte)
	   - .rectangle (components-ui-html/BaseIcon.svelte)
	   - .pop-up-wrap (components-shared/Popup.svelte)
	   - .close-button (components-shared/Popup.svelte)
	   ═════════════════════════════════════════════════════ */

	/* ── typography ────────────────────────────────────────────────────────
	   Two faces with separated jobs. Headings take the game's display face so a
	   modal reads as part of the game; body copy does not, because these panels
	   carry real paragraphs — the feature descriptions, the RTP disclaimer — and
	   a heavy rounded face is measurably harder to read at paragraph length.
	   Stacks come from game/fonts.ts via custom properties, so there is one
	   source of truth. Overrides are needed because the shared components hard-
	   code the template's 'proxima-nova', a Typekit face that never loads. */
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
		/* Cinzel, the logo's inscription face (game/fonts.ts DISPLAY_FONT) */
		font-family: var(--hm-title-font) !important;
		font-weight: 700 !important;
		letter-spacing: 0.06em;
	}

	/* Modal titles (BaseTitle) and the stake readout in the bet stepper: the
	   shared components leave both as plain 1rem body text, so "BET MENU" was
	   the smallest line on its own panel. */
	:global(.ui-modal-title-wrap) {
		font-family: var(--hm-title-font) !important;
		font-weight: 700 !important;
		font-size: 1.35rem !important;
		letter-spacing: 0.08em;
		color: #e7c98a !important;
		margin-bottom: 0.35rem;
	}
	:global(.toggle-wrap .amount) {
		font-size: 1.3rem !important;
		font-weight: 700 !important;
		color: #f5edda !important;
		min-width: 6.5rem;
		text-align: center;
	}

	/* ── Bonus buy menu sizing (Hot Miami only) ─────────────────────────────
	   Certification flagged the buy menu as unreadable on Mobile S and hard to
	   read/trigger in Popout S. Two separate causes:

	     · text scaled with the root font size, so a small screen shrank it past
	       legibility (root floor raised above)
	     · two fixed-width cards side by side leave each one too narrow to read on
	       a phone, and too small to hit comfortably

	   These overrides live here rather than in the shared BonusCards component so
	   only this game is affected. Everything is scoped under .bonus-card-wrap,
	   which is the card container — .title/.description/.price are generic class
	   names used elsewhere and must not be restyled globally.

	   clamp() sets an absolute floor in px: whatever the root size does, the text
	   cannot go below a readable size, and it still scales up on a large screen. */
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
		/* the fixed 4rem min-height wasted vertical space on short viewports and
		   pushed the buy button out of reach in Popout S */
		min-height: 0 !important;
	}

	:global(.bonus-card-wrap .price) {
		font-size: clamp(14px, 1.05rem, 20px) !important;
		font-weight: 700 !important;
	}

	/* Narrow screens: stack the cards instead of splitting the width between
	   them. One full-width card per row is readable and gives a large tap target. */
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

	/* Short viewports (Popout S): trim the vertical padding so both cards and the
	   bet stepper stay on screen together. */
	@media screen and (max-height: 420px) {
		:global(.bonus-card-wrap) {
			padding: 0.5rem !important;
			gap: 0.4rem !important;
		}

		:global(.bonus-card-wrap .description) {
			font-size: clamp(10px, 0.72rem, 13px) !important;
		}
	}

	/* ══════════════════════════════════════════════════════
	   Deadwood colours (2026-09-29). Everything below was GoBananas' jungle
	   olive — rgba(38,52,18) plates, a pink hover on the scrollbar — with one
	   late line repainting a few panels teal on top, so the bet menu, autoplay
	   and notification pop-ups still came up olive. Now one palette, the bet
	   strip's: charcoal-teal enamel, aged brass edge, spectral-teal focus.
	   ══════════════════════════════════════════════════════ */

	/* Button icon background (the rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: #123029 !important;
		border: 1px solid rgba(184, 149, 84, 0.55) !important;
		border-radius: 8px !important;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(231, 201, 138, 0.1) !important;
		transition: all 0.15s ease !important;
	}

	:global(.button:hover .rectangle) {
		background: #1a4238 !important;
		border-color: rgba(231, 201, 138, 0.9) !important;
	}

	:global(.button:active .rectangle) {
		background: #0c231e !important;
		border-color: #5fd6c4 !important;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5) !important;
		transform: scale(0.97);
	}

	/* Close button (×) */
	:global(.close-button) {
		color: #e7c98a !important;
		transition: color 0.15s ease !important;
	}

	:global(.close-button:hover) {
		color: #fff !important;
	}

	/* Backdrop: the game stays visible, dimmed, behind every pop-up. The wrap
	   was painted solid #0b211c, which blacked the whole screen out for a bet
	   change — nothing on screen said the game was still there. */
	:global(.blur-layer) {
		background-color: rgba(2, 10, 9, 0.7) !important;
		/* 30px turned the board into fog; 6px keeps the reels recognisable */
		backdrop-filter: blur(6px) !important;
		-webkit-backdrop-filter: blur(6px) !important;
	}
	:global(.pop-up-wrap) {
		background-color: transparent !important;
	}

	/* The buy-bonus layouts position BOTH of their children out of flow
	   (.bonuses-wrap is absolute, .badge-amount-wrap is fixed), so the content
	   wrapper has nothing left in normal flow and collapses to just its own
	   padding — which the panel styling below then painted as a small empty
	   plate floating between the cards and the stepper. Nothing should be drawn
	   for a container with no in-flow content. */
	:global(.ui-popup-standard-content-wrap:has(.bonuses-wrap)) {
		background: none !important;
		border: none !important;
		box-shadow: none !important;
		padding: 0 !important;
	}

	/* Content panel in modals (Bet Menu, Auto Spin, Settings, notifications) */
	:global(.ui-popup-standard-content-wrap),
	:global(.modal-panel) {
		background: #0b211c !important;
		border: 1px solid #b89554 !important;
		border-radius: 8px !important;
		padding: 1.5rem !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.75),
			inset 0 0 0 3px #0b211c,
			inset 0 0 0 4px rgba(95, 214, 196, 0.35) !important;
	}

	/* Buy Bonus cards (components-ui-html/BonusCard.svelte → .bonus-card-wrap) */
	:global(.bonus-card-wrap) {
		background: #0b211c !important;
		border: 1px solid #b89554 !important;
		border-radius: 8px !important;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5) !important;
		transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		border-color: #e7c98a !important;
		box-shadow: 0 0 18px rgba(95, 214, 196, 0.25) !important;
	}

	/* Buy Bonus cards enlarged 60%. The card's children (.title/.description/
	   .price) carry no font-size of their own, so setting one on the wrap scales
	   all of them by exactly the same factor and the original proportions are
	   preserved. Dimensions and spacing are multiplied to match; the button's
	   height rides a CSS variable and its label has an inline font-size, so both
	   need naming explicitly. */
	:global(.bonus-card-wrap) {
		min-width: 248px !important;   /* 155 x 1.6 */
		max-width: 288px !important;   /* 180 x 1.6 */
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
		color: #e7d1a0 !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #f5edda !important;
		font-weight: 800 !important;
	}

	:global(.bonus-card-wrap .description) {
		color: #dbebe4 !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(2, 10, 9, 0.45);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: #8eab9f;
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: #b8d4c9;
	}

	/* Toggle / checkbox / select inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: #102a24 !important;
		border: 1px solid rgba(184, 149, 84, 0.55) !important;
		border-radius: 6px !important;
		color: #fff !important;
		transition: border-color 0.15s ease !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: #5fd6c4 !important;
		outline: none !important;
		box-shadow: 0 0 6px rgba(95, 214, 196, 0.35) !important;
	}
</style>
