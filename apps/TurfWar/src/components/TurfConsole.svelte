<script lang="ts">
  import { MainContainer } from 'components-layout';
  import { Container, Graphics, Text } from 'pixi-svelte';
  import { stateReplay, stateUi } from 'state-shared';
  import type { LayoutUiProps } from 'components-ui-pixi';
  import ButtonReplay from 'components-ui-pixi/src/components/ButtonReplay.svelte';
  import UiBarStrip from 'components-ui-pixi/src/components/UiBarStrip.svelte';
  import { getContext } from '../game/context';
  import { getSocialTerms } from '../game/socialTerms';
  import { GAME_FONT } from '../game/fonts';
  const props: LayoutUiProps = $props();
  const context = getContext();
  const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
  const top = $derived(box.height - (portrait ? 360 : 178));
  const controlsY = $derived(portrait ? top + 228 : top + 78);
  const metricY = $derived(portrait ? top + 30 : top + 22);
  // Landscape bar_plate caps are ~42 units wide (75 of 270 source px at 150 tall);
  // every control keeps inside them (「一堆按鈕超框」 2026-10-23).
  const menuX = $derived(portrait ? 160 : 120);
  const spinX = $derived(portrait ? 845 : box.width - 385);
  const betX = $derived(portrait ? 465 : box.width - 820);
  const scale = $derived(portrait ? 0.8 : 0.74);
  const secondaryScale = $derived(portrait ? 0.8 : 0.6);
  const caption = { fontFamily: GAME_FONT, fontSize: 25, fontWeight: '700' as const, fill: 0xffc38a };
  const terms = $derived(getSocialTerms());
  const menuItems = $derived([
    { label: 'SOUND', render: props.buttonSoundSwitch },
    { label: terms.payTableUpper, render: props.buttonPayTable },
    { label: 'RULES', render: props.buttonGameRules },
    { label: 'SETTINGS', render: props.buttonSettings },
  ]);
</script>

<Container x={20}>{@render props.gameName()}</Container>
<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>{@render props.logo()}</Container>

<MainContainer standard>
  <Container zIndex={-10}><UiBarStrip assetKey="turfUiBarPlate" x={20} y={top} width={box.width - 40} height={portrait ? 330 : 150} slice={480} /></Container>
  <Graphics draw={(g) => {
    g.clear();
    // Only information groups have separators; there is no empty boxed cell.
    const dividers = portrait ? [box.width * .5] : [180, 540, 875];
    for (const x of dividers) { g.moveTo(x, top + 24); g.lineTo(x, top + (portrait ? 112 : 124)); g.stroke({ color: 0xf7f5f0, width: 1.5, alpha: .18 }); }
    g.roundRect(betX - (portrait ? 215 : 214), controlsY - 56, portrait ? 430 : 428, 112, 14);
    g.fill({ color: 0x121212, alpha: .5 });
  }} />

  <Container x={portrait ? 275 : 360} y={metricY} scale={portrait ? .82 : .8}>
    {@render props.amountBalance({ stacked: true, tiled: false, maxWidth: portrait ? 410 : 390 })}
  </Container>
  <Container x={portrait ? 805 : 710} y={metricY} scale={portrait ? .82 : .8}>
    {@render props.amountWin({ stacked: true, tiled: false, maxWidth: portrait ? 410 : 340 })}
  </Container>

  {#if !stateReplay.enabled}
    <Container x={betX - (portrait ? 150 : 155)} y={controlsY} scale={scale}>
      {@render props.buttonDecrease({ anchor: .5 })}
    </Container>
    <Container x={betX + (portrait ? 150 : 155)} y={controlsY} scale={scale}>
      {@render props.buttonIncrease({ anchor: .5 })}
    </Container>
  {/if}
  <Container x={betX} y={controlsY - 49} scale={portrait ? .8 : .75}>
    {@render props.amountBet({ stacked: true, tiled: false, maxWidth: portrait ? 300 : 280, centerGroup: true })}
  </Container>
  <Container x={spinX} y={controlsY} scale={portrait ? 1.0 : 0.86}>
    {#if stateReplay.enabled}<ButtonReplay anchor={.5} />{:else}{@render props.buttonBet({ anchor: .5 })}{/if}
  </Container>
  <!-- Portrait has no room for these inside the bar's caps: they sit above its right end, mirroring Buy Bonus. -->
  <Container x={portrait ? 835 : box.width - 232} y={portrait ? top - 90 : controlsY} scale={secondaryScale}>
    {@render props.buttonAutoSpin({ anchor: .5 })}
  </Container>
  <Container x={portrait ? 955 : box.width - 128} y={portrait ? top - 90 : controlsY} scale={secondaryScale}>
    {@render props.buttonTurbo({ anchor: .5 })}
  </Container>
  <Container x={menuX} y={controlsY} scale={portrait ? .8 : .6}>
    {#if stateUi.menuOpen}{@render props.buttonMenuClose({ anchor: .5 })}{:else}{@render props.buttonMenu({ anchor: .5 })}{/if}
  </Container>
  {#if !stateUi.freeSpinCounterShow && !stateReplay.enabled}
    <!-- uiTheme.buyBonusRailScale 1.35 is the size the board limits were solved for (stateGame); 0.64 read as a stamp.
         Raised off the bar (「BB按鈕太下面」 2026-10-23). -->
    <Container x={portrait ? 170 : 160} y={top - (portrait ? 175 : 245)} scale={portrait ? 1.3 : 1.35}>
      {@render props.buttonBuyBonus({ anchor: .5 })}
    </Container>
  {/if}
  {#if stateUi.menuOpen}
    <Graphics draw={(g) => { g.clear();g.roundRect(24, top - 610, portrait ? 520 : 350, 600, 18);g.fill({color:0x121212,alpha:.98});g.stroke({color:0xf5893d,width:3}); }} />
    {#each menuItems as item, i}
      <Container x={portrait ? 115 : 95} y={top - 95 - i * 145} scale={portrait ? .9 : .7}>
        {@render item.render({ anchor: .5 })}
      </Container>
      <Text x={portrait ? 215 : 170} y={top - 95 - i * 145} anchor={{x:0,y:.5}} text={item.label} style={caption} />
    {/each}
  {/if}
</MainContainer>
