<script lang="ts" module>
	export type EmitterEventWinWays =
		| { type: 'winLinesShow'; wins: WinWayData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	// One winning SYMBOL, not one line. `ways` is the product of the per-reel
	// counts and is the number the player is shown.
	export type WinWayData = {
		symbol: string;
		kind: number;
		ways: number;
		win: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
	};
</script>

<script lang="ts">
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import { getContext } from '../game/context';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS, BOARD_SIZES } from '../game/constants';
	import type { SymbolName } from '../game/types';
	import { stateGame } from '../game/stateGame.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_WINS, MESH_SPLIT } from '../game/meshWin';

	const context = getContext();

	// WHY THIS IS NOT A LINE PRESENTATION
	//
	// Gen-1 and gen-2 drew a coloured polyline per payline and ran a grenade along
	// it. A ways game has no line to run along: a symbol pays wherever it lands on
	// its reel, and a single win can involve eight scattered cells with no path
	// between them. Drawing one would invent a shape the maths does not have.
	//
	// So this follows what ways games actually do — Megaways, Nolimit, Pragmatic
	// all present the same way, and players arrive already knowing how to read it:
	//
	//   1. the board dims
	//   2. the winning cells stay bright, with a frame around each
	//   3. a badge states how many WAYS paid
	//
	// The dimming is drawn as rectangles over the NON-winning cells rather than as
	// a scrim with holes cut in it. A 4x5 board is 20 cells, so the rect list is
	// trivial, and it avoids pixi v8's mask/hole API entirely — inverse masks are
	// the kind of thing that works until a version bump.

	const REVEAL_STAGGER = { normal: 90, fast: 40 };
	const HOLD_AFTER_MS = 220;

	// A symbol's win spine runs ~1.4s. The reveal itself is far shorter, so
	// without a hold the next spin wipes the symbols a third of the way into
	// their animation — the same bug gen-2 had with its line volley.
	const WIN_ANIM_VISIBLE_MS = 950;

	const SCRIM = 0x05070a;
	const SCRIM_ALPHA = 0.62;

	// ── THE SYMBOLS ACT (game/meshWin, SymbolMeshWin) ──────────────────────
	//
	// GoBananasBoat's presentation, ported. Every symbol that can win has a mesh
	// win: the subject is cut off its slate and performs — the kabuto flips and
	// its horns twang, the shuriken spins, the bomb counts down and hops, the fan
	// snaps open, the ninja's headband tails stream, the letters hop out of their
	// engraving. It is drawn in a COPY of the cell, above the scrim: the board's
	// own cells are opaque tiles packed in a masked layer, where a tile that grows
	// slides under its neighbours and into the dimming. The copy sits above all of
	// that, so it can come forward. The board's own win state carries on beneath
	// it, fully covered.
	//
	//   · THE HOLD COVERS THE ACT. The presentation is torn down the moment
	//     winLinesShow returns, so a hold shorter than the act cuts the subject off
	//     mid-leap. It is sized to the longest act ON THE BOARD.
	//   · The acts play 1.35x in the fast presentations (free game, idle replay)
	//     and 2x in turbo.
	//   · A CUT cell (the katana's split) acts too: its twin-motif tile has its
	//     own rig, the symbol's rig twice (game/meshWin/splitRig.ts).
	const MESH_LIFT = 0.09;
	const POP = 0.1;
	const ACT_SPEED_FAST = 1.35;
	const actSpeed = (fast: boolean) => (stateBet.isTurbo ? 2 : 1) * (fast ? ACT_SPEED_FAST : 1);
	let presentSpeed = $state(1);
	const PULSE_RATE_MS = 225;
	const ARRIVE_MS = 160;
	const SCRIM_FADE_MS = 200;
	const TICK_MS = 32;
	const cellNoise = (reel: number, row: number) => {
		const n = Math.sin(reel * 127.1 + row * 311.7) * 43758.5453;
		return n - Math.floor(n);
	};
	let clock = $state(0);
	let reelBornAt = $state<number[]>([]);
	let showBornAt = 0;
	const SPLIT_ASSET_KEY: Record<string, string> = {
		H1: 'gbH1Split', H2: 'gbH2Split', H3: 'gbH3Split', H4: 'gbH4Split',
		L1: 'gbL1Split', L2: 'gbL2Split', L3: 'gbL3Split', L4: 'gbL4Split', L5: 'gbL5Split',
		W: 'gbWSplit',
	};

	let wins = $state<WinWayData[]>([]);
	// Reels revealed so far: the wake runs left to right, which is the direction
	// a ways win is read in.
	let revealedReels = $state(0);
	let show = $state(false);

	// One row per winning SYMBOL, because that is how a ways game pays: each
	// symbol has its own count and its own amount, and a single summed total
	// would tell the player a number that appears nowhere in the maths.
	//
	// The symbol is shown as its own icon rather than its code — "A" and "H1"
	// mean nothing on screen, and the tile the player just watched light up is
	// the least ambiguous label there is.
	const rows = $derived(
		wins
			.filter((w) => w.ways > 0)
			.slice()
			.sort((a, b) => b.win - a.win)
			.map((w) => ({
				key: `${w.symbol}-${w.kind}`,
				assetKey: getSymbolInfo({
					rawSymbol: { name: w.symbol as SymbolName },
					state: 'static',
				}).assetKey,
				ways: w.ways,
			})),
	);

	const ICON = $derived(SYMBOL_SIZE * 0.3);

	// ONE AT A TIME, HIGHEST FIRST.
	//
	// A ways board can pay six or seven symbols at once, and a list that long
	// under the board is a wall of numbers nobody reads — it also grows downward
	// into whatever is beneath it, which is a layout that breaks on the spin that
	// happens to pay the most. Cycling keeps the strip one line tall whatever
	// happens, and puts the biggest win in front of the player first.
	const CYCLE_MS = 1100;
	let cycle = $state(0);
	let cycleTimer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (cycleTimer !== null) clearInterval(cycleTimer);
		cycleTimer = null;
		cycle = 0;
		if (rows.length < 2) return;
		cycleTimer = setInterval(() => {
			cycle = (cycle + 1) % rows.length;
		}, CYCLE_MS);
		return () => {
			if (cycleTimer !== null) clearInterval(cycleTimer);
			cycleTimer = null;
		};
	});

	const current = $derived(rows.length ? rows[cycle % rows.length] : undefined);

	// Every winning cell across every winning symbol, deduped — two symbols can
	// share a cell only via a Wild, but that is enough to double-draw a frame.
	const litCells = $derived.by(() => {
		const set = new Set<string>();
		for (const win of wins) {
			for (const p of win.positions) {
				if (p.row >= 1 && p.row <= BOARD_DIMENSIONS.y && p.reel < revealedReels) {
					set.add(`${p.reel},${p.row}`);
				}
			}
		}
		return set;
	});

	// Same formula as getSymbolX in utils.ts.
	const cellX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING) - SYMBOL_SIZE / 2;
	// Board rows are 1..numRows in the padded array; row 0 and numRows+1 are the
	// padding cells either side and are never lit.
	const cellY = (row: number) => -SYMBOL_SIZE + row * SYMBOL_SIZE;

	// --- symbol animations, fired reel by reel in the wake -------------------
	// A cell can belong to more than one winning symbol; animating it twice
	// re-assigns symbolState='win' without retriggering, and the game hangs
	// waiting for a completion that never fires. Dedupe per reveal.
	let animatedKeys = new Set<string>();
	const posKey = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	// Bumped by every show, hide and clear, so a volley cancelled midway cannot
	// keep animating a board that has already started spinning again.
	let generation = 0;

	$effect(() => {
		if (!show) return;
		const id = setInterval(() => {
			clock = performance.now();
		}, TICK_MS);
		return () => clearInterval(id);
	});

	// is this cell showing its cut (twin-motif) tile? Symbol.svelte's own test
	const isSplitCell = (reel: number, row: number) => {
		const raw = context.stateGame.board[reel]?.reelState.symbols[row]?.rawSymbol;
		return !!raw && raw.multiplier === 2 && stateGame.splitCutReels.includes(reel);
	};

	const animatePositions = (positions: { reel: number; row: number }[]) => {
		const fresh = positions.filter(
			(p) =>
				p.row >= 1 &&
				p.row <= BOARD_DIMENSIONS.y &&
				!animatedKeys.has(posKey(p)),
		);
		if (fresh.length === 0) return;
		for (const p of fresh) animatedKeys.add(posKey(p));
		context.eventEmitter.broadcast({ type: 'boardWithAnimateSymbols', symbolPositions: fresh });
	};

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins: incoming, fast }) => {
			const mine = ++generation;
			animatedKeys = new Set();
			revealedReels = 0;

			const usable = incoming.filter((w) => w.positions.length > 0);
			if (usable.length === 0) return;

			showBornAt = performance.now();
			reelBornAt = [];
			clock = showBornAt;
			wins = usable;
			show = true;
			presentSpeed = actSpeed(!!fast);
			// the longest act among the cells that will light, at this speed
			const actMs = Math.max(
				0,
				...usable.flatMap((w) =>
					w.positions
						.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y)
						.map((p) => {
							const name = context.stateGame.board[p.reel]?.reelState.symbols[p.row]?.rawSymbol.name;
							const set = isSplitCell(p.reel, p.row) ? MESH_SPLIT : MESH_WINS;
							return name && set[name] ? set[name].durationMs / presentSpeed : 0;
						}),
				),
			);
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const stagger = fast || stateBet.isTurbo ? REVEAL_STAGGER.fast : REVEAL_STAGGER.normal;

			// Widest win decides how far the wake travels; reels beyond it hold
			// nothing, so stopping there keeps a 3-of-a-kind from waiting out two
			// empty steps.
			const lastReel = Math.max(...usable.flatMap((w) => w.positions.map((p) => p.reel)));

			for (let reel = 0; reel <= lastReel; reel++) {
				revealedReels = reel + 1;
				reelBornAt[reel] = performance.now();
				animatePositions(usable.flatMap((w) => w.positions.filter((p) => p.reel === reel)));
				await waitForTimeout(stagger);
				if (mine !== generation) return;
			}

			// Safety net, and it runs BEFORE the hold. Anything the wake missed —
			// a dropped frame, a position on a reel past lastReel — gets the whole
			// hold to play in rather than starting its 1.4s spine at the moment the
			// round moves on. animatedKeys makes it a no-op for everything already lit.
			animatePositions(usable.flatMap((w) => w.positions));

			// Turbo opts out of the extended hold: there the player asked for speed
			// and a clipped win animation is the trade they made.
			const elapsed = (lastReel + 1) * stagger;
			const flatHold = stateBet.isTurbo
				? HOLD_AFTER_MS
				: Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS - elapsed);
			// The last reel's cells started acting one stagger ago; hold until
			// their act is done — turbo too: an act cut off mid-leap snaps the tile
			// back, which reads as a glitch rather than as speed.
			const hold = Math.max(flatHold, actMs - stagger);
			await waitForTimeout(hold);
			if (mine !== generation) return;
		},
		winLinesHide: () => {
			generation += 1;
			show = false;
			wins = [];
			revealedReels = 0;
		},
		// The round is over. Board listens to this to cancel its symbol
		// animations; this component has to listen too, or the two disagree.
		//
		// winLinesHide alone was not enough. The idle replay is a detached loop,
		// and pressing Spin while one of its passes is inside winLinesShow leaves
		// that pass mid-flight: it wakes from its next await and fires one more
		// boardWithAnimateSymbols — AFTER Board has already cancelled — putting
		// symbols into the win state for a round that has started. That is the
		// win presentation which kept appearing on the following spin.
		boardWinAnimCancel: () => {
			generation += 1;
			show = false;
			wins = [];
			revealedReels = 0;
		},
		winLinesClear: () => {
			generation += 1;
			wins = [];
			revealedReels = 0;
		},
	});

	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

	// Every lit cell as something drawable, re-derived on the tick
	const popCells = $derived.by(() => {
		const now = clock;
		const out: {
			key: string;
			cx: number;
			cy: number;
			assetKey: string;
			symbol: string;
			mesh: boolean;
			split: boolean;
			w: number;
			h: number;
			pulse: number;
			arrive: number;
			snap: number;
			flare: number;
		}[] = [];
		for (const key of litCells) {
			const [reel, row] = key.split(',').map(Number);
			const reelSymbol = context.stateGame.board[reel]?.reelState.symbols[row];
			if (!reelSymbol) continue;
			const info = getSymbolInfo({ rawSymbol: reelSymbol.rawSymbol, state: 'win' });
			if (info.type !== 'sprite') continue;
			const name = reelSymbol.rawSymbol.name;
			const split = isSplitCell(reel, row);
			const noise = cellNoise(reel, row);
			const rate = PULSE_RATE_MS * (0.9 + noise * 0.2);
			const age = Math.max(0, now - (reelBornAt[reel] ?? now));
			out.push({
				key,
				cx: cellX(reel) + SYMBOL_SIZE / 2,
				cy: cellY(row) + SYMBOL_SIZE / 2,
				assetKey: split ? (SPLIT_ASSET_KEY[name] ?? info.assetKey) : info.assetKey,
				symbol: name,
				mesh: name in (split ? MESH_SPLIT : MESH_WINS),
				split,
				w: SYMBOL_SIZE * info.sizeRatios.width,
				h: SYMBOL_SIZE * info.sizeRatios.height,
				pulse: 0.5 + 0.5 * Math.sin(age / rate + noise * Math.PI * 2),
				arrive: easeOutCubic(Math.min(1, age / ARRIVE_MS)),
				snap: 1 + 0.08 * (1 - easeOutCubic(Math.min(1, age / ARRIVE_MS))),
				flare: Math.max(0, 1 - age / 260) ** 2,
			});
		}
		return out;
	});

	// THE FRAME AND THE SHADOW (Boat's): a tile wins the way a card is picked
	// up — a soft dark shadow under it and a crisp frame on its own edge that
	// snaps in as the wake reaches the reel and flashes white once. Drawn in
	// three passes — every shadow, then every tile, then every frame — so no
	// cell's shadow or frame can land on a neighbour's tile.
	const FRAME_R = SYMBOL_SIZE * 0.065;
	const drawShadow = (g: PixiGraphics, half: number, arrive: number) => {
		g.clear();
		for (const [grow, a] of [
			[10, 0.08],
			[6, 0.12],
			[3, 0.16],
			[0, 0.2],
		] as [number, number][]) {
			g.roundRect(-half - grow, -half - grow + 5, (half + grow) * 2, (half + grow) * 2, FRAME_R + grow);
			g.fill({ color: 0x000000, alpha: a * arrive });
		}
	};
	const drawFrame = (g: PixiGraphics, half: number, arrive: number, flare: number) => {
		g.clear();
		g.roundRect(-half, -half, half * 2, half * 2, FRAME_R);
		g.stroke({ width: 5, color: 0x0a0804, alpha: 0.85 * arrive, alignment: 1 });
		g.roundRect(-half + 1, -half + 1, half * 2 - 2, half * 2 - 2, FRAME_R - 1);
		g.stroke({ width: 2.5, color: flare > 0.01 ? 0xffffff : 0xffd05a, alpha: arrive });
		g.roundRect(-half + 4, -half + 4, half * 2 - 8, half * 2 - 8, FRAME_R - 3);
		g.stroke({ width: 1, color: 0xfff6d6, alpha: (0.4 + 0.6 * flare) * arrive });
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (!show || wins.length === 0) return;
		const now = clock;
		// the board goes down over 200ms, not on one frame
		const scrim = SCRIM_ALPHA * Math.min(1, (now - showBornAt) / SCRIM_FADE_MS);

		// Dim every cell that is not part of a win. Reels the wake has not reached
		// yet are dimmed whole, so the board darkens ahead of the reveal and the
		// wins appear to light up out of it.
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (litCells.has(`${reel},${row}`)) continue;
				g.rect(cellX(reel), cellY(row), SYMBOL_SIZE, SYMBOL_SIZE);
			}
		}
		g.fill({ color: SCRIM, alpha: scrim });
	};
</script>

{#if show && wins.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			<Graphics {draw} />

			<!-- the winning symbols, popped above the scrim (see THE SYMBOLS ACT).
			     Three passes: shadows, tiles, frames. -->
			{#each popCells as cell (cell.key)}
				{@const lift = 1 + (cell.mesh ? MESH_LIFT : POP * cell.pulse) * cell.arrive}
				<Graphics x={cell.cx} y={cell.cy} draw={(g) => drawShadow(g, (cell.w * lift) / 2, cell.arrive)} />
			{/each}
			{#each popCells as cell (cell.key)}
				<Container x={cell.cx} y={cell.cy} scale={1 + (cell.mesh ? MESH_LIFT : POP * cell.pulse) * cell.arrive}>
					{#if cell.mesh}
						<!-- the symbol acting (SymbolMeshWin draws into this container).
						     A leaping one leaves only its plate here: its subject is drawn
						     in the last pass, above everything -->
						<Container zIndex={1}>
							<SymbolMeshWin
								symbolName={cell.symbol}
								split={cell.split}
								width={cell.w}
								height={cell.h}
								speed={presentSpeed}
								part={!cell.split && MESH_WINS[cell.symbol].leaps ? 'plate' : 'all'}
							/>
						</Container>
					{:else}
						<Sprite key={cell.assetKey} anchor={0.5} width={cell.w} height={cell.h} zIndex={1} />
					{/if}
				</Container>
			{/each}
			{#each popCells as cell (cell.key)}
				{@const lift = 1 + (cell.mesh ? MESH_LIFT : POP * cell.pulse) * cell.arrive}
				<Graphics
					x={cell.cx}
					y={cell.cy}
					scale={cell.snap}
					draw={(g) => drawFrame(g, (cell.w * lift) / 2, cell.arrive, cell.flare)}
				/>
			{/each}
			<!-- THE LEAPERS: the subjects that jump out of their cells, above every
			     cell and frame, so they cross their neighbours rather than vanish
			     under them (game/meshWin/leaps.ts) -->
			{#each popCells.filter((c) => c.mesh && !c.split && MESH_WINS[c.symbol].leaps) as cell (cell.key)}
				<Container x={cell.cx} y={cell.cy} scale={1 + MESH_LIFT * cell.arrive}>
					<SymbolMeshWin symbolName={cell.symbol} width={cell.w} height={cell.h} speed={presentSpeed} part="subject" />
				</Container>
			{/each}
			{#if revealedReels > 0 && current}
				{@const y = BOARD_SIZES.height + SYMBOL_SIZE * 0.3}
				<!-- icon then count, as one centred pair: the icon is anchored on its
				     right edge and the text on its left, so the pair stays balanced
				     about the board's centre however long the number is. -->
				<Sprite
					anchor={{ x: 1, y: 0.5 }}
					key={current.assetKey}
					x={BOARD_SIZES.width / 2 - SYMBOL_SIZE * 0.07}
					{y}
					width={ICON}
					height={ICON}
				/>
				<GoldText
					text={`${current.ways.toLocaleString()} WAYS`}
					fontSize={SYMBOL_SIZE * 0.22}
					x={BOARD_SIZES.width / 2 + SYMBOL_SIZE * 0.07}
					{y}
					anchor={{ x: 0, y: 0.5 }}
					maxWidth={BOARD_SIZES.width * 0.4}
					letterSpacing={1}
				/>
			{/if}
		</Container>
	</BoardContainer>
{/if}
