import { Container, Graphics, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import { buildRig, skin } from './meshWin/meshRig';
import {
	GLASS,
	boilCanvas,
	boilRig,
	boilPose,
	boilBubbles,
	type ReagentVariant,
} from './reagentBoil';

/** One fixed vessel, moving liquid mesh, and bubbles clipped behind its glass. */
export const createReagentBoilLayer = (texture: Texture, variant: ReagentVariant) => {
	const [width, height] = boilCanvas(variant),
		view = new Container();
	view.pivot.set(width / 2, height / 2);
	const rig = buildRig(boilRig(variant)),
		positions = new Float32Array(rig.rest);
	const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
	const vessel = new Mesh({ geometry, texture }),
		bubbles = new Graphics(),
		mask = new Graphics();
	for (const points of GLASS[variant]) mask.poly(points.flat()).fill(0xffffff);
	view.addChild(vessel, bubbles, mask);
	bubbles.mask = mask;
	const step = (phase: number, intensity: number) => {
		skin(rig, boilPose(rig, phase, intensity), height, positions);
		geometry.getBuffer('aPosition').update();
		bubbles.clear();
		for (const b of boilBubbles(variant, phase, intensity)) {
			bubbles.circle(b.x, b.y, b.r).fill({ color: 0x175a28, alpha: b.alpha * 0.2 });
			bubbles.circle(b.x, b.y, b.r).stroke({ width: 0.65, color: 0xd5efa4, alpha: b.alpha * 0.8 });
			bubbles
				.circle(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.27)
				.fill({ color: 0xf2f6cb, alpha: b.alpha * 0.8 });
			if (b.surface)
				bubbles
					.ellipse(b.x, b.y, b.r * 1.8, b.r * 0.4)
					.stroke({ width: 0.45, color: 0xc5efa1, alpha: b.alpha * 0.35 });
		}
	};
	const destroy = () => {
		view.removeFromParent();
		view.destroy({ children: true });
		geometry.destroy();
	};
	return { view, step, destroy, width, height };
};
