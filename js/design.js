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
  if(k==='purpose'){const n=defaultDesign(v);n.name=d.name;n.builder=d.builder;n.contract=d.contract;UI.dz=n;return;}
  if(k.startsWith('mix.'))d.mix[k.slice(4)]=+v;
  else if(k.startsWith('x.'))d.extras[k.slice(2)]=!d.extras[k.slice(2)];
  else if(['grt','knots','pax','quality','funnels'].includes(k))d[k]=+v;
  else d[k]=v;
  if(k==='grt')d.funnels=clamp(d.funnels,1,4);
  if(k==='mach'&&!MACHINES[v].fuels.includes(d.fuel))d.fuel=MACHINES[v].fuels[0];
}
const DZ_CACHE={};
function dzForecast(d){const key=JSON.stringify(d)+'|'+S.m;if(DZ_CACHE.k!==key){DZ_CACHE.k=key;DZ_CACHE.v=designForecast(d);}return DZ_CACHE.v;}
function pick(k,v,label,sub,on,dis){return `<button class="pick" data-act="dz" data-k="${k}" data-v="${v}" aria-pressed="${!!on}" ${dis?'disabled':''}><b>${label}</b>${sub?`<small>${sub}</small>`:''}</button>`;}
function renderDesigner(){
  const el=$('designer');if(!UI.designOpen){if(!el.hidden){el.hidden=true;el.innerHTML='';el._h=null;}return;}
  el.hidden=false;
  const d=UI.dz,y=yNow(),P=PURPOSES[d.purpose],f=dzForecast(d),st=f.st,M=MACHINES[d.mach],B=builderOf(d)||BUILDERS.clyde;
  const sh=designShip(d,st),maxKn=M.max(y);
  const free=slipFreeAt(d.builder),start=Math.max(S.m+2,free),deliv=start+st.months+1;
  const g0=P.size[0],g1=Math.min(P.size[1],B.max);
  const purposes=Object.keys(PURPOSES).filter(k=>techOn(PURPOSES[k].from,y)).map(k=>pick('purpose',k,PURPOSES[k].name,'',d.purpose===k)).join('');
  const forms=Object.keys(HULLFORMS).filter(k=>techOn(HULLFORMS[k].from,y)).map(k=>pick('form',k,HULLFORMS[k].name,HULLFORMS[k].blurb,d.form===k)).join('');
  const machs=Object.keys(MACHINES).filter(k=>techOn(MACHINES[k].from,y)).map(k=>{const m=MACHINES[k];return pick('mach',k,m.name,`${m.blurb} Up to ${m.max(y).toFixed(0)} knots.`,d.mach===k);}).join('');
  const styles=Object.keys(STYLES).filter(k=>techOn(STYLES[k].from,y)).map(k=>pick('style',k,STYLES[k].name,`${STYLES[k].blurb} ${fashion(k,y)>=1.06?'All the rage.':fashion(k,y)>=1?'Well liked.':'Looking dated.'}`,d.style===k)).join('');
  const extras=Object.keys(EXTRAS).filter(k=>techOn(EXTRAS[k].from,y)).map(k=>{const e=EXTRAS[k],small=e.min&&d.grt<e.min;
    return `<label class="xopt${small?' off':''}"><input type="checkbox" data-dzx="${k}" ${d.extras[k]?'checked':''} ${small?'disabled':''}><span><b>${e.name}</b> <span class="num">${fmt(e.cost(d.grt)*B.price)}</span><small>${e.blurb}${small?' Needs 12,000 tons.':''}</small></span></label>`;}).join('');
  const bl=Object.keys(BUILDERS).concat(S.shore&&S.shore.slip?['own']:[]).map(k=>{const b=k==='own'?ownBuilder():BUILDERS[k],fr=slipFreeAt(k);
    return pick('builder',k,`${b.name}, ${PN[b.port]}`,`${b.blurb} Price ×${b.price.toFixed(2)}, pace ×${(1/b.speed).toFixed(2)}. ${fr<=S.m?'A slip is free now.':'Next slip free '+monthName(fr)+'.'}${d.grt>b.max?' Too small for this ship.':''}`,d.builder===k,d.grt>b.max);}).join('');
  const mixRow=c=>`<div class="mixrow"><span>${CL_NAME[c]}</span><input type="range" min="0" max="100" step="1" value="${d.mix[c]}" data-dz="mix.${c}" aria-label="${CL_NAME[c]} share of passenger space" ${c==='tt'&&y<1925?'disabled':''}><span class="num">${st.berths[c]} berths</span></div>`;
  const ok=!st.warn.length,dep=Math.round(st.price*0.1),b=f.best;
  const pct=v=>Math.round(v*100);
  // can the line pay for her? cash now and the bank's unused lending, against the stages to come
  const reach=S.cash+headroom(),need=st.price*0.6;
  const fund=reach<need?`<p class="warnline">You would need about ${fmt(need)} over the next ${Math.round(st.months*0.62)+2} months to reach her launch, and you can raise about ${fmt(Math.max(0,reach))} today. Work stops if a payment cannot be met.</p>`:'';
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">Drawing office · Yard No. ${S.yardNext||534}</span><h2>${esc(d.name||'Unnamed')} <small>${P.name}</small></h2></div><button class="btn" data-act="dzclose">Close</button></div>
  <div class="dz-body">
    <div class="dz-view"><div class="dz-top stack">
      ${profileSVG(sh,'ext')}
      <div class="dz-figs">
        <div><span class="lbl">Contract price</span><b class="num">${fmt(st.price)}</b></div>
        <div><span class="lbl">Building time</span><b class="num">${st.months} months</b></div>
        <div><span class="lbl">Delivery about</span><b class="num">${monthName(deliv)}</b></div>
        <div><span class="lbl">Berths</span><b class="num">${int(st.berths.f+st.berths.s+st.berths.t+st.berths.tt)}</b></div>
        <div><span class="lbl">Cargo</span><b class="num">${int(st.cargo)} t</b></div>
        <div><span class="lbl">Fuel per day</span><b class="num">${Math.round(fuelRate(sh,1))} t ${d.fuel}</b></div>
      </div>
      <p class="note">${int(st.berths.f)} first, ${int(st.berths.s)} second, ${int(st.berths.t)} third${st.berths.tt?', '+int(st.berths.tt)+' tourist':''}. Hull ${fmt(st.parts.hull)}, machinery ${fmt(st.parts.machinery)}, interiors ${fmt(st.parts.interiors)}, extras ${fmt(st.parts.extras)}.</p>
      <div class="forecast"><span class="lbl">The traffic manager's view</span>
        <p style="margin:0">${b&&b.pm>0?`Best placed on <strong>${ROUTES[b.rk].name}</strong>, where she would clear about <strong class="pos">${fmt(b.pm)} a month</strong> averaged over a year at today's trade. That pays for her in about ${Math.max(1,Math.round(st.price/(b.pm*12)))} years.`:'At today\'s trade she would not pay her way on any route. Think again, or build for the trade you expect.'}</p>
        <p class="note">Trade changes over the ${Math.round((deliv-S.m)/12*10)/10} years before she sails, and one more ship on a route thins everyone's loads.</p></div>
      ${st.warn.length?`<div class="stack" style="gap:4px">${st.warn.map(w=>`<p class="badline">${w}</p>`).join('')}</div>`:''}
      ${fund}</div><div class="dz-bot stack">
      <div class="ctl"><label class="lbl" for="dzName">Her name</label><div class="row" style="gap:6px"><input id="dzName" data-dzname="1" data-keep="1" value="${esc(d.name)}" placeholder="Name her" maxlength="28" style="flex:1"><button class="btn" data-act="dzname">Suggest</button></div></div>
      <div class="ctl"><span class="lbl">Contract</span><div class="seg">${[['fixed','Fixed price (+8%)'],['cost','Cost plus']].map(([k,l])=>`<button data-act="dz" data-k="contract" data-v="${k}" aria-pressed="${d.contract===k}">${l}</button>`).join('')}</div>
        <span class="note">${d.contract==='fixed'?'The yard carries the risk of rising costs.':'Cheaper on paper, but overruns are yours.'} Payments: 10% with the order (${fmt(dep)}), 20% at the keel, 30% at the launch, 40% on delivery, when the bank will advance up to half her price on mortgage. If you cannot pay a stage, work stops; six months unpaid and the yard cancels.</span></div>
      ${UI.dzMsg?`<p class="badline">${UI.dzMsg}</p>`:''}
      <button class="btn primary" data-act="dzorder" ${!ok||S.cash<dep||S.over?'disabled':''}>Place the order · ${fmt(dep)} now</button>
    </div></div>
    <div class="dz-ctl">
      <section><h3>1 · Purpose</h3><div class="picks">${purposes}</div><p class="note">${P.blurb}</p></section>
      <section><h3>2 · Hull</h3>
        <div class="ctl"><div class="row"><span class="lbl">Size</span><span class="num">${int(d.grt)} tons</span></div><input type="range" min="${g0}" max="${Math.max(g0,g1)}" step="500" value="${d.grt}" data-dz="grt" aria-label="Gross tonnage"></div>
        <div class="picks">${forms}</div>
        <div class="ctl"><span class="lbl">Subdivision</span><div class="seg">${Object.keys(SUBDIV).map(k=>`<button data-act="dz" data-k="subdiv" data-v="${k}" aria-pressed="${d.subdiv===k}">${SUBDIV[k].name}</button>`).join('')}</div><span class="note">${SUBDIV[d.subdiv].blurb}</span></div>
        <div class="ctl"><span class="lbl">Funnels</span><div class="seg">${[1,2,3,4].map(n=>`<button data-act="dz" data-k="funnels" data-v="${n}" aria-pressed="${d.funnels===n}">${n}</button>`).join('')}</div><span class="note">Passengers judge a ship by her funnels. Dummies cost nothing much.</span></div></section>
      <section><h3>3 · Speed and machinery</h3>
        <div class="ctl"><div class="row"><span class="lbl">Service speed</span><span class="num">${d.knots} knots</span></div><input type="range" min="${P.speed[0]}" max="${P.speed[1]}" step="0.5" value="${d.knots}" data-dz="knots" aria-label="Service speed in knots"><span class="note">Power, and the price of the engines, rise with the cube of speed.${d.knots>maxKn?` These engines top out at ${maxKn.toFixed(1)} knots.`:''}</span></div>
        <div class="picks">${machs}</div>
        <div class="ctl"><span class="lbl">Fuel</span><div class="seg">${['coal','oil'].map(k=>`<button data-act="dz" data-k="fuel" data-v="${k}" aria-pressed="${d.fuel===k}" ${M.fuels.includes(k)?'':'disabled'}>${k==='coal'?'Coal':'Oil'}</button>`).join('')}</div><span class="note">Oil needs fewer stokers and bunkers faster.</span></div></section>
      <section><h3>4 · Accommodation</h3>
        <div class="ctl"><div class="row"><span class="lbl">Passengers or cargo</span><span class="num">${pct(d.pax)}% passenger space</span></div><input type="range" min="0.02" max="0.95" step="0.01" value="${d.pax}" data-dz="pax" aria-label="Share of space for passengers"></div>
        <div class="ctl"><span class="lbl">Share of passenger space by class</span>${['f','s','t','tt'].map(mixRow).join('')}</div></section>
      <section><h3>5 · Fittings</h3>
        <div class="ctl"><span class="lbl">Quality</span><div class="seg">${QUALITY.map((q,i)=>`<button data-act="dz" data-k="quality" data-v="${i}" aria-pressed="${d.quality===i}">${q.name}</button>`).join('')}</div><span class="note">${QUALITY[d.quality].blurb} Better fittings take more room per cabin, cost more and wear more slowly.</span></div>
        <div class="picks">${styles}</div>
        <div class="stack" style="gap:6px">${extras}</div></section>
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
