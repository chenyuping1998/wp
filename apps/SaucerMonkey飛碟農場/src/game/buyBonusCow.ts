/**
 * The Buy Bonus plate (2026-10-17, plan S-B): the abducted cow clinging to the
 * BUY BONUS sign under the saucer's tractor beam, cut from the approved intro
 * art and posed frame by frame by design/build_saucer_buybonus.py.
 *
 * All of it rides the shared ButtonBuyBonus as it is — nothing in wp/packages
 * changes. The plate is uiTheme.sprites.buyBonus, the hover is the button's own
 * one-shot frame list (held on its last key), and BuyBonusCow.svelte re-points
 * those two sprite keys at other frames for the idle beat, the press and the
 * disabled state. The button still typesets its caption (BUY BONUS, PLAY
 * BONUS, DISABLE, every translation) on the sign, which is why the sign never
 * moves in any frame.
 */
import { setUiTheme, uiTheme } from 'components-ui-pixi';

import counts from './buyBonusCowFrames.json';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const seq = (name: 'idle' | 'hover' | 'press') =>
	Array.from({ length: counts[name] }, (_, i) => `gbBbCow${cap(name)}${i + 1}`);

export const BB_FRAMES = {
	rest: 'gbBbCowRest',
	off: 'gbBbCowOff',
	idle: seq('idle'),
	hover: seq('hover'),
	press: seq('press'),
};
export const BB_FRAME_MS = 1000 / counts.fps;

/** the sprite-map key the hover holds on (its last frame): the press plays here too */
export const BB_HOLD_KEY = 'bbHold';
const HOVER_KEYS = BB_FRAMES.hover.slice(0, -1).map((_, i) => `bbHover${i + 1}`);

type Sprites = typeof uiTheme.sprites;
/** re-point one sprite-map key; the button redraws on its own */
export const setBbSprite = (key: string, asset: string) => {
	(uiTheme.sprites as Record<string, string>)[key] = asset;
};

/** Called last in uiTheme.ts, after the skins: every skin gets the cow. */
export const applyBuyBonusCow = () =>
	setUiTheme({
		// setUiTheme replaces the map, so keep the skin's other plates
		sprites: {
			...uiTheme.sprites,
			buyBonus: BB_FRAMES.rest,
			...Object.fromEntries(HOVER_KEYS.map((k, i) => [k, BB_FRAMES.hover[i]])),
			[BB_HOLD_KEY]: BB_FRAMES.hover[BB_FRAMES.hover.length - 1],
		} as Sprites,
		buyBonusHoverFrames: [...HOVER_KEYS, BB_HOLD_KEY],
		buyBonusHoverSprite: BB_HOLD_KEY,
		buyBonusHoverFrameMs: BB_FRAME_MS,
		// the frames are whole pictures: drawn over the plate, not added to it
		buyBonusHoverSpriteTint: 0xffffff,
		buyBonusHoverSpriteBlend: 'normal',
		buyBonusHoverStyle: 'fill',
		buyBonusHoverRotate: 0,
		buyBonusHoverSpin: 0,
		buyBonusIdleGlow: false,
		buyBonusIdleSprite: undefined,
		// the picture fills its square edge to edge (the old SVG had a 32px rim)
		buyBonusPlateScale: 1.06,
		// off = the beam down (BuyBonusCow.svelte) plus a light dim, not a black-out
		buyBonusDisabledStyle: 'dim',
		buyBonusDisabledTint: 0xcfcfc8,
		buyBonusIdleTint: 0xffffff,
		// the caption on the sign: its centre is (0.576, 0.649) of the plate,
		// times the 1.06 plate scale for the button box, nudged down a little so
		// a two-line caption clears the sign's top edge. Bowlby One 13.4px keeps
		// BUY BONUS and PLAY BONUS on one line; longer translations wrap to two
		buyBonusLabelFill: 0x141a33,
		buyBonusLabelSizeRatio: 0.33,
		buyBonusLabelWrapWidth: 111,
		buyBonusLabelOffsetX: 0.081,
		buyBonusLabelOffsetY: 0.168,
	});
