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
	   PLATFORM SKIN — the DOM half of it.

	   game/uiTheme.ts stamps the resolved skin on <html>, so these rules apply
	   only when it resolved to 'platform'. Everything above is untouched and is
	   byte-for-byte what the 'boat' skin shows.

	   Same source as the bet bar's casing: Hacksaw's .ActionPanel (#2a2a2a on a
	   3px #0f0f0f edge), their .Button table (#343a40 borders, #4ace4a primary,
	   #bfbfbf disabled text) and their mobile CircleButton disc. The bar went
	   flat grey and these panels stayed olive and brass, which read as two
	   different products stacked on one screen.
	   ═════════════════════════════════════════════════════ */

	/* the shade behind a modal: neutral black, not jungle shade */
	:global(html[data-ui-skin='platform'] .blur-layer) {
		background-color: rgba(0, 0, 0, 0.72) !important;
	}

	/* the panel itself — their .ActionPanel, at the radius they use */
	:global(html[data-ui-skin='platform'] .ui-popup-standard-content-wrap) {
		background: #2a2a2a !important;
		border: 3px solid #0f0f0f !important;
		border-radius: 4px !important;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7) !important;
	}

	/* Every button plate in a modal: the Auto Spin round chips, the settings
	   toggles, the bet-menu amounts. Their CircleButton disc, squared off. */
	:global(html[data-ui-skin='platform'] .rectangle) {
		background: #14171a !important;
		border: 1px solid #565e66 !important;
		border-radius: 4px !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .button:hover .rectangle) {
		border-color: #8a949c !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .button:active .rectangle) {
		border-color: #4ace4a !important;
		box-shadow: none !important;
		transform: scale(0.97);
	}

	:global(html[data-ui-skin='platform'] .close-button) {
		color: #bfbfbf !important;
	}

	:global(html[data-ui-skin='platform'] .close-button:hover) {
		color: #ffffff !important;
		text-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap h1),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h2),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h3),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h4) {
		color: #ffffff !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select) {
		background: #14171a !important;
		border: 1px solid #343a40 !important;
		border-radius: 4px !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input:focus),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select:focus) {
		border-color: #4ace4a !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-track) {
		background: #1a1a1a;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb) {
		background: #565e66;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb:hover) {
		background: #8a949c;
	}

	/* the buy cards, which are the one place the platform palette uses colour */
	/* The platform card's frame. #0f0f0f was their .ActionPanel edge colour, which
	   is right for a panel sitting on the game art and invisible here: a near-black
	   line between a dark card and a #2a2a2a panel. Their .Button border grey
	   instead, at 2px, so the card has an edge a player can actually see. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap) {
		background: #1f1f1f !important;
		border: 2px solid #565e66 !important;
		border-radius: 4px !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .bonus-card-wrap:hover) {
		border-color: #4ace4a !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .bonus-card-wrap .title),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .price) {
		color: #ffffff !important;
		text-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .bonus-card-wrap .description) {
		color: #bfbfbf !important;
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

	:global(html[data-ui-skin='platform'] .button:has(.selected) .rectangle) {
		background: #14171a !important;
		border: 2px solid #4ace4a !important;
		box-shadow: none !important;
	}

	/* the label inside the selected chip: gold is the jungle skin's accent and
	   has no business on the platform strip, where green is the only colour */
	:global(html[data-ui-skin='platform'] .selected) {
		color: #4ace4a !important;
		text-shadow: none !important;
	}
</style>
