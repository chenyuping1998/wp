import { GAME_FONT, GAME_FONT_WEIGHT } from "./fonts";
import { setUiTheme } from "components-ui-pixi";
import { stateConfig } from "state-shared";

// Charcoal railway controls with aged brass and spectral teal accents.
setUiTheme({
  fontFamily: GAME_FONT,
  // Saira has a real semibold weight for compact numeric readouts.
  fontWeight: GAME_FONT_WEIGHT,

  buttonFill: 0x17312b,
  buttonFillLight: 0x86d4b8,
  buttonFillDisabled: 0x263634,
  // Teal distinguishes enabled controls from the charcoal idle state.
  buttonFillActive: 0x357f71,
  buttonBorder: 0xb89554,
  buttonIconFill: 0xd8f6ff,
  buttonIconStroke: 0x091713,

  betFill: 0x152e27,
  betBorder: 0x7be0bc,

  panelFill: 0x0b211c,
  panelBorder: 0xa88653,
  labelFill: 0x86d4b8,
  balanceLabelFill: 0xffd166,
  // win reads in mint, bet in a cooler cyan so the three readouts stay
  // tellable apart without leaving the palette
  winAccent: { border: 0x2ee6a8, label: 0x7dffd4 },
  betAccent: { border: 0x00a8c8, label: 0x9fe8ff },
  valueFill: 0xf5edda,
  valueStroke: 0x091713,
  valueShadow: 0x041511,

  // One slim strip along the foot, the arrangement players arrive already
  // knowing. The side-rail version it replaces maximised board size — the rails
  // ate horizontal space the board was not using — but that is exactly why it
  // read as unfamiliar, which is what certification meant by "does not conform
  // to expected UX standards".
  //
  // To go back: 'sideRail'. LayoutSideRail is untouched and still wired up, so
  // this one word is the whole revert. It can also be overridden at run time
  // without rebuilding — see the localStorage note in UIDefault.svelte.
  betBarLayout: "compactBottom",

  // Buy Bonus stays left of the board at its old size rather than joining the
  // strip: buying the feature is an occasional, expensive, deliberate action and
  // does not belong beside the control pressed every few seconds.
  buyBonusOnRail: false,

  // Larger than the first Deadwood pass so this reads as the major feature CTA,
  // not a decorative plaque lost in the scenery. It remains below the shared
  // 2.4 default and the verified 1280×720 layout keeps clear air between its
  // right edge and the reel frame.
  //
  // This trades directly against BOARD_SHRINK: raising one pushes the other
  // back, 1:1 through the arithmetic written out in stateGame.svelte.ts.
  buyBonusRailScale: 2,

  // The generated brass plate has a generous transparent square canvas. Draw
  // the plate itself larger than the control box so the two-line caption stays
  // comfortably inside the teal inset instead of touching its side walls.
  // The outer rail scale still owns positioning and the hit target.
  buyBonusPlateScale: 1.25,

  // gold on the indigo plate, matching every other caption in the game
  buyBonusLabelFill: 0xffd75e,
  // The brass crest occupies the top of the square PNG, so the writable black
  // inset sits below the texture's geometric centre. Move the two-line caption
  // into the inset's measured optical centre; horizontal centring is already
  // exact and stays untouched.
  buyBonusLabelOffsetY: 0.04,

  // Hover highlight on the plate's framed body only (measured from the PNG's
  // alpha: 96% wide, 48% tall, centred 1.8% below the texture centre because
  // the winged crest sits on top). Without these it lit the whole square
  // canvas, a box floating above and around the plate.
  buyBonusPlateInset: { width: 0.961, height: 0.479 },
  buyBonusPlateInsetOffsetY: 0.018,
  buyBonusHighlightPad: 0.015,
  buyBonusHighlightRadius: 0.13,

  // Portrait: at the shared ±470 the menu disc ran 9px off the left edge and
  // the 1.25× plate 28px off the right (measured at 375×812). 445 brings the
  // disc in to a 20px margin; the plate draws at 0.85 so it clears the edge
  // without closing on turbo (≈30px gap left).
  portraitSideButtonX: 445,
  portraitBuyBonusScale: 0.85,

  // the Bet panel opens the stake menu when tapped — mark it so players can
  // tell it apart from the static Balance/Win panels
  labelAffordance: true,

  // cursor-over feedback on the rail controls
  hoverHighlight: true,

  // No halo on the spin button. It breathed at idle and flared brighter the
  // moment Spin was pressed; Stake review marked the UI poor (5/10, 2026-09-23)
  // and the collaborator's platform skin — the one their passing games default
  // to — ships it off. The press itself is acknowledged by the icon spinning.
  spinButtonGlow: false,

  // Platform UX conventions, lifted from Hacksaw's shipped UI bundle. Worth
  // having precisely BECAUSE they are not one game's design: The Luxe 1.5.1 and
  // Densho 1.25.1 ship the same 55 element bindings, the same 24-key table, the
  // same 150/500/50000/100 constants — byte-identical function bodies. That is
  // the house convention two live titles share, and a player arriving from
  // either already has it in their hands.
  //
  // Nothing here is STYLED from Hacksaw. Their controls are DOM and ours are
  // pixi, so their rem values transfer to nothing; the layout stays exactly as
  // measured in stateGame.svelte.ts. What transfers is behaviour.
  //
  // To revert: delete this object. `null` is the default and means the previous
  // behaviour exactly — no hold-repeat, no cooldown, no idle nudge, no
  // shortcuts, panels left as they were. It can also be turned off on a build
  // that is already deployed, without rebuilding:
  //
  //   localStorage.setItem('platformUx', 'off')   previous behaviour
  //   localStorage.removeItem('platformUx')       back to this
  //
  // The numbers are Hacksaw's own, unchanged.
  platformUx: {
    betRepeatMs: 150,
    betToSpinCooldownMs: 500,
    idleReminderMs: 50_000,
    idlePulseMs: 2_000,
    shortcuts: true,
    keybindThrottleMs: 100,
    closePanelsOnSpin: true,
  },

  // framed plate art for the readouts and the Buy Bonus CTA (the other slots
  // keep the themed rounded rect, which suits the round buttons)
  sprites: { buyBonus: "dwBonusButton" },

  // drawn neon icons in place of the template's text/emoji button glyphs
  icons: {
    menu: "hmIconMenu",
    menuExit: "hmIconMenuExit",
    settings: "hmIconSettings",
    info: "hmIconInfo",
    payTable: "hmIconPayTable",
    soundOn: "hmIconSoundOn",
    soundOff: "hmIconSoundOff",
    autoSpin: "hmIconAutoSpin",
    // turbo deliberately omitted: UiButton draws it as a vector bolt so it can
    // be hollow when off and fill in when active — a static sprite can't toggle
  },
});

// ── Platform chrome (opt-out) ────────────────────────────────────────────────
//
// Everything above is Hot Miami's own drawn look: brass-edged plates, a heavy
// ring on every round control, a lit inner line along the strip. What follows
// replaces the CASING — not the game — with Hacksaw's platform chrome.
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
// Two things deliberately survive the swap: the drawn icon art and the game
// font. Hacksaw's glyphs are an icon font we do not have, and the fallback here
// is text/emoji — visibly worse than the icons already drawn for this game.
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'deadwood')   on a build already deployed
//   localStorage.removeItem('uiSkin')         back to this default
//   change DEFAULT_SKIN below to 'deadwood'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'deadwood' is byte-for-byte the
// look that shipped.
const DEFAULT_SKIN: "hacksaw" | "deadwood" = "deadwood";

const skin =
  (typeof localStorage !== "undefined" && localStorage.getItem("uiSkin")) ||
  DEFAULT_SKIN;

if (skin === "hacksaw") {
  setUiTheme({
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
    barHeight: 166,
    barFrameBottom: 46,
    spinScale: 1.12,

    // the strip: flat casing, their panel grey on their near-black edge
    barStyle: "flat",
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
    buttonFillLight: 0x4ace4a,
    buttonFillDisabled: 0x207820,
    buttonFillActive: 0x4ace4a,
    buttonBorder: 0x565e66,
    buttonBorderWidth: 2,
    buttonBorderWidthActive: 5,
    buttonIconFill: 0xffffff,
    buttonIconStroke: 0x0f0f0f,

    // the spin button takes their primary green — it is the one control the
    // platform palette actually colours
    betFill: 0x4ace4a,
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

    // the brass plate art has to go with the brass: a framed plate behind a
    // flat grey strip reads as two different bars stacked
    sprites: { buyBonus: "dwBonusButton" },

    // with the plate art gone the CTA falls back to its rounded rect, which was
    // black-and-gold to match the brass. Their green marks it as the one
    // coloured call to action, the same job --hg-btn-bg does in their table.
    buyBonusFill: 0x14171a,
    buyBonusBorder: 0x4ace4a,
    buyBonusBorderWidth: 4,
    buyBonusCornerRadius: 8,

    // their .CircleButton has :hover and :active states and a 125ms transition;
    // it does not have a halo
    spinButtonGlow: false,
    hoverHighlight: true,
    pressFeedback: true,
  });
}

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. Stake review asked for all three
// by name (2026-09-06). The controls that honour it live in two packages, so
// the policy sits in state-shared rather than in uiTheme; see stateConfig.
stateConfig.explainInsufficientBalance = true;
