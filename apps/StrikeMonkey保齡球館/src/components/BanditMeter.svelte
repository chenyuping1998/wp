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
	 * THE UPGRADE, on the lane-side marquee (2026-10-18, as Putt Monkey's).
	 *
	 * The first version was program art on a skewed paper polygon: drawn
	 * spotlights, a drawn circle for a ball, a card split by a mask, dot rungs
	 * and a red square stamp. It is now staged on the FG board itself
	 * (v8FgIntro, design/build_strike_fg_sign.py) with the game's own drawings:
	 *
	 *   board     drops in and settles, like the FG intro
	 *   per rung  the low card springs up on the lane in the alley window; the
	 *             Pinsetter — the real FG cast, its own Spine 'bowl' (2026-10-18,
	 *             as the base-game trigger) — conjures the teal ball on the lane
	 *             at right and bowls it; it rolls into the card and the card
	 *             SHATTERS (CardShatter, ink burst, frame hit); a Pin drops into
	 *             the empty spot over the turning rays and squashes on landing;
	 *             the rung's golden ball lights
	 *   result    the Pin stays proud under the rays, "+N" lands beside it
	 *
	 * The impact / ladder / stamp cues keep their places relative to CUT; CUT
	 * itself now follows the delivery (release + roll), so the rungs are longer.
	 */
	import InkNumber from './InkNumber.svelte';
	import FxBurst from './FxBurst.svelte';
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import CardShatter from './CardShatter.svelte';
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { letterNudge } from '../game/letterCentre';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';
	import config from '../game/config';

	const context = getContext();
	const INK = 0x14262e, RED = 0xe8502e, GOLD = 0xffcf4a;
	// THE DELIVERY, all in units of W so the timing is the same at any size.
	// The Pinsetter's Spine (gbLookout): 735 tall, the ball (136) leaves the
	// hand centred at (-165, 249), turned 58.2° and moving 503 units/s toward
	// the card, at 0.90 s — design/generate_monkey_spine.mjs prints these
	// (`bowl … released at`, `bowl release angle … velocity`). The copy drawn
	// here starts exactly there, so the hand-off is invisible. He stands on
	// the lane line at BOWLER_X.
	const BOWLER_X = .3, BOWLER_H = .235;
	const SK = BOWLER_H / 735; // skeleton unit → W
	const BALL_R = 68 * SK;
	const RELEASE_X = BOWLER_X - 165 * SK, RELEASE_LIFT = 249 * SK;
	const RELEASE_ROT = (-58.2 * Math.PI) / 180; // spine is counter-clockwise
	const HAND_W_PER_MS = (503 * SK) / 1000;
	const BOWL_AT = 40, RELEASE_MS = 900, DROP_MS = 170, ROLL_W_PER_MS = .00075, RAMP_MS = 150;
	// how far down the lane (W) the ball is τ ms after the release: the hand's
	// speed in the air, then it picks up to rolling speed once it lands
	const laneDist = (τ: number) => {
		const air = Math.min(τ, DROP_MS);
		let d = HAND_W_PER_MS * air;
		const σ = Math.max(0, τ - DROP_MS);
		const ramp = Math.min(σ, RAMP_MS);
		d += HAND_W_PER_MS * ramp + (ROLL_W_PER_MS - HAND_W_PER_MS) * ramp * ramp / (2 * RAMP_MS);
		d += ROLL_W_PER_MS * Math.max(0, σ - RAMP_MS);
		return d;
	};
	// the card's right edge on the lane (SLOT.x + .3 card), where the ball meets it
	const HIT_X = -.14 + .25 * .3 + BALL_R;
	const HIT_T = (() => {
		let τ = 0;
		while (laneDist(τ) < RELEASE_X - HIT_X && τ < 3000) τ += 2;
		return τ;
	})();
	const CUT = BOWL_AT + RELEASE_MS + HIT_T;
	const LEAD = 520, STEP = CUT + 1250, HOLD = 1200, OUT = 380;
	let active = $state(false), elapsed = $state(0), level = $state(0), spins = $state(0);
	let steps = $state<number[]>([]);
	let opening = $state(false);
	let raf = 0;
	let finish: (() => void) | undefined;
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	const back = (p: number) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
	const easeOut = (p: number) => 1 - (1 - p) ** 3;
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	// the marquee is 1600x1000; its alley window is the top 43%, the paper
	// y 0.47..0.93 (FreeSpinAnimation's PAPER)
	const W = $derived(Math.min(layout.width * .94, (layout.height * .78) * 1.6, 900));
	const BH = $derived(W / 1.6);
	const FLOOR = $derived(BH * (.405 - .5)); // the lane, just above the window's rule, board-centred
	const PAPER_TOP = $derived(BH * (.47 - .5));
	const PAPER_BOT = $derived(BH * (.93 - .5));
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

	// the low card: springs up on the lane, then is knocked away by the ball
	const cardPose = $derived.by(() => {
		if (result) return null;
		const up = back(clamp(phase / 420));
		if (phase < CUT) {
			// a small brace as the ball comes, so the hit lands on something
			const brace = clamp((phase - CUT + 160) / 160);
			return { x: SLOT.x, y: SLOT.y, rot: -.04 * brace, sx: up * (1 + .05 * brace), sy: up * (1 - .07 * brace), alpha: 1 };
		}
		// from the hit on, CardShatter draws it — in pieces
		return null;
	});
	const shatterT = $derived(!result && phase >= CUT && phase < CUT + 800 ? phase - CUT : -1);

	// the Pinsetter bowls once per rung: idle on his mark, then 'bowl' from
	// BOWL_AT; remounted per rung ({#key index}) so the clip starts afresh
	const bowling = $derived(!result && phase >= BOWL_AT);

	// the delivery: out of his hand, a short drop onto the lane with one small
	// hop, then straight down it into the card — and on through the pieces
	const ball = $derived.by(() => {
		if (result) return null;
		const t = phase - BOWL_AT - RELEASE_MS;
		if (t < 0) return null;
		const hitT = HIT_T;
		// through the pieces it goes on, slowed by the card
		const x = t <= hitT ? W * (RELEASE_X - laneDist(t)) : W * (HIT_X - ROLL_W_PER_MS * .55 * (t - hitT));
		const restY = FLOOR - W * BALL_R;
		const fromY = FLOOR - W * RELEASE_LIFT;
		const y = t < DROP_MS
			? fromY + (restY - fromY) * (t / DROP_MS) ** 2
			: t < DROP_MS + 130 ? restY - W * BALL_R * .35 * Math.sin(Math.PI * (t - DROP_MS) / 130) : restY;
		const alpha = 1 - clamp((t - hitT - 180) / 320);
		if (alpha <= 0) return null;
		return { x, y, rot: RELEASE_ROT + (x - W * RELEASE_X) / (W * BALL_R), alpha, trail: t > DROP_MS + RAMP_MS && t < hitT ? 1 : 0 };
	});
	const BALL_TO = $derived({ x: W * HIT_X, y: FLOOR - W * BALL_R });

	// the ball pops into his hand out of a small burst, as on the main game
	// (Mascot.svelte drawPuff): the hand is at (-304, 422) at 0.16 s
	const PUFF_AT = BOWL_AT + 160, PUFF_MS = 340;
	const drawPuff = (g: PixiGraphics) => {
		g.clear();
		const t = result ? -1 : phase - PUFF_AT;
		if (t < 0 || t > PUFF_MS) return;
		const k = t / PUFF_MS, out = easeOut(k);
		const cx = W * (BOWLER_X - 304 * SK), cy = FLOOR - W * 422 * SK;
		const size = W * BALL_R * 2, r = size * (.45 + .75 * out);
		if (k < .45) g.circle(cx, cy, size * .62 * (1 - k)).fill({ color: 0xfff7d6, alpha: .9 * (1 - k / .45) });
		g.circle(cx, cy, r).stroke({ width: 4 * (1 - k), color: 0x3fc4a8, alpha: 1 - k });
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * Math.PI * 2 + .3, r0 = r * .92, r1 = r * (1.18 + .12 * (i % 2));
			g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0).lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
		}
		g.stroke({ width: 3.5 * (1 - k), color: INK, alpha: 1 - k });
	};

	// the Pin drops into the empty spot: falls, squashes, settles
	const prize = $derived.by(() => {
		const t = result ? 9999 : phase - CUT - 200;
		if (t < 0) return null;
		const fall = clamp(t / 300);
		const land = t - 300;
		const squash = land < 0 ? 0 : Math.exp(-land / 120) * Math.cos(land / 45);
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
		const len = W * .12 * ball.trail;
		const r = W * BALL_R;
		for (let i = 0; i < 3; i++) {
			const y = ball.y + (i - 1) * r * .5;
			g.moveTo(ball.x + r * 1.15, y).lineTo(ball.x + r * 1.15 + len * (1 - .25 * Math.abs(i - 1)), y)
				.stroke({ width: 3, color: 0xffffff, alpha: .55 * ball.trail });
		}
	};

	// clear of the Pinsetter on the right
	const rungX = (rung: number) => (rung - 2) * W * .17 - W * .12;
	const RUNG_Y = $derived(PAPER_TOP + (PAPER_BOT - PAPER_TOP) * .5);
	const rungPop = (rung: number) => rung === currentRung && plate > .75 && plate < 1 ? 1 + .35 * Math.sin(Math.PI * (plate - .75) / .25) : 1;
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
			const windups = new Set<number>(), rolls = new Set<number>(), chops = new Set<number>(), reveals = new Set<number>();
			let stamped = false;
			const tick = (now: number) => {
				elapsed += Math.min(80, Math.max(0, now - previous)); previous = now;
				for (let i = 0; i < steps.length; i++) {
					const local = elapsed - LEAD - i * STEP;
					// his effort on the release, the lane under the ball, then the hit
					if (local >= BOWL_AT + RELEASE_MS && !windups.has(i)) { windups.add(i); context.eventEmitter.broadcast({ type: 'soundMascotVoice', name: 'effort' }); }
					if (local >= BOWL_AT + RELEASE_MS + DROP_MS && !rolls.has(i)) { rolls.add(i); context.eventEmitter.broadcast({ type: 'soundBowlingRoll' }); }
					if (local >= CUT && !chops.has(i)) {
						chops.add(i); context.eventEmitter.broadcast({ type: 'soundChefChop' });
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

			<!-- the rays behind the Pin: the game's own ray art, turning slowly -->
			{#if prize && prize.rays > 0}
				<Sprite key="v8Ray" anchor={.5} x={SLOT.x} y={SLOT.y} width={card * 2.3} height={card * 2.3}
					rotation={rayTurn} tint={GOLD} alpha={.6 * prize.rays} />
			{/if}

			<!-- the Pinsetter on the lane at right, bowling at the card: the FG
			     cast's own Spine and 'bowl' clip (feet on the lane line) -->
			{#key index}
				<SpineProvider key="gbLookout" x={W * BOWLER_X} y={FLOOR} scale={W * SK}>
					<SpineTrack trackIndex={0} animationName={bowling ? 'bowl' : 'idle'} loop={!bowling}
						{...{ mixDuration: 0.16 }} />
					<SpineTrack trackIndex={1} animationName="flutter" loop />
				</SpineProvider>
			{/key}

			<Graphics draw={drawPuff} />

			{#if cardPose}
				<Container x={cardPose.x} y={cardPose.y + card * .42} rotation={cardPose.rot}
					scale={{ x: cardPose.sx, y: cardPose.sy }} alpha={cardPose.alpha}>
					<Sprite key={cutSymbolKey} anchor={{ x: .5, y: .92 }} width={card} height={card} />
					<!-- the low cards' letters are type over the card art (WinWays does the same) -->
					<Text text={cutLabel} anchor={.5} y={-card * .42 + letterNudge(cutLabel, card * .49)}
						style={{ fontFamily: GAME_FONT, fontSize: card * .49, fontWeight: GAME_FONT_WEIGHT, fill: INK }} />
				</Container>
			{/if}

			{#if shatterT >= 0}
				{#key index}
					<CardShatter textureKey={cutSymbolKey} label={cutLabel} labelFont={GAME_FONT} labelColor="#14262e"
						size={card} x={SLOT.x} y={SLOT.y + card * .42} t={shatterT} />
				{/key}
			{/if}
			<Graphics draw={drawTrail} />
			{#if ball}
				<Sprite key="smTransitionWipe" anchor={.5} x={ball.x} y={ball.y} rotation={ball.rot} alpha={ball.alpha}
					width={W * BALL_R * 2} height={W * BALL_R * 2} />
			{/if}
			{#key index}
				{#if !result && phase >= CUT}
					<FxBurst x={BALL_TO.x - card * .12} y={BALL_TO.y - card * .2} scale={W / 520} />
				{/if}
			{/key}

			{#if prize}
				<Container x={prize.x} y={prize.y + card * .42} scale={{ x: prize.sx, y: prize.sy }} alpha={prize.alpha}>
					<Sprite key="gbP" anchor={{ x: .5, y: .95 }} width={card * 1.02} height={card * 1.02} />
				</Container>
			{/if}
			<Graphics draw={drawRing} />

			<!-- the paper: headline, the three rungs as golden balls, the note -->
			<Text visible={!result || opening} text={result ? resultHeadline : gameText('chefSlice')} anchor={.5}
				x={-W * .08} y={PAPER_TOP + W * .045} scale={result ? 1 + .14 * (1 - clamp(stampAge / 240)) : 1}
				style={{ fontFamily: GAME_FONT, fontSize: W * .05, fontWeight: GAME_FONT_WEIGHT, fill: RED,
					stroke: { color: INK, width: 7, join: 'round' }, letterSpacing: 1 }} />
			{#if !result}
				<Graphics draw={drawRail} />
				{#each [1, 2, 3] as rung (rung)}
					<Container x={rungX(rung)} y={RUNG_Y} scale={rungPop(rung)} alpha={rungRevealed(rung) ? 1 : .38}>
						<Sprite key="gbS" anchor={.5} width={W * .07} height={W * .07} />
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
						style={{ fontFamily: GAME_FONT, fontSize: W * .042, fontWeight: GAME_FONT_WEIGHT, fill: 0xfff4de,
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
