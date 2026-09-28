/* ================= FACILITIES AND THE REFIT OFFICE =================
   What a ship offers her passengers beyond a berth: restaurants, shows, shops, pools, a winter garden. Each facility has
   levels; each level takes room from the passenger spaces it serves, costs money to fit and to staff, draws passengers of
   the classes it suits, and some earn money aboard. Indoor facilities hold passengers through the winter.
   A ship has only so many venues: a small steamer has room for one or two, a superliner for a dozen.
   The refit office is one window, like the drawing office: every yard job, upgrade and facility for one ship, with the
   Marine Superintendent's picks marked, booked as one yard visit. The clock stops while it is open. */
const FAC={
  dineF:{name:'First-class dining',g:'Dining',levels:[
    {n:'A dining saloon'},
    {n:'À la carte restaurant',cost:6000,room:150,staff:150,app:{f:0.1},spend:{f:.25},days:20},
    {n:'Restaurant and grill room',cost:15000,room:350,staff:350,app:{f:0.18},spend:{f:.5},days:30,min:12000},
    {n:'Several restaurants, cafés and a verandah grill',cost:45000,room:900,staff:900,app:{f:0.26},spend:{f:.8},days:45,min:30000,from:1928}]},
  dineS:{name:'Second-class dining',g:'Dining',levels:[
    {n:'A plain saloon'},
    {n:'A good dining saloon',cost:3000,room:100,staff:80,app:{s:0.1},spend:{s:.08},days:15},
    {n:'A second-class restaurant',cost:8000,room:250,staff:200,app:{s:0.18,tt:0.06},spend:{s:.15,tt:.04},days:25,min:10000}]},
  dineT:{name:'Third-class dining',g:'Dining',levels:[
    {n:'Long tables in the steerage'},
    {n:'A proper dining room with stewards',cost:4000,room:200,staff:150,app:{t:0.1,tt:0.06},spend:{t:.02,tt:.02},days:15}]},
  shows:{name:'Theatre and music',g:'Entertainment',levels:[
    {n:'A piano in the lounge'},
    {n:'Ballroom and ship\'s orchestra',cost:5000,room:200,staff:250,app:{f:0.06,s:0.06,tt:0.04},spend:{f:.12,s:.04},days:15},
    {n:'A theatre',cost:20000,room:500,staff:500,app:{f:0.12,s:0.1,tt:0.08},spend:{f:.25,s:.08,tt:.04},days:30,min:15000,from:1925},
    {n:'Two theatres and a concert hall',cost:60000,room:1200,staff:1100,app:{f:0.18,s:0.14,tt:0.12},spend:{f:.4,s:.15,tt:.08},days:45,min:40000,from:1935}]},
  cinema:{name:'Cinema',g:'Entertainment',levels:[
    {n:'None'},
    {n:'A picture house',cost:8000,room:200,staff:120,app:{f:0.04,s:0.04,tt:0.06,t:0.04},spend:{f:.04,s:.04,tt:.04,t:.01},days:15,from:1927}]},
  shops:{name:'Shops and duty free',g:'Shopping',levels:[
    {n:'A barber and a bookstall'},
    {n:'A few shops',cost:3000,room:80,staff:60,app:{f:0.02},spend:{f:.2,s:.08,tt:.04,t:.01},days:10},
    {n:'A shopping arcade',cost:12000,room:250,staff:200,app:{f:0.04,s:0.04},spend:{f:.5,s:.2,tt:.12,t:.02},days:20,min:15000},
    {n:'A duty-free galleria',cost:40000,room:600,staff:500,app:{f:0.08,s:0.06,tt:0.06},spend:{f:1,s:.4,tt:.25,t:.04},days:35,min:35000,from:1950}]},
  pool:{name:'Swimming',g:'Leisure',levels:[
    {n:'None'},
    {n:'Indoor pool and Turkish bath',cost:25000,room:400,staff:250,app:{f:0.08,s:0.04},winter:{f:.04,s:.03},days:35,min:12000},
    {n:'Two pools and a lido deck',cost:60000,room:800,staff:500,app:{f:0.14,s:0.1,tt:0.08},winter:{f:.06,s:.04},days:45,min:25000,from:1930}]},
  spa:{name:'Gymnasium and spa',g:'Leisure',levels:[
    {n:'None'},
    {n:'A gymnasium',cost:4000,room:100,staff:60,app:{f:0.04,s:0.04},days:10},
    {n:'Gymnasium and spa',cost:15000,room:250,staff:250,app:{f:0.1,s:0.04},spend:{f:.25},days:20,from:1935,min:15000}]},
  garden:{name:'Winter garden',g:'Leisure',levels:[
    {n:'An open promenade'},
    {n:'An enclosed promenade',cost:6000,room:150,staff:40,app:{f:0.02,s:0.02},winter:{f:.06,s:.05,tt:.03},days:15},
    {n:'Winter garden and conservatory',cost:16000,room:300,staff:150,app:{f:0.06,s:0.04},winter:{f:.1,s:.07,tt:.04},days:25,min:18000}]},
  family:{name:'Children and families',g:'Leisure',levels:[
    {n:'None'},
    {n:'Playrooms and a nursery',cost:3000,room:100,staff:80,app:{s:0.06,tt:0.08,t:0.06},days:10}]}
};
const FAC_KEYS=Object.keys(FAC);
const BERTH_ROOM={f:14,s:8,tt:5.5,t:3.2}; // tons of ship per berth in each class
const WINTER_M=[10,11,0,1,2];
/* equipment that a refit can add (a new ship gets these from the drawing office) */
const EQUIP={
  stab:{name:'Gyro stabilisers',from:1932,fs:1.03,gale:0.6,days:30,desc:'Great spinning wheels that damp the roll.'},
  rphone:{name:'Radio-telephone',from:1936,fs:1.02,days:7,desc:'Passengers can telephone ashore from mid-ocean.'},
  aircon:{name:'Air conditioning',from:1937,fs:1.03,tropic:1.06,days:35,desc:'Cooled public rooms: a boon in the tropics.'},
  radar:{name:'Radiolocation set',from:1946,risk:0.7,days:10,desc:'Sees other ships and ice through fog and darkness.'},
  fins:{name:'Fin stabilisers',from:1954,fs:1.05,gale:0.4,days:30,desc:'Retractable fins that all but stop the roll.'}
};
/* a bigger ship's restaurant is bigger: cost, staff and room grow with her size */
const facSize=(g,p)=>Math.max(0.6,Math.pow((g||8000)/10000,p||0.8)); // cost ^0.8; staff ^0.7; room ^0.5
const facLv=(sh,k)=>(sh.fac&&sh.fac[k])||0;
const slotsOf=sh=>2+Math.floor(sh.grt/8000);
const slotsUsed=(fac)=>FAC_KEYS.reduce((a,k)=>a+((fac&&fac[k])||0),0);
const levelOk=(k,l,grt,y)=>{const L=FAC[k].levels[l];return !!L&&(!L.min||grt>=L.min)&&(!L.from||y>=L.from);};
/* what the ship's facilities add up to: appeal by class (capped), winter draw, money spent aboard, staff */
function facMods(sh){
  const key=JSON.stringify(sh.fac||{})+'|'+JSON.stringify(sh.upR||{})+'|'+sh.grt;
  if(sh._fm&&sh._fm.k===key)return sh._fm.v;
  const app={f:0,s:0,tt:0,t:0},win={f:0,s:0,tt:0,t:0},spend={f:0,s:0,tt:0,t:0};let staff=0;
  for(const k of FAC_KEYS){const l=facLv(sh,k);const L=FAC[k].levels[l];if(!l||!L)continue;
    for(const c in L.app||{})app[c]+=L.app[c];for(const c in L.winter||{})win[c]+=L.winter[c];for(const c in L.spend||{})spend[c]+=L.spend[c];staff+=(L.staff||0)*facSize(sh.grt,0.7);}
  for(const c in app)app[c]=1+Math.min(0.6,app[c]);
  let fs=1,gale=1,risk=1,tropic=1;for(const k in sh.upR||{})if(sh.upR[k]&&EQUIP[k]){const e=EQUIP[k];fs*=e.fs||1;gale*=e.gale||1;risk*=e.risk||1;tropic*=e.tropic||1;}
  const v={app,win,spend,staff,fs,gale,risk,tropic};
  Object.defineProperty(sh,'_fm',{value:{k:key,v},writable:true,configurable:true,enumerable:false});
  return v;
}
/* the demand a ship's facilities add in winter, and her appeal by class */
const facAppeal=(sh,c,rk)=>{const m=facMods(sh);return m.app[c]*(c==='f'||c==='s'?m.fs:1)*(m.tropic>1&&TROPIC.includes(rk)&&(c==='f'||c==='s')?m.tropic:1);};
const facWinter=(sh,c,mo)=>WINTER_M.includes(mo)?1+facMods(sh).win[c]:1;
/* the cost, room and yard time of moving a ship's facilities to a plan */
function facChange(sh,plan){
  let cost=0,days=0;const room={f:0,s:0,tt:0,t:0};
  for(const k of FAC_KEYS){const a=facLv(sh,k),b=plan[k]===undefined?a:plan[k];if(a===b)continue;
    const La=FAC[k].levels[a]||{},Lb=FAC[k].levels[b]||{};
    if(b>a){cost+=(Lb.cost||0)-(La.cost||0)*0.3;days=Math.max(days,Lb.days||10);}else days=Math.max(days,7);
    const dr=(Lb.room||0)-(La.room||0),w=Object.assign({},La.app,Lb.app),tot=Object.values(w).reduce((x,y)=>x+y,0)||1;
    for(const c in w)room[c]+=dr*w[c]/tot;}
  const z=facSize(sh.grt),zr=facSize(sh.grt,0.5),berths={};for(const c in room)berths[c]=Math.round(room[c]*zr/BERTH_ROOM[c]);
  return {cost:Math.round(cost*z*PX()/50)*50,days,berths};
}
/* ---------- the refit office ---------- */
const RF_JOBS=[ // yard jobs the refit office offers, by section
  ['Hull and upkeep',[['scrape','Scrape and paint the bottom',sh=>true,sh=>`A few days in dry dock for a clean bottom: her speed back and less coal burned. Nothing for her condition.${(sh.foul||0)>0.1?` She is ${sh.foul>0.6?'badly ':''}foul now.`:' Her bottom is clean at present.'}`],
    ['dock','Drydock overhaul',sh=>true,'Scrape, paint and overhaul: +35 condition and a clean bottom.'],
    ['replate','Re-plate and renew frames',sh=>fatOf(sh)>35,'Buys years of hull life, less each time.'],
    ['refurb','Refurbish the public rooms',sh=>(sh.fit||0)<90,'Cabins, saloons and linen as new, in the style of the day.']]],
  ['Machinery and equipment',[['oil','Convert to oil firing',sh=>sh.fuel==='coal','Cuts her stokehold crew and her bunker bill.'],
    ['turbines','New turbines',sh=>!(sh.up&&sh.up.turbines),'About 1.5 knots faster and a little more economical.'],
    ['wireless','Wireless telegraphy',sh=>!(sh.up&&sh.up.wireless),'Reports from sea as things happen; needed for the mails, and tugs reach her sooner.'],
    ...Object.keys(EQUIP).map(k=>[k,EQUIP[k].name,sh=>yearNow()>=EQUIP[k].from&&!(sh.up&&sh.up[k])&&!(k==='stab'&&sh.up&&sh.up.fins),EQUIP[k].desc])]],
  ['Cargo',[['gear','Modern cargo gear',sh=>sh.cargo>500&&!(sh.up&&sh.up.gear),'Electric winches and derricks: a day less in every port.'],
    ['hatch','More hatches and tween decks',sh=>sh.cargo>1500&&!(sh.up&&sh.up.hatch),'Cargo worked through more hatches at once: handling a quarter cheaper and half a day off each turnaround.'],
    ['heavy','Heavy-lift derricks',sh=>sh.cargo>1500&&!(sh.up&&sh.up.heavy),'Locomotives, boilers and machinery: general cargo and manufactures pay about 12% more.'],
    ['deep','Deep tanks',sh=>sh.cargo>1500&&!(sh.up&&sh.up.deep),'Tanks for palm oil and other liquids in bulk: palm oil pays about 30% more.'],
    ['reefer','Refrigerated holds',sh=>sh.cargo>500&&!(sh.up&&sh.up.reefer),'Carries chilled beef and bananas.']]],
  ['Passenger spaces',[['tourist','Tourist Third refit',sh=>S.m>=48&&sh.berths.tt===0&&sh.berths.t>0,'Half her steerage rebuilt as Tourist Third Cabin for students and teachers.'],
    ['lux','Luxury suites and a grand saloon',sh=>!(sh.up&&sh.up.lux),'First class appeal up a fifth.'],
    ['cruise','Convert her for cruising',sh=>!sh.cruiser&&CL.reduce((a,c)=>a+(sh.berths[c]||0),0)>=60,sh=>`Steerage out, cabins in, sun decks and a white hull: cruise passengers like her a quarter more. ${sh.berths.t?`Her ${int(sh.berths.t)} steerage berths become about ${int(Math.round(sh.berths.t*0.3))} Tourist cabins and a few more in first and second: she can no longer carry emigrants.`:'She keeps her berths.'}`]]]
];
function openRefit(id,pre){
  const sh=S.ships.find(x=>x.id===id);if(!sh)return;
  UI.rf={sid:id,jobs:{},fac:{...(sh.fac||{})},pre:pre||null};if(pre)UI.rf.jobs[pre]=true;
  UI.refitOpen=true;UI.designOpen=false;UI.rfPrev=UI.speed;if(UI.speed>0){UI.speed=0;UI.banner='Paused while you are in the refit office.';}UI.dirty=true;
}
function closeRefit(){UI.refitOpen=false;UI.rf=null;if(UI.rfPrev>0&&!S.over){UI.speed=UI.rfPrev;UI.banner=null;}UI.dirty=true;}
/* the plan as a list of yard jobs, priced as one visit */
function rfPlan(sh,rf){
  const jobs=Object.keys(rf.jobs).filter(k=>rf.jobs[k]);
  const fc=facChange(sh,rf.fac),facOn=FAC_KEYS.some(k=>(rf.fac[k]||0)!==facLv(sh,k));
  const list=jobs.map(k=>({k,cost:refitCost(sh,k),days:yardDays(sh,k)}));
  if(facOn)list.push({k:'fac',cost:Math.round(fc.cost*(atOwnYard(sh)?0.7:1)),days:Math.max(7,Math.round(fc.days*(atOwnYard(sh)?0.7:1)))});
  list.sort((a,b)=>b.cost-a.cost);
  const total=list.reduce((a,j,i)=>a+(i?Math.round(j.cost*YARD_BUNDLE):j.cost),0),full=list.reduce((a,j)=>a+j.cost,0);
  return {list,total,full,days:list.length?bundleDays(list.map(j=>j.days)):0,fc,facOn};
}
/* what the ship would be after the plan, as a patch for the forecasts */
function rfPatch(sh,rf){
  const p={up:{...(sh.up||{})},upR:{...(sh.upR||{})},fac:{...rf.fac},berths:{...sh.berths}};
  const fc=facChange(sh,rf.fac);for(const c in fc.berths)p.berths[c]=Math.max(0,p.berths[c]-fc.berths[c]);
  for(const k in rf.jobs){if(!rf.jobs[k])continue;
    if(k==='scrape')p.foul=0;
    if(k==='dock')p.cond=Math.max(sh.cond,Math.min(Math.min(92,condCap(sh)),sh.cond+35)),p.foul=0;
    if(k==='refurb')p.fit=100;if(k==='oil')p.fuel='oil';if(k==='replate')p.fat=Math.max(0,fatOf(sh)-[25,15,8,4][Math.min(3,sh.replates||0)]);
    if(k==='cruise'){p.berths=cruiseBerths(p.berths);p.cruiser=true;}
    if(k==='tourist'){const cv=Math.round(p.berths.t*0.5);p.berths.t-=cv;p.berths.tt+=Math.round(cv*0.6);}
    if(['turbines','wireless','gear','reefer','lux','hatch','heavy','deep'].includes(k))p.up[k]=true;
    if(EQUIP[k]){p.up[k]=true;p.upR[k]=true;}}
  return p;
}
/* the Marine Superintendent's view: what each option would add a month over a year, on her line */
function rfValue(sh,rf,extra){
  const rk=sh.line||sh.legRoute;if(!rk||!ROUTES[rk])return null;
  const base=econYear(sh,rk,null,rfPatch(sh,rf)).pm;
  if(!extra)return base;const rf2={jobs:{...rf.jobs,...(extra.job?{[extra.job]:true}:{})},fac:{...rf.fac,...(extra.fac||{})}};
  return econYear(sh,rk,null,rfPatch(sh,rf2)).pm-base;
}
function rfPicks(sh){ // options that pay back within about three years
  const out={},rf0={jobs:{},fac:{...(sh.fac||{})}};const rk=sh.line||sh.legRoute;if(!rk)return out;
  for(const [,jobs] of RF_JOBS)for(const [k,,ok] of jobs){if(!ok(sh))continue;const c=refitCost(sh,k),g=rfValue(sh,rf0,{job:k});if(g>0&&c/g<=36)out['j:'+k]=g;}
  for(const k of FAC_KEYS){const l=facLv(sh,k)+1;if(!levelOk(k,l,sh.grt,yearNow()))continue;if(slotsUsed(sh.fac)+1>slotsOf(sh))break;
    const fc=facChange(sh,{...sh.fac,[k]:l}),g=rfValue(sh,rf0,{fac:{[k]:l}});if(g>0&&fc.cost/g<=36)out['f:'+k]=g;}
  if(!(sh.cond>=70)||(sh.foul||0)>0.45)out['j:dock']=out['j:dock']||1;
  return out;
}
/* the Refit Office's warnings: luxury equipment earns through first and second class, so on a ship with few of them it never pays */
const RF_FS_JOBS=['lux',...Object.keys(EQUIP).filter(k=>EQUIP[k].fs)];
function rfFlags(sh){
  const out={},rf0={jobs:{},fac:{...(sh.fac||{})}},rk=sh.line||sh.legRoute;if(!rk)return out;
  const fs=(sh.berths.f||0)+(sh.berths.s||0);
  for(const [,jobs] of RF_JOBS)for(const [k,,ok] of jobs){if(!RF_FS_JOBS.includes(k)||!ok(sh))continue;
    const c=refitCost(sh,k),g=rfValue(sh,rf0,{job:k});if(g>0&&c/g<=36)continue;
    out[k]={g,fs,pay:g>0?Math.round(c/g):null};}
  return out;
}
/* what a cruise conversion would earn her in each cruise's season, against the same months on her own line */
function rfCruise(sh){
  const rk=homeOf(sh),p=rfPatch(sh,{jobs:{cruise:true},fac:{...(sh.fac||{})}});
  const v=Object.keys(ROUTES).filter(k=>isCruise(k)&&routeOpen(k,S.m)).map(k=>{const ms=ROUTES[k].cruise.months;
    return {rk:k,pm:econMonths(sh,k,ms,p),now:econMonths(sh,k,ms),home:rk&&S.lines[rk]&&!isCruise(rk)?econMonths(sh,rk,ms):-idleCost(sh)};}).sort((a,b)=>(b.pm-b.home)-(a.pm-a.home));
  return v;
}
const RF_CACHE={};
function rfCached(sh,fn,key){const k=key+'|'+S.m+'|'+sh.id+'|'+sh.line;if(RF_CACHE[fn]&&RF_CACHE[fn].k===k)return RF_CACHE[fn].v;const v=fn==='picks'?rfPicks(sh):fn==='flags'?rfFlags(sh):fn==='cruise'?rfCruise(sh):null;RF_CACHE[fn]={k,v};return v;}
function renderRefit(){
  const el=$('designer');if(!UI.refitOpen)return false;
  const rf=UI.rf,sh=S.ships.find(x=>x.id===rf.sid);if(!sh){closeRefit();return false;}
  el.hidden=false;const y=yearNow(),P=rfPlan(sh,rf),picks=rfCached(sh,'picks',JSON.stringify(sh.fac||{})+JSON.stringify(sh.up||{})+Math.round(sh.cond)+Math.round(sh.fit||0));
  const rk=sh.line||sh.legRoute,now=rk?econYear(sh,rk).pm:null,after=rk&&P.list.length?rfValue(sh,rf):now;
  const busy=sh.state==='yard'?`She is in the yard for ${[sh.yardKind,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}: anything booked here joins that visit.`
    :sh.pendingYard?`She is already booked in for ${[sh.pendingYard,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}: anything booked here joins that visit.`:'';
  const where=sh.state==='sea'||sh.state==='repo'?'She is at sea: the work starts when she reaches port.':sh.state==='yard'?'':`She is at ${PN[sh.port]}: the work starts at once.`;
  const pk=k=>picks[k]?`<span class="rftag">${picks[k]<50?'Marine Superintendent recommends':`Marine Superintendent: +${fmt(picks[k])}/mo`}</span>`:'';
  const inPlan=k=>sh.pendingYard===k||sh.yardKind===k||(sh.yardAdd||[]).includes(k);
  const ckey=JSON.stringify(sh.fac||{})+JSON.stringify(sh.up||{})+JSON.stringify(sh.berths)+Math.round(sh.cond)+Math.round(sh.fit||0);
  const flag=k=>{if(!RF_FS_JOBS.includes(k))return '';const f=rfCached(sh,'flags',ckey)[k];if(!f)return '';
    return `<span class="rftag warn">Refit Office: only pays on a big first-class ship. She has ${int(f.fs)} first and second berths${f.g>0?`; about +${fmt(f.g)} a month, ${Math.round(f.pay/12)} years to pay back`:', and it would earn her nothing'}.</span>`;};
  const cruiseNote=()=>{const v=rfCached(sh,'cruise',ckey);if(!v||!v.length)return '';const b=v[0],gain=b.pm-b.home;
    return `<span class="rftag cr${gain>0?'':' warn'}">Refit Office: converted, her best cruise is ${ROUTES[b.rk].name} (${cruiseMonthsText(b.rk)}), about ${fmt(Math.round(b.pm))} a month in season against ${fmt(Math.round(b.home))} on her line${b.now>-1e9?` (${fmt(Math.round(b.now))} cruising as she is)`:''}.${gain>0?'':' Cruising would not pay her.'}</span>`;};
  const jobRow=([k,label,ok,desc])=>{if(!ok(sh))return '';const on=!!rf.jobs[k],c=refitCost(sh,k),booked=inPlan(k);
    return `<label class="rfopt${on?' on':''}${picks['j:'+k]?' rfpick':''}"><input type="checkbox" data-rfjob="${k}" ${on?'checked':''} ${booked?'disabled':''}><span><b>${label}</b> <span class="num">${booked?'booked':fmt(c)+' · '+yardDays(sh,k)+' days'}</span>${pk('j:'+k)}${picks['j:'+k]?'':flag(k)}${k==='cruise'?cruiseNote():''}<small>${typeof desc==='function'?desc(sh):desc}</small></span></label>`;};
  const used=slotsUsed(rf.fac),slots=slotsOf(sh);
  const facRow=k=>{const F=FAC[k],cur=facLv(sh,k),tgt=rf.fac[k]||0;
    return `<div class="rffac${picks['f:'+k]?' rfpick':''}"><b>${F.name}</b>${pk('f:'+k)}<div class="rflv">${F.levels.map((L,i)=>{const ok=levelOk(k,i,sh.grt,y),room=i>tgt&&used-tgt+i>slots,why=!ok?(L.min&&sh.grt<L.min?`needs ${int(L.min)} tons`:`from ${L.from}`):room?'no venue free':'';
      return `<button data-act="rflevel" data-k="${k}" data-v="${i}" aria-pressed="${tgt===i}" ${why&&i!==cur?'disabled':''}>${esc(L.n)}${i===cur?' <small>now</small>':''}${why&&i!==cur?` <small>${why}</small>`:''}</button>`;}).join('')}</div>
      <small class="note">${tgt!==cur?(tgt>cur?`${fmt(facChange(sh,{...sh.fac,[k]:tgt}).cost)} to fit`:'Taken out at the refit'):''}${F.levels[tgt].staff?`${tgt!==cur?' · ':''}staff ${fmt(F.levels[tgt].staff*facSize(sh.grt,0.7)*PX())} a month`:''}</small></div>`;};
  const groups=[...new Set(FAC_KEYS.map(k=>FAC[k].g))];
  const bl=P.fc.berths,lost=CL.filter(c=>bl[c]).map(c=>`${bl[c]>0?'−':'+'}${Math.abs(bl[c])} ${CL_NAME[c].toLowerCase()}`).join(', ');
  const fm=facMods({fac:rf.fac,upR:{}}),appTxt=CL.filter(c=>fm.app[c]>1.001).map(c=>`${CL_NAME[c].toLowerCase()} +${Math.round((fm.app[c]-1)*100)}%`).join(', ');
  const winTxt=CL.filter(c=>fm.win[c]>0).map(c=>`${CL_NAME[c].toLowerCase()} +${Math.round(fm.win[c]*100)}%`).join(', ');
  const pp=rfPatch(sh,rf);
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">Refit office · ${PN[sh.port]||'at sea'}</span><h2>SS ${esc(sh.name)} <small>${int(sh.grt)} tons · built ${sh.built}</small></h2></div><button class="btn" data-act="rfclose">Close</button></div>
  <div class="dz-body">
    <div class="dz-view"><div class="dz-top stack">
      ${profileSVG(Object.assign({},sh,{berths:pp.berths,fit:pp.fit||sh.fit}),UI.dzView==='ext'?'ext':'cut')}
      <div class="seg" role="group"><button data-act="dzview" data-v="ext" aria-pressed="${UI.dzView==='ext'}">Exterior</button><button data-act="dzview" data-v="cut" aria-pressed="${UI.dzView!=='ext'}">Cutaway</button></div>
      <div class="dz-figs">
        <div><span class="lbl">This refit</span><b class="num">${fmt(P.total)}</b></div>
        <div><span class="lbl">Out of service</span><b class="num">${P.days} days</b></div>
        <div><span class="lbl">Venues</span><b class="num">${used} of ${slots}</b></div>
      </div>
      <div class="report"><span class="lbl">What she gets</span><ul>
        <li>${P.list.length?P.list.map(j=>j.k==='fac'?'new facilities':YARD_NAME[j.k]).join(', '):'Nothing chosen yet.'}${P.list.length?'.':''}${P.list.length>1?` Booked as one visit, ${fmt(P.full-P.total)} cheaper than one by one.`:''}</li>
        ${lost?`<li>Berths: ${lost}. Facilities take room from the classes they serve.</li>`:''}
        ${appTxt?`<li>Facilities draw passengers: ${appTxt}.</li>`:''}
        ${winTxt?`<li>Indoor spaces hold passengers through the winter: ${winTxt} in the winter months.</li>`:''}
        ${!P.list.length?'':rk&&now!==null?`<li>On ${ROUTES[rk].name}, averaged over a year: about <strong class="${after-now>=0?'pos':'neg'}">${after-now>=0?'+':'−'}${fmt(Math.abs(after-now))} a month</strong> after staff costs${after>now&&P.total?`, paying back in about ${Math.max(1,Math.round(P.total/(after-now)))} months`:''}.</li>`:'<li>She has no line: the Superintendent cannot judge what it would earn.</li>'}
      </ul></div>
      ${busy?`<p class="note">${busy}</p>`:''}<p class="note">${where}</p>
      ${S.cash<P.total&&(sh.state==='port'||sh.state==='yard')?`<p class="badline">The account cannot cover ${fmt(P.total)}.</p>`:''}
      </div><div class="dz-bot stack">
      ${Object.keys(picks).length?`<button class="btn" data-act="rfpicks">Take the Superintendent's picks</button>`:''}
      <button class="btn primary" data-act="rfbook" ${!P.list.length||S.over||((sh.state==='port'||sh.state==='yard')&&S.cash<P.total)?'disabled':''}>Book the refit · ${fmt(P.total)}</button>
    </div></div>
    <div class="dz-ctl">
      ${RF_JOBS.map(([title,jobs])=>{const rows=jobs.map(jobRow).join(''),have=jobs.filter(([k])=>(sh.up&&sh.up[k])||(k==='oil'&&sh.fuel==='oil')||(k==='cruise'&&sh.cruiser)).map(([k,label])=>k==='oil'?'oil firing':k==='cruise'?'converted for cruising':(UPGRADES[k]||EQUIP[k]||{name:label}).name.toLowerCase());
        return rows||have.length?`<section><h3>${title}</h3>${have.length?`<p class="note">Already fitted: ${have.join(', ')}.</p>`:''}<div class="stack" style="gap:6px">${rows}</div></section>`:'';}).join('')}
      ${CL.reduce((a,c)=>a+(sh.berths[c]||0),0)<60?`<section><h3>Facilities</h3><p class="note">She carries ${CL.reduce((a,c)=>a+(sh.berths[c]||0),0)} passengers: public rooms would never pay. Put her money into cargo fittings.</p></section>`:`<section><h3>Facilities</h3><p class="note">${slots} venues fit a ship of her size; each level takes one. Levels above what she has cost the difference; taking a facility out gives the room back to cabins.</p>
        ${groups.map(g=>`<h4 class="lbl">${g}</h4>`+FAC_KEYS.filter(k=>FAC[k].g===g).map(facRow).join('')).join('')}</section>`}
    </div>
  </div>`);
  return true;
}
function rfAct(a,b){
  const rf=UI.rf;if(!rf)return;const sh=S.ships.find(x=>x.id===rf.sid);if(!sh)return;
  if(a==='rflevel'){const k=b.dataset.k,v=+b.dataset.v;rf.fac[k]=v;return;}
  if(a==='rfpicks'){const p=rfCached(sh,'picks',JSON.stringify(sh.fac||{})+JSON.stringify(sh.up||{})+Math.round(sh.cond)+Math.round(sh.fit||0));
    for(const x in p){if(x.startsWith('j:'))rf.jobs[x.slice(2)]=true;else{const k=x.slice(2);if(slotsUsed(rf.fac)<slotsOf(sh))rf.fac[k]=Math.max(rf.fac[k]||0,facLv(sh,k)+1);}}return;}
  if(a==='rfbook'){const P=rfPlan(sh,rf);if(!P.list.length)return;
    if(P.facOn)sh.facPlan={...rf.fac};
    const keys=P.list.map(j=>j.k);
    if(sh.state==='yard'||sh.pendingYard){for(const k of keys)addYardJob(sh,k);}
    else if(sh.state==='sea'||sh.state==='repo'){sh.pendingYard=keys[0];sh.yardAdd=keys.slice(1);}
    else{sh.yardAdd=keys.slice(1);enterYard(sh,keys[0]);}
    closeRefit();}
}
/* when the yard is done: the new facilities, and the room they take */
function applyFacPlan(sh){
  const plan=sh.facPlan;if(!plan)return;const fc=facChange(sh,plan);
  for(const c in fc.berths)sh.berths[c]=Math.max(0,sh.berths[c]-fc.berths[c]);
  sh.fac={...plan};sh.facPlan=null;
  news(`SS ${sh.name} returns with her new public rooms: ${FAC_KEYS.filter(k=>plan[k]).map(k=>FAC[k].levels[plan[k]].n.toLowerCase()).join(', ')||'plain fittings'}.`,'good');
}
