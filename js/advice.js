/* ================= ADVICE (Mr Ferguson, company secretary) ================= */
function withTemp(sh,rk,patch,shPatch,fn){
  const had=!!S.lines[rk];if(!had)S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};
  const L=S.lines[rk],saved={fares:L.fares,service:L.service,adv:L.adv},ss={};
  if(patch){if(patch.fares)L.fares={...L.fares,...patch.fares};if(patch.service!==undefined)L.service=patch.service;if(patch.adv!==undefined)L.adv=patch.adv;}
  if(shPatch)for(const k in shPatch){ss[k]=sh[k];sh[k]=shPatch[k];}
  try{return fn();}finally{L.fares=saved.fares;L.service=saved.service;L.adv=saved.adv;for(const k in ss)sh[k]=ss[k];if(!had)delete S.lines[rk];}
}
function econ(sh,rk,patch,shPatch){
  return withTemp(sh,rk,patch,shPatch,()=>{
    const L=S.lines[rk],w=legCalc(sh,rk,0,null),e=legCalc(sh,rk,1,null),rt=w.seaDays+e.seaDays+8;
    const legNet=l=>l.paxRev+l.cargoRev+l.mail-l.fuelC-l.prov-l.agents-l.port;
    const n=Math.max(1,shipsOn(rk).length);
    const fixed=(crewCost(sh)+insCost(sh)+MAINT_COST[sh.maint]*sh.grt/8000)*rt/30;
    const pax=CL.reduce((a,c)=>a+(w.pax[c]?w.pax[c].n:0)+(e.pax[c]?e.pax[c].n:0),0)*30/rt;
    return {pm:(legNet(w)+legNet(e)-fixed)*30/rt-ADV_COST[L.adv]/n,rev:(w.paxRev+e.paxRev+w.cargoRev+e.cargoRev+w.mail+e.mail)*30/rt,
      fuel:(w.fuelC+e.fuelC)*30/rt,rt,w,e,pax};
  });
}
/* the same, averaged over the coming year (four seasons), for decisions that last: buying and moving ships */
function econYear(sh,rk){
  const t0=S.t;let pm=0,k=0;
  for(const q of [0,3,6,9]){const m=Math.min(END_M-1,S.m+q);S.t=(Date.UTC(1921+Math.floor(m/12),m%12,15)-T0)/864e5;pm+=econ(sh,rk).pm;k++;}
  S.t=t0;return {pm:pm/k};
}
const lineShips=rk=>S.ships.filter(x=>x.line===rk&&x.state!=='laid');
function lineEcon(rk,patch){let pm=0,pax=0;for(const sh of lineShips(rk)){const q=econ(sh,rk,patch);pm+=q.pm;pax+=q.pax;}return {pm,pax};}
const WINTER=[10,11,0,1];
const money=v=>fmt(Math.round(v/10)*10);
let ADV_CACHE={key:null,list:[]};
function advice(){
  const key=S.m+'|'+UI.rev;
  if(ADV_CACHE.key===key)return ADV_CACHE.list;
  const A=[],mo=S.m%12;
  const add=h=>{if((S.dismiss[h.id]||-1)>=S.m)return;A.push(h);};
  // ---- last month review ----
  const LM=S.lastMonth;
  if(LM&&LM.net<0){
    const c=LM.cat,rev=(c.fares||0)+(c.cargo||0)+(c.mail||0);
    const costs=CATS.filter(([k])=>(c[k]||0)<0).map(([k,l])=>[l,-c[k]]).sort((a,b)=>b[1]-a[1]).slice(0,2);
    const lm=LM.m%12,winter=WINTER.includes(lm);
    const worst=Object.keys(LM.lines).filter(k=>ROUTES[k]).sort((a,b)=>LM.lines[a]-LM.lines[b])[0];
    add({id:'review'+LM.m,scope:'co',sev:'bad',gain:1e6,title:`${MONTHS[lm]} lost ${money(-LM.net)}`,
      why:`${costs.map(([l,v])=>`${l} took ${rev>0?Math.round(v/rev*100)+'% of revenue':money(v)}`).join(', ')}.${worst&&LM.lines[worst]<0?` ${ROUTES[worst].name} was the weakest line at ${money(LM.lines[worst])}.`:''}${winter?' Winter is the slack season: first class runs at about half its summer level, so some winter losses are normal. The question is whether summer covers them.':''}`,act:[]});
  }
  // ---- lines ----
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
        if(!S.conf&&tn>=40&&curNext<40&&f<L.fares[c])continue; // don't advise a cut that starts a war
        best={f,pm:q.pm,tn};}
      const gain=best.pm-base.pm;
      if(best.f!==L.fares[c]&&gain>=120){
        const up=best.f>L.fares[c],ld=L.last[0]&&L.last[0].pax[c];
        add({id:`fare:${rk}:${c}`,scope:'line',ref:rk,sev:'tip',gain,
          title:`${up?'Raise':'Cut'} ${CL_NAME[c]} to £${best.f} on ${r.name}`,
          why:up?`${ld&&ld.n>=ld.cap*0.95?'Your '+CL_NAME[c].toLowerCase()+' berths are selling out, so you are turning passengers away. ':''}The market will bear more than £${L.fares[c]}.`
                :`${ld?`Only ${ld.n} of ${ld.cap} ${CL_NAME[c].toLowerCase()} berths sold westbound last time. `:''}At £${L.fares[c]} against a line rate of £${ref}, you are pricing passengers off your ships.${!S.conf&&best.tn>=40?` Careful: this pushes conference tension to about ${Math.round(best.tn)}.`:''}`,
          act:[[`Set £${best.f}`,'setfare',rk,c,best.f]]});
      }
    }
    // tension relief
    if(!S.conf&&!S.wars[rk]&&curNext>=40){
      let fix=null;for(let k=1;k<=12&&!fix;k++){const f={};for(const c of ['f','s','t'])f[c]=Math.max(L.fares[c],Math.round(r.ref[c]*(0.94+k*0.02)));if(nextT(f)<40)fix=f;}
      add({id:`tension:${rk}`,scope:'line',ref:rk,sev:'warn',gain:5e5,title:`Calm the conference on ${r.name}`,
        why:`Tension will be about ${Math.round(curNext)} next month, and above 40 a rate war can break out, cutting rival fares by a quarter for months. Your fares below the line rate${ships.length>1?' and your extra ships':''} are what provoke them.${fix?` Fares of £${fix.f} / £${fix.s} / £${fix.t} would bring it back under 40.`:' Consider joining the conference, or accept the risk.'}`,
        act:fix?[['Set those fares','setfares',rk,fix.f,fix.s,fix.t]]:[['Conference','tabgo','company']]});
    }
    for(const [k,opts,label] of [['adv',[0,1,2,3],'advertising'],['service',[0,1,2],'service']]){
      let best={v:L[k],pm:base.pm};
      for(const v of opts){if(v===L[k])continue;const q=lineEcon(rk,{[k]:v});if(q.pm>best.pm)best={v,pm:q.pm};}
      const gain=best.pm-base.pm;
      if(best.v!==L[k]&&gain>=150){
        const nm=k==='adv'?['no advertising','£300 advertising','£800 advertising','£1,500 advertising'][best.v]:['a Spartan table','a Standard table','a Lavish table'][best.v];
        add({id:`${k}:${rk}`,scope:'line',ref:rk,sev:'tip',gain,title:`Try ${nm} on ${r.name}`,
          why:k==='adv'?(best.v>L.adv?'More advertising would fill enough extra berths to pay for itself.':'Your advertising costs more than the extra passengers it brings.')
            :(best.v===2?'Lavish service fills first class and builds reputation every crossing.':best.v===0?'A Spartan table saves money, but it costs reputation each crossing, and reputation drives first class.':'Standard service balances cost and reputation better here.'),
          act:[['Apply','setlineopt',rk,k,best.v]]});
      }
    }
  }
  // ---- ships ----
  for(const sh of S.ships){
    const r0=sh.line;
    if(sh.state==='laid'){
      let best=null;for(const rk of Object.keys(ROUTES)){const q=econYear(sh,rk);if(!best||q.pm>best.pm)best={rk,pm:q.pm};}
      if(best&&best.pm>0&&!WINTER.slice(0,3).includes(mo))add({id:`unlay:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:best.pm,title:`Put SS ${sh.name} back to work`,
        why:`Laid up she still costs wages and insurance. On ${ROUTES[best.rk].name} she would earn about ${money(best.pm)} a month over the coming year${!S.lines[best.rk]?' (that line is not open yet)':''}.${mo>=1&&mo<=3?' Spring bookings are picking up.':''}`,
        act:S.lines[best.rk]?[['Assign','moveship',sh.id,best.rk]]:[['View line','selline',best.rk]]});
      continue;
    }
    if(!r0||sh.state==='yard')continue;
    const cur=econ(sh,r0),curY=econYear(sh,r0);
    // better route, judged over a whole year of seasons
    let best=null;for(const rk of Object.keys(ROUTES)){if(rk===r0)continue;const q=econYear(sh,rk);if(!best||q.pm>best.pm)best={rk,pm:q.pm};}
    if(best&&best.pm-curY.pm>=300)add({id:`move:${sh.id}:${best.rk}`,scope:'ship',ref:sh.id,sev:'tip',gain:best.pm-curY.pm,
      title:`Move SS ${sh.name} to ${ROUTES[best.rk].name}`,
      why:`Averaged over the coming year she would make about ${money(best.pm)} a month there, against ${money(curY.pm)} on ${ROUTES[r0].name}, at current fares.${!S.lines[best.rk]?' You would need to open that line first (£2,500).':''} Check conference tension there before you commit.`,
      act:S.lines[best.rk]?[['Move her','moveship',sh.id,best.rk]]:[['View line','selline',best.rk]]});
    // winter lay-up
    const idle=0.25*crewCost(sh)+insCost(sh);
    if(WINTER.includes(mo)&&cur.pm<-idle-150&&S.ships.length>1)add({id:`layup:${sh.id}:${S.m}`,scope:'ship',ref:sh.id,sev:'tip',gain:-idle-cur.pm,
      title:`Lay SS ${sh.name} up for the winter`,
      why:`She is losing about ${money(-cur.pm)} a month in the winter trade. Laid up on a skeleton crew she would cost only ${money(idle)}. Bring her back in March.`,
      act:[['Lay up at next port','moveship',sh.id,'']]});
    // speed
    let bs={v:sh.speed,pm:cur.pm};for(const v of [0,1,2]){if(v===sh.speed)continue;const q=econ(sh,r0,null,{speed:v});if(q.pm>bs.pm)bs={v,pm:q.pm};}
    if(bs.v!==sh.speed&&bs.pm-cur.pm>=150&&!(S.mail[r0]&&bs.v===0))add({id:`speed:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:bs.pm-cur.pm,
      title:`Run SS ${sh.name} at ${['economical','service','full'][bs.v]} speed`,
      why:bs.v===0?'Coal consumption rises with the cube of speed. Slowing down saves more in bunkers than it costs in lost crossings, at a small cost to reputation.':bs.v===2?'The extra crossings and first class appeal outweigh the extra coal, though she wears faster.':'Her current speed is costing more than it earns.',
      act:[['Apply','setship',sh.id,'speed',bs.v]]});
    if(sh.maint===0)add({id:`maint:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:400,title:`SS ${sh.name} has no maintenance`,
      why:`At ${Math.floor(yearNow()-sh.built)} years old she loses condition every crossing, and nothing slows it. Routine maintenance (${money(MAINT_COST[1]*sh.grt/8000)} a month) postpones costly drydocks and breakdowns.`,
      act:[['Set routine','setship',sh.id,'maint',1]]});
    if(!sh.autoDock&&sh.cond<60)add({id:`thresh:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:450,title:`SS ${sh.name} has no service threshold`,
      why:`She is at ${Math.round(sh.cond)}% and falling. A threshold sends her to drydock automatically before breakdowns get frequent.`,act:[['Use 50%','setship',sh.id,'autoDock',50]]});
    if(sh.fuel==='coal'&&!sh.pendingYard&&yearNow()-sh.built<28){
      const q=econ(sh,r0,null,{fuel:'oil'}),save=q.pm-cur.pm,cost=refitCost(sh,'oil');
      if(save>0&&cost/save<=30)add({id:`oil:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:save,title:`Convert SS ${sh.name} to oil`,
        why:`Oil firing cuts her stokehold crew by a third and her bunker bill. It would save about ${money(save)} a month and pay back its ${money(cost)} in about ${Math.ceil(cost/save)} months, but she is out of service for ${YARD_DAYS.oil} days.`,
        act:[['Book the conversion','setyard',sh.id,'oil']]});
    }
  }
  // ---- rivals ----
  for(const q of S.rmoves.filter(q=>q.m>=S.m-1&&q.kind==='add'&&S.lines[q.rk]))
    add({id:`rin:${q.rk}:${q.ship}`,scope:'line',ref:q.rk,sev:'warn',gain:250,title:`${RIVALS[q.o].name} has added SS ${q.ship} to ${ROUTES[q.rk].name}`,
      why:'More rival berths on the route means a smaller slice for each of your ships, especially in steerage. Consider a better table or more advertising to hold your share, or moving a ship somewhere less crowded.',act:[['View line','selline',q.rk]]});
  for(const rk of Object.keys(S.lines))if(S.rfare&&S.rfare[rk]<0.95&&!S.conf)
    add({id:`match:${rk}`,scope:'line',ref:rk,sev:'tip',gain:220,title:`Rivals have matched your fares on ${ROUTES[rk].name}`,
      why:`Their fares are down to ${Math.round(S.rfare[rk]*100)}% of the line rate. Your cut no longer wins you passengers; it just lowers everyone's income. Raising fares back towards the line rate lets the whole route recover.`,act:[['View line','selline',rk]]});
  // ---- company ----
  const deps=S.market.map(m=>Math.round(m.price*0.4));
  if(S.market.length&&S.cash-8000>Math.min(...deps)){
    let best=null;
    for(const m of S.market){const dep=Math.round(m.price*0.4);if(S.cash-8000<dep)continue;
      for(const rk of Object.keys(ROUTES)){const q=econYear(m,rk);const pay=q.pm-(m.price-dep)*0.065/12;if(!best||pay>best.pay)best={m,rk,pay,dep};}}
    if(best&&best.pay>300)add({id:`buy:${best.m.name}`,scope:'co',sev:'tip',gain:best.pay,title:'Put idle cash to work',
      why:`SS ${best.m.name} (${money(best.dep)} down) could earn about ${money(best.pay)} a month on ${ROUTES[best.rk].name}, averaged over a year of seasons and after mortgage interest. Keep enough cash to survive a bad winter.`,
      act:[['See brokers','tabgo','brokers']]});
  }
  if(S.rep<40&&S.rep>=25)add({id:'rep-mail',scope:'co',sev:'tip',gain:100,title:'Reputation 40 unlocks mail contracts',
    why:`The Post Office only tenders mail to lines with a name (you are at ${Math.round(S.rep)}). A contract pays well over £1,000 a round trip. Lavish tables and punctual, fast crossings build reputation; Spartan tables and breakdowns erode it.`,act:[]});
  if(S.rep<25&&Object.values(S.lines).some(l=>l.service===0))add({id:'rep-low',scope:'co',sev:'warn',gain:300,title:'Your name is suffering',
    why:'Spartan tables cost reputation on every crossing, and reputation is what first class passengers buy. Consider Standard service.',act:[]});
  if(!S.conf&&Object.keys(S.wars).length)add({id:'conf-war',scope:'co',sev:'tip',gain:200,title:'The conference is an option',
    why:'Members cannot be targeted by rate wars. The price is a fare floor at 95% of the line rate and a cap on steerage. Worth it if you keep provoking wars.',act:[['Conference','tabgo','company']]});
  A.sort((a,b)=>b.gain-a.gain);
  ADV_CACHE={key,list:A};
  return A;
}
function adviceHTML(list,empty){
  if(!list.length)return empty?`<p class="note">${empty}</p>`:'';
  return list.map(h=>`<div class="advice ${h.sev}" data-key="${h.id}"><div class="row"><strong>${h.title}</strong>${h.gain>0&&h.gain<1e5?`<span class="chip sea">+${money(h.gain)}/mo</span>`:''}</div>
    <p class="note">${h.why}</p><div class="btns">${h.act.map(a=>{const [l,act,...d]=a;return `<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${d[0]}"`:''} data-d='${JSON.stringify(d)}' ${act==='selline'?`data-id="${d[0]}"`:''}>${l}</button>`;}).join('')}
    <button class="btn quiet" data-act="dismiss" data-id="${h.id}">Not now</button></div></div>`).join('');
}
