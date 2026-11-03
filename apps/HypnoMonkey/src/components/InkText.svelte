<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	const props=$props<{text:string;x:number;y:number;fontSize:number;maxWidth:number;maxHeight:number;fill?:number;stroke?:number}>();
	const layout=$derived.by(()=>{
		const stroke=props.stroke??4;
		const style={fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:props.fontSize,stroke:{color:0x2a1f24,width:stroke}};
		const box=CanvasTextMetrics.measureText(props.text,new TextStyle(style));
		const ctx=document.createElement('canvas').getContext('2d')!;
		ctx.font=`${GAME_FONT_WEIGHT} ${props.fontSize}px ${GAME_FONT}`;
		const ink=ctx.measureText(props.text);
		// Pixi anchors the font's ascender/descender box. Centre the actual painted glyphs.
		return {style,x:box.width/2-stroke/2-(ink.actualBoundingBoxRight-ink.actualBoundingBoxLeft)/2,
			y:box.height/2-stroke/2-box.fontProperties.ascent-(ink.actualBoundingBoxDescent-ink.actualBoundingBoxAscent)/2,
			scale:Math.min(1,props.maxWidth/(ink.actualBoundingBoxLeft+ink.actualBoundingBoxRight+stroke),props.maxHeight/(ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent+stroke))};
	});
</script>
<Container x={props.x} y={props.y} scale={layout.scale}>
	<Text anchor={0.5} x={layout.x} y={layout.y} text={props.text} style={{...layout.style,fill:props.fill??0xffe08a}} />
</Container>
