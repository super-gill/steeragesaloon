/* ================= RENDER ================= */
const $=id=>document.getElementById(id);
/* Patch the DOM in place instead of rebuilding it, so buttons, hover and focus survive live updates. */
const TPL=document.createElement('template');
function sameNode(a,b){if(a.nodeType!==b.nodeType)return false;if(a.nodeType!==1)return true;
  return a.tagName===b.tagName&&a.getAttribute('data-key')===b.getAttribute('data-key')&&a.id===b.id;}
function patchNode(a,b){
  if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
  const focused=a===document.activeElement;
  for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
  for(const at of [...b.attributes]){if(focused&&at.name==='value')continue;if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);}
  const tag=a.tagName;
  if(tag==='INPUT'){if(!focused){if(a.type==='checkbox'||a.type==='radio'){if(a.checked!==b.checked)a.checked=b.checked;}else if(a.value!==b.value)a.value=b.value;}return;}
  if(tag==='TEXTAREA'){if(!focused&&a.value!==b.value)a.value=b.value;return;}
  patchChildren(a,b);
  if(tag==='SELECT'&&!focused){const o=b.querySelector('option[selected]');const v=o?o.value:(a.options[0]?a.options[0].value:'');if(a.value!==v)a.value=v;}
}
function patchChildren(a,b){
  let ai=a.firstChild,bi=b.firstChild;
  while(bi){
    const next=bi.nextSibling;
    if(!ai){a.appendChild(bi);}
    else if(sameNode(ai,bi)){patchNode(ai,bi);ai=ai.nextSibling;}
    else{
      // look ahead for a keyed match so reordered items move instead of being rebuilt
      let m=null;const kb=bi.nodeType===1&&bi.getAttribute('data-key');
      if(kb){for(let x=ai.nextSibling;x;x=x.nextSibling)if(sameNode(x,bi)){m=x;break;}}
      if(m){a.insertBefore(m,ai);patchNode(m,bi);}
      else a.insertBefore(bi,ai);
    }
    bi=next;
  }
  while(ai){const n=ai.nextSibling;a.removeChild(ai);ai=n;}
}
function setHTML(el,h){
  if(el._h===h)return;el._h=h;
  if(el.namespaceURI==='http://www.w3.org/2000/svg'){el.innerHTML=h;return;}
  TPL.innerHTML=h;patchChildren(el,TPL.content);
}
const keyOf=t=>{let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return 'k'+(h>>>0).toString(36);};
const condBar=c=>{const cls=c<40?'low':c<65?'mid':'';return `<div class="bar" aria-hidden="true"><i class="${cls}" style="width:${Math.round(c)}%"></i></div>`;};
const seg=(act,k,v,labels,extra='')=>`<div class="seg" role="group">${labels.map((l,i)=>`<button data-act="${act}" data-k="${k}" data-v="${i}" aria-pressed="${v===i}" ${extra}>${l}</button>`).join('')}</div>`;
const TABS=[['overview','Overview'],['fleet','Fleet'],['lines','Lines'],['brokers','Brokers'],['finance','Finance'],['company','Company']];
function shipStatus(sh){
  if(sh.state==='sea'){const r=ROUTES[sh.legRoute],to=PN[sh.dir===0?r.b:r.a],left=(r.dist-sh.pos)/(sh.knots*SPD[sh.speed]*24*sh.slow*(sh.limp?0.4:1));
    if(sh.incident)return {chip:'<span class="chip bad">Orders needed</span>',short:'Broken down, orders needed',text:`Broken down ${int(sh.incident.nm)} nm from the nearest port, ${to} bound.`};
    if(sh.towed)return {chip:'<span class="chip bad">Under tow</span>',short:`Under tow to ${to}`,text:`Under tow to ${to} at 5 knots, about ${Math.max(1,Math.ceil((r.dist-sh.pos)/120))} days.`};
    if(sh.stopLeft>0)return {chip:'<span class="chip bad">Broken down</span>',short:`Repairing at sea, ${Math.ceil(sh.stopLeft)} days`,text:`Stopped mid-ocean, ${to} bound. Engineers expect ${Math.ceil(sh.stopLeft)} more days.`};
    return {chip:sh.limp?'<span class="chip bad">Limping</span>':'<span class="chip sea">At sea</span>',short:`${to} bound, ${Math.max(1,Math.ceil(left))} day${Math.max(1,Math.ceil(left))>1?'s':''}`,text:`Bound for ${to}. ${int(sh.pos)} of ${int(r.dist)} nm, about ${Math.max(1,Math.ceil(left))} day${Math.max(1,Math.ceil(left))>1?'s':''} to go.`};}
  if(sh.state==='port')return {chip:'<span class="chip inport">In port</span>',short:`Loading at ${PN[sh.port]}`,text:`Loading at ${PN[sh.port]}. Sails in ${Math.max(1,Math.ceil(sh.portLeft))} day${Math.ceil(sh.portLeft)>1?'s':''}.`};
  if(sh.state==='repo')return {chip:'<span class="chip sea">Positioning</span>',short:`Sailing light to ${PN[sh.repoTo]}`,text:`Sailing light to ${PN[sh.repoTo]}, ${Math.max(1,Math.ceil(sh.repoLeft))} days out.`};
  if(sh.state==='yard')return {chip:'<span class="chip yard">In yard</span>',short:`In yard, ${Math.ceil(sh.yardLeft)} days`,text:`${YARD_NAME[sh.yardKind][0].toUpperCase()+YARD_NAME[sh.yardKind].slice(1)} at ${PN[sh.port]}, ${Math.ceil(sh.yardLeft)} days left.`};
  return {chip:'<span class="chip idle">Laid up</span>',short:`Laid up at ${PN[sh.port]}`,text:`Laid up at ${PN[sh.port]} on a skeleton crew. Assign her to a line to sail.`};
}
function renderHeader(){
  setHTML($('brand'),`<span class="eyebrow">Steerage &amp; Saloon · The Morven Line</span><h1>${dateLong(S.t)}</h1>`);
  setHTML($('clock'),`<span class="lbl">Clock</span><div class="seg" role="group" aria-label="Game speed">${['Pause','1×','3×','7×'].map((l,i)=>`<button data-act="speed" data-v="${i}" aria-pressed="${UI.speed===i}" ${S.over?'disabled':''}>${l}</button>`).join('')}</div>`);
  setHTML($('stats'),`<div><dt>Cash</dt><dd class="${S.cash<0?'neg':''}">${fmt(S.cash)}</dd></div><div><dt>Bank debt</dt><dd>${fmt(S.debt)}</dd></div>
    <div><dt>Reputation</dt><dd>${Math.round(S.rep)} <small>${repWord(S.rep)}</small></dd></div><div><dt>Net worth</dt><dd>${fmt(netWorth())}</dd></div>`);
}
function renderTabs(){
  const n=alerts().length;
  const badge={overview:n?`<span class="badge">${n}</span>`:'',fleet:`<span class="count">${S.ships.length}</span>`,lines:`<span class="count">${Object.keys(S.lines).length}</span>`};
  setHTML($('tabsN'),TABS.filter(([k])=>!(UI.wide&&k==='overview')).map(([k,l])=>`<button role="tab" data-act="tabgo" data-tab="${k}" aria-selected="${UI.tab===k}">${l}${badge[k]||''}</button>`).join(''));
  for(const [k] of TABS)$('pane-'+k).hidden=k==='overview'?!(UI.wide||UI.tab==='overview'):UI.tab!==k;
}

/* ---------- Overview ---------- */
function alerts(){
  const A=[];
  for(const sh of S.ships){
    if(sh.incident)A.push({k:'bad',t:`SS ${sh.name} has broken down and needs orders.`,b:[['Give orders','selship',sh.id]]});
    else if(sh.state==='laid')A.push({k:'warn',t:`SS ${sh.name} is laid up at ${PN[sh.port]}, still drawing wages.`,b:[['Assign a line','selship',sh.id]]});
    else if(sh.cond<35&&sh.state!=='yard'&&sh.pendingYard!=='dock')A.push({k:'bad',t:`SS ${sh.name} is dangerously run down at ${Math.round(sh.cond)}%.`,b:[['Send to the yard','selship',sh.id]]});
    else if(!sh.autoDock&&sh.cond<50&&sh.state!=='yard'&&!sh.pendingYard)A.push({k:'warn',t:`SS ${sh.name} is at ${Math.round(sh.cond)}% and has no service threshold.`,b:[['Review','selship',sh.id]]});
    if(sh.dockWarn&&sh.state!=='yard')A.push({k:'warn',t:`SS ${sh.name} is due a drydock the account cannot cover.`,b:[['Bank','tabgo','finance']]});
  }
  if(S.offer)A.push({k:'good',t:`The Post Office offers ${fmt(S.offer.pay)} per round trip for the ${ROUTES[S.offer.route].name} mail. Miss a month and you are warned; miss two and it goes.`,b:[['Accept','accept'],['Decline','decline']]});
  for(const rk of Object.keys(S.lines)){
    const r=ROUTES[rk],t=S.tension[rk]||0;
    if(S.wars[rk])A.push({k:'bad',t:`Rate war on ${r.name}, ${S.wars[rk].left} more month${S.wars[rk].left>1?'s':''}.`,b:[['View line','selline',rk]]});
    else if(t>=40&&!S.conf)A.push({k:'warn',t:`Conference tension is ${tensionWord(t).toLowerCase()} on ${r.name} (${Math.round(t)}).`,b:[['Review fares','selline',rk]]});
    if(!shipsOn(rk).length)A.push({k:'warn',t:`${r.name} is open but has no ships assigned.`,b:[['View line','selline',rk]]});
  }
  if(S.cash<0)A.push({k:'bad',t:`The account is overdrawn. The bank forecloses below ${fmt(-odLimit())}.`,b:[['Bank','tabgo','finance']]});
  return A;
}
function renderOverview(){
  const A=alerts(),ADV=advice(),mtd=Object.values(S.mtd.cat).reduce((a,b)=>a+b,0),LM=S.lastMonth;
  const atSea=S.ships.filter(s=>s.state==='sea').length;
  const best=Object.keys(S.lines).sort((a,b)=>(S.mtd.lines[b]||0)-(S.mtd.lines[a]||0))[0];
  const tiles=`<div class="tiles">
    <div class="tile"><span class="lbl">${MONTHS[S.m%12]} so far</span><b class="${mtd<0?'neg':'pos'}">${fmt(mtd)}</b></div>
    <div class="tile"><span class="lbl">Last month</span><b class="${LM&&LM.net<0?'neg':'pos'}">${LM?fmt(LM.net):'None yet'}</b></div>
    <div class="tile"><span class="lbl">Ships at sea</span><b>${atSea} of ${S.ships.length}</b></div>
    <div class="tile"><span class="lbl">Best line this month</span><b style="font-size:14px;font-family:var(--body)">${best?ROUTES[best].name:'None open'}</b></div></div>`;
  const al=A.length?A.map(a=>`<div class="alert ${a.k}" data-key="${keyOf(a.t.slice(0,40))}"><span>${a.t}</span><span class="btns">${a.b.map(([l,act,id])=>`<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${id}"`:id!==undefined?`data-id="${id}"`:''}>${l}</button>`).join('')}</span></div>`).join('')
    :'<p class="note">Nothing needs you right now. The fleet is sailing to orders.</p>';
  const fleet=S.ships.map(sh=>{const st=shipStatus(sh);return `<button class="glance" data-key="gs${sh.id}" data-act="selship" data-id="${sh.id}"><span class="nm">SS ${sh.name}</span><span class="meta">${st.short}</span><span class="mini">${condBar(sh.cond)}</span></button>`;}).join('');
  const lines=Object.keys(S.lines).map(rk=>{const v=S.mtd.lines[rk]||0,t=S.tension[rk]||0;
    return `<button class="glance" data-key="gl${rk}" data-act="selline" data-id="${rk}"><span class="nm">${ROUTES[rk].name}</span><span class="meta">${shipsOn(rk).length} ship${shipsOn(rk).length===1?'':'s'}${S.wars[rk]?' · rate war':t>=40?' · '+tensionWord(t).toLowerCase():''}</span><span class="num ${v<0?'neg':'pos'}">${fmt(v)}</span></button>`;}).join('');
  setHTML($('pane-overview'),`
    <section class="sec">${tiles}</section>
    <section class="sec"><h2>Needs attention</h2><div class="ratchet stack" data-key="r-alerts">${al}</div></section>
    <section class="sec"><h2>Advice from Mr Ferguson, company secretary</h2><div class="ratchet stack" data-key="r-advice">${adviceHTML(UI.allAdvice?ADV:ADV.slice(0,3),'Mr Ferguson has no complaints. The books look sound at current settings.')}
      ${ADV.length>3?`<button class="btn quiet" data-act="alladvice" style="width:fit-content">${UI.allAdvice?'Show fewer':'Show all '+ADV.length+' suggestions'}</button>`:''}</div></section>
    <section class="sec"><h2>Fleet</h2><div class="glist">${fleet}</div></section>
    <section class="sec"><h2>Lines · month to date</h2><div class="glist">${lines||'<p class="note">No lines open.</p>'}</div></section>
    <section class="sec"><h2>Shortcuts</h2><div class="btns">
      <button class="btn" data-act="tabgo" data-tab="brokers">Buy a ship</button><button class="btn" data-act="newline">Open a new line</button>
      <button class="btn" data-act="tabgo" data-tab="finance">Bank and ledger</button><button class="btn" data-act="tabgo" data-tab="company">Conference</button></div></section>
    <section class="sec">${chart()}</section>
    <section class="sec"><div class="row"><h2>Shipping news</h2><label class="check"><input type="checkbox" id="autoP" data-autop="1" ${UI.autoPause?'checked':''}> Pause on big events</label></div>
      <ul class="news">${S.news.slice(0,25).map(n=>`<li class="${n.k}" data-key="${keyOf(n.d+n.t)}"><time>${dateLong(n.d)}</time>${n.t}</li>`).join('')}</ul></section>`);
}

/* ---------- Fleet ---------- */
function renderFleet(){
  const items=S.ships.map(sh=>{const st=shipStatus(sh),sel=S.selShip===sh.id,due=sh.cond<(sh.autoDock||50)&&sh.state!=='yard';
    return `<button class="item" data-key="s${sh.id}" data-act="selship" data-id="${sh.id}" aria-pressed="${sel}">
      <span class="row"><span class="nm">SS ${sh.name}</span>${st.chip}</span>
      <span class="row meta"><span>${sh.line?ROUTES[sh.line].name:'No line'}</span><span class="${due?'neg':''}">${Math.round(sh.cond)}%${sh.pendingYard==='dock'?' · drydock booked':''}</span></span></button>`;}).join('');
  setHTML($('fleetL'),`<h2>Fleet · ${S.ships.length} ship${S.ships.length===1?'':'s'}</h2>${items}`);
  const sh=S.ships.find(x=>x.id===S.selShip)||S.ships[0];if(sh){S.selShip=sh.id;renderShipDetail(sh);}
}
function decisionHTML(sh){
  const I=sh.incident;if(!I)return '';
  const r=ROUTES[sh.legRoute],rep=Math.round(sh.grt*0.3),port=PN[I.back?(sh.dir===0?r.a:r.b):(sh.dir===0?r.b:r.a)];
  const refund=Math.round(0.7*sh.load.paxRev);
  return `<div class="card decision"><strong>SS ${sh.name} has broken down, ${int(I.nm)} nm from ${port}</strong>
    <button class="btn" data-act="incident" data-k="wait">Repair at sea<small>About ${I.wait} days adrift · repairs ${fmt(rep)} · passengers furious, reputation −3</small></button>
    <button class="btn" data-act="incident" data-k="tug">Call an ocean tug<small>${fmt(I.tug)} plus repairs · towed to ${port} at 5 knots, then 10 days of engine repairs${I.back?' · all fares refunded':''} · reputation −1</small></button>
    <button class="btn" data-act="incident" data-k="transfer">Hand passengers to a ${RIVALS[I.rival].name} steamer<small>Refund ${fmt(refund)} (70% of fares) · still ${I.wait} days adrift · reputation −1, and a gift to a rival</small></button>
    <p class="note">With no orders within two days, the engineers start repairing at sea.</p></div>`;
}
function renderShipDetail(sh){
  const st=shipStatus(sh),age=Math.floor(yearNow()-sh.built),atSea=sh.state==='sea'||sh.state==='repo';
  setHTML($('profileD'),`<div class="stack" style="gap:8px">${profileSVG(sh,UI.view)}
    <div class="row"><div class="seg" role="group"><button data-act="view" data-v="ext" aria-pressed="${UI.view==='ext'}">Exterior</button><button data-act="view" data-v="cut" aria-pressed="${UI.view==='cut'}">Cutaway</button></div></div>
    ${UI.view==='cut'?legendHTML(sh):''}</div>`);
  const pB=sh.cond<75?(75-sh.cond)/100*0.175:0;
  const lines=Object.keys(S.lines);
  const yb=(k,label,show)=>{if(!show)return '';const c=refitCost(sh,k);
    if(sh.pendingYard===k)return `<button class="btn" data-act="unyard">Cancel ${label.toLowerCase()} order</button>`;
    return `<button class="btn" data-act="yard" data-k="${k}" ${sh.state==='yard'||sh.pendingYard||S.cash<c||S.over?'disabled':''}>${label} · ${fmt(c)} · ${YARD_DAYS[k]} days${atSea?' (on arrival)':''}</button>`;};
  const sellV=Math.round(shipValue(sh)*0.9),scrapV=sh.grt*2;
  let exitH='';
  if(sh.pendingExit)exitH=`<p class="warnline">To be ${sh.pendingExit==='scrap'?'scrapped':'sold'} when she next reaches port.</p><button class="btn" data-act="unexit">Cancel</button>`;
  else if(S.ships.length>1){
    if(UI.confirm==='sell'+sh.id)exitH=`<button class="btn danger" data-act="exit" data-k="sell">Confirm sale · ${fmt(sellV)}</button><button class="btn" data-act="cancel">Keep her</button>`;
    else if(UI.confirm==='scrap'+sh.id)exitH=`<button class="btn danger" data-act="exit" data-k="scrap">Confirm scrapping · ${fmt(scrapV)}</button><button class="btn" data-act="cancel">Keep her</button>`;
    else exitH=`<button class="btn danger" data-act="askexit" data-k="sell" ${S.over?'disabled':''}>Sell · ${fmt(sellV)}</button><button class="btn danger" data-act="askexit" data-k="scrap" ${S.over?'disabled':''}>Scrap · ${fmt(scrapV)}</button>`;
  }
  setHTML($('detailD'),`
    <div><div class="row"><h3>SS ${sh.name}</h3>${st.chip}</div>
    <div class="meta">Built ${sh.built} (${age} years) · ${int(sh.grt)} grt · ${sh.knots} knots · ${sh.fuel}-fired · worth about ${fmt(shipValue(sh))}</div></div>
    <p style="margin:0">${st.text}</p>
    ${decisionHTML(sh)}
    <div class="ratchet stack" data-key="r-ship">${adviceHTML(advice().filter(h=>h.scope==='ship'&&h.ref===sh.id))}</div>
    <div class="row meta"><span>Condition ${Math.round(sh.cond)}%</span><span>${pB>0?`About 1 crossing in ${Math.max(2,Math.round(1/pB))} breaks down`:'Reliable'}</span></div>${condBar(sh.cond)}
    ${sh.cond<35?'<p class="badline">Dangerously run down. Fire or foundering is a real risk. Send her to the yard.</p>':''}
    <div class="ctl"><label class="lbl" for="lineSel">Line</label>
      <select id="lineSel" data-shipline="1"><option value="">Laid up</option>${lines.map(rk=>`<option value="${rk}" ${sh.line===rk?'selected':''}>${ROUTES[rk].name}</option>`).join('')}</select>
      <span class="note">${sh.state==='sea'?'A change takes effect when she reaches port.':sh.line&&sh.state==='port'&&sh.port!==ROUTES[sh.line].a&&sh.port!==ROUTES[sh.line].b?'She will sail light to join the line.':'Open more lines in the Lines tab.'}</span></div>
    <div class="grid2">
      <div class="ctl"><span class="lbl">Speed</span>${seg('shipset','speed',sh.speed,['Economical','Service','Full'])}</div>
      <div class="ctl"><span class="lbl">Maintenance</span>${seg('shipset','maint',sh.maint,['None','Routine','Thorough'])}<span class="note">£${int(MAINT_COST[1]*sh.grt/8000)} or £${int(MAINT_COST[2]*sh.grt/8000)} a month</span></div>
    </div>
    <div class="ctl"><span class="lbl">Service threshold</span>${seg('shipset','autoDock',DOCK_TH.indexOf(sh.autoDock),DOCK_TH.map(v=>v?v+'%':'Off'))}
      <span class="note">${sh.autoDock?`She books herself into drydock (${fmt(refitCost(sh,'dock'))}, ${YARD_DAYS.dock} days, +35 condition) at the first port after falling below ${sh.autoDock}%.`:'Off. You must send her to the yard yourself.'} Condition drops every crossing, faster at full speed and with age. Maintenance slows the decline.</span>
      <button class="btn" data-act="alldock" style="width:fit-content">Use ${sh.autoDock?sh.autoDock+'%':'Off'} for the whole fleet</button></div>
    <div class="ctl"><span class="lbl">Shipyard</span><div class="btns">
      ${yb('dock','Drydock overhaul',true)}${yb('oil','Convert to oil',sh.fuel==='coal')}${yb('tourist','Tourist Third refit',S.m>=48&&sh.berths.tt===0&&sh.berths.t>0)}</div>
      ${sh.pendingYard&&sh.pendingYard!=='repair'?`<p class="warnline">Booked into the yard for ${YARD_NAME[sh.pendingYard]} on arrival.</p>`:''}
      ${sh.pendingYard==='repair'?'<p class="badline">Goes straight to the yard for fire repairs on arrival.</p>':''}</div>
    <div class="ctl"><span class="lbl">Retire</span><div class="btns">${exitH||'<span class="note">You cannot retire your only ship.</span>'}</div></div>`);
}

/* ---------- Lines ---------- */
function renderLines(){
  const net=rk=>S.mtd.lines[rk]||0;
  const items=Object.keys(ROUTES).map(rk=>{const r=ROUTES[rk],open=!!S.lines[rk],n=shipsOn(rk).length,sel=S.selLine===rk,t=S.tension[rk]||0;
    const chip=!open?'<span class="chip idle">Not served</span>':S.wars[rk]?'<span class="chip bad">Rate war</span>':t>=40&&!S.conf?`<span class="chip yard">${tensionWord(t)}</span>`:S.mail[rk]?'<span class="chip sea">Mail</span>':'';
    return `<button class="item${open?'':' off'}" data-key="l${rk}" data-act="selline" data-id="${rk}" aria-pressed="${sel}">
      <span class="row"><span class="nm">${r.name}</span>${chip}</span>
      <span class="row meta"><span>${int(r.dist)} nm${open?` · ${n} ship${n===1?'':'s'}`:''}</span>${open?`<span class="num ${net(rk)<0?'neg':'pos'}">${fmt(net(rk))}</span>`:''}</span></button>`;}).join('');
  setHTML($('linesL'),`<h2>Lines · month to date</h2>${items}`);
  renderLineDetail(S.selLine||'hal');
}
function renderLineDetail(rk){
  const r=ROUTES[rk],L=S.lines[rk];
  if(!L){
    setHTML($('lineD'),`<div><h3>${r.name}</h3><div class="meta">${int(r.dist)} nautical miles · line rates £${r.ref.f} / £${r.ref.s} / £${r.ref.t}</div></div>
      <p style="margin:0">${r.blurb}</p>
      <p class="note">Opening a line means setting up booking agents and a pier office at both ends. You then assign ships to it from the Fleet tab.</p>
      <button class="btn primary" data-act="openline" data-id="${rk}" ${S.cash<2500||S.over?'disabled':''} style="width:fit-content">Open this line · £2,500</button>${marketHTML(rk,null)}`);
    return;
  }
  const war=S.wars[rk],ships=shipsOn(rk);
  const rep=ships[0]||S.ships[0];
  const w=legCalc(rep,rk,0,null),e=legCalc(rep,rk,1,null);
  const rows=CL.filter(c=>rep.berths[c]||c==='tt'&&S.ships.some(s=>s.berths.tt)).map(c=>{
    const lr=Math.round(r.ref[c]*(war?war.mult:1));
    const ld=(i)=>{const x=L.last[i];return x&&x.pax[c]?`${int(x.pax[c].n)}/${x.pax[c].cap}`:'–';};
    return `<tr><td>${CL_NAME[c]}</td><td><input type="number" id="fare-${rk}-${c}" data-fare="${c}" min="1" max="500" value="${L.fares[c]}" aria-label="${CL_NAME[c]} fare in pounds"></td>
      <td class="r num">£${lr}${S.conf?`<div class="meta">floor £${confFloor(rk,c)}</div>`:''}</td><td class="r num">${ld(0)}</td><td class="r num">${ld(1)}</td></tr>`;}).join('');
  const rt=w.seaDays+e.seaDays+8;
  const legNet=l=>l.paxRev+l.cargoRev+l.mail-l.fuelC-l.prov-l.agents-l.port;
  const fixed=(crewCost(rep)+insCost(rep)+MAINT_COST[rep.maint]*rep.grt/8000)*rt/30;
  const perMonth=(legNet(w)+legNet(e)-fixed)*30/rt-ADV_COST[L.adv]/Math.max(1,ships.length);
  const fp=l=>CL.filter(c=>l.pax[c]).map(c=>`${CL_NAME[c]} ${int(l.pax[c].n)}`).join(', ');
  const nAct=ships.filter(x=>ACTIVE.includes(x.state)).length;
  const estPax=ships.length?(CL.reduce((a,c)=>a+(w.pax[c]?w.pax[c].n:0)+(e.pax[c]?e.pax[c].n:0),0))*30/rt*Math.max(1,nAct):0;
  setHTML($('lineD'),`
    <div><div class="row"><h3>${r.name}</h3>${war?'<span class="chip bad">Rate war</span>':''}</div><div class="meta">${int(r.dist)} nm · ${ships.length} ship${ships.length===1?'':'s'} · month to date ${fmt(S.mtd.lines[rk]||0)}</div></div>
    <p class="note">${r.blurb}</p>
    <div class="ratchet stack" data-key="r-line">${adviceHTML(advice().filter(h=>h.scope==='line'&&h.ref===rk))}</div>
    ${war?`<p class="badline">The conference lines have cut fares to ${Math.round(war.mult*100)}% of the line rate for ${war.left} more month${war.left>1?'s':''}.</p>`:''}
    ${S.mail[rk]?`<p class="note">Mail contract: ${fmt(S.mail[rk].pay)} per round trip. Ships at economical speed or broken down do not earn it.</p>`:''}
    <div class="tablewrap"><table><thead><tr><th>Class</th><th>Fare £</th><th class="r">Line rate</th><th class="r">Last west</th><th class="r">Last east</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="grid2">
      <div class="ctl"><span class="lbl">Service and table</span>${seg('lineset','service',L.service,['Spartan','Standard','Lavish'])}</div>
      <div class="ctl"><span class="lbl">Advertising · £/month</span>${seg('lineset','adv',L.adv,['None','300','800','1,500'])}</div>
    </div>
    <div class="forecast"><span class="lbl">Next sailing forecast · SS ${rep.name}</span>
      <dl class="kv"><dt>Westbound</dt><dd>${fmt(w.paxRev+w.cargoRev)}</dd><dt>Eastbound</dt><dd>${fmt(e.paxRev+e.cargoRev)}</dd>
      <dt>Round trip</dt><dd>${Math.round(rt)} days</dd><dt><strong>Profit per ship per month</strong></dt><dd class="${perMonth<0?'neg':'pos'}"><strong>${fmt(perMonth)}</strong></dd></dl>
      <p class="note">West: ${fp(w)||'none'}. East: ${fp(e)||'none'}. Before head office costs and bad luck.</p></div>
    ${marketHTML(rk,estPax,Math.max(1,nAct))}
    <div class="ctl"><span class="lbl">Ships on this line</span><div class="btns">${ships.map(s=>`<button class="btn" data-act="selship" data-id="${s.id}">SS ${s.name}</button>`).join('')||'<span class="note">None yet. Assign ships from the Fleet tab.</span>'}</div></div>
    <div class="btns">${UI.confirm==='close'+rk?`<button class="btn danger" data-act="closeline" data-id="${rk}">Confirm: close line</button><button class="btn" data-act="cancel">Keep it</button>`:`<button class="btn danger" data-act="askclose" data-id="${rk}">Close this line</button>`}</div>`);
}
function marketHTML(rk,estPax,n){
  const r=ROUTES[rk],m=S.m,L=S.lines[rk],st=routeStats(rk,m),tot=Math.max(1,st.total);
  const f=v=>'£'+Math.round(v);
  const owners=Object.keys(st.owners).sort((a,b)=>st.owners[b].pax-st.owners[a].pax);
  const rows=owners.map(o=>{const x=RIVALS[o],q=st.owners[o],rf=rivalFare(o,rk);
    return `<tr data-key="mo${o}"><td><span class="rdot" style="background:${RIVAL_P[o].col}"></span>${x.name}<div class="meta">${x.flag} · ${q.ships} ship${q.ships>1?'s':''}</div></td><td class="r num">${Math.round(q.pax/tot*100)}%</td><td class="r num">${f(r.ref.f*rf)}</td><td class="r num">${f(r.ref.s*rf)}</td><td class="r num">${f(r.ref.t*rf)}</td></tr>`;}).join('');
  const mine=S.ships.filter(x=>x.line===rk).length;
  const me=L?`<tr data-key="mome"><td><strong>Morven Line</strong><div class="meta">${mine} ship${mine===1?'':'s'}</div></td><td class="r num"><strong>${Math.round(st.ours.pax/tot*100)}%</strong></td><td class="r num">${f(effFare(rk,'f'))}</td><td class="r num">${f(effFare(rk,'s'))}</td><td class="r num">${f(effFare(rk,'t'))}</td></tr>`:'';
  let rl=0,rc=0;for(const o in st.owners){rl+=st.owners[o].pax;rc+=st.owners[o].cap;}
  const rel=rc?rl/rc/Math.max(0.05,S.load0[rk]*seasonNorm(rk,m)):1;
  const matched=(S.rfare&&S.rfare[rk]||1)<0.97;
  const notes=[];
  notes.push(`Rival ships here are running ${rel>1.12?'fuller than usual, so expect them to add tonnage':rel<0.72?'well below their usual loads, so expect some to withdraw':'about as full as usual for the season'}.`);
  if(matched)notes.push(`They have cut fares to ${Math.round((S.rfare[rk])*100)}% of the line rate to match yours.`);
  let tens='';
  if(L&&!S.conf){
    const t=S.tension[rk]||0,pr=pressure(rk,L.fares,estPax||S.lastPax[rk]||0,n||1,m),next=t+(pr.p-t)*0.35;
    tens=`<div class="ctl"><div class="row"><span class="lbl">Conference tension</span><span class="tier ${t>=65?'neg':t>=40?'':'pos'}" style="${t>=40&&t<65?'color:var(--warn)':''}">${tensionWord(t)} · ${Math.round(t)}</span></div>
      <div class="gauge" role="img" aria-label="Tension ${Math.round(t)} of 100"><b style="left:${t}%"></b><b class="proj" style="left:${clamp(next,0,100)}%"></b></div>
      <p class="note">At these fares, about <strong>${Math.round(next)}</strong> next month (dashed). Rate wars start above 40 and grow likely above 65; ${RIVALS[topRival(rk)].name} would lead one here. Tension rises with fares below the line rate, a large market share and extra ships. Rivals here are ${routeAggr(rk)>=1?'aggressive':routeAggr(rk)>=0.8?'watchful':'fairly relaxed'}.</p></div>`;
  } else if(L&&S.conf)tens='<p class="note">Conference member: no rate wars while you keep to the fare floor.</p>';
  return `<div class="ctl"><span class="lbl">Market report · this month, estimated</span>
    <div class="tablewrap"><table><thead><tr><th>Line</th><th class="r">Share</th><th class="r">First</th><th class="r">Second</th><th class="r">Third</th></tr></thead><tbody>${me}${rows}</tbody></table></div>
    <p class="note">${notes.join(' ')}</p></div>${tens}`;
}

/* ---------- Brokers ---------- */
function renderBrokers(){
  const body=S.market.length?S.market.map(sh=>{const dep=Math.round(sh.price*0.4);return `<div class="card" data-key="m${sh.id}">
      <div class="row"><strong>SS ${sh.name}</strong><span class="num">${fmt(sh.price)}</span></div>
      <div class="meta">Built ${sh.built} · ${int(sh.grt)} grt · ${sh.knots} knots · ${sh.fuel} · lying at ${PN[sh.port]}</div>
      <div class="meta">${sh.berths.f} first, ${sh.berths.s} second, ${sh.berths.t} third · ${int(sh.cargo)} t cargo · condition ${sh.cond}%</div>
      ${sh.note?`<div class="meta">${sh.note}</div>`:''}
      <button class="btn" data-act="buy" data-id="${sh.id}" ${S.cash<dep||S.over?'disabled':''} style="width:fit-content">Buy · ${fmt(dep)} down, ${fmt(sh.price-dep)} mortgaged</button></div>`;}).join('')
    :'<p class="note">Nothing on the lists. New ships come up every quarter.</p>';
  setHTML($('pane-brokers'),`<section class="sec"><h2>Ships for sale</h2><p class="note">The brokers send a new list every quarter. The bank mortgages 60% of the price; you pay the rest in cash. Bought ships arrive laid up where they lie.</p>${body}</section>`);
}

/* ---------- Finance ---------- */
function chart(){
  const h=[...S.hist,Math.round(S.cash)];if(h.length<2)return '';
  const W2=320,H2=80,P=6,mn=Math.min(0,...h),mx=Math.max(1,...h);
  const x=i=>P+i*(W2-2*P)/(h.length-1),y=v=>H2-P-(v-mn)/(mx-mn)*(H2-2*P);
  const pts=h.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<div><div class="row"><span class="lbl">Cash since January 1921</span><span class="meta num">high ${fmt(mx)}</span></div>
    <svg class="chart" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Cash over time"><polygon points="${x(0)},${y(mn)} ${pts} ${x(h.length-1)},${y(mn)}" style="fill:var(--brass-soft)" opacity=".6"/>
    ${mn<0?`<line x1="${P}" x2="${W2-P}" y1="${y(0)}" y2="${y(0)}" style="stroke:var(--muted)" stroke-dasharray="3 3"/>`:''}
    <polyline points="${pts}" style="fill:none;stroke:var(--brass)" stroke-width="1.8"/><circle cx="${x(h.length-1)}" cy="${y(h[h.length-1])}" r="3.5" style="fill:${h[h.length-1]<0?'var(--bad)':'var(--brass)'}"/></svg></div>`;
}
function renderFinance(){
  const c=S.mtd.cat,tot=Object.values(c).reduce((a,b)=>a+b,0);
  const cats=CATS.filter(([k])=>c[k]).map(([k,l])=>`<span>${l}</span><span class="${c[k]<0?'neg':''}">${fmt(c[k])}</span>`).join('');
  const lk=Object.keys(S.mtd.lines).map(k=>`<span>${k==='_office'?'Head office and bank':k==='_idle'?'Laid up and in yard':ROUTES[k].name}</span><span class="${S.mtd.lines[k]<0?'neg':''}">${fmt(S.mtd.lines[k])}</span>`).join('');
  const LM=S.lastMonth,hr=headroom();
  setHTML($('pane-finance'),`
    <section class="sec"><h2>Ledger · ${monthName(S.m)} to date</h2>
      <div class="pl"><div class="h">By account</div>${cats||'<span>Nothing booked yet</span><span></span>'}</div>
      <div class="pl"><div class="h">By line</div>${lk||'<span>Nothing booked yet</span><span></span>'}</div>
      <div class="total"><span>Month to date</span><span class="num ${tot<0?'neg':'pos'}">${fmt(tot)}</span></div>
      ${LM?`<p class="note">${monthName(LM.m)} closed at <span class="num ${LM.net<0?'neg':'pos'}">${fmt(LM.net)}</span>, with ${fmt(LM.repay)} repaid to the bank.</p>`:''}
      ${chart()}</section>
    <section class="sec"><h2>Bank</h2>
      <dl class="kv"><dt>Debt</dt><dd>${fmt(S.debt)}</dd><dt>Interest (6.5%)</dt><dd>${fmt(S.debt*0.065/12)}/mo</dd>
      <dt>Required repayment</dt><dd>${fmt(Math.round(S.debt*0.004))}/mo</dd><dt>Fleet value</dt><dd>${fmt(fleetValue())}</dd><dt>Can still borrow</dt><dd>${fmt(hr)}</dd></dl>
      <div class="btns"><button class="btn" data-act="borrow" ${hr<10000||S.over?'disabled':''}>Borrow £10,000</button>
      <button class="btn" data-act="repay" ${S.cash<Math.min(10000,S.debt)||S.debt<=0||S.over?'disabled':''}>Repay £10,000</button></div>
      <p class="note">The bank lends up to 70% of your fleet's value. Its overdraft runs to ${fmt(odLimit())} (£8,000 plus half your unused borrowing); below that it forecloses.</p></section>`);
}

/* ---------- Company ---------- */
function ownersByRoute(o){const c={};for(const y of S.rships)if(y.owner===o)c[y.route]=(c[y.route]||0)+1;return Object.keys(c).map(rk=>`${ROUTES[rk].name} ${c[rk]}`).join(' · ');}
function renderCompany(){
  const conf=S.conf?`<p style="margin:0"><strong>Member of the North Atlantic conference.</strong></p>
      <ul class="note" style="padding-left:18px;margin:0"><li>Fares may not go below 95% of the line rate.</li><li>Third class limited to 80% of berths.</li><li>Pooled agents add 4% to third class demand.</li><li>No rate wars. Dues £350 a month.</li></ul>
      ${UI.confirm==='leave'?`<div class="btns"><button class="btn danger" data-act="leave">Confirm: leave</button><button class="btn" data-act="cancel">Stay</button></div>`:`<button class="btn" data-act="leave" style="width:fit-content">Leave the conference</button>`}`
    :`<p style="margin:0">You sail as an <strong>independent</strong>. Price as you like, but undercutting the line rate raises conference tension and invites rate wars.</p>
      <p class="note">Joining costs £3,000 plus £350 a month. Members accept a fare floor and a steerage quota in exchange for peace.</p>
      <button class="btn" data-act="join" ${S.cash<3000||S.over?'disabled':''} style="width:fit-content">Join for £3,000</button>`;
  setHTML($('pane-company'),`
    <section class="sec"><h2>North Atlantic conference</h2>${conf}</section>
    <section class="sec"><h2>Rival lines</h2>${Object.keys(RIVAL_P).map(o=>{const x=RIVALS[o],fleet=S.rships.filter(y=>y.owner===o),by=ownersByRoute(o),mv=S.rmoves.filter(q=>q.o===o).slice(0,2);
      return `<div class="card" data-key="rv${o}"><div class="row"><strong><span class="rdot" style="background:${RIVAL_P[o].col}"></span>${x.name}</strong><span class="chip ${S.rivals[o].cash<50000?'bad':S.rivals[o].cash<250000?'yard':'sea'}">${rivalHealth(S.rivals[o].cash)}</span></div>
        <div class="meta">${x.flag} · ${fleet.length} ship${fleet.length===1?'':'s'} · ${RIVAL_P[o].aggr>=1.1?'aggressive':RIVAL_P[o].aggr>=0.9?'combative':'cautious'}</div>
        <div class="meta">${by||'No ships at sea'}</div>
        ${mv.length?`<div class="meta">${mv.map(q=>`${MONTHS[q.m%12].slice(0,3)} ${1921+Math.floor(q.m/12)}: ${q.kind==='add'?'new SS '+q.ship+' on '+ROUTES[q.rk].name:q.kind==='move'?'moved SS '+q.ship+' to '+ROUTES[q.to].name:'scrapped SS '+q.ship}`).join('<br>')}</div>`:''}</div>`;}).join('')}</section>
    <section class="sec"><h2>Settings</h2><label class="check"><input type="checkbox" id="autoP2" data-autop="1" ${UI.autoPause?'checked':''}> Pause the clock on big events</label></section>
    <section class="sec"><h2>Game</h2><div class="btns">${UI.confirm==='new'?`<button class="btn danger" data-act="new">Confirm: start again</button><button class="btn" data-act="cancel">Keep playing</button>`:`<button class="btn" data-act="new">New game</button>`}</div></section>`);
}
function renderModal(){
  const el=$('modal');if(!S.over){el.innerHTML='';return;}
  const nw=netWorth();
  const v=S.over==='bust'?'The bank has foreclosed. The Morven Line is finished.':nw<50000?'You survived the decade, just. The Line limps into the Depression.':
    nw<250000?'A respectable independent line. The big companies know your name.':nw<600000?'A serious force on the Atlantic. The conference would rather have you inside than out.':'A great line. Your flagship is the talk of New York.';
  setHTML(el,`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="panel"><h3 id="mt">${S.over==='bust'?'Foreclosed':'January 1930'}</h3><p style="margin:0">${v}</p>
    <dl class="kv"><dt>Net worth</dt><dd>${fmt(nw)}</dd><dt>Fleet</dt><dd>${S.ships.length}</dd><dt>Reputation</dt><dd>${Math.round(S.rep)}</dd><dt>Reached</dt><dd>${dateLong(S.t)}</dd></dl>
    <button class="btn primary" data-act="newnow">Start a new line</button></div></div>`);
}
function layoutMode(){
  const w=window.innerWidth>=1280;if(w===UI.wide)return;UI.wide=w;
  document.querySelector('.app').classList.toggle('wide',w);$('leftSide').hidden=!w;
  const ov=$('pane-overview');(w?$('leftBody'):$('tabbody')).prepend(ov);
  if(w&&UI.tab==='overview')UI.tab='fleet';
  $('tabsN')._h=null;UI.dirty=true;VIEW.s=null;requestAnimationFrame(applyView);
}
window.addEventListener('resize',layoutMode);
const PANE_RENDER={overview:renderOverview,fleet:renderFleet,lines:renderLines,brokers:renderBrokers,finance:renderFinance,company:renderCompany};
/* Grow-only slots: lists that change while the clock runs may grow, but never shrink under the pointer.
   The held space is released on the next user action (UI.rev) or when the selected ship or line changes. */
function ratchet(){
  const ctx=UI.rev+'|'+S.selShip+'|'+S.selLine+'|'+UI.tab;
  for(const el of document.querySelectorAll('.ratchet')){
    if(el._ctx!==ctx){el._ctx=ctx;el._min=0;el.style.minHeight='';}
    if(!el.offsetParent)continue;
    el.style.minHeight='';const h=el.offsetHeight;if(h>el._min)el._min=h;if(el._min)el.style.minHeight=el._min+'px';
  }
}
function render(){renderHeader();renderTabs();renderMap();if(UI.wide&&UI.tab!=='overview')renderOverview();PANE_RENDER[UI.tab]();renderModal();ratchet();}
