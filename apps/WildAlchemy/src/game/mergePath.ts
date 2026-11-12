/**
 * How a wide reel is built up during the spin (SPEC §2.2).
 *
 * The math only decides the final blocks (`reveal.bars`). The reference client
 * animates each block of width > 1 as a MERGE of its reels: a binary tree over
 * the block's columns is drawn with a seeded generator (every node of size n is
 * split into k and n-k with k uniform in [1, n)), and at every step all nodes
 * whose children are both leaves merge at once. Only merges of three or more
 * columns light the glow frame; a two-column merge happens unseen, which is why
 * frames look like they start at three. The seed is the previous round's board,
 * so a replayed round always merges the same way.
 *
 * `planMerge` turns the steps into a schedule for the presentation: when each
 * frame lights (reelMergeShowWait, then reelMergeInterval per further framed
 * step), when the wide reel finally stops, and how many extra cells of travel
 * each reel in the block needs so the whole block lands together, after the
 * singles to its left have stopped one by one.
 */
import type { RevealBar } from './typesBookEvent';
import { REF_TIMING } from './refTiming';

type Node = { size: number; merged: boolean; left?: Node; right?: Node };

export type Merge = { tree: number; cols: [start: number, width: number]; size: number };
export type MergeStep = Merge[];

/** Every merge step for the given bar widths (left to right), simultaneous merges grouped. */
export function mergeSteps(widths: number[], random: () => number): MergeStep[] {
	const roots: Node[] = widths.map((w) => {
		const root: Node = { size: w, merged: w === 1 };
		const stack = [root];
		while (stack.length) {
			const node = stack.pop()!;
			if (node.size > 1) {
				const k = 1 + Math.floor(random() * (node.size - 1));
				node.left = { size: k, merged: false };
				node.right = { size: node.size - k, merged: false };
				stack.push(node.left);
				stack.push(node.right);
			}
		}
		return root;
	});
	const starts: number[] = [];
	let col = 0;
	for (const w of widths) {
		starts.push(col);
		col += w;
	}
	const isLeaf = (n: Node) => !n.left || n.merged;
	const steps: MergeStep[] = [];
	let guard = 0;
	while (!roots.every((r) => r.merged) && guard++ < 32) {
		const ready: { node: Node; merge: Merge }[] = [];
		const visit = (node: Node, start: number, tree: number) => {
			if (isLeaf(node)) return;
			const left = node.left!;
			const right = node.right!;
			if (isLeaf(left) && isLeaf(right)) {
				ready.push({ node, merge: { tree, cols: [start, node.size], size: node.size } });
				return;
			}
			if (!isLeaf(left)) visit(left, start, tree);
			if (!isLeaf(right)) visit(right, start + left.size, tree);
		};
		roots.forEach((root, t) => visit(root, starts[t], t));
		if (ready.length === 0) break;
		for (const r of ready) r.node.merged = true;
		steps.push(ready.map((r) => r.merge));
	}
	return steps;
}

export type MergeFrame = {
	/** seconds after the spin starts */
	at: number;
	/** frame goes dark this long before the next one lights (or stays until `end`) */
	until: number;
	cols: [start: number, width: number];
	size: number;
};

export type MergeGroup = {
	/** first reel of the block and its final width */
	reel: number;
	size: number;
	frames: MergeFrame[];
	/** the wide reel is drawn as one strip from here until it stops */
	panelFrom: number;
	/** when the whole block stops, seconds after the spin starts */
	end: number;
};

export type MergePlan = {
	groups: MergeGroup[];
	/**
	 * Extra cells of travel per reel so a block lands as one: the block's first
	 * reel carries the whole delay, the other reels of the block carry none of
	 * their own (they inherit the first reel's padding through the engine's
	 * accumulating stop cadence). -1 marks those "no padding of your own" reels.
	 */
	extraCells: number[];
	/** 1 on every reel that belongs to a block, for the reel engine's spin type */
	anticipation: number[];
};

/**
 * Engine stop time of reel i in an ordinary spin, seconds after the press: the
 * reference's 3x3 sample has the three reels left of the block stopped by 1.4 s
 * (0.2 s cadence), so reel 0 lands at 1.0. Checked against the running engine
 * with `new-games/wild-alchemy/qa/replay_cdp.mjs --probe`.
 */
export const normalStopTime = (reelIndex: number) => 1.0 + REF_TIMING.reelStopInterval.normal * reelIndex;

/**
 * Reference frame schedule (SPEC §2.2, four recorded merges; seconds after the
 * press, ±0.1):
 *   3x3            frame 0.6                      stop 1.6
 *   4x4 (3 then 4) frame 0.7, dark 1.3, frame 1.8, stop 2.8
 *   4x4 (2+2, 4)   frame 0.8                      stop 1.8
 *   5x5 (3 then 5) frame 2.4, dark 4.0, frame 4.4, stop ~5.0   <- outlier, see below
 * Three of the four fit: the first frame lights MERGE_START after the reel-run
 * acceleration plus the size's reelMergeShowWait; each next framed step comes
 * reelMergeInterval + FRAME_GAP later, the frame going dark DARK_BEFORE_NEXT
 * before it; the block stops STOP_AFTER_LAST_FRAME after its last frame.
 * Unframed 2-merges take no time of their own. The 5x5 sample (one recording,
 * flagged as mis-read once already in the transcript) starts 1.7 s late and is
 * not modelled; a second recording would settle it.
 */
const MERGE_START = 0.2;
const FRAME_GAP = 0.3;
const DARK_BEFORE_NEXT = 0.4;
/** The block stops this long after its last framed merge (3x3 0.6->1.6, 4x4 1.8->2.8). */
const STOP_AFTER_LAST_FRAME = 1.0;

export function planMerge(bars: RevealBar[], random: () => number, reelCount: number): MergePlan {
	const widths = bars.map((bar) => bar.size);
	const steps = mergeSteps(widths, random);
	const extraCells = new Array(reelCount).fill(0);
	const anticipation = new Array(reelCount).fill(0);
	const groups: MergeGroup[] = [];

	bars.forEach((bar, tree) => {
		if (bar.size < 2) return;
		const showWait = REF_TIMING.reelMergeShowWait[bar.size - 1] ?? 0.4;
		const interval = REF_TIMING.reelMergeInterval[bar.size - 1] || 0.8;
		const framed: Merge[] = [];
		for (const step of steps) {
			for (const merge of step) {
				if (merge.tree === tree && merge.size >= REF_TIMING.mergeFrameMinSize) framed.push(merge);
			}
		}
		const first = MERGE_START + showWait;
		const frames: MergeFrame[] = framed.map((merge, k) => ({
			at: first + k * (interval + FRAME_GAP),
			until: k + 1 < framed.length ? first + (k + 1) * (interval + FRAME_GAP) - DARK_BEFORE_NEXT : Infinity,
			cols: merge.cols,
			size: merge.size,
		}));
		const naturalEnd = normalStopTime(bar.reel);
		const end = frames.length ? Math.max(naturalEnd, frames[frames.length - 1].at + STOP_AFTER_LAST_FRAME) : naturalEnd;
		for (const frame of frames) if (frame.until === Infinity) frame.until = end;
		groups.push({ reel: bar.reel, size: bar.size, frames, panelFrom: frames.length ? frames[0].at : 0, end });

		const delay = Math.max(0, end - naturalEnd);
		extraCells[bar.reel] = delay * (REF_TIMING.reelSpeed / REF_TIMING.refCell.height);
		for (let r = 1; r < bar.size; r++) extraCells[bar.reel + r] = -1;
		for (let r = 0; r < bar.size; r++) anticipation[bar.reel + r] = 1;
	});

	return { groups, extraCells, anticipation };
}
