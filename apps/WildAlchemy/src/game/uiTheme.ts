import {
	BAR_LABEL_FONT,
	BAR_LABEL_FONT_WEIGHT,
	BAR_VALUE_FONT,
	BAR_VALUE_FONT_WEIGHT,
	GAME_FONT,
	GAME_FONT_WEIGHT,
} from './fonts';
import { stateConfig, stateUrlDerived } from 'state-shared';
import {
	BONE,
	GOLD,
	GOLD_DARK,
	GOLD_LIGHT,
	GUNMETAL,
	GUNMETAL_DARK,
	INK,
	INK_DEEP,
	WINE,
} from './palette';
import { setUiTheme } from 'components-ui-pixi';
import MummyBar from '../components/ui/MummyBar.svelte';
import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
import barMessages from 'components-ui-pixi/src/i18n/messagesMap';
import { WILD_ALCHEMY_BET_MODE_META } from './betModeMeta';

// Wild Alchemy's bet bar, in the manuscript palette (game/palette.ts, ART_REQUEST
// §0): a sepia strip framed in verdigris and cream (ui-ticker-b), ochre plates
// for the round controls, the illuminated roundel for SPIN, the parchment Buy
// plate. Plate art: design/build_hud_assets.py → assets/sprites/wildAlchemyHud.
//
// Hard Time's steel plates, brass icons and gunmetal colours were here until
// 2026-11-10; none of them is referenced any more.
//
// The three readouts on the sepia strip, told apart by border and brightness
// inside the palette rather than by three hues:
//
//   BALANCE  vermilion border, bone label   the quietest
//   WIN      ochre border, ochre-light      the warm loud one — it is the money
//   BET      verdigris border, ochre label  the cool one, and the only one you
//                                           can press (labelAffordance chevron)
setUiTheme({
	// Words on the bar in the title face, numbers in the display face — fonts.ts.
	fontFamily: BAR_LABEL_FONT,
	fontWeight: BAR_LABEL_FONT_WEIGHT,
	valueFontFamily: BAR_VALUE_FONT,
	valueFontWeight: BAR_VALUE_FONT_WEIGHT,
	labelFontWeight: BAR_LABEL_FONT_WEIGHT,

	// Vector fallbacks under the plate art (and the disabled / ON states, which
	// the shared button draws over a plate as tint and ring).
	buttonFill: INK,
	buttonFillLight: GOLD_DARK,
	// deep verdigris, not a grey: a dead control goes cold while the strip stays
	// warm, which reads as unavailable rather than as a rendering fault
	buttonFillDisabled: GUNMETAL_DARK,
	// vermilion ring for an ON toggle (turbo / autoplay) over the ochre plate
	buttonFillActive: WINE,
	buttonBorder: WINE,
	buttonIconFill: BONE,
	buttonIconStroke: INK,

	betFill: INK,
	betBorder: GOLD,

	panelFill: INK,
	panelBorder: WINE,
	labelFill: GOLD,
	balanceLabelFill: BONE,
	winAccent: { border: GOLD, label: GOLD_LIGHT },
	betAccent: { border: GUNMETAL, label: GOLD },
	valueFill: BONE,
	valueStroke: INK_DEEP,
	valueShadow: INK_DEEP,

	// The strip: ui-ticker-b (1077×182 runtime), three-sliced so the verdigris
	// finials keep their shape and only the sepia field stretches. The finial
	// and its cream/ochre seam end at x ≈ 116 of the runtime file; 120 keeps the
	// whole seam on the cap side. barStyle/barFill/barAlpha are the fallback if
	// the sprite key is ever removed.
	barStyle: 'framed',
	barFill: INK_DEEP,
	barAlpha: 0.96,
	barSpriteSlice: 120,

	// Geometry: the board's room is derived from barHeight (stateGame landscapeFit
	// keeps the whole housing above barHeight std px). 166 was the old bar's
	// strip; bar v3 at 16:9 then had to shrink to 0.61x to clear the board, far
	// smaller than the approved sibling's (Dragon Tide, house rule D1). 180 lets
	// it stand at ~0.9x while the board gives up as little as it can.
	barHeight: 180,
	barFrameBottom: 46,
	spinScale: 1.14,
	betBarLayout: 'compactBottom',
	buyBonusOnRail: false,
	buyBonusRailScale: 1.35,
	buyBonusYFraction: 0.7,

	// sepia caption on the parchment Buy plate
	buyBonusLabelFill: INK,
	// White = no tint. NOT cosmetic: pixi-svelte's propsSyncEffect skips props
	// that are undefined, so the disabled tint (0x767670 / 0x8a8a8a) set while
	// the reels run was never taken off again and the plate stayed grey at
	// idle. Passing an explicit tint whenever the plate is enabled resets it.
	// (The round rail buttons have the same stuck tint and no theme hook — see
	// HANDOFF; the fix is one line in the shared UiSprite/UiButton.)
	buyBonusIdleTint: 0xffffff,

	labelAffordance: true,
	stepperLayout: 'flank',
	stepButtonScale: 0.44,

	portraitSideButtonX: 440,
	portraitMenuScale: 0.72,
	portraitStepScale: 0.55,
	portraitStepX: 170,
	portraitSideClusterX: 290,

	buyBonusHideInFreeSpins: true,

	// Hover lights the control's OWN plate (house rule D4 — never the white
	// 反灰 box): the round plate is drawn again additive in a warm ochre, and
	// the Buy plate draws its own lit copy (waUiBuyLit, a 40%-value copy of the
	// plate) additive in the same warm ochre.
	//
	// The lit copy used to be added at full strength (tint white): parchment
	// 240 + 96 clipped to white, and because pixi-svelte appends the hover
	// sprite AFTER the caption (it mounts on hover), the caption's sepia ink got
	// the same +96 and went grey — the plate read as disabled (QA 11-11 B9).
	// Through this tint (lit copy × 0x8c6630 ≈ +45/+33/+12 RGB on the field,
	// +53/+36/+11 on the ink) the plate warms and brightens like the round
	// plates do, nothing clips to white, and the caption stays dark sepia.
	hoverHighlight: true,
	hoverPlateLight: 0x5c4018,
	buyBonusHoverSprite: 'buyBonusGlyph',
	buyBonusHoverSpriteTint: 0x8c6630,

	spinButtonGlow: false,

	// The spin roundel's well (repainted sepia so the white spin mark reads)
	// is 0.57 of the plate; the mark's outer edge is radius × 1.18, so 0.22
	// puts it at ~0.52 — inside the well with a margin.
	betIconScale: 0.22,

	// The round plate (button_disc.png, the ochre pill's two ends joined) has
	// a thin ink rim and a vermilion lip at the bottom; the icons are padded
	// to 0.82 of their square, so 0.62 lands their ink at ~0.51 of the plate.
	buttonIconScale: 0.62,
	railButtonScale: 1.15,
	turboButtonScale: 1.15,
	// the disc is a soft squircle, not a circle: radius ≈ 0.42 of its width,
	// so the ON ring / press shadow / hover lift follow its outline
	buttonCornerRadius: 0.42,
	iconScales: {
		autoSpin: 0.62,
	},

	// Platform UX conventions (Hacksaw's shared UI bundle constants) — behaviour
	// only, nothing styled from it. localStorage 'platformUx' = 'off' reverts.
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 50_000,
		idlePulseMs: 2_000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	pressFeedback: true,

	sprites: {
		buyBonus: 'waUiBuy',
		// the lit copy, drawn additive on hover — see buyBonusHoverSprite
		buyBonusGlyph: 'waUiBuyLit',
		button: 'waUiButton',
		bet: 'waUiSpin',
		// the compact bottom bar passes its readouts `tiled={false}`, so this
		// only matters if a layout ever tiles them; same art as the strip
		base_ticker: 'waUiBar',
		bar: 'waUiBar',
	},

	// drawn icons (cream with sepia outline) in place of text/emoji glyphs
	icons: {
		menu: 'waIconMenu',
		menuExit: 'waIconMenuExit',
		settings: 'waIconSettings',
		info: 'waIconInfo',
		payTable: 'waIconPayTable',
		soundOn: 'waIconSoundOn',
		soundOff: 'waIconSoundOff',
		autoSpin: 'waIconAutoSpin',
		increase: 'waIconIncrease',
		decrease: 'waIconDecrease',
		// turbo stays UiButton's vector bolt (hollow off / filled on) — a static
		// sprite cannot show the toggle; it takes buttonIconFill/Stroke above
	},
});

// ── Platform chrome (opt-IN) ─────────────────────────────────────────────────
//
// Everything above is Capo Nostra's own drawn look: gold-edged plates on warm
// near-black, a heavy ring on every round control, a lit inner line and engraved
// grooves along the strip, Cinzel captions over Orbitron figures. What follows
// replaces the CASING — not the game — with Hacksaw's neutral platform chrome.
//
// Why this is worth having as a second skin rather than an opinion: their UI
// files are shared across titles. The Luxe 1.5.1 and Densho 1.25.1 differ by one
// DOM node and five CSS rules, and their 103 theme variables are value-identical.
// So these numbers are not one game's styling — they are the neutral casing a
// player has already seen on other titles, which is exactly what a casing is
// supposed to be. The report that came with the teardown says it in its own
// first section: "UI 層沒有任何遊戲專屬配色或版面".
//
// The values, straight from ui-layout.md §3.1 and §4.1:
//
//   .ActionPanel      background #2a2a2a, border 3px solid #0f0f0f, radius 3px
//   .divider--vertical opacity .15
//   .Button           radius 4px, border 1px, --hg-btn-bg #4ace4a, color #fff,
//                     border-color #343a40, disabled #207820 / #bfbfbf
//   CircleButton      mobile: background rgba(33,37,41,.5), border-width 0
//
// One thing deliberately survives the swap: the drawn icon art. Hacksaw's glyphs
// are an icon font we do not have, and the fallback here is text/emoji — visibly
// worse than the icons already drawn for this game. The FONT no longer survives
// it: this block now names its own neutral stack, because the game font above is
// Cinzel and Roman inscriptional capitals are the loudest possible contradiction
// of a casing whose whole job is to be game-agnostic.
//
// ⚠ THE DEFAULT CHANGED ON 2026-09-09, from 'hacksaw' to 'capo'.
//
// It was 'hacksaw', which meant the block above — the whole themed bar — was
// dead code in every build that ever shipped or was reviewed. The player saw a
// flat #2a2a2a grey strip under a board that is entirely warm brown and gold.
// The reasoning for 'hacksaw' (a neutral casing is a casing a player already
// knows) is still sound and is why this block is kept and kept working, but a
// neutral casing is not the same thing as a MISMATCHED one, and a cold grey bar
// beneath a gilt Art Deco board is the second.
//
// TO GO BACK TO THE NEUTRAL PLATFORM CHROME, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'hacksaw')   on a build already deployed
//   localStorage.removeItem('uiSkin')           back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'hacksaw'      one word, in the build
//
// Nothing in the block above is deleted by the swap — it is one setUiTheme call
// overwriting keys of another — so 'hacksaw' is byte-for-byte the look that
// shipped before this change, with the single exception of the geometry keys
// (barHeight / barFrameBottom / spinScale), which the block above now also sets
// to the same values so the two skins differ in look and never in layout.

// Review (Hot Miami, 2026-09-04 / -06) required an insufficient-balance MESSAGE
// on EVERY route into a bet — Bet button, spacebar AND Autoplay — not disabled
// controls. It came back a second time there because only two of the three
// routes were fixed; Autoplay's two buttons were `disabled` outright, so there
// was no control left to press and nothing to show a message on.
//
// The policy lives in state-shared rather than here because components-ui-html
// (the Autoplay panel's start button) cannot import components-ui-pixi's
// uiTheme. Off by default, so a game that never opted in keeps the disabled
// controls it was built with.
//
// Capo Nostra never opted in, so Hard Time inherited the gap through the
// scaffold copy — the reskin would have shipped the exact finding review has
// already raised twice on this codebase.
stateConfig.explainInsufficientBalance = true;

// ── BET BAR V3 (2026-11-11, Stone: 「UI換成新版」; house-rules D2 「以後 UI 都先
// 預設那樣」) ─────────────────────────────────────────────────────────────────
//
// The connected floating console (components/ui/MummyBar.svelte, ported from
// Dragon Tide's copy, which carries the template fixes listed in D2) in this
// game's manuscript dress. uiTheme.customLayout replaces the shared layout in
// every orientation; customLayoutOwnsReplay keeps it for a replay the game has
// not taken over (this game takes its replays over, ResumeBet.svelte, so the
// bar's replay-again button is what a replay shows).
//
// barHeight / betBarLayout above are NOT the bar's size any more: they still
// size the BOARD (game/stateGame.svelte.ts boardLayout) and the side figure's
// floor (CastAlchemy.svelte), and both stay exactly where they were — the v3
// bar is fitted into the room those leave (ui/mummyBarGeometry.ts barGroup).
// Do not change them to move the bar.
//
// To go back to the old strip, delete this call.
setUiTheme({
	customLayout: MummyBar,
	customLayoutOwnsReplay: true,
});

// ── Buy plate caption, fitted per language (QA 11-11 B8) ─────────────────────
//
// The shared button word-wraps its caption at buyBonusLabelWrapWidth but never
// breaks a word, and a script written without spaces is one "word": Japanese
// ボーナス購入 ran off both sides of the parchment field. So the caption's size
// is fitted here, per locale, against the plate's own field: the widest
// unbreakable unit must fit the wrap width and the wrapped block's ink must fit
// the field's height (Hangul / Devanagari touched the frame at English size). Measured with the bar's own face; refitted once the
// web fonts are in (the first measure may run on the fallback face).
const BUY_LABEL_RATIO = 0.68; // the shared default, kept for English
const BUY_LABEL_WRAP = 116; // the shared default wrap width (base units)
/** buy_plate.png's parchment field: rows 204–435 of 640 → 54 of the 150 box */
const BUY_FIELD_H = (231 / 640) * 150 * 0.92;
/** ink height of one line, in em: caps ~0.72; scripts with tall marks (Hangul,
 *  Devanagari's headline + matras, Arabic, CJK, Vietnamese stacked accents) ~1 */
const inkEm = (lang: string) => (['ar', 'hi', 'ja', 'ko', 'vi', 'zh'].includes(lang) ? 1 : 0.72);

const buyCaptions = (): string[] => {
	const lang = stateUrlDerived.lang();
	const table = (barMessages as Record<string, Record<string, string>>)[lang] ?? {};
	const buy = stateUrlDerived.social() ? 'PLAY BONUS' : (table['BUY BONUS'] ?? 'BUY BONUS');
	// DISABLE only ever shows for an 'activate' mode (an ante); this game has none
	const hasActivate = Object.values(WILD_ALCHEMY_BET_MODE_META).some((m) => m.type === 'activate');
	return hasActivate ? [buy, table['DISABLE'] ?? 'DISABLE'] : [buy];
};

const buyLabelRatio = (): number => {
	if (typeof document === 'undefined') return BUY_LABEL_RATIO;
	const ctx = document.createElement('canvas').getContext('2d');
	if (!ctx) return BUY_LABEL_RATIO;
	const fits = (ratio: number) => {
		const size = UI_BASE_FONT_SIZE * ratio;
		ctx.font = `${BAR_LABEL_FONT_WEIGHT} ${size}px ${BAR_LABEL_FONT}`;
		const lineHeight = UI_BASE_FONT_SIZE * (ratio + 0.04);
		const ink = size * inkEm(stateUrlDerived.lang());
		return buyCaptions().every((caption) => {
			const words = caption.split(/\s+/).filter(Boolean);
			const space = ctx.measureText(' ').width;
			let lines = 1;
			let line = 0;
			for (const word of words) {
				const w = ctx.measureText(word).width;
				if (w > BUY_LABEL_WRAP * 0.96) return false;
				if (line > 0 && line + space + w > BUY_LABEL_WRAP) {
					lines += 1;
					line = w;
				} else {
					line += (line > 0 ? space : 0) + w;
				}
			}
			// from the first line's cap top to the last line's baseline
			return (lines - 1) * lineHeight + ink <= BUY_FIELD_H;
		});
	};
	let ratio = BUY_LABEL_RATIO;
	while (ratio > 0.3 && !fits(ratio)) ratio -= 0.02;
	return ratio;
};

/**
 * Called from Game.svelte while it initialises, not at module load: the URL
 * (and so the language and social mode) is only readable through SvelteKit's
 * page state once a component is rendering — at module load lang() fell back
 * to 'en' and Japanese kept the English size.
 */
export const fitBuyBonusLabel = () => {
	setUiTheme({ buyBonusLabelSizeRatio: buyLabelRatio() });
	if (typeof document !== 'undefined' && document.fonts) {
		document.fonts.ready.then(() => setUiTheme({ buyBonusLabelSizeRatio: buyLabelRatio() }));
	}
};

const DEFAULT_SKIN: 'hacksaw' | 'capo' = 'capo';

const skin =
	(typeof localStorage !== 'undefined' && localStorage.getItem('uiSkin')) || DEFAULT_SKIN;

if (skin === 'hacksaw') {
	setUiTheme({
		// ── type ────────────────────────────────────────────────────────────────
		//
		// Back to the neutral single face for the whole strip. The skin above sets
		// three type keys the platform chrome must undo, or reverting leaves the
		// grey bar lettered in Roman inscriptional capitals — half-applied, which
		// is the one outcome a revert path exists to prevent.
		//
		// null on the two value keys is the shared package's own default and means
		// "use fontFamily", i.e. exactly what this block rendered before the keys
		// existed.
		fontFamily: GAME_FONT,
		fontWeight: GAME_FONT_WEIGHT,
		valueFontFamily: null,
		valueFontWeight: null,
		labelFontWeight: null,

		// ── geometry, from ui-appearance.html §1 (measured at 1280x720) ─────────
		//
		// Their bar is not a band along the bottom edge; it is a slim panel LAID
		// ON the screen with clear space under it, and one control that breaks
		// out of it. As fractions of screen height, on our 1080 standard box:
		//
		//   wrapper      110.4/720 = 15.3%  ->  barHeight 166
		//   clear below   30.4/720 =  4.2%  ->  barFrameBottom 46
		//     (leaves the panel itself 120 tall = 11.1%, against their 9.7%)
		//   spin button  112/720   = 15.6%  ->  168 across = spinScale 1.12
		//
		// The spin button is the point. Theirs is 1.60x the panel's height and
		// stands 21px proud of its top edge — their own report calls it the only
		// element that breaks the strip and says the visual centre of gravity
		// rests on it. Ours was 0.91x the frame: the same size as everything else
		// and therefore not the primary action at all.
		//
		// Ours is CENTRED on the frame, so it overhangs equally top and bottom
		// (24 each way) rather than their asymmetric 21 up / flush down. Doing it
		// their way would need the button to hang below the canvas floor.
		barHeight: 180,
		barFrameBottom: 46,
		// Kept in sync with the base skin above (1.14) — these two blocks must
		// share identical geometry so switching skins changes the LOOK only.
		spinScale: 1.14,

		// the strip: flat casing, their panel grey on their near-black edge
		barStyle: 'flat',
		barFill: 0x2a2a2a,
		barAlpha: 1,
		panelBorder: 0x0f0f0f,
		panelFill: 0x2a2a2a,

		// round controls: a dark translucent disc with no ring at all, which is
		// what `--hg-btn-border-width: 0` gives their mobile CircleButtons. The ring
		// comes back only to mark a toggle that is ON.
		// Their mobile CircleButtons float on the game art, where a flat dark disc
		// separates itself. On a grey strip it does not: 0x212529 against a
		// 0x2a2a2a bar is a 9-level difference and the control disappears. Darker
		// disc, and the 1px `.Button` border comes back (at 2, since one unit here
		// is about a third of a CSS pixel at this bar's scale).
		buttonFill: 0x14171a,
		// Hacksaw's primary green (0x4ace4a) is gone from every control below.
		//
		// The teardown notes above are still right that their bar colours exactly
		// one thing — but a green CTA sitting under a board that is entirely warm
		// brown and gold reads as another product's widget parked on this game.
		// The hierarchy it was carrying is kept, moved from hue to VALUE: the spin
		// button is the brightest object on the strip, the toggles go one step
		// down when ON, and everything else stays dark. That survives a
		// colour-blind player and a washed-out phone screen, which a green/grey
		// distinction does not.
		buttonFillLight: 0x8e9499,
		buttonFillDisabled: 0x3a3a3a,
		buttonFillActive: 0x6b7278,
		buttonBorder: 0x565e66,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: 0x0f0f0f,

		// The spin button: a mid grey, not the near-white this first became.
		// #E6E6E6 on a #2a2a2a strip is a 12:1 jump and the button glared — it
		// stopped reading as a control and started reading as a light source.
		// #8E9499 is still the brightest object on the bar (the icons on it are
		// pure white) with about half that contrast against the strip.
		betFill: 0x8e9499,
		betBorder: 0x343a40,

		// readouts: their disabled grey for labels, plain white for values. No
		// per-metric accent colours; the platform bar does not tint its readouts.
		labelFill: 0xbfbfbf,
		balanceLabelFill: 0xbfbfbf,
		winAccent: { border: 0x343a40, label: 0xbfbfbf },
		betAccent: { border: 0x343a40, label: 0xbfbfbf },
		valueFill: 0xffffff,
		valueStroke: 0x0f0f0f,
		valueShadow: 0x000000,
		buyBonusLabelFill: 0xffffff,

		// The neutral casing keeps the game's own Buy plate (waUiBuy, parchment)
		// and its lit hover copy; base_ticker is left out — a framed plate
		// behind a flat grey strip reads as two different bars stacked.
		sprites: {
			buyBonus: 'waUiBuy',
			buyBonusGlyph: 'waUiBuyLit',
		},

		// with the plate art gone the CTA falls back to its rounded rect. A light
		// border marks it as a call to action the same way the spin button does —
		// by being brighter than the strip, not by being a different colour.
		buyBonusFill: 0x14171a,
		buyBonusBorder: 0x7d848a,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		spinButtonGlow: false,
		hoverHighlight: true,
		pressFeedback: true,
	});
}
