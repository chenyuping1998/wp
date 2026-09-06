<script lang="ts">
	// THE CAPSULE ROOF.
	//
	// The box is always six rows tall and a reel stands on its floor, so a reel at
	// the baseline leaves two empty rows above it. Until now that space was bare
	// backing plate, and the mechanic's whole premise — the capsule is EXTENDING —
	// was told only by symbols appearing. A hole does not extend.
	//
	// So the gap is filled with a telescoping shutter, one per reel, standing on
	// the reel's top row and retracting into the housing as the reel grows. What
	// it buys is that growth now has something to act ON: a machine visibly gives
	// way, rather than a void quietly getting smaller.
	//
	// PER REEL, not one lid across the board. Growth is depth first — a reel is
	// filled to six before the next one starts — so the board is routinely ragged
	// and a single lid would have to sit at the height of the tallest reel,
	// hovering over the short ones with nothing under it. Five independent
	// shutters make the ragged skyline the mechanism's own shape.
	//
	// THE STAGES ARE ANCHORED TO THE FACE, not spread across the gap. Each tube is
	// a fixed 99 units and the stack is consumed FROM THE TOP as it retracts, so
	// one row of growth swallows one tube. Spreading two stages across whatever
	// the gap happened to be would have every tube shrink a little on every step —
	// which is a lid being scaled, not a lid being retracted.
	import { onDestroy } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { NUM_REELS, SYMBOL_SIZE, BASE_ROWS, reelYOffset } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();

	// Sampled off frame_edge.png and then taken DOWN about a third. The housing
	// averages 71 in luminance and every symbol is brighter than it; a shutter at
	// the housing's own value put five pale slabs across the top of the board and
	// pulled the eye off the reels. It has to be the darkest metal on screen —
	// it is the thing in shadow, inside the capsule, with the board lit in front
	// of it — while still reading as the same alloy.
	const PLATE_DARK = 0x22231f;
	const PLATE_MID = 0x3d3e3a;
	const PLATE_LIGHT = 0x70726b;
	// The backing plate behind the reels, sampled from frame_bg.png. The shutter
	// paints its own copy of it — see the note on the cover below.
	const BACKING = 0x0b0e13;
	const BRASS_DARK = 0x1c170d;
	const BRASS_MID = 0x6c5e43;
	const BRASS_LIT = 0xa99878;

	// NO SEPARATE FACE HEIGHT AND NO STAGE HEIGHT ANY MORE. The telescope this
	// replaced needed both: a 26-unit piston head plus two tubes of whatever was
	// left over, which meant its parts were sized by arithmetic rather than by the
	// board. A slat is ONE CELL, full stop — so the unit is SYMBOL_SIZE and the
	// count falls out of the gap exactly.
	// A WIDE seam, 12 of the cell's 112. Three was enough to prove the shutters
	// were separate objects and not enough to make them look it: growth is depth
	// first, so three reels at the baseline put three tubes at identical heights,
	// and with a hairline between them they merged into one grey wall across the
	// top of the board. The gap has to be big enough to read as backing plate.
	const W = SYMBOL_SIZE - 12;

	// ── the travel ───────────────────────────────────────────────────────────
	//
	// A spring, and only ever upward. Growth is the thing worth animating: the
	// reel has already been re-shaped behind ReelGrow's cover by the time this
	// runs, so the shutter is seen finishing its climb as the motes disperse,
	// which is what makes the two read as one mechanism instead of two effects.
	//
	// A DECREASE SNAPS. growRows drops back to the baseline between rounds and on
	// resume, and animating that would put a shutter slamming down at the head of
	// every single spin — a flourish on the one transition the player did not do
	// anything to earn. It would also, for the length of the slam, be drawn over
	// the top row of a reel that is already showing symbols.
	// SIZED TO THE STEP, not fixed.
	//
	// A fixed spring was the other half of "it does not feel natural". ReelGrow
	// shortens its steps as the run gets longer, down to about 220ms at ten rows,
	// and a shutter that always takes half a second was still climbing out of step
	// N when step N+1 fired. The board and the lid drifted apart exactly when the
	// most was happening, which is the moment they most need to look like one
	// mechanism.
	//
	// Scaling keeps the DAMPING RATIO fixed while moving the frequency: stiffness
	// goes as the square of the rate and damping linearly, which is the same
	// spring played faster rather than a different, twitchier one.
	const STIFFNESS = 150;
	const DAMPING = 12; // underdamped on purpose: ~17% overshoot, so it seats hard
	// How long THESE constants take to settle, at rate 1. Measured by integrating
	// them, not guessed: the first version of this scaling assumed the spring
	// settled in the length of a step and it actually takes 825ms, so it overran
	// its window at every pace including the slowest. That is the whole bug the
	// scaling was added to fix, reintroduced by a wrong constant.
	const SPRING_SETTLE_MS = 825;
	// Home a little early rather than exactly on the buzzer, so the shutter is
	// seated before the next step's release rather than arriving with it.
	const ARRIVE_BY = 0.9;

	// The shutter is pressed DOWN a little before it is driven up. Anticipation is
	// the oldest trick there is and it is the one this was missing: a mass that
	// starts moving the instant it is asked has no weight, because nothing real
	// accelerates from rest without first loading. Four units and 90ms — small
	// enough that it reads as pressure rather than as a bounce.
	const DIP_UNITS = 0.036; // in ROWS, so about 4px at a 112px cell
	const DIP_MS = 90;

	// posRaw is the integrator's own state and is deliberately NOT reactive; `pos`
	// is a copy of it published for the draw.
	//
	// Reading a reactive position inside the effect below is a rAF loop that never
	// stops: the frame writes the position, the write re-runs the effect, the
	// effect finds no animation in flight and starts one, and the game burns a
	// frame a tick forever with nothing moving. Only `targets` may be reactive
	// here — that is the thing the shutter is actually waiting on.
	const posRaw = [...stateGame.growRows] as number[];
	let pos = $state<number[]>([...posRaw]);
	// The anticipation offset, in rows. Kept beside the position rather than added
	// into it: the spring's target is a row count and a dip folded into posRaw
	// would read as the reel having shrunk.
	const dip = new Array<number>(NUM_REELS).fill(0);
	let dipShown = $state<number[]>([...dip]);
	const vel = new Array<number>(NUM_REELS).fill(0);
	// When each reel's dip started, or 0 if it is not dipping.
	const dipAt = new Array<number>(NUM_REELS).fill(0);

	const targets = $derived(
		Array.from({ length: NUM_REELS }, (_, i) => stateGame.growRows[i] ?? BASE_ROWS),
	);

	let raf = 0;
	let last = 0;

	const frame = (now: number) => {
		// Clamped: a backgrounded tab hands back a dt of several seconds on its
		// first frame, and a spring integrated over that leaves the rails.
		const dt = Math.min(0.05, (now - last) / 1000 || 0);
		last = now;

		// The pace ReelGrow is running at right now. Faster steps mean a stiffer,
		// faster spring at the same damping ratio.
		const rate = SPRING_SETTLE_MS / (ARRIVE_BY * Math.max(90, stateGame.growTravelMs));
		const k = STIFFNESS * rate * rate;
		const c = DAMPING * rate;

		let moving = false;
		let changed = false;
		for (let i = 0; i < NUM_REELS; i += 1) {
			const target = targets[i] ?? BASE_ROWS;
			const before = posRaw[i];
			if (posRaw[i] > target) {
				// see the note above: the way back down is not an animation
				posRaw[i] = target;
				vel[i] = 0;
				dipAt[i] = 0;
				if (posRaw[i] !== before) changed = true;
				continue;
			}
			const dist = target - posRaw[i];
			if (Math.abs(dist) < 0.001 && Math.abs(vel[i]) < 0.01) {
				if (posRaw[i] !== target) changed = true;
				posRaw[i] = target;
				vel[i] = 0;
				dipAt[i] = 0;
				continue;
			}
			// LOAD BEFORE LIFTING. While the dip is running the spring is held off
			// entirely — letting it integrate underneath would have the two fight,
			// and the shutter would leave before the dip had finished arriving.
			if (dipAt[i]) {
				const p = (now - dipAt[i]) / (DIP_MS / rate);
				if (p < 1) {
					// down and back, so it is loaded rather than merely displaced
					dip[i] = -DIP_UNITS * Math.sin(p * Math.PI);
					changed = true;
					moving = true;
					continue;
				}
				dip[i] = 0;
				dipAt[i] = 0;
			}
			vel[i] += (dist * k - vel[i] * c) * dt;
			posRaw[i] += vel[i] * dt;
			changed = true;
			// NO SOUND FROM HERE ANY MORE. This used to fire a dry reel-stop thunk on
			// arrival, which was right when it was the only cue on the arrival at
			// all. ReelGrow now plays `grow_lock` on the same beat — a purpose-built
			// cue, pitched up one step per row — and two thunks a few frames apart
			// read as a rattle rather than as one thing seating. The shutter is what
			// you SEE arrive; the lock is what you hear.
			moving = true;
		}
		if (changed) {
			pos = [...posRaw];
			dipShown = [...dip];
		}
		raf = moving ? requestAnimationFrame(frame) : 0;
	};

	$effect(() => {
		// `targets` is the ONLY reactive read in here — see the note on posRaw
		const t = targets;
		const now = performance.now();
		for (let i = 0; i < NUM_REELS; i += 1) {
			// a reel that has just been asked to grow loads before it lifts
			if ((t[i] ?? BASE_ROWS) > (posRaw[i] ?? BASE_ROWS) && !dipAt[i] && vel[i] === 0) {
				dipAt[i] = now;
			}
		}
		if (!raf) {
			last = now;
			raf = requestAnimationFrame(frame);
		}
	});

	onDestroy(() => cancelAnimationFrame(raf));

	/**
	 * ONE SLAT, exactly one cell tall.
	 *
	 * The shutter is a blast door rolling up into the housing, and its unit is the
	 * ROW. Two slats above a reel at four, one above a reel at five, none at six —
	 * so the number of slats left IS the number of rows still to come. This game
	 * deliberately has no counter UI (the skyline is the progress meter), and a
	 * telescope of two fixed tubes could only say "something is in the way"; a
	 * stack of slats says how much.
	 *
	 * `phase` varies the detail from slat to slat and reel to reel. Five reels of
	 * identical slats at identical heights is a barcode — which is the one way
	 * this idea fails — so a third of them carry louvres, and the wear is seeded
	 * off the reel so no two columns scuff the same way.
	 */
	const slat = (
		g: PixiGraphics,
		cx: number,
		top: number,
		bottom: number,
		phase: number,
		closing: boolean,
	) => {
		const h = bottom - top;
		if (h <= 0.5) return;
		const left = cx - W / 2;

		// the face, slightly convex: a bright band a third in, falling off to both
		// edges, so a stack does not read as flat card
		g.rect(left, top, W, h);
		g.fill({ color: PLATE_MID });
		g.rect(left + W * 0.24, top, W * 0.2, h);
		g.fill({ color: PLATE_LIGHT, alpha: 0.3 });
		g.rect(left, top, W * 0.13, h);
		g.fill({ color: PLATE_DARK, alpha: 0.85 });
		g.rect(left + W * 0.87, top, W * 0.13, h);
		g.fill({ color: 0x000000, alpha: 0.5 });

		// THE JOINT AT THE TOP is where the slat above slots in. Drawn as a recess
		// rather than a line: a 1px divider between two flat panels reads as a
		// drawn edge, a recess with its own lit lower lip reads as two objects.
		//
		// Deep, because it is doing more work than it looks. Growth is depth first,
		// so three reels sit at the same height with their joints on the same line;
		// if that line is faint the three columns merge into one grey wall with
		// stripes on it. The joint has to read as a gap between two plates.
		if (h > 6) {
			g.rect(left, top, W, 4);
			g.fill({ color: 0x000000, alpha: 0.92 });
			g.rect(left, top + 4, W, 2);
			g.fill({ color: PLATE_LIGHT, alpha: 0.45 });
			// and the slat above throws a short shadow onto this one. Without it a
			// stack of plates is a set of lines drawn on one surface; with it each
			// plate is visibly in front of the next.
			for (let i = 0; i < 6; i += 1) {
				g.rect(left, top + 6 + i, W, 1);
				g.fill({ color: 0x000000, alpha: 0.3 * (1 - i / 6) });
			}
		}

		// a stiffening rib across the middle, which is what stops a 112-unit panel
		// looking like a blank
		if (h > 40) {
			g.rect(left + 6, top + h * 0.52, W - 12, 2.5);
			g.fill({ color: PLATE_DARK, alpha: 0.75 });
			g.rect(left + 6, top + h * 0.52 + 2.5, W - 12, 1);
			g.fill({ color: PLATE_LIGHT, alpha: 0.25 });
		}

		// A CENTRE LATCH on the closing slat. Vertical, and that is the point: every
		// other line on this thing is horizontal, and a stack of horizontals across
		// five reels is a barcode however well the plates are shaded. One upright
		// per column is what makes the eye read five doors instead of one grating.
		if (closing && h > 50) {
			g.rect(cx - 7, top + h * 0.3, 14, h * 0.45);
			g.fill({ color: PLATE_DARK, alpha: 0.9 });
			g.rect(cx - 5, top + h * 0.3, 3, h * 0.45);
			g.fill({ color: PLATE_LIGHT, alpha: 0.4 });
			g.rect(cx - 7, top + h * 0.3 + h * 0.2, 14, 4);
			g.fill({ color: BRASS_MID });
			g.rect(cx - 7, top + h * 0.3 + h * 0.2, 14, 1.5);
			g.fill({ color: BRASS_LIT, alpha: 0.8 });
		}

		// louvres on one slat in three — the anti-barcode measure
		if (phase % 3 === 0 && h > 60) {
			for (let v = 0; v < 3; v += 1) {
				const y = top + h * 0.2 + v * 7;
				g.rect(left + W * 0.58, y, W * 0.3, 3);
				g.fill({ color: 0x000000, alpha: 0.62 });
				g.rect(left + W * 0.58, y + 3, W * 0.3, 1);
				g.fill({ color: PLATE_LIGHT, alpha: 0.22 });
			}
		}
	};

	/**
	 * The guide rails the slats run in, down each side of the opening.
	 *
	 * These carry the column. Five shutters at the same height share every
	 * horizontal line they have, so the only thing saying "five separate doors"
	 * rather than "one slatted wall" is the pair of uprights bracketing each one —
	 * which means they need a lit edge, not just a dark strip.
	 */
	const rails = (g: PixiGraphics, cx: number, gap: number) => {
		for (const side of [-1, 1]) {
			const x = cx + (side * W) / 2 - (side > 0 ? 7 : 0);
			g.rect(x, 0, 7, gap);
			g.fill({ color: PLATE_DARK });
			// the inner face catches the light off the board
			g.rect(side < 0 ? x + 5 : x, 0, 2, gap);
			g.fill({ color: PLATE_LIGHT, alpha: 0.32 });
			// and the outer one is in shadow against the backing plate
			g.rect(side < 0 ? x : x + 5, 0, 2, gap);
			g.fill({ color: 0x000000, alpha: 0.7 });
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		for (let reel = 0; reel < NUM_REELS; reel += 1) {
			const gap = Math.max(0, reelYOffset((pos[reel] ?? BASE_ROWS) + (dipShown[reel] ?? 0)));
			if (gap < 0.5) continue;
			const cx = getSymbolX(reel);

			// AN OPAQUE COVER FIRST, ACROSS THE WHOLE CELL.
			//
			// The slats are W wide — twelve less than the cell — because that seam is
			// what stops three shutters at the same height merging into one grey
			// wall. The seam is also a hole: symbols do not stop existing above the
			// window, they scroll through it, and SymbolWrap culls them by their
			// CENTRE, so at any moment during a spin one symbol is straddling the
			// reel's top edge with half of itself above it. The slats hid that in
			// the middle of the cell and the seam let it through, six pixels down
			// each side — a strip of moving symbol running up the gap between the
			// shutters.
			//
			// So the gap is floored with the backing plate's own colour before
			// anything else is drawn on it. Nothing changes visually — the seam
			// still reads as backing, because it IS backing — and the reel can no
			// longer show through it. Full SYMBOL_SIZE and not W, and adjacent
			// reels tile exactly, so there is no hairline between them either.
			g.rect(cx - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, gap);
			g.fill({ color: BACKING });

			// The slot the shutter rolls into. Without it the top slat is a panel
			// that simply stops at the edge of the box, and a door that does not
			// visibly go anywhere is just a lid.
			g.rect(cx - W / 2 - 3, 0, W + 6, 9);
			g.fill({ color: 0x000000, alpha: 0.85 });
			g.rect(cx - W / 2 - 3, 7, W + 6, 3);
			g.fill({ color: BRASS_MID, alpha: 0.75 });

			rails(g, cx, gap);

			// SLATS FROM THE BOTTOM UP, and consumed from the top. The closing edge
			// is pinned to the reel; what a growth step removes is the slat furthest
			// into the housing. Building the stack downward from the top instead
			// would make every slat shift on every step, which is a shutter being
			// scaled rather than one rolling away.
			for (let k = 0; k * SYMBOL_SIZE < gap; k += 1) {
				const bottom = gap - k * SYMBOL_SIZE;
				const top = Math.max(0, bottom - SYMBOL_SIZE);
				slat(g, cx, top, bottom, reel + k, k === 0);
			}

			// depth: the further into the housing, the less light reaches it
			for (let b = 0; b < 4; b += 1) {
				g.rect(cx - W / 2, (gap * b) / 4, W, gap / 4 + 1);
				g.fill({ color: 0x000000, alpha: 0.3 * (1 - b / 4) });
			}

			// THE CLOSING EDGE. The bottom of the lowest slat is the part that sits
			// on the reel, so it gets the weight: a brass sill, a hot line along it,
			// and the shadow it throws onto the symbol underneath. That shadow is
			// the only thing putting the shutter IN FRONT of the board rather than
			// beside it.
			const sill = Math.min(12, gap);
			g.rect(cx - W / 2, gap - sill, W, sill);
			g.fill({ color: BRASS_MID });
			g.rect(cx - W / 2, gap - sill, W, Math.max(1.5, sill * 0.3));
			g.fill({ color: BRASS_LIT, alpha: 0.95 });
			g.rect(cx - W / 2, gap - 2, W, 2);
			g.fill({ color: BRASS_DARK, alpha: 0.9 });
			g.rect(cx - W / 2, gap, W, 9);
			g.fill({ color: 0x000000, alpha: 0.42 });
			g.rect(cx - W / 2, gap, W, 3);
			g.fill({ color: 0x000000, alpha: 0.35 });

			// While it is actually travelling the sill runs hot. It is the cheapest
			// way to say the shutter MOVED rather than simply being somewhere new,
			// and it is only ever on for the few frames of the climb.
			const speed = Math.min(1, Math.abs(vel[reel] ?? 0) / 6);
			if (speed > 0.02) {
				g.rect(cx - W / 2, gap - sill, W, sill);
				g.fill({ color: 0xd8f4ff, alpha: 0.5 * speed });
			}
		}
	};
</script>

<BoardContainer>
	<Graphics {draw} />
</BoardContainer>
