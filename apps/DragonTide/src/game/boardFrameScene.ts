import { Container, Graphics, NineSliceSprite, Sprite, type Texture } from 'pixi.js';
import geometry from './artGeometry.json';

type FrameGeometry = (typeof geometry.frame)['mg'];

/**
 * The painted board frames (art/gen-order-1109 frame-mg / frame-fg): jade bar, gold edges,
 * cloud (MG) or wave (FG) corners. Each is nine-sliced so its transparent hole lands
 * exactly on the 6x5 board: the corner ornaments keep their shape, only the plain bars
 * stretch (the delivered hole is 1146x857, the board's aspect is 6:5). The free-game frame
 * crossfades in with the palace hall.
 */
// frame bar width on screen: the side bar is ~66 px of the art, drawn at half size
const FRAME_SCALE = 0.5;
// the jade well behind the symbols, light enough for the pale v3 tiles to keep their edge
const WELL_FILL = 0xe6eee6;
const WELL_ALPHA = 0.9;

function frameSprite(texture: Texture, g: FrameGeometry, width: number, height: number) {
	const sprite = new NineSliceSprite({
		texture,
		leftWidth: g.slice.left,
		rightWidth: g.slice.right,
		topHeight: g.slice.top,
		bottomHeight: g.slice.bottom,
	});
	// the hole is drawn 2 art px inside the board so the gold inner edge overlaps it
	const holeW = width / FRAME_SCALE + 4, holeH = height / FRAME_SCALE + 4;
	// the bar widths round the hole, in art pixels
	const barL = g.hole.left, barR = g.width - g.hole.right, barT = g.hole.top, barB = g.height - g.hole.bottom;
	sprite.width = barL + holeW + barR;
	sprite.height = barT + holeH + barB;
	sprite.scale.set(FRAME_SCALE);
	sprite.position.set(-(barL + 2) * FRAME_SCALE, -(barT + 2) * FRAME_SCALE);
	return sprite;
}

export function createBoardFrameScene(textures: { mg: Texture; fg: Texture; logo: Texture }, width: number, height: number, portrait = false) {
	const root = new Container(); root.eventMode = 'none'; root.label = 'Board frame (jade, gen-order-1109)';
	const well = new Graphics().roundRect(-2, -2, width + 4, height + 4, 4).fill({ color: WELL_FILL, alpha: WELL_ALPHA });
	root.addChild(well);
	const mg = frameSprite(textures.mg, geometry.frame.mg, width, height);
	const fg = frameSprite(textures.fg, geometry.frame.fg, width, height);
	fg.alpha = 0;
	root.addChild(mg, fg);
	const logo = new Sprite(textures.logo); logo.anchor.set(0.5); root.addChild(logo);
	// the wordmark sits on the frame's top bar, its lower third over the beam
	const setPortrait = (isPortrait: boolean) => {
		logo.width = width * (isPortrait ? 0.4 : 0.5);
		logo.height = logo.width * 0.375;
		logo.position.set(isPortrait ? width * 0.27 : width / 2, -54);
	};
	setPortrait(portrait);
	let free = 0, target = 0;
	return {
		root, setPortrait,
		setFree(value: boolean, instant = false) { target = value ? 1 : 0; if (instant) { free = target; fg.alpha = free; mg.alpha = 1 - free; } },
		update(seconds: number) {
			if (free === target) return;
			free += Math.sign(target - free) * Math.min(Math.abs(target - free), seconds / 0.7);
			fg.alpha = free; mg.alpha = 1 - free;
		},
		destroy() { root.destroy({ children: true }); },
	};
}
