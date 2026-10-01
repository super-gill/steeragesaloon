/* ================= HELPERS ================= */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=n=>(n<0?'−':'')+'£'+Math.round(Math.abs(n)).toLocaleString('en-GB');
const int=n=>Math.round(n).toLocaleString('en-GB');
/* dates: day t counts from 1 January 1900 (see the calendar in data.js) */
const T0=Date.UTC(YEAR0,0,1),D21=(Date.UTC(1921,0,1)-T0)/864e5;
const dOf=t=>new Date(T0+Math.floor(t)*864e5);
const mOf=t=>{const d=dOf(t);return (d.getUTCFullYear()-YEAR0)*12+d.getUTCMonth();};
const tOfM=(m,day)=>(Date.UTC(YEAR0+Math.floor(m/12),((m%12)+12)%12,day||15)-T0)/864e5; // a day in month m, the 15th unless given
const dateLong=t=>{const d=dOf(t);return d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear();};
const monthName=m=>MONTHS[m%12]+' '+(YEAR0+Math.floor(m/12));
const yearNow=()=>1921+(S.t-D21)/365.25;
function seed(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* the history headlines for this game: the 1921 opening line only for games begun in 1921 */
/* the mails and wireless: before the American wireless law of July 1911 any ship may carry the mails; after it, only ships with wireless */
const wirelessRule=()=>S.m>=ym(1911,6);
const mailShip=sh=>(sh.up&&sh.up.wireless)||!wirelessRule();
/* Ellis Island, before 1921: about 2 in 100 steerage passengers are refused and carried home at the line's cost (half as
   many when they sailed from a port with the Line's hostel, which checks them first), a fine for each one diseased, and
   the head tax on every immigrant landed: $1, then $2 from 1903 and $4 from 1907. In the pounds of the day. */
function usInspection(n,fare,from,m){
  if(!newCal()||m>=M21||!n)return 0;
  const tax=(m>=ym(1907,0)?4:m>=ym(1903,0)?2:1)/4.86,refused=n*0.02*(S.shore&&S.shore.hostels[from]?0.5:1);
  return n*tax+refused*(fare*0.6+100/4.86*0.25);
}
/* booking agents inland in Europe matter most in the emigrant years: steerage up 12% before the war, 7% after */
const agentSteer=()=>newCal()&&S.m<ym(1914,7)?1.12:1.07;
const histNow=()=>HIST.filter(h=>!h.only||!newCal());
/* ---------- the pre-war world, 1900 to 1913 ----------
   Emigration by destination, from the real arrivals (US fiscal years treated as calendar years), each as a multiple
   of 1900: the United States, Canada (damped a little: the lines could not have carried the whole ninefold rise),
   and Argentina. Cabin travel grows steadily; cargo with world trade. 1914 to 1920 hold the 1913 level until the
   war years are written (0.26 to 0.28). */
const PRE_US=[1,1.09,1.45,1.91,1.81,2.29,2.45,2.87,1.75,1.68,2.32,1.96,1.87,2.67];
const PRE_CA=[1,1.09,1.5,2.85,2.9,3.25,4.2,3.7,5.8,3.3,4.6,6.9,7.9,8.9].map(v=>Math.pow(v,0.7));
const PRE_AR=[1,1.06,0.68,0.89,1.48,2.09,2.97,2.46,3.01,2.72,3.41,2.66,3.81,3.56];
/* a yearly series at month m: each year's figure at mid-year, straight lines between */
function preYear(arr,m){const y=clamp(YEAR0+m/12-0.5,YEAR0,YEAR0+arr.length-1),i=Math.min(arr.length-2,Math.floor(y-YEAR0)),f=y-YEAR0-i;return arr[i]+(arr[i+1]-arr[i])*f;}
/* going home before the war: in the American slump of 1908 more emigrants went home than came out, and 1909 was still heavy */
const preReturn=m=>!newCal()||m>=M21?1:(m>=ym(1908,0)&&m<ym(1909,0)?1.7:m>=ym(1909,0)&&m<ym(1910,0)?1.2:1)*warReturn(m);
const preYears=m=>clamp(YEAR0+m/12-YEAR0,0,13.99); // years since 1900, held at the end of 1913
/* passenger demand before 1921, as a multiple of January 1900 */
function preDemand(c,rk,m,raw){
  const r=ROUTES[rk],g=r.group,y=preYears(m);let x;
  if(r.cruise)x=1+0.03*y;
  else if(c==='t'||c==='tt'){const us=preYear(PRE_US,m);
    x=rk==='nap'?Math.pow(us,1.1):g==='North Atlantic'?us:g==='Canada'?preYear(PRE_CA,m):rk==='rpl'?preYear(PRE_AR,m):1+0.02*y;}
  else x=c==='f'?1+0.035*y:1+0.05*y;
  return raw?x:x*crashMod(c,m)*warPax(c,rk,m);
}
/* demand on the 1900 calendar: the pre-war curves, then the 1921 game's history carried on from where they end */
const H_CACHE={s:null,a:{},d:{}}; // the join at 1921 and the start's level, per class and route, for the game in hand
function histAbs(c,rk,m){
  if(m<M21)return preDemand(c,rk,m);
  const k=c+rk;if(H_CACHE.a[k]===undefined)H_CACHE.a[k]=preDemand(c,rk,M21-1,true)/histLegacy(c,rk,M21);
  return H_CACHE.a[k]*histLegacy(c,rk,m);
}
/* history's effect on passenger demand by class, route and month, relative to the game's start (markets are sized then) */
function histMod(c,rk,m){
  if(!newCal())return histLegacy(c,rk,m);
  if(H_CACHE.s!==S){H_CACHE.s=S;H_CACHE.a={};H_CACHE.d={};}
  const k=c+rk;if(H_CACHE.d[k]===undefined)H_CACHE.d[k]=histAbs(c,rk,S.m0);
  return histAbs(c,rk,m)/H_CACHE.d[k];
}
/* the 1921 game's history, as written for a January 1921 start */
function histLegacy(c,rk,m){
  const m0=m;m-=M21; // written in months from January 1921
  let x=1;const g=ROUTES[rk].group;
  if(c==='t'){
    if(rk==='nap') x*=m>=42?0.14:(m>=5?0.45:1.4); // the 1920-21 rush to beat the quotas, then the collapse
    else if(rk==='ham') x*=m>=42?0.6:(m>=5?0.85:1); // German quotas were larger
    else if(g==='North Atlantic') x*=m>=42?0.45:(m>=5?0.8:1);
    else if(g==='Canada'&&m>=42) x*=1.2;
    else if(rk==='rpl'&&m>=110) x*=0.6; // Argentina closes its doors in the Depression
  } else { if(m<12)x*=0.85; if(m>=24)x*=1+0.035*(Math.min(m,105)-24)/12; }
  if(ROUTES[rk].cruise){const y=1921+m/12;x*=y<1926?0.7+0.06*(y-1921):Math.min(1.12,1+0.03*(y-1926));if(y>=1934)x*=1.15;}
  x*=depression(c,m0)*eraMod(c,rk,m0)*crashMod(c,m0)*(1-airShare(rk,c,m0));
  return x;
}
/* the invented years after the Depression: recession, airships, a reopened America, the long boom, cruising, jets held at bay */
function eraMod(c,rk,m){
  m-=M21;
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
  m-=M21;
  if(m<106)return 1;
  const deep={f:.45,s:.62,t:.75,tt:.5}[c];
  if(m<120)return 1-(1-deep)*Math.min(1,(m-105)/14);
  if(m<156)return deep;
  return Math.min(1,deep+(1-deep)*(m-156)/48);
}
/* how deep the slump is, 0 to 1, for rates that fall with it */
const slump=m=>{m-=M21;return m<106?0:m<120?(m-105)/14:m<156?1:Math.max(0,1-(m-156)/48);};
/* in a slump the costs of running ships fall too: coal, wages, dues and insurance all come down at the trough */
const SLUMP_CUT={fuel:0.25,wage:0.10,dues:0.15,ins:0.10};
const slumpK=(k,m)=>1-SLUMP_CUT[k]*slump(m===undefined?(typeof S!=='undefined'&&S?S.m:0):m);
/* cargo on the 1900 calendar: world trade grows about 3% a year before the war, then the 1921 game's cargo history */
const cargoPre=m=>1+0.03*preYears(m);
const cargoMod=m=>{if(!newCal())return cargoLegacy(m);const a=x=>x<M21?cargoPre(x)*crashMod('s',x)*warFreight(x):cargoPre(M21-1)/cargoLegacy(M21)*cargoLegacy(x);return a(m)/a(S.m0);};
const cargoLegacy=m=>{const k=m-M21;return crashMod('s',m)*(k>=306?1+Math.min(0.25,(k-306)/12*0.02):1)*(1-0.2*slump(m))*(k<12?0.75:k<24?0.9:k<106?1:k<120?0.75:k<156?0.62:Math.min(1,0.62+0.38*(k-156)/48));};
const cargoSeason=(c,m)=>COMM[c].season?COMM[c].season[m%12]:1;
const dirW=(rk,c)=>(ROUTES[rk].dirw&&ROUTES[rk].dirw[c])||DIRW[c];
/* bunker coal before 1921, against the price level: dear in the 1900 boom, cheap by 1910 (real export prices, rebased) */
const PRE_COAL=[2.5,2.2,2.0,1.95,1.9,1.85,1.9,2.0,1.9,1.8,1.8,1.85,1.95,2.0];
function coalPrice(m,held){if(m<M21)return preYear(PRE_COAL,m)*(m>=ym(1914,0)?1.1:1)*warCoal(m)*(held?1:coalStrike(m))*(1+0.04*Math.sin(m*1.3));m-=M21;let b=(m<12?2.3:m<24?1.75:1.6)*(m>=258?1+Math.min(0.6,(m-258)/12*0.06):1);if(m>=64&&m<=70&&!held)b*=1.9;return b*(1+0.04*Math.sin(m*1.3));} // a bunker contract keeps its coal through a strike
/* oil is dear at first; by the mid-twenties it costs about nine-tenths of coal for the same miles, and saves stokers and days in port besides */
function oilPrice(m){m-=M21;return (m<12?3.6:m<24?3.0:m<48?2.7-0.75*(m-24)/24:1.95)*(m>=354?0.78:1)*(1+0.03*Math.sin(m*0.9));}
function repF(c,rep,r){const x=rep-30;if(c==='f')return clamp(1+x/(r.prestige>1.2?50:70),0.4,1.8);if(c==='s')return clamp(1+x/150,0.6,1.4);if(c==='t')return clamp(1+x/500,0.85,1.15);return clamp(1+x/100,0.5,1.6);}
/* the day-to-day knocks and credits to the Line's name (a breakdown, a fine, a quarantine, a rescue) count for less in a big
   fleet: one ship in seventy matters less than one in six (0.35.4; before, a big line's name was ground to nothing) */
function repHit(n){const k=S.ships.filter(x=>x.state!=='lost').length;S.rep=clamp(S.rep+n*clamp(Math.sqrt(6/Math.max(1,k)),0.3,1),0,100);}
const repWord=r=>r<15?'Disreputable':r<30?'Unknown':r<45?'Respectable':r<60?'Well regarded':r<75?'Fashionable':'Illustrious';
function shipValue(sh){return sh.base*PX()/(sh.pi0||1)*Math.pow(sh.cond/100,0.7)*Math.max(0.15,1-fatOf(sh)*0.0085)*shipMkt();}
/* the ship's company: deck and engine-room hands by size and fuel (stokers for coal), and stewards by the passengers carried.
   A freighter needs no stewards, so she is cheap to crew; a liner's hotel staff can outnumber her sailors */
const crewCount=sh=>crewHands(sh); // by department: see crew.js
const crewCost=sh=>crewCostOf(sh);
/* ---------- hull insurance, ship by ship ----------
   The owner chooses the cover and the excess. The premium follows her condition and wear, the excess, and the Line's
   record of claims (ice and war come with the 1900 eras). While she is mortgaged the bank insists on cover for its share at least. */
const INS_COVER={none:{name:'None',short:'None'},mort:{name:'The mortgage only',short:'Mortgage'},value:{name:'Her market value',short:'Market value'},agreed:{name:'An agreed value, a quarter above market',short:'Agreed value'}};
const INS_KEYS=['none','mort','value','agreed'];
const INS_EXCESS=[{name:'None',k:1.15,x:0,own:0.1},{name:'Standard',k:1,x:0.02,own:1},{name:'High',k:0.8,x:0.08,own:2.5}];
const shipMortgage=sh=>{if(!(S.debt>0))return 0;const fv=S.ships.reduce((a,x)=>a+shipValue(x),0)||1;return Math.min(S.debt,S.debt*shipValue(sh)/fv);};
function insOf(sh){const i=sh.ins||(sh.ins={...(S.insDefault||{cover:'value',excess:1})});return {cover:i.cover==='none'&&S.debt>0?'mort':i.cover,excess:i.excess===undefined?1:i.excess};}
function insured(sh){const c=insOf(sh).cover;return c==='none'?0:c==='mort'?shipMortgage(sh):c==='agreed'?shipValue(sh)*1.25:shipValue(sh);}
/* the underwriters' rate a year: 5% for a sound ship on a quiet route */
function insRate(sh){
  const f=fatOf(sh);
  return 0.05*(sh.cond<50?1.4:1)*(f>=90?2:1+Math.max(0,f-60)/40)*(1+0.15*(S.insLoss||0))*INS_EXCESS[insOf(sh).excess].k*slumpK('ins');
}
const insCost=sh=>insured(sh)*insRate(sh)/12*(sh.state==='laid'?0.3:1); // laid up she is insured for port risks only
const confFloor=(rk,c)=>Math.ceil(ROUTES[rk].ref[c]*0.95);
function effFare(rk,c){let f=S.lines[rk].fares[c];if(S.conf&&!ROUTES[rk].cruise)f=Math.max(f,confFloor(rk,c));return f;} // the conference has no say over cruises
function defaultFares(rk){const r=ROUTES[rk].ref;return {f:r.f,s:r.s,t:r.t,tt:r.tt};}
function gcDist(p,q){const a=CHART.lonlat[p],b=CHART.lonlat[q],rad=Math.PI/180;
  const la1=a[1]*rad,la2=b[1]*rad,dl=(b[0]-a[0])*rad,dp=la2-la1;
  const h=Math.sin(dp/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2;return 2*6371*Math.asin(Math.sqrt(h))/1.852;}
const ACTIVE=['sea','port','repo'];
const shipsOn=rk=>S.ships.filter(x=>x.line===rk);
/* wireless is a dear novelty in 1900, four times its later price, and comes down to it by 1911 */
const wirelessNovelty=()=>{const y=yearNow();return y<1905?4:y<1911?4-3*(y-1905)/6:1;};
const REFIT_BASE={scrape:g=>g*0.22,cruise:g=>g*2.4+12000,hatch:g=>g*1.2,heavy:()=>9000,deep:g=>g*0.9,stab:g=>g*1.6,rphone:()=>7000,aircon:g=>g*1.3,radar:()=>32000,fins:g=>g*2,replate:g=>g*3,dock:g=>g*1.1,oil:g=>g*3.5,reefer:g=>g*3+5000,wireless:()=>2500*wirelessNovelty(),turbines:g=>g*5,lux:g=>g*2,refurb:g=>g*1.2,gear:g=>g*0.8,boats:g=>g*0.12+1500,paint:g=>g*0.1+300,warcargo:g=>g*0.12+400,uncargo:g=>g*0.12+400,dazzle:g=>g*0.05+200,gun:g=>g*0.04+800};
/* a cruise conversion: steerage becomes a smaller number of Tourist cabins and a few more in first and second */
const cruiseBerths=b=>{const t=b.t||0;return {...b,t:0,tt:(b.tt||0)+Math.round(t*0.3),s:(b.s||0)+Math.round(t*0.06),f:(b.f||0)+Math.round(t*0.04)};};
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
/* per-ship modifiers are asked for constantly by the forecasts and never change within a day unless the ship is changed:
   they are kept per ship until the day turns or MOD_EPOCH moves (any action, and any forecast that patches a ship) */
let MOD_EPOCH=0;
const MOD_CACHE={shipMods:new WeakMap(),crewMods:new WeakMap(),facMods:new WeakMap()};
function modCached(kind,sh,fn){const k=Math.floor(S.t)+'|'+MOD_EPOCH,c=MOD_CACHE[kind].get(sh);if(c&&c.k===k)return c.v;const v=fn(sh);MOD_CACHE[kind].set(sh,{k,v});return v;}
function shipMods(sh){return modCached('shipMods',sh,shipModsRaw);}
function shipModsRaw(sh){
  const exp=sh.captain?Math.min(sh.captain.exp,30):5,mor=sh.morale===undefined?60:sh.morale,cm=crewMods(sh);
  return {
    speed:(has(sh,'driver')?1.04:1)*(has(sh,'cautious')?0.97:1),
    wear:(has(sh,'driver')?1.25:1)*(has(sh,'veteran')?0.85:1),
    risk:(sh.riskK||1)*facMods(sh).risk*(has(sh,'cautious')?0.6:1)*(has(sh,'drinker')?1.5:1)*(has(sh,'martinet')?0.85:1)*(1.2-exp/60)*(mor<40?1.2:1),
    gale:(has(sh,'weather')?0.4:1)*(sh.galeK||1)*facMods(sh).gale,
    smuggle:(has(sh,'lax')?3:1)*(has(sh,'martinet')?0.3:1)*cm.smuggle,
    appealFS:(has(sh,'popular')?1.07:1)*(has(sh,'drinker')?0.96:1)*(mor<40?0.97:mor>75?1.02:1)*(0.85+0.15*(sh.fit===undefined?80:sh.fit)/100)*(sh.up&&sh.up.lux&&!sh.appFS?1.2:1)*(sh.appFS||1)*fashion(sh.style||'edw',yearNow())*(sh.newUntil>S.m?1.08:1)*cm.appFS,
    appealT:(mor<40?0.98:1)*(0.95+0.05*(sh.fit===undefined?80:sh.fit)/100)*(sh.appT||1)*(sh.newUntil>S.m?1.03:1)*cm.appT,
    morale:(has(sh,'lax')?10:0)+(has(sh,'martinet')?-15:0)+(has(sh,'popular')?5:0)+(has(sh,'drinker')?-5:0)
  };
}
const knotsOf=sh=>sh.knots+(sh.up&&sh.up.turbines?1.5:0);
function makeShip(t,cond,port){
  const age=1921+((S.t??D21)-D21)/365.25-t.built;
  return {id:S.nextId++,name:t.name,built:t.built,grt:t.grt,knots:t.knots,berths:{...t.berths},cargo:t.cargo,fuel:t.fuel,base:t.base,note:t.note||'',
    up:{reefer:!!t.reefer,wireless:t.built>=(newCal()?1911:1905),boats:newCal()&&t.built>=1913},fat:Math.round(clamp(age*1.8,0,95)),pi0:t.pi0||1,fit:Math.round(clamp(95-age*2.2,35,95)),captain:makeCaptain(),pay:1,morale:60,geo:null,nextCall:0,callLeft:0,
    cond:Math.round(cond),line:null,speed:1,maint:1,autoDock:50,towed:false,incident:null,state:'laid',port,dir:0,pos:0,portLeft:0,stopLeft:0,slow:1,limp:false,broke:false,
    legRoute:null,load:null,lastLoad:null,event:null,yardKind:null,yardLeft:0,repoTo:null,repoLeft:0,repoTotal:0,pendingYard:null,pendingExit:null};
}
