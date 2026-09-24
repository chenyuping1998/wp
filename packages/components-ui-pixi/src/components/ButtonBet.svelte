<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived, stateConfig, stateModal } from 'state-shared';

	import UiSprite from './UiSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import ButtonBetSpinIcon from './ButtonBetSpinIcon.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { uiTheme } from '../theme.svelte';
	import { hasEverBet, idleFor, platformUx } from '../platformUx.svelte';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();

	const context = getContext();


	// The button STAYS PRESSABLE when the balance will not cover the stake.
	//
	// It used to be `disabled`, so a player who was short found a dead control and
	// no explanation. Certification: "when the player has insufficient balance for
	// the current play, the bet button should remain clickable and the appropriate
	// message should be displayed. Likewise when pressing the space key."
	//
	// It still LOOKS unavailable — the plate greys, on the same condition, through
	// ButtonBetProvider's 'spin_disabled' key. It just answers when pressed.
	const cannotAfford = $derived(!stateBetDerived.isBetCostAvailable());
	// Off by default, so a game that has not opted in keeps the disabled button
	// it has always had rather than a pressable one with nothing behind it.
	// Lives in state-shared, not uiTheme, because the autoplay start button needs
	// the same answer and sits in a package that cannot see uiTheme.
	const explains = $derived(stateConfig.explainInsufficientBalance);
	const disabled = $derived(cannotAfford && !explains);
	const sizes = { width: UI_BASE_SIZE * 1.12, height: UI_BASE_SIZE * 1.12 };

	// Space must not reach the game through an open dialog. The bet menu, the
	// feature-buy menu and the info panel are all modals, and space over any of
	// them used to spin the reels behind it.
	const modalOpen = $derived(stateModal.modal !== null);

	const guardedPress = (onpress: () => void) => () => {
		if (cannotAfford && explains) {
			// 'message', not 'autoSpinMessage'. The autoplay modal prefixes its
			// reason with "AUTO PLAY HAS STOPPED DUE TO", which is a claim about
			// something that did not happen when the player simply pressed bet.
			stateModal.modal = { name: 'message', message: 'insufficientFunds' };
			return;
		}
		onpress();
	};


	// ── Idle nudge ────────────────────────────────────────────────────────────
	//
	// Hacksaw's `idleReminder()`: idle for 50s with a round already played ->
	// wait 300ms, add an animation class for 2000ms, then re-arm and check again
	// every 50s. It is excluded in the UK, which is a jurisdiction rule about
	// prompting play rather than a design opinion — noted because a game shipping
	// into that market has to switch this off.
	//
	// A ring that breathes, rather than the button moving: the button is round and
	// sits in a strip of round buttons, so growing it is read as a layout glitch
	// before it is read as a prompt.
	let nudge = $state(0);
	let nudgeRaf = 0;
	let nudgeStartedAt = 0;
	let idleTimer: ReturnType<typeof setInterval> | null = null;

	const stopNudge = () => {
		cancelAnimationFrame(nudgeRaf);
		nudge = 0;
	};

	const runNudge = () => {
		const ux = platformUx();
		if (!ux) return;
		nudgeStartedAt = performance.now();
		cancelAnimationFrame(nudgeRaf);
		const tick = (now: number) => {
			const elapsed = now - nudgeStartedAt;
			if (elapsed >= ux.idlePulseMs) return stopNudge();
			// two full breaths across the window, faded out at the end so it stops
			// rather than being cut
			const wave = 0.5 - 0.5 * Math.cos((elapsed / ux.idlePulseMs) * Math.PI * 4);
			nudge = wave * (1 - elapsed / ux.idlePulseMs);
			nudgeRaf = requestAnimationFrame(tick);
		};
		nudgeRaf = requestAnimationFrame(tick);
	};

	$effect(() => {
		const ux = platformUx();
		if (idleTimer !== null) clearInterval(idleTimer);
		idleTimer = null;
		if (!ux || ux.idleReminderMs <= 0) return;
		idleTimer = setInterval(() => {
			if (!hasEverBet()) return;
			// cannotAfford, not disabled: an opted-in game leaves the button
			// pressable when the player is short, so `disabled` is false there and
			// this guard would prompt the one player it exists to leave alone.
			if (cannotAfford) return;
			if (!context.stateXstateDerived.isIdle()) return;
			if (idleFor() < ux.idleReminderMs) return;
			setTimeout(runNudge, 300);
		}, ux.idleReminderMs);
		return () => {
			if (idleTimer !== null) clearInterval(idleTimer);
			idleTimer = null;
		};
	});

	onDestroy(stopNudge);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<!-- stopNudge runs on every press, guardedPress decides whether the press
		     reaches the game. In that order: a player who presses while short has
		     still interacted, so the idle prompt should stop either way. -->
		{@const press = () => {
			stopNudge();
			guardedPress(onpress)();
		}}
		<OnHotkey hotkey="Space" disabled={disabled || modalOpen} onpress={press} />
		<Button {...props} {sizes} onpress={press} {disabled}>
			{#snippet children({ center })}
				<Container {...center}>
					{#if nudge > 0}
						<!-- the idle nudge: a ring breathing out of the button's edge -->
						<UiSprite
							key="bet"
							width={sizes.width * (1 + 0.34 * nudge)}
							height={sizes.height * (1 + 0.34 * nudge)}
							anchor={0.5}
							backgroundColor={uiTheme.betBorder}
							borderColor={uiTheme.betBorder}
							borderWidth={7}
							borderRadius={sizes.width * 0.5}
							alpha={0.42 * (1 - nudge)}
						/>
					{/if}
					<UiSprite
						key="bet"
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						backgroundColor={cannotAfford || ['spin_disabled', 'stop_disabled'].includes(key)
							? uiTheme.buttonFillDisabled
							: uiTheme.betFill}
						borderColor={uiTheme.betBorder}
						borderWidth={7}
						borderRadius={sizes.width * 0.5}
						alpha={0.92}
					/>
					<!-- circular double-arrow: static when idle, spins while the reels
					     run, then finishes its turn and rests when they stop -->
					<ButtonBetSpinIcon
						spinning={['stop_default', 'stop_disabled'].includes(key)}
						radius={sizes.width * uiTheme.betIconScale}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
