<script lang="ts" module>
	export type EmitterEventWildColumns =
		| { type: 'wildColumnExpand'; wilds: { reel: number; row: number }[]; reels: number[] }
		| { type: 'wildColumnClear' }
		// Kingpin: the full cumulative set of held Wild columns for this feature.
		| { type: 'stickyWildsHold'; cells: { reel: number; row: number }[]; reels: number[] }
		| { type: 'stickyWildsClear' };
</script>

<script lang="ts">
	/**
	 * The Bruiser filling its reel with Wilds.
	 *
	 * This owns BOTH the beat and the substitution, and the substitution is not
	 * optional. `reveal` carries the board as DEALT — the gun still sitting in
	 * its cell and the rest of the reel untouched — while the maths evaluated
	 * the spin against a reel that was already all Wild. Nothing else in the
	 * stream ever restates that board, so without the swap below the player
	 * watches a payline light up an L4 and pay as if it were a Wild.
	 *
	 * Splitting it this way is deliberate rather than a workaround: emitting the
	 * post-expansion board from `reveal` instead would fix the mismatch and
	 * throw away the feature, because the gun would never be seen landing.
	 *
	 * Three beats, in order:
	 *
	 *   1. muzzle flash at the gun's own cell            (~90ms)
	 *   2. a beam sweeping down the reel, turning each
	 *      cell Wild as it passes                        (~260ms)
	 *   3. the column holding lit, then fading           (~380ms)
	 *
	 * The sweep runs top-to-bottom from the gun rather than outward from it in
	 * both directions: a single direction reads as the column being *filled*,
	 * which is what happened, while a symmetric bloom reads as an explosion,
	 * which is not.
	 *
	 * The dedicated comic-print beam, muzzle flash, shells and impact texture are
	 * authored under sprites/turfFx and share the Bruiser's signal-red accent.
	 */
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut, linear } from 'svelte/easing';
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { featureScaled } from '../game/timeScale';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// The one saturated red in the game. ART_BRIEF.md reserves #B22222 for this
	// mechanic and nothing else, so a red flash on the board can only ever mean
	// the Bruiser.
	const SIGNAL_RED = 0xb22222;
	const HOT = 0xffb08a;

	// Rows are padded by one on the wire, so the drawn column spans the four
	// playable rows starting at padded row 1 — centres at (r - 0.5) * SYMBOL_SIZE.
	const ROWS = BOARD_DIMENSIONS.y;
	const columnHeight = SYMBOL_SIZE * ROWS;
	const columnCentreY = ((1 + ROWS) / 2 - 0.5) * SYMBOL_SIZE;
	/** How long the fill takes to travel the reel, top to bottom. */
	const SWEEP_MS = 360;

	/**
	 * Ceiling on the muzzle flash, in cells.
	 *
	 * WildColumns is a SIBLING of Board, not a child of it — that is deliberate,
	 * because additive light drawn inside BoardMask would have nothing to add to
	 * and would vanish. The cost of sitting outside the mask is that nothing
	 * clips this sprite, so its size is the only thing keeping it on the board.
	 *
	 * The gun can land on the top or the bottom row, and from either of those
	 * cell centres the board edge is half a cell away. A sprite of k cells
	 * centred there spills (k / 2 - 0.5) cells past the edge, so k = 3.0 — what
	 * this was — threw the explosion a full cell past the board and onto the bet
	 * bar. 1.6 keeps the worst-case spill to 0.3 of a cell, which reads as light
	 * escaping the frame rather than as art in the wrong place.
	 */
	const FLASH_MAX = 1.6;
	const FLASH_CORE_MAX = 1.35;
	const rowCenterY = (row: number) => (row - 0.5) * SYMBOL_SIZE;

	const scaled = (ms: number) => featureScaled(ms);

	/**
	 * Turn one cell Wild, unless it holds a Scatter.
	 *
	 * The exclusion mirrors the maths exactly (game_executables.py,
	 * expand_special_wilds): a Scatter in an expanding reel survives, so the
	 * board here and the board the win was calculated on stay the same board.
	 * Getting this wrong in either direction is a payout the player cannot
	 * reconcile with what they can see.
	 */
	const turnWild = (reel: number, paddedRow: number) => {
		const symbol = context.stateGame.board[reel]?.reelState.symbols[paddedRow];
		if (!symbol || symbol.rawSymbol.scatter) return;
		symbol.rawSymbol = { name: 'W', wild: true };
	};

	type Column = {
		reel: number;
		row: number;
		/** 0 -> 1 as the fill sweeps down the reel */
		sweep: Tween<number>;
		/** overall column brightness, held after the sweep then faded */
		lit: Tween<number>;
		/** the muzzle flash at the gun's own cell */
		flash: Tween<number>;
	};

	let columns = $state<Column[]>([]);

	/**
	 * Reels HELD Wild for the rest of the feature (Kingpin).
	 *
	 * This is a standing overlay, not a beat: once a Bruiser takes a column it
	 * stays marked here, spin after spin, until the feature ends. The transient
	 * `columns` beat above still plays once, when the column is first taken; from
	 * the next spin on it is this layer that carries it, so the player reads the
	 * Wilds as locked in place rather than as re-landing every spin.
	 */
	let heldReels = $state<number[]>([]);
	// A slow breathing pulse on the chain overlay so a held column reads as
	// active rather than as a static decal. One shared clock for all of them.
	let holdPulse = new Tween(0, { duration: 0 });

	// Held = taped to the wall: a red keyline round the column and a strip of red
	// tape across each end (see the template note).
	const drawHeld = (g: PixiGraphics) => {
		g.clear();
		const width = SYMBOL_SIZE * 0.96;
		const pulse = holdPulse.current;
		g.roundRect(-width / 2, 2, width, columnHeight - 4, width * 0.08);
		g.stroke({ color: SIGNAL_RED, width: 5 + 2 * pulse, alpha: 0.8 + 0.2 * pulse });
		const strip = (cy: number, rot: number) => {
			const len = width * 0.62;
			const thick = width * 0.15;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			const outline = [
				[-len / 2, -thick / 2], [len / 2, -thick / 2], [len / 2 - thick * 0.12, -thick / 6], [len / 2, thick / 6],
				[len / 2, thick / 2], [-len / 2, thick / 2], [-len / 2 + thick * 0.12, thick / 6], [-len / 2, -thick / 6],
			];
			g.poly(outline.flatMap(([x, y]) => [x * cos - y * sin, cy + x * sin + y * cos]));
			g.fill({ color: SIGNAL_RED });
			g.stroke({ color: 0x121212, width: 2.5 });
		};
		strip(width * 0.04, -0.12);
		strip(columnHeight - width * 0.04, 0.1);
	};

	let holdPulseRunning = false;
	const runHoldPulse = async () => {
		if (holdPulseRunning) return;
		holdPulseRunning = true;
		while (heldReels.length > 0) {
			await holdPulse.set(1, { duration: 1400, easing: cubicOut });
			await holdPulse.set(0, { duration: 1400, easing: cubicOut });
		}
		holdPulseRunning = false;
	};

	const makeColumn = (wild: { reel: number; row: number }): Column => ({
		reel: wild.reel,
		row: wild.row,
		sweep: new Tween(0, { duration: 0 }),
		lit: new Tween(0, { duration: 0 }),
		flash: new Tween(0, { duration: 0 }),
	});

	context.eventEmitter.subscribeOnMount({
		wildColumnExpand: async ({ wilds }) => {
			// A reel already held plays no fresh beat - the held overlay owns it.
			columns = wilds.filter((w) => !heldReels.includes(w.reel)).map(makeColumn);
			if (columns.length === 0) return;

			// Guns on separate reels fire together rather than in sequence. Two
			// columns is already the good outcome; staggering them would make the
			// second one read as a consolation rather than as a doubling.
			await Promise.all(
				columns.map(async (column) => {
					await column.flash.set(1, { duration: scaled(90), easing: backOut });
					void column.flash.set(0, { duration: scaled(240), easing: cubicOut });
					void column.lit.set(1, { duration: scaled(120), easing: cubicOut });

					// The beam and the substitution run on the same clock: each row
					// turns Wild as the leading edge reaches it, so the fill is
					// something the player watches happen rather than a board that
					// was already different by the time the effect finished.
					for (let paddedRow = 1; paddedRow <= ROWS; paddedRow += 1) {
						await column.sweep.set(paddedRow / ROWS, {
							duration: scaled(SWEEP_MS / ROWS),
							easing: linear,
						});
						turnWild(column.reel, paddedRow);
					}

					await waitForTimeout(scaled(380));
					await column.lit.set(0, { duration: scaled(260), easing: cubicOut });
				}),
			);
			columns = [];
		},
		wildColumnClear: async () => {
			columns = [];
		},
		stickyWildsHold: async ({ reels }) => {
			heldReels = reels;
			void runHoldPulse();
		},
		stickyWildsClear: async () => {
			heldReels = [];
		},
	});
</script>

<BoardContainer>
 {#each heldReels as reel (reel)}
  <Container x={getSymbolX(reel)}>
   <!-- Held = taped to the wall: a red keyline round the column and a strip of red
        tape across each end. It used to be sw_locked.png, a stack of red X's over
        the Wilds, which reads as "crossed out" — the opposite of "stays Wild". -->
   <Graphics draw={drawHeld} />
  </Container>
 {/each}
 {#each columns as column (column.reel)}
  {@const sweep=column.sweep.current}
  {@const lit=column.lit.current}
  <Container x={getSymbolX(column.reel)}>
   <Graphics draw={(g)=>{
    g.clear();
    const w=SYMBOL_SIZE; const end=columnHeight*sweep;
    if(end<=0 || lit<=.01) return;
    g.rect(-w*.47,0,w*.94,end);g.fill({color:SIGNAL_RED,alpha:.17*lit});
    for(let i=0;i<6;i++){
     const x=-w*.43+i*w*.16, length=Math.max(0,end-(i%3)*w*.13);
     g.roundRect(x,0,w*.08,length,w*.04);g.fill({color:SIGNAL_RED,alpha:.7*lit});
    }
    // Paint-can nozzle follows the conversion front, with hard spray marks.
    if(sweep<1){
     g.roundRect(w*.15,end-w*.28,w*.24,w*.40,4);g.fill({color:0xf7f5f0});g.stroke({color:0x121212,width:2});
     g.rect(w*.20,end-w*.34,w*.12,w*.08);g.fill({color:SIGNAL_RED});
     for(let j=0;j<4;j++){g.moveTo(-w*.35,end+(j-2)*7);g.lineTo(w*.05,end+(j-2)*3);g.stroke({color:SIGNAL_RED,width:3});}
    }
   }} />
  </Container>
 {/each}
</BoardContainer>
