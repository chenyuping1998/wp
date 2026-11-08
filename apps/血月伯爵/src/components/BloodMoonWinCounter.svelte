<script lang="ts">
 import {onMount} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {BitmapText,Container} from 'pixi.js';
 import {ensureWinCounterFonts,WIN_DIGITS_FRONT,WIN_DIGITS_BACK} from '../game/winCounterFonts';
 const {text,size=70,y=0,emboss=true}:{text:string;size?:number;y?:number;emboss?:boolean}=$props();
 const parent=getContextParent(),root=new Container({eventMode:'none'});
 const back=new BitmapText({text:'',style:{fontFamily:WIN_DIGITS_BACK,fontSize:70}});
 const front=new BitmapText({text:'',style:{fontFamily:WIN_DIGITS_FRONT,fontSize:70}});
 front.anchor.set(.5);back.anchor.set(.5);back.position.set(1,4);root.addChild(back,front);
 $effect(()=>{front.text=text;back.text=text;back.visible=emboss;root.scale.set(size/70);root.y=y;});
 onMount(()=>{ensureWinCounterFonts();parent.parent.addChild(root);return()=>root.destroy({children:true});});
</script>
