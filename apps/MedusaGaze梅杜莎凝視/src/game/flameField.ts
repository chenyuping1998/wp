/** Small, deterministic heat field: fuel burns at the bowl and advects upward.
 * No whole-flame scaling or repeating silhouette. Runs at 30 Hz; rendering is
 * bilinear so the field stays soft at the small in-game size. */
export function createFlameField(seed:number,width=64,height=64){
	let heat=new Float32Array(width*height),next=new Float32Array(heat.length),frame=0,time=0;
	// Square dimensions also keep texture row strides identical on WebGL and WebGPU.
	const pixels=new Uint8Array(width*height*4),noise=new Float32Array(heat.length);
	let random=seed|0;
	for(let i=0;i<noise.length;i++){random=(Math.imul(random,1664525)+1013904223)|0;noise[i]=(random>>>0)/4294967296;}
	const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
	function sample(x:number,y:number){
		x=Math.max(0,Math.min(width-1.001,x));y=Math.max(0,Math.min(height-1.001,y));
		const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,j=iy*width+ix;
		return (heat[j]*(1-fx)+heat[j+1]*fx)*(1-fy)+(heat[j+width]*(1-fx)+heat[j+width+1]*fx)*fy;
	}
	function step(){
		time+=1/30;frame++;next.fill(0);
		for(let y=0;y<height-3;y++){
			const bend=Math.sin(y*.095+time*2.1+seed)*.70+Math.sin(y*.22+time*3.7+seed*.7)*.36;
			for(let x=1;x<width-1;x++){
				const drift=bend+Math.sin(y*.12+time*4.2+seed)*1.1*(1-y/height)+Math.sin(x*.38+y*.20+time*3.7)*.65;
				const rising=sample(x-drift,y+2.35)*.64+(sample(x-drift-1,y+2.35)+sample(x-drift+1,y+2.35))*.18;
				next[y*width+x]=Math.max(0,rising-(112/height)*(.0155+(1-y/height)*.008+noise[(y*width+x+frame*17)%noise.length]*.005));
			}
		}
		for(let y=height-3;y<height;y++)for(let x=1;x<width-1;x++){
			const xx=(x-width*.5)/width;
			let fuel=0;
			for(let lobe=0;lobe<3;lobe++){
				const centre=(lobe-1)*.155+Math.sin(time*(1.7+lobe*.39)+seed+lobe*2)*.022;
				const strength=.72+.30*Math.sin(time*(5.7+lobe*.83)+seed+lobe*2.4)+.12*Math.sin(time*13.1+lobe);
				fuel=Math.max(fuel,Math.exp(-(((xx-centre)/(.082+lobe*.007))**2))*strength);
			}
			next[y*width+x]=fuel;
		}
		[heat,next]=[next,heat];
	}
	function paint(){
		for(let y=0;y<height;y++){
			const up=1-y/(height-1);
			const tongues=Array.from({length:3},(_,k)=>{
				const phase=seed*.17+k*2.4,length=.64+.11*Math.sin(time*(2.1+k*.33)+phase)+.06*Math.sin(time*5.1+phase);
				const rel=up/length,live=Math.max(0,1-rel);
				return{rel,centre:(k-1)*.142+up*(Math.sin(up*8-time*4.1+phase)*.13+Math.sin(up*15-time*6+phase*.6)*.06),width:(.150+.014*Math.sin(time*3.2+phase))*live**.72*(1+.13*Math.sin(up*19-time*6+phase)),fade:1-smooth(.86,1,rel)};
			});
			for(let x=0;x<width;x++){
				const xx=x/(width-1)-.5,i=y*width+x,j=i*4;let opacity=0,temp=0;
				for(const tongue of tongues){
					if(tongue.width<.0001)continue;
					const inside=Math.max(0,1-Math.abs(xx-tongue.centre)/tongue.width);
					const a=smooth(0,.42,inside)*tongue.fade;
					opacity=Math.max(opacity,a);temp=Math.max(temp,(.48+.51*Math.sqrt(inside)-.16*tongue.rel)*a);
				}
				const t=Math.max(0,Math.min(1,temp*.78+heat[i]*.22)),a=opacity*.96,hot=smooth(.28,.85,t),white=smooth(.72,.98,t);
				pixels[j]=Math.round(255*a);pixels[j+1]=Math.round((58+184*hot+10*white)*a);pixels[j+2]=Math.round((4+34*hot+146*white)*a);pixels[j+3]=Math.round(255*a);
			}
		}
	}
	for(let i=0;i<90;i++)step();paint();
	return {width,height,pixels,step,paint,
		snapshot(){return{heat:heat.slice(),time,frame};},
	};
}
