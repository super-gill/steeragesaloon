/* ================= HELPERS ================= */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=n=>(n<0?'−':'')+'£'+Math.round(Math.abs(n)).toLocaleString('en-GB');
const int=n=>Math.round(n).toLocaleString('en-GB');
const T0=Date.UTC(1921,0,1);
const dOf=t=>new Date(T0+Math.floor(t)*864e5);
const mOf=t=>{const d=dOf(t);return (d.getUTCFullYear()-1921)*12+d.getUTCMonth();};
const dateLong=t=>{const d=dOf(t);return d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear();};
const monthName=m=>MONTHS[m%12]+' '+(1921+Math.floor(m/12));
const yearNow=()=>1921+S.t/365.25;
function seed(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function histMod(c,rk,m){
  let x=1;
  if(c==='t'){
    if(rk==='nap') x*=m>=42?0.14:(m>=5?0.45:1.4); // the 1920-21 rush to beat the quotas, then the collapse
    else if(ROUTES[rk].b==='NYC') x*=m>=42?0.45:(m>=5?0.8:1);
    else if(m>=42) x*=1.2;
  } else { if(m<12)x*=0.9; if(m>=24)x*=1+0.035*((m-24)/12); }
  if(m>=106) x*={f:.55,s:.72,t:.85,tt:.6}[c];
  return x;
}
const cargoMod=m=>m<12?0.75:m<24?0.9:m>=106?0.7:1;
function coalPrice(m){let b=m<12?2.3:m<24?1.75:1.6;if(m>=64&&m<=70)b*=1.9;return b*(1+0.04*Math.sin(m*1.3));}
function oilPrice(m){return (m<12?3.6:m<24?3.0:2.7)*(1+0.03*Math.sin(m*0.9));}
function repF(c,rep,r){const x=rep-30;if(c==='f')return clamp(1+x/(r.prestige>1.2?50:70),0.4,1.8);if(c==='s')return clamp(1+x/150,0.6,1.4);if(c==='t')return clamp(1+x/500,0.85,1.15);return clamp(1+x/100,0.5,1.6);}
const repWord=r=>r<15?'Disreputable':r<30?'Unknown':r<45?'Respectable':r<60?'Well regarded':r<75?'Fashionable':'Illustrious';
function shipValue(sh){const age=yearNow()-sh.built;return sh.base*Math.pow(sh.cond/100,0.7)*Math.max(0.25,1-age*0.025);}
const crewCost=sh=>sh.grt/(sh.fuel==='coal'?32:45)*12;
const insCost=sh=>shipValue(sh)*0.05/12*(sh.cond<50?1.4:1);
const confFloor=(rk,c)=>Math.ceil(ROUTES[rk].ref[c]*0.95);
function effFare(rk,c){let f=S.lines[rk].fares[c];if(S.conf)f=Math.max(f,confFloor(rk,c));return f;}
function defaultFares(rk){const r=ROUTES[rk].ref;return {f:r.f,s:r.s,t:r.t,tt:r.tt};}
function gcDist(p,q){const a=CHART.lonlat[PN[p]],b=CHART.lonlat[PN[q]],rad=Math.PI/180;
  const la1=a[1]*rad,la2=b[1]*rad,dl=(b[0]-a[0])*rad,dp=la2-la1;
  const h=Math.sin(dp/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2;return 2*6371*Math.asin(Math.sqrt(h))/1.852;}
const ACTIVE=['sea','port','repo'];
const shipsOn=rk=>S.ships.filter(x=>x.line===rk);
function refitCost(sh,k){if(k==='dock')return Math.round(sh.grt*1.1);if(k==='oil')return Math.round(sh.grt*3.5);if(k==='tourist')return 8000+Math.round(sh.berths.t*0.5)*12;return 0;}
function makeShip(t,cond,port){
  return {id:S.nextId++,name:t.name,built:t.built,grt:t.grt,knots:t.knots,berths:{...t.berths},cargo:t.cargo,fuel:t.fuel,base:t.base,note:t.note||'',
    cond:Math.round(cond),line:null,speed:1,maint:1,autoDock:50,towed:false,incident:null,state:'laid',port,dir:0,pos:0,portLeft:0,stopLeft:0,slow:1,limp:false,broke:false,
    legRoute:null,load:null,lastLoad:null,event:null,yardKind:null,yardLeft:0,repoTo:null,repoLeft:0,repoTotal:0,pendingYard:null,pendingExit:null};
}
