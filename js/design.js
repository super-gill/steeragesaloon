/* ================= DRAWING OFFICE =================
   A large window over the chart where the owner designs a new ship with the naval architects, and the order book. */
const SHIP_NAMES={
  express:['Caledonia','Hibernia','Imperatrix','Atlantis','Morven Castle','Albion','Majestic Star','Northern Crown'],
  inter:['Loch Fyne','Ben Lomond','Strathearn','Glen Affric','Kintyre','Lochaber','Dunvegan','Inverary'],
  emig:['Pioneer','Westward','Newfoundland','Prairie Star','Hope','Settler','New Horizon'],
  tourist:['Holiday','Wayfarer','Rambler','Student Prince','Sunlit Sea','Arcadia'],
  mixed:['Montrose','Kirkcaldy','Tobermory','Portree','Stornoway','Dumbarton'],
  cargo:['Clyde Trader','Kelvinside','Govan','Renfrew','Paisley','Greenock'],
  reefer:['Blue Bay','Fruit Queen','Pampas Star','Coral Sea','Tropic Bird']
};
function openDesigner(pk){
  UI.dz=UI.dz||defaultDesign(pk||'inter');UI.designOpen=true;UI.dzPrev=UI.speed;
  if(UI.speed>0){UI.speed=0;UI.banner='Paused while you are in the drawing office.';}
  UI.dirty=true;
}
function closeDesigner(){UI.designOpen=false;if(UI.dzPrev>0&&!S.over){UI.speed=UI.dzPrev;UI.banner=null;}UI.dirty=true;}
function dzSet(k,v){
  const d=UI.dz,P=()=>PURPOSES[d.purpose];
  if(k==='purpose'){const n=defaultDesign(v);n.name=d.name;n.builder=d.builder;n.contract=d.contract;n.line=d.line||'';UI.dz=n;return;}
  if(k==='layout'){d.layout=v;if(v==='modern')d.funnels=1;else if(v==='stream')d.funnels=Math.min(2,d.funnels);return;}
  d.auto=d.auto||{mach:false,form:false};
  if(k==='mach'||k==='fuel')d.auto.mach=false;
  if(k==='form')d.auto.form=false;
  if(k.startsWith('fac.')){(d.fac=d.fac||{})[k.slice(4)]=+v;return;}
  if(k.startsWith('mix.'))d.mix[k.slice(4)]=+v;
  else if(k.startsWith('x.'))d.extras[k.slice(2)]=!d.extras[k.slice(2)];
  else if(['grt','knots','pax','quality','funnels'].includes(k))d[k]=+v;
  else d[k]=v;
  if(k==='grt')d.funnels=clamp(d.funnels,1,4);
  if(k==='mach'&&(!MACHINES[v].fuels.includes(d.fuel)||!fuelOK(d.fuel,yNow())))d.fuel=MACHINES[v].fuels.find(f=>fuelOK(f,yNow()))||MACHINES[v].fuels[0];
}
const DZ_CACHE={};
function dzForecast(d){const key=JSON.stringify(d)+'|'+S.m;if(DZ_CACHE.k!==key){DZ_CACHE.k=key;DZ_CACHE.v=designForecast(d);}return DZ_CACHE.v;}
function pick(k,v,label,sub,on,dis){return `<button class="pick" data-act="dz" data-k="${k}" data-v="${v}" aria-pressed="${!!on}" ${dis?'disabled':''}><b>${label}</b>${sub?`<small>${sub}</small>`:''}</button>`;}
/* the naval architects' report, in plain words */
function architectReport(d,st){
  const e=st.eng,M=MACHINES[d.mach],line=d.line&&ROUTES[d.line];
  const out=[];
  out.push(`<strong>${int(e.len)} ft long, ${int(e.beam)} ft beam, drawing ${int(e.draught)} ft.</strong> ${e.Cb<0.62?'Fine lines':e.Cb<0.72?'Moderate lines':'Full, boxy lines'} for ${d.knots} knots${e.slr>0.9?', and she is pushing hard against her own bow wave':e.slr>0.75?', close to what her length allows':''}.`);
  if(e.wantLen>e.len+5)out.push(`We would have made her ${int(e.wantLen)} ft for this speed${e.len>=e.eraL-1?`, but nobody can build longer than ${int(e.eraL)} ft yet`:`, but ${PN[e.lim.lp]} will not take her longer than ${int(e.len)} ft`}. The shorter hull costs power.`);
  out.push(`${M.name}, about ${int(e.shp)} horsepower, burning about ${int(e.fuelDay)} tons of ${d.fuel} a day at service speed. Engines and bunkers take ${e.usable>0?Math.round((1-e.usable/(d.grt*0.95))*100):100}% of her.`);
  if(line){
    const bad=e.badPorts;
    out.push(bad.length?`<span class="neg">Not every port on ${line.name} can take her.</span> ${bad.map(x=>`${PN[x.p]} (${PORT_LIMIT[x.p].note||'the harbour'}): ${x.f.drOver?`she draws ${int(e.draught)} ft, it takes ${PORT_LIMIT[x.p].dr}`:`she is ${int(e.len)} ft, the berths take ${PORT_LIMIT[x.p].len}`}`).join('; ')}. She would lie off and work into lighters${bad.some(x=>x.f.drOver>2)?', and could touch bottom':''}.`:`She fits every port on ${line.name}.`);
    out.push(e.sea>0.45?`<span class="neg">Small for the weather on this line.</span> Expect a hard time in winter: lost days, damage and unhappy passengers.`:e.sea>0.15?'A fair sea boat for this line, though she will roll in a winter gale.':'A good sea boat for this line.');
    out.push(e.range>=longestLeg(d.line)*1.1?'Bunkers for the longest leg with a good margin.':`<span class="neg">Short-legged for this line:</span> she will fill cargo space with bunkers on the longest leg.`);
  } else out.push('No particular line in the brief: we have given her bunkers for about 3,500 miles and made no allowance for any port.');
  return out.map(t=>`<li>${t}</li>`).join('');
}
function renderDesigner(){
  {const el=$('designer'),w=!!UI.fmOpen&&!UI.crewOpen&&!UI.refitOpen;if(el.classList.contains('fmw')!==w)el.classList.toggle('fmw',w);} // the fleet manager also covers the left column
  if(UI.crewOpen&&renderCrew())return;
  if(UI.refitOpen&&renderRefit())return;
  if(UI.fmOpen&&renderFleetMgr())return;
  const el=$('designer');if(!UI.designOpen){if(!el.hidden){el.hidden=true;el.innerHTML='';el._h=null;}return;}
  el.hidden=false;
  const d=UI.dz;d.auto=d.auto||{mach:false,form:false};d.line=d.line||'';
  const y=yNow(),P=PURPOSES[d.purpose],f=dzForecast(d),st=f.st,M=MACHINES[d.mach],B=builderOf(d)||BUILDERS.clyde,rec=recommend(d);
  const sh=designShip(d,st);
  const free=slipFreeAt(d.builder),start=Math.max(S.m+2,free),deliv=start+st.months+1;
  const g0=Math.min(P.size[0],builderMax(B)),g1=Math.min(P.size[1],builderMax(B));
  const purposes=Object.keys(PURPOSES).filter(k=>techOn(PURPOSES[k].from,y)).map(k=>pick('purpose',k,PURPOSES[k].name,'',d.purpose===k)).join('');
  const lines=`<select data-dzline="1" aria-label="The line she is for"><option value="">No particular line</option>${ROUTE_GROUPS.map(g=>`<optgroup label="${g}">${Object.keys(ROUTES).filter(rk=>ROUTES[rk].group===g).map(rk=>`<option value="${rk}" ${d.line===rk?'selected':''}>${ROUTES[rk].name}${S.lines[rk]?' (yours)':''}</option>`).join('')}</optgroup>`).join('')}</select>`;
  const tag=(on)=>on?' · recommended':'';
  const forms=Object.keys(HULLFORMS).filter(k=>techOn(HULLFORMS[k].from,y)).map(k=>pick('form',k,HULLFORMS[k].name+tag(rec.form===k),HULLFORMS[k].blurb,d.form===k)).join('');
  const machs=Object.keys(MACHINES).filter(k=>techOn(MACHINES[k].from,y)).map(k=>{const m=MACHINES[k];return pick('mach',k,m.name+tag(rec.mach===k),m.blurb,d.mach===k);}).join('');
  const styles=Object.keys(STYLES).filter(k=>techOn(STYLES[k].from,y)).map(k=>pick('style',k,STYLES[k].name,`${STYLES[k].blurb} ${fashion(k,y)>=1.06?'All the rage.':fashion(k,y)>=1?'Well liked.':'Looking dated.'}`,d.style===k)).join('');
  const extras=Object.keys(EXTRAS).filter(k=>techOn(EXTRAS[k].from,y)&&(!EXTRAS[k].ok||EXTRAS[k].ok())).map(k=>{const e=EXTRAS[k],small=e.min&&d.grt<e.min;
    return `<label class="xopt${small?' off':''}"><input type="checkbox" data-dzx="${k}" ${d.extras[k]?'checked':''} ${small?'disabled':''}><span><b>${e.name}</b> <span class="num">${fmt(e.cost(d.grt)*B.price)}</span><small>${e.blurb}${small?' Needs 12,000 tons.':''}</small></span></label>`;}).join('');
  const bl=Object.keys(BUILDERS).concat(S.shore&&S.shore.slip?['own']:[]).map(k=>{const b=k==='own'?ownBuilder():BUILDERS[k],fr=slipFreeAt(k);
    return pick('builder',k,`${b.name}, ${PN[b.port]}`,`${b.blurb} Price ×${b.price.toFixed(2)}, pace ×${(1/b.speed).toFixed(2)}. ${fr<=S.m?'A slip is free now.':'Next slip free '+monthName(fr)+'.'}${d.grt>b.max?' Too small for this ship.':''}`,d.builder===k,d.grt>b.max);}).join('');
  const mixRow=c=>`<div class="mixrow"><span>${CL_NAME[c]}</span><input type="range" min="0" max="100" step="1" value="${d.mix[c]}" data-dz="mix.${c}" aria-label="${CL_NAME[c]} share of passenger space" ${c==='tt'&&y<1925?'disabled':''}><span class="num">${st.berths[c]} berths</span></div>`;
  const ok=!st.warn.length,dep=Math.round(st.price*0.1*(d.adm&&admEligible(d)?1/3:1)),b=f.best,fl=f.line;
  const pct=v=>Math.round(v*100);
  const reach=S.cash+headroom(),need=st.price*0.6;
  const fund=reach<need?`<p class="warnline">You would need about ${fmt(need)} over the next ${Math.round(st.months*0.62)+2} months to reach her launch, and you can raise about ${fmt(Math.max(0,reach))} today. Work stops if a payment cannot be met.</p>`:'';
  const view=fl?(fl.pm>0?`On <strong>${ROUTES[fl.rk].name}</strong> she would clear about <strong class="pos">${fmt(fl.pm)} a month</strong> averaged over a year at today's trade: paid for in about ${Math.max(1,Math.round(st.price/(fl.pm*12)))} years.`:`On <strong>${ROUTES[fl.rk].name}</strong> she would not pay her way at today's trade.`)+(b&&b.rk!==fl.rk&&b.pm>fl.pm*1.2?` She would do better on ${ROUTES[b.rk].name} (about ${fmt(b.pm)} a month).`:'')
    :(b&&b.pm>0?`Best placed on <strong>${ROUTES[b.rk].name}</strong>, where she would clear about <strong class="pos">${fmt(b.pm)} a month</strong> averaged over a year at today's trade: paid for in about ${Math.max(1,Math.round(st.price/(b.pm*12)))} years.`:'At today\'s trade she would not pay her way on any route.');
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">Drawing office · Yard No. ${S.yardNext||534}</span><h2>${esc(d.name||'Unnamed')} <small>${P.name}${d.line?' for '+ROUTES[d.line].name:''}</small></h2></div><button class="btn" data-act="dzclose">Close</button></div>
  <div class="dz-body">
    <div class="dz-view"><div class="dz-top stack">
      ${profileSVG(sh,UI.dzView==='cut'?'cut':'ext')}
      <div class="row" style="gap:10px;align-items:center"><div class="seg" role="group"><button data-act="dzview" data-v="ext" aria-pressed="${UI.dzView!=='cut'}">Exterior</button><button data-act="dzview" data-v="cut" aria-pressed="${UI.dzView==='cut'}">Cutaway</button></div>
        ${UI.dzView==='cut'?`<div class="legend" style="flex:1">${CL.filter(c=>st.berths[c]).map(c=>`<span><i style="background:${CL_COL[c]}"></i>${CL_NAME[c]} ${int(st.berths[c])}</span>`).join('')}<span><i style="background:#8A6A45"></i>Cargo ${int(st.cargo)} t</span><span><i style="background:var(--muted)"></i>Engines</span><span><i style="background:var(--line)"></i>Crew, stores, mail</span></div>`:''}</div>
      <div class="dz-figs">
        <div><span class="lbl">Contract price</span><b class="num">${fmt(st.price)}</b></div>
        <div><span class="lbl">Delivery about</span><b class="num">${monthName(deliv)}</b></div>
        <div><span class="lbl">Berths · cargo</span><b class="num">${int(st.berths.f+st.berths.s+st.berths.t+st.berths.tt)} · ${int(st.cargo)} t</b></div>
      </div>
      <div class="report"><span class="lbl">The naval architects report</span><ul>${architectReport(d,st)}</ul>
        <div class="pcurve-wrap"><span class="lbl">Power needed as speed rises</span>${powerCurveSVG(d,st.eng)}<p class="note" style="margin:0">Past the wall her own bow and stern waves hold her back, and every extra knot costs far more power and fuel.</p></div></div>
      <div class="forecast"><span class="lbl">The traffic manager's view</span><p style="margin:0">${view}</p>
        <p class="note">Trade changes over the ${Math.round((deliv-S.m)/12*10)/10} years before she sails, and one more ship on a route thins everyone's loads.</p></div>
      ${st.warn.length?`<div class="stack" style="gap:4px">${st.warn.map(w=>`<p class="badline">${w}</p>`).join('')}</div>`:''}
      ${fund}</div><div class="dz-bot stack">
      <div class="ctl"><label class="lbl" for="dzName">Her name</label><div class="row" style="gap:6px"><input id="dzName" data-dzname="1" data-keep="1" value="${esc(d.name)}" placeholder="Name her" maxlength="28" style="flex:1"><button class="btn" data-act="dzname">Suggest</button></div></div>
      <div class="ctl"><span class="lbl">Contract</span><div class="seg">${[['fixed','Fixed price (+8%)'],['cost','Cost plus']].map(([k,l])=>`<button data-act="dz" data-k="contract" data-v="${k}" aria-pressed="${d.contract===k}">${l}</button>`).join('')}</div>
        ${admEligible(d)?`<div class="row" style="justify-content:flex-start;gap:8px"><button class="btn" data-act="dzadm" aria-pressed="${!!d.adm}">${d.adm?'On Admiralty terms':'Take the Admiralty\'s terms'}</button></div><span class="note">Built to naval standards (5% dearer). The Admiralty lends two thirds of every payment at 2.75% over twenty years and pays ${fmt(Math.round(st.price*ADM_SUB/1000)*1000)} a year while she sails. In a war she may be taken as an armed merchant cruiser, and her loan must be repaid before she is sold.</span>`:newCal()&&S.m>=ADM_FROM&&S.m<M21?`<span class="note">The Admiralty offers cheap loans and a subsidy for ships of 24 knots and 20,000 tons or more built to naval standards.</span>`:''}
        <span class="note">${d.contract==='fixed'?'The yard carries the risk of rising costs.':'Cheaper on paper, but overruns are yours.'} Payments: 10% with the order (${fmt(dep)}${d.adm&&admEligible(d)?', your third of it':''}), 20% at the keel, 30% at the launch, 40% on delivery, when the bank will advance up to half her price on mortgage. If you cannot pay a stage, work stops; six months unpaid and the yard cancels. ${st.months} months on the slip.</span></div>
      ${UI.dzMsg?`<p class="badline">${UI.dzMsg}</p>`:''}
      <button class="btn primary" data-act="dzorder" ${!ok||S.cash<dep||S.over?'disabled':''}>Place the order · ${fmt(dep)} now</button>
    </div></div>
    <div class="dz-ctl">
      <section><h3>1 · The job</h3><div class="picks">${purposes}</div><p class="note">${P.blurb}</p>
        <div class="ctl"><span class="lbl">Layout</span><div class="picks">${(LAYOUT_FOR[d.purpose]||['classic']).map(k=>{const Lz=LAYOUTS[k],ok=layoutOk(k,y);return pick('layout',k,Lz.name,Lz.blurb+(ok?'':Lz.from&&y<Lz.from?` From ${Lz.from}.`:' No longer built.'),(d.layout||defaultLayout(d.purpose,y))===k,!ok);}).join('')}</div></div>
        <div class="ctl"><span class="lbl">The line she is for</span>${lines}<span class="note">The architects fit her to its ports, weather and distances.</span></div></section>
      <section><h3>2 · Size and speed</h3>
        <div class="ctl"><div class="row"><span class="lbl">Size</span><span class="num">${int(d.grt)} tons</span></div><input type="range" min="${g0}" max="${Math.max(g0,g1)}" step="500" value="${d.grt}" data-dz="grt" aria-label="Gross tonnage"></div>
        <div class="ctl"><div class="row"><span class="lbl">Service speed</span><span class="num">${d.knots} knots</span></div><input type="range" min="${P.speed[0]}" max="${P.speed[1]}" step="0.5" value="${d.knots}" data-dz="knots" aria-label="Service speed in knots"></div></section>
      <section><h3>3 · Passengers and cargo</h3>
        <div class="ctl"><div class="row"><span class="lbl">Passengers or cargo</span><span class="num">${pct(d.pax)}% passenger space</span></div><input type="range" min="0.02" max="0.95" step="0.01" value="${d.pax}" data-dz="pax" aria-label="Share of space for passengers"></div>
        <div class="ctl"><span class="lbl">Share of passenger space by class</span>${['f','s','t','tt'].map(mixRow).join('')}</div></section>
      <section><h3>4 · Fittings</h3>
        <div class="ctl"><span class="lbl">Quality</span><div class="seg">${QUALITY.map((q,i)=>`<button data-act="dz" data-k="quality" data-v="${i}" aria-pressed="${d.quality===i}">${q.name}</button>`).join('')}</div><span class="note">${QUALITY[d.quality].blurb} Better fittings take more room per cabin, cost more and wear more slowly.</span></div>
        <div class="picks">${styles}</div>
        <div class="stack" style="gap:6px">${extras}</div>
        ${CL.reduce((a,c)=>a+(st.berths[c]||0),0)<60?'<p class="note">Public rooms are for ships that carry passengers; she will carry too few for them to pay.</p>':`<div class="ctl"><div class="row"><span class="lbl">Public rooms</span><span class="num">${slotsUsed(d.fac)} of ${slotsOf({grt:d.grt})} venues</span></div>
          <span class="note">Each level takes a venue and room from the cabins of the classes it serves, costs money to staff, and draws passengers; indoor rooms hold them through the winter. Bigger ships have room for more.</span>
          ${FAC_KEYS.map(k=>{const F=FAC[k],cur=(d.fac||{})[k]||0;return `<div class="rffac"><b>${F.name}</b><div class="rflv">${F.levels.map((L,i)=>{const ok=!i||levelOk(k,i,d.grt,y),L2=FAC[k].levels[i];return `<button data-act="dz" data-k="fac.${k}" data-v="${i}" aria-pressed="${cur===i}" ${ok?'':'disabled'}>${esc(L.n)}${ok?'':` <small>${L2.min&&d.grt<L2.min?'needs '+int(L2.min)+' tons':'from '+L2.from}</small>`}</button>`;}).join('')}</div>${F.levels[cur].staff?`<small class="note">staff ${fmt(F.levels[cur].staff*facSize(d.grt,0.7)*PX())} a month</small>`:''}</div>`;}).join('')}</div>`}</section>
      <section><h3>5 · Engineering</h3>
        <p class="note">${d.auto.mach&&d.auto.form?'The engineers are choosing her engines and lines.':'You have overruled the engineers.'} ${!(d.auto.mach&&d.auto.form)?'<button class="btn quiet" data-act="dzauto">Leave it to the engineers</button>':''}</p>
        <div class="picks">${machs}</div>
        <div class="ctl"><span class="lbl">Fuel</span><div class="seg">${['coal','oil'].map(k=>`<button data-act="dz" data-k="fuel" data-v="${k}" aria-pressed="${d.fuel===k}" ${M.fuels.includes(k)&&fuelOK(k,yNow())?'':'disabled'}>${k==='coal'?'Coal':'Oil'}</button>`).join('')}</div></div>
        <div class="picks">${forms}</div>
        <div class="ctl"><span class="lbl">Subdivision</span><div class="seg">${Object.keys(SUBDIV).map(k=>`<button data-act="dz" data-k="subdiv" data-v="${k}" aria-pressed="${d.subdiv===k}">${SUBDIV[k].name}</button>`).join('')}</div><span class="note">${SUBDIV[d.subdiv].blurb}</span></div>
        <div class="ctl"><span class="lbl">Funnels</span><div class="seg">${[1,2,3,4].map(n=>`<button data-act="dz" data-k="funnels" data-v="${n}" aria-pressed="${d.funnels===n}">${n}</button>`).join('')}</div><span class="note">Passengers judge a ship by her funnels. Dummies cost nothing much.</span></div></section>
      <section><h3>6 · Builder</h3><div class="picks">${bl}</div></section>
    </div>
  </div>`);
}
/* the order book, in the Buy and build tab */
function orderBookHTML(){
  const O=S.orders||[];
  const cards=O.map(o=>{const B=builderOf(o.d)||{name:'?'},st=designStats(o.d),sh=designShip(o.d,st);sh.state=o.stage==='trials'?'sea':'build';
    const next=o.stage==='drawing'||o.stage==='waiting'?'20% at the keel':o.stage==='framing'||o.stage==='plating'?'30% at the launch':'the balance on delivery';
    const left=o.stage==='drawing'?o.left+o.months:o.stage==='waiting'?o.months+Math.max(0,slipFreeAt(o.d.builder)-S.m):Math.max(1,Math.ceil((1-o.prog)*o.months));
    return `<div class="card" data-key="ob${o.id}"><div class="row"><strong>SS ${esc(o.d.name)}</strong><span class="chip ${o.due?'bad':'yard'}">${o.due?'Work stopped':STAGES[o.stage]}</span></div>
      <div class="meta">Yard No. ${o.id} · ${B.name}, ${PN[B.port]} · ${PURPOSES[o.d.purpose].name}, ${int(o.d.grt)} tons, ${o.d.knots} knots</div>
      ${profileSVG(sh,'ext',{stage:o.stage,prog:o.prog})}
      <div class="bar" aria-hidden="true"><i style="width:${Math.round(o.prog*100)}%"></i></div>
      <dl class="kv"><dt>Price</dt><dd>${fmt(o.price)}</dd><dt>Paid</dt><dd>${fmt(o.paid)}</dd>${o.due?`<dt>Owed</dt><dd class="neg">${fmt(o.due)}</dd>`:''}<dt>Next payment</dt><dd>${next}</dd><dt>Delivery about</dt><dd>${monthName(S.m+left+1)}</dd></dl>
      <div class="meta">${o.log.slice(0,3).map(l=>`${monthName(l.m)}: ${l.t}`).join('<br>')}</div>
      ${UI.confirm==='cxl'+o.id?`<div class="btns"><button class="btn danger" data-act="cxlorder" data-id="${o.id}">Confirm: cancel, losing ${fmt(o.paid)}</button><button class="btn" data-act="cancel">Keep her</button></div>`:`<button class="btn quiet" data-act="askcxl" data-id="${o.id}" style="width:fit-content">Cancel the contract</button>`}</div>`;}).join('');
  return `<section class="sec"><div class="row"><h2>Shipyard</h2><button class="btn primary" data-act="dzopen">Design a new ship</button></div>
    <p class="note">New ships are dear and slow to build, but they are faster, cheaper to run and far more fashionable than anything on the brokers' lists.</p>
    ${cards||'<p class="note">No ships on order.</p>'}</section>`;
}
