/* ================= OUTSIDE WORK ================= */
/* What the Morven Line owns ashore can sell its spare capacity to the other lines: berths at its piers, work at its
   repair yards, beds in its emigrant hostels, and bookings by its passenger agents and freight canvassers. Each place
   has a switch between own use only (the default) and selling what the fleet does not need. The rival companies pay
   for it out of their own cash, and they gain by it too, which is the trade-off: a shared hostel or agency wins them
   passengers and cargo on the routes it serves, and cheap berths and repairs leave them more money to build with.
   Keys: 'pier:NYC', 'yard:GLA', 'hostel:LIV', 'agency:british', 'fagent:africa'. */
const OUT_PIER_CAP=10;       // berthings a month a pier can take
const OUT_PIER_FEE=0.007;    // pounds per gross ton a rival pays to berth (1921 money); it saves about 0.048 in dues
const OUT_YARD_BERTHS=3,OUT_YARD_RATE=550;  // a yard's berths, and what outside work pays per spare berth-month (1921 money)
const OUT_HOSTEL_CAP=3000,OUT_HOSTEL_FEE=0.12; // beds a month, and the net fee per emigrant (1921 money, about half a crown)
const OUT_AGENCY_COMM=0.00025,OUT_FAGENT_COMM=0.0003; // the agents' net share of the rival takings on the routes they serve
const OUT_KINDS={pier:'Pier',yard:'Repair yard',hostel:'Emigrant hostel',agency:'Booking agents',fagent:'Freight canvassers'};

/* every place the Line owns that could sell */
function outKeys(){const s=S.shore||{},k=[];
  for(const p in s.piers||{})k.push('pier:'+p);for(const p in s.yards||{})k.push('yard:'+p);for(const p in s.hostels||{})k.push('hostel:'+p);
  for(const a in s.agents||{})k.push('agency:'+a);for(const a in s.fagents||{})k.push('fagent:'+a);return k;}
const outSelling=key=>!!(S.shore&&S.shore.sell&&S.shore.sell[key]);
const outCalls=rk=>ROUTES[rk].calls;
/* the ports a region's agents serve */
const outRegionPorts=key=>{const [k,a]=key.split(':');return k==='agency'?(AGENCY[a]||{}).ports||[]:k==='fagent'?(FAGENCY[a]||{}).ports||[]:[];};
/* how often a ship on a route calls at a port each month: once at each end of the round trip, twice in between */
function outCallsAt(rk,p,perMonth){const c=outCalls(rk);if(!c.includes(p))return 0;return perMonth*(c[0]===p||c[c.length-1]===p?1:2);}

/* what selling does for the rivals on a route: shared hostels and booking agents win them passengers */
function outAppeal(rk,c){
  const sell=S.shore&&S.shore.sell;if(!sell)return 1;let f=1;const calls=outCalls(rk),st=c==='t'||c==='tt';
  for(const key in sell){if(!sell[key])continue;const [k,v]=key.split(':');
    if(k==='hostel'&&st&&calls.includes(v)&&S.shore.hostels[v])f*=1.06;
    else if(k==='agency'&&S.shore.agents[v]&&AGENCY[v]&&AGENCY[v].ports.some(p=>calls.includes(p)))f*=st?1.035:1.015;}
  return f;
}
/* and shared canvassers win them cargo */
function outCargo(rk){
  const sell=S.shore&&S.shore.sell;if(!sell)return 1;let f=1;const calls=outCalls(rk);
  for(const key in sell){if(!sell[key])continue;const [k,v]=key.split(':');if(k==='fagent'&&(S.shore.fagents||{})[v]&&FAGENCY[v]&&FAGENCY[v].ports.some(p=>calls.includes(p)))f*=1.04;}
  return f;
}

/* one place's outside work this month: what it would earn, who pays, what they gain, and how busy it is.
   stats is routeStats for every route this month (from the rivals' month). */
function outWork(key,stats,m){
  const [k,v]=key.split(':'),px=PX(),from={},gain={},add=(o,f,g)=>{from[o]=(from[o]||0)+f;gain[o]=(gain[o]||0)+(g||0);};
  let use=0,cap=0,own=0,note='';
  if(k==='pier'){
    cap=OUT_PIER_CAP;
    for(const sh of S.ships)if(sh.line&&ACTIVE.includes(sh.state))own+=outCallsAt(sh.line,v,sailings(knotsOf(sh),sh.line,SPD[sh.speed]));
    const byO={};let calls=0;for(const x of S.rships){if(!routeOpen(x.route,m))continue;const n=outCallsAt(x.route,v,sailings(x.knots,x.route));if(!n)continue;
      const q=byO[x.owner]=byO[x.owner]||{n:0,g:0};q.n+=n;q.g+=n*x.grt;calls+=n;}
    const spare=Math.max(0,cap-own);use=Math.min(spare,0.4*calls);
    for(const o in byO){const sh=calls?byO[o].n/calls*use:0,grt=byO[o].g/byO[o].n,fee=sh*grt*OUT_PIER_FEE*px*slumpK('dues',m);add(o,fee,sh*grt*(0.048-OUT_PIER_FEE)*px);}
    note=`${Math.round(own)} of your own berthings and ${Math.round(use)} of theirs a month, of ${cap}; ${Math.round(calls)} rival calls a month here`;
  }else if(k==='yard'){
    cap=OUT_YARD_BERTHS;own=S.ships.filter(x=>x.state==='yard'&&x.port===v).length;
    const spare=Math.max(0,cap-own),live=coLive(),tot=S.rships.reduce((a,x)=>a+x.grt,0);
    const util=clamp(0.35+0.4*tot/1e6,0,0.9)*(1-0.4*slump(m));use=spare*util;
    const pay=use*OUT_YARD_RATE*px;for(const o of live){const g=coFleet(o).reduce((a,x)=>a+x.grt,0)/Math.max(1,tot);if(g>0)add(o,pay*g,pay*g*0.15);}
    note=`${own} of ${cap} berths taken by your own ships; the spare ones ${Math.round(util*100)}% busy with other lines' work`;
  }else if(k==='hostel'){
    cap=OUT_HOSTEL_CAP;let emig=0;const byO={};
    for(const rk in stats){const r=ROUTES[rk];if(r.cruise||!r.calls.includes(v))continue;
      const dir=r.calls[0]===v?[0]:r.calls[r.calls.length-1]===v?[1]:[0,1],half=dir.length>1?0.5:1;
      for(const c of ['t','tt']){const rw={},tot0=ourWeight(rk,c);let tot=tot0;for(const o in stats[rk].owners){rw[o]=rivalWeight(rk,c,o);tot+=rw[o];}if(tot<=0)continue;
        for(const d of dir){const M=marketM(rk,c,d,m)*half;for(const o in rw){const n=M*rw[o]/tot;byO[o]=(byO[o]||0)+n;emig+=n;}
          own+=M*tot0/tot;}}}
    const spare=Math.max(0,cap-own),take=Math.min(spare,0.35*emig);use=take;
    for(const o in byO){const n=emig?byO[o]/emig*take:0;add(o,n*OUT_HOSTEL_FEE*px,0);}
    note=`about ${int(own)} of your own emigrants and ${int(take)} of theirs a month, of ${int(cap)} beds; ${int(emig)} sail with other lines from here`;
  }else if(k==='agency'||k==='fagent'){
    const ports=outRegionPorts(key),rate=k==='agency'?OUT_AGENCY_COMM:OUT_FAGENT_COMM;let base=0;
    for(const rk in stats){if(!ports.some(p=>outCalls(rk).includes(p)))continue;for(const o in stats[rk].owners){const q=stats[rk].owners[o],b=k==='agency'?q.paxRev:q.cargoRev;if(b>0){add(o,b*rate,0);base+=b;}}}
    use=1;cap=1;note=`${k==='agency'?'passenger':'cargo'} takings of other lines on routes it serves: about ${fmt(Math.round(base/1000)*1000)} a month`;
  }
  const gross=Object.values(from).reduce((a,b)=>a+b,0);
  return {gross,from,gain,use,cap,own,note};
}

/* the month: every place is costed, whether selling or not (so the Shore tab can say what it would earn); those
   selling are paid by the rival lines, which gain by it */
function outsideMonth(stats){
  const s=S.shore;if(!s)return;s.sell=s.sell||{};s.earn=s.earn||{};s.est=s.est||{};const m=S.m;let tot=0;
  for(const key of outKeys()){const w=outWork(key,stats,m);s.est[key]={gross:Math.round(w.gross),note:w.note};
    const sell=outSelling(key),got=sell?Math.round(w.gross):0,h=s.earn[key]=s.earn[key]||[];h.push(got);if(h.length>12)h.shift();
    if(!sell||got<=0)continue;tot+=got;
    for(const o in w.from)if(S.rivals[o]&&coAlive(o))S.rivals[o].cash+=(w.gain[o]||0)-w.from[o];}
  for(const key in s.earn)if(!outKeys().includes(key))delete s.earn[key];
  if(tot>0)book('shorein',tot);
  outOwnMonth();
}
/* what each pier, hostel and agency is worth to the Line's own ships: their monthly takings with it, against without it,
   over a year of seasons (0.35.7; before, the Shore tab showed only what selling the spare would earn, so an agency used
   by the Line's own ships alone looked as if it earned nothing). Repair yards and canvassers are left to the ledger. */
const OUT_MAP={pier:'piers',hostel:'hostels',agency:'agents'};
function outOwnMonth(){const s=S.shore;s.own={};
  for(const key of outKeys()){const [k,id]=key.split(':'),mp=OUT_MAP[k];if(!mp||!s[mp]||!(id in s[mp]))continue;
    const ships=S.ships.filter(x=>x.line&&ACTIVE.includes(x.state)&&ROUTES[x.line]&&(k==='agency'?AGENCY[id].ports.some(p=>ROUTES[x.line].calls.includes(p)):ROUTES[x.line].calls.includes(id)));
    if(!ships.length){s.own[key]=0;continue;}
    let w=0,wo=0;try{MOD_EPOCH++;for(const x of ships)w+=econ(x,x.line).pm;const keep=s[mp][id];delete s[mp][id];MOD_EPOCH++;
      try{for(const x of ships)wo+=econ(x,x.line).pm;}finally{s[mp][id]=keep;MOD_EPOCH++;}}catch(e){continue;}
    s.own[key]=Math.round(w-wo);}}
const outYear=key=>((S.shore.earn||{})[key]||[]).reduce((a,b)=>a+b,0);
const outLast=key=>{const h=(S.shore.earn||{})[key]||[];return h.length?h[h.length-1]:0;};
/* the switch and what it says, for the Shore tab */
function outHTML(key){
  if(!(S.shore.sell))S.shore.sell={};
  const on=outSelling(key),e=(S.shore.est||{})[key],yr=outYear(key),n=((S.shore.earn||{})[key]||[]).filter(v=>v>0).length;
  const help={pier:'they berth cheaply and save on dues',yard:'their repairs cost them a little less',hostel:'their steerage on lines calling here rises about 6%',
    agency:'their passengers on routes these agents serve rise 1.5 to 3.5%',fagent:'their cargo on routes these canvassers serve rises about 4%'}[key.split(':')[0]];
  return `<div class="outrow"><div class="seg" role="group" aria-label="Outside work"><button data-act="shoresell" data-d='${JSON.stringify([key,0])}' aria-pressed="${!on}">Own use</button><button data-act="shoresell" data-d='${JSON.stringify([key,1])}' aria-pressed="${on}">Sell spare</button></div>
    <span class="meta">${(S.shore.own||{})[key]!==undefined?`Worth about ${fmt(Math.round(S.shore.own[key]/10)*10)} a month to the Line's own ships. `:''}${on?(n?`Earned ${fmt(outLast(key))} last month, ${fmt(yr)} in ${n===12?'the last year':n+' month'+(n===1?'':'s')}.`:'Selling from the end of this month.'):e?`Would earn about ${fmt(Math.round(e.gross/10)*10)} a month.`:'An estimate at the end of the month.'}
    ${e?` ${capF(e.note)}.`:''} ${on?'Other lines gain by it: ':'If you sell, '}${help}.</span></div>`;
}
