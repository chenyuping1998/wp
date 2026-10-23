<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { FadeContainer } from 'components-pixi';
  import { getContext } from '../game/context';
  const props: { children: Snippet } = $props();
  const context = getContext();
  let show = $state(true);
  let oncomplete = $state<() => void>(() => {});
  let pending: (() => void) | null = null;
  async function visible(next:boolean) {
    if(show===next)return;
    pending?.();
    let timer: ReturnType<typeof setTimeout>;
    const settled = new Promise<void>((resolve)=>{
      const finish=()=>{clearTimeout(timer);resolve();if(pending===finish)pending=null;};
      pending=finish;oncomplete=finish;timer=setTimeout(finish,1200);
    });
    // Arm completion before changing the state that starts the animation.
    show=next;
    await settled;
  }
  context.eventEmitter.subscribeOnMount({uiShow:()=>visible(true),uiHide:()=>visible(false)});
  onDestroy(()=>pending?.());
</script>
<FadeContainer persistent {show} {oncomplete}>
  {@render props.children()}
</FadeContainer>
