/* ================= ADVICE: Mr Ferguson and the head-office departments ================= */
/* Every suggestion names the department it belongs to. Advice is free; a department you have bought can also act on
   its own suggestions each month (within a cash reserve), and reports what it did in the news. */
function withTemp(sh,rk,patch,shPatch,fn){
  const had=!!S.lines[rk];if(!had)S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};
  const L=S.lines[rk],saved={fares:L.fares,service:L.service,adv:L.adv},ss={};
  if(patch){if(patch.fares)L.fares={...L.fares,...patch.fares};if(patch.service!==undefined)L.service=patch.service;if(patch.adv!==undefined)L.adv=patch.adv;}
  if(shPatch)for(const k in shPatch){ss[k]=sh[k];sh[k]=shPatch[k];}
  try{return fn();}finally{L.fares=saved.fares;L.service=saved.service;L.adv=saved.adv;for(const k in ss)sh[k]=ss[k];if(!had)delete S.lines[rk];}
}
/* a ship's expected monthly result on a route this month, at current settings (patches try alternatives) */
function econ(sh,rk,patch,shPatch){
  return withTemp(sh,rk,patch,shPatch,()=>{
    const L=S.lines[rk],w=legCalc(sh,rk,0,null),e=legCalc(sh,rk,1,null),rt=w.seaDays+e.seaDays+2*TURN_DAYS;
    const legNet=l=>l.paxRev+l.cargoRev+l.mail-l.fuelC-l.prov-l.agents-l.port;
    const n=Math.max(1,shipsOn(rk).length);
    const fixed=(crewCost(sh)+(sh.captain?sh.captain.wage:0)+insCost(sh)+MAINT_COST[sh.maint]*sh.grt/8000)*rt/30;
    const pax=CL.reduce((a,c)=>a+(w.pax[c]?w.pax[c].n:0)+(e.pax[c]?e.pax[c].n:0),0)*30/rt;
    return {pm:(legNet(w)+legNet(e)-fixed)*30/rt-ADV_COST[L.adv]/n,rev:(w.paxRev+e.paxRev+w.cargoRev+e.cargoRev+w.mail+e.mail)*30/rt,
      fuel:(w.fuelC+e.fuelC)*30/rt,rt,w,e,pax};
  });
}
/* the same averaged over the coming year (four seasons), for decisions that last */
function econYear(sh,rk,patch,shPatch){
  const t0=S.t;let pm=0,k=0;
  try{for(const q of [0,3,6,9]){const m=S.m+q;S.t=(Date.UTC(1921+Math.floor(m/12),m%12,15)-T0)/864e5;pm+=econ(sh,rk,patch,shPatch).pm;k++;}}
  finally{S.t=t0;}
  return {pm:pm/k};
}
const lineShips=rk=>S.ships.filter(x=>x.line===rk&&x.state!=='laid');
function lineEcon(rk,patch){let pm=0,pax=0;for(const sh of lineShips(rk)){const q=econ(sh,rk,patch);pm+=q.pm;pax+=q.pax;}return {pm,pax};}
const WINTER=[10,11,0,1];
const money=v=>fmt(Math.round(v/10)*10);
const canSpend=cost=>S.cash-cost>=3*runningCost();
const idleCost=sh=>0.25*crewCost(sh)+(sh.captain?sh.captain.wage:0)+insCost(sh);
const DEPT_OF={review:'sec',reserve:'sec',buy:'sec','rep-mail':'sec','rep-low':'sec','conf-war':'sec',pier:'sec',agency:'sec',bunker:'sec',dept:'sec',
  fare:'fares',tension:'fares',adv:'fares',service:'fares',match:'fares',
  move:'traffic',unlay:'traffic',layup:'traffic',sell:'traffic',rin:'traffic',
  speed:'marine',maint:'marine',thresh:'marine',oil:'marine',refurb:'marine',reefer:'marine',wireless:'marine',
  pay:'crew',captain:'crew'};
const deptOf=h=>DEPT_OF[h.id.split(/[:0-9]/)[0]]||'sec';
let ADV_CACHE={key:null,list:[]};
function advice(){
  const key=S.m+'|'+UI.rev;
  if(ADV_CACHE.key===key)return ADV_CACHE.list;
  const A=[],mo=S.m%12,reserve=3*runningCost();
  const add=h=>{if((S.dismiss[h.id]||-1)>=S.m)return;h.dept=deptOf(h);A.push(h);};
  // ---- last month review ----
  const LM=S.lastMonth;
  if(LM&&LM.net<0){
    const c=LM.cat,rev=(c.fares||0)+(c.cargo||0)+(c.mail||0);
    const costs=CATS.filter(([k])=>(c[k]||0)<0).map(([k,l])=>[l,-c[k]]).sort((a,b)=>b[1]-a[1]).slice(0,2);
    const lm=LM.m%12,winter=WINTER.includes(lm);
    const worst=Object.keys(LM.lines).filter(k=>ROUTES[k]).sort((a,b)=>LM.lines[a]-LM.lines[b])[0];
    add({id:'review'+LM.m,scope:'co',sev:'bad',gain:1e6,title:`${MONTHS[lm]} lost ${money(-LM.net)}`,
      why:`${costs.map(([l,v])=>`${l} took ${rev>0?Math.round(v/rev*100)+'% of revenue':money(v)}`).join(', ')}.${worst&&LM.lines[worst]<0?` ${ROUTES[worst].name} was the weakest line at ${money(LM.lines[worst])}.`:''}${winter?' Winter is the slack season: first class runs at about half its summer level, so some winter losses are normal. The question is whether summer covers them.':''}${S.m>=106&&S.m<160?' The Depression is hitting every line; laying up ships that cannot pay their way is how the survivors got through it.':''}`,act:[]});
  }
  // ---- lines: fares, tension, advertising and service ----
  for(const rk of Object.keys(S.lines)){
    const r=ROUTES[rk],L=S.lines[rk],ships=lineShips(rk);if(!ships.length)continue;
    const base=lineEcon(rk),t=S.tension[rk]||0,n=ships.filter(x=>ACTIVE.includes(x.state)).length||1;
    const nextT=f=>{const q=lineEcon(rk,{fares:f});return t+(pressure(rk,{...L.fares,...f},q.pax,n,S.m).p-t)*0.35;};
    const curNext=S.conf?0:nextT({});
    for(const c of CL){
      if(!ships.some(s=>s.berths[c]))continue;
      const ref=r.ref[c],lo=S.conf?confFloor(rk,c):Math.round(ref*0.6),hi=Math.round(ref*1.6),step=Math.max(1,Math.round(ref*0.05));
      let best={f:L.fares[c],pm:base.pm,tn:curNext};
      for(let f=lo;f<=hi;f+=step){if(f===L.fares[c])continue;
        const q=lineEcon(rk,{fares:{[c]:f}});if(q.pm<=best.pm+1)continue;
        const tn=S.conf||c==='tt'?0:nextT({[c]:f});
        if(!S.conf&&tn>=40&&f<L.fares[c])continue; // never advise a cut that risks a rate war
        best={f,pm:q.pm,tn};}
      const gain=best.pm-base.pm;
      if(best.f!==L.fares[c]&&gain>=120){
        const up=best.f>L.fares[c],ld=L.last[0]&&L.last[0].pax[c];
        add({id:`fare:${rk}:${c}`,scope:'line',ref:rk,sev:'tip',gain,
          title:`${up?'Raise':'Cut'} ${CL_NAME[c]} to £${best.f} on ${r.name}`,
          why:up?`${ld&&ld.n>=ld.cap*0.95?'Your '+CL_NAME[c].toLowerCase()+' berths are selling out, so you are turning passengers away. ':''}The market will bear more than £${L.fares[c]}.`
                :`${ld?`Only ${ld.n} of ${ld.cap} ${CL_NAME[c].toLowerCase()} berths sold outbound last time. `:''}At £${L.fares[c]} against a line rate of £${ref}, you are pricing passengers off your ships.`,
          act:[[`Set £${best.f}`,'setfare',rk,c,best.f]]});
      }
    }
    if(!S.conf&&!S.wars[rk]&&curNext>=40){
      let fix=null;for(let k=1;k<=12&&!fix;k++){const f={};for(const c of ['f','s','t'])f[c]=Math.max(L.fares[c],Math.round(r.ref[c]*(0.94+k*0.02)));if(nextT(f)<40)fix=f;}
      add({id:`tension:${rk}`,scope:'line',ref:rk,sev:'warn',gain:5e5,title:`Calm the conference on ${r.name}`,
        why:`Tension will be about ${Math.round(curNext)} next month, and above 40 a rate war can break out, cutting rival fares by a quarter for months. Your fares below the line rate${ships.length>1?' and your extra ships':''} are what provoke them.${fix?` Fares of £${fix.f} / £${fix.s} / £${fix.t} would bring it back under 40.`:' Consider joining the conference, or accept the risk.'}`,
        act:fix?[['Set those fares','setfares',rk,fix.f,fix.s,fix.t]]:[['Conference','tabgo','company']]});
    }
    for(const k of ['adv','service']){
      let best={v:L[k],pm:base.pm};
      for(const v of k==='adv'?[0,1,2,3]:[0,1,2]){if(v===L[k])continue;const q=lineEcon(rk,{[k]:v});if(q.pm>best.pm)best={v,pm:q.pm};}
      const gain=best.pm-base.pm;
      if(best.v!==L[k]&&gain>=150){
        const nm=k==='adv'?['no advertising','£300 advertising','£800 advertising','£1,500 advertising'][best.v]:['a Spartan table','a Standard table','a Lavish table'][best.v];
        add({id:`${k}:${rk}`,scope:'line',ref:rk,sev:'tip',gain,title:`Try ${nm} on ${r.name}`,
          why:k==='adv'?(best.v>L.adv?'More advertising would fill enough extra berths to pay for itself.':'Your advertising costs more than the extra passengers it brings.')
            :(best.v===2?'Lavish service fills first class and builds reputation.':best.v===0?'A Spartan table saves money, but it lowers your standing, and standing is what first class buys.':'Standard service balances cost and reputation better here.'),
          act:[['Apply','setlineopt',rk,k,best.v]]});
      }
    }
    if(S.rfare&&S.rfare[rk]<0.95&&!S.conf)
      add({id:`match:${rk}`,scope:'line',ref:rk,sev:'tip',gain:220,title:`Rivals have matched your fares on ${r.name}`,
        why:`Their fares are down to ${Math.round(S.rfare[rk]*100)}% of the line rate. Your cut no longer wins you passengers; it just lowers everyone's income. Raising fares back towards the line rate lets the whole route recover.`,act:[['View line','selline',rk]]});
  }
  // ---- ships: deployment, upkeep, upgrades, crew ----
  for(const sh of S.ships){
    const r0=sh.line;
    if(sh.state==='laid'){
      let best=null;for(const rk of Object.keys(ROUTES)){const q=econYear(sh,rk);if(!best||q.pm>best.pm)best={rk,pm:q.pm};}
      const idleC=idleCost(sh),val=Math.round(shipValue(sh)*0.9);
      if(best&&best.pm<0&&S.ships.length>1&&!sh.pendingExit)add({id:`sell:${sh.id}:${S.m}`,scope:'ship',ref:sh.id,sev:'warn',gain:idleC+val*0.065/12,
        title:`Sell SS ${sh.name}`,
        why:`Even laid up she costs ${money(idleC)} a month, and no route would pay her way over the coming year. Selling her raises about ${money(val)}${S.debt>0?', which could pay down the mortgage and its interest':''}. Ships are cheap in a slump, so you may be selling low.`,
        act:[['Sell her','sellship',sh.id]]});
      if(best&&best.pm>0&&!WINTER.slice(0,3).includes(mo))add({id:`unlay:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:best.pm,title:`Put SS ${sh.name} back to work`,
        why:`Laid up she still costs wages and insurance. On ${ROUTES[best.rk].name} she would earn about ${money(best.pm)} a month over the coming year${!S.lines[best.rk]?' (that line is not open yet)':''}.${mo>=1&&mo<=3?' Spring bookings are picking up.':''}`,
        act:S.lines[best.rk]?[['Assign','moveship',sh.id,best.rk]]:[['View line','selline',best.rk]]});
      continue;
    }
    if(!r0||sh.state==='yard')continue;
    const cur=econ(sh,r0),curY=econYear(sh,r0);
    let best=null;for(const rk of Object.keys(ROUTES)){if(rk===r0)continue;const q=econYear(sh,rk);if(!best||q.pm>best.pm)best={rk,pm:q.pm};}
    if(best&&best.pm-curY.pm>=300)add({id:`move:${sh.id}:${best.rk}`,scope:'ship',ref:sh.id,sev:'tip',gain:best.pm-curY.pm,
      title:`Move SS ${sh.name} to ${ROUTES[best.rk].name}`,
      why:`Averaged over the coming year she would make about ${money(best.pm)} a month there, against ${money(curY.pm)} on ${ROUTES[r0].name}, at current fares.${!S.lines[best.rk]?' You would need to open that line first (£2,500).':''} Check conference tension there before you commit.`,
      act:S.lines[best.rk]?[['Move her','moveship',sh.id,best.rk]]:[['View line','selline',best.rk]]});
    const idle=idleCost(sh),bestY=best?Math.max(best.pm,curY.pm):curY.pm;
    if(S.ships.length>1&&bestY<-idle-150)add({id:`layup:${sh.id}:${S.m}`,scope:'ship',ref:sh.id,sev:'warn',gain:-idle-curY.pm,
      title:`Lay SS ${sh.name} up until trade recovers`,
      why:`Averaged over the coming year she would lose about ${money(-curY.pm)} a month on ${ROUTES[r0].name}, and no other route does better. Laid up on a skeleton crew she would cost only ${money(idle)}.`,
      act:[['Lay up at next port','moveship',sh.id,'']]});
    else if(WINTER.includes(mo)&&cur.pm<-idle-150&&S.ships.length>1)add({id:`layup:${sh.id}:${S.m}`,scope:'ship',ref:sh.id,sev:'tip',gain:-idle-cur.pm,
      title:`Lay SS ${sh.name} up for the winter`,
      why:`She is losing about ${money(-cur.pm)} a month in the winter trade. Laid up on a skeleton crew she would cost only ${money(idle)}. Bring her back in March.`,
      act:[['Lay up at next port','moveship',sh.id,'']]});
    let bs={v:sh.speed,pm:curY.pm};for(const v of [0,1,2]){if(v===sh.speed)continue;const q=econYear(sh,r0,null,{speed:v});if(q.pm>bs.pm)bs={v,pm:q.pm};}
    if(bs.v!==sh.speed&&bs.pm-curY.pm>=150&&!(S.mail[r0]&&bs.v===0))add({id:`speed:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:bs.pm-curY.pm,
      title:`Run SS ${sh.name} at ${['economical','service','full'][bs.v]} speed`,
      why:bs.v===0?'Coal consumption rises with the cube of speed. Over a year, slowing down saves more in bunkers than it costs in crossings.':bs.v===2?'Over a year, the extra crossings and first class appeal outweigh the extra coal, though she wears faster.':'Over a year, her current speed is costing more than it earns.',
      act:[['Apply','setship',sh.id,'speed',bs.v]]});
    if(sh.maint===0)add({id:`maint:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:400,title:`SS ${sh.name} has no maintenance`,
      why:`At ${Math.floor(yearNow()-sh.built)} years old she loses condition every crossing, and nothing slows it. Routine maintenance (${money(MAINT_COST[1]*sh.grt/8000)} a month) postpones costly drydocks and breakdowns.`,
      act:[['Set routine','setship',sh.id,'maint',1]]});
    if(!sh.autoDock&&sh.cond<60)add({id:`thresh:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:450,title:`SS ${sh.name} has no service threshold`,
      why:`She is at ${Math.round(sh.cond)}% and falling. A threshold sends her to drydock automatically before breakdowns get frequent.`,act:[['Use 50%','setship',sh.id,'autoDock',50]]});
    // yard work that pays for itself, judged over a year and only if the reserve can bear it
    const yard=(k,shPatch,label,why)=>{if(sh.pendingYard)return;const cost=refitCost(sh,k);if(!canSpend(cost))return;
      const save=econYear(sh,r0,null,shPatch).pm-curY.pm;if(save>0&&cost/save<=30)add({id:`${k==='oil'?'oil':k}:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:save,title:label,
        why:`${why} It would add about ${money(save)} a month and pay back its ${money(cost)} in about ${Math.ceil(cost/save)} months; she is out of service for ${yardDays(sh,k)} days.`,
        act:[['Book it','setyard',sh.id,k]]});};
    if(sh.fuel==='coal'&&yearNow()-sh.built<28)yard('oil',{fuel:'oil'},`Convert SS ${sh.name} to oil`,'Oil firing cuts her stokehold crew and her bunker bill.');
    if((sh.berths.f+sh.berths.s)>0&&(sh.fit||0)<50)yard('refurb',{fit:100},`Refurbish SS ${sh.name}`,`Her saloons are tired (fittings ${Math.round(sh.fit||0)}%), and first and second class notice.`);
    if(!(sh.up&&sh.up.reefer)&&COMM[ROUTES[r0].cargo.home.c].reefer)yard('reefer',{up:{...sh.up,reefer:true}},`Fit refrigerated holds to SS ${sh.name}`,`Her route's homeward cargo, ${COMM[ROUTES[r0].cargo.home.c].name.toLowerCase()}, needs cold holds; without them she takes only a sliver of it.`);
    if(!(sh.up&&sh.up.wireless)&&(S.mail[r0]||S.rep>=35)&&canSpend(refitCost(sh,'wireless'))&&!sh.pendingYard)
      add({id:`wireless:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:150,title:`Fit wireless to SS ${sh.name}`,
        why:`Only ships with wireless can carry the mails${S.mail[r0]?', and this route has a contract':''}. It also brings help faster when she breaks down. ${money(refitCost(sh,'wireless'))} and a week in the yard.`,
        act:[['Book it','setyard',sh.id,'wireless']]});
    if((sh.morale||60)<45&&(sh.pay===undefined?1:sh.pay)<2)
      add({id:`pay:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:350,title:`Raise pay on SS ${sh.name}`,
        why:`Her crew's morale is ${Math.round(sh.morale)}. Unhappy crews desert in foreign ports, walk off at home and give poor service. Better pay costs about ${money(crewCost(sh)*0.15)} a month.`,
        act:[['Raise pay','setship',sh.id,'pay',(sh.pay===undefined?1:sh.pay)+1]]});
    const bad=sh.captain&&(has(sh,'drinker')||has(sh,'lax')||sh.captain.exp<4);
    if(bad&&S.capPool&&S.capPool.length){const pick=S.capPool.slice().sort((a,b)=>capScore(b)-capScore(a))[0];
      if(capScore(pick)>capScore(sh.captain)+1)add({id:`captain:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:300,title:`Replace ${sh.captain.name} on SS ${sh.name}`,
        why:`${sh.captain.name} is ${sh.captain.traits.map(t=>CAPT_TRAITS[t].name.toLowerCase()).join(' and ')||'inexperienced'}. ${pick.name} (${pick.exp} years in command${pick.traits.length?', '+pick.traits.map(t=>CAPT_TRAITS[t].name.toLowerCase()).join(', '):''}) is available at £${pick.wage} a month.`,
        act:[['Appoint him','hire',sh.id,pick.id]]});}
  }
  // ---- rivals ----
  for(const q of S.rmoves.filter(q=>q.m>=S.m-1&&q.kind==='add'&&S.lines[q.rk]))
    add({id:`rin:${q.rk}:${q.ship}`,scope:'line',ref:q.rk,sev:'warn',gain:250,title:`${RIVALS[q.o].name} has added SS ${q.ship} to ${ROUTES[q.rk].name}`,
      why:'More rival berths on the route means a smaller slice for each of your ships, especially in steerage. Consider a better table or more advertising to hold your share, or moving a ship somewhere less crowded.',act:[['View line','selline',q.rk]]});
  // ---- company: cash, buying, standing, shore establishment ----
  const rc=runningCost();
  if(S.cash<1.5*rc&&S.ships.length>1)add({id:'reserve'+S.m,scope:'co',sev:'warn',gain:6e5,title:'Your cash reserve is thin',
    why:`You hold ${money(S.cash)} against running costs of about ${money(rc)} a month, before coal and port bills. One bad month could put you in the bank's hands. Borrow while you can, lay up a loss-making ship, or hold off on buying.`,act:[['Bank','tabgo','finance']]});
  const deps=S.market.map(m=>Math.round(m.price*0.4));
  if(S.market.length&&S.cash-reserve>Math.min(...deps)){
    let best=null;
    for(const m of S.market){const dep=Math.round(m.price*0.4);if(S.cash-reserve<dep)continue;
      for(const rk of Object.keys(ROUTES)){const q=econYear(m,rk);const pay=q.pm-(m.price-dep)*0.065/12;if(!best||pay>best.pay)best={m,rk,pay,dep};}}
    if(best&&best.pay>300)add({id:`buy:${best.m.name}`,scope:'co',sev:'tip',gain:best.pay,title:'Put idle cash to work',
      why:`SS ${best.m.name} (${money(best.dep)} down) could earn about ${money(best.pay)} a month on ${ROUTES[best.rk].name}, averaged over a year of seasons and after mortgage interest. You would still hold three months of running costs in reserve.`,
      act:[['See brokers','tabgo','brokers']]});
  }
  // piers where your ships call often enough to repay one within four years
  const calls={};for(const sh of S.ships)if(sh.line&&ACTIVE.includes(sh.state)){const r=ROUTES[sh.line],rt=sailings(knotsOf(sh),sh.line);
    r.calls.forEach((p,i)=>{const end=i===0||i===r.calls.length-1;calls[p]=(calls[p]||0)+rt*(end?1:2)*sh.grt*(end?0.08:0.04);});}
  for(const p in calls){if(S.shore.piers[p]||!PIER_COST[p])continue;const save=calls[p]*0.6-350,cost=PIER_COST[p];
    if(save>0&&cost/save<=48&&canSpend(cost))add({id:`pier:${p}`,scope:'co',sev:'tip',gain:save,title:`Build a pier at ${PN[p]}`,
      why:`Your ships pay about ${money(calls[p])} a month in dues there. Your own pier cuts that by 60% and takes a day off each turnaround. ${money(cost)}, repaid in about ${Math.ceil(cost/save)} months.`,act:[['Shore','tabgo','shore']]});}
  for(const a in AGENCY){if(S.shore.agents[a])continue;const cost=AGENCY[a].cost;if(!canSpend(cost))continue;
    const ships=S.ships.filter(x=>x.line&&ACTIVE.includes(x.state)&&AGENCY[a].ports.some(p=>ROUTES[x.line].calls.includes(p)));if(!ships.length)continue;
    let before=0;for(const x of ships)before+=econ(x,x.line).pm;S.shore.agents[a]=true;let after=0;try{for(const x of ships)after+=econ(x,x.line).pm;}finally{delete S.shore.agents[a];}
    const save=after-before-300;if(save>0&&cost/save<=30)add({id:`agency:${a}`,scope:'co',sev:'tip',gain:save,title:`Open ${AGENCY[a].name}`,
      why:`Booking agents feed passengers to every line calling at ${AGENCY[a].ports.slice(0,4).map(p=>PN[p]).join(', ')}${AGENCY[a].ports.length>4?' and more':''}. About ${money(save)} a month more for ${money(cost)} and £300 a month.`,act:[['Shore','tabgo','shore']]});}
  const fuelLast=LM?-(LM.cat.fuel||0):0;
  if(fuelLast>6000&&!(S.shore.bunker&&S.shore.bunker.until>=S.m)&&canSpend(10000))add({id:'bunker'+Math.floor(S.m/6),scope:'co',sev:'tip',gain:fuelLast*0.12-10000/24,title:'Sign a bunker contract',
    why:`You spent ${money(fuelLast)} on coal and oil last month. A two-year contract with a bunkering firm takes 12% off for ${money(10000)} down.`,act:[['Shore','tabgo','shore']]});
  if(S.ships.length>=4&&Object.keys(S.depts).length===0)add({id:'dept'+Math.floor(S.m/12),scope:'co',sev:'tip',gain:200,title:'Your line has outgrown one office',
    why:'With four ships or more, departments pay their way: a Fares Office, a Traffic Department, a Marine Superintendent and a Crewing Office can each act on their own advice every month. See the Shore tab.',act:[['Shore','tabgo','shore']]});
  if(S.rep<40&&S.rep>=25)add({id:'rep-mail',scope:'co',sev:'tip',gain:100,title:'Reputation 40 unlocks mail contracts',
    why:`The Post Office only tenders mail to lines with a name (you are at ${Math.round(S.rep)}). A contract pays well over £1,000 a round trip, and ships need wireless to carry it. Lavish tables, faster ships, popular captains and emigrant hostels raise your standing.`,act:[]});
  if(S.rep<25&&Object.values(S.lines).some(l=>l.service===0))add({id:'rep-low',scope:'co',sev:'warn',gain:300,title:'Your name is suffering',
    why:'Spartan tables lower your standing, and standing is what first class passengers buy. Consider Standard service.',act:[]});
  if(!S.conf&&Object.keys(S.wars).length)add({id:'conf-war',scope:'co',sev:'tip',gain:200,title:'The conference is an option',
    why:'Members cannot be targeted by rate wars. The price is a fare floor at 95% of the line rate and a cap on steerage. Worth it if you keep provoking wars.',act:[['Conference','tabgo','company']]});
  A.sort((a,b)=>b.gain-a.gain);
  ADV_CACHE={key,list:A};
  return A;
}
const capScore=c=>Math.min(c.exp,25)/5+c.traits.reduce((a,t)=>a+(CAPT_TRAITS[t].good?2:-3),0);

/* ---------- actions: shared by buttons, departments and the test harness ---------- */
function doAction(act,d){
  const ship=id=>S.ships.find(q=>q.id===id);
  switch(act){
    case 'setfare':{const [rk,c,v]=d;if(S.lines[rk]){S.lines[rk].fares[c]=v;return true;}return false;}
    case 'setfares':{const [rk,f,s2,t]=d;if(S.lines[rk]){Object.assign(S.lines[rk].fares,{f,s:s2,t});return true;}return false;}
    case 'setlineopt':{const [rk,k,v]=d;if(S.lines[rk]){S.lines[rk][k]=v;return true;}return false;}
    case 'setship':{const [id,k,v]=d;const x=ship(id);if(x){x[k]=v;return true;}return false;}
    case 'moveship':{const [id,rk]=d;const x=ship(id);if(!x)return false;x.line=rk||null;if(x.line&&x.state==='laid'){x.state='port';x.portLeft=1;}return true;}
    case 'setyard':{const [id,k]=d;const x=ship(id);if(!x||x.pendingYard||x.state==='yard')return false;
      if(x.state==='sea'||x.state==='repo'){x.pendingYard=k;return true;}if(S.cash>=refitCost(x,k)){enterYard(x,k);return true;}return false;}
    case 'sellship':{const [id]=d;const x=ship(id);if(!x||S.ships.length<2)return false;if(x.state==='sea'||x.state==='repo')x.pendingExit='sell';else exitShip(x,'sell');return true;}
    case 'hire':{const [id,cid]=d;const x=ship(id),c=(S.capPool||[]).find(q=>q.id===cid);if(!x||!c)return false;
      const old=x.captain;x.captain=c;S.capPool=S.capPool.filter(q=>q!==c);if(old&&old.age<63)S.capPool.push(old);news(`${c.name} takes command of SS ${x.name}.`);return true;}
    case 'shorebuy':{const [kind,key]=d,c=shoreCost(kind,key),sh=S.shore;if(!c||S.cash<c)return false;
      if(kind==='pier'){if(sh.piers[key])return false;sh.piers[key]=S.m;news(`The Morven Line opens its own pier at ${PN[key]}.`,'good');}
      else if(kind==='agency'){if(sh.agents[key])return false;sh.agents[key]=S.m;news(`${AGENCY[key].name} now book for the Morven Line.`,'good');}
      else if(kind==='hostel'){if(sh.hostels[key])return false;sh.hostels[key]=S.m;news(`The Morven Line emigrant hostel opens at ${PN[key]}.`,'good');}
      else if(kind==='yard'){if(sh.yards[key])return false;sh.yards[key]=S.m;news(`The Morven Line buys a repair yard on ${YARD_PORTS[key]}.`,'good');}
      else if(kind==='bunker'){if(sh.bunker&&sh.bunker.until>=S.m)return false;sh.bunker={until:S.m+23};book('shore',-c);news('Bunker contract signed: 12% off coal and oil for two years.','good');return true;}
      else if(kind==='dept'){if(S.depts[key])return false;S.depts[key]={auto:false,since:S.m};book('office',-c);news(`The ${DEPTS[key].name} opens at head office.`,'good');return true;}
      else return false;
      S.cash-=c;return true;}
    case 'deptmode':{const [k,auto]=d;if(!S.depts[k])return false;S.depts[k].auto=!!auto;return true;}
  }
  return false;
}
function shoreCost(kind,key){return kind==='pier'?PIER_COST[key]:kind==='agency'?AGENCY[key]&&AGENCY[key].cost:kind==='hostel'?25000:kind==='yard'?120000:kind==='bunker'?10000:kind==='dept'?DEPTS[key]&&DEPTS[key].cost:0;}
/* departments act on their own advice each month, within the cash reserve */
function runDepartments(){
  const owned=Object.keys(S.depts).filter(k=>S.depts[k].auto);if(!owned.length)return;
  ADV_CACHE.key=null;const A=advice();
  for(const k of owned){let done=0;
    for(const h of A){if(h.dept!==k||done>=3)continue;const a=h.act[0];if(!a)continue;const [,act,...d]=a;
      if(!['setfare','setfares','setlineopt','setship','moveship','setyard','hire','sellship'].includes(act))continue;
      if(act==='sellship'&&S.ships.length<3)continue;
      if(act==='setyard'&&!canSpend(refitCost(S.ships.find(q=>q.id===d[0])||{grt:0},d[1])))continue;
      if(doAction(act,d)){done++;news(`${DEPTS[k].name}: ${h.title}.`);S.dismiss[h.id]=S.m;}}
  }
  ADV_CACHE.key=null;
}
function adviceHTML(list,empty){
  if(!list.length)return empty?`<p class="note">${empty}</p>`:'';
  return list.map(h=>{const dn=h.dept==='sec'?'Mr Ferguson':DEPTS[h.dept].name,own=h.dept!=='sec'&&S.depts[h.dept];
    return `<div class="advice ${h.sev}" data-key="${h.id}"><div class="row"><strong>${h.title}</strong>${h.gain>0&&h.gain<1e5?`<span class="chip sea">+${money(h.gain)}/mo</span>`:''}</div>
    <p class="note">${h.why}</p><div class="row"><div class="btns">${h.act.map(a=>{const [l,act,...d]=a;return `<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${d[0]}"`:''} data-d='${JSON.stringify(d)}' ${act==='selline'?`data-id="${d[0]}"`:''}>${l}</button>`;}).join('')}
    <button class="btn quiet" data-act="dismiss" data-id="${h.id}">Not now</button></div><span class="meta">${dn}${own?(own.auto?' · acting':' · advising'):''}</span></div></div>`;}).join('');
}
