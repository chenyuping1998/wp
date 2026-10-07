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

	import { stateModal } from 'state-shared';

	import ModalPayTable from './ModalPayTable.svelte';
	import ModalGameRules from './ModalGameRules.svelte';

	type Props = {
		version: Snippet;
	};

	const props: Props = $props();

	// Which modal is open, stamped on <html> next to data-ui-skin.
	//
	// The buy screens take this game's own frost treatment while every other modal
	// keeps the platform grey (see the CSS below for why), and the shared Popup
	// gives the CSS nothing else to tell them apart by — the confirm dialog has no
	// class of its own.
	//
	// Guarded for the prerender pass, where there is no document.
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.documentElement.dataset.modal = stateModal.modal?.name ?? '';
	});
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
	   next to the rest of the game. An ice-edged slate plate instead — the same
	   two materials the board and the bet bar are built from. (Was a brass-edged
	   olive plate, from the jungle set.) */
	:global(.bonus-card-wrap) {
		background: linear-gradient(
			165deg,
			rgba(40, 50, 63, 0.95) 0%,
			rgba(17, 25, 36, 0.97) 100%
		) !important;
		border: 1px solid rgba(143, 217, 255, 0.32) !important;
		border-radius: 12px !important;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(216, 240, 255, 0.06) !important;
		transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
	}

	:global(.bonus-card-wrap:hover) {
		border-color: rgba(143, 217, 255, 0.65) !important;
		box-shadow: 0 0 22px rgba(143, 217, 255, 0.18) !important;
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

	/* Card copy. The TITLE goes ice — it names the mode, which is a label, not an
	   amount. The PRICE stays warm: palette.ts rule 2 puts every figure a player
	   could spend or win in gold, and the price is the most literal one in the
	   game. */
	:global(.bonus-card-wrap .title) {
		color: #8fd9ff !important;
		font-weight: 800 !important;
		letter-spacing: 0.04em !important;
	}

	:global(.bonus-card-wrap .price) {
		color: #fff7d6 !important;
		font-weight: 800 !important;
		text-shadow: 0 0 10px rgba(216, 163, 52, 0.45) !important;
	}

	:global(.bonus-card-wrap .description) {
		color: rgba(222, 238, 250, 0.72) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 5px;
	}
	:global(::-webkit-scrollbar-track) {
		background: rgba(10, 20, 32, 0.45);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, rgba(95, 168, 216, 0.55), rgba(30, 78, 115, 0.5));
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
	   PLATFORM SKIN — the DOM half.

	   game/uiTheme.ts stamps the resolved skin on <html> as data-ui-skin, because
	   CSS cannot read the localStorage override the skin switch is based on. The
	   bet bar is canvas and reads uiTheme directly; everything below the menu
	   button — pay table, rules, settings, bet menu, auto spin — is DOM and can
	   only be reached from here.

	   Without these rules the bar goes flat grey and these panels stay slate and
	   ice, which reads as two different products stacked on one screen. That is
	   the same failure Go Bananubis hit, and these are its rules.

	   Colours are Hacksaw's own: #2a2a2a panel, #0f0f0f edge, #14171a control
	   disc, #565e66 ring, #bfbfbf disabled text. The one value NOT theirs is
	   the accent: their #4ace4a green is replaced throughout by this game's light
	   blue (#8fd9ff), matching game/uiTheme.ts.

	   NOT PORTED from Go Bananubis: its buy-menu section, which re-themes the
	   bonus cards and the confirm dialog in Egyptian stone and gilt. That was
	   added there after a review comment asking the buy menu to match the game,
	   and its palette is basalt and bronze — wrong here. The buy cards stay
	   platform grey for now; if the same comment comes back, the equivalent for
	   this game is slate and ice, not gold.
	   ══════════════════════════════════════════════════════ */
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
		border-color: #8fd9ff !important;
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
		border-color: #8fd9ff !important;
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


	/* ── THE BUY CARDS ────────────────────────────────────────────────────────
	   The one place on the platform skin that is not platform grey.

	   Same exception and same reason as the Buy Bonus button itself (see
	   game/uiTheme.ts): the bar is furniture and belongs to the platform, but the
	   feature buy is this game's own screen and is the last thing a player sees
	   before spending 200x. The pictures inside these cards are slate plates with
	   an ice edge; a flat grey frame round them was the only seam left in the
	   modal.

	   Three parts, which are the three parts every plate in this game is built
	   from: a slate edge, an ice hairline just inside it, and a stud in each
	   corner. Go Bananubis does the same thing in basalt and bronze — this is that
	   idea in this game's palette, not a copy of its colours. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap) {
		background: #141c27 !important;
		border: 5px solid #33465c !important;
		border-radius: 3px !important;
		box-shadow: inset 0 0 0 1px rgba(143, 217, 255, 0.6) !important;
	}

	/* The studs. A pseudo-element rather than four spans because BonusCard is a
	   shared component and this game may not add nodes to it — and `.has-cover`
	   already gives the wrap `position: relative`, which is the only thing this
	   needs from it.

	   Inset 0, not negative: the wrap also carries `overflow: hidden`, which clips
	   at the padding box, so anything reaching out onto the border is thrown away.
	   Sitting them just inside the slate edge is where the board's own plates put
	   theirs anyway. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap.has-cover::after) {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(135deg, #8fb6d4, #3d5570),
			linear-gradient(135deg, #8fb6d4, #3d5570),
			linear-gradient(135deg, #8fb6d4, #3d5570),
			linear-gradient(135deg, #8fb6d4, #3d5570);
		background-repeat: no-repeat;
		background-size: 9px 9px;
		background-position:
			3px 3px,
			calc(100% - 3px) 3px,
			3px calc(100% - 3px),
			calc(100% - 3px) calc(100% - 3px);
	}

	/* Hover lifts the ice hairline rather than recolouring the frame. The accent
	   marks the one control the platform palette colours; spreading it onto a card
	   frame would make the whole modal look like it was all one button. */
	:global(html[data-ui-skin='platform'] .bonus-card-wrap:hover) {
		border-color: #3f5a75 !important;
		box-shadow: inset 0 0 0 1px rgba(216, 240, 255, 0.95) !important;
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
	/* WHICH CHIP IS SELECTED — read off the border the package passes in.

	   The `.selected` class above only ever existed on the Auto Spin COUNT grid.
	   The BET MENU's amount grid (BetMenuAmountGrid) never sets it, and nor do
	   the two auto-spin limit grids, so on those screens the chosen chip was
	   marked by nothing but the package's `2px white solid` border — which the
	   .rectangle override flattens along with every other border. The bet menu
	   showed 1.40 selected as a hair of lighter edge on a grid of identical chips.

	   All four grids pass the same string for the chosen chip and `2px black
	   solid` for the rest, and BaseIcon writes it into .rectangle's inline style
	   as --border-value. Nothing else in components-ui-html uses "white solid",
	   so the string IS the selected state, and one selector covers every grid.
	   `.selected` is kept alongside it as a second route in, not a replacement. */

	/* ice skin */
	:global(.button:has(.rectangle[style*='white solid']) .rectangle),
	:global(.button:has(.selected) .rectangle) {
		border-color: #8fd9ff !important;
		background: linear-gradient(
			160deg,
			rgba(47, 121, 173, 0.98) 0%,
			rgba(27, 90, 134, 0.98) 100%
		) !important;
		box-shadow:
			0 0 16px rgba(143, 217, 255, 0.5),
			inset 0 1px 0 rgba(216, 240, 255, 0.3) !important;
		animation: chip-lit 0.42s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* platform skin: the same LIT chip. It used to be a dark disc with a blue
	   hairline — correct, but it was the same dark disc as every other chip, and
	   a 2px line on a 40px chip is not what "I picked this one" looks like.
	   Filled with the accent instead, the way the spin button is: the one blue
	   solid on the panel is the one you chose. */
	:global(html[data-ui-skin='platform'] .button:has(.rectangle[style*='white solid']) .rectangle),
	:global(html[data-ui-skin='platform'] .button:has(.selected) .rectangle) {
		background: linear-gradient(180deg, #3a8cc4 0%, #1f6a9e 100%) !important;
		border: 2px solid #8fd9ff !important;
		box-shadow:
			0 0 14px rgba(143, 217, 255, 0.55),
			inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
	}

	/* THE PRESS. When a rule carrying an animation starts to match, the animation
	   runs from the top — so the chip that has just BECOME selected flashes once,
	   and the rest do nothing. It is the only way to key an effect to the click
	   without touching the shared package: the grid re-renders the inline style,
	   the selector newly matches, the flash plays. */
	@keyframes -global-chip-lit {
		0% {
			transform: scale(0.94);
			filter: brightness(1.9);
		}
		55% {
			transform: scale(1.04);
			filter: brightness(1.25);
		}
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.button:has(.rectangle[style*='white solid']) .rectangle),
		:global(.button:has(.selected) .rectangle) {
			animation: none;
		}
	}

	/* The label on a selected chip. White on the lit fill in both skins: the old
	   platform rule painted it ice blue, which was right on a dark chip and would
	   vanish on a blue one. The chip's own fill is the marker now. */
	:global(.button:has(.rectangle[style*='white solid']) span),
	:global(.button:has(.selected) .selected),
	:global(html[data-ui-skin='platform'] .button:has(.rectangle[style*='white solid']) span),
	:global(html[data-ui-skin='platform'] .selected) {
		color: #ffffff !important;
		font-weight: 700 !important;
		text-shadow: 0 1px 2px rgba(6, 20, 34, 0.6) !important;
	}

	/* ══════════════════════════════════════════════════════
	   THE BUY SCREENS — this game's own ice, on the platform skin too.

	   Everything else behind the menu button keeps the platform's flat grey,
	   because it is furniture: settings, rules, the pay table, the bet menu. The
	   BUY screens are not furniture. They are the last thing a player sees before
	   spending 200x, they are opened deliberately and rarely, and they are the one
	   place the game should look like itself.

	   Go Bananubis made the same exception after a review comment asking the buy
	   menu to be "consistent with the game's overall style"; its answer was basalt
	   and bronze. This is that answer in this game's materials — slate, ice and
	   the frost crystal already cut into the Buy Bonus button.

	   Scoped to [data-modal^='buyBonus'], which covers both the menu and its
	   confirm dialog, so nothing here can leak into the panels above.
	   ══════════════════════════════════════════════════════ */

	/* The shade behind the buy screens goes cold and deeper than the neutral one:
	   the modal is lifting off the board rather than sitting on it. */
	:global(html[data-modal^='buyBonus'] .blur-layer) {
		background-color: rgba(6, 14, 24, 0.8) !important;
	}

	/* The panel itself: a slab of slate with a lit ice edge, and a cold light
	   falling across the top of it — the same three parts every plate in this game
	   is built from, at panel scale. */
	:global(html[data-modal^='buyBonus'] .ui-popup-standard-content-wrap) {
		background:
			radial-gradient(120% 70% at 50% -10%, rgba(143, 217, 255, 0.13) 0%, transparent 60%),
			linear-gradient(168deg, #22303f 0%, #141c27 58%, #0d141d 100%) !important;
		border: 3px solid #33465c !important;
		border-radius: 6px !important;
		box-shadow:
			inset 0 0 0 1px rgba(143, 217, 255, 0.5),
			inset 0 1px 0 rgba(216, 240, 255, 0.18),
			0 18px 48px rgba(0, 0, 0, 0.75) !important;
	}

	/* NO RIME ALONG THE TOP EDGE.
	   There was a row of fine spikes here, drawn with two repeating-linear-
	   gradients under a mask, meant to read as frost creeping along the panel's
	   top edge. On screen it read as a BARCODE — a dense row of even tick marks
	   across the full width of the modal.

	   That is the second time the same idea has failed the same way: the reel
	   cells' rime looked like a ruler until its spike positions and lengths were
	   jittered and a third of them dropped. A CSS repeating-gradient cannot be
	   jittered, so there is no version of this that works here. Removed rather
	   than retried. The frost on this screen is the Buy Bonus plate's own crystal
	   and the card art, both of which are painted. */

	/* THE BET STEPPER GOES BELOW THE CARDS.
	   BonusContentWrapLarge renders betAmount first and the card list second, in a
	   column. Reading order should be "here is what you can buy, here is what it
	   will cost you" — the amount is the last decision, not the first.

	   column-reverse rather than an order: on the children, because the wrapper
	   holds exactly these two and flipping the container cannot get out of step
	   with a child that is added later.

	   :has(> .toggle-wrap) picks the buy MENU specifically. The confirm dialog is
	   built from the same wrapper class and has no stepper in it; without this it
	   would have its own contents reversed.
	   Exact [data-modal='buyBonus'], not ^=, so buyBonusConfirm is excluded too —
	   belt and braces, because the two guards protect against different mistakes. */
	:global(html[data-modal='buyBonus'] .ui-popup-standard-content-wrap:has(> .toggle-wrap)) {
		flex-direction: column-reverse !important;
	}

	/* Headings pick up the ice rather than staying platform white. */
	:global(html[data-modal^='buyBonus'] .pop-up-wrap h1),
	:global(html[data-modal^='buyBonus'] .pop-up-wrap h2),
	:global(html[data-modal^='buyBonus'] .pop-up-wrap h3),
	:global(html[data-modal^='buyBonus'] .pop-up-wrap h4) {
		color: #d8f0ff !important;
		text-shadow: 0 0 16px rgba(143, 217, 255, 0.3) !important;
	}

	/* Every button plate inside the buy screens — the bet stepper, the buy
	   buttons, the confirm dialog's yes/no. Slate with an ice hairline, matching
	   the cards they sit under. */
	:global(html[data-modal^='buyBonus'] .rectangle) {
		background: linear-gradient(170deg, #223142 0%, #131c27 100%) !important;
		border: 1px solid #3f5a75 !important;
		border-radius: 5px !important;
		box-shadow: inset 0 1px 0 rgba(216, 240, 255, 0.1) !important;
	}

	:global(html[data-modal^='buyBonus'] .button:hover .rectangle) {
		border-color: #8fd9ff !important;
		box-shadow:
			inset 0 1px 0 rgba(216, 240, 255, 0.16),
			0 0 16px rgba(143, 217, 255, 0.22) !important;
	}

	:global(html[data-modal^='buyBonus'] .button:active .rectangle) {
		border-color: #d8f0ff !important;
		transform: scale(0.97);
	}

	:global(html[data-modal^='buyBonus'] .close-button) {
		color: #9fc8e4 !important;
	}
	:global(html[data-modal^='buyBonus'] .close-button:hover) {
		color: #d8f0ff !important;
	}

	/* ── THE CARDS THEMSELVES ─────────────────────────────────────────────────
	   The platform-skin rules above already give every card its slate edge, ice
	   hairline and corner studs, and those still apply here — this block only adds
	   what the buy MENU needs and the pay table does not: a lit body, and a hover
	   worth pointing at.

	   Why a hover at all. This is the one screen where the player is choosing
	   between three things that cost different amounts, and the three cards are
	   otherwise identical furniture. Without a pointer state, nothing tells you
	   which one you are about to spend 500x on until you have already clicked it.

	   Three parts, in the order they are noticed:
	     the LIFT    4px of translateY, so the card comes off the slab
	     the GLOW    a cold halo, which is the only light in the modal that moves
	     the SHEEN   a single pass of light across the ice, ::before because the
	                 platform skin owns ::after for the studs

	   Exact [data-modal='buyBonus'] and not ^=, so the confirm dialog — which
	   renders the chosen card again, as a statement rather than a choice — keeps a
	   still card. A card that lifts under the pointer there would read as clickable
	   when it is not. */
	:global(html[data-modal='buyBonus'] .bonus-card-wrap) {
		position: relative;
		overflow: hidden;
		background:
			radial-gradient(140% 60% at 50% -12%, rgba(143, 217, 255, 0.16) 0%, transparent 62%),
			linear-gradient(168deg, #24323f 0%, #16202c 56%, #0e151f 100%) !important;
		transition:
			transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease !important;
	}

	:global(html[data-modal='buyBonus'] .bonus-card-wrap:hover) {
		transform: translateY(-4px);
		border-color: #4d6c8c !important;
		box-shadow:
			inset 0 0 0 1px rgba(216, 240, 255, 0.95),
			0 14px 30px rgba(0, 0, 0, 0.6),
			0 0 26px rgba(143, 217, 255, 0.22) !important;
	}

	/* THE SHEEN. Parked off the left edge and swept across on hover. `left` rather
	   than a transform because the band is skewed already and animating both on one
	   element makes the skew wobble; the wrap's overflow:hidden clips it at the
	   padding box either way.

	   THE TRANSITION LIVES ON :hover ONLY, AND THAT IS THE WHOLE POINT.
	   With it on the base rule, leaving a card animated `left` back from 115% to
	   -60% — dragging the band across that card in REVERSE. Moving the pointer
	   from one card to the next therefore lit two cards at once: the new one
	   sweeping forward and the old one sweeping back. It read as a bug in the
	   hover target, but every card was behaving correctly; the exit was simply
	   also an animation.

	   Declared here, the return has no transition and snaps to -60% instantly,
	   which is off-card and invisible. Only the card under the pointer ever
	   shows a moving band. */
	:global(html[data-modal='buyBonus'] .bonus-card-wrap::before) {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -60%;
		width: 45%;
		z-index: 2;
		pointer-events: none;
		transform: skewX(-18deg);
		background: linear-gradient(
			90deg,
			transparent,
			rgba(216, 240, 255, 0.16),
			rgba(216, 240, 255, 0.03),
			transparent
		);
	}

	:global(html[data-modal='buyBonus'] .bonus-card-wrap:hover::before) {
		left: 115%;
		transition: left 0.55s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* The art pushes in slowly rather than popping, so the motif reads as sitting
	   deeper in its frame instead of as a button state. */
	:global(html[data-modal='buyBonus'] .bonus-card-wrap .cover) {
		transition:
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			filter 0.3s ease;
	}
	:global(html[data-modal='buyBonus'] .bonus-card-wrap:hover .cover) {
		transform: scale(1.06);
		filter: saturate(1.08) brightness(1.06);
	}

	/* Copy sits above the sheen. Without this the band passes over the words and
	   they flicker as it goes. */
	:global(html[data-modal='buyBonus'] .bonus-card-wrap .info),
	:global(html[data-modal='buyBonus'] .bonus-card-wrap .button) {
		position: relative;
		z-index: 3;
	}

	/* Anyone who has asked not to be moved keeps the colour and loses the motion.
	   The sheen is motion and nothing else, so it goes entirely. */
	@media (prefers-reduced-motion: reduce) {
		:global(html[data-modal='buyBonus'] .bonus-card-wrap:hover),
		:global(html[data-modal='buyBonus'] .bonus-card-wrap:hover .cover) {
			transform: none;
		}
		:global(html[data-modal='buyBonus'] .bonus-card-wrap::before) {
			display: none;
		}
	}
</style>
