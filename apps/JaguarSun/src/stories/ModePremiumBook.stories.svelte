<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story } = defineMeta({ title: 'MODE_PREMIUM/book' });
</script>

<script lang="ts">
 import { StoryGameTemplate, StoryLocale, type TemplateArgs, templateArgs } from 'components-storybook';
 import Game from '../components/Game.svelte';
 import { setContext } from '../game/context';
 import { playBet } from '../game/utils';
 import books from './data/bonus_hits_books';
 setContext();
</script>

{#snippet template(args: TemplateArgs<any>)}
 <StoryGameTemplate skipLoadingScreen={args.skipLoadingScreen} action={async () => { await args.action?.(args.data); }}>
  <StoryLocale lang="en"><Game /></StoryLocale>
 </StoryGameTemplate>
{/snippet}

 <Story name="First recorded feature" args={templateArgs({
  skipLoadingScreen: true,
  data: books[0],
  action: async () => { const book = books[0]; await playBet({ ...book, state: book.events }); },
 })} {template} />
