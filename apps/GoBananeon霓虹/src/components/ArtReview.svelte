<script lang="ts">
	// Local art direction bench. The layout only mounts this in Vite DEV mode.
	import { getContext } from '../game/context';
	import { tick, onDestroy } from 'svelte';
	import { INITIAL_BOARD } from '../game/constants';
	import { stateModal } from 'state-shared';
	import type { SymbolName } from '../game/types';
	const context = getContext();
	let busy = $state(false);
	let collapsed = $state(false);
	let idleStyle = $state('DJ 律動');
	let stage = $state('');
	let demoRun = 0;
	onDestroy(() => { demoRun++; });
	const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
	const previewIdle = (animation: 'club_idle' | 'idle_original' | 'iron_idle_weave' | 'iron_idle_bounce', label: string) => {
		idleStyle = label;
		context.eventEmitter.broadcast({ type: 'mascotIdlePreview', animation });
	};
	const cycleScene = () => {
		const scene = context.stateGame.gameType;
		context.stateGame.gameType = scene === 'basegame' ? 'freegame' : scene === 'freegame' ? 'holdandspin' : 'basegame';
		context.eventEmitter.broadcast({ type: 'soundMusic', name: context.stateGame.gameType === 'basegame' ? 'bgm_main' : 'bgm_freespin' });
	};
	const reset = async () => {
		context.eventEmitter.broadcast({ type: 'reelBlastClear' });
		context.eventEmitter.broadcast({ type: 'boardWinAnimCancel' });
		context.stateLayout.showLoadingScreen = false;
		await tick();
		context.eventEmitter.broadcast({ type: 'boardSettle', board: INITIAL_BOARD.map((reel, i) => reel.map((s, row) => ({ ...s, name: i === 2 && row === 2 ? 'B' : s.name }))) });
	};
	const spin = async () => {
		if (busy) return;
		busy = true;
		try {
			await reset();
			const paddingBoard = INITIAL_BOARD.map((reel) => reel.map((s) => ({ ...s })));
			await context.stateGameDerived.enhancedBoard.preSpin({ paddingBoard, isTurboBeforeAllOverride: false });
			await new Promise((resolve) => setTimeout(resolve, 500));
			await context.stateGameDerived.enhancedBoard.spin({
				revealEvent: { index: 0, type: 'reveal', board: paddingBoard, anticipation: [0, 0, 0, 0, 0], paddingPositions: [0, 1, 2, 3, 4] },
				paddingBoard, isTurboOverride: false,
			});
		} finally { busy = false; }
	};
	const blast = async (full: boolean) => {
		if (busy) return;
		await reset();
		busy = true;
		try {
			await context.eventEmitter.broadcastAsync({ type: 'reelBlast', reels: full ? [0, 1, 2, 3, 4] : [2], symbols: (full ? ['H1', 'H2', 'H3', 'H4', 'W'] : ['H3']) as SymbolName[], level: full ? 5 : 1, maxLevel: 5, full });
		} finally { busy = false; }
	};
	const wins = async () => {
		if (busy) return;
		busy = true;
		try {
			await reset();
			await context.eventEmitter.broadcastAsync({ type: 'boardWithAnimateSymbols', symbolPositions: Array.from({ length: 5 }, (_, reel) => Array.from({ length: 4 }, (_, row) => ({ reel, row: row + 1 }))).flat() });
		} finally { busy = false; }
	};
	const motionShowcase = async () => {
		if (busy) return;
		busy = true;
		const run = ++demoRun;
		try {
			await reset();
			previewIdle('club_idle', 'DJ 律動');
			collapsed = true;
			stage = '身體律動／環境燈光';
			await pause(3800);
			if (run !== demoRun) return;
			stage = '刷碟／舞台追光';
			context.eventEmitter.broadcast({ type: 'mascotDjPreview' });
			await pause(3400);
			if (run !== demoRun) return;
			stage = '回收／律動待機';
			await pause(2400);
		} finally { if (run === demoRun) { stage = ''; busy = false; } }
	};
	const showcase = async () => {
		if (busy) return;
		busy = true;
		const run = ++demoRun;
		try {
			await reset();
			stage = '人物刷碟';
			context.eventEmitter.broadcast({ type: 'mascotDjPreview' });
			await pause(3500);
			if (run !== demoRun) return;
			stage = '起轉 → 停輪';
			const paddingBoard = INITIAL_BOARD.map((reel) => reel.map((s) => ({ ...s })));
			// A coherent demonstration row; this never submits a bet or awards a win.
			const board = paddingBoard.map((reel) => reel.map((s, row) => row === 2 ? { name: 'H1' as const } : s));
			await context.stateGameDerived.enhancedBoard.preSpin({ paddingBoard, isTurboBeforeAllOverride: false });
			await pause(500);
			if (run !== demoRun) return;
			await context.stateGameDerived.enhancedBoard.spin({
				revealEvent: { index: 0, type: 'reveal', board, anticipation: [0, 0, 0, 0, 0], paddingPositions: [0, 1, 2, 3, 4] },
				paddingBoard, isTurboOverride: false,
			});
			await pause(280);
			if (run !== demoRun) return;
			stage = '得分 → 收勢';
			await context.eventEmitter.broadcastAsync({ type: 'boardWithAnimateSymbols', symbolPositions: Array.from({ length: 5 }, (_, reel) => ({ reel, row: 2 })) });
			await pause(260);
			if (run !== demoRun) return;
			stage = '蓄力 → 爆炸 → 揭示';
			await context.eventEmitter.broadcastAsync({ type: 'reelBlast', reels: [2], symbols: ['H3'], level: 1, maxLevel: 5, full: false });
			if (run !== demoRun) return;
			await pause(500);
			if (run !== demoRun) return;
			stage = '新獎圖演出';
			await context.eventEmitter.broadcastAsync({ type: 'boardWithAnimateSymbols', symbolPositions: Array.from({ length: 4 }, (_, row) => ({ reel: 2, row: row + 1 })) });
		} finally { if (run === demoRun) { stage = ''; busy = false; } }
	};
</script>

<aside aria-label="美術驗收工具">
	<button class="toggle" onclick={() => collapsed = !collapsed}>{collapsed ? '展開美術驗收' : '收合美術驗收'}</button>
	{#if stage}<span role="status">{stage}</span>{/if}
	{#if !collapsed}
	<strong>NEON · 美術驗收</strong>
	<span>本機預覽 · 無交易</span>
	<button disabled={!context.stateApp.loaded || busy} onclick={showcase}>播放整段演出</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={motionShowcase}>人物＋背景連動</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={reset}>進入／重設盤面</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={spin}>轉輪效果試轉</button>
	<span>人物待機：{idleStyle}</span>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => previewIdle('club_idle', 'DJ 律動')}>人物：DJ 律動待機</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => previewIdle('idle_original', '原版')}>人物：原版待機</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => previewIdle('iron_idle_weave', 'Iron 閃身')}>人物：Iron 閃身</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => previewIdle('iron_idle_bounce', 'Iron 彈跳')}>人物：Iron 彈跳</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => context.eventEmitter.broadcast({ type: 'mascotPunchPreview' })}>人物：Iron 出拳</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => context.eventEmitter.broadcast({ type: 'mascotDjPreview' })}>人物：DJ 刷碟＋音效</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => blast(false)}>單軸爆炸</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => blast(true)}>滿盤爆炸</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={wins}>獎圖得分動畫</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => context.eventEmitter.broadcast({ type: 'mascotChestBeat' })}>人物慶祝</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => context.eventEmitter.broadcast({ type: 'mascotThrow' })}>人物投擲</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={cycleScene}>切換場景</button>
	<button disabled={!context.stateApp.loaded || busy} onclick={() => { stateModal.modal = { name: 'buyBonus' }; }}>特色選單</button>
	{/if}
</aside>

<style>
	aside { position: fixed; z-index: 10000; top: 42px; left: 12px; width: 150px; max-height: calc(100vh - 70px); overflow-y: auto; display: grid; gap: 7px; padding: 12px; color: #eaf9ff; background: #0b122aee; border: 1px solid #4489ac; border-radius: 12px; font: 12px/1.4 'Segoe UI', sans-serif; box-shadow: 0 8px 28px #0006; }
	strong { color: #71e7ff; letter-spacing: 1px; }
	span { color: #a7b5cc; font-size: 11px; }
	button { min-height: 32px; border: 1px solid #406082; border-radius: 6px; color: #edfaff; background: #172543; cursor: pointer; }
	button:hover:enabled { border-color: #ff5dd6; background: #302552; }
	button:disabled { opacity: .4; cursor: default; }
	.toggle { font-size: 11px; color: #8feaff; }
	@media (max-width: 600px) { aside { top: 30px; width: 126px; gap: 4px; padding: 8px; } button { min-height: 28px; font-size: 11px; } }
</style>
