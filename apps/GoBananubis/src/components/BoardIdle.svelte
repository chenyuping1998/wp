<script lang="ts">
	/**
	 * THE BOARD IS ALIVE WHILE IT WAITS.
	 *
	 * Between rounds the board used to be a still picture — and it is what the
	 * player looks at most. So every few seconds one high pay or Wild on it does
	 * its small idle act (meshRig.idlePose: the Eye glances and blinks, the
	 * scarab shuffles, the chest lid lifts a crack, the ankh sways, the Anubis
	 * chews): one at a time, never the same cell twice running, no light and no
	 * frame, so it can never be taken for a win.
	 *
	 * Only when the board has been properly quiet — every reel stopped, every
	 * visible cell at rest — for QUIET_MS, so it never lands in the short gap between two
	 * free spins or under a win still being shown. A spin starting takes the
	 * act away at once (Symbol.svelte only plays it on a static cell).
	 *
	 * A timer, not the frame loop: it only decides WHO acts; the act itself
	 * runs on the pixi ticker like every other mesh beat.
	 */
	import { onMount } from 'svelte';

	import { BOARD_DIMENSIONS } from '../game/constants';
	import { idleAct } from '../game/idleAct.svelte';
	import { MESH_LANDS } from '../game/meshWin';
	import { IDLE_MS } from '../game/meshWin/meshRig';
	import { stateGame } from '../game/stateGame.svelte';

	// a new act every 3.2-6.2s, the first no sooner than 1.5s after the board
	// comes to rest
	const MIN_MS = 3200;
	const SPREAD_MS = 3000;
	const QUIET_MS = 1500;

	onMount(() => {
		let quietSince = performance.now();
		let nextAt = quietSince + MIN_MS;
		let last = '';
		let actEndsAt = 0;
		const id = setInterval(() => {
			const now = performance.now();
			// the VISIBLE cells only: the padding rows above and below the board
			// are never drawn, so their landing never reports done and they sit
			// in 'land' for good. And every one of them plain 'static': a cell in
			// 'postWinStatic' means a win is still on show (its pay frames stay
			// up until the next spin), and a symbol acting beside it would read
			// as part of that win — so after a winning round the board waits still.
			const quiet = stateGame.board.every(
				(reel) =>
					reel.reelState.motion === 'stopped' &&
					reel.reelState.symbols.every(
						(s) => s.symbolIndex < 1 || s.symbolIndex > BOARD_DIMENSIONS.y || s.symbolState === 'static',
					),
			);
			if (!quiet) {
				quietSince = now;
				if (idleAct.reel >= 0) idleAct.reel = -1;
				return;
			}
			// an act that never reported done (a hidden tab stops the ticker)
			if (idleAct.reel >= 0 && now > actEndsAt + 500) idleAct.reel = -1;
			if (idleAct.reel >= 0 || now - quietSince < QUIET_MS || now < nextAt) return;

			const cells: { reel: number; row: number }[] = [];
			stateGame.board.forEach((reel, r) =>
				reel.reelState.symbols.forEach((s) => {
					const row = s.symbolIndex;
					if (row < 1 || row > BOARD_DIMENSIONS.y) return;
					if (!MESH_LANDS[s.rawSymbol.name]?.idle) return;
					// Symbol only plays the act on a static cell
					if (s.symbolState !== 'static') return;
					if (`${r},${row}` === last) return;
					cells.push({ reel: r, row });
				}),
			);
			nextAt = now + MIN_MS + Math.random() * SPREAD_MS;
			if (!cells.length) return;
			const pick = cells[Math.floor(Math.random() * cells.length)];
			last = `${pick.reel},${pick.row}`;
			actEndsAt = now + IDLE_MS;
			idleAct.id++;
			idleAct.row = pick.row;
			idleAct.reel = pick.reel;
		}, 250);
		return () => {
			clearInterval(id);
			idleAct.reel = -1;
		};
	});
</script>
