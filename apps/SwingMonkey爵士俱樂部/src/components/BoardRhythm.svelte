<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics, getContextApp } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_PADDING } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();
	const app = getContextApp();
	let clock = $state(0);
	const stops: number[] = [];
	const previous: string[] = [];
	let winAt = -Infinity;
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => { winAt = performance.now(); },
		boardWinAnimCancel: () => { winAt = -Infinity; stops.fill(-Infinity); },
	});
	onMount(() => {
		let wasActive = false;
		const tick = () => {
			const now = performance.now();
			context.stateGame.board.forEach((reel, i) => {
				const motion = reel.reelState.motion;
				if (previous[i] === 'spinning' && motion === 'bouncing') stops[i] = now;
				previous[i] = motion;
			});
			const active = stops.some(at => now - at < 400) || now - winAt < 1450
				|| context.stateGame.board.some(reel => reel.reelState.anticipating);
			if (active || wasActive) clock = now;
			wasActive = active;
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});
	const draw = (g: PixiGraphics) => {
		g.clear();
		const now = clock;
		context.stateGame.board.forEach((reel, i) => {
			const x = (i + REEL_PADDING - 0.5) * SYMBOL_SIZE;
			if (reel.reelState.anticipating) {
				const alpha = 0.4 + 0.15 * Math.sin(now / 180);
				for (const edge of [x + 2, x + SYMBOL_SIZE - 2])
					g.moveTo(edge, 6).lineTo(edge, BOARD_SIZES.height - 6)
						.stroke({ width: 2, color: 0xf2b632, alpha });
			}
			const age = (now - (stops[i] ?? -Infinity)) / (stateBet.isTurbo ? 200 : 400);
			if (age >= 0 && age < 1) {
				const alpha = (1 - age) ** 2;
				g.roundRect(x + 3, 2, SYMBOL_SIZE - 6, BOARD_SIZES.height - 4, 9)
					.stroke({ width: 2.5, color: 0xf3e9d2, alpha: alpha * 0.65 });
				// The impact travels up the two edges, leaving the art readable.
				const y = BOARD_SIZES.height * (1 - age);
				for (const edge of [x + 4, x + SYMBOL_SIZE - 4])
					g.moveTo(edge, y).lineTo(edge, Math.min(BOARD_SIZES.height, y + 65))
						.stroke({ width: 3, color: 0xd9342b, alpha: alpha * 0.8 });
			}
		});
		if (!context.stateGame.winLitCells) return;
		for (const cell of context.stateGame.winLitCells) {
			const [reel, row] = cell.split(',').map(Number);
			const p = (now - winAt - reel * (stateBet.isTurbo ? 15 : 50)) / 1100;
			if (p < 0 || p > 1) continue;
			const x = (reel + REEL_PADDING - 0.5) * SYMBOL_SIZE + 5, y = (row - 1) * SYMBOL_SIZE + 5;
			if (y < 0 || y >= BOARD_SIZES.height) continue;
			const alpha = Math.sin(Math.PI * p) * 0.8;
			const length = 13 + Math.sin(p * Math.PI) * 9;
			for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + 130, y, -1, 1], [x, y + 130, 1, -1], [x + 130, y + 130, -1, -1]])
				g.moveTo(cx + dx * length, cy).lineTo(cx, cy).lineTo(cx, cy + dy * length)
					.stroke({ width: 2, color: 0xf3e9d2, alpha });
		}
	};
</script>

<BoardContainer><Graphics {draw} eventMode="none" /></BoardContainer>
