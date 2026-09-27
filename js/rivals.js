/* ================= RIVALS ================= */
/* Rival lines are real companies: fleets on routes, cash, and a monthly mind of their own.
   Each route has one shared market per class and direction. Every ship on the route, ours or theirs,
   takes a slice in proportion to berths x crossings per month x appeal. */
const MKT_LOAD=0.62,CARGO_LOAD=0.75; // rival fleets start the game this full in third class (the market is sized from it)
const RIVAL_P={
  imperial:{prestige:1.15,aggr:1.2,cash:900000,col:'#8C2F2F',knots:[15,19],grt:[11000,19000],
    names:['Albionic','Cambrian Star','Northumbrian','Aurelian','Valentia','Orcadian','Mercian','Hibernian','Wessexian','Lothian','Dalriadan','Brigantian','Silurian','Pictavian','Cornubian','Demetian','Iceni','Atrebatic','Belgavian','Novantian']},
  nordmark:{prestige:1.05,aggr:1.0,cash:400000,col:'#4A4F55',knots:[15,18],grt:[10000,16000],
    names:['Weserland','Elbstern','Friesland','Holstein','Nordlicht','Havelberg','Stralsund','Dithmarschen','Vierlande','Lüneburg','Altmark','Uckermark','Wendland']},
  columbia:{prestige:0.88,aggr:0.7,cash:300000,col:'#2E4E7A',knots:[14,17],grt:[9000,14000],
    names:['Chesapeake','Old Dominion','Liberty Bell','Columbian','Shenandoah','Potomac','Allegheny','Susquehanna']},
  dominion:{prestige:1.0,aggr:0.8,cash:500000,col:'#8A5A1E',knots:[14,17],grt:[9000,15000],
    names:['Acadian Star','Fundy','Manitoban','Saguenay','Ottawa Queen','Assiniboine','Gaspé','Mistassini','Nipigon','Kamouraska','Témiscouata','Chaleur','Tadoussac']},
  partenope:{prestige:0.95,aggr:0.9,cash:350000,col:'#2E6A4A',knots:[14,17],grt:[8000,13000],
    names:['Vesuvio','Capri','Sorrento','Amalfi','Ischia','Procida','Posillipo','Positano']},
  aurore:{prestige:1.25,aggr:1.0,cash:700000,col:'#3B4F8F',knots:[16,21],grt:[12000,24000],kind:'liner',
    names:['Val de Loire','Aquitaine','Côte d\'Argent','Saintonge','Vendée','Limousin','Touraine','Anjou','Berry']},
  antilles:{prestige:0.95,aggr:0.8,cash:400000,col:'#B8860B',knots:[14,16],grt:[4000,7000],kind:'fruit',
    names:['Montego','Port Antonio','Blue Mountain','Ocho Rios','Manchioneal','Lucea','Annotto','Savanna']},
  guinea:{prestige:0.9,aggr:0.9,cash:500000,col:'#556B2F',knots:[11,14],grt:[5000,9000],kind:'mixed',
    names:['Sherbro','Calabar','Bonny','Accra','Cape Palmas','Opobo','Lokoja','Badagry']},
  pampas:{prestige:1.05,aggr:1.0,cash:600000,col:'#8B3A62',knots:[13,16],grt:[8000,14000],kind:'plate',
    names:['Pampero','Estancia','Rosario','Tucumán','Mendoza','Paraná','Córdoba','Salado','Tandil']},
  meridian:{prestige:1.0,aggr:0.6,cash:450000,col:'#5C7C8A',knots:[14,16],grt:[8000,14000],kind:'cruise',
    names:['Arcadia Star','Meridiana','Azure Isle','Southern Cross','Halcyon','Alcina','Belvedere','Solent Star','Caravel','Serenade','Coral Queen','Mirabelle']},
  gulf:{prestige:0.8,aggr:0.8,cash:350000,col:'#6B5B45',knots:[10,13],grt:[5000,8000],kind:'cargo',
    names:['Brazos','Sabine','Atchafalaya','Calcasieu','Trinity','Neches','Pearl','Mobile']}
};
const RIVAL_START={hal:[['dominion',3],['imperial',1]],lha:[['dominion',4],['imperial',2]],
  liv:[['imperial',5],['nordmark',3],['columbia',2]],gny:[['imperial',2],['columbia',2]],nap:[['partenope',4],['columbia',1]],
  stl:[['dominion',3],['imperial',1]],exp:[['imperial',3],['aurore',3],['nordmark',1]],ham:[['nordmark',4],['imperial',1]],
  cot:[['gulf',5]],ban:[['antilles',5]],waf:[['guinea',5]],rpl:[['pampas',4],['nordmark',2]],
  cwi:[['meridian',2]],cmd:[['meridian',2]],cfj:[['meridian',1]],cwx:[['meridian',2]],cnw:[['meridian',2]]};
/* berths and holds by type of ship: liners, cargo steamers, fruit ships, West Africa mixed ships, River Plate refrigerated liners */
const RIVAL_KIND={
  liner:g=>({berths:{f:g/80,s:g/45,t:g/13},cargo:g/4,reefer:false}),
  cargo:g=>({berths:{f:g/500,s:0,t:0},cargo:g*1.5,reefer:false}),
  fruit:g=>({berths:{f:g/100,s:g/200,t:0},cargo:g*0.6,reefer:true}),
  mixed:g=>({berths:{f:g/110,s:g/150,t:g/90},cargo:g*0.9,reefer:false}),
  plate:g=>({berths:{f:g/90,s:g/60,t:g/16},cargo:g*0.5,reefer:true}),
  cruise:g=>({berths:{f:g/40,s:g/70,t:g/35},cargo:0,reefer:false}) // her 'third' is sold as tourist cabins on a cruise
};

function makeRivalShip(o,rk,built){
  const P=RIVAL_P[o],used=new Set(S.rships.filter(x=>x.owner===o).map(x=>x.name));
  const nm=P.names.find(n=>!used.has(n))||P.names[Math.floor(Math.random()*P.names.length)]+' II';
  const grt=Math.round((P.grt[0]+Math.random()*(P.grt[1]-P.grt[0]))/100)*100;
  const knots=+(P.knots[0]+Math.random()*(P.knots[1]-P.knots[0])).toFixed(1);
  const K=RIVAL_KIND[P.kind||'liner'](grt);
  return {id:'r'+(S.rnext++),owner:o,name:nm,route:rk,grt,knots,built:built||Math.round(1898+Math.random()*22),
    berths:{f:Math.round(K.berths.f),s:Math.round(K.berths.s),t:Math.round(K.berths.t)},cargo:Math.round(K.cargo),reefer:K.reefer,phase:Math.random()};
}
function initRivals(){
  S.rships=[];S.rnext=1;S.rivals={};S.rmoves=[];S.lastRivalPax={};S.mkt={};S.cmkt={};S.load0={};
  ensureRivals();
}
/* add rivals, markets and norms for any route or rival line the save does not have yet (new games and old saves alike) */
function ensureRivals(){
  S.rships=S.rships||[];S.rnext=S.rnext||1;S.rivals=S.rivals||{};S.rmoves=S.rmoves||[];S.lastRivalPax=S.lastRivalPax||{};S.mkt=S.mkt||{};S.cmkt=S.cmkt||{};S.load0=S.load0||{};
  for(const o in RIVAL_P)if(!S.rivals[o])S.rivals[o]={cash:RIVAL_P[o].cash};
  for(const x of S.rships)if(x.reefer===undefined)x.reefer=false;
  for(const rk in S.mkt)if(typeof S.mkt[rk]==='number')marketFor(rk); // 0.3 saves: one number per route becomes one per class
  for(const rk in RIVAL_START){if(S.mkt[rk]!==undefined)continue;
    for(const [o,n] of RIVAL_START[rk])for(let i=0;i<n;i++)S.rships.push(makeRivalShip(o,rk));
    marketFor(rk);}
  for(const rk in ROUTES)if(S.cmkt[rk]===undefined){let cc=0;for(const x of S.rships)if(x.route===rk)cc+=x.cargo*sailings(x.knots,rk);const r=ROUTES[rk];S.cmkt[rk]=CARGO_LOAD*cc/Math.max(1,r.cargo.out.t,r.cargo.home.t);}
}
/* size a route's passenger market from the rival fleet on it, so they start MKT_LOAD full in the busy direction */
function marketFor(rk){
  // each class is sized from rival capacity in that class, so rivals start MKT_LOAD full in its busy direction
  const r=ROUTES[rk];S.mkt[rk]={};
  for(const c of CL){let cap=0;for(const x of S.rships)if(x.route===rk)cap+=(r.cruise?rivalBerths(x,c):c==='tt'?x.berths.t*0.25:x.berths[c])*sailings(x.knots,rk);
    const dem=r.base[c]*Math.max(dirW(rk,c),1-dirW(rk,c));S.mkt[rk][c]=dem>0?MKT_LOAD*(r.mload||1)*cap/dem:0;}
  let cc=0;for(const x of S.rships)if(x.route===rk)cc+=x.cargo*sailings(x.knots,rk);S.cmkt[rk]=CARGO_LOAD*cc/Math.max(1,r.cargo.out.t,r.cargo.home.t);
  // the route's normal load, so rivals judge trade against what is usual for that route
  const st=routeStats(rk,6);let p=0,c=0;for(const o in st.owners){p+=st.owners[o].pax;c+=st.owners[o].cap;}S.load0[rk]=c?p/c:0.5;
}

/* ---------- market maths ---------- */
const turnPair=rk=>{const c=ROUTES[rk].cruise;return c?c.turn+(c.home!==undefined?c.home:TURN_DAYS):2*TURN_DAYS;};
const sailings=(knots,rk,sm=1)=>{const r=ROUTES[rk];return 30/(2*r.dist/(knots*sm*24)+turnPair(rk)+(r.cruise?1:2)*(r.calls.length-2)*CALL_DAYS);}; // round trips per month
function marketM(rk,c,dir,m){const r=ROUTES[rk];if(!routeOpen(rk,m))return 0;return S.mkt[rk][c]*r.base[c]*(dir===0?dirW(rk,c):1-dirW(rk,c))*seasonOf(rk,c,m)*histMod(c,rk,m);}
function rivalBerths(x,c){if(isCruise(x.route)){const st=ROUTES[x.route].cruise.steerage;return c==='tt'?(st?0:x.berths.t):c==='t'?(st?x.berths.t:0):x.berths[c];}if(c==='tt')return S.m>=48?Math.round(x.berths.t*0.25):0;if(c==='t'&&S.m>=48)return Math.round(x.berths.t*0.75);return x.berths[c];}
/* speed sells cabins, above all on prestige routes: an old 14-knot steamer cannot hold first class against 20-knot giants */
const speedAppeal=(knots,rk,c)=>{const p=ROUTES[rk].prestige,k=(c==='f'||c==='s')?Math.max(0,(p-0.8)*1.8):Math.max(0,(p-0.8)*0.4);return Math.pow(knots/16,k);};
/* how fares move demand. Below the line rate a cut wins passengers at the usual rate; above it they walk to the next
   line's office far more readily, since the same crossing is on sale for less a few doors down. The kink is what
   holds everyone near the conference rate. */
const fareDemand=(ratio,c)=>clamp(Math.pow(ratio,ratio>=1?E[c]:E[c]*2.6),0.03,1.8);
function rivalAppeal(o,rk,c,x){
  const f=rivalFare(o,rk);
  return fareDemand(1/f,c)*RIVAL_P[o].prestige*(x?speedAppeal(x.knots,rk,c):1);
}
/* rivals' fare level on a route, as a multiple of the line rate: their own pricing, price matching, and any rate war */
function rivalFare(o,rk){const war=S.wars[rk];return (S.rivalIdx[o]||1)*((S.rfare&&S.rfare[rk])||1)*(war?war.mult:1);}
function ourFareRatio(rk){const r=ROUTES[rk];let a=0,b=0;for(const c of ['f','s','t']){a+=r.base[c]*effFare(rk,c)/r.ref[c];b+=r.base[c];}return a/b;}
function ourAppeal(sh,rk,c){
  const L=S.lines[rk],r=ROUTES[rk];
  const pf=fareDemand(r.ref[c]/effFare(rk,c),c);
  const mods=shipMods(sh);
  return pf*repF(c,S.rep,r)*SERV[c][L.service]*SPD_D[c][sh.speed]*ADV_MULT[L.adv]*(S.conf&&c==='t'?1.04:1)*(c==='f'||c==='s'?mods.appealFS:mods.appealT)*shoreMult(rk,c)*speedAppeal(knotsOf(sh)*SPD[sh.speed]*mods.speed,rk,c)*(sh.up&&sh.up.aircon&&TROPIC.includes(rk)&&(c==='f'||c==='s')?1.06:1)*(r.cruise?(sh.cruiser?1.25:1):1)*(1-(c==='f'||c==='s'?0.08:0.03)*seaSev(sh,rk,S.m))*facAppeal(sh,c,rk);
}
const TROPIC=['cot','ban','waf','rpl','nap'];
/* booking agencies in a region the route calls at, and emigrant hostels at its ports */
function shoreMult(rk,c){
  if(!S.shore)return 1;const calls=ROUTES[rk].calls;let x=1;
  for(const a in S.shore.agents)if(AGENCY[a].ports.some(p=>calls.includes(p)))x*=(c==='t'||c==='tt')?1.07:1.03;
  if((c==='t'||c==='tt')&&calls.some(p=>S.shore.hostels[p]))x*=1.05;
  return x;
}
function rivalWeight(rk,c,owner){let a=0;for(const x of S.rships)if(x.route===rk&&(!owner||x.owner===owner)){const b=rivalBerths(x,c);if(b)a+=b*sailings(x.knots,rk)*rivalAppeal(x.owner,rk,c,x);}return a;}
function ourWeight(rk,c,exclude){let a=0;if(!S.lines[rk])return 0;
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state)&&sh.berths[c])a+=sh.berths[c]*sailings(knotsOf(sh),rk,SPD[sh.speed])*ourAppeal(sh,rk,c);return a;}
function cargoWeight(rk,exclude,reefer){let a=0;for(const x of S.rships)if(x.route===rk)a+=x.cargo*sailings(x.knots,rk)*(reefer&&!x.reefer?0.15:1);
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state))a+=sh.cargo*sailings(knotsOf(sh),rk,SPD[sh.speed])*(reefer&&!(sh.up&&sh.up.reefer)?0.15:1);return a;}
/* Monthly passengers on a route, split between us and each rival line (estimate for the current month). */
function routeStats(rk,m){
  const owners={},ours={pax:0,cap:0};
  for(const x of S.rships)if(x.route===rk){const o=owners[x.owner]=owners[x.owner]||{ships:0,pax:0,cap:0};o.ships++;}
  for(const c of ['f','s','t','tt']){
    const rw={};let tot=ourWeight(rk,c);for(const o in owners){rw[o]=rivalWeight(rk,c,o);tot+=rw[o];}
    if(tot<=0)continue;
    const ow=ourWeight(rk,c);
    for(const dir of [0,1]){
      const M=marketM(rk,c,dir,m);
      for(const o in owners){let cap=0;for(const x of S.rships)if(x.route===rk&&x.owner===o)cap+=rivalBerths(x,c)*sailings(x.knots,rk);
        owners[o].pax+=Math.min(cap,M*rw[o]/tot);owners[o].cap+=cap;}
      let cap=0;for(const sh of S.ships)if(sh.line===rk&&ACTIVE.includes(sh.state))cap+=(sh.berths[c]||0)*sailings(knotsOf(sh),rk,SPD[sh.speed]);
      ours.pax+=Math.min(cap,M*ow/tot);ours.cap+=cap;
    }
  }
  let rivalPax=0;for(const o in owners){owners[o].load=owners[o].cap?owners[o].pax/owners[o].cap:0;rivalPax+=owners[o].pax;}
  return {owners,ours,rivalPax,total:rivalPax+ours.pax};
}
const RP_CACHE={};
function rivalPax(rk,m){const k=rk+'|'+m+'|'+Math.floor(S.t)+'|'+S.rships.length+'|'+Object.keys(S.wars).join()+'|'+((S.rfare&&S.rfare[rk])||1);if(RP_CACHE[rk]&&RP_CACHE[rk].k===k)return RP_CACHE[rk].v;const v=routeStats(rk,m).rivalPax;RP_CACHE[rk]={k,v};return v;}
function ownersOn(rk){const o={};for(const x of S.rships)if(x.route===rk)o[x.owner]=(o[x.owner]||0)+1;return o;}
function topRival(rk){const o=ownersOn(rk);const k=Object.keys(o).sort((a,b)=>o[b]*RIVAL_P[b].aggr-o[a]*RIVAL_P[a].aggr)[0];return k||RIVAL_START[rk][0][0];}
function routeAggr(rk){const o=ownersOn(rk);let w=0,a=0;for(const k in o){w+=o[k];a+=o[k]*RIVAL_P[k].aggr;}return w?a/w:0.6;}
function pressure(rk,fares,ourPax,n,m){
  let sum=0;for(const c of ['f','s','t'])sum+=fares[c]/ROUTES[rk].ref[c];
  const ratio=sum/3,rp=rivalPax(rk,m),share=ourPax/Math.max(1,ourPax+rp);
  const p=(Math.max(0,0.97-ratio)*250+Math.max(0,share-0.2)*150+Math.max(0,n-1)*6)*routeAggr(rk);
  return {p:clamp(p,0,100),share,ratio,rp};
}
const tensionWord=t=>t<40?'Calm':t<65?'Uneasy':'Hostile';
const rivalHealth=c=>c>600000?'Flush':c>250000?'Comfortable':c>50000?'Stretched':'Struggling';

/* ---------- the rivals' monthly decisions ---------- */
function rivalMove(o,rk,kind,ship,to){
  S.rmoves.unshift({m:S.m,o,rk,kind,ship,to});if(S.rmoves.length>40)S.rmoves.length=40;
  const n=RIVALS[o].name,R=ROUTES[rk].name,mine=!!S.lines[rk];
  if(kind==='add')news(`${n} puts the new SS ${ship} on ${R}.${mine?' Expect thinner loads.':''}`,mine?'bad':'');
  if(kind==='move')news(`${n} moves SS ${ship} from ${R} to ${ROUTES[to].name}.`,S.lines[to]?'bad':mine?'good':'');
  if(kind==='retire')news(`${n} sends the old SS ${ship} to the breakers.${mine?' Less competition on '+R+'.':''}`,mine?'good':'');
}
function rivalsMonth(){
  const m=S.m,R=Math.random;
  // price matching: where the Morven Line undercuts, the route's fare level follows it down over a few months
  S.rfare=S.rfare||{};
  for(const rk in ROUTES){const cur=S.rfare[rk]||1,act=S.lines[rk]&&S.ships.some(x=>x.line===rk&&ACTIVE.includes(x.state));
    const ratio=act?ourFareRatio(rk):1,sl=1-0.12*slump(m),target=Math.min(sl,act&&ratio<0.97?Math.max(0.68,ratio+0.04):1);
    const next=cur+(target-cur)*(target<cur?0.25*routeAggr(rk):0.2);
    if(cur>=0.95&&next<0.95&&act&&ratio<0.97)news(`Rival lines on ${ROUTES[rk].name} are cutting their fares to match yours.`,'bad');
    S.rfare[rk]=next;}
  for(const x of S.rships)if(!routeOpen(x.route,m)){const to=Object.keys(ROUTES).find(k=>isCruise(k)&&routeOpen(k,m)&&k!==x.route&&ROUTES[k].calls[0]===ROUTES[x.route].calls[0])||'cwi';rivalMove(x.owner,x.route,'move',x.name,to);x.route=to;}
  const stats={};for(const rk in ROUTES)stats[rk]=routeStats(rk,m);
  S.lastRivalPax={};for(const rk in ROUTES)S.lastRivalPax[rk]=Math.round(stats[rk].rivalPax);
  for(const o in RIVAL_P){
    const P=RIVAL_P[o],co=S.rivals[o];
    // earnings: a ship makes money above about 60% loads; rate wars cost the participants
    for(const rk in ROUTES){const st=stats[rk].owners[o];if(!st)continue;
      st.rel=st.load/Math.max(0.05,S.load0[rk]*seasonNorm(rk,m));
      let per=0;for(const x of S.rships)if(x.route===rk&&x.owner===o)per+=(st.rel-0.85)*x.grt*1.2;
      co.cash+=per;if(S.wars[rk])co.cash-=st.ships*2500;}
    const routes=Object.keys(ROUTES).filter(rk=>stats[rk].owners[o]);
    // grow where loads are strong, more eagerly where the Morven Line is taking share
    for(const rk of routes){const st=stats[rk].owners[o],ourShare=stats[rk].ours.pax/Math.max(1,stats[rk].total);
      const fight=ourShare>0.3&&co.cash>180000&&R()<0.08*P.aggr; // answer an interloper with tonnage
      if(fight||(st.rel>1.12&&co.cash>260000&&R()<0.16*P.aggr+(ourShare>0.25?0.1:0))){
        const sh=makeRivalShip(o,rk,1921+Math.floor(m/12)),era=Math.max(0,(m-108)/12);sh.knots=+(P.knots[1]-Math.random()+Math.min(5,era*0.15)).toFixed(1);if(era>0){sh.grt=Math.round(sh.grt*(1+Math.min(0.5,era*0.02))/100)*100;}S.rships.push(sh);newRivalVis(sh);co.cash-=220000;rivalMove(o,rk,'add',sh.name);break;}}
    // retreat from weak routes
    for(const rk of routes){const st=stats[rk].owners[o];
      // incumbents hold their home trades: they only give ground below their starting fleet when the money runs out
      const home=(RIVAL_START[rk]||[]).find(q=>q[0]===o),floor=home?Math.ceil(home[1]*0.75):0;
      if(st.ships<=floor&&co.cash>50000)continue;
      if(st.rel<0.72&&st.ships>0&&R()<0.3){
        const ships=S.rships.filter(x=>x.route===rk&&x.owner===o).sort((a,b)=>a.built-b.built),x=ships[0];
        const relOf=k=>{const q=stats[k].owners[o];return q?q.load/Math.max(0.05,S.load0[k]*seasonNorm(k,m)):0;};
        const alt=Object.keys(ROUTES).filter(k=>k!==rk&&stats[k].owners[o]&&relOf(k)>1.0).sort((a,b)=>relOf(b)-relOf(a))[0];
        if(alt&&ships.length>0&&(ships.length>1||R()<0.5)){x.route=alt;rivalMove(o,rk,'move',x.name,alt);}
        else if(ships.length>1){dropRival(x);co.cash+=x.grt*2;rivalMove(o,rk,'retire',x.name);}
        break;}}
    // old ships go to the breakers
    for(const x of S.rships.filter(y=>y.owner===o&&1921+m/12-y.built>32)){if(R()<0.08){dropRival(x);rivalMove(o,x.route,'retire',x.name);}}
    // insolvency: sell a third of the fleet, one of them cheap to the Morven Line's brokers
    if(co.cash<-150000){
      const fleet=S.rships.filter(y=>y.owner===o).sort((a,b)=>a.built-b.built),sell=fleet.slice(0,Math.max(1,Math.floor(fleet.length/3)));
      sell.forEach(dropRival);co.cash=100000;
      news(`${RIVALS[o].name} is in financial trouble and is selling ${sell.length} ship${sell.length>1?'s':''}.`,'good',true);
      const x=sell[sell.length-1];
      const t={name:x.name,built:x.built,grt:x.grt,knots:x.knots,berths:{f:x.berths.f,s:x.berths.s,t:x.berths.t,tt:0},cargo:x.cargo,fuel:'coal',base:x.grt*26,note:`Ex-${RIVALS[o].name}, sold cheaply by the receivers.`};
      t.reefer=x.reefer;const sh=makeShip(t,55+Math.random()*20,['GLA','LIV','NAP'][Math.floor(Math.random()*3)]);sh.price=Math.round(shipValue(sh)*0.7/100)*100;sh.bargain=true;sh.listed=S.m;S.market.push(sh);
    }
  }
}
/* seasonal demand now, relative to the reference month used for load0 (July 1921) */
function seasonNorm(rk,m){const r=ROUTES[rk];let a=0,b=0;for(const c of ['f','s','t','tt']){if(c==='tt'&&!r.cruise)continue;a+=r.base[c]*seasonOf(rk,c,m);b+=r.base[c]*seasonOf(rk,c,6);}return a/b;} // season only: quotas and booms register as real change
/* ---------- where each rival ship physically is (visual only: the market uses sailings, not positions) ---------- */
const jr=k=>{let h=7;for(const c of String(k))h=(h*31+c.charCodeAt(0))|0;return ((h>>>0)%1000)/1000;};
function initVis(x){const gk=geoKey(x.route,S.m),d=GEO(gk).dist,out=x.phase<0.5,[A,B]=geoEnds(gk);
  return x.v={gk,dir:out?0:1,pos:(out?x.phase*2:x.phase*2-1)*d,wait:0,port:out?A:B,repo:null};}
function newRivalVis(x){const gk=geoKey(x.route,S.m),[A]=geoEnds(gk);x.v={gk,dir:0,pos:0,wait:2+jr(x.id)*3,port:A,repo:null};}
/* a ship that leaves a route's market (sold, scrapped, withdrawn) keeps sailing to the next port before she goes */
function dropRival(x){S.rships=S.rships.filter(y=>y!==x);const v=x.v;if(v&&!(v.wait>0))(S.ghosts=S.ghosts||[]).push({id:x.id,name:x.name,owner:x.owner,knots:x.knots,v});}
function startRivalLeg(x,route){const v=x.v,gk=geoKey(route,S.m),[A,B]=geoEnds(gk);
  if(v.port===A||v.port===B){v.gk=gk;v.dir=v.port===A?0:1;v.pos=0;}
  else v.repo={to:laneDist(v.port,A)<=laneDist(v.port,B)?A:B,pos:0};}
function stepVis(x,route,step){
  const v=x.v||initVis(x);
  if(v.wait>0){v.wait-=step;if(v.wait>0)return true;if(!route)return false;startRivalLeg(x,route);return true;}
  const sp=x.knots*24*step;
  if(v.repo){v.repo.pos+=sp;if(v.repo.pos>=laneDist(v.port,v.repo.to)){v.port=v.repo.to;v.repo=null;v.wait=0.5;if(!route)return false;}return true;}
  v.pos+=sp;const d=GEO(v.gk).dist;
  if(v.pos>=d){v.port=geoEnds(v.gk)[v.dir===0?1:0];v.pos=d;v.wait=TURN_DAYS*(0.7+0.6*jr(x.id+Math.floor(S.t)));if(!route)return false;}
  return true;
}
function rivalPos(x){const v=x.v||initVis(x);
  if(v.wait>0){const [px,py]=CHART.ports[v.port];return {x:px,y:py,ang:0,inPort:true};}
  if(v.repo)return pointOn(trackBetween(v.port,v.repo.to),v.repo.pos);
  const d=GEO(v.gk).dist;return pointOn(CHART.routes[v.gk],v.dir===0?v.pos:d-v.pos,v.dir===1);}
function moveRivals(step){for(const x of S.rships)stepVis(x,x.route,step);if(S.ghosts&&S.ghosts.length)S.ghosts=S.ghosts.filter(g=>stepVis(g,null,step));}
