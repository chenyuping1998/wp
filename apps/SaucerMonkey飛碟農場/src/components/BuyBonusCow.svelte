<script lang="ts">
	/**
	 * Plays the abducted-cow Buy Bonus (game/buyBonusCow.ts) by re-pointing the
	 * shared button's sprite keys. Draws nothing itself.
	 *
	 *   off     while the button is disabled (a spin is running): the beam is down
	 *   idle    one beat every 6.5-9 s while it is ready — the beam flickers, the
	 *           ship dips, the cow looks up and kicks once — then still again
	 *           (motion restraint: one act, then a long rest; never a loop)
	 *   press   when the buy menu opens from it: the beam yanks, legs flail. Played
	 *           on the plate AND on the hover's held key, so a mouse sees it too
	 *
	 * Timers, not requestAnimationFrame: rAF stops in a hidden tab and the plate
	 * would come back frozen mid-kick.
	 */
	import { onMount } from 'svelte';
	import { stateModal, stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { BB_FRAMES, BB_FRAME_MS, BB_HOLD_KEY, setBbSprite } from '../game/buyBonusCow';

	const context = getContext();
	const disabled = $derived(!context.stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');
	const restFrame = $derived(disabled ? BB_FRAMES.off : BB_FRAMES.rest);

	let playing: ReturnType<typeof setTimeout> | undefined;
	const HOLD = BB_FRAMES.hover[BB_FRAMES.hover.length - 1];

	const stop = () => {
		clearTimeout(playing);
		playing = undefined;
	};
	/** one pass through `frames` on `keys`, then `done` */
	const play = (frames: string[], keys: string[], done: () => void) => {
		stop();
		let i = 0;
		const step = () => {
			if (i >= frames.length) {
				playing = undefined;
				done();
				return;
			}
			for (const k of keys) setBbSprite(k, frames[i]);
			i += 1;
			playing = setTimeout(step, BB_FRAME_MS);
		};
		step();
	};

	// the resting plate follows the button's state, unless an act is on
	$effect(() => {
		const frame = restFrame;
		if (disabled) stop();
		if (!playing) setBbSprite('buyBonus', frame);
	});

	// the press: the buy menu opening from this button
	let wasOpen = false;
	$effect(() => {
		const open = stateModal.modal?.name === 'buyBonus';
		if (open && !wasOpen && !disabled) {
			play(BB_FRAMES.press, ['buyBonus', BB_HOLD_KEY], () => {
				setBbSprite(BB_HOLD_KEY, HOLD);
				setBbSprite('buyBonus', restFrame);
			});
		}
		wasOpen = open;
	});

	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const schedule = () => {
			timer = setTimeout(() => {
				// nobody acts under a menu, during a spin, in a bought mode or unseen
				const quiet = !disabled && !active && !stateModal.modal && !playing && document.visibilityState === 'visible';
				if (quiet) play(BB_FRAMES.idle, ['buyBonus'], () => setBbSprite('buyBonus', restFrame));
				schedule();
			}, 6500 + Math.random() * 2500);
		};
		schedule();
		return () => {
			clearTimeout(timer);
			stop();
			setBbSprite('buyBonus', BB_FRAMES.rest);
			setBbSprite(BB_HOLD_KEY, HOLD);
		};
	});
</script>
