import { FillGradient } from 'pixi.js';

// neon number treatment for win/FS amounts: white-hot top → deep pink base,
// dark plum stroke, pink outer glow — deliberately distinct from the gold
// bitmap font used for labels
export const neonNumberStyle = (fontSize: number) => {
	const fill = new FillGradient(0, 0, 0, 1);
	fill.addColorStop(0, 0xffffff);
	fill.addColorStop(0.4, 0xffd1f1);
	fill.addColorStop(0.75, 0xff8ede);
	fill.addColorStop(1, 0xe45cb4);
	return {
		fontFamily: 'proxima-nova, Arial, sans-serif',
		fontWeight: '900' as const,
		fontSize,
		fill,
		stroke: 0x2a0a20,
		strokeThickness: fontSize * 0.06,
		dropShadow: true,
		dropShadowColor: 0xff8ede,
		dropShadowBlur: 22,
		dropShadowDistance: 0,
		letterSpacing: 2,
	};
};
