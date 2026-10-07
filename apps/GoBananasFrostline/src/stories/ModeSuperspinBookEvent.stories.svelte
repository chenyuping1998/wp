<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_SUPERSPIN/bookEvent',
	});
</script>

<script lang="ts">
	import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBookEvent } from '../game/utils';
	import events from './data/superspin_events';

	setContext();

	const playAll = async () => {
		const sequence = [
			events.updateFreeSpin,
			events.reveal,
			events.newStickySymbols,
			events.updateFreeSpinReset,
			events.reveal2,
			events.newStickySymbols2,
			events.revealDead,
			events.prizeWinInfo,
			events.setWin,
			events.finalWin,
		];
		for (const bookEvent of sequence) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await playBookEvent(bookEvent as any, { bookEvents: [] });
		}
	};
</script>

{#snippet template(args: TemplateArgs<any>)}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<Story
	name="fullRound"
	args={templateArgs({
		skipLoadingScreen: true,
		data: undefined,
		action: async () => await playAll(),
	})}
	{template}
/>

<Story
	name="reveal"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.reveal,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="newStickySymbols"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.newStickySymbols,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="prizeWinInfo"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.prizeWinInfo,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>
