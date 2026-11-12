<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContextEventEmitter } from 'utils-event-emitter';
	import { Button } from 'components-shared';

	import BaseIcon from 'components-ui-html/src/components/BaseIcon.svelte';
	import BaseButtonContent from 'components-ui-html/src/components/BaseButtonContent.svelte';
	import type { EmitterEventModal } from 'components-ui-html/src/types';

	import { gameText } from '../../game/i18nText';

	// Copy of components-ui-html's ModalSettingsSound with one change: the toggle
	// caption was the literal 'ON' / 'OFF' in every language (QA 11-11: German
	// settings read ON). It now comes from game/i18nText (16 locales).

	type Props = {
		value: number;
		children: Snippet;
	};

	let { value = $bindable(), children }: Props = $props();
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const ICONS = { on: 'volumeOn', off: 'volumeOff' } as const;
</script>

<div class="col">
	<span>{@render children()}</span>
	<div class="row">
		<!-- button -->
		<div class="button-wrap">
			<Button
				onclick={() => {
					eventEmitter.broadcast({ type: 'soundPressGeneral' });
					if (value === 0) {
						value = 50;
					} else {
						value = 0;
					}
				}}
			>
				<BaseIcon width="3rem" height="3rem" />
				<BaseButtonContent>
					<span>{value > 0 ? gameText('soundOn') : gameText('soundOff')}</span>
				</BaseButtonContent>
			</Button>
		</div>

		<!-- range -->
		<input bind:value type="range" min="0" max="100" class="range" />

		<!-- value -->
		<div class="value">
			<span>{value}</span>
		</div>
	</div>
</div>

<style lang="scss">
	.col {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
	}

	.button-wrap {
		width: 15%;
		display: flex;
		align-items: center;
	}

	.range {
		width: 70%;
		display: flex;
		align-items: center;
	}

	.value {
		width: 15%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
