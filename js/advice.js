/* ================= ADVICE: Mr Ferguson and the head-office departments ================= */
/* Every suggestion names the department it belongs to. Advice is free; a department you have bought can also act on
   its own suggestions each month (within a cash reserve), and reports what it did in the news. */
function withTemp(sh,rk,patch,shPatch,fn){
  const had=!!S.lines[rk];if(!had)S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};
  const L=S.lines[rk],saved={fares:L.fares,service:L.service,adv:L.adv},ss={};
  if(patch){if(patch.fares)L.fares={...L.fares,...patch.fares};if(patch.service!==undefined)L.service=patch.service;if(patch.adv!==undefined)L.adv=patch.adv;}
  if(shPatch){MOD_EPOCH++;for(const k in shPatch){ss[k]=sh[k];sh[k]=shPatch[k];}}
  try{return fn();}finally{L.fares=saved.fares;L.service=saved.service;L.adv=saved.adv;for(const k in ss)sh[k]=ss[k];if(shPatch)MOD_EPOCH++;if(!had)delete S.lines[rk];}
}
/* her turnaround at both ends, as this ship will actually manage it: gear, hatches, piers and sheds all count */
const turnFor=(sh,rk)=>{if(ROUTES[rk].cruise)return turnPair(rk);const [a,b]=geoEnds(geoKey(rk,S.m));return turnDays(sh,a)+turnDays(sh,b);};
/* a ship's expected monthly result on a route this month, at current settings (patches try alternatives) */
function econ(sh,rk,patch,shPatch){
  const fc0=FC_NOW;FC_NOW=S.m; // history held at today (sim.js, legCalc)
  try{return withTemp(sh,rk,patch,shPatch,()=>{
    const L=S.lines[rk],w=legCalc(sh,rk,0,null),e=legCalc(sh,rk,1,null),rt=w.seaDays+e.seaDays+turnFor(sh,rk);
    const legNet=(l,dir)=>l.paxRev+(l.onboard||0)+l.cargoRev+l.mail-l.fuelC-l.prov-l.agents-l.port-lighterLeg(sh,l,dir);
    const n=Math.max(1,shipsOn(rk).length);
    const fixed=(crewCost(sh)+(sh.captain?sh.captain.wage:0)+insCost(sh)+MAINT_COST[sh.maint]*sh.grt/8000+(sh.fac?facMods(sh).staff*PX():0))*rt/30;
    const pax=CL.reduce((a,c)=>a+(w.pax[c]?w.pax[c].n:0)+(e.pax[c]?e.pax[c].n:0),0)*30/rt;
    return {pm:(legNet(w,0)+legNet(e,1)-fixed)*30/rt-ADV_COST[L.adv]/n,rev:(w.paxRev+e.paxRev+w.cargoRev+e.cargoRev+w.mail+e.mail)*30/rt,
      fuel:(w.fuelC+e.fuelC)*30/rt,rt,w,e,pax};
  });}
  finally{FC_NOW=fc0;}
}
/* the same averaged over the coming year (four seasons), for decisions that last */
/* A year at sea is not twelve months of sailing: a ship spends time in the yard, broken down, held in port or slowed by
   weather, and her repairs and drydockings cost money. Fitted to the test fleets (tools/forecast.js): a ship earns about
   0.9 of what a clear year would bring, an old one (wear 60 to 90) down to about 0.72, and spends about 0.06 of her
   tonnage a month on the yard at 1921 prices, an old one about four times as much (0.36.2: forecasts were about twice
   what ships then made). */
function yearReal(sh,rev,fuel){const fat=fatOf(sh),old=clamp((fat-60)/30,0,1);
  return {avail:0.9-0.18*old,yard:(sh.grt||0)*PX()*(0.06+0.2*old)};}
function econYear(sh,rk,patch,shPatch){
  const t0=S.t;let pm=0,rev=0,fuel=0,k=0;
  try{for(const q of [0,3,6,9]){const m=S.m+q;S.t=tOfM(m);const e=econ(sh,rk,patch,shPatch);pm+=e.pm;rev+=e.rev;fuel+=e.fuel;k++;}}
  finally{S.t=t0;}
  pm/=k;rev/=k;fuel/=k;const Y=yearReal(sh);
  // the days she does not sail lose her the takings less the coal; crew, insurance and upkeep go on
  return {pm:pm-(1-Y.avail)*(rev-fuel)-Y.yard,clear:pm,avail:Y.avail,yard:Y.yard};
}
/* the same averaged over given months of the year (a cruise's season), the next time each comes round */
function econMonths(sh,rk,ms,shPatch){
  const t0=S.t;let pm=0;
  try{for(const mo of ms){const m=S.m+((mo-S.m%12)+12)%12;S.t=tOfM(m);pm+=econ(sh,rk,null,shPatch).pm;}}
  finally{S.t=t0;}
  return pm/ms.length;
}
let CRUISE_EST={key:null};
function cruiseEst(sh){
  const key=S.m+'|'+UI.rev+'|'+sh.id;if(CRUISE_EST.key===key)return CRUISE_EST.v;
  const home=onProgramme(sh)?sh.homeLine:sh.line;
  const v=Object.keys(ROUTES).filter(k=>isCruise(k)&&routeOpen(k,S.m)).map(k=>{const ms=ROUTES[k].cruise.months;
    return {rk:k,pm:econMonths(sh,k,ms),home:home&&S.lines[home]&&!isCruise(home)?econMonths(sh,home,ms):-idleCost(sh)};});
  CRUISE_EST={key,v};return v;
}
/* her year under her cruise programme, month by month, against a year on her own line; with the light passages between ports */
let YEAR_PLAN={key:null};
const homeOf=sh=>onProgramme(sh)?sh.homeLine:sh.line&&!isCruise(sh.line)?sh.line:sh.line;
function yearPlan(sh,cp){
  cp=cp||cruiseProg(sh);const key=S.m+'|'+UI.rev+'|'+sh.id+'|'+cp.join();if(YEAR_PLAN.key===key)return YEAR_PLAN.v;
  const home=homeOf(sh),t0=S.t,idle=-idleCost(sh),months=[];
  try{for(let i=0;i<12;i++){const m=S.m+i,mo=m%12;S.t=tOfM(m);
    const c=cp.find(k=>cruiseInSeason(k,m))||null,base=home&&S.lines[home]?econ(sh,home).pm:idle;
    months.push({m,mo,rk:c||home||null,cruise:!!c,pm:c?econ(sh,c).pm:base,base});}}
  finally{S.t=t0;}
  // a light passage whenever she changes home port: coal, and the days she earns nothing
  let pass=0,days=0;const portOf=rk=>rk?ROUTES[rk].a:null;
  for(let i=1;i<=12;i++){const a=months[(i-1)%12],b=months[i%12];if(a.rk===b.rk)continue;const pa=portOf(a.rk),pb=portOf(b.rk);if(!pa||!pb||pa===pb)continue;
    const d=laneDist(pa,pb)/(knotsOf(sh)*24);days+=d;pass+=fuelRate(sh,1)*d*fuelPrice(sh,S.m)+d*(crewCostOf(sh)+insCost(sh))/30;}
  const avg=months.reduce((a,x)=>a+x.pm,0)/12-pass/12,base=months.reduce((a,x)=>a+x.base,0)/12;
  const v={months,avg,base,pass,days};YEAR_PLAN={key,v};return v;
}
const lineShips=rk=>S.ships.filter(x=>x.line===rk&&x.state!=='laid');
function lineEcon(rk,patch){let pm=0,pax=0;for(const sh of lineShips(rk)){const q=econ(sh,rk,patch);pm+=q.pm;pax+=q.pax;}return {pm,pax};}
/* the standing a table on one line would bring the Line to, and the whole fleet's monthly takings at that standing */
function serviceRep(rk,v){const L=S.lines[rk],was=L.service;L.service=v;try{const t=repTarget();return t===null?S.rep:t;}finally{L.service=was;}}
/* the whole fleet's takings with a table on one line at the standing it would bring. The other lines change only with the
   standing, so each is worked out at two standings once per pass of the advice and read off the line between them;
   only the line itself is worked out in full (0.36.0: it was every line for every table on every line, a quarter of
   the advice's time with a big fleet) */
let SVC_PASS=null;
function svcOther(r){const P=SVC_PASS||(SVC_PASS={rep:S.rep,m:{}});if(P.m[r])return P.m[r];
  const rep=S.rep;let a,b;try{S.rep=P.rep;a=lineEcon(r,{}).pm;S.rep=Math.min(100,P.rep+5);b=lineEcon(r,{}).pm;}finally{S.rep=rep;}
  return P.m[r]={a,slope:(b-a)/Math.max(1e-9,Math.min(100,P.rep+5)-P.rep)};}
function serviceEcon(rk,v){const L=S.lines[rk],was=L.service,rep=S.rep;const t=serviceRep(rk,v);
  let pm=0;for(const r of Object.keys(S.lines))if(ROUTES[r]&&r!==rk){const o=svcOther(r);pm+=o.a+o.slope*(t-(SVC_PASS?SVC_PASS.rep:rep));}
  L.service=v;S.rep=t;try{return pm+lineEcon(rk,{}).pm;}finally{L.service=was;S.rep=rep;}}
const WINTER=[10,11,0,1];
const money=v=>fmt(Math.round(v/10)*10);
const canSpend=cost=>S.cash-cost>=3*runningCost();
const idleCost=sh=>0.08*crewCost(sh)+(sh.captain?sh.captain.wage*0.5:0)+insCost(sh)*0.3; // laid up: shipkeepers, half pay, port risks (0.38.0)
const DEPT_OF={wcr:'traffic',cpay:'crew',ctrain:'crew',off:'crew',review:'sec',reserve:'sec',buy:'traffic',build:'traffic','rep-mail':'sec','rep-low':'sec','conf-war':'sec',pier:'sec',agency:'sec',bunker:'sec',dept:'sec',
  fare:'fares',tension:'fares',adv:'fares',service:'fares',match:'fares',
  move:'traffic',home:'traffic',unlay:'traffic',layup:'traffic',sell:'traffic',rin:'traffic',
  speed:'marine',maint:'marine',thresh:'marine',dock:'marine',scrape:'marine',oil:'marine',refurb:'marine',reefer:'marine',wireless:'marine',warcargo:'marine',zig:'marine',convoy:'marine',dazzle:'marine',gun:'marine',wtop:'marine',replate:'marine',boats:'marine',watch:'marine',gross:'marine',censure:'marine',scrap:'marine',
  pay:'crew',captain:'crew'};
const deptOf=h=>DEPT_OF[h.id.split(/[:0-9]/)[0]]||'sec';
/* the standing order an item of advice falls under, and whether the department may act on it alone (0.36.1) */
const orderOf=h=>{const kind=h.id.split(/[:0-9]/)[0],L=DEPT_ORDERS[h.dept||deptOf(h)];if(!L)return null;const o=L.find(x=>x[2].includes(kind));return o?o[0]:null;};
const orderOn=(k,g)=>{const o=S.depts[k];return !!(o&&o.auto&&g&&!(o.orders&&o.orders[g]===false));};
/* an item an acting department will see to under its standing orders: it leaves the owner's list */
/* the line an item concerns: its own, or its ship's; a line the owner keeps to himself is left alone (0.36.2) */
const itemLine=h=>h.scope==='line'?h.ref:h.scope==='ship'?((S.ships.find(x=>x.id===h.ref)||{}).line||null):null;
const lineKept=h=>{const rk=itemLine(h);return !!(rk&&S.lines[rk]&&S.lines[rk].hands===false);};
const handled=h=>h.dept&&h.dept!=='sec'&&h.act&&h.act[0]&&orderOn(h.dept,orderOf(h))&&!lineKept(h);
/* the owner's desk: what no acting department will see to, gravest first, with many ships under the same advice gathered
   into one item (0.36.2: a big fleet of old ships brought a dozen 'Sell her' items a month) */
const DESK_GROUP={sell:['Sell','ships that no route would pay for'],layup:['Lay up','ships losing money'],unlay:['Put back to work','laid-up ships'],home:['Return','ships to the lines they were built for'],move:['Move','ships to better lines']};
function deskItems(ADV){const R={bad:0,warn:1,tip:2};
  const mine=ADV.filter(h=>!handled(h)).sort((a,b)=>(R[a.sev]??3)-(R[b.sev]??3)||b.gain-a.gain),by={};
  for(const h of mine){const k=h.id.split(/[:0-9]/)[0];if(DESK_GROUP[k]&&h.scope==='ship')(by[k]=by[k]||[]).push(h);}
  const out=[];const done=new Set();
  for(const h of mine){const k=h.id.split(/[:0-9]/)[0];
    if(by[k]&&by[k].length>3){if(done.has(k))continue;done.add(k);const L=by[k],G=DESK_GROUP[k],names=L.map(q=>(S.ships.find(x=>x.id===q.ref)||{}).name).filter(Boolean);
      out.push({id:'grp:'+k,scope:'co',sev:L.some(q=>q.sev==='bad')?'bad':L.some(q=>q.sev==='warn')?'warn':'tip',gain:L.reduce((a,q)=>a+q.gain,0),dept:L[0].dept,info:false,
        title:`${G[0]} ${L.length} ${G[1]}`,why:`Head office's advice for ${names.slice(0,6).map(n=>'SS '+n).join(', ')}${names.length>6?` and ${names.length-6} more`:''}. Each ship's page has the figures; the Fleet Manager shows them side by side.`,
        act:[['Fleet manager','fmopen']]});continue;}
    out.push(h);}
  return out;}
let ADV_CACHE={key:null,list:[]};
/* With a big fleet a full pass takes most of a second. The lines and the ships are worked out unit by unit, and the game
   screen gives the pass a few milliseconds a frame: units not reached yet show what they said last time, and the pass
   carries on next frame until it is complete (0.36.0; it froze the screen for most of a second each month at 70 ships).
   Every other caller (departments, actions, the test tools) gets a complete pass. */
const ADV_UNITS={sig:null,fresh:{},m:{}};let ADV_BUDGET=Infinity,ADV_T0=0,ADV_SHORT=false;
function advUnit(k,fn){const U=ADV_UNITS;
  if(U.fresh[k])return U.m[k];
  if(ADV_BUDGET!==Infinity&&performance.now()-ADV_T0>ADV_BUDGET){ADV_SHORT=true;return U.m[k]||[];}
  U.m[k]=fn();U.fresh[k]=true;return U.m[k];}
const advKey=()=>S.m+'|'+UI.rev+'|'+(S.quietUntil>S.t);
function advice(budget){
  const quiet=S.quietUntil>S.t,key=advKey();
  if(ADV_CACHE.key===key)return ADV_CACHE.list;
  if(ADV_UNITS.sig!==key){ADV_UNITS.sig=key;ADV_UNITS.fresh={};}
  ADV_BUDGET=budget===undefined?Infinity:budget;ADV_T0=performance.now();ADV_SHORT=false;
  MOD_EPOCH++;SVC_PASS=null; // a fresh pass (0.36.0: a cached answer no longer throws away every ship's cached figures)
  const A=[],mo=S.m%12,reserve=3*runningCost();
  const raised=new Set(),add=h=>{raised.add(h.id);if((S.dismiss[h.id]||-1)>=S.m)return;if(/^sell:/.test(h.id)&&rescueNoSale()||/^buy/.test(h.id)&&rescueNoBuy())return; // not under the rescue terms (0.37.0)
  h.dept=deptOf(h);h.info=!h.act.some(a=>DOING.includes(a[1]));A.push(h);};
  // ---- last month review ----
  const LM=S.lastMonth;
  if(LM&&LM.net<0){
    const c=LM.cat,rev=(c.fares||0)+(c.cargo||0)+(c.mail||0);
    const costs=CATS.filter(([k])=>(c[k]||0)<0).map(([k,l])=>[l,-c[k]]).sort((a,b)=>b[1]-a[1]).slice(0,2);
    const lm=LM.m%12,winter=WINTER.includes(lm);
    const worst=Object.keys(LM.lines).filter(k=>ROUTES[k]).sort((a,b)=>LM.lines[a]-LM.lines[b])[0];
    add({id:'review'+LM.m,scope:'co',sev:'bad',gain:1e6,title:`${MONTHS[lm]} lost ${money(-LM.net)}`,
      why:`${costs.map(([l,v])=>`${l} took ${rev>0?Math.round(v/rev*100)+'% of revenue':money(v)}`).join(', ')}.${worst&&LM.lines[worst]<0?` ${ROUTES[worst].name} was the weakest line at ${money(LM.lines[worst])}.`:''}${winter?' Winter is the slack season: first class runs at about half its summer level, so some winter losses are normal. The question is whether summer covers them.':''}${S.m>=ym(1929,10)&&S.m<ym(1934,4)?' The Depression is hitting every line; laying up ships that cannot pay their way is how the survivors got through it.':''}`,act:[]});
  }
  // ---- lines: fares, tension, advertising and service ----
  for(const rk of Object.keys(S.lines))for(const h of advUnit('line:'+rk,()=>{const A1=[],add=h=>A1.push(h);(()=>{
    const r=ROUTES[rk],L=S.lines[rk],ships=lineShips(rk);if(!ships.length)return;
    // judge a fare where it ends up: rival lines match a cut below the line rate within a few months, and drift back up
    // once you stop undercutting, so compare fares at the rivals' settled response, not this month's
    const settled=(rk,f)=>{S.rfare=S.rfare||{};const had=S.rfare[rk];const L2=S.lines[rk],save=L2.fares;L2.fares={...save,...f};
      const ratio=ourFareRatio(rk);L2.fares=save;S.rfare[rk]=Math.min(1-0.12*slump(S.m),ratio<0.97?Math.max(0.68,ratio+0.04):1);
      // over this month and the month six on, so the advice does not flip with the season (0.39.0; KI-070)
      const t0=S.t;try{const a=lineEcon(rk,{fares:f});S.t=tOfM(S.m+6);const b=lineEcon(rk,{fares:f});return {pm:(a.pm+b.pm)/2,pax:(a.pax+b.pax)/2};}finally{S.t=t0;if(had===undefined)delete S.rfare[rk];else S.rfare[rk]=had;}};
    const base=settled(rk,{}),t=S.tension[rk]||0,n=ships.filter(x=>ACTIVE.includes(x.state)).length||1;
    const nextT=f=>{const q=lineEcon(rk,{fares:f});return t+(pressure(rk,{...L.fares,...f},q.pax,n,S.m).p-t)*0.35;};
    const curNext=S.conf?0:nextT({});
    // each class is a unit of its own: the search over fares is the heaviest part of the advice (0.36.0)
    for(const c of CL)for(const h of advUnit('fare:'+rk+':'+c,()=>{const A2=[],add=h=>A2.push(h);(()=>{
      if(!ships.some(s=>s.berths[c]))return;
      if(L.set&&L.set['fare'+c]!==undefined&&S.m-L.set['fare'+c]<3)return; // a fare changed in the last three months is left to settle (0.39.0)
      const ref=r.ref[c],lo=S.conf?confFloor(rk,c):Math.round(ref*0.6),hi=Math.round(ref*1.6),step=Math.max(1,Math.round(ref*0.05));
      let best={f:L.fares[c],pm:base.pm,tn:curNext}; // the same as settled(rk,{}), worked out once
      // every other step first, then the steps either side of the best (0.36.0: half the work, the same answer on a
      // smooth curve)
      const tried=new Set([L.fares[c]]);
      const tryF=f=>{if(f<lo||f>hi||tried.has(f))return;tried.add(f);
        const q=settled(rk,{[c]:f});if(q.pm<=best.pm+1)return;
        const tn=S.conf||c==='tt'?0:nextT({[c]:f});
        if(!S.conf&&tn>=40&&f<L.fares[c])return; // never advise a cut that risks a rate war
        best={f,pm:q.pm,tn};};
      for(let f=lo;f<=hi;f+=2*step)tryF(f);
      {const f0=best.f;tryF(f0-step);tryF(f0+step);}
      const gain=best.pm-base.pm;
      if(best.f!==L.fares[c]&&gain>=120){
        const up=best.f>L.fares[c],ld=L.last[0]&&L.last[0].pax[c];
        add({id:`fare:${rk}:${c}`,scope:'line',ref:rk,sev:'tip',gain,
          title:`${up?'Raise':'Cut'} ${CL_NAME[c]} to £${best.f} on ${r.name}`,
          why:up?`${ld&&ld.n>=ld.cap*0.95?'Your '+CL_NAME[c].toLowerCase()+' berths are selling out, so you are turning passengers away. ':''}The market will bear more than £${L.fares[c]}.`
                :`${ld&&ld.n<ld.cap*0.95?`Only ${ld.n} of ${ld.cap} ${CL_NAME[c].toLowerCase()} berths sold outbound last time. `:''}${L.fares[c]>ref?`At £${L.fares[c]} against a line rate of £${ref}, you are pricing passengers off your ships.`:`Over the coming months a lower fare would fill more berths than it gives away.`}`,
          act:[[`Set £${best.f}`,'setfare',rk,c,best.f]]});
      }
    })();return A2;}))add(h);
    if(!S.conf&&!S.wars[rk]&&curNext>=40){
      let fix=null;for(let k=1;k<=12&&!fix;k++){const f={};for(const c of ['f','s','t'])f[c]=Math.max(L.fares[c],Math.round(r.ref[c]*(0.94+k*0.02)));if(nextT(f)<40)fix=f;}
      add({id:`tension:${rk}`,scope:'line',ref:rk,sev:'warn',gain:5e5,title:`Calm the conference on ${r.name}`,
        why:`Tension will be about ${Math.round(curNext)} next month, and above 40 a rate war can break out, cutting rival fares by a quarter for months. ${(()=>{const P=pressure(rk,L.fares,lineEcon(rk,{}).pax,n,S.m),why=[];if(P.ratio<0.97)why.push('your fares below the line rate');if(P.share>0.2)why.push(`your share of the trade (${Math.round(P.share*100)}% of its passengers)`);if(n>1)why.push('your extra ships');return why.length?why.join(', ').replace(/, ([^,]*)$/,' and $1')[0].toUpperCase()+why.join(', ').replace(/, ([^,]*)$/,' and $1').slice(1)+' are what provoke them.':'';})()}${fix?` Fares of £${fix.f} / £${fix.s} / £${fix.t} would bring it back under 40.`:' Fares alone will not calm it: consider joining the conference, fewer ships there, or accept the risk.'}`,
        act:fix?[['Set those fares','setfares',rk,fix.f,fix.s,fix.t]]:[['Conference','tabgo','company']]});
    }
    // advertising and the table are judged against the line as it stands now, the same way as each option;
    // comparing against the settled-fare figure made every other setting look better, so the advice flipped back and forth
    // each setting is a unit of its own (0.36.0)
    let nowQ=null;const nowPm=()=>(nowQ||(nowQ=lineEcon(rk,{}))).pm;
    for(const k of ['adv','service'])for(const h of advUnit(k+':'+rk,()=>{const A2=[],add=h=>A2.push(h);(()=>{
      // the table is judged by the whole fleet's takings at the standing it leads to, not this line's at today's:
      // a Spartan table saves its cost at once, but the Line's name sinks on every trade over the months that follow
      const judge=v=>k==='service'?serviceEcon(rk,v):v===L[k]?nowPm():lineEcon(rk,{[k]:v}).pm;
      const cur=judge(L[k]);let best={v:L[k],pm:cur};
      for(const v of k==='adv'?[0,1,2,3]:[0,1,2]){if(v===L[k])continue;
        if(k==='service'&&v<L[k]&&serviceRep(rk,L[k])>=40&&serviceRep(rk,v)<40)continue; // below 40 the Post Office will not tender
        const pm=judge(v);if(pm>best.pm)best={v,pm};}
      const gain=best.pm-cur;
      // a table or advertising changed in the last six months is left to settle: a table takes months to move the Line's name,
      // and judging it again each month flipped it to and fro (0.37.2; KI-045)
      const settled=!(L.set&&L.set[k]!==undefined&&S.m-L.set[k]<6);
      // going straight back to what it was before the last change wants a clear case: a table moves the Line's name for a year
      // and more, so the six-month judgement swung it between Standard and Lavish twice a year (0.39.3)
      const back=L.was&&L.was[k]===best.v&&L.set&&S.m-L.set[k]<24,need=back?Math.max(600,0.05*Math.abs(cur)):150;
      if(best.v!==L[k]&&gain>=need&&settled){
        const nm=k==='adv'?['no advertising','£300 advertising','£800 advertising','£1,500 advertising'][best.v]:['a Spartan table','a Standard table','a Lavish table'][best.v];
        add({id:`${k}:${rk}`,scope:'line',ref:rk,sev:'tip',gain,title:`Try ${nm} on ${r.name}`,
          why:k==='adv'?(best.v>L.adv?'More advertising would fill enough extra berths to pay for itself.':'Your advertising costs more than the extra passengers it brings.')
            :`${best.v===2?'Lavish service fills first class and builds reputation.':best.v===0?'A Spartan table saves money here even after what it costs your standing.':'Standard service balances cost and reputation better here.'} Your reputation would settle near ${Math.round(serviceRep(rk,best.v))}, against ${Math.round(serviceRep(rk,L.service))} as things stand, and every trade's first class feels it.`,
          act:[['Apply','setlineopt',rk,k,best.v]]});
      }
    })();return A2;}))add(h);
    // only when the Line itself is under the rate: if the rivals cut on their own, there is no cut of ours to undo (0.38.0)
    if(S.rfare&&S.rfare[rk]<0.95&&!S.conf&&['f','s','t'].some(c=>L.fares[c]&&r.ref[c]&&L.fares[c]<r.ref[c]*0.97))
      add({id:`match:${rk}`,scope:'line',ref:rk,sev:'tip',gain:220,title:`Rivals have matched your fares on ${r.name}`,
        why:`Their fares are down to ${Math.round(S.rfare[rk]*100)}% of the line rate. Your cut no longer wins you passengers; it just lowers everyone's income. Raising fares back towards the line rate lets the whole route recover.`,act:[['View line','selline',rk]]});
  })();return A1;}))add(h);
  // ---- ships: deployment, upkeep, upgrades, crew ----
  for(const sh of S.ships)for(const h of advUnit('ship:'+sh.id,()=>{const A1=[],add=h=>A1.push(h);(()=>{
    if(sh.state==='lost')return;
    const r0=sh.line;
    if(sh.state==='laid'){
      const best=bestLine(sh,null);
      const idleC=idleCost(sh),val=Math.round(shipValue(sh)*0.9);
      if(best&&best.pm<0&&S.ships.length>1&&!sh.pendingExit&&!(sh.acq>S.m-18)&&!WINTER.includes(mo))add({id:`sell:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:idleC+val*loanRate()/12,
        title:`Sell SS ${sh.name}`,
        why:`Even laid up she costs ${money(idleC)} a month, and no route would pay her way over the coming year. Selling her raises about ${money(val)}${S.debt>0?', which could pay down the mortgage and its interest':''}. ${shipMkt()<0.95?'Ships are cheap now, so you would be selling low.':shipMkt()>1.1?'Ships are fetching good prices.':''}`,
        act:[['Sell her','sellship',sh.id]]});
      if(best&&best.pm>(S.lines[best.rk]?0:300)&&!WINTER.slice(0,3).includes(mo))add({id:`unlay:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:best.pm,title:`Put SS ${sh.name} back to work`,
        why:`Laid up she still costs wages and insurance. On ${ROUTES[best.rk].name} she would earn about ${money(best.pm)} a month over the coming year${!S.lines[best.rk]?' (that line is not open yet)':''}.${mo>=1&&mo<=3?' Spring bookings are picking up.':''}`,
        act:S.lines[best.rk]?[['Assign','moveship',sh.id,best.rk]]:[['Open it and assign her','openmove',sh.id,best.rk],['View line','selline',best.rk]]});
      return;
    }
    if(!r0||sh.state==='yard')return;
    const cur=econ(sh,r0),curY=econYear(sh,r0),cruising=onProgramme(sh)||cruiseProg(sh).includes(r0); // away on her cruise season: head office leaves her line alone
    // the last ship on a line with a mail contract stays, or the contract goes after missed sailings (0.35.6)
    const mailLast=!!S.mail[r0]&&!S.ships.some(x=>x!==sh&&x.line===r0&&x.state!=='laid');
    const best=cruising||mailLast?null:bestLine(sh,r0);
    // a ship on the line she was built for stays unless another pays clearly more: twice the usual margin (0.36.2)
    const bf=builtFor(sh),home=bf===r0,need=Math.max(400,Math.abs(curY.pm)*0.15)*(home?2:1)*(S.m-(sh.movedAt??-99)<12?2:1),unfit=best?lineFit(sh,best.rk):[];
    if(best&&best.pm>0&&best.pm-curY.pm>=need&&(S.lines[best.rk]||best.pm>300))add({id:`move:${sh.id}:${best.rk}`,scope:'ship',ref:sh.id,sev:'tip',gain:best.pm-curY.pm,
      title:`Move SS ${sh.name} to ${ROUTES[best.rk].name}`,
      why:`Averaged over the coming year she would make about ${money(best.pm)} a month there, against ${money(curY.pm)} on ${ROUTES[r0].name}, at current fares.${home?` She was built for ${ROUTES[r0].name}.`:''}${unfit.length?` There she would be ${unfit.join('; ')}; the figure allows for it.`:''}${!S.lines[best.rk]?' You would need to open that line first (£2,500).':''} Check conference tension there before you commit.`,
      act:S.lines[best.rk]?[['Move her','moveship',sh.id,best.rk]]:[['Open it and move her','openmove',sh.id,best.rk],['View line','selline',best.rk]]});
    // away from the line she was built for, when it is open and she would do at least as well there: say so (0.36.2)
    else if(bf&&!home&&S.lines[bf]&&routeOpen(bf,S.m)&&!cruising&&!mailLast){const hy=econYear(sh,bf);
      if(hy.pm>=curY.pm+150)add({id:`home:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:hy.pm-curY.pm,title:`Return SS ${sh.name} to ${ROUTES[bf].name}`,
        why:`She was built for ${ROUTES[bf].name} and would make about ${money(hy.pm)} a month there over the coming year, against ${money(curY.pm)} on ${ROUTES[r0].name}.`,
        act:[['Move her back','moveship',sh.id,bf]]});}
    const idle=idleCost(sh),bestY=best?Math.max(best.pm,curY.pm):curY.pm;
    if(!cruising&&!mailLast&&S.ships.length>1&&bestY<-idle-150)add({id:`layup:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:-idle-curY.pm,
      title:`Lay SS ${sh.name} up until trade recovers`,
      why:`Averaged over the coming year she would lose about ${money(-curY.pm)} a month on ${ROUTES[r0].name}, and no other route does better. Laid up on a skeleton crew she would cost only ${money(idle)}.`,
      act:[['Lay up at next port','moveship',sh.id,'']]});
    else if(!cruising&&!mailLast&&WINTER.includes(mo)&&cur.pm<-idle-150&&S.ships.length>1)add({id:`layup:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:-idle-cur.pm,
      title:`Lay SS ${sh.name} up for the winter`,
      why:`She is losing about ${money(-cur.pm)} a month in the winter trade. Laid up on a skeleton crew she would cost only ${money(idle)}. Bring her back in March.`,
      act:[['Lay up at next port','moveship',sh.id,'']]});
    if(!mailLast&&!cruiseProg(sh).length&&!(sh.cp||[]).length&&!isCruise(r0)&&CL.reduce((q,c)=>q+(sh.berths[c]||0),0)>=100&&[7,8,9,10,2,3,4].includes(mo)){
      const best=cruiseEst(sh).slice().sort((p,q)=>(q.pm-q.home)-(p.pm-p.home))[0];
      if(best&&best.pm>0&&best.pm-best.home>=800)add({id:`wcr:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:best.pm-best.home,title:`Send SS ${sh.name} cruising in ${cruiseMonthsText(best.rk)}`,
        why:`In those months she would make about ${money(best.pm)} a month cruising ${ROUTES[best.rk].cruise.cname}, against ${money(best.home)} on ${ROUTES[r0].name}. She goes back to her line when the season ends.${S.lines[best.rk]?'':` It means opening the cruise (${money(2500*PX())}).`}${sh.cruiser?'':' A cruise conversion would make her better at it.'}`,
        act:[['Add it to her programme','cruiseadd',sh.id,best.rk],['View her','selship',sh.id]]});}
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
    const inVisit=k=>sh.pendingYard===k||(sh.yardAdd||[]).includes(k);
    const yard=(k,shPatch,label,why)=>{if(inVisit(k))return;const cost=refitCost(sh,k);if(!canSpend(cost))return;
      const save=econYear(sh,r0,null,shPatch).pm-curY.pm;if(save>0&&cost/save<=30)add({id:`${k==='oil'?'oil':k}:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:save,title:label,
        why:`${why} It would add about ${money(save)} a month and pay back its ${money(cost)} in about ${Math.ceil(cost/save)} months; she is out of service for ${yardDays(sh,k)} days.`,
        act:[[sh.pendingYard?'Add it to her yard visit':'Book it','setyard',sh.id,k],['Refit office','refit',sh.id,k]]});};
    if((sh.foul||0)>0.45){if(sh.cond>=70)yard('scrape',{foul:0},`Scrape the bottom of SS ${sh.name}`,`Her master reports her bottom foul: she is slower and burning more. Her condition is good, so a few days' scrape will do.`);
      else yard('dock',{foul:0,cond:Math.min(92,sh.cond+35)},`Drydock SS ${sh.name}`,`Her master reports her bottom foul: she is slower and burning more.`);}
    { const f=fatOf(sh),n=sh.replates||0;
      if(f>=62&&f<90&&n<3&&!inVisit('replate')&&canSpend(refitCost(sh,'replate'))&&shipValue(sh)>refitCost(sh,'replate'))add({id:`replate:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:250+f*4,title:`Re-plate SS ${sh.name}`,
        why:`The surveyors find her plating wasting and her frames tired. New plate and frames (${money(refitCost(sh,'replate'))}, ${yardDays(sh,'replate')} days) buy her years of safe service${n?', though less than last time':''}. Left alone she gets more dangerous every crossing and loses her steerage certificate.`,act:[['Book it','setyard',sh.id,'replate']]});
      if(f>=88&&S.ships.length>1)add({id:`scrap:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:600,title:`Send SS ${sh.name} to the breakers`,
        why:`She is worn out: ${f>=90?'no steerage certificate, double insurance, and':''} a far higher chance of a serious emergency every crossing. A loss now would go badly at the inquiry.`,act:[['Send her to the breakers','scrapship',sh.id],['View her','selship',sh.id]]}); }
    // the war at sea: each protection, when it is to be had
    if(atWar()&&sh.line&&ACTIVE.includes(sh.state)){const pm=warLossPM(sh),v=shipValue(sh),yr=p=>Math.max(1,Math.round((1-Math.pow(1-p,12))*100));
      if(pm>0.002&&!sh.zigzag)add({id:`zig:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:v*(pm-warLossPM(sh,{zigzag:true})),title:`Zigzag SS ${sh.name}`,
        why:`She has about a ${yr(pm)}% chance of being sunk in a year as she sails. Zigzagging brings it to about ${yr(warLossPM(sh,{zigzag:true}))}%, for passages about 7% longer.`,act:[['Zigzag','setship',sh.id,'zigzag',1]]});
      if(convoyOK()&&!sh.convoy&&knotsOf(sh)<20&&pm>0.002)add({id:`convoy:${sh.id}`,scope:'ship',ref:sh.id,sev:'warn',gain:v*(pm-warLossPM(sh,{convoy:true})),title:`Sail SS ${sh.name} in convoy`,
        why:`In convoy her chance of being sunk in a year falls from about ${yr(pm)}% to ${yr(warLossPM(sh,{convoy:true}))}%. She will be about a fifth slower on each passage.`,act:[['Join the convoys','setship',sh.id,'convoy',1]]});
      if(S.m>=DAZZLE_FROM&&!sh.dazzle&&!inVisit('dazzle')&&canSpend(refitCost(sh,'dazzle')))add({id:`dazzle:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:v*(pm-warLossPM(sh,{dazzle:true})),title:`Paint SS ${sh.name} in dazzle`,
        why:`Fewer hits for ${money(refitCost(sh,'dazzle'))} and ${yardDays(sh,'dazzle')} days in the yard.`,act:[[sh.pendingYard?'Add it to her yard visit':'Book it','setyard',sh.id,'dazzle']]});
      if(warGoodwill()&&!sh.gun&&!inVisit('gun')&&canSpend(refitCost(sh,'gun'))&&pm>0.002)add({id:`gun:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:v*(pm-warLossPM(sh,{gun:true})),title:`Arm SS ${sh.name}`,
        why:`A gun aft and naval gunners keep a surfaced submarine at a distance: fewer hits, for ${money(refitCost(sh,'gun'))} and ${yardDays(sh,'gun')} days in the yard.`,act:[[sh.pendingYard?'Add it to her yard visit':'Book it','setyard',sh.id,'gun']]});
      const topPrem=v*0.2*warInsRate(S.m)*2.5*(1+0.2*((S.war&&S.war.losses)||0)); // what the top-up costs a month, against the loss it covers (0.39.3: it was advised at £1,040 a month to cover £296)
      if(!sh.warTop&&(1-Math.pow(1-pm,12))>0.06&&v*0.2*pm>=0.7*topPrem)add({id:`wtop:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:v*0.2*pm-topPrem,title:`Take a private war-risk top-up on SS ${sh.name}`,
        why:`If she is sunk the state pays four fifths of her value; the rest, about ${money(v*0.2)}, would be the Line's loss. The top-up costs about ${money(topPrem)} a month, against about ${money(v*0.2*pm)} a month of expected loss.`,act:[['Take it','setship',sh.id,'warTop',1]]});}
    if(atWar()&&!sh.wcSave&&(sh.berths.t||0)+(sh.berths.tt||0)>=100){const t=sh.berths.t||0,tt=sh.berths.tt||0;
      yard('warcargo',{berths:{...sh.berths,t:0,tt:0},cargo:Math.round(sh.cargo+t*WC_T+tt*WC_TT)},`Clear SS ${sh.name}'s steerage for cargo`,`The emigrants have stopped coming and every hold fills at war rates. Her steerage decks would take about ${int(t*WC_T+tt*WC_TT)} more tons; they can be put back after the war for the same price.`);}
    // Tourist Third (0.38.0): head office never suggested it, though it was the answer to the emigrant trade's end
    if(S.m>=ym(1925,0)&&!(sh.berths.tt>0)&&(sh.berths.t||0)>=100&&!isCruise(r0)){const cv=Math.round(sh.berths.t*0.5);
      yard('tourist',{berths:{...sh.berths,t:sh.berths.t-cv,tt:(sh.berths.tt||0)+Math.round(cv*0.6)}},`Give SS ${sh.name} Tourist Third Cabin`,`Half her steerage rebuilt as about ${int(Math.round(cv*0.6))} Tourist Third cabins for students, teachers and tourists, who travel when the emigrants no longer can.`);}
    if(sh.fuel==='coal'&&yearNow()>=OIL_FROM&&yearNow()-sh.built<28)yard('oil',{fuel:'oil'},`Convert SS ${sh.name} to oil`,'Oil firing cuts her stokehold crew and her bunker bill.');
    if((sh.berths.f+sh.berths.s)>0&&(sh.fit||0)<50)yard('refurb',{fit:100},`Refurbish SS ${sh.name}`,`Her saloons are tired (fittings ${Math.round(sh.fit||0)}%), and first and second class notice.`);
    if(!(sh.up&&sh.up.reefer)&&COMM[ROUTES[r0].cargo.home.c].reefer)yard('reefer',{up:{...sh.up,reefer:true}},`Fit refrigerated holds to SS ${sh.name}`,`Her route's homeward cargo, ${COMM[ROUTES[r0].cargo.home.c].name.toLowerCase()}, needs cold holds; without them she takes only a sliver of it.`);
    if(!(sh.up&&sh.up.wireless)&&S.m>=ym(1909,0)&&(S.mail[r0]&&S.m>=ym(1910,6)||S.m>=ym(1910,6)&&(r0&&ROUTES[r0]?ROUTES[r0].calls:[]).some(p=>['NYC','NOL','GAL'].includes(p))||S.rep>=35||S.m>=ym(1937,8))&&canSpend(refitCost(sh,'wireless'))&&!inVisit('wireless'))
      {const us=S.m>=ym(1910,6)&&(r0&&ROUTES[r0]?ROUTES[r0].calls:[]).some(p=>['NYC','NOL','GAL'].includes(p));
      add({id:`wireless:${sh.id}`,scope:'ship',ref:sh.id,sev:us||S.mail[r0]?'warn':'tip',gain:us||S.mail[r0]?900:150,title:`Fit wireless to SS ${sh.name}`,
        why:`${S.m>=ym(1937,8)?(S.m>=ym(1940,0)?'Under the Ocean Aid Convention she may carry no passengers without it. ':'From 1940 the Ocean Aid Convention bars passenger ships without wireless. '):''}${wirelessRule()?`Only ships with wireless can carry the mails, or more than forty-nine passengers out of an American port${S.m<ym(1940,0)?', or tell you when she is in trouble':''}${S.mail[r0]?', and this route has a contract':''}.`:'From July 1911 American law will require wireless on any ship leaving an American port with fifty or more aboard, and only ships with it will carry the mails. Meanwhile it lets her report from sea and call for help.'} Without it, nothing is heard of her at sea unless a passing ship sees her lamps. ${money(refitCost(sh,'wireless'))} and a week in the yard.`,
        act:[[sh.pendingYard?'Add it to her yard visit':'Book it','setyard',sh.id,'wireless']]});}
    // boats, the night watch, and what a court would find if she were lost
    // only where the boats she has would not hold everyone aboard, so the law would bind (0.35.7)
    if(newCal()&&!hasBoats(sh)&&paxBerths(sh)>0&&fullSouls(sh)>boatScale(sh.grt)&&S.m>=BOAT_NEWS&&!inVisit('boats'))
      add({id:`boats:${sh.id}`,scope:'ship',ref:sh.id,sev:S.m>=BOAT_LAW?'bad':'warn',gain:S.m>=BOAT_LAW?900:500,title:`Fit boats for all to SS ${sh.name}`,
        why:`${S.m>=BOAT_LAW?`The law now limits her to ${int(boatPaxMax(sh))} passengers, as many as her boats hold after her crew.`:`From July 1913 she may carry only as many as her boats hold: ${int(Math.max(0,boatScale(sh.grt)-crewOf(sh)))} passengers after her crew.`} Boats for all cost ${money(refitCost(sh,'boats'))} and ${yardDays(sh,'boats')} days in the yard.`,
        act:[[sh.pendingYard?'Add it to her yard visit':'Book it','setyard',sh.id,'boats']]});
    if(newCal()&&radioOf(sh)&&!nightOn(sh)&&paxBerths(sh)>=200&&S.m>=ym(1910,0))add({id:`watch:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:120,title:`Keep a night watch on SS ${sh.name}`,
      why:`Her operator goes to bed at night. A second man (${money(16.8*PX())} a month) would hear a call for help after dark, and pass the night's ice warnings to her bridge.`,act:[['Keep the watch','setship',sh.id,'nightWatch',1]]});
    {const pb=potBlame(sh);if(pb.blame>=CENSURE)add({id:`${pb.blame>=GROSS?'gross':'censure'}:${sh.id}`,scope:'ship',ref:sh.id,sev:pb.blame>=GROSS?'bad':'warn',gain:pb.blame>=GROSS?1000:450,
      title:pb.blame>=GROSS?`A loss of SS ${sh.name} would be gross negligence`:`A loss of SS ${sh.name} would bring a censure`,
      why:`If she were lost now with lives, the court would find that ${pb.F.slice(0,4).join('; ')}. ${pb.blame>=GROSS?'That is gross negligence: the underwriters would not pay, the claims would have no limit, and a line that cannot pay them is wound up.':'That is a censure, and the Board of Trade would detain any unfit ship in the fleet.'}`,act:[['View her','selship',sh.id]]});}
    // crew by department: pay where morale is low, drills where skill is poor, better officers when the pool has them
    {const cw=cwOf(sh),off=offOf(sh);
      for(const d of CD_KEYS){const q=cw[d];if(deptCount(sh,d)<1)continue;
        if(q.mor<45&&q.pay<2)add({id:`cpay:${sh.id}:${d}`,scope:'ship',ref:sh.id,sev:'warn',gain:350,title:`Raise ${CDEPT[d].name.toLowerCase()} pay on SS ${sh.name}`,
          why:`Morale in her ${CDEPT[d].name.toLowerCase()} is ${Math.round(q.mor)}. Unhappy hands desert in foreign ports, walk off at home and ${d==='cat'?'serve the passengers badly':d==='eng'?'let the engines go':'work the ship badly'}. Better pay costs about ${money(cdCost(sh,d)*0.15)} a month.`,
          act:[['Raise pay','crewset',sh.id,d,'pay',q.pay+1],['Her crew','crew',sh.id]]});
        else if(q.train===0&&cwSk(sh,d)<45&&canSpend(cdCost(sh,d)*6))add({id:`ctrain:${sh.id}:${d}`,scope:'ship',ref:sh.id,sev:'tip',gain:200,title:`Start ${CDEPT[d].name.toLowerCase()} drills on SS ${sh.name}`,
          why:`Her ${CDEPT[d].name.toLowerCase()} is ${skWord(cwSk(sh,d))} (${Math.round(cwSk(sh,d))}). ${d==='eng'?'Poor engine-room hands mean more breakdowns and more coal.':d==='deck'?'A poor deck crew fights a fire or a flooding badly.':'Poor stewards put passengers off.'} Drills cost about ${money(deptCount(sh,d)*MAN[q.man][1]*TRAIN[1][1]*PX())} a month and raise skill over a year or two.`,
          act:[['Start drills','crewset',sh.id,d,'train',1],['Her crew','crew',sh.id]]});}
      for(const r of OFF_KEYS){const o=off[r];if(!o)continue;const best=((S.offPool||{})[r]||[]).slice().sort((a,b)=>b.skill-a.skill)[0];
        if(best&&o.skill<40&&best.skill>=o.skill+25)add({id:`off:${sh.id}:${r}`,scope:'ship',ref:sh.id,sev:'tip',gain:180+best.skill-o.skill,title:`Appoint ${best.name} ${OFFICER[r].name.toLowerCase()} of SS ${sh.name}`,
          why:`${o.name} is ${skWord(o.skill)} (${o.skill}). ${best.name} (${skWord(best.skill)}, ${best.skill}) is looking for a berth at ${money(offWage(best))} a month. ${OFFICER[r].does}`,
          act:[['Appoint him','appoint',sh.id,r,best.id],['Her crew','crew',sh.id]]});}}
    const bad=sh.captain&&(has(sh,'drinker')||has(sh,'lax')||sh.captain.exp<4);
    if(bad&&S.capPool&&S.capPool.length){const pick=S.capPool.slice().sort((a,b)=>capScore(b)-capScore(a))[0];
      if(capScore(pick)>capScore(sh.captain)+1)add({id:`captain:${sh.id}`,scope:'ship',ref:sh.id,sev:'tip',gain:300,title:`Replace ${sh.captain.name} on SS ${sh.name}`,
        why:`${sh.captain.name} is ${sh.captain.traits.map(t=>CAPT_TRAITS[t].name.toLowerCase()).join(' and ')||'inexperienced'}. ${pick.name} (${pick.exp} years in command${pick.traits.length?', '+pick.traits.map(t=>CAPT_TRAITS[t].name.toLowerCase()).join(', '):''}) is available at £${pick.wage} a month.`,
        act:[['Appoint him','hire',sh.id,pick.id]]});}
  })();return A1;}))add(h);
  // one ship advised onto each line a month (and onto each cruise, 0.37.2): every ship's figures assume the others stay put, so advising them all at once
  // piled the fleet onto whichever line looked best and then disappointed (0.36.2). The best move for each line stays;
  // the rest are looked at again next month with her there.
  {const best={};for(const h of A){if(!/^(move|unlay|home|wcr):/.test(h.id))continue;const a=h.act[0],rk=a&&a[3];if(!rk)continue;if(!best[rk]||h.gain>best[rk].gain)best[rk]=h;}
   for(let i=A.length-1;i>=0;i--){const h=A[i];if(!/^(move|unlay|home|wcr):/.test(h.id))continue;const a=h.act[0],rk=a&&a[3];if(rk&&best[rk]!==h)A.splice(i,1);}}
  // a man in the pool can be appointed to one ship only: where he is advised for several, the best stays (0.37.2)
  {const best={},key=h=>{const a=h.act[0];return a&&a[1]==='appoint'?'o'+a[4]:a&&a[1]==='hire'?'c'+a[3]:null;};
   for(const h of A){const q=key(h);if(q&&(!best[q]||h.gain>best[q].gain))best[q]=h;}
   for(let i=A.length-1;i>=0;i--){const q=key(A[i]);if(q&&best[q]!==A[i])A.splice(i,1);}}
  // ---- rivals, then the company: one unit, so a pass in pieces does not work them out again every frame (0.36.0) ----
  for(const h of advUnit('co',()=>{const A1=[],add=h=>A1.push(h);(()=>{
  for(const q of S.rmoves.filter(q=>q.m>=S.m-1&&q.kind==='add'&&S.lines[q.rk]))
    add({id:`rin:${q.rk}:${q.ship}`,scope:'line',ref:q.rk,sev:'warn',gain:250,title:`${RIVALS[q.o].name} has added SS ${q.ship} to ${ROUTES[q.rk].name}`,
      why:'More rival berths on the route means a smaller slice for each of your ships, especially in steerage. Consider a better table or more advertising to hold your share, or moving a ship somewhere less crowded.',act:[['View line','selline',q.rk]]});
  // ---- company: cash, buying, standing, shore establishment ----
  const rc=runningCost();
  if(S.cash<1.5*rc&&S.ships.length>1)add({id:'reserve',scope:'co',sev:'warn',gain:6e5,title:'Your cash reserve is thin',
    why:`You hold ${money(S.cash)} against running costs of about ${money(rc)} a month, before coal and port bills. One bad month could put you in the bank's hands. Borrow while you can, lay up a loss-making ship, or hold off on buying.`,act:[['Bank','tabgo','finance']]});
  const deps=S.market.map(m=>buyTerms(m).dep);
  const fleetV=S.ships.reduce((a,x)=>a+shipValue(x),0);
  // at the top of the boom head office says why it will not advise buying or building
  if(shipMkt()>1.3&&newCal()&&S.m<M21)add({id:'boomwait',scope:'co',sev:'tip',gain:1,title:'Hold off buying and building until the boom breaks',
    why:`Second-hand ships fetch ${Math.round((shipMkt()-1)*100)}% over their normal price and new ones cost ${Math.round((warBuild(S.m)-1)*100)}% more. When the boom ends, as booms do, a ship bought now will be worth a third to a half of what you paid, while the loan on her stays the same. If a buyer offers for one of yours, that is the time to sell.`,act:[]});
  // not at the top of the 1919 and 1920 boom: ships bought at two and a half times their worth lose most of it in the crash
  if(S.market.length&&shipMkt()<=1.3&&S.cash-reserve>Math.min(...deps)&&(!S.ships.length||S.debt<0.6*fleetV)){
    let best=null;
    for(const m of S.market){const dep=buyTerms(m).dep;if(fatOf(m)>=70||S.cash-reserve<dep||S.debt+m.price-dep>0.62*(fleetV+m.price))continue;
      for(const rk of Object.keys(ROUTES)){if(!routeOpen(rk,S.m))continue;const q=econYear(m,rk); // never a closed trade (0.35.6)
        const pay=q.pm-(m.price-dep)*loanRate()/12;if(!best||pay>best.pay)best={m,rk,pay,dep};}}
    // only when cash is really piling up: well over a year of running costs beyond the deposit
    if(best&&best.pay>(slump(S.m)>0.3?1500:500)&&S.cash-best.dep>12*rc)add({id:`buy:${best.m.name}`,scope:'co',sev:'tip',gain:best.pay,title:'Put idle cash to work',
      why:`SS ${best.m.name} (${money(best.dep)} down) could earn about ${money(best.pay)} a month on ${ROUTES[best.rk].name}, averaged over a year of seasons and after mortgage interest. You would still hold three months of running costs in reserve.`,
      act:[['Buy her','buyship',best.m.name,best.rk],['See brokers','tabgo','brokers']]});
  }
  // a new ship, when the line can carry the cost
  const bi=warNoBuild()||warBuild(S.m)>1.1?null:buildIdea(); // no ordering at inflated prices either
  if(bi)add({id:'build',scope:'co',sev:'tip',gain:bi.pm,title:`Build ${/^[aeiou]/i.test(PURPOSES[bi.d.purpose].name)?'an':'a'} ${PURPOSES[bi.d.purpose].name.toLowerCase()} for ${ROUTES[bi.rk].name}`,
    why:`The traffic figures suggest a ${int(bi.d.grt)}-ton, ${bi.d.knots}-knot ${PURPOSES[bi.d.purpose].name.toLowerCase()} would clear about ${money(bi.pm)} a month there at today's trade: about ${fmt(bi.price)}, paying for herself in ${Math.round(bi.price/(bi.pm*12))} years. Open the drawing office to work it up.`,
    act:[['Open the drawing office','build',bi.d]]});
  // piers where your ships call often enough to repay one within four years
  const calls={};for(const sh of S.ships)if(sh.line&&ACTIVE.includes(sh.state)){const r=ROUTES[sh.line],rt=sailings(knotsOf(sh),sh.line);
    r.calls.forEach((p,i)=>{const end=i===0||i===r.calls.length-1;calls[p]=(calls[p]||0)+rt*(end?1:2)*sh.grt*(end?(r.cruise?0.03:0.08):(r.cruise?0.02:0.04));});}
  const early=S.m-(S.m0??M21)<12&&S.ships.length<2;
  if(!early)for(const p in calls){if(S.shore.piers[p]||!PIER_COST[p]||p==='QUE'||p==='MOV')continue; // tender anchorages (0.37.2)
    const save=calls[p]*0.6-350,cost=PIER_COST[p];
    if(save>0&&cost/save<=48&&canSpend(cost))add({id:`pier:${p}`,scope:'co',sev:'tip',gain:save,title:`Build a pier at ${PN[p]}`,
      why:`Your ships pay about ${money(calls[p])} a month in dues there. Your own pier cuts that by 60% and takes a day off each turnaround. ${money(cost)}, repaid in about ${Math.ceil(cost/save)} months.`,act:[['Build it','shorebuy','pier',p],['Shore','tabgo','shore']]});}
  if(!early)for(const a in AGENCY){if(S.shore.agents[a])continue;const cost=AGENCY[a].cost;if(!canSpend(cost))continue;
    const ships=S.ships.filter(x=>x.line&&ACTIVE.includes(x.state)&&AGENCY[a].ports.some(p=>ROUTES[x.line].calls.includes(p)));if(!ships.length)continue;
    let before=0;for(const x of ships)before+=econ(x,x.line).pm;S.shore.agents[a]=true;let after=0;try{for(const x of ships)after+=econ(x,x.line).pm;}finally{delete S.shore.agents[a];}
    const save=after-before-300;if(save>0&&cost/save<=30)add({id:`agency:${a}`,scope:'co',sev:'tip',gain:save,title:`Open ${AGENCY[a].name}`,
      why:`Booking agents feed passengers to every line calling at ${AGENCY[a].ports.slice(0,4).map(p=>PN[p]).join(', ')}${AGENCY[a].ports.length>4?' and more':''}. About ${money(save)} a month more after their £300 a month, for ${money(cost)} to set up.`,act:[['Appoint them','shorebuy','agency',a],['Shore','tabgo','shore']]});}
  // spare berths at a pier or a yard cost the fleet nothing to sell; hostels and agents help rivals on your own routes, so they are left to you
  for(const key of outKeys()){const k=key.split(':')[0];if((k!=='pier'&&k!=='yard')||outSelling(key))continue;const e=(S.shore.est||{})[key];if(!e||e.gross<400*PX())continue;
    add({id:'sell:'+key,scope:'co',sev:'tip',gain:e.gross,title:`Sell spare ${k==='pier'?'berths at your '+PN[key.split(':')[1]]+' pier':'berths at your yard on '+YARD_PORTS[key.split(':')[1]]}`,
      why:`Other lines would pay about ${money(e.gross)} a month for what your own ships do not use. It helps them a little: ${k==='pier'?'they save on dues':'their repairs cost them a little less'}.`,act:[['Sell spare','shoresell',key,1],['Shore','tabgo','shore']]});}
  const fuelLast=LM?-(LM.cat.fuel||0):0;
  if(fuelLast>6000&&!(S.shore.bunker&&S.shore.bunker.until>=S.m)&&canSpend(shoreCost('bunker')))add({id:'bunker',scope:'co',sev:'tip',gain:fuelLast*0.12-10000/24,title:'Sign a bunker contract',
    why:`You spent ${money(fuelLast)} on coal and oil last month. A two-year contract with a bunkering firm takes 12% off for ${money(shoreCost('bunker'))} down.`,act:[['Sign it','shorebuy','bunker'],['Shore','tabgo','shore']]});
  // overdrawn and going deeper: sell the ship that earns least for her value before the bank forecloses
  if(S.cash<-0.35*odLimit()&&S.ships.length>1&&!S.ships.some(x=>x.pendingExit)){
    const w=S.ships.filter(x=>x.state!=='lost'&&x.state!=='yard').map(x=>({x,y:(x.pl||[]).reduce((a,v)=>a+v,0)/Math.max(1,shipValue(x))})).sort((a,b)=>a.y-b.y)[0];
    if(w)add({id:'raise:'+w.x.id,scope:'co',sev:'bad',gain:5000,title:`Raise cash: sell SS ${w.x.name}`,
      why:`The account is ${money(-S.cash)} overdrawn and the bank forecloses at ${money(odLimit())}. SS ${w.x.name} has earned least for what she is worth over the last year; selling her brings in about ${money(shipValue(w.x)*0.9)}.`,
      act:[['Sell her','sellship',w.x.id],['View her','selship',w.x.id]]});}
  if(S.ships.length>=4&&Object.keys(S.depts).length===0)add({id:'dept',scope:'co',sev:'tip',gain:200,title:'Your line has outgrown one office',
    why:'With four ships or more, departments pay their way: a Fares Office, a Traffic Department, a Marine Superintendent and a Crewing Office can each act on their own advice every month. See the Company tab.',act:[['Head office','tabgo','company']]});
  if(S.rep<25&&Object.values(S.lines).some(l=>l.service===0))add({id:'rep-low',scope:'co',sev:'warn',gain:300,title:'Your name is suffering',
    why:'Spartan tables lower your standing, and standing is what first class passengers buy. Consider Standard service.',act:[]});
  // the City's whispers: a bank in trouble takes most of the cash on deposit with it, and Consols are safe (0.35.4)
  if(S.crash&&S.crash.stage==='rumour'&&S.crash.bank&&S.cash>3*runningCost()+5000*PX())add({id:'bankrun'+S.crash.m0,scope:'co',sev:'bad',gain:S.cash*0.5,title:'Move spare cash out of the bank',
    why:`${BANK_NAME[0].toUpperCase()+BANK_NAME.slice(1)} is said to be overextended. If it fails it takes most of the cash on deposit with it; government stock is safe. Keep a few months' running costs in the account and put the rest into Consols until the whispers pass.`,act:[['Finance','tabgo','finance']]});
  if(!S.conf&&confOpen()&&Object.keys(S.wars).length)add({id:'conf-war',scope:'co',sev:'tip',gain:200,title:'The conference is an option',
    why:'Members cannot be targeted by rate wars. The price is a fare floor at 95% of the line rate and a cap on steerage. Worth it if you keep provoking wars.',act:[['Conference','tabgo','company']]});
  })();return A1;}))add(h);
  // the situation has passed: it may be raised afresh (only on a complete pass)
  if(!ADV_SHORT)for(const id in S.dismiss)if(S.dismiss[id]===UNTIL_CLEAR&&!raised.has(id))delete S.dismiss[id];
  A.sort((a,b)=>b.gain-a.gain);
  if(quiet)A.splice(0,A.length,...A.filter(h=>/^(boats|gross|censure):/.test(h.id))); // the weeks after the loss: routine advice keeps quiet
  SVC_PASS=null;ADV_CACHE={key:ADV_SHORT?null:key,list:A,pending:ADV_SHORT?key:null};ADV_BUDGET=Infinity;
  if(ADV_SHORT&&typeof UI!=='undefined')UI.advMore=true; // the clock carries the pass on, a little each frame
  return A;
}
/* advice stays on the desk until it is acted on or put aside. A note with nothing to do stays away once read, until the
   situation passes and comes round again; a suggestion put aside comes back after a while if it still stands */
const UNTIL_CLEAR=1e9,DOING=['crewset','appoint','crew','setfare','setfares','setlineopt','setship','moveship','setyard','sellship','scrapship','hire','shorebuy','openmove','buyship','build','refit'];
const restFor=h=>h.id.startsWith('buy:')?18:h.sev==='tip'?6:3;
function putAside(id){const h=advice().find(q=>q.id===id);if(!h)return;S.dismiss[id]=h.info?UNTIL_CLEAR:S.m+restFor(h);ADV_CACHE.key=null;}
/* the screen's advice: while a pass is under way the screen shows what it has so far and leaves the work to the clock,
   which gives it a few milliseconds a frame and redraws once it is complete (0.36.0) */
function shownAdvice(){if(S.advSeen)delete S.advSeen;const k=advKey();if(ADV_CACHE.key===k)return ADV_CACHE.list;
  if(ADV_CACHE.list&&ADV_CACHE.list.length&&typeof UI!=='undefined'&&UI.speed>0){UI.advMore=true;return ADV_CACHE.list;} // running: last month's until the clock has worked it out
  return advice(8);}
function advStep(){const k=advKey();if(ADV_CACHE.key===k)return;advice(8);if(ADV_CACHE.key===k)UI.dirty=true;}
const capScore=c=>Math.min(c.exp,25)/5+c.traits.reduce((a,t)=>a+(CAPT_TRAITS[t].good?2:-3),0);

/* a yard job the refit office would offer her now: no gyro stabilisers in 1900 (0.35.5) */
function yardJobOk(sh,k){if(typeof RF_JOBS==='undefined')return true;for(const [,L] of RF_JOBS)for(const j of L)if(j[0]===k)return !!j[2](sh);return true;}
/* ---------- actions: shared by buttons, departments and the test harness ---------- */
const floorFare=(rk,c,v)=>S.conf&&!ROUTES[rk].cruise&&ROUTES[rk].ref[c]?Math.max(v,confFloor(rk,c)):v;
function doAction(act,d){MOD_EPOCH++;
  const ship=id=>S.ships.find(q=>q.id===id);
  switch(act){
    // inside the conference no fare is set below its floor, by head office or a department (0.36.2)
    case 'setfare':{const [rk,c,v]=d;if(S.lines[rk]){const L=S.lines[rk],nv=floorFare(rk,c,v);if(L.fares[c]!==nv)(L.set=L.set||{})['fare'+c]=S.m;L.fares[c]=nv;return true;}return false;}
    case 'setfares':{const [rk,f,s2,t]=d;if(S.lines[rk]){Object.assign(S.lines[rk].fares,{f:floorFare(rk,'f',f),s:floorFare(rk,'s',s2),t:floorFare(rk,'t',t)});return true;}return false;}
    case 'linehands':{const [rk,v]=d;if(!S.lines[rk])return false;S.lines[rk].hands=!!v;return true;}
    case 'setlineopt':{const [rk,k,v]=d;if(S.lines[rk]){if(S.lines[rk][k]!==v){(S.lines[rk].set=S.lines[rk].set||{})[k]=S.m;(S.lines[rk].was=S.lines[rk].was||{})[k]=S.lines[rk][k];}S.lines[rk][k]=v;return true;}return false;}
    case 'setship':{const [id,k,v]=d;const x=ship(id);if(x){x[k]=v;return true;}return false;}
    case 'setwc':case 'cruiseadd':{const [id,rk]=d;const x=ship(id);if(!x)return false;cruiseProg(x);
      if(!rk){x.cp=[];return true;} // she finishes the cruise she is on, then goes back to her line
      if(!ROUTES[rk]||!isCruise(rk)||!routeOpen(rk,S.m))return false;
      if(!S.lines[rk]){const fee=Math.round(2500*PX());if(S.cash<fee)return false;book('office',-fee,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};news(`The Morven Line opens ${ROUTES[rk].name}.`,'good');}
      x.cp=x.cp||[];if(!x.cp.includes(rk))x.cp.push(rk);delete x.wcHold;
      if(cruiseFor(x,S.m)){if(x.state==='laid'){x.state='port';x.portLeft=1;}if(x.state==='port')cruiseSeason(x);} // in season: she switches now if she is in port
      return true;}
    case 'cruisedrop':{const [id,rk]=d;const x=ship(id);if(!x)return false;cruiseProg(x);x.cp=(x.cp||[]).filter(k=>k!==rk);return true;}
    case 'moveship':{const [id,rk]=d;const x=ship(id);if(!x)return false;const was=x.line;if(rk&&rk!==was)x.movedAt=S.m;if(onProgramme(x)&&rk!==x.line&&x.ownerSet===S.t){x.wcHold=S.m+6;delete x.homeLine;} /* the owner's own choice wins this season */x.line=rk||null;if(x.line&&x.state==='laid'){x.state='port';x.portLeft=1;}if(was!==x.line)mailLeft(was);return true;}
    case 'setyard':{const [id,k]=d;const x=ship(id);if(!x||!yardJobOk(x,k))return false;if(x.pendingYard||x.state==='yard')return addYardJob(x,k);
      if(x.state==='sea'||x.state==='repo'){x.pendingYard=k;return true;}if(S.cash>=refitCost(x,k)){enterYard(x,k);return true;}return false;}
    case 'crewset':{const [id,dp,k,v]=d;const x=ship(id);if(!x||!CDEPT[dp]||!['man','pay','train'].includes(k))return false;cwOf(x)[dp][k]=clamp(v|0,0,2);if(k==='pay')x.pay=cwOf(x).deck.pay;return true;}
    case 'appoint':{const [id,r,cid]=d;const x=ship(id);if(!x)return false;return appointOfficer(x,r,cid);}
    case 'scrapship':{const [id]=d;const x=ship(id);if(!x||S.ships.length<2)return false;if(x.state==='sea'||x.state==='repo')x.pendingExit='scrap';else exitShip(x,'scrap');return true;}
    case 'sellship':{const [id]=d;const x=ship(id);if(!x||S.ships.length<2||x.state==='req'||rescueNoSale())return false;if(x.state==='sea'||x.state==='repo')x.pendingExit='sell';else exitShip(x,'sell');return true;}
    case 'hire':{const [id,cid]=d;const x=ship(id),c=(S.capPool||[]).find(q=>q.id===cid);if(!x||!c)return false;
      const old=x.captain;x.captain=c;S.capPool=S.capPool.filter(q=>q!==c);if(old&&old.age<63)S.capPool.push(old);news(`${c.name} takes command of SS ${x.name}.`);return true;}
    case 'shorebuy':{const [kind,key]=d,c=shoreCost(kind,key),sh=S.shore;if(!c||S.cash<c)return false;
      if(kind==='pier'){if(sh.piers[key])return false;sh.piers[key]=S.m;news(`The Morven Line opens its own pier at ${PN[key]}.`,'good');}
      else if(kind==='agency'){if(sh.agents[key])return false;sh.agents[key]=S.m;news(`${AGENCY[key].name} now book for the Morven Line.`,'good');}
      else if(kind==='fagent'){(sh.fagents=sh.fagents||{});if(sh.fagents[key])return false;sh.fagents[key]=S.m;news(`${FAGENCY[key].name} now canvass cargo for the Morven Line.`,'good');}
      else if(kind==='shed'){(sh.sheds=sh.sheds||{});if(sh.sheds[key])return false;sh.sheds[key]=S.m;news(`The Morven Line's transit sheds open at ${PN[key]}.`,'good');}
      else if(kind==='cold'){(sh.cold=sh.cold||{});if(sh.cold[key])return false;sh.cold[key]=S.m;news(`The Morven Line's cold store opens at ${PN[key]}.`,'good');}
      else if(kind==='hostel'){if(sh.hostels[key])return false;sh.hostels[key]=S.m;news(`The Morven Line emigrant hostel opens at ${PN[key]}.`,'good');}
      else if(kind==='yard'){if(sh.yards[key])return false;sh.yards[key]=S.m;news(`The Morven Line buys a repair yard on ${YARD_PORTS[key]}.`,'good');}
      else if(kind==='slip'){if(!sh.yards[key]||sh.slip)return false;sh.slip=key;news(`The Morven Line lays down a building slip at its yard on ${YARD_PORTS[key]}. It can now build its own ships.`,'good',true);}
      else if(kind==='bunker'){if(sh.bunker&&sh.bunker.until>=S.m)return false;sh.bunker={until:S.m+23};book('shore',-c);news('Bunker contract signed: 12% off coal and oil for two years.','good');return true;}
      else if(kind==='dept'){if(S.depts[key])return false;S.depts[key]={auto:false,since:S.m,head:makeHead(key)};book('office',-c);news(`The ${DEPTS[key].name} opens at head office.`,'good');return true;}
      else return false;
      S.cash-=c;return true;}
    case 'shoresell':{const [key,on]=d;if(!outKeys().includes(key))return false;(S.shore.sell=S.shore.sell||{})[key]=!!on;if(!on)delete S.shore.sell[key];return true;}
    case 'deptmode':{const [k,auto]=d;if(!S.depts[k])return false;S.depts[k].auto=!!auto;return true;}
    case 'openmove':{const [id,rk]=d;const x=ship(id);if(!x)return false;if(!S.lines[rk]){const fee=Math.round(2500*PX());if(S.cash<fee||!routeOpen(rk,S.m))return false;book('office',-fee,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};news(`The Morven Line opens a ${ROUTES[rk].name} service.`,'good');}
      return doAction('moveship',[id,rk]);}
    case 'buyship':{const [name,rk]=d;const m=S.market.find(q=>q.name===name);if(!m||(rk&&!routeOpen(rk,S.m))||!buyShip(m))return false;
      if(rk)doAction('openmove',[m.id,rk]);return true;}
    case 'newhead':{const [k,i]=d;const o=S.depts[k];if(!o||!o.cands||!o.cands[i])return false;const sev=o.head?o.head.wage*3:0;if(S.cash<sev)return false;
      if(sev)book('office',-sev);const h=o.cands[i];news(`${o.head?o.head.name+' leaves with three months\' pay. ':''}${h.name} becomes ${DEPTS[k].head}.`);o.head=h;o.cands.splice(i,1);return true;}
    case 'build':{const [dz]=d;if(typeof openDesigner!=='function')return false;UI.dz=JSON.parse(JSON.stringify(dz));openDesigner();return true;}
    case 'propyes':{const [pid]=d;const p=(S.props||[]).find(q=>q.id===pid);if(!p)return false;S.props=S.props.filter(q=>q!==p);
      return doAction(p.act,p.d);}
    case 'propno':{const [pid]=d;const p=(S.props||[]).find(q=>q.id===pid);if(!p)return false;S.props=S.props.filter(q=>q!==p);S.dismiss[pid]=S.m+(p.act==='moveship'?3:12);
      if(p.act==='openmove'){S.dismiss['nomove:'+p.d[0]+':'+p.d[1]]=S.m+12;}return true;}
  }
  return false;
}
function shoreCost(kind,key){const p=PX();return kind==='fagent'?FAGENCY[key]&&Math.round(FAGENCY[key].cost*p):kind==='shed'?Math.round(SHED_COST*p):kind==='cold'?Math.round(COLD_COST*p):kind==='pier'?PIER_COST[key]:kind==='agency'?AGENCY[key]&&AGENCY[key].cost:kind==='hostel'?Math.round(35000*p):kind==='yard'?Math.round(150000*p):kind==='bunker'?Math.round(10000*p):kind==='slip'?Math.round(OWN_SLIP_COST*p):kind==='dept'?DEPTS[key]&&DEPTS[key].cost:0;}
/* the best line for a ship, preferring lines already open: a new line must earn clearly more to be worth opening */
/* kept for the month while the fleet's lines and the Line's standing stay as they are: a year of four seasons on every
   route for every ship is most of the advice's time with a big fleet (0.36.0) */
const BL_CACHE={key:null,m:{}};
function bestLine(sh,exclude){
  const fk=S.m+'|'+Math.round(S.rep)+'|'+Object.keys(S.lines).join(',')+'|'+S.ships.map(x=>x.line||'-').join(',');
  if(BL_CACHE.key!==fk){BL_CACHE.key=fk;BL_CACHE.m={};}
  const ck=sh.id+'|'+exclude+'|'+sh.state+'|'+sh.speed;if(ck in BL_CACHE.m)return BL_CACHE.m[ck];
  return BL_CACHE.m[ck]=bestLine0(sh,exclude);}
function bestLine0(sh,exclude){
  let bo=null,ba=null;
  for(const rk of Object.keys(ROUTES)){if(rk===exclude)continue;
    if(!routeOpen(rk,S.m))continue;
    if(!S.lines[rk]&&S.dismiss['nomove:'+sh.id+':'+rk]>S.m)continue;
    const q=econYear(sh,rk);if(S.lines[rk]&&(!bo||q.pm>bo.pm))bo={rk,pm:q.pm};if(!ba||q.pm>ba.pm)ba={rk,pm:q.pm};}
  if(ba&&bo&&!S.lines[ba.rk]&&(bo.pm>=ba.pm*0.7||ba.pm-bo.pm<600))return bo;
  return ba;
}
/* every six months the traffic figures are run for a new ship; only when the line could pay for one */
function buildIdea(){
  if(S.ships.length<3||(S.orders||[]).length||yearNow()<yearOfM(S.m0??M21)+2)return null;
  if(S.buildIdea&&S.m-S.buildIdea.m<6)return S.buildIdea.v;
  let best=null;const reach=S.cash+headroom();
  for(const pk of ['inter','emig','mixed','cargo','reefer','tourist','express','cruise']){if(!techOn(PURPOSES[pk].from,yearNow()))continue;
    const d=defaultDesign(pk);d.name='';const f=designForecast(d);if(!f.best||f.best.pm<=0)continue;
    if(reach<f.st.price*0.7)continue;const yrs=f.st.price/(f.best.pm*12);if(yrs>9)continue;
    if(!best||yrs<best.yrs)best={d,rk:f.best.rk,pm:Math.round(f.best.pm),price:f.st.price,yrs};}
  S.buildIdea={m:S.m,v:best};return best;
}
/* a line with a mail contract and no ship left on it: say so at once, before the Post Office does (0.35.6) */
function mailLeft(rk){if(!rk||!S.mail[rk]||S.ships.some(x=>x.line===rk&&x.state!=='laid'))return;
  news(`No ship is left on ${ROUTES[rk].name}, which carries the mail. Without a sailing this month the Post Office will warn the Line, and after two it ends the contract.`,'bad',true);}
/* ---------- departments ---------- */
const HEAD_FIRST=['Walter','Robert','Hugh','Thomas','Alexander','Ian','Gordon','Norman','Stanley','Leonard','Margaret','Agnes'],HEAD_LAST=['Paterson','Galbraith','Rennie','Muir','Hendry','Barr','Lindsay','Crawford','Nisbet','Somerville','Bain','Kerr'];
function makeHead(k,R=Math.random){const comp=Math.round(35+R()*55),bold=R()<0.5;
  return {name:`${HEAD_FIRST[Math.floor(R()*HEAD_FIRST.length)]} ${HEAD_LAST[Math.floor(R()*HEAD_LAST.length)]}`,comp,bold,wage:Math.round((30+comp*0.9)*PX())};}
const compWord=c=>c<45?'muddled':c<60?'plodding':c<72?'capable':c<84?'sharp':'first-rate';
function deptCost(k){const D=DEPTS[k],o=S.depts[k],[b,perShip,perLine]=D.staff;
  const staff=Math.ceil(b+perShip*S.ships.length+perLine*Object.keys(S.lines).length),head=o&&o.head?o.head.wage:0;
  const clerks=staff*CLERK_WAGE,rent=D.rent+Math.max(0,staff-4)*6,sundries=Math.round(20+staff*3);
  return {staff,head,clerks,rent,sundries,total:head+clerks+rent+sundries};}
/* big decisions a department may propose but never takes on its own */
const BIG=['openmove','sellship','buyship','build','setwc','cruiseadd'];
function propose(k,h,act,d){
  S.props=(S.props||[]).filter(p=>S.m-(p.m||0)<=2); // a proposal nobody answers lapses after two months
  const id=h.id;
  if(S.props.some(p=>p.id===id)||(S.dismiss[id]&&S.dismiss[id]>S.m))return;
  S.props.push({id,dept:k,title:h.title,why:h.why,act,d,m:S.m});
  news(`${DEPTS[k].name} proposes: ${h.title}. See Needs attention.`,'',false);
}
/* department heads and candidates, monthly; the acting itself happens weekly in deptWeek */
function runDepartments(){
  S.props=(S.props||[]).filter(p=>S.m-p.m<3);
  for(const k of Object.keys(S.depts)){const o=S.depts[k];if(!o.head)o.head=makeHead(k);if(S.m%3===0||!o.cands)o.cands=[makeHead(k),makeHead(k)];}
}
/* acting departments go through their desks every week, a little at a time */
function deptWeek(){
  const acting=Object.keys(S.depts).filter(k=>S.depts[k].auto);if(!acting.length)return;
  // on the screen with the clock running, the departments work from the last complete advice: a fresh pass is done a few
  // milliseconds a frame, and they wait a week rather than freeze the screen (0.36.1)
  let A;if(typeof document!=='undefined'&&typeof UI!=='undefined'&&UI.speed>0){if(ADV_CACHE.key!==advKey()){UI.advMore=true;return;}A=ADV_CACHE.list;}
  else{ADV_CACHE.key=null;A=advice();}
  // a department's desk grows with the fleet: one more pair of hands for every dozen ships (0.36.1)
  const hands=Math.max(1,Math.ceil(S.ships.length/12));
  for(const k of acting){const o=S.depts[k],c=(o.head?o.head.comp:50)/100,R=Math.random;
    if(R()<(1-c)*0.3){if(R()<0.15)news(`${DEPTS[k].name}: the ${DEPTS[k].head.toLowerCase()} reports a backlog of paperwork. Nothing done this week.`);continue;}
    const cap=(1+Math.floor(c*1.5))*hands;let done=0,movedNow=0;o.last=o.last||{};o.moved=o.moved||{};
    // only what its standing orders allow; the rest stays with the owner (an item under no order is proposed as before)
    const mine=A.filter(h=>h.dept===k&&h.act[0]&&h.gain>=(o.head&&o.head.bold?120:250)&&(!orderOf(h)||orderOn(k,orderOf(h)))&&!lineKept(h));
    for(let i=0;i<mine.length&&done<cap;i++){
      // a weaker head sometimes takes the wrong item first
      let h=mine[i];if(R()<(1-c)*0.35&&mine.length>1)h=mine[Math.floor(R()*mine.length)];
      const [,act,...d0]=h.act[0],d=d0.slice(),key=h.id.split(':').slice(0,2).join(':');
      // laying a ship up is the owner's call: the department proposes it rather than doing it
      // laying up is done under the Traffic Department's standing order; without it, proposed to the owner
      if(BIG.includes(act)||(act==='moveship'&&!d[1]&&!orderOn(k,'layup'))){propose(k,h,act,d);continue;}
      if(!['setfare','setfares','setlineopt','setship','moveship','setyard','hire','crewset','appoint'].includes(act))continue;
      if(act==='setyard'&&!canSpend(refitCost(S.ships.find(q=>q.id===d[0])||{grt:0},d[1])))continue;
      if(act==='moveship'&&d[1]&&!S.lines[d[1]])continue;
      if(act==='moveship'){const x=S.ships.find(q=>q.id===d[0]);if(x&&((x.cp||[]).length||onProgramme(x)))continue;} // her cruising is the owner's choice
      // one ship moved a week at most for every dozen in the fleet (0.36.1); a moved ship is left alone for two months to show what she can do
      if(act==='moveship'&&(movedNow>=hands||o.moved[d[0]]>S.t-60))continue;
      // a ship the owner has placed or set himself is left alone for three months
      if((act==='moveship'||act==='setship')&&((S.ships.find(q=>q.id===d[0])||{}).ownerSet>S.t-90))continue;
      // a crew the owner has set himself is left alone for three months
      if((act==='crewset'||act==='appoint')&&((S.ships.find(q=>q.id===d[0])||{}).crewSet>S.t-90))continue;
      // no second thoughts on the same item inside three weeks
      if(o.last[key]>S.t-21)continue;
      // fares set by eye, not to the shilling
      if(act==='setfare'&&R()<(1-c)*0.8){const cur=(S.lines[d[0]]||{fares:{}}).fares[d[1]],up=d0[2]>cur;d[2]=Math.max(1,Math.round(d[2]*(0.9+R()*0.2)));
        if(cur!==undefined){if(up&&d[2]<=cur)d[2]=cur+1;if(!up&&d[2]>=cur)d[2]=Math.max(1,cur-1);}} // by eye, but never the wrong way (0.35.4)
      if(doAction(act,d)){done++;if(act==='moveship'){movedNow++;o.moved[d[0]]=S.t;}o.last[key]=S.t;
        news(`${DEPTS[k].name}: ${h.title}${act==='setfare'&&d[2]!==d0[2]?` (set at £${d[2]})`:''}.`);S.dismiss[h.id]=S.m;ADV_CACHE.key=null;}}
  }
  ADV_CACHE.key=null;
}
function adviceHTML(list,empty){
  if(!list.length)return empty?`<p class="note">${empty}</p>`:'';
  return list.map(h=>{const dn=h.dept==='sec'?'Mr Ferguson':DEPTS[h.dept].name,own=h.dept!=='sec'&&S.depts[h.dept];
    return `<div class="advice ${h.sev}" data-key="${h.id}"><div class="row"><strong>${h.title}</strong>${h.gain>0&&h.gain<1e5?`<span class="chip sea">+${money(h.gain)}/mo</span>`:''}</div>
    <p class="note">${h.why}</p><div class="row"><div class="btns">${h.act.map(a=>{const [l,act,...d]=a;return `<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${d[0]}"`:''} data-d='${JSON.stringify(d)}' ${act==='selline'?`data-id="${d[0]}"`:''}>${l}</button>`;}).join('')}
    <button class="btn quiet" data-act="dismiss" data-id="${h.id}">${h.info?'Understood':'Not now'}</button></div><span class="meta">${dn}${own?(own.auto?' · acting':' · advising'):''}</span></div></div>`;}).join('');
}
