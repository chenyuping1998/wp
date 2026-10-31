/** Scene coordinates stay fixed. Only clouds, night fire and statue pieces move. */
export const BACKGROUND_SIZE = { width: 1920, height: 1080 } as const;
export const CLOUD_PIXELS_PER_SECOND = BACKGROUND_SIZE.width / 5 / 60;
export const STATUE_SECONDS = 1.2;
export const STATUE_TO_MEDUSA_HEIGHT=1/5;
export const BACKGROUND_KEYS = ['mgBgBase', 'mgBgFree', 'mgBgCloud', 'mgBgTourist', 'mgBgIcecream', 'mgBgFlame', 'fxCrack1', 'fxCrack2', 'fxCrack3', 'fxGlow'] as const;
export const CLOUDS = [
	// Three staggered streams stay in the open left sky, rather than spending
	// several minutes hidden behind the board before wrapping around.
	{x:300,y:70,width:230,height:76,speed:.40,alpha:.67,flip:false,lane:'left'},
	{x:500,y:70,width:230,height:76,speed:.40,alpha:.67,flip:true,lane:'left'},
	{x:100,y:70,width:230,height:76,speed:.40,alpha:.67,flip:false,lane:'left'},
	{x:390,y:157,width:195,height:64,speed:.55,alpha:.63,flip:true,lane:'left'},
	{x:590,y:157,width:195,height:64,speed:.55,alpha:.63,flip:false,lane:'left'},
	{x:190,y:157,width:195,height:64,speed:.55,alpha:.63,flip:true,lane:'left'},
	{x:260,y:210,width:160,height:53,speed:.33,alpha:.57,flip:false,lane:'left'},
	{x:460,y:210,width:160,height:53,speed:.33,alpha:.57,flip:true,lane:'left'},
	{x:660,y:210,width:160,height:53,speed:.33,alpha:.57,flip:false,lane:'left'},
	{x:1390,y:62,width:350,height:86,speed:.70,alpha:.43,flip:true,lane:'sky'},
	{x:1740,y:88,width:250,height:68,speed:.85,alpha:.38,flip:false,lane:'sky'},
] as const;
export type CloudLane='left'|'sky';
export const BIRD_COUNT=9;
export const BRAZIERS = [{ x: 188, y: 712 }, { x: 1735, y: 712 }] as const;
export const STATUES = [
	{ key: 'mgBgTourist', x: 370, y: 1002, width: 60, height: 120, plinth: 0.895 },
	{ key: 'mgBgIcecream', x: 1650, y: 995, width: 60, height: 120, plinth: 0.89 },
] as const;
export const clamp = (t: number) => Math.max(0, Math.min(1, t));
export const ease = (t: number) => { const p = clamp(t); return p * p * (3 - 2 * p); };
/** Integral of an occasional gust: particles accelerate and keep travelling.
 * The next cycle begins at the same position and speed as the previous ends. */
export const gardenBreeze = (time: number, side = 0) => {
	const clock = Math.max(0,time) + side * 4.3, cycles = Math.floor(clock / 14), phase = clock - cycles * 14;
	const u = clamp((phase - 4) / 4), pulse = Math.sin(Math.PI * u) ** 2;
	return { distance: 48 * (cycles + u - Math.sin(2*Math.PI*u)/(2*Math.PI)), lift: pulse * 12, pulse };
};
// Shared irregular edges form a complete partition. All UVs retain the painted
// statue; these are fracture cuts, never replacement shapes drawn over the art.
const fractureRows = [
	[[0, 0], [0.32, 0], [0.67, 0], [1, 0]],
	[[0, 0.25], [0.35, 0.22], [0.69, 0.27], [1, 0.24]],
	[[0, 0.46], [0.29, 0.43], [0.65, 0.49], [1, 0.45]],
	[[0, 0.71], [0.39, 0.68], [0.70, 0.73], [1, 0.70]],
	[[0, 1], [0.33, 1], [0.68, 1], [1, 1]],
] as const;
export const STATUE_FRACTURE_PIECES = fractureRows.slice(0, -1).flatMap((row, y) =>
	row.slice(0, -1).map((p, x) => [p, row[x + 1], fractureRows[y + 1][x + 1], fractureRows[y + 1][x]]));
/** Fast break, readable held pose, then bottom-to-top assembly with one settle. */
const statuePieceAmount = (index: number, age: number) => {
	if (age <= 0.16 || age >= STATUE_SECONDS) return 0;
	const row = Math.floor(index / 3), column = index % 3;
	const launch = 0.16 + column * 0.008;
	const returnAt = 0.50 + (3 - row) * 0.023 + column * 0.007;
	const landAt = 0.87 + (3 - row) * 0.040 + column * 0.014;
	if (age < 0.39) return 1 - (1 - clamp((age - launch) / (0.39 - launch))) ** 3;
	if (age < returnAt) return 1;
	const t = clamp((age - returnAt) / (landAt - returnAt));
	// Back easing: a small overshoot makes the pieces click into their sockets.
	const q = t - 1, back = 1 + 2.25 * q ** 3 + 1.25 * q ** 2;
	return t >= 1 ? 0 : 1 - back;
};
export const cloudPosition = (time: number, start: number, _width: number, speed=1,lane:CloudLane='sky') => {
	const min=lane==='left'?100:-600,span=lane==='left'?600:BACKGROUND_SIZE.width+1200;
	return ((start+time*CLOUD_PIXELS_PER_SECOND*speed-min)%span+span)%span+min;
};
/** Fade in open sky before reaching the opaque foreground column masks. */
export const cloudVisibility = (x: number, width: number,lane:CloudLane='sky') => {
	const right=lane==='left'?610:1770,fade=lane==='left'?38:120;
	return ease((x-155-width/2)/fade)*ease((right-width/2-x)/fade);
};
/** Two small three-bird flocks use the left opening; three distant birds cross
 * the upper skyline. Endpoints fade before the columns or board can clip wings. */
export const birdPose=(index:number,time:number)=>{
	const left=index<6,group=Math.floor(index/3),member=index%3;
	const phase=(time*(left?.027:.018)+(left?.14+group*.5+member*.024:.12+member*.22))%1;
	const x=left?110+phase*580:-120+phase*2300;
	const y=(left?88+group*103:65)+member*17+Math.sin(phase*Math.PI*2+group)*8;
	const span=left?7.5-member*.6:6.5+member*.5;
	const stroke=(time+index*.37)%(5.6+member*.35);
	const flap=ease(stroke/.12)*(1-ease((stroke-1.5)/.25));
	const wing=span*(.16*(1-flap)+flap*(.12+.55*Math.sin(time*(8.4+member*.45)+index*.9)));
	return{x,y,span,wing,
		alpha:left?ease((x-155)/45)*ease((620-x)/50)*.62:Math.sin(Math.PI*phase)**2*.42};
};
export const statueEnvelope = (age: number) => {
	return { split: Math.max(...STATUE_FRACTURE_PIECES.map((_, index) => Math.abs(statuePieceAmount(index, age)))),
		crack: age >= 0.03 && age <= 0.16 ? ease((age - 0.03) / 0.035) : 0,
		crackStage: age < 0.065 ? 0 : age < 0.105 ? 1 : 2 };
};
export const statuePiecePose = (index: number, age: number, width: number, height: number) => {
	const split = statuePieceAmount(index, age), row = Math.floor(index / 3), column = index % 3;
	const dx = (column - 1) * 0.19 + (row % 2 ? -0.018 : 0.018);
	const dy = [-0.065, -0.012, 0.035, 0.055][row];
	return { x: dx * width * split,
		y: (dy * split + 0.024 * Math.max(split, 0) ** 2) * height,
		rotation: ((column - 1) * 0.19 + (row % 2 ? 0.075 : -0.075)) * split,
		depth: Math.abs(split) };
};
export const mixTint = (a: number, b: number, t: number) => {
	let result = 0;
	for (const shift of [16, 8, 0]) result |= Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) << shift;
	return result;
};
