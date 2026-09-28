<script lang="ts">
	/**
	 * THE BOARD, WAITING. While the player looks at a stopped board, every few
	 * seconds one Wild or Scatter on it does something small — the Bananaut
	 * chomps its banana, the beacon's lamp flickers (meshWin W_IDLE / S_IDLE).
	 * Before this a stopped board was a picture until the next spin; the poor-
	 * animation review's "idle board" item.
	 *
	 * Only when the game is IDLE and every visible symbol is at rest: the idle
	 * win replay puts symbols in the win state, and a landing is still settling,
	 * and neither should be interrupted. One at a time, from the visible cells
	 * only, never the same cell twice running. A spin clears it at once.
	 *
	 * Draws nothing itself: it names the cell (stateGame.idleActor), and
	 * ReelSymbol / Symbol play the beat on it.
	 */
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { BASE_ROWS, unmarkSymbolName } from '../game/constants';
	import { MESH_WINS } from '../game/meshWin';

	const context = getContext();
	const ACTORS = ['W', 'S'];
	const GAP_MS = [2500, 4500];

	let nextAt = performance.now() + GAP_MS[0];
	let clearTimer = 0;
	let last = '';

	const clear = () => {
		clearTimeout(clearTimer);
		context.stateGame.idleActor = null;
	};

	const tick = () => {
		const now = performance.now();
		const idle = context.stateXstateDerived.isIdle();
		if (!idle) {
			if (context.stateGame.idleActor) clear();
			nextAt = now + GAP_MS[0];
			return;
		}
		if (context.stateGame.idleActor || now < nextAt) return;

		const cells: { reel: number; row: number; name: string }[] = [];
		let resting = true;
		context.stateGame.board.forEach((reel, r) => {
			const rows = context.stateGame.growRows[r] ?? BASE_ROWS;
			reel.reelState.symbols.forEach((sym, row) => {
				if (row < 1 || row > rows) return;
				if (sym.symbolState !== 'static' && sym.symbolState !== 'postWinStatic') resting = false;
				const name = unmarkSymbolName(sym.rawSymbol.name);
				if (ACTORS.includes(name) && `${name}_IDLE` in MESH_WINS && `${r},${row}` !== last)
					cells.push({ reel: r, row, name });
			});
		});
		nextAt = now + GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]);
		if (!resting || cells.length === 0) return;

		const pick = cells[Math.floor(Math.random() * cells.length)];
		last = `${pick.reel},${pick.row}`;
		context.stateGame.idleActor = { reel: pick.reel, row: pick.row };
		clearTimeout(clearTimer);
		clearTimer = setTimeout(clear, MESH_WINS[`${pick.name}_IDLE`].durationMs + 50) as unknown as number;
	};

	// a timer, not the frame loop: nothing is drawn here, and it must not run
	// on in a hidden tab either (the interval is throttled there, which is fine)
	const interval = setInterval(tick, 250);
	onDestroy(() => {
		clearInterval(interval);
		clear();
	});
</script>
