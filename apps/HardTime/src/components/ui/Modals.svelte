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
	import ModalSettings from 'components-ui-html/src/components/ModalSettings.svelte';

	import ModalBuyBonus from './ModalBuyBonus.svelte';
	import ModalPayTable from './ModalPayTable.svelte';
	import ModalGameRules from './ModalGameRules.svelte';

	// Side-effect import: writes the --capo-* custom properties this stylesheet and
	// the two local modals below are entirely built out of. game/uiTheme.ts imports
	// the same module for the pixi side, so in the game these are already set — but
	// a Storybook story that mounts a modal without the game would otherwise render
	// every rule against an unset var and fall back to transparent.
	import '../../game/palette';

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
	   Capo Nostra — modal skin.
	   Warm near-black canvas, gold trim: the same palette as
	   the reel housing (BoardFrame), the free-spin plaques and the bet bar
	   (game/uiTheme.ts), so Buy Bonus and every other modal read as one game.

	   EVERY COLOUR IN THIS FILE IS A --capo-* CUSTOM PROPERTY, and there are no
	   raw hex or rgb literals left except pure black shadows. They come from
	   game/palette.ts, which is ART_AUDIO_BRIEF.md §0's 色票 table and nothing else.

	   Why: this block was already "warm near-black and gold" and had been since
	   the reskin, and it was still wrong. The golds in it were GoBananas' banana
	   ramp — #ffd75e / #ffe98a / #a87a1e / #d8a334 — one step brighter and more
	   yellow than this game's #C9A227 / #E8D48B / #8A6D1F, close enough that
	   nobody looking at a screenshot would call it, and far enough that the
	   modals and the board were not the same gold. A palette that lives only in
	   a markdown table gets approximated by eye; one that lives in a module gets
	   imported.

	   ⚠ Do not add #C1272D, in any notation. §0 reserves the signal red for the
	   Tommy Gun wild so that red on screen means that mechanic. It is not in
	   game/palette.ts on purpose.
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

	/* .ui-modal-title-wrap is the shared BaseTitle, and it is a <div>, not a
	   heading — so the h1-h4 rule below missed the title of every shared panel
	   (Settings, Auto Spin, the Bet menu) and left them in the body face while
	   the panels this game drew itself were in Cinzel. */
	:global(.pop-up-wrap h1),
	:global(.pop-up-wrap h2),
	:global(.pop-up-wrap h3),
	:global(.pop-up-wrap h4),
	:global(.pop-up-wrap .ui-modal-title-wrap) {
		/* Cinzel, the same face as the Buy Bonus card, the tier titles and the
		   Pay Table / Game Rules headings. This was Titan One, which is Hot
		   Miami's rounded display face — it left the shared panels that have no
		   bespoke skin of their own (Settings, Auto Spin, the Bet menu) in a
		   different alphabet from every panel this game actually drew. */
		font-family: var(--hm-title-font, var(--gb-display-font)) !important;
		font-weight: 700 !important;
		letter-spacing: 0.06em;
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

	/* Button icon background (the rounded rectangle inside buttons) */
	:global(.rectangle) {
		background: linear-gradient(
			160deg,
			rgba(var(--capo-ink-rgb), 0.95) 0%,
			rgba(var(--capo-ink-deep-rgb), 0.98) 45%,
			rgba(var(--capo-ink-rgb), 0.95) 100%
		) !important;
		border: 1px solid rgba(var(--capo-gold-rgb), 0.4) !important;
		border-radius: 10px !important;
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(var(--capo-bone-rgb), 0.07) !important;
		transition: all 0.2s ease !important;
	}

	:global(.button:hover .rectangle) {
		border-color: rgba(var(--capo-gold-rgb), 0.7) !important;
		box-shadow:
			0 4px 18px rgba(var(--capo-gold-rgb), 0.28),
			inset 0 1px 0 rgba(var(--capo-bone-rgb), 0.12) !important;
	}

	:global(.button:active .rectangle) {
		border-color: rgba(var(--capo-gold-light-rgb), 0.85) !important;
		box-shadow:
			0 1px 6px rgba(var(--capo-gold-rgb), 0.35),
			inset 0 2px 4px rgba(0, 0, 0, 0.5) !important;
		transform: scale(0.97);
	}

	/* Close button (×) */
	:global(.close-button) {
		color: rgba(var(--capo-gold-rgb), 0.85) !important;
		transition: color 0.2s ease, text-shadow 0.2s ease !important;
	}

	:global(.close-button:hover) {
		color: var(--capo-bone) !important;
		text-shadow: 0 0 12px rgba(var(--capo-gold-rgb), 0.85) !important;
	}

	/* Modal backdrop — warm near-black. Was a jungle shade carried over from
	   GoBananas, which tinted every panel's surround green. */
	:global(.blur-layer) {
		background-color: rgba(var(--capo-ink-deep-rgb), 0.78) !important;
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
			rgba(var(--capo-ink-rgb), 0.97) 0%,
			rgba(var(--capo-ink-deep-rgb), 0.98) 100%
		) !important;
		border: 1px solid rgba(var(--capo-gold-rgb), 0.3) !important;
		border-radius: 14px !important;
		padding: 1.5rem !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.75),
			0 0 70px rgba(var(--capo-gold-light-rgb), 0.07),
			inset 0 1px 0 rgba(var(--capo-bone-rgb), 0.06) !important;
	}

	/* Buy Bonus cards (components-ui-html/BonusCard.svelte → .bonus-card-wrap):
	   the shared component paints a flat black panel, which read as unfinished
	   next to the rest of the game. Gold-edged dark plate instead. */
	:global(.bonus-card-wrap) {
		background: linear-gradient(
			165deg,
			rgba(var(--capo-ink-rgb), 0.95) 0%,
			rgba(var(--capo-ink-deep-rgb), 0.97) 100%
		) !important;
		border: 18px solid transparent !important;
		border-image: url('/assets/sprites/hardTimeUi/buy_card_frame.svg') 96 fill stretch !important;
		border-radius: 12px !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(var(--capo-bone-rgb), 0.06) !important;
		transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		filter: brightness(1.12) !important;
		box-shadow: 0 0 22px rgba(var(--capo-gold-rgb), 0.18) !important;
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
		color: var(--capo-gold) !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: var(--capo-bone) !important;
		font-weight: 800 !important;
		text-shadow: 0 0 10px rgba(var(--capo-gold-rgb), 0.45) !important;
	}

	:global(.bonus-card-wrap .description) {
		color: rgba(var(--capo-bone-rgb), 0.72) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(var(--capo-ink-deep-rgb), 0.5);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, rgba(var(--capo-gold-rgb), 0.55), rgba(var(--capo-gold-dark-rgb), 0.5));
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, rgba(var(--capo-gold-rgb), 0.75), rgba(var(--capo-gold-dark-rgb), 0.7));
	}

	/* Toggle / checkbox / select inputs in modals */
	:global(.pop-up-wrap input),
	:global(.pop-up-wrap select) {
		/* accent-color is what paints a range slider's filled track and thumb. It
		   was never set, so the Settings volume sliders rendered in the browser's
		   default blue — the one bright blue in a game with no blue in it. */
		accent-color: var(--capo-gold) !important;
		background: rgba(var(--capo-ink-rgb), 0.85) !important;
		border: 1px solid rgba(var(--capo-gold-rgb), 0.3) !important;
		border-radius: 6px !important;
		color: var(--capo-bone) !important;
		transition: border-color 0.2s ease !important;
	}

	:global(.pop-up-wrap input:focus),
	:global(.pop-up-wrap select:focus) {
		border-color: rgba(var(--capo-gold-rgb), 0.6) !important;
		outline: none !important;
		box-shadow: 0 0 8px rgba(var(--capo-gold-rgb), 0.28) !important;
	}
</style>
