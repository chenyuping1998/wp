<script lang="ts" module>
	export type EmitterEventBanditMeter = {
		type: 'banditLevelUp';
		level: number;
		mult: number;
		spinsAdded: number;
		levelsGained?: number;
		opening?: boolean;
	};
</script>

<script lang="ts">
	/**
	 * THE UPGRADE, on the course postcard (2026-10-18).
	 *
	 * The first version was program art on a skewed paper polygon: a drawn
	 * circle for a ball, a drawn ellipse for a hole, dot rungs and a red square
	 * stamp — the user called it bare. It is now staged on the FG board itself
	 * (v8FgIntro, design/build_putt_fg_sign.py) with the game's own drawings:
	 *
	 *   board     drops in and settles, like the FG intro
	 *   per rung  the low flag springs up on the course view; the caddie lines
	 *             up and putts a real ball across the lawn; it knocks the flag
	 *             clean off its card (it tumbles away, ink burst, frame hit);
	 *             the prize ball drops into the empty spot over a turning sun
	 *             and squashes on landing; the rung's golden flag pops on
	 *   result    the prize stays proud under the sun, "+N" lands beside it
	 *
	 * Timings, sounds and the book's meaning are the old ones: LEAD/STEP/CUT and
	 * the roll / cup / ladder / stamp cues fire at the same moments.
	 */
	import InkNumber from './InkNumber.svelte';
	import FxBurst from './FxBurst.svelte';
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, SpineProvider, SpineTrack, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';
	import config from '../game/config';
	import { ballRoll, cardHit, prizeSquash, rungPopAt, signalAt, HIT_STOP, ROLL_MS } from '../game/upgradeMotion';

	const context = getContext();
	const INK = 0x1b2a22, RED = 0xe5432f, ORANGE = 0xf27a1a, GOLD = 0xffcf4a;
	const LEAD = 360, STEP = 2200, CUT = 950, HOLD = 1200, OUT = 380;
	let active = $state(false), elapsed = $state(0), level = $state(0), spins = $state(0);
	let steps = $state<number[]>([]);
	let opening = $state(false);
	let raf = 0;
	let finish: (() => void) | undefined;
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	const back = (p: number) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
	const easeOut = (p: number) => 1 - (1 - p) ** 3;
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	// the postcard is 1600x1000; its course view is the top 43%, the paper
	// panel y 0.452..0.95 (FreeSpinAnimation's PAPER)
	const W = $derived(Math.min(layout.width * .94, (layout.height * .78) * 1.6, 900));
	const BH = $derived(W / 1.6);
	const FLOOR = $derived(BH * (.40 - .5)); // the view's lawn, board-centred
	const PAPER_TOP = $derived(BH * (.452 - .5));
	const PAPER_BOT = $derived(BH * (.95 - .5));
	const card = $derived(W * .25);
	const SLOT = $derived({ x: -W * .14, y: FLOOR - card * .42 });
	const index = $derived(Math.min(steps.length - 1, Math.max(0, Math.floor((elapsed - LEAD) / STEP))));
	const phase = $derived(Math.max(0, elapsed - LEAD - index * STEP));
	const lastStep = $derived(index === steps.length - 1);
	const plate = $derived(clamp((phase - CUT - 260) / 390));
	const resultAt = $derived(LEAD + steps.length * STEP);
	const duration = $derived(resultAt + HOLD + OUT);
	const alpha = $derived(Math.min(clamp(elapsed / 150), 1 - clamp((elapsed - duration + OUT) / OUT)));
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const cutSymbolKey = $derived(`gb${config.banditMeter.replacements[(steps[index] ?? level) - 1] ?? 'L5'}`);
	const shake = $derived(phase >= CUT && phase < CUT + 200 ? Math.sin((phase - CUT) * .16) * 7 * (1 - (phase - CUT) / 200) : 0);
	const result = $derived(elapsed >= resultAt);
	const stampAge = $derived(elapsed - resultAt);
	const currentRung = $derived(steps[index] ?? level);
	const rungRevealed = (rung: number) => result ? rung <= level : rung < currentRung || (rung === currentRung && plate > .75);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({ fontFamily: NUMBER_FONT, fontSize: W * .05, fill: RED }));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel, replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W * .02 + W * .085);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);

	// the board drops in once and settles; it does not re-drop per rung
	const boardDrop = $derived.by(() => {
		const k = clamp(elapsed / 520);
		return { y: -layout.height * .7 * (1 - back(k)), rot: .03 * Math.sin(Math.PI * k) * (1 - k) };
	});
	const boardSettle = $derived.by(() => {
		const t = elapsed - 520;
		return t < 0 || t > 900 ? 0 : Math.sin(t / 70) * Math.exp(-t / 220);
	});

	// the low flag on its card: springs up, then is knocked away by the ball
	const flagPose = $derived.by(() => {
		if (result) return null;
		const up = back(clamp(phase / 420));
		if (phase < CUT) {
			// a small brace as the ball comes, so the hit lands on something
			const brace = clamp((phase - CUT + 160) / 160);
			return { x: SLOT.x, y: SLOT.y, rot: -.04 * brace, sx: up * (1 + .05 * brace), sy: up * (1 - .07 * brace), alpha: 1 };
		}
		// the hit: flattened against the ball for HIT_STOP, then thrown
		// (upgradeMotion.cardHit, 2026-10-23)
		const { smear, fly: k } = cardHit(phase, CUT);
		return {
			x: SLOT.x - W * .34 * easeOut(k) - card * .06 * smear,
			y: SLOT.y - card * 1.1 * Math.sin(Math.PI * k * .8) + card * .9 * k * k,
			rot: -2.6 * easeOut(k),
			sx: (1 - .25 * k) * (1 - .28 * smear), sy: (1 - .25 * k) * (1 + .12 * smear),
			alpha: 1 - clamp((k - .55) / .45),
		};
	});

	// THE CADDIE IS THE REAL CAST (2026-10-23): the FG figure's own Spine
	// (gbLookout), not the still cut-in tilted about its feet. He walks on with
	// the board and starts each putt like a race with his 'signal' clip — flag
	// up, a crouch into it, down on the ball the instant it goes
	// (design/swing/build_caddie_flag.mjs; upgradeMotion.signalAt lines the
	// clip's hit up with the ball). Between putts, and on the result, he idles.
	const caddiePose = $derived.by(() => {
		const enter = easeOut(clamp(elapsed / 560));
		return {
			// .30W keeps his right edge inside the board (portrait fills the width)
			x: W * .3 + W * .3 * (1 - enter),
			alpha: (result ? .9 : 1) * enter,
		};
	});
	// the cut-in's figure was .393W tall; the skeleton's is 817 units, feet on its origin
	const CADDIE_SCALE = $derived((W * .393) / 817);
	const signalling = $derived(!result && phase >= signalAt(CUT));

	// the putt: from the caddie's feet along the lawn into the flag's card
	const BALL_FROM = $derived({ x: W * .16, y: FLOOR - W * .03 });
	const BALL_TO = $derived({ x: SLOT.x + card * .34, y: FLOOR - W * .03 });
	const ball = $derived.by(() => {
		if (result || phase < CUT - ROLL_MS || phase > CUT + 420) return null;
		if (phase < CUT) {
			// struck: it leaves at its fastest and is still going at the card
			const k = clamp((phase - CUT + ROLL_MS) / ROLL_MS);
			const x = BALL_FROM.x + (BALL_TO.x - BALL_FROM.x) * ballRoll(k);
			return { x, y: BALL_FROM.y, rot: (x - BALL_FROM.x) / (W * .028), alpha: 1, trail: k };
		}
		// it bounces back a little off the card and stops
		const k = clamp((phase - CUT - HIT_STOP) / (420 - HIT_STOP));
		return {
			x: BALL_TO.x + W * .06 * easeOut(k), y: BALL_TO.y - W * .04 * Math.sin(Math.PI * clamp(k * 1.6)),
			rot: (BALL_TO.x - BALL_FROM.x) / (W * .028) - k * 2, alpha: 1 - clamp((k - .6) / .4), trail: 0,
		};
	});

	// the prize drops into the empty spot: falls, squashes, settles
	const prize = $derived.by(() => {
		const t = result ? 9999 : phase - CUT - 200;
		if (t < 0) return null;
		const fall = clamp(t / 300);
		const land = t - 300;
		// a hit: from no squash to its peak in ~50ms and back on the spring
		// (it used to jump to full squash on the landing frame)
		const squash = prizeSquash(land);
		const out = !result && !lastStep ? clamp((phase - STEP + 260) / 220) : 0;
		return {
			x: SLOT.x,
			y: SLOT.y - W * .5 * (1 - fall * fall),
			sx: 1 + .2 * squash, sy: 1 - .24 * squash,
			alpha: 1 - out,
			rays: clamp((t - 120) / 380) * (1 - out),
		};
	});
	const rayTurn = $derived(elapsed / 2400);

	// one ring off the landing; nothing else drawn in code
	const drawRing = (g: PixiGraphics) => {
		g.clear();
		const t = result ? -1 : phase - CUT - 500;
		if (t < 0 || t > 520) return;
		const k = t / 520;
		g.circle(SLOT.x, SLOT.y + card * .1, card * (.4 + .5 * easeOut(k)))
			.stroke({ width: 6 * (1 - k), color: GOLD, alpha: 1 - k });
	};
	const drawTrail = (g: PixiGraphics) => {
		g.clear();
		if (!ball || ball.trail <= .05) return;
		const len = W * .16 * ball.trail;
		for (let i = 0; i < 3; i++) {
			const y = ball.y + (i - 1) * W * .011;
			g.moveTo(ball.x + W * .03, y).lineTo(ball.x + W * .03 + len * (1 - .25 * Math.abs(i - 1)), y)
				.stroke({ width: 3, color: 0xffffff, alpha: .55 * ball.trail });
		}
	};

	// clear of the caddie on the right and the paper's grass tufts on the left
	const rungX = (rung: number) => (rung - 2) * W * .17 - W * .12;
	const RUNG_Y = $derived(PAPER_TOP + (PAPER_BOT - PAPER_TOP) * .5);
	const rungPop = (rung: number) => (rung === currentRung && !result ? rungPopAt(phase, CUT) : 1);
	const drawRail = (g: PixiGraphics) => {
		g.clear();
		const y = RUNG_Y + W * .04;
		g.moveTo(rungX(1), y).lineTo(rungX(3), y).stroke({ width: W * .008, color: INK, alpha: .25 });
		const revealed = result ? level : currentRung - 1 + (plate > .75 ? 1 : 0);
		if (revealed > 1) g.moveTo(rungX(1), y).lineTo(rungX(Math.min(3, revealed)), y).stroke({ width: W * .008, color: RED });
	};

	const stop = () => { cancelAnimationFrame(raf); active = false; const done = finish; finish = undefined; done?.(); };
	onDestroy(stop);
	context.eventEmitter.subscribeOnMount({
		banditLevelUp: (event) => new Promise<void>((resolve) => {
			stop();
			level = event.level; spins = event.spinsAdded; opening = event.opening ?? false;
			const gained = Math.min(event.level, Math.max(1, event.levelsGained ?? 1));
			steps = Array.from({ length: gained }, (_, i) => event.level - gained + i + 1);
			elapsed = 0; active = true; finish = resolve;
			let previous = performance.now();
			const windups = new Set<number>(), chops = new Set<number>(), reveals = new Set<number>();
			let stamped = false;
			const tick = (now: number) => {
				elapsed += Math.min(80, Math.max(0, now - previous)); previous = now;
				for (let i = 0; i < steps.length; i++) {
					const local = elapsed - LEAD - i * STEP;
					if (local >= CUT - 250 && !windups.has(i)) { windups.add(i); context.eventEmitter.broadcast({ type: 'soundGolfRoll' }); }
					if (local >= CUT && !chops.has(i)) {
						chops.add(i); context.eventEmitter.broadcast({ type: 'soundGolfCup' });
						context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.5 });
					}
					if (local >= CUT + 560 && !reveals.has(i)) { reveals.add(i); context.eventEmitter.broadcast({ type: 'soundLadderUp', level: steps[i] }); }
				}
				if (!opening && !stamped && elapsed >= resultAt + 190) { stamped = true; context.eventEmitter.broadcast({ type: 'soundStamp' }); }
				if (elapsed >= duration) { stop(); return; }
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		}),
	});
</script>

{#if active}
	<MainContainer>
		<Rectangle width={layout.width} height={layout.height} backgroundColor={INK} alpha={.65 * alpha} />
		<Container x={layout.width / 2 + shake} y={layout.height * .47 + boardDrop.y} rotation={boardDrop.rot} {alpha}
			scale={{ x: 1 + boardSettle * .02, y: 1 - boardSettle * .025 }}>
			<Sprite key="v8FgIntro" anchor={.5} width={W} height={BH} />

			<!-- the sun behind the prize: the board's own ray art, turning slowly -->
			{#if prize && prize.rays > 0}
				<Sprite key="v8Ray" anchor={.5} x={SLOT.x} y={SLOT.y} width={card * 2.3} height={card * 2.3}
					rotation={rayTurn} tint={GOLD} alpha={.6 * prize.rays} />
			{/if}

			<!-- the caddie, lining up the putt from the right -->
			<Container x={caddiePose.x} y={PAPER_BOT - W * .02} alpha={caddiePose.alpha}>
				{#key index}
					<SpineProvider key="gbLookout" x={0} y={0} scale={CADDIE_SCALE}>
						<!-- the result: he jumps and points (his 'cheer', PUTT_動畫需求單 §1) -->
						<SpineTrack trackIndex={0} animationName={result ? 'cheer' : signalling ? 'signal' : 'idle'} loop={!result && !signalling}
							{...{ mixDuration: 0.16 }} />
						<SpineTrack trackIndex={1} animationName="flutter" loop />
					</SpineProvider>
				{/key}
			</Container>

			{#if flagPose}
				<Container x={flagPose.x} y={flagPose.y + card * .42} rotation={flagPose.rot}
					scale={{ x: flagPose.sx, y: flagPose.sy }} alpha={flagPose.alpha}>
					<Sprite key={cutSymbolKey} anchor={{ x: .5, y: .92 }} width={card} height={card} />
				</Container>
			{/if}

			<Graphics draw={drawTrail} />
			{#if ball}
				<Sprite key="gbP" anchor={.5} x={ball.x} y={ball.y} rotation={ball.rot} alpha={ball.alpha}
					width={W * .056} height={W * .056} />
			{/if}
			{#key index}
				{#if !result && phase >= CUT}
					<FxBurst x={BALL_TO.x - card * .12} y={BALL_TO.y - card * .2} scale={W / 520} />
				{/if}
			{/key}

			{#if prize}
				<Container x={prize.x} y={prize.y + card * .42} scale={{ x: prize.sx, y: prize.sy }} alpha={prize.alpha}>
					<Sprite key="gbP" anchor={{ x: .5, y: .92 }} width={card * .92} height={card * .92} />
				</Container>
			{/if}
			<Graphics draw={drawRing} />

			<!-- the paper: headline, the three rungs as golden flags, the note -->
			<Text visible={!result || opening} text={result ? resultHeadline : gameText('chefSlice')} anchor={.5}
				x={-W * .08} y={PAPER_TOP + W * .045} scale={result ? 1 + .14 * (1 - clamp(stampAge / 240)) : 1}
				style={{ fontFamily: GAME_FONT, fontSize: W * .05, fontWeight: GAME_FONT_WEIGHT, fill: RED,
					stroke: { color: INK, width: 7, join: 'round' }, letterSpacing: 1 }} />
			{#if !result}
				<Graphics draw={drawRail} />
				{#each [1, 2, 3] as rung (rung)}
					<Container x={rungX(rung)} y={RUNG_Y} scale={rungPop(rung)} alpha={rungRevealed(rung) ? 1 : .38}>
						<Sprite key="gbS" anchor={{ x: .5, y: .85 }} width={W * .075} height={W * .075} />
						<Text text={`${config.banditMeter.thresholds[rung - 1]}`} anchor={.5} x={W * .045} y={-W * .03}
							style={{ fontFamily: NUMBER_FONT, fontSize: W * .03, fill: rungRevealed(rung) ? RED : INK }} />
						<Text text={`${removedLabelAtLevel(rung)}→P`} anchor={.5} y={W * .055}
							style={{ fontFamily: GAME_FONT, fontSize: W * .026, fontWeight: GAME_FONT_WEIGHT, fill: rungRevealed(rung) ? RED : INK }} />
					</Container>
				{/each}
			{/if}
			{#if result && !opening}
				<!-- "+N" lands beside the prize, on the view -->
				<Container x={SLOT.x + card * .95} y={SLOT.y - card * .05 - W * .04 * (1 - clamp(stampAge / 260))}
					rotation={-.07 - .1 * (1 - clamp(stampAge / 260))} scale={back(clamp(stampAge / 320))}>
					<InkNumber text={`+${spins}`} fontSize={W * .1} role="plate" />
					<Text text="SPINS" anchor={.5} y={W * .07}
						style={{ fontFamily: GAME_FONT, fontSize: W * .042, fontWeight: GAME_FONT_WEIGHT, fill: 0xfff6df,
							stroke: { color: INK, width: 7, join: 'round' } }} />
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{ x: 0, y: .5 }} x={-W * .08 - replacementRowWidth / 2} y={RUNG_Y} style={replacementStyle} />
				<Sprite key="gbP" anchor={.5} x={-W * .08 + replacementRowWidth / 2 - W * .042} y={RUNG_Y} width={W * .085} height={W * .085} />
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} x={-W * .08} y={PAPER_BOT - W * .04}
				style={{ fontFamily: GAME_FONT, fontSize: W * .026, fontWeight: GAME_FONT_WEIGHT, fill: INK }} />
		</Container>
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
