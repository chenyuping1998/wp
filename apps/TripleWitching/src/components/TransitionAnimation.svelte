<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// The transition is a trading halt.
	//
	// It used to be a bomb: the symbol dropped in, blinked, and blew up in a
	// shower of shrapnel over a white flash - fragments that were still tinted
	// leaf-green, because the effect was inherited from a jungle game and never
	// re-themed. A triple witching is not an explosion. It is a position going the
	// wrong way and the desk pulling the plug, so that is what this plays:
	//
	//   ARM    the TRIPLE WITCHING sigil drops in and locks on
	//   LOCK   the alarm sounds while the sigil blinks red
	//   CRASH  a price line rips in from the left, tops out at the sigil, and
	//          dives off the bottom of the screen while red floods up
	//   HALT   circuit-breaker shutters slam in from top and bottom and meet
	//   OPEN   they retract to reveal whatever is next
	//
	// Those are four separate beats and they are meant to be heard as four. The
	// alarm belongs to LOCK, on its own, before the line moves: sigil, then sound,
	// then line, then cut.
	//
	// The shutters are the point, not decoration. The old blast peaked at 95%
	// white and cut on that frame, which is nearly opaque but not opaque - and it
	// meant there was no moment the caller could safely rebuild the scene in. The
	// shutters close to solid, so `oncover` is a genuine promise: while it runs,
	// the screen shows nothing. That is where the board is torn down and rebuilt.
	type Props = {
		/** Fired while the screen is fully covered. Change the scene here. */
		oncover?: () => void;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const ARM_MS = 380; // sigil drops in from the top, face-on
	const LOCK_MS = 420; // armed: the alarm sounds and the sigil blinks red
	const CRASH_MS = 360; // the line rips across and dives
	const CLOSE_MS = 220; // shutters slam shut
	const COVERED_MS = 100; // solid - the scene changes in here
	const OPEN_MS = 300; // shutters retract

	const CRASH_AT = ARM_MS + LOCK_MS;
	const CLOSE_AT = CRASH_AT + CRASH_MS;
	const COVERED_AT = CLOSE_AT + CLOSE_MS;
	const OPEN_AT = COVERED_AT + COVERED_MS;
	const TOTAL_MS = OPEN_AT + OPEN_MS;

	const RISE = 0x4bd67f;
	const FALL = 0xff5566;
	const SHUTTER = 0x05080a;

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let covered = false;
	let alarmFired = false;
	let slamFired = false;

	let dropVisible = $state(false);
	let dropY = $state(0);
	let dropScale = $state(1);
	let dropTint = $state(0xffffff);
	/** 0..1 through the crash, -1 before it starts */
	let crashT = $state(-1);
	/** 0 = open, 1 = shut */
	let shutterT = $state(0);

	const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
	const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
	const easeInCubic = (t: number) => clamp01(t) ** 3;

	// The price line, in centred canvas fractions. Deterministic: the same crash
	// every time, because a transition that draws a different shape on every play
	// reads as noise rather than as the game's own punctuation.
	const RUN_UP: [number, number][] = [
		[-0.56, 0.2],
		[-0.48, 0.14],
		[-0.41, 0.19],
		[-0.34, 0.08],
		[-0.27, 0.12],
		[-0.2, 0.01],
		[-0.13, 0.05],
		[-0.07, -0.06],
		[0, -0.12],
	];
	// Three points, not one, so the dive has a shape: a stall, then the drop, then
	// straight through the floor.
	const DIVE: [number, number][] = [
		[0.03, 0.04],
		[0.05, 0.34],
		[0.08, 0.72],
	];
	const PATH = [...RUN_UP, ...DIVE];

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			elapsed += now - last;
			last = now;

			const h = context.stateLayoutDerived.canvasSizes().height;

			if (elapsed < ARM_MS) {
				const p = easeOutCubic(elapsed / ARM_MS);
				dropVisible = true;
				dropY = -h * 0.72 * (1 - p);
				dropScale = 0.7 + p * 0.5;
				dropTint = 0xffffff;
			} else if (elapsed < CRASH_AT) {
				// Armed on the spot: the alarm sounds and the sigil blinks red.
				//
				// The alarm fires HERE, not with the crash below. The beat is: the
				// triple witching arrives, it sounds, and only then does the position go.
				// Firing it with the line meant the sound and the picture landed
				// together and the sigil's whole entrance played in silence.
				if (!alarmFired) {
					alarmFired = true;
					context.eventEmitter.broadcast({ type: 'soundAlarm' });
				}
				const p = (elapsed - ARM_MS) / LOCK_MS;
				dropVisible = true;
				dropY = 0;
				dropScale = 1.2 + Math.sin(p * Math.PI * 2) * 0.06;
				dropTint = Math.sin(p * Math.PI * 6) > 0 ? FALL : 0xffffff;
			} else if (elapsed < CLOSE_AT) {
				crashT = (elapsed - CRASH_AT) / CRASH_MS;
				dropVisible = true;
				dropY = 0;
				// the sigil goes hot and shrinks back as the position blows out
				dropScale = 1.26 - 0.16 * crashT;
				dropTint = FALL;
			} else {
				crashT = 1;
				if (!slamFired) {
					slamFired = true;
					context.eventEmitter.broadcast({ type: 'soundSlam' });
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
				}
				if (elapsed < COVERED_AT) {
					// slamming shut - easeIn, so the plates accelerate into each other
					dropVisible = true;
					shutterT = easeInCubic((elapsed - CLOSE_AT) / CLOSE_MS);
				} else if (elapsed < OPEN_AT) {
					dropVisible = false;
					shutterT = 1;
					if (!covered) {
						covered = true;
						props.oncover?.();
					}
				} else {
					dropVisible = false;
					shutterT = 1 - easeOutCubic((elapsed - OPEN_AT) / OPEN_MS);
				}
			}

			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					// Belt and braces: a caller that passed oncover must always get it,
					// even if a frame was dropped across the covered window.
					if (!covered) {
						covered = true;
						props.oncover?.();
					}
					props.oncomplete();
				}
				return;
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	const drawCrash = (g: PixiGraphics) => {
		g.clear();
		if (crashT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();

		// Red floods up from the bottom as the line falls through it.
		const flood = clamp01((crashT - 0.35) / 0.65);
		if (flood > 0) {
			g.rect(-width * 0.5, height * 0.5 - height * 0.8 * flood, width, height * 0.8 * flood);
			g.fill({ color: 0x6b0f1a, alpha: 0.34 * flood });
		}

		// Reveal the path by segment. The last visible segment is drawn part-way,
		// so the line grows continuously instead of snapping a segment at a time.
		const reach = crashT * (PATH.length - 1);
		const at = (i: number): [number, number] => [PATH[i][0] * width, PATH[i][1] * height];

		for (let i = 0; i < PATH.length - 1; i++) {
			if (reach <= i) break;
			const [x0, y0] = at(i);
			const [x1, y1] = at(i + 1);
			const part = Math.min(1, reach - i);
			const ex = x0 + (x1 - x0) * part;
			const ey = y0 + (y1 - y0) * part;
			// Same convention as the backdrop ticker: a segment is coloured by its
			// own direction. The run-up is mostly green, the dive is all red.
			const rising = y1 < y0;
			g.moveTo(x0, y0);
			g.lineTo(ex, ey);
			g.stroke({ width: rising ? 5 : 8, color: rising ? RISE : FALL, alpha: 0.95 });
		}

		// A hot head on the leading edge, so the eye follows the fall.
		if (reach < PATH.length - 1) {
			const i = Math.floor(reach);
			const [x0, y0] = at(i);
			const [x1, y1] = at(i + 1);
			const part = reach - i;
			const hx = x0 + (x1 - x0) * part;
			const hy = y0 + (y1 - y0) * part;
			const hot = y1 < y0 ? RISE : FALL;
			g.circle(hx, hy, 16);
			g.fill({ color: hot, alpha: 0.22 });
			g.circle(hx, hy, 6);
			g.fill({ color: 0xffffff, alpha: 0.9 });
		}
	};

	const drawShutters = (g: PixiGraphics) => {
		g.clear();
		if (shutterT <= 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const half = height * 0.5;
		// Each plate covers half the screen when shut, so together they close on
		// the centre line with no seam.
		const reach = half * shutterT;
		// Overshoot the sides: the canvas can be wider than the layout box.
		const x = -width * 0.6;
		const w = width * 1.2;

		for (const fromTop of [true, false]) {
			const y = fromTop ? -half : half - reach;
			g.rect(x, y, w, reach);
			g.fill({ color: SHUTTER, alpha: 1 });

			// hazard stripes on the plate face, cheap and unmistakably "halted"
			const edgeY = fromTop ? -half + reach : half - reach;
			for (let sx = x; sx < x + w; sx += 34) {
				g.moveTo(sx, fromTop ? -half : half);
				g.lineTo(sx + (fromTop ? 26 : -26), edgeY);
			}
			g.stroke({ width: 5, color: fromTop ? RISE : FALL, alpha: 0.06 });

			// bright leading edge
			g.moveTo(x, edgeY);
			g.lineTo(x + w, edgeY);
			g.stroke({ width: 3, color: fromTop ? RISE : FALL, alpha: 0.85 });
			g.rect(x, fromTop ? edgeY : edgeY - 14, w, 14);
			g.fill({ color: fromTop ? RISE : FALL, alpha: 0.1 });
		}
	};
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	<Graphics draw={drawCrash} />

	{#if dropVisible}
		<Sprite
			key="mcS"
			anchor={0.5}
			x={0}
			y={dropY}
			width={context.stateLayoutDerived.canvasSizes().height * 0.2 * dropScale}
			height={context.stateLayoutDerived.canvasSizes().height * 0.2 * dropScale}
			tint={dropTint}
		/>
	{/if}

	<Graphics draw={drawShutters} />
</Container>
