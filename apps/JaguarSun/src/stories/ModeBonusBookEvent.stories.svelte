<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_BONUS/bookEvent',
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
	import events from './data/bonus_events';

	setContext();
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
	name="reveal"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.reveal,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="setTotalWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.setTotalWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="freeSpinTrigger"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.freeSpinTrigger,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="updateFreeSpin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.updateFreeSpin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="winInfo"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.winInfo,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="setWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.setWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!--
	These four were newExpandingWilds/updateExpandingWilds, which are GoBananas
	events Hot Miami never emits - the stories fired `undefined`. They now cover
	this game's own feature events instead.
-->
<Story
	name="newFrames"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.newFrames,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="updateFrames"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.updateFrames,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="collectorWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.collectorWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="bonusTier"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.bonusTier,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="freeSpinEnd"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.freeSpinEnd,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="finalWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.finalWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>
