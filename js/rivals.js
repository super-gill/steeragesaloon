/* ================= RIVALS ================= */
/* Rival lines are real companies: fleets on routes, cash, and a monthly mind of their own.
   Each route has one shared market per class and direction. Every ship on the route, ours or theirs,
   takes a slice in proportion to berths x crossings per month x appeal. */
const MKT_LOAD=0.62,CARGO_LOAD=0.75; // rival fleets start the game this full in third class (the market is sized from it)
/* prestige: how cabin passengers rate them; aggr: how hard they fight and how readily they build; lev: how far
   they will borrow against their fleet (a half is a borrower, a fifth a hoarder). Lines founded in play are added here. */
const RIVAL_P={
  imperial:{lev:0.5,prestige:1.15,aggr:1.2,cash:900000,col:'#8C2F2F',knots:[15,19],grt:[11000,19000],
    names:['Albionic','Cambrian Star','Northumbrian','Aurelian','Valentia','Orcadian','Mercian','Hibernian','Wessexian','Lothian','Dalriadan','Brigantian','Silurian','Pictavian','Cornubian','Demetian','Iceni','Atrebatic','Belgavian','Novantian']},
  nordmark:{lev:0.4,prestige:1.05,aggr:1.0,cash:400000,col:'#4A4F55',knots:[15,18],grt:[10000,16000],
    names:['Weserland','Elbstern','Friesland','Holstein','Nordlicht','Havelberg','Stralsund','Dithmarschen','Vierlande','Lüneburg','Altmark','Uckermark','Wendland']},
  columbia:{lev:0.25,prestige:0.88,aggr:0.7,cash:300000,col:'#2E4E7A',knots:[14,17],grt:[9000,14000],
    names:['Chesapeake','Old Dominion','Liberty Bell','Columbian','Shenandoah','Potomac','Allegheny','Susquehanna']},
  dominion:{lev:0.35,prestige:1.0,aggr:0.8,cash:500000,col:'#8A5A1E',knots:[14,17],grt:[9000,15000],
    names:['Acadian Star','Fundy','Manitoban','Saguenay','Ottawa Queen','Assiniboine','Gaspé','Mistassini','Nipigon','Kamouraska','Témiscouata','Chaleur','Tadoussac']},
  partenope:{lev:0.45,prestige:0.95,aggr:0.9,cash:350000,col:'#2E6A4A',knots:[14,17],grt:[8000,13000],
    names:['Vesuvio','Capri','Sorrento','Amalfi','Ischia','Procida','Posillipo','Positano']},
  aurore:{lev:0.55,prestige:1.25,aggr:1.0,cash:700000,col:'#3B4F8F',knots:[16,21],grt:[12000,24000],kind:'liner',
    names:['Val de Loire','Aquitaine','Côte d\'Argent','Saintonge','Vendée','Limousin','Touraine','Anjou','Berry']},
  antilles:{lev:0.2,prestige:0.95,aggr:0.8,cash:400000,col:'#B8860B',knots:[14,16],grt:[4000,7000],kind:'fruit',
    names:['Montego','Port Antonio','Blue Mountain','Ocho Rios','Manchioneal','Lucea','Annotto','Savanna']},
  guinea:{lev:0.3,prestige:0.9,aggr:0.9,cash:500000,col:'#556B2F',knots:[11,14],grt:[5000,9000],kind:'mixed',
    names:['Sherbro','Calabar','Bonny','Accra','Cape Palmas','Opobo','Lokoja','Badagry']},
  pampas:{lev:0.4,prestige:1.05,aggr:1.0,cash:600000,col:'#8B3A62',knots:[13,16],grt:[8000,14000],kind:'plate',
    names:['Pampero','Estancia','Rosario','Tucumán','Mendoza','Paraná','Córdoba','Salado','Tandil']},
  meridian:{lev:0.25,prestige:1.0,aggr:0.6,cash:450000,col:'#5C7C8A',knots:[14,16],grt:[8000,14000],kind:'cruise',
    names:['Arcadia Star','Meridiana','Azure Isle','Southern Cross','Halcyon','Alcina','Belvedere','Solent Star','Caravel','Serenade','Coral Queen','Mirabelle']},
  gulf:{lev:0.35,prestige:0.8,aggr:0.8,cash:350000,col:'#6B5B45',knots:[10,13],grt:[5000,8000],kind:'cargo',
    names:['Brazos','Sabine','Atchafalaya','Calcasieu','Trinity','Neches','Pearl','Mobile']}
};
/* in 1900 pleasure cruising is a small trade: one ship on each cruise the Meridian company runs */
const RIVAL_START_1900={cwi:[['meridian',1]],cmd:[['meridian',1]],cfj:[['meridian',1]],cwx:[['meridian',1]]};
const RIVAL_START={hal:[['dominion',3],['imperial',1]],lha:[['dominion',4],['imperial',2]],
  liv:[['imperial',5],['nordmark',3],['columbia',2]],gny:[['imperial',2],['columbia',2]],nap:[['partenope',4],['columbia',1]],
  stl:[['dominion',3],['imperial',1]],exp:[['imperial',3],['aurore',3],['nordmark',1]],ham:[['nordmark',4],['imperial',1]],
  cot:[['gulf',5]],ban:[['antilles',5]],waf:[['guinea',5]],rpl:[['pampas',4],['nordmark',2]],
  cwi:[['meridian',2]],cmd:[['meridian',2]],cfj:[['meridian',1]],cwx:[['meridian',2]],cnw:[['meridian',2]]};
/* berths and holds by type of ship: liners, cargo steamers, fruit ships, West Africa mixed ships, River Plate refrigerated liners.
   Ships built before the war were emigrant ships first: far more steerage to the ton, fewer cabins (b is the year built) */
const RIVAL_KIND={
  liner:(g,b)=>b<1915?{berths:{f:g/95,s:g/70,t:g/7.5},cargo:g/4,reefer:false}:{berths:{f:g/80,s:g/45,t:g/13},cargo:g/4,reefer:false},
  cargo:g=>({berths:{f:g/500,s:0,t:0},cargo:g*1.5,reefer:false}),
  fruit:g=>({berths:{f:g/100,s:g/200,t:0},cargo:g*0.6,reefer:true}),
  mixed:g=>({berths:{f:g/110,s:g/150,t:g/90},cargo:g*0.9,reefer:false}),
  plate:(g,b)=>b<1915?{berths:{f:g/100,s:g/80,t:g/9},cargo:g*0.5,reefer:true}:{berths:{f:g/90,s:g/60,t:g/16},cargo:g*0.5,reefer:true},
  cruise:g=>({berths:{f:g/40,s:g/70,t:g/35},cargo:0,reefer:false}) // her 'third' is sold as tourist cabins on a cruise
};

/* ships were smaller and slower the further back they were built: the ranges in RIVAL_P are for ships of about 1920 */
const shipEraGrt=b=>b>=1920?1:b>=1913?0.85+0.15*(b-1913)/7:b>=1900?0.6+0.25*(b-1900)/13:Math.max(0.35,0.6-0.0125*(1900-b));
const shipEraKnots=b=>b>=1920?0:b>=1913?-0.5*(1920-b)/7:b>=1900?-1.5+(b-1900)/13:-1.5-0.075*(1900-b);
function makeRivalShip(o,rk,built){
  const P=RIVAL_P[o],used=new Set(S.rships.filter(x=>x.owner===o).map(x=>x.name).concat((S.rorders||[]).filter(q=>q.o===o).map(q=>q.sh.name)));
  const nm=P.names.find(n=>!used.has(n)&&!nameTaken(n))||freshName(P.names[Math.floor(Math.random()*P.names.length)]);
  const y=Math.floor(yearNow());built=built||Math.round(y-1-Math.random()*22);
  const grt=Math.round((P.grt[0]+Math.random()*(P.grt[1]-P.grt[0]))*shipEraGrt(built)/100)*100;
  const knots=+(P.knots[0]+Math.random()*(P.knots[1]-P.knots[0])+shipEraKnots(built)).toFixed(1);
  const K=RIVAL_KIND[P.kind||'liner'](grt,built);
  return {id:'r'+(S.rnext++),owner:o,name:nm,route:rk,grt,knots,built,
    berths:{f:Math.round(K.berths.f),s:Math.round(K.berths.s),t:Math.round(K.berths.t)},cargo:Math.round(K.cargo),reefer:K.reefer,phase:Math.random()};
}
function initRivals(){
  S.rships=[];S.rnext=1;S.rivals={};S.rmoves=[];S.lastRivalPax={};S.mkt={};S.cmkt={};S.load0={};
  ensureRivals();
}
/* add rivals, markets and norms for any route or rival line the save does not have yet (new games and old saves alike) */
function ensureRivals(){
  S.rships=S.rships||[];S.rnext=S.rnext||1;S.rivals=S.rivals||{};S.rmoves=S.rmoves||[];S.lastRivalPax=S.lastRivalPax||{};S.mkt=S.mkt||{};S.cmkt=S.cmkt||{};S.load0=S.load0||{};
  coRegister(); // lines founded in play, from the save
  for(const x of S.rships)if(x.reefer===undefined)x.reefer=false;
  for(const rk in S.mkt)if(typeof S.mkt[rk]==='number')marketFor(rk); // 0.3 saves: one number per route becomes one per class
  for(const rk in RIVAL_START){if(S.mkt[rk]!==undefined)continue;
    const start=(newCal()&&RIVAL_START_1900[rk])||RIVAL_START[rk],open=routeOpen(rk,S.m);
    for(const [o,n] of start)for(let i=0;i<n;i++)S.rships.push(makeRivalShip(o,rk));
    marketFor(rk,open?null:ROUTES[rk].cruise.from);
    // a trade that has not opened yet is sized now, and left empty: new lines come to it when it opens
    if(!open)S.rships=S.rships.filter(x=>x.route!==rk);}
  for(const rk in ROUTES)if(S.cmkt[rk]===undefined){let cc=0;for(const x of S.rships)if(x.route===rk)cc+=x.cargo*sailings(x.knots,rk);const r=ROUTES[rk];S.cmkt[rk]=CARGO_LOAD*cc/Math.max(1,r.cargo.out.t,r.cargo.home.t);}
  coEnsure(); // company accounts, and each route's running costs
}
/* size a route's passenger market from the rival fleet on it, so they start MKT_LOAD full in the busy direction */
function marketFor(rk,opens){
  // each class is sized from rival capacity in that class, so rivals start MKT_LOAD full in its busy direction
  const r=ROUTES[rk];S.mkt[rk]={};
  for(const c of CL){let cap=0;for(const x of S.rships)if(x.route===rk)cap+=(r.cruise?rivalBerths(x,c):c==='tt'?x.berths.t*0.25:x.berths[c])*sailings(x.knots,rk);
    const dem=r.base[c]*Math.max(dirW(rk,c),1-dirW(rk,c));S.mkt[rk][c]=dem>0?MKT_LOAD*(r.mload||1)*cap/dem:0;}
  let cc=0;for(const x of S.rships)if(x.route===rk)cc+=x.cargo*sailings(x.knots,rk);S.cmkt[rk]=CARGO_LOAD*cc/Math.max(1,r.cargo.out.t,r.cargo.home.t);
  // the route's normal load, so rivals judge trade against what is usual for that route
  const st=routeStats(rk,(opens!=null?opens:newCal()?S.m0:M21)+6);/* July of the first year, or of the trade's first */let p=0,c=0;for(const o in st.owners){p+=st.owners[o].pax;c+=st.owners[o].cap;}S.load0[rk]=c?p/c:0.5;
}

/* ---------- market maths ---------- */
const turnPair=rk=>{const c=ROUTES[rk].cruise;return c?c.turn+(c.home!==undefined?c.home:TURN_DAYS):2*TURN_DAYS;};
const sailings=(knots,rk,sm=1)=>{const r=ROUTES[rk];return 30/(2*r.dist/(knots*sm*24)+turnPair(rk)+(r.cruise?1:2)*(r.calls.length-2)*CALL_DAYS);}; // round trips per month
function marketM(rk,c,dir,m){const r=ROUTES[rk];if(!routeOpen(rk,m))return 0;return S.mkt[rk][c]*r.base[c]*(dir===0?dirW(rk,c):1-dirW(rk,c))*seasonOf(rk,c,m)*histMod(c,rk,m)*(dir===1&&(c==='t'||c==='tt')?preReturn(m):1)*greatFear(rk,m);}
function rivalBerths(x,c){if(isCruise(x.route)){const st=ROUTES[x.route].cruise.steerage;return c==='tt'?(st?0:x.berths.t):c==='t'?(st?x.berths.t:0):x.berths[c];}if(c==='tt')return S.m>=ym(1925,0)?Math.round(x.berths.t*0.25):0;if(c==='t'&&S.m>=ym(1925,0))return Math.round(x.berths.t*0.75);return x.berths[c];}
/* speed sells cabins, above all on prestige routes: an old 14-knot steamer cannot hold first class against 20-knot giants */
const speedAppeal=(knots,rk,c)=>{const p=ROUTES[rk].prestige,k=(c==='f'||c==='s')?Math.max(0,(p-0.8)*1.8):Math.max(0,(p-0.8)*0.4);return Math.pow(knots/16,k);};
/* how fares move demand. Below the line rate a cut wins passengers at the usual rate; above it they walk to the next
   line's office far more readily, since the same crossing is on sale for less a few doors down. The kink is what
   holds everyone near the conference rate. */
const fareDemand=(ratio,c)=>clamp(Math.pow(ratio,ratio>=1?E[c]:E[c]*2.6),1e-6,1.8); // no floor (0.35.4): at ten times the rate almost nobody books
/* the travellers' way out: another port, another route, or staying at home. It takes a share of the route as if it were
   another line holding 15% (OUTSIDE_A) of the route's capacity at the line rate, so a line alone on a route cannot raise its fares
   for ever: before 0.35.4 its fare cancelled out of its own share and ten times the rate brought the same passengers */
const OUTSIDE_A=0.15;
function rivalAppeal(o,rk,c,x){
  const f=rivalFare(o,rk,c);
  return fareDemand(1/f,c)*RIVAL_P[o].prestige*(x?speedAppeal(x.knots,rk,c):1)*outAppeal(rk,c); // shared hostels and agents help them
}
/* rivals' fare level on a route, as a multiple of the line rate: their own pricing, price matching, and any rate war */
function rivalFare(o,rk,c){const war=S.wars[rk];return (S.rivalIdx[o]||1)*((S.rfare&&S.rfare[rk])||1)*(war?warMult(war,c,o):1);}
/* a rate war's cut: steerage can fall by half in a war between lines, cabins less; lines not in the fight hold their fares a little better */
const warMult=(w,c,o)=>{const m=(c==='t'||c==='tt')&&w.multT?w.multT:w.mult;return w.by&&o&&!w.by.includes(o)?1-(1-m)*0.7:m;};
// a class priced far above the rate cannot hide a cut in another from the rivals (0.35.4): each class counts at no more than a tenth over
/* the classes the rivals watch: Tourist Third too, once it exists (0.35.6) */
const watchCL=rk=>{const r=ROUTES[rk];return CL.filter(c=>r.base[c]>0&&r.ref[c]>0&&(c!=='tt'||(r.cruise||S.m>=ym(1925,0))&&S.ships.some(x=>x.line===rk&&(x.berths.tt||0)>0)));};
function ourFareRatio(rk){const r=ROUTES[rk];let a=0,b=0;for(const c of watchCL(rk)){a+=r.base[c]*Math.min(1.1,effFare(rk,c)/r.ref[c]);b+=r.base[c];}return b?a/b:1;}
function ourAppeal(sh,rk,c){
  const L=S.lines[rk],r=ROUTES[rk];
  const pf=fareDemand(r.ref[c]/effFare(rk,c),c);
  const mods=shipMods(sh);
  return pf*repF(c,S.rep,r)*SERV[c][L.service]*SPD_D[c][sh.speed]*ADV_MULT[L.adv]*(S.conf&&c==='t'?1.04:1)*(c==='f'||c==='s'?mods.appealFS:mods.appealT)*shoreMult(rk,c)*speedAppeal(knotsOf(sh)*SPD[sh.speed]*mods.speed,rk,c)*(sh.up&&sh.up.aircon&&TROPIC.includes(rk)&&(c==='f'||c==='s')?1.06:1)*(r.cruise?(sh.cruiser?1.25:1):1)*(1-(c==='f'||c==='s'?0.08:0.03)*seaSev(sh,rk,S.m))*facAppeal(sh,c,rk)*giantShy(sh,c);
}
const TROPIC=['cot','ban','waf','rpl','nap'];
/* booking agencies in a region the route calls at, and emigrant hostels at its ports */
function shoreMult(rk,c){
  if(!S.shore)return 1;const calls=ROUTES[rk].calls;let x=1;
  for(const a in S.shore.agents)if(AGENCY[a].ports.some(p=>calls.includes(p)))x*=(c==='t'||c==='tt')?agentSteer():1.03;
  if((c==='t'||c==='tt')&&calls.some(p=>S.shore.hostels[p]))x*=1.12;
  return x;
}
/* rival weight is asked for thousands of times while head office runs its forecasts; it cannot change within a day
   unless the rival fleets, fares, a war or the Line's shared shore services change, so it is kept for the day */
const RW_CACHE={k:null,m:new Map()};
function rivalWeight(rk,c,owner){
  const day=Math.floor(S.t)+'|'+S.m+'|'+S.rships.length+'|'+(S.rnext||0)+'|'+Object.keys(S.wars).length+'|'+Object.keys((S.shore&&S.shore.sell)||{}).length;
  if(RW_CACHE.k!==day){RW_CACHE.k=day;RW_CACHE.m.clear();}
  const key=rk+c+(owner||'')+'|'+((S.rfare&&S.rfare[rk])||1)+'|'+(S.wars[rk]?S.wars[rk].left:0);
  let v=RW_CACHE.m.get(key);if(v===undefined){v=rivalWeightRaw(rk,c,owner);RW_CACHE.m.set(key,v);}
  return v;
}
function rivalWeightRaw(rk,c,owner){let a=0;for(const x of S.rships)if(x.route===rk&&(!owner||x.owner===owner)){const b=rivalBerths(x,c);if(b)a+=b*sailings(x.knots,rk)*rivalAppeal(x.owner,rk,c,x)*warRivalF(x.owner,S.m);}return a;}
function ourWeight(rk,c,exclude){let a=0;if(!S.lines[rk])return 0;
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state)&&sh.berths[c])a+=sh.berths[c]*sailings(knotsOf(sh),rk,SPD[sh.speed])*ourAppeal(sh,rk,c);return a;}
function cargoWeight(rk,exclude,reefer){let a=0;for(const x of S.rships)if(x.route===rk)a+=x.cargo*sailings(x.knots,rk)*(reefer&&!x.reefer?0.15:1)*warRivalF(x.owner,S.m);a*=outCargo(rk); // shared canvassers help them
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state))a+=sh.cargo*sailings(knotsOf(sh),rk,SPD[sh.speed])*(reefer&&!(sh.up&&sh.up.reefer)?0.15:1);return a;}
/* Monthly passengers on a route, split between us and each rival line (estimate for the current month). */
function routeStats(rk,m){
  const owners={},ours={pax:0,cap:0};
  const r=ROUTES[rk];
  for(const x of S.rships)if(x.route===rk){const o=owners[x.owner]=owners[x.owner]||{ships:0,pax:0,cap:0,rev:0,paxRev:0,cargoRev:0,grt:0,cargoT:0};o.ships++;o.grt+=x.grt;}
  for(const c of ['f','s','t','tt']){
    const rw={};let tot=ourWeight(rk,c);for(const o in owners){rw[o]=rivalWeight(rk,c,o);tot+=rw[o];}
    if(tot<=0)continue;
    const ow=ourWeight(rk,c);
    for(const dir of [0,1]){
      const M=marketM(rk,c,dir,m);
      for(const o in owners){let cap=0;for(const x of S.rships)if(x.route===rk&&x.owner===o)cap+=rivalBerths(x,c)*sailings(x.knots,rk);
        const p=Math.min(cap,M*rw[o]/tot);owners[o].pax+=p;owners[o].cap+=cap;const pr=p*(r.cruise&&dir===1?0:(r.ref[c]||r.ref.t))*rivalFare(o,rk,c);owners[o].rev+=pr;owners[o].paxRev+=pr;}
      let cap=0;for(const sh of S.ships)if(sh.line===rk&&ACTIVE.includes(sh.state))cap+=(sh.berths[c]||0)*sailings(knotsOf(sh),rk,SPD[sh.speed]);
      ours.pax+=Math.min(cap,M*ow/tot);ours.cap+=cap;
    }
  }
  // cargo: each direction's offer, shared by hold space as the ships' own sailings share it
  if(!r.cruise&&routeOpen(rk,m))for(const dir of [0,1]){const cd=dir===0?r.cargo.out:r.cargo.home,cm=COMM[cd.c],offer=S.cmkt[rk]*cd.t*cargoSeason(cd.c,m)*warCargoVol(m),cw=cargoWeight(rk,null,cm.reefer);
    if(offer<=0||cw<=0)continue;
    for(const o in owners){let w=0;for(const x of S.rships)if(x.route===rk&&x.owner===o)w+=x.cargo*sailings(x.knots,rk)*(cm.reefer&&!x.reefer?0.15:1)*warRivalF(o,m);
      const t=Math.min(w,offer*w/cw),cr=t*cm.rate*cargoMod(m);owners[o].cargoT+=t;owners[o].rev+=cr;owners[o].cargoRev+=cr;}}
  let rivalPax=0;for(const o in owners){owners[o].load=owners[o].cap?owners[o].pax/owners[o].cap:0;rivalPax+=owners[o].pax;}
  return {owners,ours,rivalPax,total:rivalPax+ours.pax};
}
const RP_CACHE={};
function rivalPax(rk,m){const k=rk+'|'+m+'|'+Math.floor(S.t)+'|'+S.rships.length+'|'+Object.keys(S.wars).join()+'|'+((S.rfare&&S.rfare[rk])||1);if(RP_CACHE[rk]&&RP_CACHE[rk].k===k)return RP_CACHE[rk].v;const v=routeStats(rk,m).rivalPax;RP_CACHE[rk]={k,v};return v;}
function ownersOn(rk){const o={};for(const x of S.rships)if(x.route===rk)o[x.owner]=(o[x.owner]||0)+1;return o;}
function topRival(rk){const o=ownersOn(rk);const k=Object.keys(o).sort((a,b)=>o[b]*RIVAL_P[b].aggr-o[a]*RIVAL_P[a].aggr)[0];return k||(RIVAL_START[rk]||[]).map(q=>q[0]).find(coAlive)||coLive()[0];}
function routeAggr(rk){const o=ownersOn(rk);let w=0,a=0;for(const k in o){w+=o[k];a+=o[k]*RIVAL_P[k].aggr;}return w?a/w:0.6;}
function pressure(rk,fares,ourPax,n,m){
  // weighted by each class's trade, as the rivals' matching is, so dear cabins cannot hide cheap steerage (0.35.5)
  const R0=ROUTES[rk];let sum=0,w=0;for(const c of watchCL(rk)){sum+=R0.base[c]*Math.min(1.1,(fares[c]||R0.ref[c])/R0.ref[c]);w+=R0.base[c];}
  const ratio=w?sum/w:1,rp=rivalPax(rk,m),share=ourPax/Math.max(1,ourPax+rp);
  const p=(Math.max(0,0.97-ratio)*250+Math.max(0,share-0.2)*150+Math.max(0,n-1)*6)*routeAggr(rk);
  return {p:clamp(p,0,100),share,ratio,rp};
}
const tensionWord=t=>t<40?'Calm':t<65?'Uneasy':'Hostile';

/* ---------- the rivals' monthly decisions ---------- */
function rivalMove(o,rk,kind,ship,to){
  S.rmoves.unshift({m:S.m,o,rk,kind,ship,to});if(S.rmoves.length>40)S.rmoves.length=40;
  const n=RIVALS[o].name,R=ROUTES[rk].name,mine=!!S.lines[rk];
  if(kind==='add')news(`${n} puts the new SS ${ship} on ${R}.${mine?' Expect thinner loads.':''}`,mine?'bad':'');
  if(kind==='move')news(`${n} moves SS ${ship} from ${R} to ${ROUTES[to].name}.`,S.lines[to]?'bad':mine?'good':'');
  if(kind==='retire')news(`${n} sends the old SS ${ship} to the breakers.${mine?' Less competition on '+R+'.':''}`,mine?'good':'');
  if(kind==='sold'&&mine)news(`${n} has sold SS ${ship} off ${R} to raise money.`,'good');
}
/* the rival lines' month: fares, then each company's accounts and decisions (companies.js), then new lines */
function rivalsMonth(){
  const m=S.m,R=Math.random;RW_CACHE.k=null;
  // price matching: where the Morven Line undercuts, the route's fare level follows it down over a few months
  S.rfare=S.rfare||{};
  for(const rk in ROUTES){const cur=S.rfare[rk]||1,act=S.lines[rk]&&S.ships.some(x=>x.line===rk&&ACTIVE.includes(x.state));
    const ratio=act?ourFareRatio(rk):1,sl=1-0.12*slump(m),target=Math.min(sl,act&&ratio<0.97?Math.max(0.68,ratio+0.04):1);
    const next=cur+(target-cur)*(target<cur?0.25*routeAggr(rk):0.2);
    if(cur>=0.95&&next<0.95&&act&&ratio<0.97)news(`Rival lines on ${ROUTES[rk].name} are cutting their fares to match yours.`,'bad');
    S.rfare[rk]=next;}
  // a ship on a closed trade moves to an open one of the same kind from the same port, or lies where she is: no more
  // monthly news of ships moving from one closed trade to another (0.35.7)
  for(const x of S.rships)if(!routeOpen(x.route,m)){const cr=isCruise(x.route),p0=ROUTES[x.route].calls[0];
    const to=Object.keys(ROUTES).find(k=>k!==x.route&&routeOpen(k,m)&&isCruise(k)===cr&&ROUTES[k].calls[0]===p0)||(cr&&routeOpen('cwi',m)&&x.route!=='cwi'?'cwi':null);
    if(to){rivalMove(x.owner,x.route,'move',x.name,to);x.route=to;}}
  // ships ordered earlier come into service; a line that has failed meanwhile loses its order
  if(S.rorders&&S.rorders.length){const due=S.rorders.filter(q=>q.at<=m);S.rorders=S.rorders.filter(q=>q.at>m);
    for(const q of due){if(!coAlive(q.o)||!routeOpen(q.rk,m))continue;if(typeof mkKeepRoute==='function'){q.rk=mkKeepRoute(q.o,q.rk);q.sh.route=q.rk;}S.rships.push(q.sh);newRivalVis(q.sh);rivalMove(q.o,q.rk,'add',q.sh.name);}}
  const stats={};for(const rk in ROUTES)stats[rk]=routeStats(rk,m);
  S.lastRivalPax={};for(const rk in ROUTES)S.lastRivalPax[rk]=Math.round(stats[rk].rivalPax);
  outsideMonth(stats); // the rivals pay for any spare capacity the Morven Line sells them
  const relOf=(o,k)=>{const q=stats[k].owners[o];return q?q.load/Math.max(0.05,S.load0[k]*seasonNorm(k,m)):0;};
  for(const o of coLive()){
    const P=RIVAL_P[o],co=S.rivals[o];
    coAccounts(o,stats);
    const routes=Object.keys(ROUTES).filter(rk=>stats[rk].owners[o]);
    for(const rk of routes)stats[rk].owners[o].rel=relOf(o,rk);
    // grow where loads are strong, more eagerly where the Morven Line is taking share, if the money is there
    for(const rk of routes){const st=stats[rk].owners[o],ourShare=stats[rk].ours.pax/Math.max(1,stats[rk].total);
      const fight=ourShare>0.3&&R()<0.08*P.aggr*(coShare(o)>0.35?0.3:1); // answer an interloper with tonnage (a giant leaves it to its smaller lines)
      const sh0=coFleet(o).reduce((a,x)=>a+x.grt,0)/Math.max(1,S.rships.reduce((a,x)=>a+x.grt,0)),big=sh0<=0.2?1:Math.max(0.05,1-(sh0-0.2)*5); // the biggest lines grow more slowly: their bankers and the conference hold them back
      if((S.rorders||[]).some(q=>q.o===o&&q.rk===rk)||atWar(m))continue; // one ship on order for a trade at a time; none in the war
      if(co.keepOff&&S.lines[rk])continue; // a line the Morven Line controls keeps off its trades
      // in the emigrant years the lines add tonnage later: they wait for the ships to run well above their usual loads
      const grow=newCal()&&m<ym(1914,7)?1.2:1.12;
      if(fight||(st.rel>grow&&coProfit(o)>0&&R()<(0.16*P.aggr+(ourShare>0.25?0.1:0))*big)){
        // a new ship takes ten months to a year and a half to build (half a year for a ship bought to fight), so a sudden boom
        // leaves the trade short of berths for a while
        const lead=fight?6:10+Math.floor(R()*9);
        const sh=makeRivalShip(o,rk,Math.floor(yearOfM(m+lead))),era=Math.max(0,(m-ym(1930,0))/12);sh.knots=+(P.knots[1]-Math.random()+Math.min(5,era*0.15)+shipEraKnots(sh.built)).toFixed(1);if(era>0){sh.grt=Math.round(sh.grt*(1+Math.min(0.5,era*0.02))/100)*100;}
        const price=coNewPrice(sh);if(!coCanPay(o,price,fight))continue;
        coPay(o,price);(S.rorders=S.rorders||[]).push({o,rk,at:m+lead,sh});break;}}
    // retreat from weak routes
    for(const rk of routes){const st=stats[rk].owners[o];
      // incumbents hold their home trades: they only give ground below their starting fleet when the money runs out
      const home=(RIVAL_START[rk]||[]).find(q=>q[0]===o),floor=home?Math.ceil(home[1]*0.75):0;
      if(st.ships<=floor&&!coShort(o))continue;
      if(co.born!==undefined&&m-co.born<18&&!coShort(o))continue; // a new line gives its first trade a year and a half
      if(st.rel<0.72&&st.ships>0&&R()<0.3){
        const ships=S.rships.filter(x=>x.route===rk&&x.owner===o).sort((a,b)=>a.built-b.built),x=ships[0];
        const alt=Object.keys(ROUTES).filter(k=>k!==rk&&stats[k].owners[o]&&stats[k].owners[o].rel>1.0&&!(S.rivals[o].keepOff&&S.lines[k])).sort((a,b)=>stats[b].owners[o].rel-stats[a].owners[o].rel)[0];
        if(alt&&ships.length>0&&(ships.length>1||R()<0.5)){x.route=alt;rivalMove(o,rk,'move',x.name,alt);}
        else if(ships.length>1&&!atWar(m)){dropRival(x);if(coAge(x)<20){co.cash+=coShipVal(x)*0.75;rivalMove(o,rk,'sold',x.name);}else{co.cash+=coScrap(x);rivalMove(o,rk,'retire',x.name);}} // a young ship is sold abroad, an old one broken up
        break;}}
    // old ships go to the breakers
    for(const x of S.rships.filter(y=>y.owner===o&&yearOfM(m)-y.built>32)){if(R()<0.08){dropRival(x);co.cash+=coScrap(x);rivalMove(o,x.route,'retire',x.name);}}
    // after the armistice the lines break up the worn-out tonnage the war kept at sea (0.34)
    if(newCal()&&m>ARMISTICE&&m<M21&&!/German/.test((RIVALS[o]||{}).flag||''))for(const x of S.rships.filter(y=>y.owner===o&&yearOfM(m)-y.built>25)){if(R()<0.05){dropRival(x);co.cash+=coScrap(x);rivalMove(o,x.route,'retire',x.name);}}
    if(m%12===0&&coAlive(o))coYearEnd(o);
    coFinance(o,stats);
  }
  coEntrants(stats);RW_CACHE.k=null; // ships moved, sold, built or scrapped: weigh them afresh
}
/* seasonal demand now, relative to the reference month used for load0 (July 1921) */
function seasonNorm(rk,m){const r=ROUTES[rk];let a=0,b=0;for(const c of ['f','s','t','tt']){if(c==='tt'&&!r.cruise)continue;a+=r.base[c]*seasonOf(rk,c,m);b+=r.base[c]*seasonOf(rk,c,6);}return a/b;} // season only: quotas and booms register as real change
/* ---------- where each rival ship physically is (visual only: the market uses sailings, not positions) ---------- */
const jr=k=>{let h=7;for(const c of String(k))h=(h*31+c.charCodeAt(0))|0;return ((h>>>0)%1000)/1000;};
function initVis(x){const gk=geoKey(x.route,S.m),d=GEO(gk).dist,out=x.phase<0.5,[A,B]=geoEnds(gk);
  return x.v={gk,dir:out?0:1,pos:(out?x.phase*2:x.phase*2-1)*d,wait:0,port:out?A:B,repo:null};}
function newRivalVis(x){const gk=geoKey(x.route,S.m),[A]=geoEnds(gk);x.v={gk,dir:0,pos:0,wait:2+jr(x.id)*3,port:A,repo:null};}
/* a ship that leaves a route's market (sold, scrapped, withdrawn) keeps sailing to the next port before she goes */
function dropRival(x){RW_CACHE.k=null;S.rships=S.rships.filter(y=>y!==x);const v=x.v;if(v&&!(v.wait>0))(S.ghosts=S.ghosts||[]).push({id:x.id,name:x.name,owner:x.owner,knots:x.knots,v});}
function startRivalLeg(x,route){const v=x.v,gk=geoKey(route,S.m),[A,B]=geoEnds(gk);
  if(v.port===A||v.port===B){v.gk=gk;v.dir=v.port===A?0:1;v.pos=0;}
  else v.repo={to:laneDist(v.port,A)<=laneDist(v.port,B)?A:B,pos:0};}
function stepVis(x,route,step){
  const v=x.v||initVis(x);
  if(v.wait>0){v.wait-=step;if(v.wait>0)return true;if(!route)return false;startRivalLeg(x,route);return true;}
  const sp=x.knots*24*step;
  if(v.repo){v.repo.pos+=sp;if(v.repo.pos>=laneDist(v.port,v.repo.to)){v.port=v.repo.to;v.repo=null;v.wait=0.5;if(!route)return false;}return true;}
  v.pos+=sp;const d=GEO(v.gk).dist;
  if(v.pos>=d){v.port=geoEnds(v.gk)[v.dir===0?1:0];v.pos=d;v.wait=TURN_DAYS*(0.7+0.6*jr(x.id+Math.floor(S.t-D21)));if(!route)return false;}
  return true;
}
function rivalPos(x){const v=x.v||initVis(x);
  if(v.wait>0){const [px,py]=CHART.ports[v.port];return {x:px,y:py,ang:0,inPort:true};}
  if(v.repo)return pointOn(trackBetween(v.port,v.repo.to),v.repo.pos);
  const d=GEO(v.gk).dist;return pointOn(CHART.routes[v.gk],v.dir===0?v.pos:d-v.pos,v.dir===1);}
function moveRivals(step){for(const x of S.rships){if(warRivalF(x.owner,S.m)===0&&x.v&&x.v.wait>0){x.v.wait=Math.max(x.v.wait,1);continue;}stepVis(x,x.route,step);}if(S.ghosts&&S.ghosts.length)S.ghosts=S.ghosts.filter(g=>stepVis(g,null,step));}
