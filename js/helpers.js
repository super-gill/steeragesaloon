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
/* history's effect on passenger demand by class, route and month */
function histMod(c,rk,m){
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
const cargoMod=m=>{const k=m-M21;return crashMod('s',m)*(k>=306?1+Math.min(0.25,(k-306)/12*0.02):1)*(1-0.2*slump(m))*(k<12?0.75:k<24?0.9:k<106?1:k<120?0.75:k<156?0.62:Math.min(1,0.62+0.38*(k-156)/48));};
const cargoSeason=(c,m)=>COMM[c].season?COMM[c].season[m%12]:1;
const dirW=(rk,c)=>(ROUTES[rk].dirw&&ROUTES[rk].dirw[c])||DIRW[c];
function coalPrice(m){m-=M21;let b=(m<12?2.3:m<24?1.75:1.6)*(m>=258?1+Math.min(0.6,(m-258)/12*0.06):1);if(m>=64&&m<=70)b*=1.9;return b*(1+0.04*Math.sin(m*1.3));}
/* oil is dear at first; by the mid-twenties it costs about nine-tenths of coal for the same miles, and saves stokers and days in port besides */
function oilPrice(m){m-=M21;return (m<12?3.6:m<24?3.0:m<48?2.7-0.75*(m-24)/24:1.95)*(m>=354?0.78:1)*(1+0.03*Math.sin(m*0.9));}
function repF(c,rep,r){const x=rep-30;if(c==='f')return clamp(1+x/(r.prestige>1.2?50:70),0.4,1.8);if(c==='s')return clamp(1+x/150,0.6,1.4);if(c==='t')return clamp(1+x/500,0.85,1.15);return clamp(1+x/100,0.5,1.6);}
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
const REFIT_BASE={scrape:g=>g*0.22,cruise:g=>g*2.4+12000,hatch:g=>g*1.2,heavy:()=>9000,deep:g=>g*0.9,stab:g=>g*1.6,rphone:()=>7000,aircon:g=>g*1.3,radar:()=>32000,fins:g=>g*2,replate:g=>g*3,dock:g=>g*1.1,oil:g=>g*3.5,reefer:g=>g*3+5000,wireless:()=>2500,turbines:g=>g*5,lux:g=>g*2,refurb:g=>g*1.2,gear:g=>g*0.8};
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
function shipMods(sh){
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
  const age=1921+((S.t||D21)-D21)/365.25-t.built;
  return {id:S.nextId++,name:t.name,built:t.built,grt:t.grt,knots:t.knots,berths:{...t.berths},cargo:t.cargo,fuel:t.fuel,base:t.base,note:t.note||'',
    up:{reefer:!!t.reefer,wireless:t.built>=1905},fat:Math.round(clamp(age*1.8,0,95)),pi0:t.pi0||1,fit:Math.round(clamp(95-age*2.2,35,95)),captain:makeCaptain(),pay:1,morale:60,geo:null,nextCall:0,callLeft:0,
    cond:Math.round(cond),line:null,speed:1,maint:1,autoDock:50,towed:false,incident:null,state:'laid',port,dir:0,pos:0,portLeft:0,stopLeft:0,slow:1,limp:false,broke:false,
    legRoute:null,load:null,lastLoad:null,event:null,yardKind:null,yardLeft:0,repoTo:null,repoLeft:0,repoTotal:0,pendingYard:null,pendingExit:null};
}
