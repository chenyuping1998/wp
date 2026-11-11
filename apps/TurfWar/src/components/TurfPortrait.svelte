<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import { MainContainer } from 'components-layout';
  import { Container, Graphics, Rectangle } from 'pixi-svelte';
  import { stateUi, stateModal } from 'state-shared';
  import type { LayoutUiProps } from 'components-ui-pixi';
  import ButtonDrawer from 'components-ui-pixi/src/components/ButtonDrawer.svelte';
  import { FadeContainer } from 'components-pixi';
  import { waitForResolve } from 'utils-shared/wait';
  import { getContext } from '../game/context';

  const props: LayoutUiProps = $props();
  const context = getContext();
  const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const W = $derived(box.width);
  const H = $derived(box.height);
  // One anchored console: readouts, stake + primary action, secondary tools.
  // All units scale with the standard box; the reel/character layout is untouched.
  const fold = new Tween(stateUi.drawerFold ? 530 : 0, { duration: 240, easing: cubicInOut });
  let drawerComplete = $state(() => {});
  context.eventEmitter.subscribeOnMount({
    drawerButtonShow: async () => {
      if (stateUi.drawerButtonShow) return;
      stateUi.drawerButtonShow = true;
      await waitForResolve(resolve => drawerComplete = resolve);
    },
    drawerButtonHide: async () => {
      if (!stateUi.drawerButtonShow) return;
      stateUi.drawerButtonShow = false;
      await waitForResolve(resolve => drawerComplete = resolve);
    },
    drawerFold: async () => { if (!stateUi.drawerFold) await fold.set(530); },
    drawerUnfold: async () => { if (stateUi.drawerFold) await fold.set(0); },
  });
</script>

<Container x={20}>{@render props.gameName()}</Container>
<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>{@render props.logo()}</Container>
<MainContainer standard alignVertical="bottom">
  <Container y={fold.current}>
    <Graphics draw={g => {
      g.clear();
      const y = H - 575;
      g.poly([20,y+24,44,y,W-44,y,W-20,y+24,W-20,H-24,W-44,H-8,44,H-8,20,H-24]);
      g.fill({color:0x17191c,alpha:.98});
      g.stroke({color:0xb4aca0,width:4});
      g.moveTo(44,y+14);g.lineTo(W-44,y+14);g.stroke({color:0xf5893d,width:5});
      g.moveTo(48,y+153);g.lineTo(W-48,y+153);g.stroke({color:0x55585d,width:2});
      g.moveTo(W/2,y+32);g.lineTo(W/2,y+126);g.stroke({color:0x55585d,width:2});
      g.moveTo(48,H-180);g.lineTo(W-48,H-180);g.stroke({color:0x55585d,width:2});
      // The stake is the only inset readout: it is an interactive surface.
      g.roundRect(58,H-390,W*.55,167,12);g.fill({color:0x2b2e33});
      g.stroke({color:0x9a9ca0,width:2});
    }}/>
    <Container x={W*.26} y={H-535} scale={.92}>
      {@render props.amountBalance({stacked:true,tiled:false,maxWidth:470})}
    </Container>
    <Container x={W*.74} y={H-535} scale={.92}>
      {@render props.amountWin({stacked:true,tiled:false,maxWidth:470})}
    </Container>
    <Container x={W*.325} y={H-364} scale={1.02}>
      {@render props.amountBet({stacked:true,tiled:false,maxWidth:420,centerGroup:true})}
    </Container>
    <Rectangle x={58} y={H-390} width={W*.55} height={167} alpha={0}
      eventMode="static" cursor={context.stateXstateDerived.isIdle() ? 'pointer' : 'not-allowed'}
      onpointerup={() => {
        if (!context.stateXstateDerived.isIdle()) return;
        context.eventEmitter.broadcast({type:'soundPressGeneral'});
        stateModal.modal = {name:'betAmountMenu'};
      }}/>
    <Container x={W*.79} y={H-306} scale={1.52}>
      {@render props.buttonBet({anchor:.5})}
    </Container>
    <Container x={W*.14} y={H-93} scale={.93}>{@render props.buttonMenu({anchor:.5})}</Container>
    <Container x={W*.36} y={H-93} scale={.93}>{@render props.buttonAutoSpin({anchor:.5})}</Container>
    <Container x={W*.58} y={H-93} scale={.93}>{@render props.buttonTurbo({anchor:.5})}</Container>
    {#if !stateUi.freeSpinCounterShow}
      <Container x={W*.82} y={H-93} scale={.95}>{@render props.buttonBuyBonus({anchor:.5})}</Container>
    {/if}
  </Container>
  <FadeContainer persistent show={stateUi.drawerButtonShow} oncomplete={drawerComplete}>
    <Container x={W-105} y={H-100}>
      <ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={.5}/>
    </Container>
  </FadeContainer>
</MainContainer>

{#if stateUi.menuOpen}
  <Rectangle eventMode="static" cursor="pointer" alpha={.65} anchor={.5} backgroundColor={0x121212}
    width={context.stateLayoutDerived.canvasSizes().width} height={context.stateLayoutDerived.canvasSizes().height}
    x={context.stateLayoutDerived.canvasSizes().width/2} y={context.stateLayoutDerived.canvasSizes().height/2}
    onpointerup={() => stateUi.menuOpen = false}/>
  <MainContainer standard alignVertical="bottom">
    <Container x={W*.14} y={H-93}>
      <Container y={-210*4}>{@render props.buttonPayTable({anchor:.5})}</Container>
      <Container y={-210*3}>{@render props.buttonGameRules({anchor:.5})}</Container>
      <Container y={-210*2}>{@render props.buttonSettings({anchor:.5})}</Container>
      <Container y={-210}>{@render props.buttonSoundSwitch({anchor:.5})}</Container>
      {@render props.buttonMenuClose({anchor:.5})}
    </Container>
  </MainContainer>
{/if}
