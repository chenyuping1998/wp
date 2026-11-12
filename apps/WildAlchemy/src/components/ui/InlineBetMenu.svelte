<script lang="ts">
	// The stake list bar v3 opens beside its BET box (Mummy Mayhem's inline menu,
	// via Hypno Monkey / Pickle Panic / Dragon Tide), in place of the full-screen
	// bet menu (ui/ModalBetMenu.svelte, still in the tree, no longer mounted).
	//
	// Wild Alchemy (2026-11-11): the manuscript dress — a sepia panel with an
	// ochre rule, amounts on sepia chips edged in verdigris, the chosen amount on
	// ochre; Saira (the game's face); every word in the player's language
	// (game/i18nText.ts), socialTerms-safe English in social play. The chosen chip
	// is marked with `.on`, not `.selected` (house-rules D2 item 8: `.selected`
	// is also a global class in ui/Modals.svelte's popup skin).
	import { tick } from 'svelte';
	import { stateBet, stateBetDerived, stateConfig, stateModal, stateUrlDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { i18nDerived, markBetChanged } from 'components-ui-pixi';
	import { zIndex } from 'constants-shared/zIndex';

	import { inlineBetAnchor } from '../../game/inlineBetAnchor.svelte';
	import { inlineBetLayout } from '../../game/inlineBetLayout';
	import { gameText } from '../../game/i18nText';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const open = $derived(stateModal.modal?.name === 'betAmountMenu');
	const social = $derived(stateUrlDerived.social());
	const rtl = $derived(stateUrlDerived.lang() === 'ar' ? 'rtl' : undefined);
	const amounts = $derived(
		[...new Set(stateConfig.betAmountOptions.length ? stateConfig.betAmountOptions : stateConfig.betMenuOptions)]
			.filter((v) => v > 0)
			.sort((a, b) => a - b),
	);
	const L = $derived({
		title: i18nDerived.betAmount(),
		base: social ? 'PLAY AMOUNT' : gameText('betBase'),
		total: social ? 'TOTAL PLAY AMOUNT' : gameText('betTotal'),
		scroll: gameText('betScroll'),
		done: gameText('betDone'),
		close: gameText('close'),
	});
	let panel = $state<HTMLDivElement>();
	let grid = $state<HTMLDivElement>();
	let box = $state({ left: 12, top: 12, width: 360, height: 420 });
	// the "scroll for more" hint only when the list really runs past the panel
	let overflows = $state(false);
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
			overflows = !!grid && grid.scrollHeight > grid.clientHeight + 2;
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
	<div class="bet-layer" style:z-index={zIndex.modal} dir={rtl}>
		<button class="bet-backdrop" aria-label={L.close} onclick={close}></button>
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
				<h2 id="inline-bet-title">{L.title}</h2>
				<button class="bet-close" aria-label={L.close} onclick={close}>
					<svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="M-6 -6 L6 6 M6 -6 L-6 6" /></svg>
				</button>
			</header>
			<div class="bet-current">{L.base} <strong>{numberToCurrencyString(stateBet.betAmount)}</strong></div>
			{#if (stateBetDerived.activeBetMode()?.costMultiplier ?? 1) > 1}
				<div class="bet-total">{L.total}: {numberToCurrencyString(stateBetDerived.betCost())}</div>
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
			<footer>
				<span>{overflows ? L.scroll : ''}</span>
				<button type="button" class="bet-done" onclick={close}>{L.done}</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.bet-layer {
		position: fixed;
		inset: 0;
		pointer-events: none;
		font-family: var(--hm-title-font, 'Saira', 'Arial Narrow', Arial, sans-serif);
		color: var(--capo-bone);
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
		border: 2px solid var(--capo-gold);
		border-radius: 12px;
		/* opaque: no board showing through (house-rules D3) */
		background: var(--capo-ink-deep);
		box-shadow:
			inset 0 0 0 5px var(--capo-ink-deep),
			inset 0 0 0 6px rgba(63, 138, 110, 0.75),
			0 12px 40px rgba(0, 0, 0, 0.55);
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
		font: 700 21px/1.2 var(--hm-title-font, 'Saira', Arial, sans-serif);
		color: var(--capo-gold);
		letter-spacing: 0.04em;
	}
	:global([dir='rtl']) h2 {
		letter-spacing: 0;
	}
	.bet-close {
		display: grid;
		place-items: center;
		border: 0;
		background: transparent;
		cursor: pointer;
		min-width: 40px;
		min-height: 40px;
		padding: 0;
	}
	.bet-close svg {
		width: 18px;
		height: 18px;
		stroke: var(--capo-bone);
		stroke-width: 2.6;
		stroke-linecap: round;
		fill: none;
	}
	.bet-close:hover svg {
		stroke: var(--capo-gold-light);
	}
	.bet-current {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin: 8px 0 12px;
		font-size: 13px;
		font-weight: 600;
		color: #cdbb94;
	}
	.bet-current strong {
		font-size: 21px;
		color: var(--capo-gold-light);
		font-variant-numeric: tabular-nums;
	}
	.bet-total {
		font-size: 13px;
		color: #cdbb94;
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
		scrollbar-color: var(--capo-gold) var(--capo-ink);
		padding: 2px 6px 2px 2px;
	}
	.bet-amount-grid button {
		border: 1px solid var(--capo-gunmetal);
		border-radius: 8px;
		background: var(--capo-ink);
		color: var(--capo-bone);
		min-height: 52px;
		padding: 13px 6px 11px;
		font: 700 18px/1.2 var(--hm-number-font, 'Saira', Arial, sans-serif);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.bet-amount-grid button.on {
		background: var(--capo-gold);
		border-color: var(--capo-gold-light);
		color: var(--capo-ink-deep);
	}
	.bet-amount-grid button:focus-visible,
	.bet-done:focus-visible,
	.bet-close:focus-visible {
		outline: 2px solid var(--capo-gold-light);
		outline-offset: -3px;
	}
	/* hover warms a chip toward ochre, never a grey (house-rules D4) */
	@media (hover: hover) {
		.bet-amount-grid button:hover {
			border-color: var(--capo-gold);
			background: #523b22;
		}
		.bet-amount-grid button.on:hover {
			background: var(--capo-gold-light);
			color: var(--capo-ink-deep);
		}
		.bet-done:hover {
			background: var(--capo-gold-light);
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
		font-size: 11px;
		letter-spacing: 0.04em;
		color: #b9a682;
	}
	.bet-done {
		border: 1px solid var(--capo-ink-deep);
		border-radius: 8px;
		padding: 10px 24px;
		background: var(--capo-gold);
		color: var(--capo-ink-deep);
		font: 700 16px var(--hm-title-font, 'Saira', Arial, sans-serif);
		min-height: 44px;
		cursor: pointer;
	}
</style>
