<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table / game rules,
	// which we override locally with WildParty-specific content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
	// Plain notifications — the insufficient-balance notice the bet button
	// raises. Distinct from ModalAutoSpinMessage above, which opens with "AUTO
	// PLAY HAS STOPPED DUE TO" and is only correct when a run actually stopped.
	import ModalMessage from 'components-ui-html/src/components/ModalMessage.svelte';
	import ModalSettings from 'components-ui-html/src/components/ModalSettings.svelte';

	// the feature-buy menu is this game's own (DeadwoodExpress's layout): scene,
	// hero, price and button per card — see ModalBuyBonus.svelte
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
	   GoBananas — jungle-commando modal skin.
	   Deep olive canvas, brass trim, banana-gold highlights: the same palette as
	   the reel housing (BoardFrame), the free-spin plaques and the bet bar
	   (game/uiTheme.ts), so Buy Bonus and every other modal read as one game.
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
		font-family: var(--gb-display-font) !important;
		/* Titan One is single-weight — a requested bold would only be synthesised */
		font-weight: 400 !important;
		letter-spacing: 0.02em;
	}

	/* ── Bonus buy menu sizing (GoBananas only) ──────────────────────────────
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

	/* Button icon background (the rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: linear-gradient(
			160deg,
			rgba(38, 52, 18, 0.95) 0%,
			rgba(18, 26, 8, 0.98) 45%,
			rgba(30, 42, 14, 0.95) 100%
		) !important;
		border: 1px solid rgba(216, 163, 52, 0.4) !important;
		border-radius: 10px !important;
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 243, 189, 0.07) !important;
		transition: all 0.2s ease !important;
	}

	:global(.button:hover .rectangle) {
		border-color: rgba(255, 215, 94, 0.7) !important;
		box-shadow:
			0 4px 18px rgba(216, 163, 52, 0.28),
			inset 0 1px 0 rgba(255, 243, 189, 0.12) !important;
	}

	:global(.button:active .rectangle) {
		border-color: rgba(255, 233, 138, 0.85) !important;
		box-shadow:
			0 1px 6px rgba(216, 163, 52, 0.35),
			inset 0 2px 4px rgba(0, 0, 0, 0.5) !important;
		transform: scale(0.97);
	}

	/* Close button (×) */
	:global(.close-button) {
		color: rgba(255, 215, 94, 0.85) !important;
		transition: color 0.2s ease, text-shadow 0.2s ease !important;
	}

	:global(.close-button:hover) {
		color: #fff !important;
		text-shadow: 0 0 12px rgba(255, 215, 94, 0.85) !important;
	}

	/* Modal backdrop — deep jungle shade rather than the template's violet */
	:global(.blur-layer) {
		background-color: rgba(4, 12, 6, 0.72) !important;
	}

	/* Content wrapper in modals (Buy Bonus, Bet Menu, Auto Spin, Settings…) */
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

	:global(.ui-popup-standard-content-wrap) {
		background: linear-gradient(
			180deg,
			rgba(26, 36, 12, 0.97) 0%,
			rgba(10, 18, 6, 0.98) 100%
		) !important;
		border: 1px solid rgba(216, 163, 52, 0.3) !important;
		border-radius: 14px !important;
		padding: 1.5rem !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.75),
			0 0 70px rgba(158, 196, 74, 0.07),
			inset 0 1px 0 rgba(255, 243, 189, 0.06) !important;
	}

	/* Buy Bonus cards (components-ui-html/BonusCard.svelte → .bonus-card-wrap):
	   the shared component paints a flat black panel, which read as unfinished
	   next to the rest of the game. Brass-edged olive plate instead. */
	:global(.bonus-card-wrap) {
		background: linear-gradient(
			165deg,
			rgba(34, 46, 16, 0.95) 0%,
			rgba(16, 24, 8, 0.97) 100%
		) !important;
		border: 1px solid rgba(216, 163, 52, 0.32) !important;
		border-radius: 12px !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 243, 189, 0.06) !important;
		transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		border-color: rgba(255, 215, 94, 0.65) !important;
		box-shadow: 0 0 22px rgba(255, 215, 94, 0.18) !important;
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
		border-radius: 16px !important;
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

	/* card copy: title in banana gold, price in the brass used on the bet bar */
	:global(.bonus-card-wrap .title) {
		color: #ffd75e !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #fff7d6 !important;
		font-weight: 800 !important;
		text-shadow: 0 0 10px rgba(216, 163, 52, 0.45) !important;
	}

	:global(.bonus-card-wrap .description) {
		color: rgba(255, 247, 214, 0.72) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(8, 16, 4, 0.45);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, rgba(216, 163, 52, 0.55), rgba(120, 88, 24, 0.5));
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, rgba(255, 215, 94, 0.75), rgba(158, 196, 74, 0.6));
	}

	/* Toggle / checkbox / select inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: rgba(24, 34, 10, 0.85) !important;
		border: 1px solid rgba(216, 163, 52, 0.3) !important;
		border-radius: 6px !important;
		color: #fff !important;
		transition: border-color 0.2s ease !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: rgba(255, 215, 94, 0.6) !important;
		outline: none !important;
		box-shadow: 0 0 8px rgba(216, 163, 52, 0.28) !important;
	}

	/* ══════════════════════════════════════════════════════
	   GoBananas — jungle-commando modal skin.
	   Deep olive canvas, brass trim, banana-gold highlights: the same palette as
	   the reel housing (BoardFrame), the free-spin plaques and the bet bar
	   (game/uiTheme.ts), so Buy Bonus and every other modal read as one game.
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
		font-family: var(--gb-display-font) !important;
		/* Titan One is single-weight — a requested bold would only be synthesised */
		font-weight: 400 !important;
		letter-spacing: 0.02em;
	}

	/* ── Bonus buy menu sizing (GoBananas only) ──────────────────────────────
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

	/* Button icon background (the rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: linear-gradient(
			160deg,
			rgba(38, 52, 18, 0.95) 0%,
			rgba(18, 26, 8, 0.98) 45%,
			rgba(30, 42, 14, 0.95) 100%
		) !important;
		border: 1px solid rgba(216, 163, 52, 0.4) !important;
		border-radius: 10px !important;
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 243, 189, 0.07) !important;
		transition: all 0.2s ease !important;
	}

	:global(.button:hover .rectangle) {
		border-color: rgba(255, 215, 94, 0.7) !important;
		box-shadow:
			0 4px 18px rgba(216, 163, 52, 0.28),
			inset 0 1px 0 rgba(255, 243, 189, 0.12) !important;
	}

	:global(.button:active .rectangle) {
		border-color: rgba(255, 233, 138, 0.85) !important;
		box-shadow:
			0 1px 6px rgba(216, 163, 52, 0.35),
			inset 0 2px 4px rgba(0, 0, 0, 0.5) !important;
		transform: scale(0.97);
	}

	/* Close button (×) */
	:global(.close-button) {
		color: rgba(255, 215, 94, 0.85) !important;
		transition: color 0.2s ease, text-shadow 0.2s ease !important;
	}

	:global(.close-button:hover) {
		color: #fff !important;
		text-shadow: 0 0 12px rgba(255, 215, 94, 0.85) !important;
	}

	/* Modal backdrop — deep jungle shade rather than the template's violet */
	:global(.blur-layer) {
		background-color: rgba(4, 12, 6, 0.72) !important;
	}

	/* Content wrapper in modals (Buy Bonus, Bet Menu, Auto Spin, Settings…) */
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

	:global(.ui-popup-standard-content-wrap) {
		background: linear-gradient(
			180deg,
			rgba(26, 36, 12, 0.97) 0%,
			rgba(10, 18, 6, 0.98) 100%
		) !important;
		border: 1px solid rgba(216, 163, 52, 0.3) !important;
		border-radius: 14px !important;
		padding: 1.5rem !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.75),
			0 0 70px rgba(158, 196, 74, 0.07),
			inset 0 1px 0 rgba(255, 243, 189, 0.06) !important;
	}

	/* Buy Bonus cards (components-ui-html/BonusCard.svelte → .bonus-card-wrap):
	   the shared component paints a flat black panel, which read as unfinished
	   next to the rest of the game. Brass-edged olive plate instead. */
	/* THE CARD'S FRAME LIVES HERE, not in the art.
	   The art used to draw its own brass rect, which `object-fit: cover` then
	   cropped down to a bar on the left and right with nothing across the top or
	   bottom — see the note in design/generate_mode_cards.mjs. A border on the
	   element is four-sided by construction whatever shape the card ends up.

	   2px rather than 1: it is now the only thing separating the card art from
	   the panel behind it, and both are dark. */
	:global(.bonus-card-wrap) {
		background: linear-gradient(
			165deg,
			rgba(34, 46, 16, 0.95) 0%,
			rgba(16, 24, 8, 0.97) 100%
		) !important;
		border: 2px solid rgba(216, 163, 52, 0.55) !important;
		border-radius: 12px !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 243, 189, 0.06) !important;
		transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		border-color: rgba(255, 215, 94, 0.65) !important;
		box-shadow: 0 0 22px rgba(255, 215, 94, 0.18) !important;
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
		border-radius: 16px !important;
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

	/* card copy: title in banana gold, price in the brass used on the bet bar */
	:global(.bonus-card-wrap .title) {
		color: #ffd75e !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #fff7d6 !important;
		font-weight: 800 !important;
		text-shadow: 0 0 10px rgba(216, 163, 52, 0.45) !important;
	}

	:global(.bonus-card-wrap .description) {
		color: rgba(255, 247, 214, 0.72) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(8, 16, 4, 0.45);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, rgba(216, 163, 52, 0.55), rgba(120, 88, 24, 0.5));
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, rgba(255, 215, 94, 0.75), rgba(158, 196, 74, 0.6));
	}

	/* Toggle / checkbox / select inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: rgba(24, 34, 10, 0.85) !important;
		border: 1px solid rgba(216, 163, 52, 0.3) !important;
		border-radius: 6px !important;
		color: #fff !important;
		transition: border-color 0.2s ease !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: rgba(255, 215, 94, 0.6) !important;
		outline: none !important;
		box-shadow: 0 0 8px rgba(216, 163, 52, 0.28) !important;
	}

	/* ══════════════════════════════════════════════════════
	   PLATFORM SKIN — the DOM half of it, in THIS GAME'S MINE PALETTE.

	   game/uiTheme.ts stamps the resolved skin on <html>, so these rules apply
	   only when it resolved to 'platform'. Everything above is untouched and is
	   byte-for-byte what the 'boomana' skin shows.

	   The platform skin arrived with Hacksaw's greys and green (#2a2a2a panels,
	   #4ace4a accents). Review asked for the Bonus Buy button and menu to be
	   "consistent with the game's overall style", and grey-and-green is not this
	   game's anything. So the SHAPES stay platform-plain - flat panels, square-ish
	   corners, no brass - and the COLOURS are the mine's, sampled off the shipped
	   art rather than chosen:

	     panel     #182345 -> #101830   b.png's slate, the rock under the dynamite
	     edge      #39c7ed #376b9a      l1.png's rough stone border
	     text      #f6f5ff #bbd8ef      l1.png's pale stone, lit and mid
	     accent    #fc4ed7 #9aeaff      the fuse's spark (the Buy Bonus hover)
	     buy CTA   #a428aa -> #5a1d87   b.png's dynamite reds

	   Amber is the accent everywhere; dynamite red is spent on ONE thing, the buy
	   buttons on the cards, because that is the only place a press costs 100x+.
	   The confirm dialog's button is amber like Auto Spin's and the bet menu's:
	   .ui-modal-button-wrap is shared by all three, and a red there would put the
	   "you are spending" colour on a bet-size change.
	   ═════════════════════════════════════════════════════ */

	/* the shade behind a modal: mine-dark, not jungle shade */
	:global(html[data-ui-skin='neon'] .blur-layer) {
		background-color: rgba(8, 8, 10, 0.74) !important;
	}

	/* the panel: slate in a stone edge, lit along its top like every object here */
	:global(html[data-ui-skin='neon'] .ui-popup-standard-content-wrap) {
		background: linear-gradient(160deg, #182345 0%, #101830 100%) !important;
		border: 3px solid #39c7ed !important;
		border-radius: 12px !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.7),
			inset 0 1px 0 rgba(239, 225, 197, 0.18) !important;
	}

	/* Every button plate in a modal: the Auto Spin round chips, the settings
	   toggles, the bet-menu amounts. Dark slate in a stone edge. */
	:global(html[data-ui-skin='neon'] .rectangle) {
		background: #131f3d !important;
		border: 1px solid #376b9a !important;
		border-radius: 6px !important;
		box-shadow: none !important;
		transition:
			border-color 0.14s ease,
			box-shadow 0.14s ease,
			transform 0.1s ease;
	}

	/* hover is the spark catching: amber edge and a little light */
	:global(html[data-ui-skin='neon'] .button:hover .rectangle) {
		border-color: #fc4ed7 !important;
		box-shadow: 0 0 10px rgba(252, 78, 215, 0.35) !important;
	}

	:global(html[data-ui-skin='neon'] .button:active .rectangle) {
		border-color: #9aeaff !important;
		box-shadow: none !important;
		transform: scale(0.97);
	}

	/* the primary action at the foot of Auto Spin, the bet menu and the buy
	   confirmation: amber, the game's accent - see the header for why not red */
	:global(html[data-ui-skin='neon'] .ui-modal-button-wrap .rectangle) {
		background: linear-gradient(180deg, #353079 0%, #201b53 100%) !important;
		border: 2px solid #fc4ed7 !important;
	}

	:global(html[data-ui-skin='neon'] .ui-modal-button-wrap .button:hover .rectangle) {
		background: linear-gradient(180deg, #563ea3 0%, #30216b 100%) !important;
		box-shadow: 0 0 16px rgba(252, 78, 215, 0.5) !important;
	}

	:global(html[data-ui-skin='neon'] .close-button) {
		color: #bbd8ef !important;
	}

	:global(html[data-ui-skin='neon'] .close-button:hover) {
		color: #fc4ed7 !important;
		text-shadow: none !important;
	}

	:global(html[data-ui-skin='neon'] .pop-up-wrap h1),
	:global(html[data-ui-skin='neon'] .pop-up-wrap h2),
	:global(html[data-ui-skin='neon'] .pop-up-wrap h3),
	:global(html[data-ui-skin='neon'] .pop-up-wrap h4) {
		color: #f6f5ff !important;
	}

	:global(html[data-ui-skin='neon'] .pop-up-wrap input),
	:global(html[data-ui-skin='neon'] .pop-up-wrap select) {
		background: #0d1632 !important;
		border: 1px solid #376b9a !important;
		border-radius: 6px !important;
	}

	:global(html[data-ui-skin='neon'] .pop-up-wrap input:focus),
	:global(html[data-ui-skin='neon'] .pop-up-wrap select:focus) {
		border-color: #fc4ed7 !important;
		box-shadow: 0 0 8px rgba(252, 78, 215, 0.3) !important;
	}

	:global(html[data-ui-skin='neon'] ::-webkit-scrollbar-track) {
		background: #0d1632;
	}

	:global(html[data-ui-skin='neon'] ::-webkit-scrollbar-thumb) {
		background: #376b9a;
	}

	:global(html[data-ui-skin='neon'] ::-webkit-scrollbar-thumb:hover) {
		background: #39c7ed;
	}

	/* ── THE BUY CARDS ─────────────────────────────────────────────────────────
	   Stone-edged, and ALIVE UNDER THE CURSOR, the same promise the Buy Bonus
	   button makes: the edge catches the spark's amber, a warm light comes up
	   inside it and the cover art brightens. Nothing moves, at rest or on hover -
	   see the clipping note below for why nothing may.

	   The cover art is part of this too. It was olive jungle canvas carried over
	   from gen-3, and no frame colour could fix that; design/generate_mode_cards.mjs
	   now paints the cards on the same mine slate as this panel. */
	/* NOTHING ON HOVER MAY LEAVE THE CARD'S BOX.
	   The row is BaseScrollable type="row", which carries the global .scrollX —
	   `overflow-x: auto` WITH `overflow-y: hidden`. So anything drawn above or
	   below a card is clipped: a first version lifted the card 4px on hover and
	   the top border was cut off by that clip, which looked like the gold frame
	   sliding away and vanishing. An outer glow is cut in half the same way.
	   The lift is gone and the glow is INSET, so the card lights up from within
	   its own edges and its geometry never moves. */
	:global(html[data-ui-skin='neon'] .bonus-card-wrap) {
		background: #131f3d !important;
		border: 2px solid #39c7ed !important;
		border-radius: 10px !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45) !important;
		transition:
			box-shadow 0.16s ease,
			border-color 0.16s ease;
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap:hover) {
		border-color: #fc4ed7 !important;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.45),
			inset 0 0 0 1px rgba(252, 78, 215, 0.5),
			inset 0 0 20px rgba(252, 78, 215, 0.28) !important;
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap .cover) {
		transition: filter 0.16s ease;
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap:hover .cover) {
		filter: brightness(1.14) saturate(1.08);
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap .title) {
		color: #f6f5ff !important;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
	}

	/* the price is the number the player is deciding on: the spark's amber */
	:global(html[data-ui-skin='neon'] .bonus-card-wrap .price) {
		color: #9aeaff !important;
		font-weight: 700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap .description) {
		color: #bbd8ef !important;
	}

	/* The card's BUY button: dynamite red, the one place it is used. */
	:global(html[data-ui-skin='neon'] .bonus-card-wrap .rectangle) {
		background: linear-gradient(180deg, #a428aa 0%, #5a1d87 100%) !important;
		border: 1px solid #481168 !important;
		box-shadow: inset 0 1px 0 rgba(255, 190, 170, 0.35) !important;
	}

	:global(html[data-ui-skin='neon'] .bonus-card-wrap .button:hover .rectangle) {
		background: linear-gradient(180deg, #d93bcc 0%, #732ba4 100%) !important;
		border-color: #fc4ed7 !important;
		box-shadow:
			inset 0 1px 0 rgba(255, 210, 190, 0.45),
			0 0 14px rgba(252, 78, 215, 0.55) !important;
	}

	/* A button that cannot be pressed (not enough balance) must not look lit. */
	:global(html[data-ui-skin='neon'] .bonus-card-wrap .button:disabled .rectangle),
	:global(html[data-ui-skin='neon'] .bonus-card-wrap .button[disabled] .rectangle) {
		background: #3a3434 !important;
		border-color: #4a4040 !important;
		box-shadow: none !important;
	}

	/* no fades, for players who have asked for less motion. There is no lift to
	   disable any more - see the clipping note above. */
	@media (prefers-reduced-motion: reduce) {
		:global(html[data-ui-skin='neon'] .bonus-card-wrap),
		:global(html[data-ui-skin='neon'] .bonus-card-wrap .cover),
		:global(html[data-ui-skin='neon'] .rectangle) {
			transition: none;
		}
	}

	/* ── THE SELECTED CHIP ────────────────────────────────────────────────────
	   This is a fix, not a restyle, and it applies to BOTH skins.

	   The Auto Spin panel marks the chosen round count three ways, and this file
	   was destroying two of them. AutoSpinsOptions passes BaseIcon a background
	   ('#5d2396' when selected, 'black' otherwise) and a border ('2px white
	   solid' / '2px black solid'); BaseIcon puts both on .rectangle through
	   custom properties. The .rectangle override above sets `background` and
	   `border` with !important, and an author !important declaration beats the
	   package's plain one — so every chip rendered the same plate with the same
	   brass edge, and the only thing left telling the player which one they had
	   picked was the gold colour of the number.

	   (The 2px white on '#5d2396' is the template's plum, so the chip was never
	   this game's colour in either skin. Restoring the package's own values would
	   put a purple chip in a jungle panel; the selected state is drawn in the
	   skin's own accent instead.)

	   :has() rather than a class on the button: OptionsGrid renders a plain
	   Button with no selected state of its own, and the only signal in the DOM is
	   the .selected class AutoSpinsOptions puts on the label inside it. */
	:global(.button:has(.selected) .rectangle) {
		border-color: #ffd75e !important;
		background: linear-gradient(
			160deg,
			rgba(88, 74, 26, 0.95) 0%,
			rgba(52, 42, 12, 0.98) 100%
		) !important;
		box-shadow:
			0 0 14px rgba(255, 215, 94, 0.35),
			inset 0 1px 0 rgba(255, 243, 189, 0.14) !important;
	}

	:global(html[data-ui-skin='neon'] .button:has(.selected) .rectangle) {
		background: #201b53 !important;
		border: 2px solid #fc4ed7 !important;
		box-shadow: 0 0 8px rgba(252, 78, 215, 0.3) !important;
	}

	/* the label inside the selected chip, in the spark's amber - the platform
	   skin's accent in this game, as green was in the one it was ported from */
	:global(html[data-ui-skin='neon'] .selected) {
		color: #9aeaff !important;
		text-shadow: none !important;
	}

	/* ── THE SELECTED BET AMOUNT: LIT THE SAME AS THE AUTO SPIN CHIP ──────────
	   The bet menu's grid (BetMenuAmountGrid) marks its choice only through
	   BaseIcon's border prop - '2px white solid' when chosen, '2px black solid'
	   otherwise - and puts no .selected class on the label the way
	   AutoSpinsOptions does. So the :has(.selected) rules above never matched
	   it, the .rectangle override flattened its border like every other chip,
	   and a clicked stake looked exactly like the ones around it.

	   Matched here on the inline style BaseIcon writes rather than by adding the
	   class to the shared package: that package is shared by every game, and a
	   class there would change the bet menu of the ones already shipped. The
	   Auto Spin chip carries the same border when selected, so both panels land
	   on these same rules. */
	:global(.button:has(.rectangle[style*='2px white solid']) .rectangle) {
		border-color: #ffd75e !important;
		background: linear-gradient(
			160deg,
			rgba(88, 74, 26, 0.95) 0%,
			rgba(52, 42, 12, 0.98) 100%
		) !important;
		box-shadow:
			0 0 14px rgba(255, 215, 94, 0.35),
			inset 0 1px 0 rgba(255, 243, 189, 0.14) !important;
	}

	:global(html[data-ui-skin='neon'] .button:has(.rectangle[style*='2px white solid']) .rectangle) {
		background: #201b53 !important;
		border: 2px solid #fc4ed7 !important;
		box-shadow: 0 0 8px rgba(252, 78, 215, 0.3) !important;
	}

	:global(.button:has(.rectangle[style*='2px white solid']) span) {
		color: #ffd76a !important;
		font-weight: 700;
	}

	:global(html[data-ui-skin='neon'] .button:has(.rectangle[style*='2px white solid']) span) {
		color: #9aeaff !important;
		text-shadow: none !important;
	}

</style>
