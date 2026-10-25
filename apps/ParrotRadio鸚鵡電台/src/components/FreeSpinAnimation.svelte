<script lang="ts">
 import type {Snippet} from 'svelte';
 import {Container,Graphics,Sprite} from 'pixi-svelte';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 const props:{children:Snippet<[{sizes:{width:number;height:number}}]>}=$props();const context=getContext();
 const sizes=$derived({width:Math.min(context.stateLayoutDerived.mainLayout().width*.8,900),height:320});
</script>
<MainContainer><Container x={context.stateLayoutDerived.mainLayout().width*.5} y={context.stateLayoutDerived.mainLayout().height*.45}>
 <Sprite key="mgFsSign" anchor={.5} width={sizes.width*1.2} height={sizes.height*1.35}/>
 {@render props.children({sizes})}
</Container></MainContainer>
