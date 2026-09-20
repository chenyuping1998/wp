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

	/* ── CARD COPY OVER ARTWORK ───────────────────────────────────────────────
	   Every one of these cards has a full-bleed cover behind its text, and the
	   text is spread across the whole of it — the card renders about 355x250
	   above its button while the art is 360x520, so object-fit crops to a band
	   that the title, the description and the price all sit inside. There is no
	   part of the art the words are not on.

	   So each line carries its OWN dark ground: a tight contact shadow plus a
	   wider soft one. Two shadows rather than one because they do different jobs
	   — the 1px offset separates the glyph from whatever is immediately behind
	   it, the blurred one darkens the area around it so a bright detail cannot
	   sit in a counter.

	   This is the half of the fix that holds at any crop, any locale and any card
	   height. The scrim baked into the art (design/generate_mode_cards.mjs) is a
	   fixed gradient and cannot know where the words ended up; between them the
	   art stays visible and the copy stays readable. Raising the scrim instead
	   was tried and it turns the cards to mud — the arithmetic is in that file.
	*/
	:global(.bonus-card-wrap .title) {
		color: #ffd75e !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 10px rgba(0, 0, 0, 0.8) !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #fff7d6 !important;
		font-weight: 800 !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 12px rgba(0, 0, 0, 0.85),
			0 0 18px rgba(216, 163, 52, 0.35) !important;
	}

	/* Was rgba(255,247,214,0.72). The description is the longest line on the card
	   and the one a player actually has to read to tell the tiers apart, and it
	   was the faintest thing on it — a translucent cream on a lit gold column.
	   Opaque, and a shade warmer than the title so the two still separate. */
	:global(.bonus-card-wrap .description) {
		color: #ece4cf !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 9px rgba(0, 0, 0, 0.85) !important;
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

	   Same SHAPES as the bet bar's casing — Hacksaw's .ActionPanel, their
	   .Button table and their mobile CircleButton disc, at their radii and
	   weights — in this game's NAVY AND BRASS rather than their grey and green.

	   The colours are the ones in game/palette.ts, written out as hex because CSS
	   cannot import a TS module. Change one there, change it here. The rule is the
	   same too: navy and steel are the ship, brass is what you touch and what you
	   win. In a menu that means panels and idle chips are navy, and the one thing
	   that goes brass is the thing you have SELECTED or are pressing.

	     HULL        #122029   panel ground
	     PANEL       #172733   (unused here; the bar's readout plates)
	     DISC        #0b141b   chips, inputs, card ground
	     STEEL_EDGE  #5b7a8f   panel edge, idle chip ring
	     STEEL_DIM   #3e5a6e   input ring, scrollbar
	     STEEL_TEXT  #8fa6b8   secondary text, the close ×
	     BRASS_TEXT  #e8b545   selected, active, focus
	     CREAM       #ece4cf   headings and anything read
	   ═════════════════════════════════════════════════════ */

	/* the shade behind a modal: deep water, not neutral black — the game shows
	   through it, and a navy shade over a navy-and-steel scene keeps it the same
	   scene with the lights down */
	:global(html[data-ui-skin='platform'] .blur-layer) {
		background-color: rgba(4, 10, 15, 0.74) !important;
	}

	/* THE PANEL — their .ActionPanel at the radius they use, in hull navy.
	   A single faint brass line inside the steel edge: the trim a bridge console
	   has, and the one piece of decoration the panel carries. It is at 0.18 so it
	   reads as a finish, not as a second border. */
	:global(html[data-ui-skin='platform'] .ui-popup-standard-content-wrap) {
		background: linear-gradient(180deg, #152531 0%, #122029 60%, #0f1b23 100%) !important;
		border: 2px solid #5b7a8f !important;
		border-radius: 6px !important;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.7),
			inset 0 0 0 1px rgba(232, 181, 69, 0.18) !important;
	}

	/* Every button plate in a modal: the Auto Spin round chips, the settings
	   toggles, the bet-menu amounts. Their CircleButton disc, squared off. */
	/* THE CHIPS — every button plate in a modal: the Auto Spin counts, the
	   settings toggles, the bet amounts. The same disc as the bar's round
	   controls, with the same steel ring, so a control looks the same wherever
	   it is. */
	:global(html[data-ui-skin='platform'] .rectangle) {
		background: #0b141b !important;
		border: 1px solid #5b7a8f !important;
		border-radius: 4px !important;
		box-shadow: none !important;
	}

	/* Hover LIGHTENS THE STEEL rather than jumping to brass. Brass means
	   "selected" in this skin, and a colour that also meant "the pointer is near
	   it" would stop meaning anything — the player could no longer tell which
	   chip they had actually picked by glancing at the panel. */
	:global(html[data-ui-skin='platform'] .button:hover .rectangle) {
		border-color: #9fb6c7 !important;
		background: #0f1b24 !important;
		box-shadow: none !important;
	}

	:global(html[data-ui-skin='platform'] .button:active .rectangle) {
		border-color: #e8b545 !important;
		box-shadow: none !important;
		transform: scale(0.97);
	}

	:global(html[data-ui-skin='platform'] .close-button) {
		color: #8fa6b8 !important;
	}

	:global(html[data-ui-skin='platform'] .close-button:hover) {
		color: #ece4cf !important;
		text-shadow: none !important;
	}

	/* Headings in cream, for the reason the bar's values are: pure white on navy
	   glares, and these are the words that name every panel. */
	:global(html[data-ui-skin='platform'] .pop-up-wrap h1),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h2),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h3),
	:global(html[data-ui-skin='platform'] .pop-up-wrap h4) {
		color: #ece4cf !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select) {
		background: #0b141b !important;
		border: 1px solid #3e5a6e !important;
		border-radius: 4px !important;
		color: #ece4cf !important;
	}

	:global(html[data-ui-skin='platform'] .pop-up-wrap input:focus),
	:global(html[data-ui-skin='platform'] .pop-up-wrap select:focus) {
		border-color: #e8b545 !important;
		box-shadow: none !important;
	}

	/* A range input's thumb and track are the only native controls left in the
	   modals that would still render in the browser's own blue. accent-color
	   hands the browser this skin's brass for them in one line. */
	:global(html[data-ui-skin='platform'] .pop-up-wrap input) {
		accent-color: #e8b545;
	}

	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-track) {
		background: #0b141b;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb) {
		background: #3e5a6e;
	}
	:global(html[data-ui-skin='platform'] ::-webkit-scrollbar-thumb:hover) {
		background: #5b7a8f;
	}

	/* The card frame: 2px, because a near-black 1px edge between a dark card and
	   a dark panel is not visible — steel at rest, brass under the pointer. Brass here is not
	   the "selected" brass of the chips — nothing on a card is selected — but it
	   IS the "this is what you press" brass, which is the other half of the rule,
	   and these cards are the most expensive thing the player can press. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap) {
		background: #0b141b !important;
		border: 2px solid #5b7a8f !important;
		border-radius: 6px !important;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5) !important;
		transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
	}

	:global(html[data-ui-skin='platform'] .bonus-card-wrap:hover) {
		border-color: #e8b545 !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			0 0 16px rgba(232, 181, 69, 0.22) !important;
	}

	/* THE SHADOWS SURVIVE THE SKIN SWITCH, and that is deliberate.
	   This block used to set `text-shadow: none`, on the reasoning that the
	   platform palette is flat and unshadowed — which is true of text on the
	   platform's own grey panels and false here: these cards keep their artwork
	   in both skins, so in this skin the copy was sitting on a lit gold column
	   with nothing behind it at all. Flat is a palette, not a licence to put
	   white on gold. Colours stay platform-flat; the ground stays. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .title),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .price) {
		color: #ffffff !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 11px rgba(0, 0, 0, 0.85) !important;
	}

	/* #bfbfbf is the platform's secondary grey, and it is meant for text on a
	   #2a2a2a panel. On artwork it was the least legible thing in the modal. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .description) {
		color: #e6e6e6 !important;
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.95),
			0 0 9px rgba(0, 0, 0, 0.85) !important;
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
	/* THE BET MENU HAS NO .selected CLASS TO FIND, and that is why only the Auto
	   Spin panel lit up.

	   BetMenuAmountGrid marks the current stake one way only: it hands BaseIcon a
	   border of '2px white solid' for the chosen amount and '2px black solid' for
	   the rest, and BaseIcon writes that into the chip's own inline style as
	   --border-value. The .rectangle overrides in this file set `border` with
	   !important, so that one signal was erased and every stake rendered the same
	   — the selected bet was visible only as a hover-grey border, if at all.

	   The inline style is the only thing in the DOM that distinguishes the chosen
	   chip, so this keys on it: [style*='2px white solid'] matches the selected
	   amount and nothing else. AutoSpinsOptions passes the same value for ITS
	   selection, so the two panels now mark a choice identically — which is the
	   point. `.button` in front so it outranks the hover rule, which would
	   otherwise repaint a selected chip steel the moment the pointer crossed it. */
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

	/* THE COMMIT BUTTON IS BRASS.

	   Every button in these panels is the same BaseIcon plate, so the one that
	   ACTS — Start autoplay, the bet menu's confirm, BUY on a feature card, and
	   the CONFIRM on the buy dialog, the most expensive press in the game — was
	   drawn identically to the option chips above it: eight navy squares and a
	   ninth navy bar, told apart only by their words. A player had to read the
	   panel to find the way out of it.

	   Brass, the same deep brass as the spin button and for the same reason: the
	   label on it is white and SPIN_BRASS is the brass it reads on (4.06). This is
	   the rule in palette.ts doing its job — the thing you press to commit is the
	   warm thing on the panel, exactly as it is on the bar.

	   :not(.disabled), so a BUY the balance cannot cover stays a navy chip. A brass
	   button that does nothing when pressed would be the one misleading control in
	   the menu. */
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .full-width .button:not(.disabled) .rectangle),
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .max-width .button:not(.disabled) .rectangle),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .button:not(.disabled) .rectangle) {
		background: linear-gradient(180deg, #b8811d 0%, #a8741a 55%, #8f6216 100%) !important;
		border: 2px solid #e8b545 !important;
		box-shadow: inset 0 1px 0 rgba(255, 233, 168, 0.35) !important;
	}

	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .full-width .button:not(.disabled):hover .rectangle),
	:global(html[data-ui-skin='platform'] .ui-modal-button-wrap .max-width .button:not(.disabled):hover .rectangle),
	:global(html[data-ui-skin='platform'] .bonus-card-wrap .button:not(.disabled):hover .rectangle) {
		background: linear-gradient(180deg, #c68c22 0%, #b17b1c 55%, #976718 100%) !important;
		border-color: #ffd46b !important;
	}

	/* SELECTED IS BRASS: a brass ring and a faint brass wash inside it, so the
	   chosen chip is picked out by colour, by weight AND by fill — three signals,
	   which is what this block was restoring in the first place. */
	:global(html[data-ui-skin='platform'] .button .rectangle[style*='2px white solid']),
	:global(html[data-ui-skin='platform'] .button:has(.selected) .rectangle) {
		background: linear-gradient(180deg, #2a2210 0%, #1a160b 100%) !important;
		border: 2px solid #e8b545 !important;
		box-shadow: none !important;
	}

	/* the label inside the selected chip, in the same brass as its ring. The bet
	   grid's number has no class of its own, so it is found as the text sitting
	   beside the marked rectangle in the same button. */
	:global(html[data-ui-skin='platform'] .button:has(.rectangle[style*='2px white solid']) span),
	:global(html[data-ui-skin='platform'] .selected) {
		color: #e8b545 !important;
		text-shadow: none !important;
	}
</style>
