<script lang="ts" module>
	// The rail along the top beam: 12 talisman slots that fill as sweeps happen,
	// with milestones at 5, 9 and 12 that pay free spins and raise the collector
	// multiplier floor.
	//
	// `filled` always arrives as the count AFTER the advance. This component never
	// increments anything of its own — a count maintained on the client is the
	// classic way a meter and its maths drift apart across a retrigger.
	export type EmitterEventTalismanRail =
		| {
				type: 'railAdvancePlay';
				filled: number;
				total: number;
				awardedFs: number;
				collectMultiplier: number;
		  }
		| { type: 'railShow' }
		| { type: 'railHide' }
		| { type: 'railReset' };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { getSymbolX } from '../game/utils';
	import { SYMBOL_SIZE, NUM_REELS, RAIL_CELL_RATIO, RAIL_GAP_ABOVE_BOARD } from '../game/constants';
	import { RAIL_MILESTONES, RAIL_TOTAL } from '../game/types';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	const WOOD_DARK = 0x3a2418;
	const WOOD_MID = 0x6b4226;
	const BRASS = 0xa8763e;
	const BRASS_HI = 0xd9a85c;
	const TALISMAN = 0xf2d544;
	const CINNABAR = 0xc8102e;

	const SLOT_STAMP_MS = 220;
	const MILESTONE_FLARE_MS = 900;

	let visible = $state(false);
	// Which slot is mid-stamp, so it can pop rather than just appear.
	let stampingSlot = $state(-1);
	let stampT = $state(0);
	let flareT = $state(0);
	// What the milestone actually paid. Read from the event rather than assumed:
	// RAIL_MILESTONES says 8 today, and a hardcoded label is how a meter starts
	// lying after someone tunes the maths.
	let flareAward = $state(0);
	let raf = 0;

	const stop = () => {
		cancelAnimationFrame(raf);
		raf = 0;
	};

	/** Run a 0..1 ramp over `ms`, writing it through `set`. */
	const ramp = (ms: number, set: (v: number) => void) =>
		new Promise<void>((resolve) => {
			const t0 = performance.now();
			const step = (now: number) => {
				const t = (now - t0) / ms;
				if (t >= 1) {
					set(1);
					stop();
					resolve();
					return;
				}
				set(t);
				raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
		});

	context.eventEmitter.subscribeOnMount({
		railAdvancePlay: async ({ filled, total, awardedFs, collectMultiplier }) => {
			// Assigned, never incremented. The event carries the count after the
			// advance precisely so this component has nothing of its own to keep
			// in step across a retrigger.
			stateGame.railFilled = filled;
			stateGame.railTotal = total;
			stateGame.collectMultiplier = collectMultiplier;
			visible = true;

			stampingSlot = filled - 1;
			await ramp(SLOT_STAMP_MS, (v) => (stampT = v));
			stampingSlot = -1;

			if (awardedFs > 0) {
				// Milestones are the loudest thing the feature does short of a big
				// win: the whole rail flares and the award reads out.
				flareAward = awardedFs;
				await ramp(MILESTONE_FLARE_MS, (v) => (flareT = v));
				flareT = 0;
				flareAward = 0;
			}
		},
		railShow: () => (visible = true),
		railHide: () => (visible = false),
		railReset: () => {
			stop();
			stateGame.railFilled = 0;
			stateGame.collectMultiplier = 1;
			stampingSlot = -1;
			flareT = 0;
			flareAward = 0;
		},
	});

	onDestroy(stop);

	// Geometry, in BOARD units so the rail scales with the board it sits on.
	// check_board_fit.mjs verifies the headroom this needs exists on every
	// layout preset - if these change, that guard is the thing that catches it.
	const slotSize = SYMBOL_SIZE * RAIL_CELL_RATIO;
	const beamY = -RAIL_GAP_ABOVE_BOARD - slotSize * 0.5;
	const boardWidth = SYMBOL_SIZE * NUM_REELS;
	const leftEdge = getSymbolX(0) - SYMBOL_SIZE * 0.5;
	// Slots are laid across the full board width, so the rail reads as belonging
	// to the reels underneath rather than floating over them.
	const step = boardWidth / RAIL_TOTAL;
	const slotX = (i: number) => leftEdge + step * (i + 0.5);

	// Widened off the `as const` tuple: `has()` on a Set<5|9|12> rejects a plain
	// number, and the slot index being checked is computed.
	const milestoneSlots = new Set<number>(RAIL_MILESTONES.map((m) => m.slot));

	// ── the rail's three rows, measured from the beam in SLOTS ───────────────
	//
	// Top to bottom:
	//
	//   CAPTION_ROW   "SEALED n / 12" on the left, "COLLECT xN" on the right
	//   WILD_ROW      a WILD at each milestone column - what the rail is FOR
	//   the sockets   at the beam itself
	//   the awards    on the beam's face, under the milestone sockets
	//
	// The wilds and the captions are on separate rows because they collide
	// otherwise: the last milestone is slot 12, whose column is the right-hand end
	// of the run, and that is exactly where the multiplier readout is anchored.
	//
	// PLATE_TOP_SLOTS is what design/check_board_fit.mjs models the rail's reach
	// with. If any of these change, that number has to, and the guard has to be
	// re-run - the rail draws in negative board space and nothing else can tell
	// you it has gone off the top of the screen.
	const CAPTION_ROW = 1.35;
	const WILD_ROW = 0.86;
	const WILD_SIZE = 0.66;
	const PLATE_TOP_SLOTS = 1.62;
	// talisman_flat.png is 192x267. Named here so the sprite keeps its proportions
	// when the socket height changes; design/generate_talisman_spin.mjs is where
	// the source lives if the art is redrawn.
	const TALISMAN_ASPECT = 192 / 267;
	const easeOut = (t: number) => 1 - (1 - t) ** 3;
</script>

{#if visible}
	<Container>
		<Graphics
			draw={(g) => {
				g.clear();

				// Pixi v8's explicit API: roundRect()/fill() and roundRect()/stroke().
				// The v7 compat calls share one deferred style and a stroked shape
				// after a filled one picks up the fill.

				// ── the beam ────────────────────────────────────────────────────
				//
				// A lit plate behind the whole run, not just a bar under it. The rail
				// is the feature's scoreboard and it was the dimmest thing on screen:
				// a dark beam carrying dark sockets, against a lit wooden housing. It
				// now sits on its own ground with a brass edge, which is what makes it
				// read as an instrument rather than as part of the carving.
				const plateTop = beamY - PLATE_TOP_SLOTS * slotSize;
				const plateH = slotSize * (PLATE_TOP_SLOTS + 0.9);
				const plateX = leftEdge - slotSize * 0.24;
				const plateW = boardWidth + slotSize * 0.48;
				g.roundRect(plateX, plateTop, plateW, plateH, slotSize * 0.22);
				g.fill({ color: 0x0b1420, alpha: 0.82 });
				g.roundRect(plateX, plateTop, plateW, plateH, slotSize * 0.22);
				g.stroke({ width: 3, color: BRASS, alpha: 0.85 });

				const beamH = slotSize * 0.34;
				g.roundRect(leftEdge, beamY + slotSize * 0.45, boardWidth, beamH, beamH * 0.3);
				g.fill({ color: WOOD_DARK, alpha: 1 });
				g.roundRect(leftEdge, beamY + slotSize * 0.45, boardWidth, beamH * 0.28, beamH * 0.2);
				g.fill({ color: WOOD_MID, alpha: 0.7 });

				// a milestone flare washes the whole beam, not just the slot -
				// what changed is the run, not one square
				// NO WASH ACROSS THE RAIL.
				//
				// A milestone used to fill a talisman-yellow rectangle the full width
				// of the beam, a slab standing behind all twelve sockets at once. It
				// says the wrong thing twice over: the milestone happened at ONE
				// socket, not along the whole rail, and the RailMilestone plaque is
				// already on screen announcing it in words.
				//
				// What is left is local - see the slot loop, where the socket that was
				// just reached brightens on its own.

				// ── the slots ──────────────────────────────────────────────────
				for (let i = 0; i < RAIL_TOTAL; i++) {
					const x = slotX(i);
					const filled = i < stateGame.railFilled;
					const isMilestone = milestoneSlots.has(i + 1);
					const half = slotSize * 0.5;

					// a slot mid-stamp overshoots, so the talisman lands rather
					// than fades in
					const scale = i === stampingSlot ? 1 + 0.45 * (1 - easeOut(stampT)) : 1;
					const w = slotSize * 0.62 * scale;
					const h = slotSize * 0.9 * scale;

					// The socket that just completed a milestone lights up, and only
					// that one. A ring on the thing that happened, in the rail's own
					// brass, rather than a colour wash over everything beside it.
					const flaring = flareT > 0 && isMilestone && i === stampingSlot;
					const pulse = flaring ? Math.sin(flareT * Math.PI) ** 2 : 0;

					// the empty socket
					g.roundRect(x - half * 0.66, beamY - half * 0.95, half * 1.32, half * 1.9, 3);
					g.stroke({
						width: flaring ? 2 + 2 * pulse : 2,
						color: isMilestone ? BRASS_HI : BRASS,
						alpha: flaring ? 0.7 + 0.3 * pulse : filled ? 0.35 : 0.7,
					});

					if (flaring) {
						// One soft ring outside the socket, so the light has somewhere to
						// fall off. Its width is bounded by the SLOT SPACING and not
						// chosen: twelve sockets across the board leaves 43.3px a slot,
						// and a ring at half * 1.8 is 51.5px - it would overlap the
						// sockets either side and light three where one was reached.
						const grow = Math.min(half * 0.9, step * 0.46);
						g.roundRect(x - grow, beamY - half * 1.25, grow * 2, half * 2.5, 4);
						g.stroke({ width: 3, color: BRASS_HI, alpha: 0.3 * pulse });
					}

					if (!filled) continue;

					// The talisman itself is a SPRITE, drawn below - see the {#each} that
					// follows this Graphics. It was drawn here in vectors, as a yellow
					// rounded rectangle with a cinnabar line down it, and that is not the
					// object the rest of the game uses: what flies up off the board is a
					// gold plaque with an ornate border and a key-fret centre. A player
					// watched one lift from the board and land here as something else.
					//
					// Only the socket furniture is drawn in this pass now.
					if (isMilestone) {
						g.roundRect(x - w * 0.58, beamY - h * 0.58, w * 1.16, h * 1.16, w * 0.18);
						g.stroke({ width: 2.5, color: BRASS_HI, alpha: 0.95 });
					}
				}
			}}
		/>

		<!--
			What the rail IS, and how far along it is.

			It had neither. Twelve sockets on a beam with talismans appearing in
			them is legible as "something is filling up" and as nothing else - not
			what fills it, not what happens when it does, not how many are left. A
			player watching their first feature had to infer the whole mechanic from
			a row of squares.

			Three things say it now: this caption with the running count, the award
			printed under each milestone socket, and the multiplier readout on the
			right. All three are drawn from RAIL_MILESTONES rather than typed, so a
			maths change moves the labels with the sockets.

			"SEALED" and not "COLLECTED": both are clean in social play, and the
			first is the game's own word for what a filled slot means.
		-->
		<Text
			text={`SEALED ${stateGame.railFilled} / ${RAIL_TOTAL}`}
			x={leftEdge}
			y={beamY - slotSize * CAPTION_ROW}
			anchor={{ x: 0, y: 0.5 }}
			style={{
				fontFamily: GAME_FONT,
				fontSize: slotSize * 0.36,
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 1,
				fill: TALISMAN,
				stroke: { color: 0x1a1008, width: slotSize * 0.05 },
			}}
		/>

		<!--
			The collected talismans.

			Sprites rather than vectors, and the same sprite the burst throws, so the
			slip that lifts off the board is the slip that lands in the socket. The
			stamping one overshoots and settles, which is what makes it read as
			landing rather than as appearing.
		-->
		{#each { length: RAIL_TOTAL } as _, i (i)}
			{#if i < stateGame.railFilled}
				{@const stamping = i === stampingSlot}
				{@const scale = stamping ? 1 + 0.45 * (1 - easeOut(stampT)) : 1}
				{@const h = slotSize * 0.9 * scale}
				<Sprite
					key="mcTalisman"
					anchor={0.5}
					x={slotX(i)}
					y={beamY}
					width={h * TALISMAN_ASPECT}
					height={h}
					alpha={stamping ? 0.6 + 0.4 * stampT : 1}
				/>
			{/if}
		{/each}

		<!--
			A WILD over each milestone, which is the thing the rail is actually about.

			The numbers under the sockets say "+8 x2", and a player who has not read
			the rules has no way to know what the x2 applies to. The wild is what
			collects in this feature, and the rail makes it stronger - so the rail
			shows a row of wilds getting brighter and bigger as it fills, and the
			figure under each one says by how much.

			Dim and small until reached, lit and full size afterwards. The step is
			deliberately large: a 40% size difference is legible from across the
			board in a way a change of alpha alone is not.
		-->
		{#each RAIL_MILESTONES as milestone (`w${milestone.slot}`)}
			{@const reached = stateGame.railFilled >= milestone.slot}
			{@const size = slotSize * WILD_SIZE * (reached ? 1 : 0.72)}
			<Sprite
				key="mcW"
				anchor={0.5}
				x={slotX(milestone.slot - 1)}
				y={beamY - slotSize * WILD_ROW}
				width={size}
				height={size}
				alpha={reached ? 1 : 0.4}
			/>
		{/each}

		<!--
			The award at each milestone: the free spins it adds and the multiplier it
			steps to. Dim until reached, lit afterwards, so the rail reads as a route
			with three stops on it rather than as a bar.

			Printed ON the beam rather than under the socket. Under it would put the
			text between the rail and the board, where there are seven board units of
			clearance - it would have sat on the top row of symbols. Above the beam
			would have pushed the rail's reach past what design/check_board_fit.mjs
			allows on the tightest preset. The beam is the one surface here with
			room on it, and a label carved into the wood the sockets are set in is
			where it belongs anyway.
		-->
		{#each RAIL_MILESTONES as milestone (milestone.slot)}
			{@const reached = stateGame.railFilled >= milestone.slot}
			<Text
				text={`+${milestone.freeSpins}  x${milestone.collectMultiplier}`}
				x={slotX(milestone.slot - 1)}
				y={beamY + slotSize * 0.62}
				anchor={{ x: 0.5, y: 0.5 }}
				alpha={reached ? 1 : 0.45}
				style={{
					fontFamily: GAME_FONT,
					fontSize: slotSize * 0.24,
					fontWeight: GAME_FONT_WEIGHT,
					fill: reached ? TALISMAN : BRASS,
					stroke: { color: 0x1a1008, width: slotSize * 0.04 },
				}}
			/>
		{/each}

		<!--
			The multiplier the rail has unlocked. Only drawn once it is above 1,
			because x1 is not a state worth a label - it is just the game.

			It scales the WHOLE collect, not one symbol, so the label says so. An
			earlier draft raised a floor on a collector symbol's own multiplier and
			read "MIN xN"; there is no collector symbol any more.
		-->
		<!--
			Shown at x1 too, now. The earlier note argued that "x1 is not a state
			worth a label - it is just the game", which is true in isolation and
			wrong in a row: with the label appearing only above x1, the readout's
			ARRIVAL was the only signal, and a player who looked away missed the one
			frame that explained what the rail had just done. A field that is always
			there and changes is easier to read than one that appears.
		-->
		{#if true}
			<Text
				text={`COLLECT x${stateGame.collectMultiplier}`}
				x={leftEdge + boardWidth}
				y={beamY - slotSize * CAPTION_ROW}
				anchor={{ x: 1, y: 0.5 }}
				style={{
					fontFamily: GAME_FONT,
					fontSize: slotSize * 0.42,
					fontWeight: GAME_FONT_WEIGHT,
					fill: BRASS_HI,
					stroke: { color: 0x1a1008, width: slotSize * 0.06 },
				}}
			/>
		{/if}

		{#if flareT > 0}
			<Text
				text={`+${flareAward}`}
				x={leftEdge + boardWidth * 0.5}
				y={beamY - slotSize * (0.9 + easeOut(flareT) * 0.8)}
				anchor={{ x: 0.5, y: 0.5 }}
				alpha={Math.sin(flareT * Math.PI) ** 0.6}
				style={{
					fontFamily: GAME_FONT,
					fontSize: slotSize * 0.9,
					fontWeight: GAME_FONT_WEIGHT,
					fill: TALISMAN,
					stroke: { color: CINNABAR, width: slotSize * 0.1 },
				}}
			/>
		{/if}
	</Container>
{/if}
