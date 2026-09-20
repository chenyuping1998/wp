// THE BUY BONUS HOVER GLOW, ANIMATED.
//
// The shared button (components-ui-pixi/ButtonBuyBonus) draws a single hover
// sprite, looked up through uiTheme.sprites.buyBonusGlyph, and has no way to
// animate it. Rather than add one to a package every game shares, this game
// animates the lookup: the slot is pointed at the next of 16 pre-rendered frames
// (a light running round the scarab disc's rim, design/generate_ui_plates.mjs)
// on a timer.
//
// Cheap on purpose. uiTheme is a deep $state proxy, so writing one key re-runs
// only what reads that key — and the only reader is the hover sprite, which is
// not mounted unless the pointer is on the button. When nobody is hovering, this
// is a property write eight times a second and nothing else.
//
// A timer and not requestAnimationFrame: it has to keep its place when the tab
// is backgrounded (see the pixi-v8 note in this repo's memory), and at 12fps a
// timer is exactly as smooth as a frame callback would be.
//
// Only while the scarab art is the Buy Bonus: if the skin maps the slot to
// anything else (the brass skin, a later redesign), this leaves it alone.
import { uiTheme } from 'components-ui-pixi';

const FRAMES = 16;
// one lap of the rim in ~1.3s: quick enough to read as a light moving, slow
// enough not to strobe
const FRAME_MS = 80;
const PREFIX = 'gbUiBuyBonusScarabLit';

let frame = 0;
setInterval(() => {
	const sprites = uiTheme.sprites as Record<string, string>;
	if (!sprites.buyBonusGlyph?.startsWith(PREFIX)) return;
	frame = (frame + 1) % FRAMES;
	sprites.buyBonusGlyph = `${PREFIX}${String(frame).padStart(2, '0')}`;
}, FRAME_MS);
