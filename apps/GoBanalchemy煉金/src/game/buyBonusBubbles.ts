// THE BUY BONUS PLATE SIMMERS (2026-10-16).
//
// The shared button (components-ui-pixi ButtonBuyBonus) draws one plate sprite
// looked up through uiTheme.sprites.buyBonus and cannot animate it; a game's
// own look stays in the game, not the shared package. So, as GoBananubis does
// for its hover glow (buyBonusGlow.ts), this animates the LOOKUP: the slot is
// pointed at the next of the frames baked by design/make_bonus_bubbles.py —
// bubbles rising through the plate's teal glass — on a timer.
//
// uiTheme is a deep $state proxy: writing the one key re-runs only the sprites
// that read it (the plate, and the hover layer while the pointer is on it).
// A timer, not requestAnimationFrame, so it keeps its place in a hidden tab.
//
// Still while the reels turn (2026-10-16): the button is disabled then — the
// same rule ButtonBuyBonus uses, `!isIdle()` — and a plate that keeps
// bubbling reads as live. It freezes on its current frame and picks up from
// there when the round ends.
//
// Only while the slot holds one of these frames: a skin that maps it to other
// art is left alone.
import { uiTheme } from 'components-ui-pixi';
import { stateXstateDerived } from './stateXstate';

const FRAMES = 20;
// one loop in 2.4s: a slow simmer, not a boil — it is a button, not a win
const FRAME_MS = 120;
const PREFIX = 'gbUiBonusPlate';

let frame = 0;
setInterval(() => {
	const sprites = uiTheme.sprites as Record<string, string>;
	if (!sprites.buyBonus?.startsWith(PREFIX)) return;
	if (!stateXstateDerived.isIdle()) return;
	frame = (frame + 1) % FRAMES;
	sprites.buyBonus = `${PREFIX}${String(frame).padStart(2, '0')}`;
}, FRAME_MS);
