<script lang="ts" module>
	import type { MergePlan } from '../game/mergePath';

	export type EmitterEventWideReels =
		/** the spin just started: run the merge schedule for this reveal's blocks (SPEC §2.2) */
		| { type: 'mergeShow'; plan: MergePlan }
		| { type: 'mergeHide' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Rectangle } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { featureScaled } from '../game/timeScale';
	import NineSlice from './NineSlice.svelte';

	// block frame art (773 px square): ink 4 px in, the band 39 px wide; drawn
	// with a 7-unit band round a strip of 96-unit cells
	const BLOCK_ART = { margin: 4, slice: 60 };
	const BLOCK_K = 7 / 39;

	const context = getContext();

	type Frame = { key: string; start: number; width: number; size: number; lit: boolean };
	type Panel = { key: string; start: number; width: number };

	let frames = $state<Frame[]>([]);
	let panels = $state<Panel[]>([]);
	let timers: ReturnType<typeof setTimeout>[] = [];
	let pulse = $state(0);
	let raf = 0;

	const clear = () => {
		for (const t of timers) clearTimeout(t);
		timers = [];
		frames = [];
		panels = [];
	};
	const later = (seconds: number, fn: () => void) => {
		timers.push(setTimeout(fn, featureScaled(seconds * 1000)));
	};

	const tick = (now: number) => {
		pulse = 0.5 + 0.5 * Math.sin(now / 90);
		raf = requestAnimationFrame(tick);
	};
	raf = requestAnimationFrame(tick);
	onDestroy(() => {
		cancelAnimationFrame(raf);
		clear();
	});

	context.eventEmitter.subscribeOnMount({
		mergeShow: ({ plan }) => {
			clear();
			plan.groups.forEach((group, g) => {
				const panelKey = `panel-${g}`;
				// the block spins as one strip from its first frame until it stops
				later(group.panelFrom, () => {
					panels = [...panels.filter((p) => p.key !== panelKey), { key: panelKey, start: group.reel, width: group.size }];
				});
				// the stop sound comes from the reel engine when the block really
				// lands (stateGame onSpinFinishing), not from this schedule
				later(group.end, () => {
					panels = panels.filter((p) => p.key !== panelKey);
					frames = frames.filter((f) => !f.key.startsWith(`frame-${g}-`));
				});
				group.frames.forEach((frame, k) => {
					const key = `frame-${g}-${k}`;
					later(frame.at, () => {
						frames = [...frames.filter((f) => f.key !== key), { key, start: frame.cols[0], width: frame.cols[1], size: frame.size, lit: true }];
						context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
					});
					later(frame.until, () => {
						frames = frames.map((f) => (f.key === key ? { ...f, lit: false } : f));
					});
				});
			});
		},
		mergeHide: () => clear(),
	});
</script>

<BoardContainer>
	{#each panels as panel (panel.key)}
		<!-- one wide strip over the merging reels: hides the individual reels underneath -->
		<Rectangle
			x={panel.start * SYMBOL_SIZE}
			y={0}
			width={panel.width * SYMBOL_SIZE}
			height={BOARD_DIMENSIONS.y * SYMBOL_SIZE}
			backgroundColor={0x2e2219}
			alpha={0.82}
		/>
		<!-- the stopped/silver block frame (frames/block_frame_stopped_silver.png) -->
		<NineSlice
			key="waBlockFrameStopped"
			x={panel.start * SYMBOL_SIZE + 3}
			y={3}
			width={panel.width * SYMBOL_SIZE - 6}
			height={BOARD_DIMENSIONS.y * SYMBOL_SIZE - 6}
			slice={BLOCK_ART.slice}
			margin={BLOCK_ART.margin}
			k={BLOCK_K}
			alpha={0.9}
		/>
	{/each}
	{#each frames as frame (frame.key)}
		{#if frame.lit}
			<!-- the merge frame (the reference's 60-frame sequence): the jade block
			     frame art (frames/block_frame_merge_jade.png), with an additive copy
			     pulsing over it so it reads as lit -->
			<Container x={frame.start * SYMBOL_SIZE} y={0}>
				<NineSlice
					key="waBlockFrameMerge"
					x={-4}
					y={-4}
					width={frame.width * SYMBOL_SIZE + 8}
					height={BOARD_DIMENSIONS.y * SYMBOL_SIZE + 8}
					slice={BLOCK_ART.slice}
					margin={BLOCK_ART.margin}
					k={BLOCK_K}
				/>
				<NineSlice
					key="waBlockFrameMerge"
					x={-4}
					y={-4}
					width={frame.width * SYMBOL_SIZE + 8}
					height={BOARD_DIMENSIONS.y * SYMBOL_SIZE + 8}
					slice={BLOCK_ART.slice}
					margin={BLOCK_ART.margin}
					k={BLOCK_K}
					blendMode="add"
					alpha={0.15 + 0.45 * pulse}
				/>
			</Container>
		{/if}
	{/each}
</BoardContainer>
