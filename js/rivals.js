/* ================= RIVALS ================= */
/* Rival lines are real companies: fleets on routes, cash, and a monthly mind of their own.
   Each route has one shared market per class and direction. Every ship on the route, ours or theirs,
   takes a slice in proportion to berths x crossings per month x appeal. */
const MKT_LOAD=0.78; // rival fleets start the game this full in third class (the market is sized from it)
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
    names:['Vesuvio','Capri','Sorrento','Amalfi','Ischia','Procida','Posillipo','Positano']}
};
const RIVAL_START={hal:[['dominion',3],['imperial',1]],lha:[['dominion',4],['imperial',2]],
  liv:[['imperial',5],['nordmark',3],['columbia',2]],gny:[['imperial',2],['columbia',2]],nap:[['partenope',4],['columbia',1]]};

function makeRivalShip(o,rk,built){
  const P=RIVAL_P[o],used=new Set(S.rships.filter(x=>x.owner===o).map(x=>x.name));
  const nm=P.names.find(n=>!used.has(n))||P.names[Math.floor(Math.random()*P.names.length)]+' II';
  const grt=Math.round((P.grt[0]+Math.random()*(P.grt[1]-P.grt[0]))/100)*100;
  const knots=+(P.knots[0]+Math.random()*(P.knots[1]-P.knots[0])).toFixed(1);
  return {id:'r'+(S.rnext++),owner:o,name:nm,route:rk,grt,knots,built:built||Math.round(1898+Math.random()*22),
    berths:{f:Math.round(grt/80),s:Math.round(grt/45),t:Math.round(grt/13)},cargo:Math.round(grt/4),phase:Math.random()};
}
function initRivals(){
  S.rships=[];S.rnext=1;S.rivals={};S.rmoves=[];S.lastRivalPax={};
  for(const o in RIVAL_P)S.rivals[o]={cash:RIVAL_P[o].cash};
  for(const rk in RIVAL_START)for(const [o,n] of RIVAL_START[rk])for(let i=0;i<n;i++)S.rships.push(makeRivalShip(o,rk));
  S.mkt={};
  for(const rk in ROUTES){let cap=0;for(const x of S.rships)if(x.route===rk)cap+=x.berths.t*sailings(x.knots,rk);S.mkt[rk]=MKT_LOAD*cap/(ROUTES[rk].base.t*DIRW.t);}
  // each route's normal load at the start, so rivals judge trade against what is usual for that route
  S.load0={};for(const rk in ROUTES){const st=routeStats(rk,6);let p=0,c=0;for(const o in st.owners){p+=st.owners[o].pax;c+=st.owners[o].cap;}S.load0[rk]=c?p/c:0.5;}
}

/* ---------- market maths ---------- */
const sailings=(knots,rk,sm=1)=>30/(2*ROUTES[rk].dist/(knots*sm*24)+8); // round trips per month
function marketM(rk,c,dir,m){const r=ROUTES[rk];return S.mkt[rk]*r.base[c]*(dir===0?DIRW[c]:1-DIRW[c])*SEASON[c][m%12]*histMod(c,rk,m);}
function rivalBerths(x,c){if(c==='tt')return S.m>=48?Math.round(x.berths.t*0.25):0;if(c==='t'&&S.m>=48)return Math.round(x.berths.t*0.75);return x.berths[c];}
function rivalAppeal(o,rk,c){
  const f=rivalFare(o,rk);
  return clamp(Math.pow(1/f,E[c]),0.03,1.8)*RIVAL_P[o].prestige;
}
/* rivals' fare level on a route, as a multiple of the line rate: their own pricing, price matching, and any rate war */
function rivalFare(o,rk){const war=S.wars[rk];return (S.rivalIdx[o]||1)*((S.rfare&&S.rfare[rk])||1)*(war?war.mult:1);}
function ourFareRatio(rk){const r=ROUTES[rk];let a=0,b=0;for(const c of ['f','s','t']){a+=r.base[c]*effFare(rk,c)/r.ref[c];b+=r.base[c];}return a/b;}
function ourAppeal(sh,rk,c){
  const L=S.lines[rk],r=ROUTES[rk];
  const pf=clamp(Math.pow(r.ref[c]/effFare(rk,c),E[c]),0.03,1.8);
  return pf*repF(c,S.rep,r)*SERV[c][L.service]*SPD_D[c][sh.speed]*ADV_MULT[L.adv]*(S.conf&&c==='t'?1.04:1);
}
function rivalWeight(rk,c,owner){let a=0;for(const x of S.rships)if(x.route===rk&&(!owner||x.owner===owner)){const b=rivalBerths(x,c);if(b)a+=b*sailings(x.knots,rk)*rivalAppeal(x.owner,rk,c);}return a;}
function ourWeight(rk,c,exclude){let a=0;if(!S.lines[rk])return 0;
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state)&&sh.berths[c])a+=sh.berths[c]*sailings(sh.knots,rk,SPD[sh.speed])*ourAppeal(sh,rk,c);return a;}
function cargoWeight(rk,exclude){let a=0;for(const x of S.rships)if(x.route===rk)a+=x.cargo*sailings(x.knots,rk);
  for(const sh of S.ships)if(sh!==exclude&&sh.line===rk&&ACTIVE.includes(sh.state))a+=sh.cargo*sailings(sh.knots,rk,SPD[sh.speed]);return a;}
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
      let cap=0;for(const sh of S.ships)if(sh.line===rk&&ACTIVE.includes(sh.state))cap+=(sh.berths[c]||0)*sailings(sh.knots,rk,SPD[sh.speed]);
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
    const ratio=act?ourFareRatio(rk):1,target=act&&ratio<0.97?Math.max(0.68,ratio+0.04):1;
    const next=cur+(target-cur)*(target<cur?0.25*routeAggr(rk):0.2);
    if(cur>=0.95&&next<0.95)news(`Rival lines on ${ROUTES[rk].name} are cutting their fares to match yours.`,'bad');
    S.rfare[rk]=next;}
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
      if(st.rel>1.12&&co.cash>260000&&R()<0.16*P.aggr+(ourShare>0.25?0.1:0)){
        const sh=makeRivalShip(o,rk,1921+Math.floor(m/12));sh.knots=+(P.knots[1]-Math.random()).toFixed(1);S.rships.push(sh);co.cash-=220000;rivalMove(o,rk,'add',sh.name);break;}}
    // retreat from weak routes
    for(const rk of routes){const st=stats[rk].owners[o];
      if(st.rel<0.72&&st.ships>0&&R()<0.3){
        const ships=S.rships.filter(x=>x.route===rk&&x.owner===o).sort((a,b)=>a.built-b.built),x=ships[0];
        const relOf=k=>{const q=stats[k].owners[o];return q?q.load/Math.max(0.05,S.load0[k]*seasonNorm(k,m)):0;};
        const alt=Object.keys(ROUTES).filter(k=>k!==rk&&stats[k].owners[o]&&relOf(k)>1.0).sort((a,b)=>relOf(b)-relOf(a))[0];
        if(alt&&ships.length>0&&(ships.length>1||R()<0.5)){x.route=alt;rivalMove(o,rk,'move',x.name,alt);}
        else if(ships.length>1){S.rships=S.rships.filter(y=>y!==x);co.cash+=x.grt*2;rivalMove(o,rk,'retire',x.name);}
        break;}}
    // old ships go to the breakers
    for(const x of S.rships.filter(y=>y.owner===o&&1921+m/12-y.built>32)){if(R()<0.08){S.rships=S.rships.filter(y=>y!==x);rivalMove(o,x.route,'retire',x.name);}}
    // insolvency: sell a third of the fleet, one of them cheap to the Morven Line's brokers
    if(co.cash<-150000){
      const fleet=S.rships.filter(y=>y.owner===o).sort((a,b)=>a.built-b.built),sell=fleet.slice(0,Math.max(1,Math.floor(fleet.length/3)));
      S.rships=S.rships.filter(y=>!sell.includes(y));co.cash=100000;
      news(`${RIVALS[o].name} is in financial trouble and is selling ${sell.length} ship${sell.length>1?'s':''}.`,'good',true);
      const x=sell[sell.length-1];
      const t={name:x.name,built:x.built,grt:x.grt,knots:x.knots,berths:{f:x.berths.f,s:x.berths.s,t:x.berths.t,tt:0},cargo:x.cargo,fuel:'coal',base:x.grt*26,note:`Ex-${RIVALS[o].name}, sold cheaply by the receivers.`};
      const sh=makeShip(t,55+Math.random()*20,['GLA','LIV','NAP'][Math.floor(Math.random()*3)]);sh.price=Math.round(shipValue(sh)*0.7/100)*100;S.market.push(sh);
    }
  }
}
/* seasonal demand now, relative to the reference month used for load0 (July 1921) */
function seasonNorm(rk,m){const r=ROUTES[rk];let a=0,b=0;for(const c of ['f','s','t']){a+=r.base[c]*SEASON[c][m%12];b+=r.base[c]*SEASON[c][6];}return a/b;} // season only: quotas and booms register as real change
function moveRivals(step){for(const x of S.rships)x.phase=(x.phase+step*sailings(x.knots,x.route)/30)%1;}
