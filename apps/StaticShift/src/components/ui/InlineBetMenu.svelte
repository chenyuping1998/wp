<script lang="ts">
	// The amount list bar v3 opens beside its BET box (Mummy Mayhem's inline
	// menu, via Hypno Monkey), in place of the shared full-screen bet menu.
	// Static Shift (2026-11-10, from Pickle Panic's): dressed as the game's paper dialogs — paper,
	// ink edge, hard ink offset, Bungee captions and Anton figures, the
	// selected amount in the game's red.
	import { tick } from 'svelte';
	import { stateBet, stateBetDerived, stateConfig, stateModal, stateUrlDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { i18nDerived } from 'components-ui-pixi';
	import { markBetChanged } from 'components-ui-pixi/src/platformUx.svelte';
	import { zIndex } from 'constants-shared/zIndex';

	import { inlineBetAnchor } from '../../game/inlineBetAnchor.svelte';
	import { inlineBetLayout } from '../../game/inlineBetLayout';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const open = $derived(stateModal.modal?.name === 'betAmountMenu');
	const social = $derived(stateUrlDerived.social());
	const amounts = $derived(
		[...new Set(stateConfig.betAmountOptions.length ? stateConfig.betAmountOptions : stateConfig.betMenuOptions)]
			.filter((v) => v > 0)
			.sort((a, b) => a - b),
	);
	let panel = $state<HTMLDivElement>();
	let grid = $state<HTMLDivElement>();
	let box = $state({ left: 12, top: 12, width: 360, height: 420 });
	const close = () => (stateModal.modal = null);
	const measure = () => {
		if (typeof window === 'undefined') return;
		const a = inlineBetAnchor.measure?.() ?? { left: window.innerWidth * 0.5, top: window.innerHeight - 90, width: 80, height: 60 };
		box = inlineBetLayout(a, { width: window.innerWidth, height: window.innerHeight });
	};
	const choose = (value: number) => {
		markBetChanged();
		stateBetDerived.setBetAmount(value);
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
	$effect(() => {
		if (!open) return;
		measure();
		void tick().then(() => {
			const selected = grid?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
			if (selected && grid) {
				grid.scrollTop = selected.offsetTop - grid.clientHeight * 0.5 + selected.clientHeight * 0.5;
				selected.focus({ preventScroll: true });
			} else panel?.focus();
		});
	});
	const keys = (e: KeyboardEvent) => {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === 'Tab') {
			if (!panel) return;
			const buttons = [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
			const first = buttons[0];
			const last = buttons.at(-1);
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	};
</script>

<svelte:window onresize={() => requestAnimationFrame(measure)} onkeydown={keys} />
{#if open}
	<div class="bet-layer" style:z-index={zIndex.modal}>
		<button class="bet-backdrop" aria-label="Close amount menu" onclick={close}></button>
		<div
			class="bet-panel"
			bind:this={panel}
			role="dialog"
			aria-modal="true"
			aria-labelledby="inline-bet-title"
			tabindex="-1"
			style:left={`${box.left}px`}
			style:top={`${box.top}px`}
			style:width={`${box.width}px`}
			style:max-height={`${box.height}px`}
		>
			<header>
				<h2 id="inline-bet-title">{i18nDerived.betAmount()}</h2>
				<button class="bet-close" aria-label="Close" onclick={close}>×</button>
			</header>
			<div class="bet-current">{social ? 'PLAY AMOUNT' : 'BASE BET'} <strong>{numberToCurrencyString(stateBet.betAmount)}</strong></div>
			{#if (stateBetDerived.activeBetMode()?.costMultiplier ?? 1) > 1}
				<div class="bet-total">{social ? 'TOTAL PLAY AMOUNT' : 'TOTAL PER SPIN'}: {numberToCurrencyString(stateBetDerived.betCost())}</div>
			{/if}
			<div class="bet-amount-grid" bind:this={grid}>
				{#each amounts as amount (amount)}
					<button
						type="button"
						class:on={stateBet.betAmount === amount}
						aria-pressed={stateBet.betAmount === amount}
						onclick={() => choose(amount)}>{numberToCurrencyString(amount)}</button
					>
				{/each}
			</div>
			<footer><span>SCROLL FOR MORE</span><button type="button" class="bet-done" onclick={close}>DONE</button></footer>
		</div>
	</div>
{/if}

<style>
	.bet-layer {
		position: fixed;
		inset: 0;
		pointer-events: none;
		font-family: var(--gb-display-font);
		color: #15191f;
	}
	.bet-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: transparent;
		pointer-events: auto;
	}
	.bet-panel {
		position: fixed;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		pointer-events: auto;
		padding: 16px;
		border: 3px solid #15191f;
		border-radius: 12px;
		background: #e5e2d6;
		box-shadow: 6px 6px 0 rgba(23, 28, 26, 0.45);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	h2 {
		margin: 0;
		font: 400 21px/1.2 var(--gb-display-font);
		color: #15191f;
	}
	.bet-close {
		border: 0;
		color: #15191f;
		background: transparent;
		font: 400 30px/1 var(--gb-body-font);
		cursor: pointer;
		min-width: 36px;
		min-height: 36px;
	}
	.bet-close:hover {
		color: #535e88;
	}
	.bet-current {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin: 8px 0 12px;
		font-size: 12px;
		color: #4d5670;
	}
	.bet-current strong {
		font: 400 24px/1.1 'Anton', 'OswaldCyr', sans-serif;
		color: #535e88;
		font-variant-numeric: tabular-nums;
	}
	.bet-total {
		font-size: 12px;
		color: #4d5670;
		margin: -4px 0 10px;
	}
	.bet-amount-grid {
		position: relative;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		overflow-y: auto;
		min-height: 90px;
		max-height: 312px;
		overscroll-behavior: contain;
		touch-action: pan-y;
		scrollbar-width: thin;
		scrollbar-color: #535e88 #cbc8bb;
		padding: 2px 6px 4px 2px;
	}
	.bet-amount-grid button {
		border: 2px solid #15191f;
		border-radius: 8px;
		background: #cbc8bb;
		color: #15191f;
		min-height: 52px;
		padding: 10px 6px 8px;
		font: 400 22px/1.2 'Anton', 'OswaldCyr', sans-serif;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.bet-amount-grid button.on {
		background: #b8d080;
		color: #15191f;
	}
	.bet-amount-grid button:focus-visible,
	.bet-done:focus-visible {
		outline: 2px solid #15191f;
		outline-offset: 2px;
	}
	@media (hover: hover) {
		.bet-amount-grid button:hover {
			background: #e7aa53;
		}
		.bet-amount-grid button.on:hover {
			background: #cfe39a;
			color: #15191f;
		}
		.bet-done:hover {
			background: #cfe39a;
		}
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding-top: 12px;
		flex-shrink: 0;
	}
	footer span {
		font-size: 10px;
		letter-spacing: 0.5px;
		color: #4d5670;
	}
	.bet-done {
		border: 2px solid #15191f;
		border-radius: 8px;
		padding: 10px 24px;
		background: #b8d080;
		color: #15191f;
		font: 400 16px var(--gb-display-font);
		min-height: 44px;
		cursor: pointer;
	}
</style>
