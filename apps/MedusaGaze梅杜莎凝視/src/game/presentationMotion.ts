import { clamp01, smooth } from './symbolMotion.ts';
import { MEDUSA_HIGHLIGHT_MS,beatPulse } from './ppMotion.ts';

/** Transient, cell-local accents. No camera motion or extra book delays. */
export const winningAccentPose = (ageMs: number) => {
	const onset = smooth(ageMs / 55), tail = 1 - smooth((ageMs - MEDUSA_HIGHLIGHT_MS) / 243);
	const beat=beatPulse(clamp01(ageMs/MEDUSA_HIGHLIGHT_MS)*1500);
	return {
		alpha: onset * tail * (.55+.45*Math.max(0,beat)),
		gather: 1 - (1 - clamp01(ageMs / 210)) ** 3,
		stone: smooth((ageMs - MEDUSA_HIGHLIGHT_MS) / 135),
		contact: Math.sin(Math.PI * clamp01((ageMs - 390) / 145)) ** 2,
	};
};
export const scoreArrivalScale = (ageMs: number) => {
	const t = clamp01((ageMs - 95) / 180);
	return 1 + .14 * Math.sin(Math.PI * t) * (1 - t);
};
/** Ease focus in and release it before the next cascade, without extra waits. */
export const winFocusPose = (ageMs:number) => {
	const finish=MEDUSA_HIGHLIGHT_MS+243;
	return {shade:smooth(ageMs/65)*(1-smooth((ageMs-finish+90)/90)),readout:1-smooth((ageMs-finish+75)/75)};
};
export const stoneChipPose = (index: number, progress: number, seed = 0) => {
	const t = clamp01((progress-.08)/.92), angle = index * 2.399963 + seed * .17;
	const reach = .34 + (index % 3) * .09;
	return {
		x: Math.cos(angle) * reach * t,
		y: Math.sin(angle) * reach * t - .28 * t + .85 * t * t,
		rotation: (index % 2 ? -1 : 1) * t * (2 + index * .4),
		size: .012 + (index % 3) * .005,
		alpha: smooth(t / .06) * (1 - smooth((t - .28) / .72)),
	};
};

/** The impact resolves into a few drifting sparks while the amount counts. */
export const impactMotePose = (index: number, ageSeconds: number) => {
	const t = clamp01(ageSeconds / .56), a = index * Math.PI / 3 + .23;
	const reach = 38 + 52 * (1 - (1 - t) ** 2);
	return {x: Math.cos(a)*reach, y: Math.sin(a)*reach*.67 - 12*t,
		alpha: Math.sin(Math.PI*t)**2 * (1-t), size: index%2 ? 1.1 : 1.7};
};

/** At most two accents per column: ground contact and the longest fall. */
export const selectLandingContacts = (moves: {from:number;to:number}[]) => {
	const falling = moves.filter(move=>move.to>=1&&move.to<=6&&move.to>move.from);
	if (!falling.length) return [];
	const bottom=falling.reduce((a,b)=>b.to>a.to?b:a);
	const longest=falling.reduce((a,b)=>b.to-b.from>a.to-a.from?b:a);
	return [bottom,...(longest.to===bottom.to?[]:[longest])].map(move=>({slot:move.to,distance:move.to-move.from}));
};
export const landingAccentPose = (progress:number, strength=1) => {
	const t=clamp01(progress),weight=Math.max(.65,Math.min(1.4,strength));
	return {spread:1-(1-t)**3,alpha:smooth(t/.08)*(1-t)**1.7,weight};
};
export const impactWavePose = (ageSeconds:number) => {
	const t=clamp01((ageSeconds-.055)/.3);
	return {spread:1-(1-t)**3,alpha:Math.sin(Math.PI*t)**2*(1-t)};
};
