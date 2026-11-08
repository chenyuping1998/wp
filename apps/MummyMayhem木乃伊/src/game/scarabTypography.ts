// Higher results keep a distinct, light face against the dark carved slabs.
// Used on the strip, in flight and on the held multiplier for continuity.
export function scarabMultiplierColor(value:number){
 if(value>=32)return 0xdfb4ff;
 if(value>=14)return 0xff91bd;
 if(value>=10)return 0xffad62;
 if(value>=6)return 0xffe16b;
 return 0xfff3c4;
}
