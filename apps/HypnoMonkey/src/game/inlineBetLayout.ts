export type BetAnchor={left:number;top:number;width:number;height:number};
export function inlineBetLayout(a:BetAnchor,view:{width:number;height:number}){
 const width=Math.min(408,Math.max(200,view.width-24)),left=Math.max(12,Math.min(view.width-width-12,a.left+a.width-width));
 const above=a.top-20,below=view.height-a.top-a.height-20;
 const height=Math.min(460,view.height-24,Math.max(260,Math.max(above,below)));
 const top=above>=260?Math.max(12,a.top-height-8):below>=260?a.top+a.height+8:12;
 return{left,top:Math.min(top,view.height-height-12),width,height};
}
