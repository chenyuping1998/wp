<script lang="ts">
	import type { Snippet } from 'svelte';
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';

	import { WILD_ALCHEMY_BET_MODE_META } from '../game/betModeMeta';

	/**
	 * A replay link names its mode in the URL (?mode=…). The shared lookup
	 * (stateBetDerived.activeBetMode) matches it upper- or lower-case and returns
	 * null for anything else, and the replay bar's LabelBet then read `.type` off
	 * that null: a mistyped mode (QA 11-11: mode=SUPER) threw during the first
	 * render and left a blank page with no message.
	 *
	 * Runs after Authenticate has stored the URL mode and the fetched round, and
	 * before the game mounts. An unknown mode raises the ordinary error panel
	 * (ModalError, the same one a failed replay request shows), drops the round
	 * so nothing is played under the wrong mode, and lets the game mount on BASE
	 * underneath it.
	 */
	type Props = { children: Snippet };
	const props: Props = $props();

	if (stateUrlDerived.replay()) {
		const key = stateBet.activeBetModeKey ?? '';
		const known = key.toUpperCase() in WILD_ALCHEMY_BET_MODE_META || key.toLowerCase() in WILD_ALCHEMY_BET_MODE_META;
		if (!known) {
			console.error(`replay: unknown mode "${key}"`);
			stateBet.activeBetModeKey = 'BASE';
			stateBet.betToResume = null;
			stateModal.modal = {
				name: 'error',
				error: { error: 'ERR_VAL', message: `Unknown replay mode: ${key}. This round cannot be replayed.` },
			};
		}
	}
</script>

{@render props.children()}
