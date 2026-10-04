<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table / game rules,
	// which we override locally with WildParty-specific content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	import ModalBuyBonus from './ModalBuyBonus.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
	// Plain notifications — the insufficient-balance notice the bet button
	// raises. Distinct from ModalAutoSpinMessage above, which opens with "AUTO
	// PLAY HAS STOPPED DUE TO" and is only correct when a run actually stopped.
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

	/* The narrow-screen and short-viewport rules that used to sit here were both
	   reverted by the +60% enlargement further down — same selector, same
	   !important, later in the file. They are folded into the popout block at the
	   end of this stylesheet, which is placed after the enlargement so it wins. */

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

	/* ── Popout S / L: the buy menu, laid out instead of scaled ──────────────
	   Certification reported the buy menu broken in the popout views. Popout S is
	   660x400 and Popout L is not much taller, and both land on the SMALL bonus
	   wrappers (BonusContentWrapLandscape / BonusContentWrapPortrait). Those
	   wrappers do not lay the cards out — they render them at full size inside an
	   absolutely positioned overlay and shrink the whole thing with a CSS
	   transform, floored at MIN_SCALE = 0.72 so the text stays readable.

	   With four buy cards that floor cannot be met. A row of four is ~1040px
	   wide; at 660px wide the honest scale is 0.39, the floor holds it at 0.72,
	   and ~750px of cards are drawn from an origin that is ALSO shifted 7rem left
	   to clear the bet stepper — so the row runs off both edges, the wrapper is
	   `position: absolute` with `noScroll` on its rows, and nothing can be
	   scrolled back into view. That is the screenshot: clipped cards, no reachable
	   BUY button.

	   The transform floor is the right call for the shared component and is left
	   alone. What is wrong here is asking a fixed-size overlay to hold four cards
	   at all. So below a popout-sized viewport this game opts out of the overlay:
	   the wrapper becomes an ordinary scrollable block in the popup's flow, the
	   scale transform is dropped, the card rows wrap, and the cards are sized in
	   px with legibility floors rather than being shrunk by a transform. The bet
	   stepper stops floating over the cards and sits under them, where a 660px
	   viewport has room for it.

	   Scoped to this app, and placed LAST on purpose: these are the same
	   !important declarations as the enlargement block above, so only source
	   order decides the winner. The earlier narrow-screen rules were being
	   silently reverted by the +60% block for exactly that reason. */
	@media screen and (max-width: 760px), screen and (max-height: 620px) {
		/* The overlay wrappers: .bonuses-wrap is the landscape one, .wrap the
		   portrait one. Neither is the desktop layout, whose .bonuses-wrap is a
		   plain in-flow flex row and is unaffected by any of this. */
		:global(.ui-popup-standard-content-wrap > .bonuses-wrap),
		:global(.ui-popup-standard-content-wrap > .wrap) {
			position: static !important;
			transform: none !important;
			width: 100% !important;
			min-height: 0 !important;
			max-height: 100% !important;
			overflow-y: auto !important;
			overflow-x: hidden !important;
		}

		/* the scale transform itself */
		:global(.ui-popup-standard-content-wrap .bonuses) {
			transform: none !important;
			width: 100% !important;
			gap: 0.5rem !important;
		}

		/* No mode in this game is an "activate" mode, so the wrappers' first row
		   is always empty — without this it still spends a 1rem gap. */
		:global(.ui-popup-standard-content-wrap .content.row:empty) {
			display: none !important;
		}

		/* Four cards on one line is what overflows; let them wrap. */
		:global(.ui-popup-standard-content-wrap .content.row) {
			flex-direction: row !important;
			flex-wrap: wrap !important;
			align-items: stretch !important;
			width: 100% !important;
			gap: 0.5rem !important;
		}

		/* The +60% enlargement above is a desktop decision; undo it here and size
		   the cards to fit two per row at 660px. Type is set in px floors so the
		   result is readable at the size it is actually drawn — which is the thing
		   the transform could not guarantee. */
		:global(.bonus-card-wrap) {
			flex: 1 1 13rem !important;
			min-width: 12rem !important;
			max-width: 18rem !important;
			font-size: 1rem !important;
			padding: 0.5rem !important;
			gap: 0.4rem !important;
			border-radius: 10px !important;
		}

		:global(.bonus-card-wrap .info) {
			gap: 0.35rem !important;
		}

		:global(.bonus-card-wrap .title) {
			font-size: clamp(12px, 0.9rem, 16px) !important;
		}

		:global(.bonus-card-wrap .description) {
			font-size: clamp(11px, 0.78rem, 14px) !important;
			min-height: 0 !important;
		}

		:global(.bonus-card-wrap .price) {
			font-size: clamp(13px, 0.95rem, 17px) !important;
		}

		/* the buy button: its height rides a variable and its label an inline
		   font-size, so both have to be named to come back down */
		:global(.bonus-card-wrap .rectangle) {
			--height-value: 2rem !important;
		}

		:global(.bonus-card-wrap span) {
			font-size: clamp(12px, 0.85rem, 15px) !important;
		}

		/* the mode icon — 2.75rem is most of a 400px-tall popout's card */
		:global(.bonus-card-wrap .icon) {
			height: 1.9rem !important;
		}

		/* The stepper is `position: fixed` in both wrappers (right-centred in
		   landscape, bottom-centred in portrait) because it had to clear an
		   overlay that no longer exists. In flow it sits under the cards. */
		:global(.ui-popup-standard-content-wrap > .badge-amount-wrap),
		:global(.ui-popup-standard-content-wrap > .badge-amount-wrap-scaled) {
			position: static !important;
			transform: none !important;
			flex: 0 0 auto !important;
		}

		/* The wrapper's children are in normal flow again, so it needs its size,
		   its plate and its padding back — the `:has(.bonuses-wrap)` rule above
		   strips all three, and it was right to while they were out of flow.
		   3rem of top padding keeps the title clear of the × button. */
		:global(.ui-popup-standard-content-wrap:has(> .bonuses-wrap)),
		:global(.ui-popup-standard-content-wrap:has(> .wrap)) {
			box-sizing: border-box !important;
			width: 100% !important;
			height: 100% !important;
			justify-content: flex-start !important;
			padding: 3rem 0.75rem 0.75rem !important;
			gap: 0.6rem !important;
			background: none !important;
			border: none !important;
			box-shadow: none !important;
		}
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

	/* Ninja lacquer for the shared confirmation and stake panels. */
	:global(.blur-layer) {
		background-color: rgba(3, 10, 16, 0.78) !important;
	}
	:global(.ui-popup-standard-content-wrap) {
		background: linear-gradient(160deg, #172a34, #09151d) !important;
		border-color: #a7824b !important;
		box-shadow: 0 12px 40px #000b, inset 0 1px 0 #f2d99c33 !important;
	}
	:global(.pop-up-wrap .rectangle) {
		background: linear-gradient(160deg, #243943, #10212b) !important;
		border-color: #a7824b !important;
	}
	:global(.pop-up-wrap .button:hover .rectangle) {
		border-color: #f0d490 !important;
		box-shadow: 0 0 14px #c83b4540 !important;
	}
	:global(.pop-up-wrap .close-button) {
		color: #f0d490 !important;
	}

	/* Boat's control hierarchy applied to the shared Bet and Auto menus:
	   dark lacquer is idle, crimson is selected/committed, gold is the edge. */
	:global(.pop-up-wrap .ui-popup-standard-content-wrap) {
		border: 2px solid #617b85 !important;
		border-radius: 7px !important;
		box-shadow: 0 15px 40px #000b, inset 0 0 0 1px #d8b77533 !important;
	}
	:global(.pop-up-wrap .rectangle) {
		background: #0a1922 !important;
		border: 1px solid #617b85 !important;
		border-radius: 5px !important;
		box-shadow: none !important;
	}
	:global(.pop-up-wrap .button:hover .rectangle) {
		background: #142b36 !important;
		border-color: #a8bec1 !important;
		box-shadow: none !important;
	}
	:global(.pop-up-wrap .button:active .rectangle) {
		transform: scale(0.97);
	}
	/* Auto marks the label .selected; Bet marks the plate through its inline
	   --border-value. Either route keeps the selected chip lit on hover. */
	:global(.pop-up-wrap .button:has(.selected) .rectangle),
	:global(.pop-up-wrap .button .rectangle[style*='2px white solid']),
	:global(.pop-up-wrap .button:has(.selected):hover .rectangle),
	:global(.pop-up-wrap .button:hover .rectangle[style*='2px white solid']) {
		background: linear-gradient(180deg, #67242e, #361920) !important;
		border: 2px solid #e8c478 !important;
		box-shadow: inset 0 1px 0 #ffffff2b, 0 0 13px #bd404750 !important;
	}
	:global(.pop-up-wrap .button:has(.selected) span),
	:global(.pop-up-wrap .button:has(.rectangle[style*='2px white solid']) span) {
		color: #ffe3a0 !important;
		text-shadow: none !important;
	}
	/* Auto START, stake CONFIRM and feature confirmation must read as actions,
	   while an unaffordable disabled control stays dark. */
	:global(.pop-up-wrap .ui-modal-button-wrap .button:not(.disabled) .rectangle) {
		background: linear-gradient(180deg, #b43b44, #84232f) !important;
		border: 2px solid #e8c478 !important;
		box-shadow: inset 0 1px 0 #ffe6aa70, 0 3px 0 #3a1019 !important;
	}
	:global(.pop-up-wrap .ui-modal-button-wrap .button:not(.disabled):hover .rectangle) {
		background: linear-gradient(180deg, #ce4c53, #992d38) !important;
		border-color: #ffdfa1 !important;
	}
	:global(.pop-up-wrap .ui-modal-button-wrap .button:not(.disabled) span) {
		color: #fff4df !important;
		text-shadow: 0 1px #3a1019 !important;
	}
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		background: #0a1922 !important;
		border: 1px solid #617b85 !important;
		color: #f5e8d1 !important;
		accent-color: #b43b44;
	}
	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: #e8c478 !important;
		box-shadow: 0 0 0 2px #b43b4440 !important;
	}
	:global(.pop-up-wrap .close-button:hover) {
		color: #fff4df !important;
	}
</style>
