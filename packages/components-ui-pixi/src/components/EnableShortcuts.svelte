<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { stateBet, stateBetDerived, stateConfig, stateModal, stateSound } from 'state-shared';

	import { getContext } from '../context';
	import { markBetChanged, platformUx } from '../platformUx.svelte';

	/**
	 * Shift-gated keyboard shortcuts.
	 *
	 * Taken from Hacksaw's shipped UI (Densho 1.25.1), where the same 24-key table
	 * and the same 100ms throttle appear in The Luxe as well — it is the house
	 * convention, not one game's idea. The value of copying it is that a player
	 * arriving from any Hacksaw title already knows it.
	 *
	 * Two rules carry most of the design:
	 *
	 *   EVERYTHING IS BEHIND SHIFT. A bare letter key in a casino game is a
	 *   liability: the player is holding the spacebar, some of them are typing in
	 *   a stake field, and a stray `a` that starts autoplay is a complaint about
	 *   money. Shift makes every shortcut deliberate.
	 *
	 *   A 100ms THROTTLE across the whole table, not per key. OS auto-repeat will
	 *   otherwise walk the stake to the ceiling from one held arrow.
	 *
	 * Only mounted when the game opts into `uiTheme.platformUx`, so no game gains
	 * a keyboard surface it did not ask for.
	 *
	 * The set implemented here is the subset this app has controls for. Hacksaw's
	 * remaining keys are for features that do not exist here (Super Turbo, bet
	 * history, lobby, loss/win limits, the dev auto-clicker), and inventing
	 * bindings for absent features would only teach a player a shortcut that does
	 * nothing.
	 */
	const context = getContext();

	// Shared across the table, exactly as `_lastKeybindTrigger` is.
	let lastTriggerAt = 0;

	const EXCLUDED_TAGS = ['input', 'textarea', 'select'];

	const stepBet = (direction: 1 | -1) => {
		const options = [...stateConfig.betAmountOptions].sort((a, b) => a - b);
		if (options.length) {
			const next =
				direction === 1
					? options.find((option) => option > stateBet.betAmount)
					: [...options].reverse().find((option) => option < stateBet.betAmount);
			if (next === undefined) return;
			markBetChanged();
			stateBetDerived.setBetAmount(next);
			return;
		}
		if (stateConfig.stepBet <= 0) return;
		const raw = stateBet.betAmount + direction * stateConfig.stepBet;
		const clamped = Math.min(stateConfig.maxBet, Math.max(stateConfig.minBet, raw));
		if (clamped === stateBet.betAmount) return;
		markBetChanged();
		stateBetDerived.setBetAmount(clamped);
	};

	const handle = (event: KeyboardEvent) => {
		const ux = platformUx();
		if (!ux?.shortcuts) return;
		if (!event.shiftKey) return;
		// Ctrl/Cmd combinations belong to the browser. Hacksaw bails on
		// `_keyDowns.CTRL_PLUS_KEY` for the same reason.
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		// A stake typed into a field is not a shortcut.
		if (EXCLUDED_TAGS.includes((event.target as HTMLElement)?.tagName?.toLowerCase())) return;
		// Numpad. Hacksaw drops `e.location == 3`; this is the same test.
		if (event.location === 3) return;

		const now = Date.now();
		if (now - lastTriggerAt < ux.keybindThrottleMs) return;

		const isIdle = context.stateXstateDerived.isIdle();
		const key = event.key.toLowerCase();
		let handled = true;

		switch (key) {
			case 't':
				// Two states here, not Hacksaw's three — there is no Super Turbo.
				stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
				break;
			case 's':
				stateSound.volumeValueMaster = stateSound.volumeValueMaster === 0 ? 50 : 0;
				break;
			case 'a':
				// Stopping autoplay is allowed from any state; starting it is not.
				// Hacksaw's `#StopAutoplayBtn` skips the `_uiEnabled` check for the
				// same reason: a player wanting to stop must never be told to wait.
				if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
				else if (isIdle) stateModal.modal = { name: 'autoSpin' };
				break;
			case 'i':
			case 'g':
				stateModal.modal = stateModal.modal?.name === 'gameRules' ? null : { name: 'gameRules' };
				break;
			case 'p':
				stateModal.modal = stateModal.modal?.name === 'payTable' ? null : { name: 'payTable' };
				break;
			case 'b':
			case 'f':
				// Buying is a purchase, so it is idle-only. `isIdle()` is also what
				// covers Hacksaw's separate "not during a free game" guard here: the
				// state machine is not idle for the length of a feature, which is
				// exactly the rule ButtonBuyBonus already uses to disable itself.
				if (!isIdle) break;
				stateModal.modal = stateModal.modal?.name === 'buyBonus' ? null : { name: 'buyBonus' };
				break;
			case 'arrowup':
				// A held key auto-repeats; the stake may only move one step per
				// deliberate press (Stake review, 2026-10-04 — same rule as the
				// on-screen steppers).
				if (event.repeat) break;
				if (isIdle) stepBet(1);
				break;
			case 'arrowdown':
				if (event.repeat) break;
				if (isIdle) stepBet(-1);
				break;
			default:
				handled = false;
		}

		if (!handled) return;
		lastTriggerAt = now;
		event.preventDefault();
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};

	onMount(() => window.addEventListener('keydown', handle));
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', handle);
	});
</script>
