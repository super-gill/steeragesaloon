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
/* history's effect on passenger demand by class, route and month */
function histMod(c,rk,m){
  let x=1;const g=ROUTES[rk].group;
  if(c==='t'){
    if(rk==='nap') x*=m>=42?0.14:(m>=5?0.45:1.4); // the 1920-21 rush to beat the quotas, then the collapse
    else if(rk==='ham') x*=m>=42?0.6:(m>=5?0.85:1); // German quotas were larger
    else if(g==='North Atlantic') x*=m>=42?0.45:(m>=5?0.8:1);
    else if(g==='Canada'&&m>=42) x*=1.2;
    else if(rk==='rpl'&&m>=110) x*=0.6; // Argentina closes its doors in the Depression
  } else { if(m<12)x*=0.85; if(m>=24)x*=1+0.035*(Math.min(m,105)-24)/12; }
  x*=depression(c,m)*eraMod(c,rk,m)*crashMod(c,m)*(1-airShare(rk,c,m));
  return x;
}
/* the invented years after the Depression: recession, airships, a reopened America, the long boom, cruising, jets held at bay */
function eraMod(c,rk,m){
  if(m<198)return 1;
  const y=1921+m/12,g=ROUTES[rk].group;let x=1;
  if(y>=1937.7&&y<1938.8)x*=0.9;
  if(c==='t'&&(g==='North Atlantic')&&y>=1941.25)x*=1+Math.min(0.7,(y-1941.25)*0.35);
  if(c==='tt'&&y>=1944.3)x*=1+Math.min(0.4,(y-1944.3)*0.1);
  if(y>=1946.6)x*=1+Math.min(0.3,(y-1946.6)*0.025);
  if(y>=1955.8&&[10,11,0,1,2].includes(m%12)&&g==='North Atlantic'&&c!=='t')x*=1.15;
  return x;
}
/* the Depression: sharp fall from late 1929, trough 1932-33, slow recovery from 1934 */
function depression(c,m){
  if(m<106)return 1;
  const deep={f:.45,s:.62,t:.75,tt:.5}[c];
  if(m<120)return 1-(1-deep)*Math.min(1,(m-105)/14);
  if(m<156)return deep;
  return Math.min(1,deep+(1-deep)*(m-156)/48);
}
/* how deep the slump is, 0 to 1, for rates that fall with it */
const slump=m=>m<106?0:m<120?(m-105)/14:m<156?1:Math.max(0,1-(m-156)/48);
const cargoMod=m=>crashMod('s',m)*(m>=306?1+Math.min(0.25,(m-306)/12*0.02):1)*(1-0.2*slump(m))*(m<12?0.75:m<24?0.9:m<106?1:m<120?0.75:m<156?0.62:Math.min(1,0.62+0.38*(m-156)/48));
const cargoSeason=(c,m)=>COMM[c].season?COMM[c].season[m%12]:1;
const dirW=(rk,c)=>(ROUTES[rk].dirw&&ROUTES[rk].dirw[c])||DIRW[c];
function coalPrice(m){let b=(m<12?2.3:m<24?1.75:1.6)*(m>=258?1+Math.min(0.6,(m-258)/12*0.06):1);if(m>=64&&m<=70)b*=1.9;return b*(1+0.04*Math.sin(m*1.3));}
function oilPrice(m){return (m<12?3.6:m<24?3.0:2.7)*(m>=354?0.78:1)*(1+0.03*Math.sin(m*0.9));}
function repF(c,rep,r){const x=rep-30;if(c==='f')return clamp(1+x/(r.prestige>1.2?50:70),0.4,1.8);if(c==='s')return clamp(1+x/150,0.6,1.4);if(c==='t')return clamp(1+x/500,0.85,1.15);return clamp(1+x/100,0.5,1.6);}
const repWord=r=>r<15?'Disreputable':r<30?'Unknown':r<45?'Respectable':r<60?'Well regarded':r<75?'Fashionable':'Illustrious';
function shipValue(sh){return sh.base*PX()/(sh.pi0||1)*Math.pow(sh.cond/100,0.7)*Math.max(0.15,1-fatOf(sh)*0.0085)*shipMkt();}
const crewCost=sh=>sh.grt/(sh.fuel==='coal'?32:45)*12*CREW_PAY_MULT[sh.pay===undefined?1:sh.pay]*(sh.crewK||1)*(S.wageK||1)*safetyOf().crew*PX();
const insCost=sh=>shipValue(sh)*0.05/12*(sh.cond<50?1.4:1)*(fatOf(sh)>=90?2:1+Math.max(0,fatOf(sh)-60)/40);
const confFloor=(rk,c)=>Math.ceil(ROUTES[rk].ref[c]*0.95);
function effFare(rk,c){let f=S.lines[rk].fares[c];if(S.conf)f=Math.max(f,confFloor(rk,c));return f;}
function defaultFares(rk){const r=ROUTES[rk].ref;return {f:r.f,s:r.s,t:r.t,tt:r.tt};}
function gcDist(p,q){const a=CHART.lonlat[p],b=CHART.lonlat[q],rad=Math.PI/180;
  const la1=a[1]*rad,la2=b[1]*rad,dl=(b[0]-a[0])*rad,dp=la2-la1;
  const h=Math.sin(dp/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2;return 2*6371*Math.asin(Math.sqrt(h))/1.852;}
const ACTIVE=['sea','port','repo'];
const shipsOn=rk=>S.ships.filter(x=>x.line===rk);
const REFIT_BASE={stab:g=>g*1.6,rphone:()=>7000,aircon:g=>g*1.3,radar:()=>32000,fins:g=>g*2,replate:g=>g*3,dock:g=>g*1.1,oil:g=>g*3.5,reefer:g=>g*3+5000,wireless:()=>2500,turbines:g=>g*5,lux:g=>g*2,refurb:g=>g*1.2,gear:g=>g*0.8};
const atOwnYard=sh=>S.shore&&S.shore.yards[sh.port]&&sh.state!=='sea'&&sh.state!=='repo';
function refitCost(sh,k){if(k==='fac')return sh.facPlan?Math.round(facChange(sh,sh.facPlan).cost*(atOwnYard(sh)?0.7:1)):0;let c=k==='tourist'?8000+Math.round(sh.berths.t*0.5)*12:REFIT_BASE[k]?REFIT_BASE[k](sh.grt):0;
  c*=PX();if(c&&atOwnYard(sh))c*=0.7;return Math.round(c);}
const yardDays=(sh,k)=>Math.round((k==='fac'&&sh.facPlan?Math.max(7,facChange(sh,sh.facPlan).days):YARD_DAYS[k])*(atOwnYard(sh)?0.7:1));
/* captains */
function makeCaptain(R=Math.random){
  const exp=Math.floor(2+R()*26),age=Math.min(64,30+exp+Math.floor(R()*8));
  const keys=Object.keys(CAPT_TRAITS),traits=[];
  const n=R()<0.25?0:R()<0.8?1:2;
  while(traits.length<n){const k=keys[Math.floor(R()*keys.length)];if(!traits.includes(k)&&!(k==='cautious'&&traits.includes('driver'))&&!(k==='driver'&&traits.includes('cautious')))traits.push(k);}
  const good=traits.filter(t=>CAPT_TRAITS[t].good).length,bad=traits.length-good;
  const wage=Math.round((38+exp*1.3+good*8-bad*6-(traits.includes('drinker')?6:0))*PX());
  return {id:(S.capNext=(S.capNext||1)+1),name:'Captain '+CAPT_FIRST[Math.floor(R()*CAPT_FIRST.length)]+' '+CAPT_LAST[Math.floor(R()*CAPT_LAST.length)],age,exp,traits,wage};
}
const has=(sh,t)=>!!(sh.captain&&sh.captain.traits.includes(t));
/* per-ship modifiers from captain, crew morale, upgrades and fittings */
function shipMods(sh){
  const exp=sh.captain?Math.min(sh.captain.exp,30):5,mor=sh.morale===undefined?60:sh.morale;
  return {
    speed:(has(sh,'driver')?1.04:1)*(has(sh,'cautious')?0.97:1),
    wear:(has(sh,'driver')?1.25:1)*(has(sh,'veteran')?0.85:1),
    risk:(sh.riskK||1)*facMods(sh).risk*(has(sh,'cautious')?0.6:1)*(has(sh,'drinker')?1.5:1)*(has(sh,'martinet')?0.85:1)*(1.2-exp/60)*(mor<40?1.2:1),
    gale:(has(sh,'weather')?0.4:1)*(sh.galeK||1)*facMods(sh).gale,
    smuggle:(has(sh,'lax')?3:1)*(has(sh,'martinet')?0.3:1),
    appealFS:(has(sh,'popular')?1.07:1)*(has(sh,'drinker')?0.96:1)*(mor<40?0.97:mor>75?1.02:1)*(0.85+0.15*(sh.fit===undefined?80:sh.fit)/100)*(sh.up&&sh.up.lux&&!sh.appFS?1.2:1)*(sh.appFS||1)*fashion(sh.style||'edw',yearNow())*(sh.newUntil>S.m?1.08:1),
    appealT:(mor<40?0.98:1)*(0.95+0.05*(sh.fit===undefined?80:sh.fit)/100)*(sh.appT||1)*(sh.newUntil>S.m?1.03:1),
    morale:(has(sh,'lax')?10:0)+(has(sh,'martinet')?-15:0)+(has(sh,'popular')?5:0)+(has(sh,'drinker')?-5:0)
  };
}
const knotsOf=sh=>sh.knots+(sh.up&&sh.up.turbines?1.5:0);
function makeShip(t,cond,port){
  const age=1921+(S.t||0)/365.25-t.built;
  return {id:S.nextId++,name:t.name,built:t.built,grt:t.grt,knots:t.knots,berths:{...t.berths},cargo:t.cargo,fuel:t.fuel,base:t.base,note:t.note||'',
    up:{reefer:!!t.reefer,wireless:t.built>=1905},fat:Math.round(clamp(age*1.8,0,95)),pi0:t.pi0||1,fit:Math.round(clamp(95-age*2.2,35,95)),captain:makeCaptain(),pay:1,morale:60,geo:null,nextCall:0,callLeft:0,
    cond:Math.round(cond),line:null,speed:1,maint:1,autoDock:50,towed:false,incident:null,state:'laid',port,dir:0,pos:0,portLeft:0,stopLeft:0,slow:1,limp:false,broke:false,
    legRoute:null,load:null,lastLoad:null,event:null,yardKind:null,yardLeft:0,repoTo:null,repoLeft:0,repoTotal:0,pendingYard:null,pendingExit:null};
}
