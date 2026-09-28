<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table / game rules,
	// which we override locally with WildParty-specific content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	// the feature-buy menu is this game's own (space cards, GoBoomana's layout)
	import ModalBuyBonus from './ModalBuyBonus.svelte';
	// ...and so is its confirmation, which shows the chosen card again
	import ModalBuyBonusConfirm from './ModalBuyBonusConfirm.svelte';
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

	/* THE PRICE HAS ITS OWN GROUND, and only the price.

	   The card's artwork is the point now — a planet, a comet, a shower of coins —
	   and BonusCard puts its text at whatever height its own content makes it,
	   with no way to move it. Measured, the title and description sit under
	   BonusCard's scrim at 0.94-0.72 and were legible from the start. The PRICE
	   is the one line that lands in the middle of the card, where that scrim is
	   at its most open (0.38) and the art at its brightest.

	   A first version put a soft dark plate behind the whole text block. It fixed
	   the price and buried the art under it: at 0.86 over most of the card the
	   three free-spin cards stopped being distinguishable, which was the thing
	   they were being redrawn to be. So it is a small pill behind the number and
	   nothing else. The feathered shadow round it keeps it from reading as a
	   button, which it is not.

	   Both skins: it is about reading, not about palette. */
	:global(.bonus-card-wrap.has-cover .price) {
		align-self: center;
		padding: 0.1rem 0.9rem;
		border-radius: 999px;
		background: rgba(5, 9, 14, 0.74);
		box-shadow: 0 0 12px 5px rgba(5, 9, 14, 0.55);
	}

	/* ══════════════════════════════════════════════════════
	   PLATFORM SKIN — the DOM half of it.

	   game/uiTheme.ts stamps the resolved skin on <html>, so these rules apply
	   only when it resolved to 'platform'. Everything above is untouched and is
	   what the 'bananaut' skin shows.

	   Same SHAPES as the bet bar's casing — Hacksaw's .ActionPanel, their
	   .Button table and their mobile CircleButton disc, at their radii and
	   weights — in this game's GUNMETAL AND ICE rather than their grey and green.

	   The colours are the ones in game/palette.ts, written out as hex because CSS
	   cannot import a TS module. Change one there, change it here. The rule is the
	   same too: gunmetal is the capsule, ice is what is live. In a menu that means
	   panels and idle chips are gunmetal, and the one thing that goes ice is the
	   thing you have SELECTED or are pressing.

	     HULL        #151c23   panel ground
	     PANEL       #1c252e   (unused here; the bar's readout plates)
	     DISC        #0b1015   chips, inputs, card ground
	     STEEL_EDGE  #62798a   panel edge, idle chip ring
	     STEEL_DIM   #44586a   input ring, scrollbar
	     STEEL_TEXT  #93a8b7   secondary text, the close ×
	     SPIN_ICE    #1a7f9f   the commit buttons (white type reads at 4.58)
	     ICE_RIM     #8fe4ff   selected, active, focus
	     ICE_BRIGHT  #c4f1ff   text inside a selected chip
	     CREAM       #e6eaed   headings and anything read
	   ═════════════════════════════════════════════════════ */

	/* the shade behind a modal: cold and dark rather than neutral black — the
	   game shows through it, and a slate shade over a gunmetal scene keeps it the
	   same scene with the lights down */
	:global(html[data-ui-skin='platform'] .blur-layer) {
		background-color: rgba(5, 9, 13, 0.74) !important;
	}

	/* THE PANEL — their .ActionPanel at the radius they use, in hull slate. A
	   single faint ice line inside the steel edge: the trim a console has, and the
	   one piece of decoration the panel carries. It is at 0.14 so it reads as a
	   finish, not as a second border. */
	:global(html[data-ui-skin='platform'] .ui-popup-standard-content-wrap) {
		background: linear-gradient(180deg, #182029 0%, #151c23 60%, #11181e 100%) !important;
		border: 2px solid #62798a !important;
		border-radius: 6px !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.7),
			inset 0 0 0 1px rgba(143, 228, 255, 0.14) !important;
	}

	/* THE CHIPS — every button plate in a modal: the Auto Spin counts, the
	   settings toggles, the bet amounts. The same disc as the bar's round
	   controls, with the same steel ring, so a control looks the same wherever it
	   is. */
	:global(html[data-ui-skin='platform'] .rectangle) {
		background: #0b1015 !important;
		border: 1px solid #62798a !important;
		border-radius: 4px !important;
		box-shadow: none !important;
	}

	/* Hover LIGHTENS THE STEEL rather than jumping to ice. Ice means "selected"
	   in this skin, and a colour that also meant "the pointer is near it" would
	   stop meaning anything — the player could no longer tell which chip they had
	   actually picked by glancing at the panel. */
	:global(html[data-ui-skin='platform'] .button:hover .rectangle) {
		border-color: #9fb6c7 !important;
		background: #101820 !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .button:active .rectangle) {
		border-color: #8fe4ff !important;
		box-shadow: none !important;
		transform: scale(0.97);
	}

	:global(html[data-ui-skin='platform'] .close-button) {
		color: #93a8b7 !important;
	}

	:global(html[data-ui-skin='platform'] .close-button:hover) {
		color: #e6eaed !important;
		text-shadow: none !important;
	}

	/* Headings in cream, for the reason the bar's values are: pure white on this
	   slate glares, and these are the words that name every panel. */
	:global(html[data-ui-skin='platform'] .pop-up-wrap h1),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h2),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h3),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h4) {
		color: #e6eaed !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select) {
		background: #0b1015 !important;
		border: 1px solid #44586a !important;
		border-radius: 4px !important;
		color: #e6eaed !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input:focus),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select:focus) {
		border-color: #8fe4ff !important;
		box-shadow: none !important;
	}

	/* A range input's thumb and track are the only native controls left in the
	   modals that would still render in the browser's own blue. accent-color
	   hands the browser this skin's ice for them in one line. */
	:global(html[data-ui-skin='platform'] .pop-up-wrap input) {
		accent-color: #8fe4ff;
	}

	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-track) {
		background: #0b1015;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb) {
		background: #44586a;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb:hover) {
		background: #62798a;
	}

	/* THE BUY CARDS. Their frame is 2px, because a near-black 1px edge between a
	   dark card and a dark panel is not visible — steel at rest, ice under the
	   pointer. Ice here is not the "selected" ice of the chips — nothing on a card
	   is selected — but it IS the "this is what you press" ice, which is the other
	   half of the rule, and these cards are the most expensive thing the player
	   can press. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap) {
		background: #0b1015 !important;
		border: 2px solid #62798a !important;
		border-radius: 6px !important;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5) !important;
		transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
	}

	:global(html[data-ui-skin='platform'] .bonus-card-wrap:hover) {
		border-color: #8fe4ff !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			0 0 16px rgba(143, 228, 255, 0.24) !important;
	}

	/* THE SHADOWS SURVIVE THE SKIN SWITCH, and that is deliberate. The cards keep
	   their artwork in both skins, so in this skin the copy is sitting on the
	   board picture with nothing behind it unless the text carries its own dark
	   ground. Flat is a palette, not a licence to put white on a bright board.
	   Colours stay platform-flat; the ground stays. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .title),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .price) {
		color: #ffffff !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 11px rgba(0, 0, 0, 0.85) !important;
	}

	/* #bfbfbf is the platform's secondary grey, and it is meant for text on a
	   flat panel. On artwork it was the least legible thing in the modal. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .description) {
		color: #e6e6e6 !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 9px rgba(0, 0, 0, 0.85) !important;
	}

	/* ── THE SELECTED CHIP ────────────────────────────────────────────────────
	   This is a fix, not a restyle, and it applies to BOTH skins.

	   Every option grid marks the chosen chip through the SHARED components, and
	   this file was destroying the mark. BaseIcon writes the chip's border and
	   background into its own inline style as --border-value / --background-value;
	   the .rectangle override above sets `border` and `background` with
	   !important, and an author !important declaration beats the package's plain
	   one — so every chip rendered the same plate and the choice was invisible.

	   TWO PANELS, TWO SIGNALS, and this needs both selectors:

	     · Auto Spin marks its choice with a `.selected` class on the label, so
	       .button:has(.selected) finds it.
	     · THE BET MENU HAS NO CLASS TO FIND. BetMenuAmountGrid hands BaseIcon a
	       border of '2px white solid' for the chosen stake and '2px black solid'
	       for the rest, and that inline style is the ONLY thing in the DOM that
	       distinguishes the chosen chip. So it is keyed on directly:
	       [style*='2px white solid'] matches the selected amount and nothing else
	       — Auto Spin passes the same value for its own selection, so both panels
	       now mark a choice identically.

	   `.button` in front so it outranks the hover rule, which would otherwise
	   repaint a selected chip steel the moment the pointer crossed it. */
	:global(.button .rectangle[style*='2px white solid']),
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

	/* THE SELECTED CHIP LIGHTS UP. Three signals, because the platform chip is a
	   dark disc and a ring alone is not enough to pick one out of nine:
	     · an ICE RING at double weight
	     · a teal wash INSIDE it, dark enough that the number stays readable
	     · a GLOW outside it, so the chosen chip is the one thing in the grid that
	       throws light — which is what "lit" means. */
	:global(html[data-ui-skin='platform'] .button .rectangle[style*='2px white solid']),
	:global(html[data-ui-skin='platform'] .button:has(.selected) .rectangle) {
		background: linear-gradient(180deg, #14485b 0%, #0d2f3d 100%) !important;
		border: 2px solid #8fe4ff !important;
		box-shadow:
			0 0 14px rgba(143, 228, 255, 0.55),
			0 0 4px rgba(143, 228, 255, 0.7),
			inset 0 0 12px rgba(143, 228, 255, 0.2) !important;
	}

	/* the label inside the selected chip, lit to match its ring. The bet grid's
	   number has no class of its own, so it is found as the text sitting beside
	   the marked rectangle in the same button. */
	:global(html[data-ui-skin='platform'] .button:has(.rectangle[style*='2px white solid']) span),
	:global(html[data-ui-skin='platform'] .selected) {
		color: #c4f1ff !important;
		text-shadow: 0 0 8px rgba(143, 228, 255, 0.65) !important;
	}

	/* THE COMMIT BUTTON IS ICE.

	   Every button in these panels is the same BaseIcon plate, so the one that
	   ACTS — Start autoplay, the bet menu's confirm, BUY on a feature card, and
	   the CONFIRM on the buy dialog, the most expensive press in the game — was
	   drawn identically to the option chips above it: a grid of dark squares and
	   one more dark bar, told apart only by their words. A player had to read the
	   panel to find the way out of it.

	   The same deep ice as the spin button and for the same reason: the label on
	   it is white and SPIN_ICE is the colour it reads on (4.58). This is the rule
	   in palette.ts doing its job — the thing you press to commit is the lit thing
	   on the panel, exactly as it is on the bar.

	   :not(.disabled), so a BUY the balance cannot cover stays a dark chip. A lit
	   button that does nothing when pressed would be the one misleading control in
	   the menu. */
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .full-width .button:not(.disabled) .rectangle),
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .max-width .button:not(.disabled) .rectangle),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .button:not(.disabled) .rectangle) {
		background: linear-gradient(180deg, #1d88a9 0%, #1a7f9f 55%, #146a86 100%) !important;
		border: 2px solid #8fe4ff !important;
		box-shadow: inset 0 1px 0 rgba(196, 241, 255, 0.35) !important;
	}

	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .full-width .button:not(.disabled):hover .rectangle),
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .max-width .button:not(.disabled):hover .rectangle),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .button:not(.disabled):hover .rectangle) {
		background: linear-gradient(180deg, #1f8dae 0%, #1c86a7 55%, #157190 100%) !important;
		border-color: #c4f1ff !important;
	}
</style>
