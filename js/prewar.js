/* ================= SPEED AND SPLENDOUR, 1907 TO 1913 ================= */
/* The peak of the emigrant trade and the race for size and speed, on the 1900 calendar only:
   - 1907: Imperial Atlantic's turbine express twins and Nordmark's fast liner race for the Blue Riband.
   - October 1907: the banking panic, through the panic system in economy.js (the fall in emigration is already in the
     immigration figures, so the panic's own cut to demand is small; the called loans and a failing bank are the danger).
   - 1908: more emigrants go home than come; the North Atlantic conference forms (trust.js opens membership).
   - 1908 to 1912: the great lines order giants of 45,000 tons and more, in service 1911 to 1913.
   - June 1911: the seamen's strike holds ships in the home ports; March 1912: the national coal strike, when bunker coal
     costs two or three times its price and liners are laid up. A bunker contract keeps its price through the strike.
   - The Blue Riband: the fastest ship on the Atlantic brings her line prestige. */

/* the ships the great lines build to race, and the giants: when ordered, when in service, for which line and trade.
   If the line has failed by then, the order passes to the strongest British liner line. */
const PREWAR_SHIPS=[
  {o:'nordmark',rk:'ham',name:'Nordstern',grt:24500,knots:23.5,berths:{f:600,s:350,t:1600},cargo:4000,order:ym(1905,3),at:ym(1907,2),kind:'express'},
  {o:'imperial',rk:'liv',name:'Invicta',grt:31500,knots:25,berths:{f:560,s:460,t:1200},cargo:1500,order:ym(1905,6),at:ym(1907,8),kind:'express'},
  {o:'imperial',rk:'liv',name:'Indomita',grt:31900,knots:25.2,berths:{f:560,s:460,t:1200},cargo:1500,order:ym(1905,6),at:ym(1907,10),kind:'express'},
  {o:'imperial',rk:'exp',name:'Atlantean',grt:45300,knots:21,berths:{f:735,s:675,t:1030},cargo:3500,order:ym(1908,6),at:ym(1911,5),kind:'giant'},
  {o:'imperial',rk:'exp',name:'Hyperborean',grt:46300,knots:21,berths:{f:740,s:680,t:1030},cargo:3500,order:ym(1908,6),at:ym(1912,2),kind:'giant'},
  {o:'aurore',rk:'exp',name:'Provence Royale',grt:23700,knots:23.5,berths:{f:530,s:440,t:800},cargo:2000,order:ym(1909,9),at:ym(1912,3),kind:'express'},
  {o:'nordmark',rk:'ham',name:'Weltmeer',grt:52100,knots:23,berths:{f:900,s:600,t:2600},cargo:4000,order:ym(1910,5),at:ym(1913,5),kind:'giant'}
];
const PREWAR_NAME={express:'express liner',giant:'giant'};
/* who takes over an order when its line has gone */
function prewarOwner(o){if(coAlive(o))return o;return coLive().filter(k=>!RIVAL_P[k].kind).sort((a,b)=>coWorth(b)-coWorth(a))[0]||null;}

function prewarMonth(){
  if(!newCal())return;
  const m=S.m;S.prewar=S.prewar||{ordered:{},done:{}};const P=S.prewar;
  // orders for the racers and the giants: paid for when ordered, in service when built
  for(const q of PREWAR_SHIPS){
    if(m===q.order&&!P.ordered[q.name]){const o=prewarOwner(q.o);if(!o)continue;P.ordered[q.name]=o;
      const price=Math.round(q.grt*CO_PRICE*PX()*(q.kind==='express'?2:1.3)/1000)*1000;coPay(o,price);
      const twin=PREWAR_SHIPS.find(z=>z!==q&&z.order===q.order&&z.o===q.o);
      if(!twin||PREWAR_SHIPS.indexOf(twin)>PREWAR_SHIPS.indexOf(q))news(`${RIVALS[o].name} orders ${twin?`two ${PREWAR_NAME[q.kind]}s`:`a new ${PREWAR_NAME[q.kind]}`}: ${twin?`SS ${q.name} and SS ${twin.name}`:`SS ${q.name}`}, ${int(q.grt)} tons and ${q.knots} knots, for ${ROUTES[q.rk].name}${q.kind==='giant'?'. Nothing so big has ever been built':''}.`,S.lines[q.rk]?'bad':'');}
    if(m===q.at&&P.ordered[q.name]&&!P.done[q.name]){const o=prewarOwner(P.ordered[q.name]);P.done[q.name]=true;if(!o)continue;
      const nm=o===q.o?q.name:(RIVAL_P[o].names.find(n=>!nameTaken(n))||freshName(q.name)); // a line that takes over the order names her itself
      const x={id:'r'+(S.rnext++),owner:o,name:nm,route:q.rk,grt:q.grt,knots:q.knots,built:Math.floor(yearOfM(m)),berths:{...q.berths},cargo:q.cargo,reefer:false,phase:Math.random(),kind:q.kind};
      S.rships.push(x);newRivalVis(x);RW_CACHE.k=null;S.rmoves.unshift({m,o,rk:q.rk,kind:'add',ship:nm});
      news(`${RIVALS[o].name}'s SS ${nm} sails on her maiden voyage on ${ROUTES[q.rk].name}: ${int(q.grt)} tons, ${q.knots} knots${q.kind==='giant'?', the largest ship in the world':''}.${S.lines[q.rk]?' Your cabin trade there will feel it.':''}`,S.lines[q.rk]?'bad':'',true);}}
  // the October panic of 1907 (the rumours start in September)
  if(m===ym(1907,8)&&!S.crash){const bank=Math.random()<0.25;
    S.crash={stage:'rumour',m0:m,bank,panicAt:ym(1907,9),depth:0.12,rec:15,y1907:true};
    news(bank?`Wall Street is shaky, and there are whispers in the City that ${BANK_NAME} is overextended. Some owners are moving their money into government stock.`:'Wall Street is shaky: the trust companies in New York are in trouble and the banks are calling in loans. Cautious owners are paying down debt.','bad',true);}
  // the seamen's strike of June 1911, and the national coal strike of March 1912
  if(m===ym(1911,5)&&!S.strike){const d=18+Math.floor(Math.random()*10);S.strike={until:S.t+d};
    news('The seamen and firemen are out in every British port. Ships in the home ports cannot sail until the owners settle.','bad',true);}
  // the Blue Riband: the fastest ship on the North Atlantic
  blueRiband();
}
/* the national coal strike: bunker coal from February to May 1912, as a multiple of its price */
const coalStrike=m=>m===ym(1912,1)?1.3:m===ym(1912,2)?2.4:m===ym(1912,3)?2.2:m===ym(1912,4)?1.4:1;
/* a bunker contract keeps its coal through the strikes: the contracted price, not the strike price */
const bunkerHeld=()=>!!(S.shore&&S.shore.bunker&&S.shore.bunker.until>=S.m);

/* the Blue Riband: held by the fastest ship in service on a North Atlantic trade, from 22 knots up */
function blueRiband(){
  const na=rk=>ROUTES[rk].group==='North Atlantic';let best=null;
  for(const x of S.rships)if(na(x.route)&&x.knots>=22&&(!best||x.knots>best.knots))best={name:x.name,knots:x.knots,o:x.owner};
  for(const x of S.ships)if(x.line&&na(x.line)&&(ACTIVE.includes(x.state)||x.state==='yard')){const k=knotsOf(x); // a holder in dry dock keeps it (0.37.2)
    if(k>=22&&(!best||k>best.knots))best={name:x.name,knots:+k.toFixed(1),o:'morven'};}
  const prev=S.riband;if(!best){S.riband=null;return;}
  if(!prev||prev.name!==best.name){S.riband=best;
    if(prev)news(best.o==='morven'?`SS ${best.name} takes the Blue Riband for the Morven Line at ${best.knots} knots. The newspapers are full of her.`:`${RIVALS[best.o]?RIVALS[best.o].name:'A rival line'}'s SS ${best.name} takes the Blue Riband at ${best.knots} knots${prev.o==='morven'?' from the Morven Line':''}.`,best.o==='morven'?'good':prev.o==='morven'?'bad':'',best.o==='morven'||prev.o==='morven');}
}
/* the prestige of holding it: reputation drifts towards a higher mark while the Line holds it */
const ribandRep=()=>S.riband&&S.riband.o==='morven'?5:0;

/* ---------- the Admiralty's terms for fast ships (from 1903) ----------
   A ship of 24 knots and 20,000 tons or more, built to naval standards (5% dearer), qualifies: the Admiralty lends two
   thirds of each stage payment at 2.75%, repaid over twenty years, and pays a yearly subsidy of 4.5% of her price. In
   return she must be available as an armed merchant cruiser in war (the war years come in 0.26) and her loan is repaid
   before she can be sold. */
const ADM_FROM=ym(1903,6),ADM_RATE=0.0275,ADM_TERM=240,ADM_SUB=0.045;
const admEligible=d=>newCal()&&S.m>=ADM_FROM&&d.knots>=24&&d.grt>=20000&&!['elbe','liguria'].includes(d.builder); // built in a British yard, as the 1903 agreement required (0.35.4)
/* the Line's debt to the Admiralty, on ships in service and on the stocks */
const admDebt=()=>S.ships.reduce((a,x)=>a+(x.adm?x.adm.bal:0),0)+(S.orders||[]).reduce((a,o)=>a+(o.admBal||0),0);
/* each month: the loan's interest and a twentieth-of-a-year of its principal, and the subsidy */
function admMonth(){
  for(const sh of S.ships){const a=sh.adm;if(!a||sh.state==='lost')continue;
    if(a.bal>0){const pr=Math.min(a.bal,a.bal0/ADM_TERM),int=a.bal*ADM_RATE/12;a.bal-=pr;S.cash-=pr;book('interest',-int,sh.line,sh);}
    if((ACTIVE.includes(sh.state)&&sh.line)||sh.state==='yard')book('subsidy',a.sub,sh.line,sh);} // paid while she sails, not laid up (0.35.4)
}
/* before she leaves the fleet her Admiralty loan is paid off out of what she fetches */
function admRepay(sh){const a=sh.adm;if(!a||a.bal<=0)return 0;const p=a.bal;S.cash-=p;a.bal=0;return p;}
