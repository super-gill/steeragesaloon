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
  if(a.hasAttribute('data-hold'))return; // animated in place by its own loop
  if(tag==='TEXTAREA'){if(!focused&&!a.hasAttribute('data-keep')&&a.value!==b.value)a.value=b.value;return;}
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
const TABS=[['overview','Overview'],['fleet','Fleet'],['lines','Lines'],['brokers','Buy & build'],['shore','Shore'],['finance','Finance'],['company','Company']];
function shipStatus(sh){
  if(isSilent(sh)){const e=estimateOf(sh),to=PN[destOf(sh)],fr=PN[geoEnds(sh.geo)[sh.dir]],n=Math.max(1,Math.ceil(e.due)),dd=`${n} day${n>1?'s':''}`;
    const last=e.seen?` Last reported ${dateLong(e.seen.t)}, ${e.seen.stopped?'stopped at sea':'under tow'}.`:'';
    if(e.over>=1){const o=Math.floor(e.over);return {chip:'<span class="chip bad">Overdue</span>',short:`Overdue at ${to}, ${o} day${o>1?'s':''}`,text:`Overdue at ${to} by ${o} day${o>1?'s':''}.${last||` No word of her since she sailed from ${fr}.`} She carries no wireless.`};}
    return {chip:'<span class="chip sea">At sea</span>',short:`${to} bound, due in ${dd} (reckoned)`,text:`No wireless aboard: nothing will be heard until she arrives or a passing ship reports her. By reckoning she is about ${int(e.pos)} nm out from ${fr} towards ${to}, due in about ${dd}.${last}`};}
  if(sh.state==='sea'){const g=GEO(sh.geo||geoKey(sh.legRoute,S.m)),to=PN[destOf(sh)],calls=sh.stops?sh.stops.length-sh.nextCall:0;
    const left=(g.dist-sh.pos)/(knotsOf(sh)*SPD[sh.speed]*24*sh.slow*(sh.limp?(sh.limpF||0.4):1))+calls*CALL_DAYS,dl=Math.max(1,Math.ceil(left)),days=`${dl} day${dl>1?'s':''}`;
    const nx=sh.stops&&sh.stops[sh.nextCall]?` Next call ${PN[sh.stops[sh.nextCall][0]]}.`:'';
    if(sh.towed)return {chip:'<span class="chip bad">Under tow</span>',short:`Under tow to ${to}`,text:`Under tow to ${to} at 5 knots, about ${Math.max(1,Math.ceil((g.dist-sh.pos)/120))} days.`};
    if(sh.stopLeft>0){const B=sh.brk,n=Math.max(1,Math.ceil(sh.stopLeft)),dd=`${n} day${n>1?'s':''}`;
      if(!B||!B.told)return {chip:'<span class="chip bad">Stopped</span>',short:'Stopped, engineers at work',text:`Stopped at sea, ${to} bound. The engineers are finding out what has gone.`};
      if(B.o==='fail')return {chip:'<span class="chip bad">Drifting</span>',short:`Drifting, tug in about ${dd}`,text:`Disabled and drifting, ${to} bound. A salvage tug is due in about ${dd}.`};
      if(B.o==='long')return {chip:'<span class="chip bad">Repairing</span>',short:`Repairing at sea, ${dd}`,text:`Stopped mid-ocean, ${to} bound. The engineers expect about ${dd} more.`};
      return {chip:'<span class="chip bad">Repairing</span>',short:'Repairs in hand',text:`Stopped briefly, ${to} bound, while the engineers make good.`};}
    if(sh.callLeft>0)return {chip:'<span class="chip inport">Calling</span>',short:`Calling at ${PN[sh.callPort]}`,text:`Calling at ${PN[sh.callPort]} for passengers, mail and cargo, ${to} bound. About ${days} to go.`};
    return {chip:sh.limp?'<span class="chip bad">Limping</span>':'<span class="chip sea">At sea</span>',short:`${to} bound, ${days}`,text:`Bound for ${to}. ${int(sh.pos)} of ${int(g.dist)} nm, about ${days} to go.${nx}`};}
  if(sh.state==='port')return {chip:'<span class="chip inport">In port</span>',short:`Loading at ${PN[sh.port]}`,text:`Loading at ${PN[sh.port]}. Sails in ${Math.max(1,Math.ceil(sh.portLeft))} day${Math.ceil(sh.portLeft)>1?'s':''}.`};
  if(sh.state==='repo')return {chip:'<span class="chip sea">Positioning</span>',short:`Sailing light to ${PN[sh.repoTo]}`,text:`Sailing light to ${PN[sh.repoTo]}, ${Math.max(1,Math.ceil(sh.repoLeft))} days out.`};
  if(sh.state==='yard')return {chip:'<span class="chip yard">In yard</span>',short:`In yard, ${Math.ceil(sh.yardLeft)} days`,text:`${YARD_NAME[sh.yardKind][0].toUpperCase()+YARD_NAME[sh.yardKind].slice(1)} at ${PN[sh.port]}, ${Math.ceil(sh.yardLeft)} days left.`};
  return {chip:'<span class="chip idle">Laid up</span>',short:`Laid up at ${PN[sh.port]}`,text:`Laid up at ${PN[sh.port]} on a skeleton crew. Assign her to a line to sail.`};
}
function renderHeader(){
  setHTML($('brand'),`<span class="eyebrow"><span class="long">Steerage &amp; Saloon · The Morven Line </span><span class="ver">v${GAME_VERSION}</span></span><h1>${dateLong(S.t)}</h1>`);
  setHTML($('clock'),`<span class="lbl">Clock</span><div class="seg" role="group" aria-label="Game speed">${['Pause','1×','3×','7×'].map((l,i)=>`<button data-act="speed" data-v="${i}" aria-pressed="${UI.speed===i}" ${S.over?'disabled':''}>${l}</button>`).join('')}</div>`);
  setHTML($('stats'),`<div><dt>Cash</dt><dd class="${S.cash<0?'neg':''}">${fmt(S.cash)}</dd></div><div><dt>Bank debt</dt><dd>${fmt(S.debt)}</dd></div>
    <div><dt>Reputation</dt><dd>${Math.round(S.rep)} <small>${repWord(S.rep)}</small></dd></div><div><dt>Net worth</dt><dd>${fmt(netWorth())}</dd></div>`);
}
function renderTabs(){
  const n=alerts().length;
  const badge={overview:n?`<span class="badge">${n}</span>`:'',fleet:`<span class="count">${S.ships.length}</span>`,lines:`<span class="count">${Object.keys(S.lines).length}</span>`};
  setHTML($('tabsN'),TABS.filter(([k])=>!(UI.wide&&k==='overview')).map(([k,l])=>`<button role="tab" data-act="tabgo" data-tab="${k}" aria-selected="${UI.tab===k}">${l}${badge[k]||''}</button>`).join('')
    +`<button class="maptoggle" data-act="maptoggle" aria-pressed="${!!UI.noMap}">${UI.noMap?'Show chart':'Hide chart'}</button>`);
  document.querySelector('.app').classList.toggle('nomap',!!UI.noMap);
  for(const [k] of TABS)$('pane-'+k).hidden=k==='overview'?!(UI.wide||UI.tab==='overview'):UI.tab!==k;
}

/* ---------- Overview ---------- */
function alerts(){
  const A=[];
  for(const sh of S.ships){
    if(sh.state==='laid')A.push({id:'laid'+sh.id,k:'warn',t:`SS ${sh.name} is laid up at ${PN[sh.port]}, still drawing wages.`,b:[['Assign a line','selship',sh.id]]});
    else if(sh.cond<35&&sh.state!=='yard'&&sh.pendingYard!=='dock')A.push({id:'rundown'+sh.id,k:'bad',t:`SS ${sh.name} is dangerously run down at ${Math.round(sh.cond)}%.`,b:[['Send to the yard','selship',sh.id]]});
    else if(!sh.autoDock&&sh.cond<50&&sh.state!=='yard'&&!sh.pendingYard)A.push({id:'nothresh'+sh.id,k:'warn',t:`SS ${sh.name} is at ${Math.round(sh.cond)}% and has no service threshold.`,b:[['Review','selship',sh.id]]});
    if(sh.dockWarn&&sh.state!=='yard')A.push({id:'dockwarn'+sh.id,k:'warn',t:`SS ${sh.name} is due a drydock the account cannot cover.`,b:[['Bank','tabgo','finance']]});
  }
  if(S.offer)A.push({id:'offer',noNote:true,k:'good',t:`The Post Office offers ${fmt(S.offer.pay)} per round trip for the ${ROUTES[S.offer.route].name} mail. Miss a month and you are warned; miss two and it goes.`,b:[['Accept','accept'],['Decline','decline']]});
  for(const rk of Object.keys(S.lines)){
    const r=ROUTES[rk],t=S.tension[rk]||0;
    if(S.wars[rk])A.push({id:'war'+rk,k:'bad',t:`Rate war on ${r.name}, ${S.wars[rk].left} more month${S.wars[rk].left>1?'s':''}.`,b:[['View line','selline',rk]]});
    else if(t>=40&&!S.conf)A.push({id:'tension'+rk,k:'warn',t:`Conference tension is ${tensionWord(t).toLowerCase()} on ${r.name} (${Math.round(t)}).`,b:[['Review fares','selline',rk]]});
    if(!shipsOn(rk).length)A.push({id:'empty'+rk,k:'warn',t:`${r.name} is open but has no ships assigned.`,b:[['View line','selline',rk]]});
  }
  if(S.union)A.push({id:'union',noNote:true,k:'bad',t:`The seamen's union claims ${S.union.pct}% more pay. Refusing risks a strike in the home ports; silence counts as refusal.`,b:[['Agree','union','yes'],['Refuse','union','no']]});
  if(S.strike)A.push({id:'strike',k:'bad',t:`Seamen on strike in the home ports until about ${dateLong(S.strike.until)}.`,b:[]});
  if(S.crash&&S.crash.stage==='rumour')A.push({id:'rumour'+S.crash.m0,k:'bad',t:S.crash.bank?`Rumours about ${BANK_NAME}, where the Line keeps its cash.`:'The markets are nervous and the banks are calling in loans.',b:[['Bank and stock','tabgo','finance']]});
  if(S.call)A.push({id:'call',k:'bad',t:`The bank has called in ${fmt(S.call.amt)}, due by ${monthName(S.call.due)}. Unpaid, it will seize ships.`,b:[['Bank','tabgo','finance']]});
  for(const sh of S.ships)if(fatOf(sh)>=90&&sh.state!=='yard')A.push({id:'worn'+sh.id,k:'warn',t:`SS ${sh.name} is worn out and should go to the breakers.`,b:[['View','selship',sh.id]]});
  if(S.cash<0)A.push({id:'od',k:'bad',t:`The account is overdrawn. The bank forecloses below ${fmt(-odLimit())}.`,b:[['Bank','tabgo','finance']]});
  const seen=S.attnSeen||{};return A.filter(a=>!(seen[a.id]>S.t)); // an item the owner has acted on stays away for a month
}
function renderOverview(){
  const A=alerts(),ADV=shownAdvice(),mtd=Object.values(S.mtd.cat).reduce((a,b)=>a+b,0),LM=S.lastMonth;
  const atSea=S.ships.filter(s=>s.state==='sea').length;
  const best=Object.keys(S.lines).sort((a,b)=>(S.mtd.lines[b]||0)-(S.mtd.lines[a]||0))[0];
  const tiles=`<div class="tiles">
    <div class="tile"><span class="lbl">${MONTHS[S.m%12]} so far</span><b class="${mtd<0?'neg':'pos'}">${fmt(mtd)}</b></div>
    <div class="tile"><span class="lbl">Last month</span><b class="${LM&&LM.net<0?'neg':'pos'}">${LM?fmt(LM.net):'None yet'}</b></div>
    <div class="tile"><span class="lbl">Ships at sea</span><b>${atSea} of ${S.ships.length}</b></div>
    <div class="tile"><span class="lbl">Best line this month</span><b style="font-size:14px;font-family:var(--body)">${best?ROUTES[best].name:'None open'}</b></div></div>`;
  const al=A.length?A.map(a=>`<div class="alert ${a.k}" data-key="${keyOf(a.t.slice(0,40))}" data-aid="${a.id}"><span>${a.t}</span><span class="btns">${a.b.map(([l,act,id])=>`<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${id}"`:id!==undefined?`data-id="${id}"`:''}>${l}</button>`).join('')}${a.noNote?'':'<button class="btn quiet" data-act="noted">Noted</button>'}</span></div>`).join('')
    :'';
  const props=(S.props||[]).map(p=>`<div class="alert prop" data-key="pr${keyOf(p.id)}"><span><strong>${DEPTS[p.dept].name} proposes:</strong> ${p.title}.<br><small class="note">${p.why}</small></span>
    <span class="btns"><button class="btn primary" data-act="propyes" data-d='${JSON.stringify([p.id]).replace(/'/g,"&#39;")}'>${p.act==='build'?'Open the drawing office':'Approve'}</button><button class="btn" data-act="propno" data-d='${JSON.stringify([p.id]).replace(/'/g,"&#39;")}'>Decline</button></span></div>`).join('');
  const attn=props+al||'<p class="note">Nothing needs you right now. The fleet is sailing to orders.</p>';
  const fleet=S.ships.map(sh=>{const st=shipStatus(sh);return `<button class="glance" data-key="gs${sh.id}" data-act="selship" data-id="${sh.id}"><span class="nm">SS ${sh.name}</span><span class="meta">${st.short}</span><span class="mini">${condBar(sh.cond)}</span></button>`;}).join('');
  const lines=Object.keys(S.lines).map(rk=>{const v=S.mtd.lines[rk]||0,t=S.tension[rk]||0;
    return `<button class="glance" data-key="gl${rk}" data-act="selline" data-id="${rk}"><span class="nm">${ROUTES[rk].name}</span><span class="meta">${shipsOn(rk).length} ship${shipsOn(rk).length===1?'':'s'}${S.wars[rk]?' · rate war':t>=40?' · '+tensionWord(t).toLowerCase():''}</span><span class="num ${v<0?'neg':'pos'}">${fmt(v)}</span></button>`;}).join('');
  setHTML($('pane-overview'),`
    ${tutorialHTML()}
    <section class="sec">${tiles}</section>
    ${trayHTML(A.length+(S.props||[]).length,attn,ADV)}
    <section class="sec"><h2>Fleet</h2><div class="glist">${fleet}</div></section>
    <section class="sec"><h2>Lines · month to date</h2><div class="glist">${lines||'<p class="note">No lines open.</p>'}</div></section>
    <section class="sec"><h2>Shortcuts</h2><div class="btns">
      <button class="btn" data-act="tabgo" data-tab="brokers">Buy a ship</button><button class="btn" data-act="dzopen">Design a ship</button><button class="btn" data-act="newline">Open a new line</button>
      <button class="btn" data-act="tabgo" data-tab="finance">Bank and ledger</button><button class="btn" data-act="tabgo" data-tab="shore">Shore and offices</button><button class="btn" data-act="tabgo" data-tab="company">Conference</button><button class="btn" data-act="tabgo" data-tab="company">Save code</button></div></section>
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
/* ---------- Wireless ---------- */
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function wireHTML(list,anim){
  if(!list.length)return '<p class="note">No traffic yet.</p>';
  return list.map(m=>{const unread=anim&&m.read===false;
    return `<div class="tg ${m.k==='bad'?'bad':m.k==='good'?'good':m.k==='r'?'rt':''}${unread?' unread':''}" data-key="w${m.id}" ${unread?`data-act="wread" data-id="${m.id}" role="button" tabindex="0" title="Decode"`:''}><div class="tg-h"><span>SS ${esc(m.ship)}</span><span>${esc(m.via||'')} · ${dateLong(m.t)}</span></div>
      ${anim?`<div class="tg-b hold" data-hold="${m.id}"><span class="tg-sz">${esc(m.txt)}</span><span class="tg-an">${unread?`<span class="mo">${morseOf(m.txt)}</span>`:esc(m.txt)}</span></div>${unread?'<div class="tg-tap">Undecoded. Tap to decode.</div>':''}`:`<div class="tg-b">${esc(m.txt)}</div>`}</div>`;}).join('');
}
/* ---------- the tray: everything that arrives on its own lives in one fixed-height box, so nothing below it moves ---------- */
function trayHTML(nAttn,attn,ADV){
  const W=(S.wire||[]).filter(m=>UI.wireRoutine!==false||m.k!=='r');
  if(!UI.trayTab)UI.trayTab=nAttn?'attn':'wire';
  const newW=W.filter(m=>m.read===false).length;
  const tab=(k,l,n,cls)=>`<button role="tab" data-act="traytab" data-id="${k}" aria-selected="${UI.trayTab===k}">${l}${n?` <span class="${cls}">${n}</span>`:''}</button>`;
  let body;
  if(UI.trayHold&&UI._tray&&UI._tray.tab===UI.trayTab&&UI._tray.rev===UI.rev)body=UI._tray.body; // the pointer is on it: hold still, until the player does something
  else{
    body=UI.trayTab==='attn'?attn:UI.trayTab==='advice'?adviceHTML(ADV,'Head office has no complaints. The books look sound at current settings.')
      :`<div class="row">${newW?`<button class="btn quiet" data-act="wreadall">Decode all ${newW}</button>`:'<span></span>'}<label class="check"><input type="checkbox" data-wirert="1" ${UI.wireRoutine!==false?'checked':''}> Sailings and arrivals</label></div><div class="stack tape" style="gap:6px">${wireHTML(W.slice(0,30),true)}</div>`;
    UI._tray={tab:UI.trayTab,body,rev:UI.rev};}
  return `<section class="sec tray"><div class="traytabs" role="tablist">${tab('attn','Needs attention',nAttn,'badge')}${tab('advice','Advice',ADV.length,'count')}${tab('wire','Wireless',newW,'badge wb')}</div>
    <div class="traybody" id="traybody" data-key="tray-${UI.trayTab}">${body}</div></section>`;
}
/* advice for one ship or line sits behind a single row of constant height, opened on request */
function advRow(key,list,who){
  const open=UI.advOpen===key;
  if(!list.length)return `<div class="advrow none">No suggestions from head office for ${who}.</div>`;
  return `<button class="advrow" data-act="advopen" data-id="${key}" aria-expanded="${open}">Head office has ${list.length} suggestion${list.length>1?'s':''} for ${who} <span>${open?'Hide':'Show'}</span></button>${open?`<div class="stack">${adviceHTML(list)}</div>`:''}`;
}
/* the newest message prints as Morse on the tape, then decodes letter by letter into words */
function animWire(now){
  if(UI._waLast&&UI._waLast!==UI.wa&&!UI._waLast.done){const L=UI._waLast,e=document.querySelector(`[data-hold="${L.id}"] .tg-an`);L.done=true;if(e){if(L.mode==='decode')e.textContent=L.txt;else e.innerHTML=`<span class="mo">${morseOf(L.txt)}</span>`;}}
  UI._waLast=UI.wa;
  const A=UI.wa;if(!A||A.done)return;
  const el=document.querySelector(`[data-hold="${A.id}"]`);
  if(!el){if(now-A.made>15000)A.done=true;return;}
  const an=el.querySelector('.tg-an');if(!an)return;
  if(!A.start)A.start=now;
  const t=now-A.start,txt=A.txt,M=morseOf(txt),pd=A.mode==='decode'?0:Math.min(1400,M.length*5);
  let h;
  if(A.mode!=='decode'){if(t>=pd){A.done=true;an.innerHTML=`<span class="mo">${M}</span>`;return;}h=`<span class="mo">${M.slice(0,Math.ceil(M.length*t/pd))}</span>`;}
  else{const k=Math.floor((t-pd)/45);
    if(k>=txt.length){A.done=true;an.textContent=txt;return;}
    h=esc(txt.slice(0,k))+`<span class="mo">${morseOf(txt.slice(k))}</span>`;}
  if(an._h!==h){an._h=h;an.innerHTML=h;}
}
function renderShipDetail(sh){
  const st=shipStatus(sh),age=Math.floor(yearNow()-sh.built),atSea=sh.state==='sea'||sh.state==='repo';
  setHTML($('profileD'),`<div class="stack" style="gap:8px">${profileSVG(sh,UI.view)}
    <div class="row"><div class="seg" role="group"><button data-act="view" data-v="ext" aria-pressed="${UI.view==='ext'}">Exterior</button><button data-act="view" data-v="cut" aria-pressed="${UI.view==='cut'}">Cutaway</button></div></div>
    ${UI.view==='cut'?legendHTML(sh):''}</div>`);
  const pB=sh.cond<75?(75-sh.cond)/100*0.175:0;
  const lines=Object.keys(S.lines);
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
    <div class="meta">Built ${sh.built} (${age} years) · ${int(sh.grt)} grt · ${knotsOf(sh)} knots · ${sh.fuel}-fired · worth about ${fmt(shipValue(sh))}</div></div>
    <p class="stline">${st.text}</p>
    ${advRow('ship'+sh.id,shownAdvice().filter(h=>h.scope==='ship'&&h.ref===sh.id),'her')}
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
    ${captainHTML(sh)}
    <div class="ctl"><div class="row"><span class="lbl">Crew</span><span class="meta">Morale ${Math.round(sh.morale)} · ${sh.morale<40?'sullen':sh.morale<60?'grumbling':sh.morale<75?'content':'a happy ship'}</span></div>${condBar(sh.morale)}
      ${seg('shipset','pay',sh.pay,['Low pay','Union rates','Good pay'])}
      <span class="note">Wages ${fmt(crewCost(sh))} a month. Low pay saves money but a sullen crew breaks more, serves worse and deserts in port. Morale settles toward what pay and the master earn.</span></div>
    <div class="ctl"><div class="row"><span class="lbl">Fittings</span><span class="meta">${Math.round(sh.fit)}%</span></div>${condBar(sh.fit)}
      <span class="note">Cabins, saloons and linen wear out a few points a year. Tired fittings put off first and second class. A refurbishment restores them.</span></div>
    <div class="ctl"><span class="lbl">Refits and facilities</span>
      ${sh.state==='yard'?`<p class="warnline">In the yard for ${[sh.yardKind,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}: about ${Math.ceil(sh.yardLeft)} days to go.</p>`:''}
      ${sh.pendingYard?`<p class="${sh.pendingYard==='repair'?'badline':'warnline'}">Booked into the yard on arrival for ${[sh.pendingYard,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}.</p>`:''}
      <div class="meta">${[...Object.keys(UPGRADES).filter(k=>sh.up&&sh.up[k]).map(k=>UPGRADES[k].name),...Object.keys(EQUIP).filter(k=>sh.up&&sh.up[k]).map(k=>EQUIP[k].name)].join(' · ')||'No upgrades fitted.'}</div>
      <div class="meta">${FAC_KEYS.filter(k=>facLv(sh,k)).map(k=>FAC[k].levels[facLv(sh,k)].n).join(' · ')||'Plain public rooms.'} ${slotsUsed(sh.fac)} of ${slotsOf(sh)} venues used.</div>
      <div class="btns"><button class="btn primary" data-act="refit" data-id="${sh.id}" ${S.over?'disabled':''}>Open the refit office</button>${sh.pendingYard&&sh.pendingYard!=='repair'?'<button class="btn" data-act="unyardall">Cancel the booking</button>':''}</div>
      <span class="note">Every yard job, upgrade and facility for her in one window, booked as one visit.${atOwnYard(sh)?' She is at your own yard: work here is 30% cheaper and quicker.':''}</span></div>
    <div class="ctl"><span class="lbl">Retire</span><div class="btns">${exitH||'<span class="note">You cannot retire your only ship.</span>'}</div></div>
    ${sh.lastRemark?`<div class="ctl"><span class="lbl">The master's last word</span><blockquote class="remark">${esc(plainTel(telegram(sh.lastRemark.txt)).replace(/^Master to owners\. /,''))}<footer>${esc(sh.lastRemark.who)}, ${dateLong(sh.lastRemark.t)}</footer></blockquote></div>`:''}
    <div class="ctl"><span class="lbl">Her hull</span><span class="note"><strong>${fatWord(sh)}.</strong> ${Math.floor(yearNow()-sh.built)} years old${condCap(sh)<92?`; the yard can bring her to ${condCap(sh)}% at best`:''}${sh.replates?`, re-plated ${sh.replates===1?'once':sh.replates+' times'}`:''}. Hard driving, full speed, gales and neglect use up her life faster. ${dimsOf(sh).len|0} ft long, drawing ${dimsOf(sh).draught|0} ft${sh.len?'':' (estimated)'}. ${(sh.foul||0)<0.2?'Clean bottom.':(sh.foul||0)<0.45?'Some growth on her bottom.':(sh.foul||0)<0.7?'Her bottom is foul; she has lost speed.':'Badly foul and slow. She needs drydocking.'}</span></div>
    ${(()=>{const L=(S.wire||[]).filter(m=>m.sid===sh.id&&m.k!=='r').slice(0,3);return L.length?`<div class="stack tape" style="gap:6px"><span class="lbl">Latest from her</span>${wireHTML(L,false)}</div>`:'';})()}`);
}

function captainHTML(sh){
  const c=sh.captain;if(!c)return '';
  const tr=t=>`<span class="chip ${CAPT_TRAITS[t].good?'sea':'bad'}" title="${CAPT_TRAITS[t].desc}">${CAPT_TRAITS[t].name}</span>`;
  const pool=UI.capPool===sh.id?`<div class="stack" style="gap:6px">${(S.capPool||[]).map(q=>`<div class="uprow" data-key="cp${q.id}"><div><strong>${q.name}</strong> ${q.traits.map(tr).join(' ')}<div class="meta">Age ${q.age} · ${q.exp} years in command · £${q.wage} a month${q.traits.length?' · '+q.traits.map(t=>CAPT_TRAITS[t].desc).join(' '):' · no marked habits'}</div></div>
      <button class="btn" data-act="hire" data-d='${JSON.stringify([sh.id,q.id])}' ${S.over?'disabled':''}>Appoint</button></div>`).join('')||'<p class="note">No masters are looking for a ship this quarter.</p>'}<p class="note">The pool changes every quarter. A replaced master under 63 goes back into it.</p></div>`:'';
  return `<div class="ctl"><span class="lbl">Master</span><div class="card" style="gap:4px"><div class="row"><strong>${c.name}</strong><span class="meta">£${c.wage} a month</span></div>
    <div class="meta">Age ${c.age} · ${c.exp} years in command${c.age>=62?' · retires at 65':''}</div>
    ${c.traits.length?`<div class="btns">${c.traits.map(tr).join('')}</div><p class="note" style="margin:0">${c.traits.map(t=>CAPT_TRAITS[t].desc).join(' ')}</p>`:'<p class="note" style="margin:0">A steady master with no marked habits.</p>'}
    <button class="btn quiet" data-act="cappool" data-id="${sh.id}" style="width:fit-content">${UI.capPool===sh.id?'Close':'Masters available ('+(S.capPool||[]).length+')'}</button></div>${pool}</div>`;
}
const callsText=rk=>ROUTES[rk].calls.map(p=>PN[p]).join(' → ');
function cargoText(rk){const r=ROUTES[rk],m=S.m,f=(cd,dir)=>{const c=COMM[cd.c],sn=c.season?cargoSeason(cd.c,m):1;
  return `${dir}: ${c.name.toLowerCase()}, about ${int(cd.t)} t a sailing${c.reefer?' (refrigerated holds needed)':''}${c.season?`, ${sn>=1.2?'in season now':sn<=0.7?'out of season now':'fair this month'}`:''}`;};
  return f(r.cargo.out,'Outward')+'. '+f(r.cargo.home,'Homeward')+'.';}
/* ---------- Lines ---------- */
function renderLines(){
  const net=rk=>S.mtd.lines[rk]||0;
  const item=rk=>{const r=ROUTES[rk],open=!!S.lines[rk],n=shipsOn(rk).length,sel=S.selLine===rk,t=S.tension[rk]||0;
    const chip=!open?'<span class="chip idle">Not served</span>':S.wars[rk]?'<span class="chip bad">Rate war</span>':t>=40&&!S.conf?`<span class="chip yard">${tensionWord(t)}</span>`:S.mail[rk]?'<span class="chip sea">Mail</span>':'';
    return `<button class="item${open?'':' off'}" data-key="l${rk}" data-act="selline" data-id="${rk}" aria-pressed="${sel}">
      <span class="row"><span class="nm">${r.name}</span>${chip}</span>
      <span class="row meta"><span>${r.calls.length>2?(r.calls.length-2)+' call'+(r.calls.length>3?'s':'')+' · ':''}${int(r.dist)} nm${open?` · ${n} ship${n===1?'':'s'}`:''}</span>${open?`<span class="num ${net(rk)<0?'neg':'pos'}">${fmt(net(rk))}</span>`:''}</span></button>`;};
  const items=ROUTE_GROUPS.map(g=>`<div class="lgroup" data-key="lg${g}">${g}</div>`+Object.keys(ROUTES).filter(rk=>ROUTES[rk].group===g).map(item).join('')).join('');

  setHTML($('linesL'),`<h2>Lines · month to date</h2>${items}`);
  renderLineDetail(S.selLine||'hal');
}
function renderLineDetail(rk){
  const r=ROUTES[rk],L=S.lines[rk];
  if(!L){
    setHTML($('lineD'),`<div><h3>${r.name}</h3><div class="meta">${callsText(rk)} · ${int(r.dist)} nautical miles · line rates £${r.ref.f} / £${r.ref.s} / £${r.ref.t}${airShare(rk,'f',S.m)>0.005?` · the air takes about ${Math.round(airShare(rk,'f',S.m)*100)}% of first class${S.ships.some(x=>x.line===rk&&knotsOf(x)>=26)?' (your fast ships hold the rest)':'; a 26-knot ship holds more of it'}`:''}</div></div>
      <p style="margin:0">${r.blurb}</p><p class="note">${cargoText(rk)}${r.winter?' From December to April the St Lawrence is frozen: sailings run to Saint John instead.':''}</p>
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
  const ec=econ(rep,rk),rt=ec.rt,perMonth=ec.pm;
  const fp=l=>CL.filter(c=>l.pax[c]).map(c=>`${CL_NAME[c]} ${int(l.pax[c].n)}`).join(', ');
  const nAct=ships.filter(x=>ACTIVE.includes(x.state)).length;
  const estPax=ships.length?(CL.reduce((a,c)=>a+(w.pax[c]?w.pax[c].n:0)+(e.pax[c]?e.pax[c].n:0),0))*30/rt*Math.max(1,nAct):0;
  setHTML($('lineD'),`
    <div><div class="row"><h3>${r.name}</h3>${war?'<span class="chip bad">Rate war</span>':''}</div><div class="meta">${callsText(rk)} · ${int(r.dist)} nm · ${ships.length} ship${ships.length===1?'':'s'} · month to date ${fmt(S.mtd.lines[rk]||0)}</div></div>
    <p class="note">${r.blurb} ${cargoText(rk)}${r.winter?(r.winter.months.includes(S.m%12)?' The St Lawrence is frozen: sailings run to Saint John until May.':' From December to April the St Lawrence freezes and sailings run to Saint John.'):''}</p>
    ${advRow('line'+rk,shownAdvice().filter(h=>h.scope==='line'&&h.ref===rk),'this line')}
    ${war?`<p class="badline">The conference lines have cut fares to ${Math.round(war.mult*100)}% of the line rate for ${war.left} more month${war.left>1?'s':''}.</p>`:''}
    ${S.mail[rk]?`<p class="note">Mail contract: ${fmt(S.mail[rk].pay)} per round trip. Ships at economical speed or broken down do not earn it.</p>`:''}
    <div class="tablewrap"><table><thead><tr><th>Class</th><th>Fare £</th><th class="r">Line rate</th><th class="r">Last out</th><th class="r">Last home</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="grid2">
      <div class="ctl"><span class="lbl">Service and table</span>${seg('lineset','service',L.service,['Spartan','Standard','Lavish'])}</div>
      <div class="ctl"><span class="lbl">Advertising · £/month</span>${seg('lineset','adv',L.adv,['None','300','800','1,500'])}</div>
    </div>
    <div class="forecast"><span class="lbl">Next sailing forecast · SS ${rep.name}</span>
      <dl class="kv"><dt>Outward</dt><dd>${fmt(w.paxRev+w.cargoRev)}</dd><dt>Homeward</dt><dd>${fmt(e.paxRev+e.cargoRev)}</dd>
      <dt>Round trip</dt><dd>${Math.round(rt)} days</dd><dt><strong>Profit per ship per month</strong></dt><dd class="${perMonth<0?'neg':'pos'}"><strong>${fmt(perMonth)}</strong></dd></dl>
      <p class="note">Out: ${fp(w)||'no passengers'}, ${int(w.cargoT)} t ${COMM[w.comm].name.toLowerCase()}. Home: ${fp(e)||'no passengers'}, ${int(e.cargoT)} t ${COMM[e.comm].name.toLowerCase()}. Before head office costs and bad luck.</p></div>
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
      <div class="meta">${sh.berths.f} first, ${sh.berths.s} second, ${sh.berths.t} third · ${int(sh.cargo)} t cargo${sh.up&&sh.up.reefer?' (refrigerated)':''} · condition ${Math.round(sh.cond)}%${sh.up&&sh.up.wireless?' · wireless':''}</div>
      <div class="meta">Comes with ${sh.captain.name}${sh.captain.traits.length?' ('+sh.captain.traits.map(t=>CAPT_TRAITS[t].name.toLowerCase()).join(', ')+')':''}</div>
      ${sh.note?`<div class="meta">${sh.note}</div>`:''}
      <button class="btn" data-act="buy" data-id="${sh.id}" ${S.cash<dep||S.over?'disabled':''} style="width:fit-content">Buy · ${fmt(dep)} down, ${fmt(sh.price-dep)} mortgaged</button></div>`;}).join('')
    :'<p class="note">Nothing on the lists. New ships come up every quarter.</p>';
  setHTML($('pane-brokers'),orderBookHTML()+`<section class="sec"><h2>Ships for sale</h2><p class="note">The brokers send a new list every quarter. The bank mortgages 60% of the price; you pay the rest in cash. Bought ships arrive laid up where they lie.</p>${body}</section>`);
}

/* ---------- Shore ---------- */
function renderShore(){
  const sh=S.shore,buy=(kind,key,label)=>{const c=shoreCost(kind,key);return `<button class="btn" data-act="shorebuy" data-d='${JSON.stringify([kind,key])}' ${S.cash<c||S.over?'disabled':''}>${label||'Buy'} · ${fmt(c)}</button>`;};
  const own='<span class="chip sea">Owned</span>';
  const depts=Object.keys(DEPTS).map(k=>{const d=DEPTS[k],o=S.depts[k],dc=deptCost(k);
    const hd=o&&o.head?`<div class="meta"><strong>${o.head.name}</strong>, ${d.head.toLowerCase()}: ${compWord(o.head.comp)} (${o.head.comp}), ${o.head.bold?'bold':'careful'}, £${o.head.wage} a month</div>
      <div class="meta">${dc.staff} clerks £${dc.clerks} · rent £${dc.rent} · sundries £${dc.sundries} · in all ${fmt(dc.total)} a month</div>
      ${UI.headPick===k?`<div class="stack" style="gap:4px">${(o.cands||[]).map((h,i)=>`<div class="uprow"><div><strong>${h.name}</strong><div class="meta">${compWord(h.comp)} (${h.comp}), ${h.bold?'bold':'careful'}, £${h.wage} a month</div></div><button class="btn" data-act="newhead" data-d='${JSON.stringify([k,i])}'>Appoint · ${fmt(o.head.wage*3)} severance</button></div>`).join('')||'<p class="note">No candidates this quarter.</p>'}</div>`:`<button class="btn quiet" data-act="headpick" data-id="${k}" style="width:fit-content">Look for a new ${d.head.toLowerCase()}</button>`}`
      :`<div class="meta">About ${fmt(dc.total+60)} a month to run at your present size: ${dc.staff} clerks, rent and a head of department. It grows with the fleet.</div>`;
    return `<div class="card" data-key="dp${k}"><div class="row"><strong>${d.name}</strong>${o?own:''}</div><p class="note" style="margin:0">${d.does}</p>${hd}
      ${o?`<div class="row"><div class="seg" role="group"><button data-act="deptmode" data-d='${JSON.stringify([k,0])}' aria-pressed="${!o.auto}">Advise</button><button data-act="deptmode" data-d='${JSON.stringify([k,1])}' aria-pressed="${!!o.auto}">Act</button></div>
        <span class="meta">${o.auto?'Works through its advice every week. Big decisions come to you as proposals':'Advice only; you decide'}</span></div>`:buy('dept',k,'Open')}</div>`;}).join('');
  const myPorts=[...new Set(Object.keys(S.lines).flatMap(rk=>ROUTES[rk].calls).concat(Object.keys(sh.piers)))].filter(p=>PIER_COST[p]);
  const piers=myPorts.map(p=>`<div class="uprow" data-key="pi${p}"><div><strong>${PN[p]}</strong><div class="meta">${S.ships.filter(x=>x.line&&ROUTES[x.line].calls.includes(p)).length} of your ships call here</div></div>${sh.piers[p]?own:buy('pier',p)}</div>`).join('')||'<p class="note">Open a line first. Piers can be built at the ports your lines call at.</p>';
  const agents=Object.keys(AGENCY).map(a=>`<div class="uprow" data-key="ag${a}"><div><strong>${AGENCY[a].name}</strong><div class="meta">${AGENCY[a].ports.map(p=>PN[p]).join(', ')}</div></div>${sh.agents[a]?own:buy('agency',a,'Appoint')}</div>`).join('');
  const hostels=HOSTEL_PORTS.map(p=>`<div class="uprow" data-key="ho${p}"><div><strong>${PN[p]}</strong></div>${sh.hostels[p]?own:buy('hostel',p,'Build')}</div>`).join('');
  const yards=Object.keys(YARD_PORTS).map(p=>`<div class="uprow" data-key="yd${p}"><div><strong>A repair yard on ${YARD_PORTS[p]}</strong><div class="meta">At ${PN[p]}${sh.slip===p?' · with a building slip, '+(sh.slipBuilt||0)+' ships built':''}</div></div>${!sh.yards[p]?buy('yard',p):!sh.slip?buy('slip',p,'Add a building slip'):own}</div>`).join('');
  const bk=sh.bunker&&sh.bunker.until>=S.m;
  setHTML($('pane-shore'),`
    <section class="sec"><h2>Head office</h2>${S.ships.length<4?`<p class="warnline">With ${S.ships.length===1?'one ship':S.ships.length+' ships'} a department costs more than it can save: they start to pay their way at about four ships. Each costs its opening fee plus wages and rent every month.</p>`:''}<p class="note">Each department advises in its own field, and can be told to act on its advice. A department is only as good as its head and staff: a muddled head misses months and misjudges fares, a careful one lets small gains go. Acting departments keep a cash reserve and never open lines, buy, build or sell ships on their own: they bring those to you as proposals.</p><div class="stack">${depts}</div></section>
    <section class="sec"><h2>Piers</h2><p class="note">Your own pier cuts port dues there by 60% and takes a day off each turnaround. ${fmt(350*PX())} a month each to run.</p><div class="stack" style="gap:6px">${piers}</div></section>
    <section class="sec"><h2>Booking agencies</h2><p class="note">Agents in a region book passengers for every line calling there: steerage up about 7%, cabin classes 3%. ${fmt(300*PX())} a month each.</p><div class="stack" style="gap:6px">${agents}</div></section>
    <section class="sec"><h2>Emigrant hostels</h2><p class="note">Clean beds and a medical check before sailing. Steerage up 5% on lines calling there, fewer quarantine scares, and a little reputation. ${fmt(250*PX())} a month each.</p><div class="stack" style="gap:6px">${hostels}</div></section>
    <section class="sec"><h2>Repair yards</h2><p class="note">Refits, overhauls and upgrades at your own yard cost 30% less and take 30% less time. A yard can take a building slip (${fmt(shoreCost('slip'))}, ${fmt(1500*PX())} a month more): your own ships at 80% of a builder's price, slow at first and better with every hull. ${fmt(1200*PX())} a month each.</p><div class="stack" style="gap:6px">${yards}</div></section>
    <section class="sec"><h2>Bunkers</h2><div class="uprow"><div><strong>Bunker contract</strong><div class="meta">${bk?`12% off coal and oil until ${monthName(sh.bunker.until)}`:'Two years at 12% off coal and oil, paid up front'}</div></div>${bk?own:buy('bunker',null,'Sign')}</div></section>
    <section class="sec"><p class="note">Shore establishment costs ${fmt(shoreUpkeep()*PX())} a month in all, and its property is worth about ${fmt(shoreValue())} to the bank.</p></section>`);
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
      ${S.call?`<p class="badline">Called loan: ${fmt(S.call.amt)} due by ${monthName(S.call.due)}. If the account cannot pay it, the bank seizes ships in port and sells them cheaply.</p>`:''}
      ${S.noLend>S.m?`<p class="warnline">No new lending until ${monthName(S.noLend)}.</p>`:''}
      <dl class="kv"><dt>Debt</dt><dd>${fmt(S.debt)}</dd><dt>Interest (${S.rateUp>S.m?'8.5':'6.5'}%)</dt><dd>${fmt(S.debt*(S.rateUp>S.m?0.085:0.065)/12)}/mo</dd>
      <dt>Required repayment</dt><dd>${fmt(Math.round(S.debt*0.004))}/mo</dd><dt>Fleet value</dt><dd>${fmt(fleetValue())}</dd><dt>Can still borrow</dt><dd>${fmt(hr)}</dd></dl>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,hr,S.debt)).map(v=>`<button class="btn" data-act="borrow" data-id="${v}" ${hr<v||S.noLend>S.m||S.over?'disabled':''}>Borrow ${fmt(v)}</button>`).join('')}</div>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,S.debt)).map(v=>`<button class="btn" data-act="repay" data-id="${v}" ${S.cash<Math.min(v,S.debt)||S.debt<=0||S.over?'disabled':''}>Repay ${fmt(v)}</button>`).join('')}</div>
      <p class="note">The bank lends up to 70% of your fleet's value. Its overdraft runs to ${fmt(odLimit())} (£8,000 plus half your unused borrowing); below that it forecloses.</p></section>
    <section class="sec"><h2>Government stock</h2>
      <p class="note">Consols pay 3½% a year and are safe if your bank fails. They fall a little in a panic, and selling costs ½%. Cash in the bank earns nothing${S.m>=180?', and banks do fail':''}.</p>
      <dl class="kv"><dt>Holding</dt><dd>${fmt(S.gilts||0)}</dd><dt>Interest</dt><dd>${fmt((S.gilts||0)*0.035/12)}/mo</dd></dl>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,S.cash)).map(v=>`<button class="btn" data-act="giltbuy" data-id="${v}" ${S.cash<v||S.over?'disabled':''}>Buy ${fmt(v)}</button>`).join('')}</div>
      ${S.gilts>0?`<div class="btns">${[10000,100000,1000000].filter(v=>v<=S.gilts).map(v=>`<button class="btn" data-act="giltsell" data-id="${v}">Sell ${fmt(v)}</button>`).join('')}<button class="btn" data-act="giltsell" data-id="all">Sell all</button></div>`:''}</section>
    <section class="sec"><h2>Prices</h2>
      <p class="note">Prices are ${Math.abs(Math.round((PX()-1)*100))}% ${PX()>=1?'higher':'lower'} than in 1921: wages, coal, yard work, ships and fares all follow them, but money in the bank does not. What cost ${fmt(10000)} in 1921 costs ${fmt(10000*PX())} now.${S.wageK>1.001?` Union agreements have put crew pay ${Math.round((S.wageK-1)*100)}% above the going rate.`:''}</p>
      ${S.crash&&S.crash.stage==='panic'?`<p class="badline">The panic of ${monthName(S.crash.panicAt)} is ${crashF(S.m)>0.7?'at its worst':'easing'}: trade is down and ships sell for little.</p>`:''}</section>`);
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
  const sp=S.safety===undefined?1:S.safety;
  const safety=`<section class="sec"><h2>Safety and training</h2><p class="note">One policy for the whole fleet. It decides how well crews fight a fire or a flood, how many people live when a ship is lost, and what a court of inquiry makes of it.</p>
    <div class="seg" role="group">${SAFETY.map((x,i)=>`<button data-act="safety" data-id="${i}" aria-pressed="${sp===i}">${x.name}</button>`).join('')}</div>
    <p class="note">${SAFETY[sp].desc}${SAFETY[sp].cost?` About ${fmt(safetyCost())} a month for the fleet.`:''}</p>
    ${(S.inqDone||[]).length?`<span class="lbl">Courts of inquiry</span><ul class="note" style="padding-left:18px;margin:0">${S.inqDone.map(q=>`<li><strong>SS ${esc(q.name)}</strong>, ${dateLong(q.t)}: ${q.blame<1?'no fault found':q.findings.slice(0,3).join('; ')}. ${fmt(q.total)}${q.rep?`, reputation −${q.rep}`:''}.</li>`).join('')}</ul>`:''}
    ${S.stain>1?`<p class="warnline">The newspapers have not forgotten the Line's losses: its standing is held back until the memory fades.</p>`:''}</section>`;
  setHTML($('pane-company'),`
    ${safety}
    <section class="sec"><h2>Save code</h2><p class="note">The game saves itself in this browser, but clearing site data wipes it. A save code holds the whole game as text: keep it somewhere safe, or paste it into another browser or computer to carry on there.</p>
      <div class="btns"><button class="btn" data-act="mkcode">${UI.saveCode?'Make a fresh code':'Make a save code'}</button>${UI.saveCode?`<button class="btn" data-act="copycode">Copy code</button><button class="btn" data-act="copylink">Copy save link</button>`:''}</div>
      ${UI.saveCode?`<textarea class="code" readonly rows="3" data-key="sc" onclick="this.select()">${UI.saveCode}</textarea><p class="note">Made ${UI.saveCodeAt}. ${int(UI.saveCode.length)} characters.${UI.copied?' <strong>'+UI.copied+'</strong>':''}</p>`:''}
      <label class="lbl" for="loadCode">Load a save code</label><textarea id="loadCode" data-keep="1" class="code" rows="2" placeholder="Paste a code here"></textarea>
      <div class="btns">${UI.confirm==='load'?`<button class="btn danger" data-act="loadcode">Confirm: replace this game</button><button class="btn" data-act="cancel">Cancel</button>`:`<button class="btn" data-act="askload">Load code</button>`}</div>
      ${UI.loadMsg?`<p class="${UI.loadMsg.ok?'note':'badline'}">${UI.loadMsg.t}</p>`:''}</section>
    <section class="sec"><h2>North Atlantic conference</h2>${conf}</section>
    <section class="sec"><h2>Rival lines</h2>${Object.keys(RIVAL_P).map(o=>{const x=RIVALS[o],fleet=S.rships.filter(y=>y.owner===o),by=ownersByRoute(o),mv=S.rmoves.filter(q=>q.o===o).slice(0,2);
      return `<div class="card" data-key="rv${o}"><div class="row"><strong><span class="rdot" style="background:${RIVAL_P[o].col}"></span>${x.name}</strong><span class="chip ${S.rivals[o].cash<50000?'bad':S.rivals[o].cash<250000?'yard':'sea'}">${rivalHealth(S.rivals[o].cash)}</span></div>
        <div class="meta">${x.flag} · ${fleet.length} ship${fleet.length===1?'':'s'} · ${RIVAL_P[o].aggr>=1.1?'aggressive':RIVAL_P[o].aggr>=0.9?'combative':'cautious'}</div>
        <div class="meta">${by||'No ships at sea'}</div>
        ${mv.length?`<div class="meta">${mv.map(q=>`${MONTHS[q.m%12].slice(0,3)} ${1921+Math.floor(q.m/12)}: ${q.kind==='add'?'new SS '+q.ship+' on '+ROUTES[q.rk].name:q.kind==='move'?'moved SS '+q.ship+' to '+ROUTES[q.to].name:'scrapped SS '+q.ship}`).join('<br>')}</div>`:''}</div>`;}).join('')}</section>
    <section class="sec"><h2>Milestones</h2><div class="stack" style="gap:4px">${MILESTONES.map(([id,label])=>`<div class="row" data-key="mi${id}"><span class="${S.miles[id]!==undefined?'':'meta'}">${label}</span><span class="meta">${S.miles[id]!==undefined?monthName(S.miles[id]):'Not yet'}</span></div>`).join('')}</div></section>
    <section class="sec"><h2>Settings</h2><label class="check"><input type="checkbox" id="autoP2" data-autop="1" ${UI.autoPause?'checked':''}> Pause the clock on big events</label></section>
    <section class="sec"><h2>Game</h2><p class="note">Version <strong>${GAME_VERSION}</strong>, released ${GAME_BUILT}.</p><div class="btns">${UI.confirm==='new'?`<button class="btn danger" data-act="new">Confirm: start again</button><button class="btn" data-act="cancel">Keep playing</button>`:`<button class="btn" data-act="new">New game</button>`}</div></section>`);
}
function renderModal(){
  const el=$('modal');if(!S.over){el.innerHTML='';return;}
  const nw=netWorth();
  const v='The bank has foreclosed. The Morven Line is finished.';
  setHTML(el,`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="panel"><h3 id="mt">Foreclosed</h3><p style="margin:0">${v}</p>
    <dl class="kv"><dt>Net worth</dt><dd>${fmt(nw)}</dd><dt>Fleet</dt><dd>${S.ships.length}</dd><dt>Reputation</dt><dd>${Math.round(S.rep)}</dd><dt>Reached</dt><dd>${dateLong(S.t)}</dd></dl>
    <button class="btn primary" data-act="newnow">Start a new line</button>
    <label class="lbl" for="loadCode2">Or load a save code</label><textarea id="loadCode2" data-keep="1" class="code" rows="2" placeholder="Paste a code here"></textarea>
    <button class="btn" data-act="loadcode" data-src="loadCode2" style="width:fit-content">Load code</button>${UI.loadMsg&&!UI.loadMsg.ok?`<p class="badline">${UI.loadMsg.t}</p>`:''}</div></div>`);
}
function layoutMode(){
  const w=window.innerWidth>=1280;if(w===UI.wide)return;UI.wide=w;
  document.querySelector('.app').classList.toggle('wide',w);$('leftSide').hidden=!w;
  const ov=$('pane-overview');(w?$('leftBody'):$('tabbody')).prepend(ov);
  if(w&&UI.tab==='overview')UI.tab='fleet';
  $('tabsN')._h=null;UI.dirty=true;VIEW.s=null;requestAnimationFrame(applyView);
}
window.addEventListener('resize',layoutMode);
const PANE_RENDER={overview:renderOverview,fleet:renderFleet,lines:renderLines,brokers:renderBrokers,shore:renderShore,finance:renderFinance,company:renderCompany};
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
function render(){renderHeader();renderTabs();renderMap();renderDesigner();setHTML($('emergw'),emergencyHTML());if(UI.wide&&UI.tab!=='overview')renderOverview();PANE_RENDER[UI.tab]();renderModal();ratchet();}
