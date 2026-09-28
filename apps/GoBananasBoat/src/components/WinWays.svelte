<script lang="ts" module>
	export type EmitterEventWinWays =
		| { type: 'winLinesShow'; wins: WinWayData[]; fast?: boolean }
		// THE SECOND STAGE, in the free game only: the round's multiplier has just
		// been slammed onto the board (MultiplierStrike), so every amount on it
		// becomes what the book actually pays. See `multiplied` below.
		| { type: 'winLinesMultiply' }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	// One winning SYMBOL, not one line. `ways` is the product of the per-reel
	// counts and is the number the player is shown.
	export type WinWayData = {
		symbol: string;
		kind: number;
		ways: number;
		/** what this symbol pays AFTER the round's multiplier — the book's own number */
		win: number;
		/**
		 * ...and before it. In the base game the two are the same; in a free game
		 * with a multiplier this is what the board shows FIRST, so the multiplier
		 * has something to be applied to. Both come from the book (meta.winWithoutMult
		 * and win), so neither is arithmetic this client did.
		 */
		winBase: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
	};
</script>

<script lang="ts">
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_WINS } from '../game/meshWin';
	import { getContext } from '../game/context';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS, BOARD_SIZES } from '../game/constants';
	import type { SymbolName } from '../game/types';

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

	// ── THE SYMBOLS ACT (game/meshWin, SymbolMeshWin) ──────────────────────
	//
	// Every symbol that can win has a mesh win: the subject is cut off its steel
	// plate and performs — the helmet hops and its dome turns, the mine swings on
	// its shackle, the flags snap in a gust, the letters hop off the panel — the
	// method GoBananubis uses. It is drawn HERE, in the popped copy, in place of
	// the flat sprite: this copy is what the player sees (the board's own cell is
	// under the scrim and under this). The glow and the gold rings stay round it.
	//
	// Two things change for a cell that acts:
	//
	//   · IT DOES NOT PULSE. The pop pulse existed to make a flat tile read as
	//     alive; a tile that acts is alive, and a pulse on top of a hop makes the
	//     subject bob twice at once. It still comes forward — MESH_LIFT — so it
	//     keeps clear of its neighbours.
	//   · THE HOLD COVERS THE ACT. The presentation is torn down the moment
	//     winLinesShow returns (winInfo broadcasts winLinesHide straight after),
	//     so a hold shorter than the act cuts the subject off mid-hop and the tile
	//     snaps back. The hold is sized to the longest act ON THE BOARD, not the
	//     longest in the game: a board of letters holds for a letter's beat.
	//
	// The acts play faster where the player has asked for pace: 1.35x in the fast
	// presentations (the free game, the idle replay) and 2x in turbo, so the
	// hold that covers them grows by as little as it can.
	const MESH_LIFT = 0.09;
	const ACT_SPEED_FAST = 1.35;
	const actSpeed = (fast: boolean) => (stateBet.isTurbo ? 2 : 1) * (fast ? ACT_SPEED_FAST : 1);
	let presentSpeed = $state(1);

	const SCRIM = 0x05070a;
	const SCRIM_ALPHA = 0.62;

	// THE WIN IS GO BANANAS 100's — a big pop and a gold ring on every winning
	// symbol, each on its own beat.
	//
	// GB100's SymbolWinAnim scales the symbol to 1.18 on a ~1.4s pulse and draws a
	// gold disc and two rings (gold, then white) round it. It is the most readable
	// win in the family: the symbol itself jumps, rather than something being drawn
	// near it.
	//
	// IT CANNOT BE PORTED INTO THIS GAME'S SymbolWinAnim, and the reason is where
	// that component is drawn, not what it draws. GB100's symbols are transparent
	// cut-outs; Boat's are OPAQUE SQUARE TILES packed edge to edge, and they are
	// drawn in the board's masked, static layer, in board order. So a tile scaled
	// to 1.18 there slides UNDER its right and lower neighbours, and then this
	// component's scrim — which darkens every non-winning cell — lands on the part
	// that overflows. The tile does not pop, it sinks into a dark rim. That is why
	// Boat's own pulse is held at 1.055 (see SymbolWinAnim).
	//
	// So the popped symbol is drawn HERE, as a copy, AFTER the scrim: above every
	// neighbour and above the dimming, which is the only place in the draw order
	// where a tile can grow past its cell and still read as coming forward. The
	// board's own win state carries on underneath, fully covered — the copy never
	// scales below 1.0, so it always hides it.
	//
	// What changes from GB100, and why:
	//
	//   · POP 0.16, not 0.18. An opaque tile covers its whole cell, so at 1.18 it
	//     overlaps a winning neighbour by 18% of a cell at the peak — on a line win
	//     that is two symbols, on a ways win it can be a block of eight. 0.16 is the
	//     last value where adjacent winners still read as separate tiles.
	//   · THE DISC GOES BEHIND AS LIGHT, not over as paint. GB100 fills a gold
	//     circle behind a transparent symbol; behind an opaque square it would be
	//     invisible, and in front it would tint the art yellow. So it is a soft glow
	//     sprite behind the tile, larger than it, which shows only as a halo round
	//     the square — the same light, in the one place it can be seen.
	//   · THE RINGS ARE DRAWN OVER THE TILE, inscribed round the motif, at GB100's
	//     own radii and colours. Over a transparent symbol they sat in the gap
	//     around it; over a tile they sit on the tile's face, round the object
	//     painted on it, which is where the eye already is.
	//   · THE PHASE IS PER CELL AND FIXED, from cellNoise below, rather than
	//     Math.random() per mount — GB100's intent (every symbol on its own beat)
	//     without a cell's rhythm changing when the component remounts.
	const POP = 0.16;
	// GB100: 225ms * 0.9..1.1 per radian, i.e. a ~1.4s cycle
	const PULSE_RATE_MS = 225;
	const ARRIVE_MS = 160; // the glow and rings coming up as the wake reaches the reel
	const SCRIM_FADE_MS = 200; // the board going down
	const TICK_MS = 32;

	// Deterministic per-cell noise in [0,1). The same cell always gets the same
	// number, which is the whole point — this is the cell's character, not a
	// flicker, and Math.random() in a draw call would re-roll it every frame.
	const cellNoise = (reel: number, row: number) => {
		const n = Math.sin(reel * 127.1 + row * 311.7) * 43758.5453;
		return n - Math.floor(n);
	};

	// The clock the glow breathes on. setInterval rather than rAF, matching
	// SymbolWinAnim: this is decoration and nothing waits on it, and the round's
	// actual ending is owned by the timers in winLinesShow.
	let clock = $state(0);
	// When each reel lit, so a cell's strike-in is measured from its own reveal
	// rather than from the start of the volley.
	let reelBornAt = $state<number[]>([]);
	let showBornAt = 0;

	let wins = $state<WinWayData[]>([]);
	// false until the multiplier lands; the amounts read winBase until then
	let multiplied = $state(false);
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

	$effect(() => {
		if (!show) return;
		const id = setInterval(() => {
			clock = performance.now();
		}, TICK_MS);
		return () => clearInterval(id);
	});

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

			wins = usable;
			multiplied = false;
			showBornAt = performance.now();
			reelBornAt = [];
			clock = showBornAt;
			show = true;
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const stagger = fast || stateBet.isTurbo ? REVEAL_STAGGER.fast : REVEAL_STAGGER.normal;
			presentSpeed = actSpeed(!!fast);
			// the longest act among the cells that will light, at this speed
			const actMs = Math.max(
				0,
				...usable.flatMap((w) =>
					w.positions
						.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y)
						.map((p) => {
							const name = context.stateGame.board[p.reel]?.reelState.symbols[p.row]?.rawSymbol.name;
							return name && MESH_WINS[name] ? MESH_WINS[name].durationMs / presentSpeed : 0;
						}),
				),
			);

			// Widest win decides how far the wake travels; reels beyond it hold
			// nothing, so stopping there keeps a 3-of-a-kind from waiting out two
			// empty steps.
			const lastReel = Math.max(...usable.flatMap((w) => w.positions.map((p) => p.reel)));

			for (let reel = 0; reel <= lastReel; reel++) {
				reelBornAt[reel] = performance.now();
				revealedReels = reel + 1;
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
			const flatHold = stateBet.isTurbo ? HOLD_AFTER_MS : Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS - elapsed);
			// The last reel's cells started acting one stagger ago; hold until
			// their act is done. Turbo too: an act cut off mid-hop snaps the tile
			// back, which reads as a glitch rather than as speed, and at 2x the
			// longest act is ~0.7s.
			const hold = Math.max(flatHold, actMs - stagger);
			await waitForTimeout(hold);
			if (mine !== generation) return;
		},
		// The amounts become the book's final numbers. Nothing else changes: the
		// same tags, in the same places, showing what they are now worth.
		winLinesMultiply: () => {
			multiplied = true;
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

	// Every lit cell as something drawable: where it is, what is on it, and where
	// in its own pulse it sits right now. Derived from `clock`, so the whole list
	// re-evaluates on the tick — twenty cells at most.
	const popCells = $derived.by(() => {
		const now = clock;
		const out: {
			key: string;
			cx: number;
			cy: number;
			assetKey: string;
			symbol: string;
			mesh: boolean;
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
			const noise = cellNoise(reel, row);
			const rate = PULSE_RATE_MS * (0.9 + noise * 0.2);
			const age = Math.max(0, now - (reelBornAt[reel] ?? now));
			out.push({
				key,
				cx: cellX(reel) + SYMBOL_SIZE / 2,
				cy: cellY(row) + SYMBOL_SIZE / 2,
				assetKey: info.assetKey,
				symbol: reelSymbol.rawSymbol.name,
				mesh: reelSymbol.rawSymbol.name in MESH_WINS,
				w: SYMBOL_SIZE * info.sizeRatios.width,
				h: SYMBOL_SIZE * info.sizeRatios.height,
				// Own phase per cell, as GB100 does. The copy still appears at exactly
				// the tile's own size, because the scale below is multiplied by
				// `arrive` — so there is no jump when it lands over the tile.
				pulse: 0.5 + 0.5 * Math.sin(age / rate + noise * Math.PI * 2),
				arrive: easeOutCubic(Math.min(1, age / ARRIVE_MS)),
				// the frame snaps in from a touch larger, and flashes white once
				snap: 1 + 0.08 * (1 - easeOutCubic(Math.min(1, age / ARRIVE_MS))),
				flare: Math.max(0, 1 - age / 260) ** 2,
			});
		}
		return out;
	});

	// ── WHAT EACH WIN PAID, ON THE BOARD ─────────────────────────────────────
	//
	// A small win used to show nowhere near the symbols that made it: the tiles
	// popped, the WAYS badge under the board cycled through them, and the amount
	// appeared only in the bar at the foot of the screen. The player had to look
	// away from the win to find out what it was worth.
	//
	// So each winning symbol gets its amount, floated up off the board where its
	// ways chain ENDS — its last reel, at the middle of the cells it holds there.
	// That is where a ways win is read to (left to right, the same direction the
	// wake runs), and it appears the moment the wake reaches that reel, so the
	// number lands as the chain completes rather than before it has been drawn.
	//
	// Two wins can end on the same cell; the second stacks above the first.
	const TAG_RISE_MS = 380;
	const amountTags = $derived.by(() => {
		const now = clock;
		const used = new Map<string, number>();
		const tags: { key: string; x: number; y: number; text: string; age: number; grown: boolean }[] = [];
		for (const w of wins) {
			if (!(w.win > 0) || w.positions.length === 0) continue;
			const lastReel = Math.max(...w.positions.map((p) => p.reel));
			if (lastReel >= revealedReels) continue;
			const rows = w.positions
				.filter((p) => p.reel === lastReel && p.row >= 1 && p.row <= BOARD_DIMENSIONS.y)
				.map((p) => p.row)
				.sort((a, b) => a - b);
			if (!rows.length) continue;
			const row = rows[Math.floor((rows.length - 1) / 2)];
			const cellKey = `${lastReel},${row}`;
			const stack = used.get(cellKey) ?? 0;
			used.set(cellKey, stack + 1);
			tags.push({
				key: `${w.symbol}-${w.kind}`,
				// the amount grows when the multiplier lands — see `multiplied`
				grown: multiplied,
				x: cellX(lastReel) + SYMBOL_SIZE / 2,
				y: cellY(row) + SYMBOL_SIZE * 0.5 - stack * SYMBOL_SIZE * 0.32,
				text: bookEventAmountToCurrencyString(multiplied ? w.win : w.winBase),
				age: Math.max(0, now - (reelBornAt[lastReel] ?? now)),
			});
		}
		return tags;
	});

	// ── THE FRAME AND THE SHADOW, instead of a glow and rings ──────────────
	//
	// The win used to put a gold additive halo, 1.75 cells wide, behind every
	// popped tile, and GB100's two circles over it. On this board both were
	// wrong for the same reason — the tiles are opaque squares packed edge to
	// edge. The halo had nowhere to show but ON THE NEIGHBOURS: the next copy
	// in draw order lay its gold over the tile beside it, and over the dimmed
	// losing cells, so a line win arrived as a yellow wash across the board. The
	// circles sat on square tiles and framed nothing.
	//
	// So a tile now wins the way a card is picked up: a soft DARK shadow under
	// it (it has lifted — depth, not light), and a crisp frame on its own edge —
	// a dark keyline, a gold line, a pale inner hairline — that snaps in as the
	// wake reaches the reel and flashes white once. All the light left is the
	// subject's own flash and sweep (SymbolMeshWin), on the subject.
	//
	// DRAWN IN THREE PASSES — every shadow, then every tile, then every frame —
	// so no cell's shadow or frame can land on a neighbour's tile.
	const FRAME_R = SYMBOL_SIZE * 0.065;
	const drawShadow = (g: PixiGraphics, half: number, arrive: number) => {
		g.clear();
		// a soft drop shadow faked by stacked rounded rects (no filter: a filter
		// isolates its contents and this sits beside the additive flashes)
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

		// THE BOARD GOES DOWN OVER 200ms, NOT ON ONE FRAME.
		//
		// It used to cut straight to 0.62, which is the same problem as the frame:
		// a hard cut is an interface changing state. A fade is a light going out.
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

			<!-- the winning symbols, popped — above the scrim, see POP. Three
			     passes: shadows, tiles, frames (see the note on the frame). -->
			{#each popCells as cell (cell.key)}
				{@const lift = 1 + (cell.mesh ? MESH_LIFT : POP * cell.pulse) * cell.arrive}
				<Graphics
					x={cell.cx}
					y={cell.cy}
					draw={(g) => drawShadow(g, (cell.w * lift) / 2, cell.arrive)}
				/>
			{/each}
			{#each popCells as cell (cell.key)}
				<Container
					x={cell.cx}
					y={cell.cy}
					scale={1 + (cell.mesh ? MESH_LIFT : POP * cell.pulse) * cell.arrive}
				>
					{#if cell.mesh}
						<!-- the symbol acting (SymbolMeshWin draws into this container).
						     A leaping high pay leaves only its plate here: its subject
						     is drawn in the last pass, above everything -->
						<Container zIndex={1}>
							<SymbolMeshWin
								symbolName={cell.symbol}
								width={cell.w}
								height={cell.h}
								speed={presentSpeed}
								part={MESH_WINS[cell.symbol].leaps ? 'plate' : 'all'}
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
			<!-- THE LEAPERS: the high pays' subjects, above every cell and frame, so
			     a helmet flipping out of its cell crosses the ones above it instead
			     of vanishing under them (game/meshWin/leaps.ts) -->
			{#each popCells.filter((c) => c.mesh && MESH_WINS[c.symbol].leaps) as cell (cell.key)}
				<Container
					x={cell.cx}
					y={cell.cy}
					scale={1 + MESH_LIFT * cell.arrive}
				>
					<SymbolMeshWin
						symbolName={cell.symbol}
						width={cell.w}
						height={cell.h}
						speed={presentSpeed}
						part="subject"
					/>
				</Container>
			{/each}

			<!-- the amounts, over the popped tiles — see amountTags -->
			{#each amountTags as tag (tag.key)}
				{@const t = Math.min(1, tag.age / TAG_RISE_MS)}
				<!-- rises a third of a cell as it arrives, with a small overshoot on
				     the scale so it lands rather than fades in -->
				<Container
					x={tag.x}
					y={tag.y - SYMBOL_SIZE * 0.34 * easeOutCubic(t)}
					scale={(t < 1 ? 0.6 + 0.55 * easeOutCubic(t) - 0.15 * t * t : 1) * (tag.grown ? 1.18 : 1)}
					alpha={Math.min(1, t * 2.5)}
				>
					<GoldText
						text={tag.text}
						fontSize={SYMBOL_SIZE * 0.26}
						maxWidth={SYMBOL_SIZE * 1.6}
						letterSpacing={1}
					/>
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
