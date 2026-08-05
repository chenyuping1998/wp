<script lang="ts" module>
	import type { ClusterWinDatum } from '../game/bookEventHandlerMap';

	/** Three speeds, not a boolean: the free game needs its own, slower than base. */
	export type ClusterPace = 'normal' | 'freegame' | 'turbo';

	export type EmitterEventClusterWins =
		| { type: 'clusterWinsShow'; wins: ClusterWinDatum[]; pace?: ClusterPace }
		| { type: 'clusterWinsHide' };
</script>

<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { waitForTimeout, waitForResolve } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_DIMENSIONS,
		CLUSTER_STAGGER_MS,
		CLUSTER_STAGGER_MS_FREEGAME,
		CLUSTER_STAGGER_MS_FAST,
		CLUSTER_VOLLEY_MAX_MS,
		CLUSTER_HOLD_MS,
		CLUSTER_HOLD_MS_FREEGAME,
		CLUSTER_HOLD_MS_FAST,
		FLY_IN_FROM,
		FLY_IN_DEADLINE_MS,
		QUENCH_FROM,
		QUENCH_HOLD_MS,
	} from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import MultiplierFlyIn from './MultiplierFlyIn.svelte';

	/**
	 * Outlines every paying cluster and puts its amount at the cluster's centre.
	 *
	 * A cluster is an arbitrary orthogonally-connected blob, so the outline is
	 * traced as the boundary of the union of its cells rather than drawn as a
	 * shape: for each cell, an edge is drawn only where the neighbouring cell is
	 * not part of the same cluster. That gives a single clean silhouette around
	 * any blob, including ones with holes, without any polygon maths.
	 *
	 * This component also owns the symbol win animations. Two things it must get
	 * right:
	 *
	 *  · positions can be shared between clusters — a Wild belongs to every cluster
	 *    it completes, and the books show duplicate positions on the majority of
	 *    tumbles. They are deduped across the whole volley so a shared cell is lit
	 *    once rather than being re-armed underneath itself.
	 *  · books show up to 14 clusters at once. Staggering each by a fixed gap would
	 *    make a big hit take three seconds longer than a small one, so the stagger
	 *    is squeezed to fit a fixed budget.
	 *
	 * See animateCluster for why nothing here awaits an animation completion.
	 */
	const context = getContext();

	let wins = $state<ClusterWinDatum[]>([]);
	let revealed = $state(0);
	let visible = $state(false);
	// Clusters currently assembling their multiplier. Keyed by index into wins.
	let flying = $state<number[]>([]);

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;
	const CELL = SYMBOL_SIZE;

	// One resolver per in-flight cluster, so the sequence waits for the assembly
	// to finish before the tumble takes the symbols away.
	const flyResolvers: Record<number, () => void> = {};

	const shownWins = $derived(wins.slice(0, revealed));

	const drawOutlines = (graphics: PixiGraphics) => {
		graphics.clear();
		if (!visible) return;

		for (const win of shownWins) {
			const member = new Set(win.positions.map((p) => `${p.reel},${p.row}`));
			const has = (reel: number, row: number) => member.has(`${reel},${row}`);

			// Fill first, so the outline sits on top of its own wash.
			for (const pos of win.positions) {
				graphics
					.rect(getSymbolX(pos.reel) - CELL / 2, slotY(pos.row) - CELL / 2, CELL, CELL)
					.fill({ color: 0xff8c2a, alpha: 0.14 });
			}

			// Boundary: an edge wherever the neighbour is outside the cluster.
			for (const pos of win.positions) {
				const left = getSymbolX(pos.reel) - CELL / 2;
				const top = slotY(pos.row) - CELL / 2;
				const right = left + CELL;
				const bottom = top + CELL;

				if (!has(pos.reel, pos.row - 1)) graphics.moveTo(left, top).lineTo(right, top);
				if (!has(pos.reel, pos.row + 1)) graphics.moveTo(left, bottom).lineTo(right, bottom);
				if (!has(pos.reel - 1, pos.row)) graphics.moveTo(left, top).lineTo(left, bottom);
				if (!has(pos.reel + 1, pos.row)) graphics.moveTo(right, top).lineTo(right, bottom);
			}
			// Two passes: a wide dim one reads as heat bleeding off the edge, a thin
			// bright one keeps the silhouette crisp against a busy board.
			graphics.stroke({ width: 7, color: 0xff6a12, alpha: 0.35 });

			for (const pos of win.positions) {
				const left = getSymbolX(pos.reel) - CELL / 2;
				const top = slotY(pos.row) - CELL / 2;
				const right = left + CELL;
				const bottom = top + CELL;

				if (!has(pos.reel, pos.row - 1)) graphics.moveTo(left, top).lineTo(right, top);
				if (!has(pos.reel, pos.row + 1)) graphics.moveTo(left, bottom).lineTo(right, bottom);
				if (!has(pos.reel - 1, pos.row)) graphics.moveTo(left, top).lineTo(left, bottom);
				if (!has(pos.reel + 1, pos.row)) graphics.moveTo(right, top).lineTo(right, bottom);
			}
			graphics.stroke({ width: 2.5, color: 0xffe6a0, alpha: 0.95 });
		}
	};

	/**
	 * Light the winning symbols and hold for a beat — deliberately NOT for the
	 * whole win animation.
	 *
	 * The generated win spines run 1.4s, which is right for a lines game where the
	 * symbol stays on the board afterwards. Here every winning symbol is destroyed
	 * by the tumble that follows, so waiting out the full animation put 1.4s of
	 * dead time in front of each link: a nine-link chain took about 25 seconds,
	 * and even an ordinary two-link win ran close to six.
	 *
	 * The spine is still started and keeps playing underneath; the tumble takes the
	 * symbol over when it is ready. Nothing awaits a completion callback, which
	 * also removes the whole class of hangs where a symbol shared by two clusters
	 * never fires its second callback.
	 */
	const animateCluster = async (
		positions: { reel: number; row: number }[],
		seen: Set<string>,
		holdMs: number,
	) => {
		const fresh = positions.filter((p) => {
			const key = `${p.reel},${p.row}`;
			if (seen.has(key)) return false;
			if (p.row < 1 || p.row > BOARD_DIMENSIONS.y) return false;
			seen.add(key);
			return true;
		});
		if (fresh.length === 0) return;

		for (const position of fresh) {
			const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[position.row];
			if (!reelSymbol) continue;
			// Re-arm through 'static' so the state change is a real transition and the
			// spine restarts, rather than being ignored as a no-op assignment.
			if (reelSymbol.symbolState === 'win') reelSymbol.symbolState = 'static';
			reelSymbol.symbolState = 'win';
		}
		await waitForTimeout(holdMs);
	};

	context.eventEmitter.subscribeOnMount({
		clusterWinsHide: () => {
			// Release anything still in flight FIRST. The volley awaits these
			// resolvers, so hiding the layer without firing them would leave the
			// winInfo handler waiting on a callback that can no longer arrive —
			// the same hang that awaiting symbol completions used to cause.
			// Nothing does this today (tumbleBoard hides only after winInfo has
			// resolved), but the sequence should not depend on that ordering.
			for (const resolve of Object.values(flyResolvers)) resolve();
			for (const key of Object.keys(flyResolvers)) delete flyResolvers[Number(key)];
			visible = false;
			wins = [];
			revealed = 0;
			flying = [];
		},
		clusterWinsShow: async ({ wins: incoming, pace = 'normal' }) => {
			wins = incoming;
			revealed = 0;
			flying = [];
			visible = true;
			if (incoming.length === 0) return;

			const baseStagger =
				pace === 'turbo'
					? CLUSTER_STAGGER_MS_FAST
					: pace === 'freegame'
						? CLUSTER_STAGGER_MS_FREEGAME
						: CLUSTER_STAGGER_MS;
			// Squeeze the gap so the whole volley fits its budget however many
			// clusters landed — total time must not scale with the size of the win.
			const stagger = Math.min(baseStagger, CLUSTER_VOLLEY_MAX_MS / incoming.length);
			const holdMs =
				pace === 'turbo'
					? CLUSTER_HOLD_MS_FAST
					: pace === 'freegame'
						? CLUSTER_HOLD_MS_FREEGAME
						: CLUSTER_HOLD_MS;

			// Deduped across the whole volley: a cell shared by two clusters animates
			// once, for whichever cluster reaches it first. Books show this happening
			// on the majority of tumbles, so it is not a rare edge case.
			const seen = new Set<string>();

			await Promise.all(
				incoming.map(async (win, index) => {
					await waitForTimeout(stagger * index);
					revealed = Math.max(revealed, index + 1);
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.08 });
					await animateCluster(win.positions, seen, holdMs);

					// ── the rarest tier: the board is quenched ──────────────────
					// Held here rather than inside QuenchFlash because the pause has
					// to stop the SEQUENCE, not just play an animation over it.
					if (win.clusterMult >= QUENCH_FROM) {
						context.eventEmitter.broadcast({ type: 'quenchFlash' });
						context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
						context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.1 });
						await waitForTimeout(QUENCH_HOLD_MS);
					}

					// ── assemble the multiplier where the payout is read ────────
					// Raced against a deadline, never awaited bare. The callback comes
					// from a mounted component, and a component can fail to report for
					// reasons that have nothing to do with this sequence — it can be
					// unmounted, or throw while rendering, in which case onMount never
					// runs and no amount of correctness here brings the resolver back.
					// Without the race that is a game frozen for good; with it the worst
					// case is one cluster's assembly cut short.
					if (win.clusterMult >= FLY_IN_FROM) {
						flying = [...flying, index];
						await Promise.race([
							waitForResolve((resolve) => (flyResolvers[index] = resolve)),
							waitForTimeout(FLY_IN_DEADLINE_MS),
						]);
						delete flyResolvers[index];
						flying = flying.filter((i) => i !== index);
					}
				}),
			);
		},
	});
</script>

{#if visible}
	<BoardContainer>
		<Graphics draw={drawOutlines} />

		<!--
			Only the clusters big enough to earn it. Mounted here rather than as a
			sibling so it shares the board coordinate space with the outlines it is
			assembling into.
		-->
		{#each flying as index (index)}
			{@const win = wins[index]}
			{#if win}
				<MultiplierFlyIn
					positions={win.positions}
					overlay={win.overlay}
					clusterMult={win.clusterMult}
					oncomplete={() => flyResolvers[index]?.()}
				/>
			{/if}
		{/each}
		{#each shownWins as win, index (index)}
			<GoldText
				text={bookEventAmountToCurrencyString(win.win)}
				fontSize={SYMBOL_SIZE * 0.34}
				x={getSymbolX(win.overlay.reel)}
				y={slotY(win.overlay.row)}
				anchor={{ x: 0.5, y: 0.5 }}
				maxWidth={SYMBOL_SIZE * 1.9}
			/>
			{#if win.clusterMult > 1}
				<GoldText
					text={`x${win.clusterMult}`}
					fontSize={SYMBOL_SIZE * 0.24}
					x={getSymbolX(win.overlay.reel)}
					y={slotY(win.overlay.row) + SYMBOL_SIZE * 0.32}
					anchor={{ x: 0.5, y: 0.5 }}
					maxWidth={SYMBOL_SIZE * 1.2}
				/>
			{/if}
		{/each}
	</BoardContainer>
{/if}
