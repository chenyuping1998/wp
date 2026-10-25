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
	 * THE UPGRADE: THE SAUCER RAMS THE CARD (user, 2026-10-23).
	 *
	 * The first version was program art on a skewed paper polygon — a cut-in
	 * still, a drawn spotlight, dot rungs and a red square stamp, the saucer
	 * only fading in over the card. It is now staged on the FG board itself
	 * (v8FgIntro, design/build_saucer_signs.py) with the game's own drawings:
	 *
	 *   board     drops in and settles, like the FG intro; the farm kid walks
	 *             on at right and signals the sky with his torch ('control')
	 *   per rung  the low card springs up on the farm; the saucer drops out of
	 *             the sky at it, fastest at the card, and RAMS it: both hold
	 *             flattened for a beat, then the card bursts into shards
	 *             (CardShatter, flung on the way the saucer was going), ink
	 *             burst, frame hit; the saucer bounces up off it wobbling,
	 *             hovers, and lowers a cow down its beam into the empty spot;
	 *             she lands and squashes over a turning sun; the rung lights;
	 *             the saucer shoots off for the next card
	 *   result    the cow stays proud under the sun, "+N" lands beside her,
	 *             the kid cheers
	 *
	 * Timings live in src/game/upgradeMotion.ts (checked by
	 * design/check_collection_motion.mjs). LEAD / STEP / CUT and the book's
	 * meaning are the old ones.
	 */
	import InkNumber from './InkNumber.svelte';
	import FxBurst from './FxBurst.svelte';
	import CardShatter from './CardShatter.svelte';
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, SpineProvider, SpineTrack, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { letterNudge } from '../game/letterCentre';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';
	import config from '../game/config';
	import {
		APPROACH_MS, BEAM_AT, HIT_STOP, LAND, LOWER_AT, RUNG_LIGHT,
		lowerCow, prizeSquash, rungPopAt, saucerPose,
	} from '../game/upgradeMotion';

	const context = getContext();
	const INK = 0x141a33, RED = 0xe8433a, GOLD = 0xffcf4a, BEAM = 0x7cf05a;
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
	// the board is 1600x1000: the farm view down to y .47, the paper's red
	// rule y .516..942 (FreeSpinAnimation's PAPER)
	const W = $derived(Math.min(layout.width * .94, (layout.height * .78) * 1.6, 900));
	const BH = $derived(W / 1.6);
	const FLOOR = $derived(BH * (.47 - .5)); // the farm's ground (the view's foot), board-centred
	const PAPER_TOP = $derived(BH * (.516 - .5));
	const PAPER_BOT = $derived(BH * (.942 - .5));
	const card = $derived(W * .18);
	const SW = $derived(W * .22); // the saucer sprite (512 square, the hull across .92 of it)
	// over the barn, clear of the big ship drawn in the view's middle
	const SLOT = $derived({ x: -W * .27, y: FLOOR - card * .42 });
	const index = $derived(Math.min(steps.length - 1, Math.max(0, Math.floor((elapsed - LEAD) / STEP))));
	const phase = $derived(Math.max(0, elapsed - LEAD - index * STEP));
	const lastStep = $derived(index === steps.length - 1);
	const resultAt = $derived(LEAD + steps.length * STEP);
	const duration = $derived(resultAt + HOLD + OUT);
	const alpha = $derived(Math.min(clamp(elapsed / 150), 1 - clamp((elapsed - duration + OUT) / OUT)));
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const cutSymbolKey = $derived(`gb${config.banditMeter.replacements[(steps[index] ?? level) - 1] ?? 'L5'}`);
	const shake = $derived(phase >= CUT + HIT_STOP && phase < CUT + HIT_STOP + 220 ? Math.sin((phase - CUT) * .16) * 8 * (1 - (phase - CUT - HIT_STOP) / 220) : 0);
	const result = $derived(elapsed >= resultAt);
	const stampAge = $derived(elapsed - resultAt);
	const currentRung = $derived(steps[index] ?? level);
	const lit = $derived(phase >= CUT + RUNG_LIGHT);
	const rungRevealed = (rung: number) => result ? rung <= level : rung < currentRung || (rung === currentRung && lit);
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

	// the saucer: where it comes from, hits, hovers and leaves for
	const SAUCER_PTS = $derived({
		from: { x: W * .62, y: -BH * .78 },
		hit: { x: SLOT.x + card * .38, y: SLOT.y - card * .12 },
		hover: { x: SLOT.x, y: SLOT.y - card * .9 },
		away: { x: -W * .72, y: -BH * .82 },
	});
	const saucer = $derived(result ? null : saucerPose(phase, CUT, SAUCER_PTS, lastStep, card * .04));

	// the low card: springs up, braces as the saucer comes, is flattened by
	// it for the hit-stop; from then on CardShatter draws it, in pieces
	const cardPose = $derived.by(() => {
		if (result || phase >= CUT + HIT_STOP) return null;
		const up = back(clamp(phase / 420));
		if (phase < CUT) {
			const brace = clamp((phase - CUT + 160) / 160);
			return { rot: .04 * brace, sx: up * (1 + .04 * brace), sy: up * (1 - .06 * brace) };
		}
		const s = clamp((phase - CUT) / 20);
		return { rot: .05, sx: 1 - .14 * s, sy: 1 + .06 * s };
	});
	const shatterT = $derived(!result && phase >= CUT + HIT_STOP && phase < CUT + HIT_STOP + 800 ? phase - CUT - HIT_STOP : -1);

	// the cow, lowered down the beam into the spot, then landing
	const prize = $derived.by(() => {
		const t = result ? 9999 : phase - CUT;
		if (t < LOWER_AT) return null;
		const k = result ? 1 : lowerCow(phase, CUT);
		const top = SAUCER_PTS.hover.y + SW * .16 + card * .5;
		const squash = prizeSquash(t - LAND);
		const out = !result && !lastStep ? clamp((phase - STEP + 260) / 220) : 0;
		const hang = 1 - k;
		return {
			x: SLOT.x + Math.sin(t / 90) * card * .03 * hang,
			y: top + (SLOT.y - top) * k,
			scale: .5 + .5 * k,
			rot: Math.sin(t / 120) * .12 * hang,
			sx: 1 + .2 * squash, sy: 1 - .24 * squash,
			alpha: (1 - out) * clamp((t - LOWER_AT) / 80),
			rays: clamp((t - LAND + 60) / 380) * (1 - out),
		};
	});
	const rayTurn = $derived(elapsed / 2400);

	// the beam: under the hull, out to the spot, faint halftone motes rising
	const drawBeam = (g: PixiGraphics) => {
		g.clear();
		if (!saucer || saucer.beam <= 0) return;
		const a = saucer.beam * saucer.alpha;
		const tx = saucer.x, ty = saucer.y + SW * .15;
		const by = SLOT.y + card * .5;
		for (const [top, bot, al] of [[SW * .16, card * .78, .16], [SW * .1, card * .5, .2], [SW * .05, card * .26, .26]] as const) {
			g.poly([tx - top, ty, tx + top, ty, SLOT.x + bot, by, SLOT.x - bot, by]).fill({ color: BEAM, alpha: al * a });
		}
		for (let i = 0; i < 14; i++) {
			const span = by - ty;
			const y = by - (((i * 37 + phase * .12) % span) + span) % span;
			const f = (y - ty) / span;
			g.circle(tx + (SLOT.x - tx) * f + Math.sin(i * 2.7) * card * .5 * f, y, 2.4).fill({ color: 0xeaffd8, alpha: .8 * a });
		}
	};
	// one ring off the cow's landing
	const drawRing = (g: PixiGraphics) => {
		g.clear();
		const t = result ? -1 : phase - CUT - LAND;
		if (t < 0 || t > 520) return;
		const k = t / 520;
		g.circle(SLOT.x, SLOT.y + card * .1, card * (.4 + .5 * easeOut(k))).stroke({ width: 6 * (1 - k), color: GOLD, alpha: 1 - k });
	};
	// speed lines behind the diving saucer
	const drawStreaks = (g: PixiGraphics) => {
		g.clear();
		if (!saucer || phase >= CUT || phase < CUT - APPROACH_MS) return;
		const k = clamp((phase - CUT + APPROACH_MS) / APPROACH_MS);
		const dx = SAUCER_PTS.from.x - SAUCER_PTS.hit.x, dy = SAUCER_PTS.from.y - SAUCER_PTS.hit.y;
		const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
		for (let i = -2; i <= 2; i++) {
			const ox = -uy * i * SW * .09, oy = ux * i * SW * .09;
			const l = SW * (.5 + .9 * k) * (1 - .18 * Math.abs(i));
			const sx = saucer.x + ox + ux * SW * .28, sy = saucer.y + oy + uy * SW * .28;
			g.moveTo(sx, sy).lineTo(sx + ux * l, sy + uy * l).stroke({ width: 4, color: 0xf8ecce, alpha: .7 * k });
		}
	};

	// THE FARM KID, the FG cast's own Spine: he walks on with the board and
	// signals the sky with his torch through every rung ('control'), and
	// cheers on the result
	const kidPose = $derived.by(() => {
		const enter = easeOut(clamp(elapsed / 560));
		return { x: W * .33 + W * .3 * (1 - enter), alpha: enter };
	});
	const KID_SCALE = $derived((W * .36) / 882);

	const rungX = (rung: number) => (rung - 2) * W * .17 - W * .12;
	const RUNG_Y = $derived(PAPER_TOP + (PAPER_BOT - PAPER_TOP) * .5);
	const rungPop = (rung: number) => (rung === currentRung && !result ? rungPopAt(phase, CUT) : 1);
	const drawRail = (g: PixiGraphics) => {
		g.clear();
		const y = RUNG_Y + W * .04;
		g.moveTo(rungX(1), y).lineTo(rungX(3), y).stroke({ width: W * .008, color: INK, alpha: .25 });
		const revealed = result ? level : currentRung - 1 + (lit ? 1 : 0);
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
			const dives = new Set<number>(), hits = new Set<number>(), beams = new Set<number>(), reveals = new Set<number>();
			let stamped = false;
			const tick = (now: number) => {
				elapsed += Math.min(80, Math.max(0, now - previous)); previous = now;
				for (let i = 0; i < steps.length; i++) {
					const local = elapsed - LEAD - i * STEP;
					if (local >= CUT - APPROACH_MS && !dives.has(i)) { dives.add(i); context.eventEmitter.broadcast({ type: 'soundSaucerFly' }); }
					if (local >= CUT && !hits.has(i)) {
						hits.add(i); context.eventEmitter.broadcast({ type: 'soundCollectGrab' });
						context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.5 });
					}
					if (local >= CUT + BEAM_AT && !beams.has(i)) { beams.add(i); context.eventEmitter.broadcast({ type: 'soundSaucerBeam' }); }
					if (local >= CUT + RUNG_LIGHT && !reveals.has(i)) { reveals.add(i); context.eventEmitter.broadcast({ type: 'soundLadderUp', level: steps[i] }); }
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

			<!-- the sun behind the cow: the board's own ray art, turning slowly -->
			{#if prize && prize.rays > 0}
				<Sprite key="v8Ray" anchor={.5} x={SLOT.x} y={SLOT.y} width={card * 2.3} height={card * 2.3}
					rotation={rayTurn} tint={GOLD} alpha={.6 * prize.rays} />
			{/if}

			<!-- the farm kid, signalling from the right -->
			<Container x={kidPose.x} y={PAPER_BOT - W * .015} alpha={kidPose.alpha}>
				<SpineProvider key="gbLookout" x={0} y={0} scale={KID_SCALE}>
					<SpineTrack trackIndex={0} animationName={result ? 'cheer' : 'control'} loop={!result}
						{...{ mixDuration: 0.25 }} />
					<SpineTrack trackIndex={1} animationName="flutter" loop />
				</SpineProvider>
			</Container>

			<Graphics draw={drawBeam} blendMode="add" />

			{#if cardPose}
				<Container x={SLOT.x} y={SLOT.y + card * .42} rotation={cardPose.rot} scale={{ x: cardPose.sx, y: cardPose.sy }}>
					<Sprite key={cutSymbolKey} anchor={{ x: .5, y: .92 }} width={card} height={card} />
					<Text text={cutLabel} anchor={.5} y={-card * .42 + letterNudge(cutLabel, Math.round(card * .49))}
						style={{ fontFamily: GAME_FONT, fontSize: Math.round(card * .49), fontWeight: GAME_FONT_WEIGHT, fill: INK }} />
				</Container>
			{/if}
			{#key index}
				{#if shatterT >= 0}
					<CardShatter textureKey={cutSymbolKey} label={cutLabel} labelFont={GAME_FONT} labelColor="#141a33"
						size={card} x={SLOT.x} y={SLOT.y + card * .42} t={shatterT}
						impact={{ u: .82, v: .38 }} carry={{ x: -1.4, y: .35 }} />
				{/if}
			{/key}

			{#if prize}
				<Container x={prize.x} y={prize.y + card * .42} rotation={prize.rot}
					scale={{ x: prize.sx * prize.scale, y: prize.sy * prize.scale }} alpha={prize.alpha}>
					<Sprite key="gbP" anchor={{ x: .5, y: .92 }} width={card * .95} height={card * .95} />
				</Container>
			{/if}
			<Graphics draw={drawRing} />

			<Graphics draw={drawStreaks} />
			{#if saucer && saucer.alpha > 0}
				<Container x={saucer.x} y={saucer.y} rotation={saucer.rot} scale={{ x: saucer.sx, y: saucer.sy }} alpha={saucer.alpha}>
					<Sprite key="gbCollectorShip" anchor={.5} width={SW} height={SW} />
				</Container>
			{/if}
			{#key index}
				{#if !result && phase >= CUT + HIT_STOP}
					<FxBurst x={SAUCER_PTS.hit.x - card * .2} y={SAUCER_PTS.hit.y + card * .1} scale={W / 520} />
				{/if}
			{/key}

			<!-- the paper: headline, the three rungs as golden saucers, the note -->
			<Text visible={!result || opening} text={result ? resultHeadline : gameText('chefSlice')} anchor={.5}
				x={-W * .08} y={PAPER_TOP + W * .05} scale={result ? 1 + .14 * (1 - clamp(stampAge / 240)) : 1}
				style={{ fontFamily: GAME_FONT, fontSize: W * .05, fontWeight: GAME_FONT_WEIGHT, fill: RED,
					stroke: { color: INK, width: 7, join: 'round' }, letterSpacing: 1 }} />
			{#if !result}
				<Graphics draw={drawRail} />
				{#each [1, 2, 3] as rung (rung)}
					<Container x={rungX(rung)} y={RUNG_Y} scale={rungPop(rung)} alpha={rungRevealed(rung) ? 1 : .38}>
						<Sprite key="gbS" anchor={{ x: .5, y: .75 }} width={W * .08} height={W * .08} />
						<Text text={`${config.banditMeter.thresholds[rung - 1]}`} anchor={.5} x={W * .05} y={-W * .03}
							style={{ fontFamily: NUMBER_FONT, fontSize: W * .03, fill: rungRevealed(rung) ? RED : INK }} />
						<Text text={`${removedLabelAtLevel(rung)}→P`} anchor={.5} y={W * .055}
							style={{ fontFamily: GAME_FONT, fontSize: W * .026, fontWeight: GAME_FONT_WEIGHT, fill: rungRevealed(rung) ? RED : INK }} />
					</Container>
				{/each}
			{/if}
			{#if result && !opening}
				<!-- "+N" lands beside the cow, on the farm -->
				<Container x={SLOT.x + card * 1.05} y={SLOT.y - card * .05 - W * .04 * (1 - clamp(stampAge / 260))}
					rotation={-.1 * (1 - clamp(stampAge / 260))} scale={back(clamp(stampAge / 320))}>
					<InkNumber text={`+${spins}`} fontSize={W * .1} role="plate" />
					<Text text="SPINS" anchor={.5} y={W * .07}
						style={{ fontFamily: GAME_FONT, fontSize: W * .042, fontWeight: GAME_FONT_WEIGHT, fill: 0xf8ecce,
							stroke: { color: INK, width: 7, join: 'round' } }} />
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{ x: 0, y: .5 }} x={-W * .08 - replacementRowWidth / 2} y={RUNG_Y} style={replacementStyle} />
				<Sprite key="gbP" anchor={.5} x={-W * .08 + replacementRowWidth / 2 - W * .042} y={RUNG_Y} width={W * .085} height={W * .085} />
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} x={-W * .08} y={PAPER_BOT - W * .045}
				style={{ fontFamily: GAME_FONT, fontSize: W * .026, fontWeight: GAME_FONT_WEIGHT, fill: INK }} />
		</Container>
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
