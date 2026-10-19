<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { everyFrame } from '../game/frameLoop';
	import { COMIC_POP, type ComicPopKind } from '../game/comicPop';
	import BoardContainer from './BoardContainer.svelte';

	/**
	 * THE COMIC SOUND-EFFECT WORDS. Each brief says the onomatopoeia is typeset by
	 * the program, never painted: this is that program. A word pops out of the
	 * board on the three beats that matter — a collection, the feature trigger,
	 * a meter rung — in this game's own shape and words (game/comicPop.ts).
	 *
	 * Purely decorative: it listens to events the game already broadcasts, holds
	 * nothing up (no promise is returned) and draws inside the board's own
	 * container, so it scales and moves with the reels. Frame-locked through
	 * everyFrame and timed on performance.now, so a hidden tab cannot replay a
	 * backlog of pops when it comes back.
	 */
	const context = getContext();
	const T = COMIC_POP;

	const LIFE_MS = 950;
	const IN_MS = 170;
	const OUT_MS = 260;
	const BOARD_W = SYMBOL_SIZE * BOARD_DIMENSIONS.x;
	const BOARD_H = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	// padded book rows: visible row r centre sits at r*SYMBOL_SIZE - SYMBOL_SIZE/2
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	type Pop = {
		id: number;
		x: number;
		y: number;
		word: string;
		size: number;
		tilt: number;
		born: number;
		w: number;
		h: number;
		draw: (g: PixiGraphics) => void;
	};

	let pops = $state<Pop[]>([]);
	let now = $state(performance.now());
	let nextId = 0;
	let stopLoop: (() => void) | undefined;

	const pick = (list: readonly string[]) => list[Math.floor(Math.random() * list.length)];

	// a deterministic wobble per pop, so its jagged edge does not crawl
	const rng = (seed: number) => () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};

	const shapeOf = (w: number, h: number, seed: number) => (g: PixiGraphics) => {
		g.clear();
		const r = rng(seed + 1);
		if (T.shape === 'bubble') {
			// webtoon caption card: rounded card, a tail, a coloured edge strip
			g.roundRect(-w / 2, -h / 2, w, h, h * 0.32);
			g.fill({ color: T.fill });
			g.roundRect(-w / 2, -h / 2, w, h, h * 0.32);
			g.stroke({ width: 6, color: T.ink, join: 'round' });
			g.poly([-w * 0.22, h / 2 - 3, -w * 0.08, h / 2 - 3, -w * 0.3, h / 2 + h * 0.42]);
			g.fill({ color: T.fill });
			g.poly([-w * 0.22, h / 2, -w * 0.3, h / 2 + h * 0.42, -w * 0.08, h / 2]);
			g.stroke({ width: 6, color: T.ink, join: 'round' });
			g.roundRect(-w / 2 + 10, -h / 2 + 8, 10, h - 16, 5);
			g.fill({ color: T.accent });
		} else if (T.shape === 'brush') {
			// a brush stroke: ragged ends, a drier lighter streak through it
			const pts: number[] = [];
			const steps = 14;
			for (let i = 0; i <= steps; i++) pts.push(-w / 2 + (w * i) / steps, -h / 2 + (r() - 0.5) * h * 0.18);
			for (let i = 0; i < 5; i++) pts.push(w / 2 + r() * h * 0.35, -h / 2 + (h * (i + 0.5)) / 5);
			for (let i = steps; i >= 0; i--) pts.push(-w / 2 + (w * i) / steps, h / 2 + (r() - 0.5) * h * 0.18);
			for (let i = 4; i >= 0; i--) pts.push(-w / 2 - r() * h * 0.45, -h / 2 + (h * (i + 0.5)) / 5);
			g.poly(pts);
			g.fill({ color: T.fill });
			g.poly(pts);
			g.stroke({ width: 5, color: T.ink, join: 'round' });
			g.rect(-w * 0.42, -h * 0.28, w * 0.8, h * 0.08);
			g.fill({ color: T.accent, alpha: 0.55 });
		} else {
			// a pill-shaped show card with a musical note either side
			g.roundRect(-w / 2, -h / 2, w, h, h / 2);
			g.fill({ color: T.fill });
			g.roundRect(-w / 2, -h / 2, w, h, h / 2);
			g.stroke({ width: 6, color: T.ink, join: 'round' });
			for (const side of [-1, 1]) {
				const nx = side * (w / 2 + h * 0.42);
				const ny = side < 0 ? -h * 0.15 : h * 0.05;
				g.ellipse(nx, ny + h * 0.28, h * 0.17, h * 0.13);
				g.fill({ color: T.accent });
				g.rect(nx + h * 0.13, ny - h * 0.42, 5, h * 0.7);
				g.fill({ color: T.accent });
				g.poly([nx + h * 0.13, ny - h * 0.42, nx + h * 0.36, ny - h * 0.26, nx + h * 0.36, ny - h * 0.16, nx + h * 0.13, ny - h * 0.3]);
				g.fill({ color: T.accent });
			}
		}
	};

	const spawn = (kind: ComicPopKind, x: number, y: number) => {
		const word = pick(T.words[kind]);
		const size = kind === 'collect' ? T.fontSize : T.fontSize * 1.3;
		const w = Math.max(size * 2.2, word.length * size * T.charWidth + size * 0.9);
		const h = size * 1.45;
		// keep the whole card on the board
		const cx = Math.min(BOARD_W - w / 2 - 12, Math.max(w / 2 + 12, x));
		const cy = Math.min(BOARD_H - h, Math.max(h / 2 + 8, y));
		const id = nextId++;
		pops = [
			...pops,
			{ id, x: cx, y: cy, word, size, tilt: (Math.random() - 0.5) * 0.22, born: performance.now(), w, h, draw: shapeOf(w, h, id * 7919 + 13) },
		];
		if (!stopLoop) {
			stopLoop = everyFrame(() => {
				now = performance.now();
				const alive = pops.filter((p) => now - p.born < LIFE_MS);
				if (alive.length !== pops.length) pops = alive;
				if (!pops.length) {
					stopLoop?.();
					stopLoop = undefined;
				}
			});
		}
	};

	const easeOutBack = (p: number) => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2;

	const look = (p: Pop) => {
		const age = now - p.born;
		const tin = Math.min(1, age / IN_MS);
		const tout = Math.max(0, (age - (LIFE_MS - OUT_MS)) / OUT_MS);
		const beat = T.shape === 'notes' ? Math.sin(age / 90) * 0.04 : 0;
		return {
			scale: Math.max(0.01, easeOutBack(tin)) * (1 + beat) * (1 - tout * 0.15),
			alpha: 1 - tout,
			y: p.y - tout * 26,
			rotation: p.tilt + (T.shape === 'notes' ? Math.sin(age / 140) * 0.05 : 0),
		};
	};

	context.eventEmitter.subscribeOnMount({
		// the word lands with the LAST pin on each collector — the payoff of the
		// chain (BanditCollect), not its start (2026-10-18)
		banditCollectFinale: ({ reel, row }) => {
			spawn('collect', getSymbolX(reel), rowCenterY(row) - SYMBOL_SIZE * 0.62);
		},
		scatterBurst: () => spawn('trigger', BOARD_W / 2, BOARD_H * 0.3),
		banditLevelUp: () => spawn('levelUp', BOARD_W / 2, BOARD_H * 0.5),
	});
</script>

<BoardContainer>
	{#each pops as p (p.id)}
		{@const v = look(p)}
		<Container x={p.x} y={v.y} scale={v.scale} rotation={v.rotation} alpha={v.alpha}>
			<Graphics draw={p.draw} />
			<Text
				anchor={0.5}
				text={p.word}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: p.size,
					fill: T.text,
					stroke: { color: T.textStroke, width: Math.round(p.size * 0.16), join: 'round' },
				}}
			/>
		</Container>
	{/each}
</BoardContainer>
