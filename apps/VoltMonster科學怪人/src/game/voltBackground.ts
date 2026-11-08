/** Native 1920×1080 coordinates. Independent pivots and clocks, never a moving backdrop. */
export type VoltScene = 'base' | 'feature' | 'hold';
export type VoltProp = {
 id:string; texture:string; x:number; y:number; w:number; h:number;
 pivot:[number,number]; motion:'rotate'|'swing'|'glow'|'bubble'|'arc'|'screen'|'needle';
 period:number; phase?:number; direction?:number;
};
export const VOLT_PROPS:Record<VoltScene,VoltProp[]>={
 base:[
  {id:'gear_big',texture:'voltGear',x:98,y:432,w:205,h:205,pivot:[.5,.5],motion:'rotate',period:36000},
  {id:'gear_small',texture:'voltGear',x:245,y:346,w:125,h:125,pivot:[.5,.5],motion:'rotate',period:22000,direction:-1},
  {id:'lamp',texture:'voltLamp',x:1190,y:18,w:105,h:240,pivot:[.5,.035],motion:'swing',period:18000},
  {id:'cables',texture:'voltCables',x:586,y:18,w:472,h:102,pivot:[.5,0],motion:'swing',period:23000,phase:1.4},
  {id:'electrodes',texture:'voltElectrodes',x:1576,y:162,w:176,h:310,pivot:[.5,1],motion:'arc',period:19000},
  {id:'test_tubes',texture:'voltTubes',x:72,y:260,w:236,h:160,pivot:[.5,1],motion:'bubble',period:21000},
  {id:'indicators',texture:'voltIndicators',x:1550,y:105,w:235,h:58,pivot:[.5,.5],motion:'glow',period:17000},
 ],
 feature:[
  {id:'flywheel',texture:'voltGear',x:81,y:329,w:274,h:274,pivot:[.5,.5],motion:'rotate',period:18000},
  {id:'tesla_coil',texture:'voltCoil',x:1570,y:153,w:209,h:357,pivot:[.5,1],motion:'arc',period:16000},
  {id:'switch_panel',texture:'voltIndicators',x:126,y:209,w:242,h:64,pivot:[.5,.5],motion:'glow',period:18000},
  {id:'oscilloscope',texture:'voltScope',x:1574,y:503,w:216,h:150,pivot:[.5,.5],motion:'screen',period:18000},
  {id:'coil_lamp',texture:'voltLamp',x:1160,y:14,w:99,h:235,pivot:[.5,.035],motion:'swing',period:19000},
  {id:'roof_cable',texture:'voltCables',x:625,y:16,w:400,h:99,pivot:[.5,0],motion:'swing',period:24000,phase:1.8},
 ],
 hold:[
  {id:'battery_left',texture:'voltBattery',x:64,y:472,w:266,h:155,pivot:[.5,.5],motion:'glow',period:18000},
  {id:'battery_right',texture:'voltBattery',x:1550,y:477,w:280,h:163,pivot:[.5,.5],motion:'glow',period:21000,phase:1.2},
  {id:'valve',texture:'voltValve',x:135,y:185,w:166,h:166,pivot:[.5,.5],motion:'rotate',period:42000},
  {id:'beacon',texture:'voltBeacon',x:1582,y:143,w:134,h:166,pivot:[.5,1],motion:'glow',period:16000},
  {id:'power_gauge',texture:'voltGauge',x:1592,y:329,w:165,h:165,pivot:[.5,.5],motion:'needle',period:22000},
  {id:'cable_bundle',texture:'voltCables',x:648,y:15,w:409,h:107,pivot:[.5,0],motion:'swing',period:20000},
 ],
};
export function propMotion(p:VoltProp,elapsed:number){
 const phase=elapsed/p.period*Math.PI*2+(p.phase??0);
 return{angle:p.motion==='rotate'?phase*(p.direction??1):p.motion==='swing'?Math.sin(phase)*Math.PI/90:0,
  light:.55+.45*(.5+.5*Math.sin(phase)),cycle:(elapsed/p.period+(p.phase??0)/(Math.PI*2))%1};
}
