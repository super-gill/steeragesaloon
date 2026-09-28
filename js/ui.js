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
  setHTML($('brand'),`<span class="eyebrow"><span class="long">Steerage &amp; Saloon · The Morven Line </span><span class="ver">v${GAME_VERSION}</span></span><div class="row" style="justify-content:flex-start;gap:12px"><h1>${dateLong(S.t)}</h1><button class="menubtn" data-act="menu" aria-expanded="${!!UI.menu}">Menu</button></div>`);
  setHTML($('clock'),`<span class="lbl">Clock</span><div class="seg" role="group" aria-label="Game speed">${SPEED_LABELS.map((l,i)=>`<button data-act="speed" data-v="${i}" aria-pressed="${UI.speed===i}" ${S.over?'disabled':''}>${l}</button>`).join('')}</div>`);
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
  if(S.offer)A.push({id:'offer',noNote:true,k:'good',t:`The Post Office offers ${fmt(S.offer.pay)} per round trip for the ${ROUTES[S.offer.route].name} mail. Only ships with wireless carry it: miss a month and you are warned; miss two and it goes.`,b:[['Accept','accept'],['Decline','decline']]});
  for(const rk of Object.keys(S.lines)){
    const r=ROUTES[rk],t=S.tension[rk]||0;
    if(S.wars[rk])A.push({id:'war'+rk,k:'bad',t:`Rate war on ${r.name}, ${S.wars[rk].left} more month${S.wars[rk].left>1?'s':''}.`,b:[['View line','selline',rk]]});
    else if(t>=40&&!S.conf)A.push({id:'tension'+rk,k:'warn',t:`Conference tension is ${tensionWord(t).toLowerCase()} on ${r.name} (${Math.round(t)}).`,b:[['Review fares','selline',rk]]});
    if(!shipsOn(rk).length)A.push({id:'empty'+rk,k:'warn',t:`${r.name} is open but has no ships assigned.`,b:[['View line','selline',rk]]});
  }
  if(S.union)A.push({id:'union',noNote:true,k:'bad',t:`The seamen's union claims ${S.union.pct}% more pay. Refusing risks a strike in the home ports; silence counts as refusal.`,b:[['Agree','union','yes'],['Refuse','union','no']]});
  if(S.strike)A.push({id:'strike',k:'bad',t:`Seamen on strike in the home ports until about ${dateLong(S.strike.until)}.`,b:[]});
  if(S.crash&&S.crash.stage==='rumour')A.push({id:'rumour'+S.crash.m0,k:'bad',t:S.crash.bank?`Rumours about ${BANK_NAME}, where the Line keeps its cash.`:'The markets are nervous and the banks are calling in loans.',b:[['Bank and stock','tabgo','finance']]});
  if(S.call)A.push({id:'call',noNote:true,k:'bad',t:`The bank has called in ${fmt(S.call.amt)}, due by ${monthName(S.call.due)}. Unpaid, it will seize ships.`,b:[['Bank','tabgo','finance']]});
  for(const sh of S.ships)if(fatOf(sh)>=90&&sh.state!=='yard')A.push({id:'worn'+sh.id,k:'warn',t:`SS ${sh.name} is worn out and should go to the breakers.`,b:[['View','selship',sh.id]]});
  if(S.cash<0)A.push({id:'od',noNote:true,k:'bad',t:`The account is overdrawn. The bank forecloses below ${fmt(-odLimit())}.`,b:[['Bank','tabgo','finance']]});
  // an item the owner has noted or acted on stays away until the situation passes; decisions and the bank's demands stay put
  const seen=S.attnSeen=S.attnSeen||{};for(const id in seen)if(!A.some(a=>a.id===id))delete seen[id];
  return A.filter(a=>a.noNote||!seen[a.id]);
}
function renderOverview(){
  const A=alerts(),ADV=shownAdvice();
  const al=A.length?A.map(a=>`<div class="alert ${a.k}" data-key="${keyOf(a.t.slice(0,40))}" data-aid="${a.id}"${a.noNote?' data-sticky':''}><span>${a.t}</span><span class="btns">${a.b.map(([l,act,id])=>`<button class="btn" data-act="${act}" ${act==='tabgo'?`data-tab="${id}"`:id!==undefined?`data-id="${id}"`:''}>${l}</button>`).join('')}${a.noNote?'':'<button class="btn quiet" data-act="noted">Noted</button>'}</span></div>`).join('')
    :'';
  const props=(S.props||[]).map(p=>`<div class="alert prop" data-key="pr${keyOf(p.id)}"><span><strong>${DEPTS[p.dept].name} proposes:</strong> ${p.title}.<br><small class="note">${p.why}</small></span>
    <span class="btns"><button class="btn primary" data-act="propyes" data-d='${JSON.stringify([p.id]).replace(/'/g,"&#39;")}'>${p.act==='build'?'Open the drawing office':'Approve'}</button><button class="btn" data-act="propno" data-d='${JSON.stringify([p.id]).replace(/'/g,"&#39;")}'>Decline</button></span></div>`).join('');
  const attn=props+al||'<p class="note">Nothing needs you right now. The fleet is sailing to orders.</p>';
  setHTML($('pane-overview'),`
    ${tutorialHTML()}
    ${trayHTML(A.length+(S.props||[]).length,attn,ADV)}
    ${timesHTML()}
    <section class="sec"><h2>Fleet by line</h2>${boardHTML()}</section>
    <section class="sec"><h2>Shipping news</h2>
      <ul class="news">${S.news.slice(0,25).map(n=>`<li class="${n.k}" data-key="${keyOf(n.d+n.t)}"><time>${dateLong(n.d)}</time>${n.t}</li>`).join('')}</ul></section>`);
}

/* every line with its ships under it, and what each is making, in one table */
function boardHTML(){
  const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0),LM=S.lastMonth,live=S.ships.filter(x=>x.state!=='lost');
  const n=v=>v===undefined||v===null?'<td class="r meta">–</td>':`<td class="r num ${v<0?'neg':'pos'}">${fmt(Math.round(v))}</td>`;
  const shipRow=sh=>{const st=shipStatus(sh),pl=sh.pl||[],avg=pl.length?pl.reduce((a,b)=>a+b,0)/pl.length:null;
    return `<tr class="bship" data-act="selship" data-id="${sh.id}" data-key="bs${sh.id}"><td><div class="nm">${sh.name}</div><div class="meta" title="${st.short}">${st.short}</div></td>${n((S.mtd.ships||{})[sh.id]?sum(S.mtd.ships[sh.id]):0)}${n(pl.slice(-1)[0])}${n(avg)}</tr>`;};
  const head=(label,act,id,mtd,lm,cls)=>`<tr class="bline ${cls||''}" ${act?`data-act="${act}" data-id="${id}"`:''} data-key="bl${id}"><td>${label}</td>${n(mtd)}${n(lm)}<td></td></tr>`;
  let rows='';
  for(const rk of Object.keys(S.lines)){const on=live.filter(x=>x.line===rk&&x.state!=='laid');
    rows+=head(`<strong>${ROUTES[rk].name}</strong>${S.wars[rk]?' <span class="chip bad">war</span>':''}`,'selline',rk,S.mtd.lines[rk]||0,LM&&LM.lines[rk]);
    rows+=on.map(shipRow).join('')||'<tr><td colspan="4" class="meta">No ships on this line.</td></tr>';}
  const off=live.filter(x=>!x.line||x.state==='laid'||!S.lines[x.line]);
  if(off.length)rows+=head('<strong>Laid up</strong>',null,'_idle',S.mtd.lines._idle||0,LM&&LM.lines._idle)+off.map(shipRow).join('');
  rows+=head('<strong>Head office</strong>',null,'_office',S.mtd.lines._office||0,LM&&LM.lines._office);
  const tot=sum(S.mtd.cat);
  rows+=head('<strong>The Line</strong>',null,'_tot',tot,LM&&LM.net,'btot');
  return `<div class="tablewrap"><table class="board"><thead><tr><th></th><th class="r">${MONTHS[S.m%12].slice(0,3)}</th><th class="r">Last</th><th class="r">Avg</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note">${MONTHS[S.m%12]} so far, last month, and each ship's average over the last twelve months. A line's figures include its ships and its advertising. A ship's figures are her own takings and running costs.</p>`;
}
/* ---------- Fleet ---------- */
function renderFleet(){
  const order=[...Object.keys(S.lines),null],grp=sh=>sh.line&&sh.state!=='laid'&&S.lines[sh.line]?sh.line:null;
  const items=order.map(g=>{const on=S.ships.filter(sh=>grp(sh)===g);if(!on.length)return '';
    const lm=S.lastMonth&&S.lastMonth.lines[g||'_idle'];
    return `<div class="fgrp row" data-key="fg${g}"><span>${g?ROUTES[g].name:'Laid up or off a line'}</span>${lm===undefined?'':`<span class="num ${lm<0?'neg':'pos'}">${fmt(lm)}</span>`}</div>`+on.map(sh=>{const st=shipStatus(sh),sel=S.selShip===sh.id,due=sh.cond<(sh.autoDock||50)&&sh.state!=='yard';
    return `<button class="item" data-key="s${sh.id}" data-act="selship" data-id="${sh.id}" aria-pressed="${sel}">
      <span class="row"><span class="nm">SS ${sh.name}</span>${st.chip}</span>
      <span class="row meta"><span>${sh.line&&sh.state!=='laid'?ROUTES[sh.line].name:'Laid up'}</span><span class="${due?'neg':''}">${Math.round(sh.cond)}%${sh.pendingYard==='dock'?' · drydock booked':''}</span></span>
      <span class="row meta"><span>Last month</span>${(()=>{const v=(sh.pl||[]).slice(-1)[0];return v===undefined?'<span>new</span>':`<span class="num ${v<0?'neg':'pos'}">${fmt(v)}</span>`;})()}</span></button>`;}).join('');}).join('');
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
/* after acting on one suggestion, say which others it settled, so they do not seem to vanish */
function advGoneHTML(){const g=UI.advGone;if(!g||UI.rev-g.rev>6)return '';
  return `<p class="note advgone">That change also settled ${g.titles.length===1?'another suggestion, which no longer applies':g.titles.length+' others, which no longer apply'}: ${g.titles.map(t=>esc(t)).join('; ')}.</p>`;}
function trayHTML(nAttn,attn,ADV){
  const W=(S.wire||[]).filter(m=>UI.wireRoutine!==false||m.k!=='r');
  if(!UI.trayTab)UI.trayTab=nAttn?'attn':'wire';
  const newW=W.filter(m=>m.read===false).length;
  const tab=(k,l,n,cls)=>`<button role="tab" data-act="traytab" data-id="${k}" aria-selected="${UI.trayTab===k}">${l}${n?` <span class="${cls}">${n}</span>`:''}</button>`;
  let body;
  if(UI.trayHold&&UI._tray&&UI._tray.tab===UI.trayTab&&UI._tray.rev===UI.rev)body=UI._tray.body; // the pointer is on it: hold still, until the player does something
  else{
    body=UI.trayTab==='attn'?attn:UI.trayTab==='advice'?advGoneHTML()+adviceHTML(ADV,'Head office has no complaints. The books look sound at current settings.')
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
    <div class="meta">Built ${sh.built} (${age} years) · ${int(sh.grt)} grt · ${knotsOf(sh)} knots · ${sh.fuel}-fired · ${sh.up&&sh.up.wireless?'wireless':'no wireless'} · worth about ${fmt(shipValue(sh))}</div></div>
    <p class="stline">${st.text}</p>
    ${advRow('ship'+sh.id,shownAdvice().filter(h=>h.scope==='ship'&&h.ref===sh.id),'her')}
    ${shipGrp('earn','Earnings and line',(()=>{const v=(sh.pl||[]).slice(-1)[0];return sh.line&&sh.state!=='laid'?ROUTES[sh.line].name+(v===undefined?'':' · last month '+fmt(v)):'Laid up';})(),`
    ${shipAccHTML(sh)}
      <div class="ctl"><span class="lbl">Speed</span>${seg('shipset','speed',sh.speed,['Economical','Service','Full'])}</div>
    `)}
    ${shipGrp('upkeep','Upkeep',`Condition ${Math.round(sh.cond)}% · ${fatWord(sh).toLowerCase()}${sh.pendingYard||sh.state==='yard'?' · yard booked':''}`,`
    <div class="row meta"><span>Condition ${Math.round(sh.cond)}%</span><span>${pB>0?`About 1 crossing in ${Math.max(2,Math.round(1/pB))} breaks down`:'Reliable'}</span></div>${condBar(sh.cond)}
    ${sh.cond<35?'<p class="badline">Dangerously run down. Fire or foundering is a real risk. Send her to the yard.</p>':''}
      <div class="ctl"><span class="lbl">Maintenance</span>${seg('shipset','maint',sh.maint,['None','Routine','Thorough'])}<span class="note">£${int(MAINT_COST[1]*sh.grt/8000)} or £${int(MAINT_COST[2]*sh.grt/8000)} a month</span></div>
    <div class="ctl"><span class="lbl">Service threshold</span>${seg('shipset','autoDock',DOCK_TH.indexOf(sh.autoDock),DOCK_TH.map(v=>v?v+'%':'Off'))}
      <span class="note">${sh.autoDock?`She books herself into drydock (${fmt(refitCost(sh,'dock'))}, ${YARD_DAYS.dock} days, +35 condition) at the first port after falling below ${sh.autoDock}%.`:'Off. You must send her to the yard yourself.'} Condition drops every crossing, faster at full speed and with age. Maintenance slows the decline.</span>
      <button class="btn" data-act="alldock" style="width:fit-content">Use ${sh.autoDock?sh.autoDock+'%':'Off'} for the whole fleet</button></div>
    <div class="ctl"><div class="row"><span class="lbl">Fittings</span><span class="meta">${Math.round(sh.fit)}%</span></div>${condBar(sh.fit)}
      <span class="note">Cabins, saloons and linen wear out a few points a year. Tired fittings put off first and second class. A refurbishment restores them.</span></div>
    <div class="ctl"><span class="lbl">Refits and facilities</span>
      ${sh.state==='yard'?`<p class="warnline">In the yard for ${[sh.yardKind,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}: about ${Math.ceil(sh.yardLeft)} days to go.</p>`:''}
      ${sh.pendingYard?`<p class="${sh.pendingYard==='repair'?'badline':'warnline'}">Booked into the yard on arrival for ${[sh.pendingYard,...(sh.yardAdd||[])].map(k=>YARD_NAME[k]).join(', ')}.</p>`:''}
      <div class="meta">${[...Object.keys(UPGRADES).filter(k=>sh.up&&sh.up[k]).map(k=>UPGRADES[k].name),...Object.keys(EQUIP).filter(k=>sh.up&&sh.up[k]).map(k=>EQUIP[k].name)].join(' · ')||'No upgrades fitted.'}</div>
      <div class="meta">${FAC_KEYS.filter(k=>facLv(sh,k)).map(k=>FAC[k].levels[facLv(sh,k)].n).join(' · ')||'Plain public rooms.'} ${slotsUsed(sh.fac)} of ${slotsOf(sh)} venues used.</div>
      <div class="btns"><button class="btn primary" data-act="refit" data-id="${sh.id}" ${S.over?'disabled':''}>Open the refit office</button>${sh.pendingYard&&sh.pendingYard!=='repair'?'<button class="btn" data-act="unyardall">Cancel the booking</button>':''}</div>
      <span class="note">Every yard job, upgrade and facility for her in one window, booked as one visit.${atOwnYard(sh)?' She is at your own yard: work here is 30% cheaper and quicker.':''}</span></div>
    <div class="ctl"><span class="lbl">Her hull</span><span class="note"><strong>${fatWord(sh)}.</strong> ${Math.floor(yearNow()-sh.built)} years old${condCap(sh)<92?`; the yard can bring her to ${condCap(sh)}% at best`:''}${sh.replates?`, re-plated ${sh.replates===1?'once':sh.replates+' times'}`:''}. Hard driving, full speed, gales and neglect use up her life faster. ${dimsOf(sh).len|0} ft long, drawing ${dimsOf(sh).draught|0} ft${sh.len?'':' (estimated)'}. ${(sh.foul||0)<0.2?'Clean bottom.':(sh.foul||0)<0.45?'Some growth on her bottom.':(sh.foul||0)<0.7?'Her bottom is foul; she has lost speed.':'Badly foul and slow. She needs drydocking.'}</span></div>
    `)}
    ${shipGrp('ins','Insurance',`${INS_COVER[insOf(sh).cover].short} · ${fmt(insCost(sh))} a month`,insHTML(sh))}
    ${shipGrp('crew','Master and crew',`${sh.captain?sh.captain.name+' · ':''}morale ${Math.round(sh.morale)} · ${Math.round(crewHands(sh))} hands`,`
    ${captainHTML(sh)}
    <div class="ctl"><div class="row"><span class="lbl">Crew</span><span class="meta">${Math.round(crewHands(sh))} hands · ${fmt(crewCost(sh))} a month</span></div>
      <div class="cwsum">${CD_KEYS.filter(d=>deptCount(sh,d)>=1).map(d=>{const q=cwOf(sh)[d];return `<span>${CDEPT[d].name}</span><span class="meta">morale ${Math.round(q.mor)} · ${skWord(cwSk(sh,d))}</span>`;}).join('')}</div>
      <div class="meta">${OFF_KEYS.filter(r=>offOf(sh)[r]).map(r=>`${OFFICER[r].name}: ${offOf(sh)[r].name} (${skWord(offOf(sh)[r].skill)})`).join(' · ')}</div>
      <button class="btn primary" data-act="crew" data-id="${sh.id}" style="width:fit-content">Manage her crew</button>
      <span class="note">Her officers, and manning, pay and training by department. ${S.depts.crew&&S.depts.crew.auto?'The Crewing Office manages them; anything you set yourself it leaves alone for three months.':'Left alone she runs on standard terms.'}</span></div>
    ${sh.lastRemark?`<div class="ctl"><span class="lbl">The master's last word</span><blockquote class="remark">${esc(plainTel(telegram(sh.lastRemark.txt)).replace(/^Master to owners\. /,''))}<footer>${esc(sh.lastRemark.who)}, ${dateLong(sh.lastRemark.t)}</footer></blockquote></div>`:''}
    `)}
    ${shipGrp('retire','Sell or scrap',`worth about ${fmt(shipValue(sh))}`,`
    <div class="ctl"><span class="lbl">Retire</span><div class="btns">${exitH||'<span class="note">You cannot retire your only ship.</span>'}</div></div>
    `)}
    ${(()=>{const L=(S.wire||[]).filter(m=>m.sid===sh.id&&m.k!=='r').slice(0,3);return L.length?`<div class="stack tape" style="gap:6px"><span class="lbl">Latest from her</span>${wireHTML(L,false)}</div>`:'';})()}`);
}

/* her own account and her choice of line, side by side: what she made, and what she would make elsewhere */
const INCOME=['fares','onboard','cargo','mail'];
let SHIP_OPTS={key:null};
function shipOptions(sh){
  const key=S.m+'|'+UI.rev+'|'+sh.id;if(SHIP_OPTS.key===key)return SHIP_OPTS.v;
  const v=Object.keys(S.lines).map(rk=>({rk,pm:econYear(sh,rk).pm,open:true}));
  const b=bestLine(sh,null);if(b&&!S.lines[b.rk]&&b.pm>Math.max(0,...v.map(o=>o.pm))+300)v.push({rk:b.rk,pm:b.pm,open:false});
  v.sort((a,b)=>b.pm-a.pm);SHIP_OPTS={key,v};return v;
}
function shipAccHTML(sh){
  const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0),mtd=(S.mtd.ships||{})[sh.id],lm=S.lastMonth&&S.lastMonth.ships&&S.lastMonth.ships[sh.id],pl=sh.pl||[];
  const avg=pl.length?pl.reduce((a,b)=>a+b,0)/pl.length:null,cell=v=>v===null||v===undefined?'<span class="meta">none yet</span>':`<span class="${v<0?'neg':'pos'}">${fmt(v)}</span>`;
  const brk=o=>{if(!o)return '';const rev=INCOME.reduce((a,c)=>a+(o[c]||0),0);
    const costs=CATS.filter(([k])=>!INCOME.includes(k)&&(o[k]||0)<0).sort((a,b)=>o[a[0]]-o[b[0]]).map(([k,l])=>`${l.toLowerCase()} ${fmt(-o[k])}`);
    return `<p class="note" style="margin:0">Last month she took ${fmt(rev)}${costs.length?' and spent '+costs.join(', '):''}.</p>`;};
  const idle=idleCost(sh),opts=shipOptions(sh),atSea=sh.state==='sea'||sh.state==='repo';
  const row=(name,pm,cur,btn)=>`<tr${cur?' class="cur"':''}><td>${name}${cur?' <span class="chip sea">Her line</span>':''}</td><td class="r num ${pm<0?'neg':'pos'}">${fmt(Math.round(pm/10)*10)}</td><td class="r">${cur?'':btn}</td></tr>`;
  const rows=opts.map(o=>row(ROUTES[o.rk].name+(o.open?'':' <span class="meta">(not open)</span>'),o.pm,sh.line===o.rk&&sh.state!=='laid',
      o.open?`<button class="btn" data-act="moveship" data-d='${JSON.stringify([sh.id,o.rk])}' ${S.over?'disabled':''}>Assign</button>`:`<button class="btn" data-act="openmove" data-d='${JSON.stringify([sh.id,o.rk])}' ${S.over||S.cash<2500*PX()?'disabled':''}>Open and assign</button>`)).join('')
    +row('Laid up',-idle,!sh.line||sh.state==='laid',`<button class="btn" data-act="moveship" data-d='${JSON.stringify([sh.id,''])}' ${S.over?'disabled':''}>Lay up</button>`);
  return `<div class="ctl"><span class="lbl">Her account</span>
    <dl class="kv"><dt>${MONTHS[S.m%12]} so far</dt><dd>${mtd?cell(sum(mtd)):cell(null)}</dd><dt>Last month</dt><dd>${lm?cell(sum(lm)):cell(pl.length?pl[pl.length-1]:null)}</dd>
    <dt>Average${pl.length>1?` over ${pl.length} months`:''}</dt><dd>${avg===null?cell(null):cell(Math.round(avg))}</dd></dl>
    ${brk(lm)}<span class="note">Her own takings and running costs: fares, cargo and mail against coal, crew, ports, upkeep and yard bills. Head office, advertising and interest are the company's.</span></div>
  <div class="ctl"><span class="lbl">Her line</span>
    <div class="tablewrap"><table class="lineopts"><thead><tr><th>Line</th><th class="r">£ a month</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <span class="note">Expected profit a month for her on each line, averaged over the coming year at current fares.${atSea?' A change takes effect when she reaches port.':sh.line&&sh.state==='port'&&sh.port!==ROUTES[sh.line].a&&sh.port!==ROUTES[sh.line].b?' She will sail light to join the line.':''} Fares, table and advertising are set for the whole line in the Lines tab.</span></div>
  ${cruiseCtlHTML(sh)}`;
}
/* seasonal cruising: she leaves her line for a cruise's season and goes back after */
const CRUISE_COL={cwi:'#C98A2B',cmd:'#3F7F93',cfj:'#4F8A5B',cwx:'#B0503C',cnw:'#7A5C99'},CRUISE_SHORT={cwi:'Madeira',cmd:'Med',cfj:'Fjords',cwx:'W Indies',cnw:'Nowhere'};
const cruiseHelpHTML=()=>`<div class="cruisehelp"><button class="btn quiet" data-act="cruisehelp" aria-expanded="${!!UI.cruiseHelp}">${UI.cruiseHelp?'Hide':'How cruising works'}</button>${UI.cruiseHelp?`<ul class="note">
  <li>Any passenger ship can cruise. Steerage sells nothing on a cruise (except the cruises to nowhere), so emigrant ships do badly; a cruise conversion in the refit office, or a purpose-built cruise ship, does best.</li>
  <li>Add cruises to her programme. In each cruise's months she sails it from its home port; in the months between she goes back to her own line, or lays up if she had none.</li>
  <li>She always finishes the cruise she is on and brings her passengers home before she moves on. Changing home port means a light passage, a few days and some coal.</li>
  <li>The cruise line must be open (adding a cruise opens it). Departments leave her programme alone; assigning her to a line yourself pauses it for the season.</li></ul>`:''}</div>`;
function cruiseCtlHTML(sh){
  if(CL.reduce((a,c)=>a+(sh.berths[c]||0),0)<60)return '';
  const est=cruiseEst(sh),cp=cruiseProg(sh),on=onProgramme(sh),now=cruiseFor(sh,S.m),nm=k=>ROUTES[k].cruise.cname;
  const P=yearPlan(sh);
  const cell=x=>{const lab=x.cruise?CRUISE_SHORT[x.rk]:x.rk?'Line':'Laid up';
    return `<div class="yrm ${x.cruise?'cr':x.rk?'ln':'lay'}" ${x.cruise?`style="background:${CRUISE_COL[x.rk]}"`:''} title="${MONTHS[x.mo]}: ${x.cruise?nm(x.rk):x.rk?ROUTES[x.rk].name:'laid up'}, about ${fmt(Math.round(x.pm/10)*10)} a month"><b>${MONTHS[x.mo].slice(0,3)}</b><span>${lab}</span><i class="${x.pm<0?'neg':'pos'}">${(x.pm<0?'−':'')+(Math.abs(x.pm)>=1000?(Math.abs(x.pm)/1000).toFixed(1)+'k':Math.round(Math.abs(x.pm)/10)*10)}</i></div>`;};
  const status=on?`<p class="goodline">Cruising now: ${nm(sh.line)}. ${(()=>{const nx=P.months.find(x=>x.rk!==sh.line);return nx?(nx.cruise?`Then ${nm(nx.rk)} from ${MONTHS[nx.mo]}.`:`Back to ${sh.homeLine?'the '+ROUTES[sh.homeLine].name+' service':'her lay-up'} in ${MONTHS[nx.mo]}.`):'';})()}</p>`
    :now?`<p class="warnline">In season now: she joins ${nm(now)} ${sh.state==='sea'||sh.state==='repo'?'when she reaches port':'when she next sails'}.</p>`
    :cp.length?(()=>{const nx=P.months.find(x=>x.cruise);return nx?`<p class="note" style="margin:0"><strong>Next:</strong> ${nm(nx.rk)} from ${MONTHS[nx.mo]}.</p>`:'';})():'';
  const rows=est.map(o=>{const inP=cp.includes(o.rk),gain=o.pm-o.home;
    return `<tr${inP?' class="cur"':''}><td><span class="cdot" style="background:${CRUISE_COL[o.rk]}"></span>${nm(o.rk)[0].toUpperCase()+nm(o.rk).slice(1)}<div class="meta">${cruiseMonthsText(o.rk)}${S.lines[o.rk]?'':' · not open yet'}</div></td>
      <td class="r num ${o.pm<0?'neg':'pos'}">${fmt(Math.round(o.pm/10)*10)}</td><td class="r num ${gain<0?'neg':'pos'}">${gain>=0?'+':'−'}${fmt(Math.abs(Math.round(gain/10)*10))}</td>
      <td class="r">${inP?`<button class="btn quiet" data-act="cruisedrop" data-d='${JSON.stringify([sh.id,o.rk])}'>Remove</button>`:`<button class="btn" data-act="cruiseadd" data-d='${JSON.stringify([sh.id,o.rk])}' ${S.over||(!S.lines[o.rk]&&S.cash<2500*PX())?'disabled':''}>${S.lines[o.rk]?'Add':'Open and add'}</button>`}</td></tr>`;}).join('');
  return `<div class="ctl"><div class="row"><span class="lbl">Cruise programme</span>${cp.length?`<button class="btn quiet" data-act="cruiseadd" data-d='${JSON.stringify([sh.id,''])}'>Clear it</button>`:''}</div>
    ${status}
    <div class="yr" role="img" aria-label="Her year">${P.months.map(cell).join('')}</div>
    <p class="yr-key">Her next twelve months: where she sails and about what she makes a month there, in thousands of pounds.</p>
    <p class="note" style="margin:2px 0 6px">${cp.length?`Her year: about <strong class="${P.avg<0?'neg':'pos'}">${fmt(Math.round(P.avg/10)*10)}</strong> a month on average, against ${fmt(Math.round(P.base/10)*10)} on her own line all year${P.days>=1?`, after ${Math.round(P.days)} days a year of light passages between ports`:''}.`:`Her year on her own line: about ${fmt(Math.round(P.base/10)*10)} a month on average. Add a cruise to see the difference.`}</p>
    <div class="tablewrap"><table class="lineopts"><thead><tr><th>Cruise</th><th class="r">In season</th><th class="r">Against her line</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <span class="note">Profit a month in each cruise's season, against her own line in the same months. Where two seasons meet, the one she is on runs its course first.</span>
    ${cruiseHelpHTML()}</div>`;
}
/* the ship panel in headed groups that fold away; which are open is remembered from ship to ship */
/* her hull policy: the cover, the excess, what it costs and what a loss would pay */
function insHTML(sh){
  const i=insOf(sh),v=shipValue(sh),ins=insured(sh),ex=i.cover==='none'?0:v*INS_EXCESS[i.excess].x,paid=Math.max(0,ins-ex),bank=Math.min(paid,shipMortgage(sh)),rec=S.insLoss||0;
  const covers=INS_KEYS.map(k=>`<button data-act="inscover" data-v="${k}" aria-pressed="${i.cover===k}" ${k==='none'&&S.debt>0?'disabled title="The bank insists on cover while she is mortgaged"':''}>${INS_COVER[k].short}</button>`).join('');
  return `<div class="ctl"><span class="lbl">Cover</span><div class="seg" role="group">${covers}</div>
      <span class="note">${i.cover==='none'?'She is not insured: if she is lost, the Line loses her whole value.':i.cover==='mort'?'Only the bank\'s share is covered: a loss pays off her mortgage and nothing more, and salvage is not covered.':i.cover==='agreed'?'Insured for a quarter above her market value: a loss pays enough to replace her with a better ship.':'Insured for what she would fetch today.'}${S.debt>0?' While she is mortgaged the bank insists on cover for its share at least.':''}</span></div>
    <div class="ctl"><span class="lbl">Excess</span>${seg('insexcess','x',i.excess,INS_EXCESS.map(e=>e.name))}
      <span class="note">The part of any claim the Line pays itself. A higher excess makes the premium cheaper.</span></div>
    <button class="btn" data-act="insall" style="width:fit-content">Use this policy for the whole fleet and new ships</button>
    <dl class="kv"><dt>Insured for</dt><dd>${fmt(Math.round(ins))}</dd><dt>Premium</dt><dd>${fmt(Math.round(insCost(sh)))} a month</dd><dt>Rate</dt><dd>${(insRate(sh)*100).toFixed(1)}% a year${sh.state==='laid'?', port risks only while laid up':''}</dd>
      <dt>If she were lost</dt><dd>${i.cover==='none'?'nothing':fmt(Math.round(paid))}</dd>${bank>100?`<dt>To the mortgagees</dt><dd>${fmt(Math.round(bank))}</dd>`:''}<dt>The Line keeps</dt><dd>${fmt(Math.round(paid-bank))}</dd></dl>
    <p class="note">The rate rises with wear, poor condition and the Line's recent claims${rec>0.3?` (claims are adding ${Math.round(rec*15)}% at present)`:''}. An unseaworthy ship's claim can be clawed back by the court of inquiry.</p>`;
}
function shipGrp(k,title,sum,body){
  const o=UI.shipGrp=UI.shipGrp||{earn:true,upkeep:true,crew:false,retire:false},open=!!o[k];
  return `<div class="grp" data-key="grp${k}"><button class="grph" data-act="shipgrp" data-id="${k}" aria-expanded="${open}"><span>${title}</span><span class="meta">${open?'':sum}</span><span class="grpx">${open?'Hide':'Show'}</span></button>${open?`<div class="grpb stack">${body}</div>`:''}</div>`;
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
function cargoText(rk){if(isCruise(rk))return cruiseText(rk);const r=ROUTES[rk],m=S.m,f=(cd,dir)=>{const c=COMM[cd.c],sn=c.season?cargoSeason(cd.c,m):1;
  return `${dir}: ${c.name.toLowerCase()}, about ${int(cd.t)} t a sailing${c.reefer?' (refrigerated holds needed)':''}${c.season?`, ${sn>=1.2?'in season now':sn<=0.7?'out of season now':'fair this month'}`:''}`;};
  return f(r.cargo.out,'Outward')+'. '+f(r.cargo.home,'Homeward')+'.';}
function cruiseText(rk){const r=ROUTES[rk],c=r.cruise,v=r.via.concat(PN[r.b]==='the open sea'?[]:[PN[r.b]]),days=Math.round(2*r.dist/(14*24)+c.turn+(r.calls.length-2)*CALL_DAYS);
  return `${PN[r.b]==='the open sea'?'Out beyond the limit and back':`Calls at ${v.slice(0,-1).join(', ')}${v.length>1?' and ':''}${v[v.length-1]}, with ${c.turn>=1?'a day':'a few hours'} ashore at ${PN[r.b]}, then home non-stop`}: about ${days} days at 14 knots. Best months: ${cruiseMonthsText(rk)}${cruiseInSeason(rk,S.m)?' (in season now)':''}. No cargo, no mails and no conference.${!routeOpen(rk,S.m)?' <strong>Closed: Prohibition is over.</strong>':c.until?` Until Prohibition ends in ${monthName(c.until-1)}.`:''}`;}
/* ---------- Lines ---------- */
function renderLines(){
  const net=rk=>S.mtd.lines[rk]||0;
  const item=rk=>{const r=ROUTES[rk],open=!!S.lines[rk],n=shipsOn(rk).length,sel=S.selLine===rk,t=S.tension[rk]||0;
    const chip=r.cruise&&!routeOpen(rk,S.m)?'<span class="chip idle">Closed</span>':r.cruise&&cruiseInSeason(rk,S.m)&&!open?'<span class="chip sea">In season</span>':!open?'<span class="chip idle">Not served</span>':S.wars[rk]?'<span class="chip bad">Rate war</span>':t>=40&&!S.conf?`<span class="chip yard">${tensionWord(t)}</span>`:S.mail[rk]?'<span class="chip sea">Mail</span>':'';
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
      <button class="btn primary" data-act="openline" data-id="${rk}" ${S.cash<2500*PX()||S.over||!routeOpen(rk,S.m)?'disabled':''} style="width:fit-content">Open this line · ${fmt(Math.round(2500*PX()))}</button>${marketHTML(rk,null)}`);
    return;
  }
  const war=S.wars[rk],ships=shipsOn(rk);
  // fares are set for every class any ship on the line carries; the forecast is for the ship the owner picks
  const rep=ships.find(x=>x.id===(UI.fcShip||{})[rk])||ships.slice().sort((a,b)=>CL.reduce((q,c)=>q+b.berths[c],0)-CL.reduce((q,c)=>q+a.berths[c],0))[0]||S.ships[0];
  const carried=c=>(ships.length?ships:[rep]).some(x=>x.berths[c]);
  const w=legCalc(rep,rk,0,null),e=legCalc(rep,rk,1,null);
  const rows=CL.filter(c=>!(r.cruise&&c==='t'&&!r.cruise.steerage)&&(carried(c)||c==='tt'&&S.ships.some(s=>s.berths.tt))).map(c=>{
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
    ${S.mail[rk]?`<p class="note">Mail contract: ${fmt(S.mail[rk].pay)} per round trip. Only ships with wireless carry it; ships at economical speed or broken down do not earn it.${ships.some(x=>x.up&&x.up.wireless)?'':' <strong>None of her ships has wireless: the contract will be lost.</strong>'}</p>`
      :r.cruise||r.group==='Trades'?'':`<p class="note">Mail: ${S.rep<40?`the Post Office tenders for the mails from reputation 40 (you are at ${Math.round(S.rep)}).`:ships.some(x=>x.up&&x.up.wireless)?'the Post Office invites tenders for this mail every few months; the offer comes to Needs attention.':'tenders need a ship with wireless on the line.'}</p>`}
    <div class="tablewrap"><table><thead><tr><th>Class</th><th>Fare £</th><th class="r">Line rate</th><th class="r">Last out</th><th class="r">Last home</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${L.last[0]||L.last[1]?`<p class="note">Last out: ${L.last[0]?'SS '+L.last[0].name:'none yet'}. Last home: ${L.last[1]?'SS '+L.last[1].name:'none yet'}.</p>`:''}
    <div class="grid2">
      <div class="ctl"><span class="lbl">Service and table</span>${seg('lineset','service',L.service,['Spartan','Standard','Lavish'])}</div>
      <div class="ctl"><span class="lbl">Advertising · £/month</span>${seg('lineset','adv',L.adv,['None','300','800','1,500'])}</div>
    </div>
    ${r.cruise?cruiseFleetHTML(rk)+cruiseHelpHTML():''}
    ${lineShipsHTML(rk,ships)}
    <div class="forecast"><span class="lbl">Next sailing forecast${ships.length>1?'':' · SS '+rep.name}</span>
      ${ships.length>1?`<div class="seg" role="group" style="margin:4px 0 6px;flex-wrap:wrap">${ships.map(x=>`<button data-act="fcship" data-id="${x.id}" data-k="${rk}" aria-pressed="${x===rep}">SS ${x.name}</button>`).join('')}</div>`:''}
      <dl class="kv"><dt>Outward</dt><dd>${fmt(w.paxRev+w.cargoRev)}</dd><dt>Homeward</dt><dd>${fmt(e.paxRev+e.cargoRev)}</dd>
      <dt>Round trip</dt><dd>${Math.round(rt)} days</dd><dt><strong>Profit per ship per month</strong></dt><dd class="${perMonth<0?'neg':'pos'}"><strong>${fmt(perMonth)}</strong></dd></dl>
      <p class="note">${r.cruise?`Booked: ${fp(w)||'no passengers'}, for the whole cruise; homeward she carries the same people and earns only what they spend aboard.`:`Out: ${fp(w)||'no passengers'}, ${int(w.cargoT)} t ${COMM[w.comm].name.toLowerCase()}. Home: ${fp(e)||'no passengers'}, ${int(e.cargoT)} t ${COMM[e.comm].name.toLowerCase()}.`} Before head office costs and bad luck.</p></div>
    ${marketHTML(rk,estPax,Math.max(1,nAct))}
    <div class="btns">${UI.confirm==='close'+rk?`<button class="btn danger" data-act="closeline" data-id="${rk}">Confirm: close line</button><button class="btn" data-act="cancel">Keep it</button>`:`<button class="btn danger" data-act="askclose" data-id="${rk}">Close this line</button>`}</div>`);
}
/* on a cruise's panel: every passenger ship, what she would make on this cruise in its season, and the buttons to send her */
function cruiseFleetHTML(rk){
  const ms=ROUTES[rk].cruise.months,list=S.ships.filter(x=>x.state!=='lost'&&CL.reduce((a,c)=>a+(x.berths[c]||0),0)>=60);
  if(!list.length)return `<div class="ctl"><span class="lbl">Send a ship</span><span class="note">You have no passenger ships to send cruising.</span></div>`;
  const rows=list.map(x=>{const est=cruiseEst(x).find(o=>o.rk===rk)||{pm:econMonths(x,rk,ms),home:-idleCost(x)},on=cruiseProg(x).includes(rk),all=x.line===rk&&!onProgramme(x),gain=est.pm-est.home;
    return `<tr data-key="cf${x.id}"><td><div class="nm">${x.name}${x.cruiser?' <span class="chip sea">Cruiser</span>':''}</div><div class="meta">${on?(x.line===rk?'cruising here now':'in her programme'):all?'cruises here all year':x.line&&x.state!=='laid'?ROUTES[x.line].name:'laid up'}</div></td>
      <td class="r num ${est.pm<0?'neg':'pos'}">${fmt(Math.round(est.pm/10)*10)}</td><td class="r num ${gain<0?'neg':'pos'}">${gain>=0?'+':'−'}${fmt(Math.abs(Math.round(gain/10)*10))}</td>
      <td class="r"><div class="btns" style="justify-content:flex-end">${on?`<button class="btn quiet" data-act="cruisedrop" data-d='${JSON.stringify([x.id,rk])}'>Remove</button>`:`<button class="btn" data-act="cruiseadd" data-d='${JSON.stringify([x.id,rk])}' ${S.over?'disabled':''}>Add in season</button>`}${all?'':`<button class="btn quiet" data-act="moveship" data-d='${JSON.stringify([x.id,rk])}' ${S.over||!S.lines[rk]?'disabled':''}>All year</button>`}</div></td></tr>`;}).join('');
  return `<div class="ctl"><span class="lbl">Send a ship</span><div class="tablewrap"><table class="board cwft"><thead><tr><th>Ship</th><th class="r">In season</th><th class="r">Against her line</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <span class="note"><strong>Add in season</strong> puts this cruise in her programme: she sails it in ${cruiseMonthsText(rk)} and goes back to her line after. She can have several cruises; see her panel for her whole year. <strong>All year</strong> makes this her line. Profit a month in the season, against her own line in the same months. Steerage sells nothing on a cruise${ROUTES[rk].cruise.steerage?' (except here, as cheap bunks)':''}: converted and purpose-built cruisers do best.</span></div>`;
}
function lineShipsHTML(rk,ships){
  if(!ships.length)return `<div class="ctl"><span class="lbl">Ships on this line</span><span class="note">None at present.${ROUTES[rk].cruise?' Send one from the table above.':' Assign one from her panel in the Fleet tab, where her line table shows what she would make here.'}</span></div>`;
  const n=v=>v===undefined||v===null?'<td class="r meta">–</td>':`<td class="r num ${v<0?'neg':'pos'}">${fmt(Math.round(v))}</td>`;
  const rows=ships.map(sh=>{const pl=sh.pl||[],avg=pl.length?pl.reduce((a,b)=>a+b,0)/pl.length:null;
    return `<tr class="bship" data-act="selship" data-id="${sh.id}" data-key="ls${sh.id}"><td><div class="nm">${sh.name}</div><div class="meta">${shipStatus(sh).short}</div></td>${n(pl.slice(-1)[0])}${n(avg)}${n(econYear(sh,rk).pm)}</tr>`;}).join('');
  return `<div class="ctl"><span class="lbl">Ships on this line</span><div class="tablewrap"><table class="board"><thead><tr><th></th><th class="r">Last</th><th class="r">Avg</th><th class="r">Expect</th></tr></thead><tbody>${rows}</tbody></table></div>
    <span class="note">Last month, her twelve-month average, and what she should make a month here over the coming year. Click a ship to open her.</span></div>`;
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
  } else if(L&&S.conf&&!r.cruise)tens=`<div class="ctl"><span class="lbl">Conference</span><p class="note" style="margin:0">Member: no rate wars while you keep to the fare floor (95% of the line rate) and the steerage quota.</p>${confBtn()}</div>`;
  if(r.cruise)tens=`<p class="note">No conference on cruises: no rate wars and no fare floor, but a small market shared with the cruising companies.</p>`;
  else if(L&&!S.conf)tens=tens.replace(/<\/div>$/,`${confBtn()}</div>`);
  const mv=S.rmoves.filter(q=>q.rk===rk||q.to===rk).slice(0,4);
  const moves=mv.length?`<div class="ctl"><span class="lbl">Rival moves here</span><ul class="note" style="padding-left:18px;margin:0">${mv.map(q=>`<li>${MONTHS[q.m%12].slice(0,3)} ${YEAR0+Math.floor(q.m/12)}: ${RIVALS[q.o].name} ${q.kind==='add'?'added SS '+q.ship:q.kind==='move'?(q.to===rk?'moved SS '+q.ship+' here':'took SS '+q.ship+' off to '+ROUTES[q.to].name):'scrapped SS '+q.ship}</li>`).join('')}</ul></div>`:'';
  return `<div class="ctl"><span class="lbl">Market report · this month, estimated</span>
    <div class="tablewrap"><table><thead><tr><th>Line</th><th class="r">Share</th><th class="r">First</th><th class="r">Second</th><th class="r">Third</th></tr></thead><tbody>${me}${rows}</tbody></table></div>
    <p class="note">${notes.join(' ')}</p></div>${tens}${moves}`;
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
  const myPorts=[...new Set(Object.keys(S.lines).flatMap(rk=>ROUTES[rk].calls).concat(Object.keys(sh.piers)))].filter(p=>PIER_COST[p]);
  const piers=myPorts.map(p=>`<div class="uprow" data-key="pi${p}"><div><strong>${PN[p]}</strong><div class="meta">${S.ships.filter(x=>x.line&&ROUTES[x.line].calls.includes(p)).length} of your ships call here</div></div>${sh.piers[p]?own:buy('pier',p)}</div>`).join('')||'<p class="note">Open a line first. Piers can be built at the ports your lines call at.</p>';
  const agents=Object.keys(AGENCY).map(a=>`<div class="uprow" data-key="ag${a}"><div><strong>${AGENCY[a].name}</strong><div class="meta">${AGENCY[a].ports.map(p=>PN[p]).join(', ')}</div></div>${sh.agents[a]?own:buy('agency',a,'Appoint')}</div>`).join('');
  const fag=Object.keys(FAGENCY).map(a=>`<div class="uprow" data-key="fa${a}"><div><strong>${FAGENCY[a].name}</strong><div class="meta">${FAGENCY[a].ports.map(p=>PN[p]).join(', ')}</div></div>${(sh.fagents||{})[a]?own:buy('fagent',a,'Appoint')}</div>`).join('');
  const sheds=myPorts.map(p=>`<div class="uprow" data-key="sd${p}"><div><strong>${PN[p]}</strong></div>${(sh.sheds||{})[p]?own:buy('shed',p,'Build')}</div>`).join('')||'<p class="note">Open a line first.</p>';
  const colds=COLD_PORTS.filter(p=>myPorts.includes(p)).map(p=>`<div class="uprow" data-key="cs${p}"><div><strong>${PN[p]}</strong></div>${(sh.cold||{})[p]?own:buy('cold',p,'Build')}</div>`).join('')||`<p class="note">Cold stores can be built at ${COLD_PORTS.map(p=>PN[p]).join(', ')}, once a line of yours calls there.</p>`;
  const hostels=HOSTEL_PORTS.map(p=>`<div class="uprow" data-key="ho${p}"><div><strong>${PN[p]}</strong></div>${sh.hostels[p]?own:buy('hostel',p,'Build')}</div>`).join('');
  const yards=Object.keys(YARD_PORTS).map(p=>`<div class="uprow" data-key="yd${p}"><div><strong>A repair yard on ${YARD_PORTS[p]}</strong><div class="meta">At ${PN[p]}${sh.slip===p?' · with a building slip, '+(sh.slipBuilt||0)+' ships built':''}</div></div>${!sh.yards[p]?buy('yard',p):!sh.slip?buy('slip',p,'Add a building slip'):own}</div>`).join('');
  const bk=sh.bunker&&sh.bunker.until>=S.m;
  setHTML($('pane-shore'),`
    <section class="sec"><h2>Piers</h2><p class="note">Your own pier cuts port dues there by 60% and takes a day off each turnaround. ${fmt(350*PX())} a month each to run.</p><div class="stack" style="gap:6px">${piers}</div></section>
    <section class="sec"><h2>Booking agencies</h2><p class="note">Agents in a region book passengers for every line calling there: steerage up about 7%, cabin classes 3%. ${fmt(300*PX())} a month each.</p><div class="stack" style="gap:6px">${agents}</div></section>
    <section class="sec"><h2>Emigrant hostels</h2><p class="note">Clean beds and a medical check before sailing. Steerage up 12% on lines calling there, fewer quarantine scares, and a little reputation. ${fmt(250*PX())} a month each.</p><div class="stack" style="gap:6px">${hostels}</div></section>
    <section class="sec"><h2>Repair yards</h2><p class="note">Refits, overhauls and upgrades at your own yard cost 30% less and take 30% less time. A yard can take a building slip (${fmt(shoreCost('slip'))}, ${fmt(1500*PX())} a month more): your own ships at 80% of a builder's price, slow at first and better with every hull. ${fmt(800*PX())} a month each.</p><div class="stack" style="gap:6px">${yards}</div></section>
    <section class="sec"><h2>Freight</h2><p class="note">Freight canvassers win cargo for every one of your ships calling in their region, about 8% more of what is on offer. ${fmt(500*PX())} a month each.</p><div class="stack" style="gap:6px">${fag}</div>
      <p class="note" style="margin-top:10px"><strong>Transit sheds</strong> at a port cut cargo handling there by 40% and half a day off each turnaround. ${fmt(200*PX())} a month each.</p><div class="stack" style="gap:6px">${sheds}</div>
      <p class="note" style="margin-top:10px"><strong>Cold stores</strong> hold chilled meat and fruit for your refrigerated ships: about 20% more of those cargoes on lines calling there. ${fmt(400*PX())} a month each.</p><div class="stack" style="gap:6px">${colds}</div></section>
    <section class="sec"><h2>Bunkers</h2><div class="uprow"><div><strong>Bunker contract</strong><div class="meta">${bk?`12% off coal and oil until ${monthName(sh.bunker.until)}`:'Two years at 12% off coal and oil, paid up front'}</div></div>${bk?own:buy('bunker',null,'Sign')}</div></section>
    <section class="sec"><p class="note">Shore establishment costs ${fmt(shoreUpkeep()*PX())} a month in all, and its property is worth about ${fmt(shoreValue())} to the bank.</p></section>`);
}

/* ---------- Finance ---------- */
function chart(){
  const h=[...S.hist,Math.round(S.cash)];if(h.length<2)return '';
  const W2=320,H2=80,P=6,mn=Math.min(0,...h),mx=Math.max(1,...h);
  const x=i=>P+i*(W2-2*P)/(h.length-1),y=v=>H2-P-(v-mn)/(mx-mn)*(H2-2*P);
  const pts=h.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<div><div class="row"><span class="lbl">Cash since ${monthName(S.m0||M21)}</span><span class="meta num">high ${fmt(mx)}</span></div>
    <svg class="chart" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Cash over time"><polygon points="${x(0)},${y(mn)} ${pts} ${x(h.length-1)},${y(mn)}" style="fill:var(--brass-soft)" opacity=".6"/>
    ${mn<0?`<line x1="${P}" x2="${W2-P}" y1="${y(0)}" y2="${y(0)}" style="stroke:var(--muted)" stroke-dasharray="3 3"/>`:''}
    <polyline points="${pts}" style="fill:none;stroke:var(--brass)" stroke-width="1.8"/><circle cx="${x(h.length-1)}" cy="${y(h[h.length-1])}" r="3.5" style="fill:${h[h.length-1]<0?'var(--bad)':'var(--brass)'}"/></svg></div>`;
}
/* profit and loss by ship: four figures a ship, and the company's own costs below, adding up to the Line's result */
const PL_TAKE=['fares','onboard','cargo','mail'],PL_RUN=['fuel','port','crew','upkeep','ins'];
const avgOf=list=>{const o={};for(const c of list)for(const k in c)o[k]=(o[k]||0)+c[k]/list.length;return o;};
function plData(){
  const mode=UI.plMonth||'year',LM=S.lastMonth,H=S.plHist||[];
  if(mode==='year'&&H.length)return {mode,n:H.length,cat:avgOf(H.map(h=>h.cat)),ship:x=>x.plc&&x.plc.length?avgOf(x.plc):null,nOf:x=>(x.plc||[]).length};
  if((mode==='last'||mode==='year')&&LM&&LM.ships)return {mode:'last',cat:LM.cat,ship:x=>LM.ships[x.id]||null};
  return {mode:'now',cat:S.mtd.cat,ship:x=>(S.mtd.ships||{})[x.id]||null};
}
/* what is costing her: each cost against her takings, and the one or two things worth doing about it */
function plDiagnosis(x,o){
  const t=PL_TAKE.reduce((a,k)=>a+(o[k]||0),0),cost=k=>-(o[k]||0),pct=v=>t>0?Math.round(v/t*100):null;
  const run=PL_RUN.reduce((a,k)=>a+cost(k),0),yard=['yard','salvage','refund','legal'].reduce((a,k)=>a+cost(k),0),pr=t-run-yard;
  const out=[];
  if(t<=0){out.push(x.state==='laid'||!x.line?'Laid up: she earns nothing and still pays a skeleton crew and insurance.':'No takings booked yet in this period.');}
  else{
    const share=[['fuel','Coal and oil'],['crew','Crew and provisions'],['port','Ports, agents and handling'],['upkeep','Maintenance'],['ins','Insurance']].map(([k,l])=>[k,l,pct(cost(k))]).filter(q=>q[2]>0).sort((a,b)=>b[2]-a[2]);
    out.push(`Of every £100 she takes: ${share.map(([,l,p])=>`${l.toLowerCase()} £${p}`).join(', ')}${yard>0?`, yard and mishaps £${pct(yard)}`:''}; ${pr>=0?`£${pct(pr)} left over`:`she is £${-pct(pr)} short`}.`);
    const hint=[];
    if(run>t)hint.push('Her takings do not cover her running costs on this line.');
    if(pct(cost('fuel'))>=32)hint.push(x.fuel==='coal'?'Coal is her biggest bill: economical speed, or conversion to oil, would cut it.':'Fuel is her biggest bill: economical speed would cut it.');
    if(pct(cost('crew'))>=32)hint.push((x.pay||1)>=2?'Crew costs are heavy: good pay is expensive on a ship that takes this little.':'Crew costs are heavy for what she takes: she may be too big a crew for this trade, or too empty.');
    if(pct(cost('port'))>=25)hint.push('Port and handling costs are heavy: a pier or transit sheds at her ports would cut them.');
    if(pct(yard)>=20)hint.push(fatOf(x)>=62?'Yard bills and mishaps are eating her profit: she is getting old and breaking down.':'Yard bills and mishaps are eating her profit this period: a one-off overhaul, or bad luck at sea.');
    out.push(...hint.slice(0,2));
    if(x.line&&typeof timesCauses==='function'){const tc=timesCauses(x.line);if(tc)out.push(tc);}
  }
  if(x.state!=='lost'){const opts=shipOptions(x),best=opts[0],cur=opts.find(q=>q.rk===x.line);
    if(best&&(!cur||best.pm-cur.pm>=400))out.push(`She should make about ${fmt(Math.round(best.pm/10)*10)} a month on ${ROUTES[best.rk].name}${cur?`, against ${fmt(Math.round(cur.pm/10)*10)} where she is`:''}${best.open?'':' (not yet open)'}.`);
    else if(cur&&cur.pm<-idleCost(x))out.push(`No line pays her way at present: laid up she would cost about ${fmt(Math.round(idleCost(x)/10)*10)} a month.`);}
  return out.map(t=>`<p class="note" style="margin:0 0 4px">${t}</p>`).join('');
}
function plHTML(){
  const D=plData(),pick=(o,ks)=>ks.reduce((a,k)=>a+((o||{})[k]||0),0),all=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
  const n=(v,b)=>`<td class="r num ${v<0?'neg':v>0&&b?'pos':''}">${b?'<strong>':''}${Math.abs(v)<0.5?'–':fmt(Math.round(v))}${b?'</strong>':''}</td>`;
  let tt=0,tr=0,ty=0,tp=0;
  const rows=S.ships.filter(x=>x.state!=='lost').map(x=>{const o=D.ship(x)||{},t=pick(o,PL_TAKE),r=pick(o,PL_RUN),y=all(o)-t-r,pr=t+r+y;tt+=t;tr+=r;ty+=y;tp+=pr;
    const open=UI.plOpen===x.id;
    const det=open?`<tr class="pldet"><td colspan="5">${plDiagnosis(x,o)}${D.mode==='year'&&D.nOf(x)<D.n?`<p class="note" style="margin:0 0 4px">Averaged over the ${D.nOf(x)} month${D.nOf(x)===1?'':'s'} she has been in the fleet.</p>`:''}
      <div class="kv" style="margin-top:6px">${CATS.filter(([k])=>Math.abs(o[k]||0)>=0.5).map(([k,l])=>`<dt>${l}</dt><dd class="${o[k]<0?'neg':''}">${fmt(Math.round(o[k]))}</dd>`).join('')||'<dt>Nothing booked</dt><dd></dd>'}</div>
      <button class="btn quiet" data-act="selship" data-id="${x.id}" style="margin-top:6px">Open SS ${x.name}</button></td></tr>`:'';
    return `<tr class="plrow" data-act="plopen" data-id="${x.id}" aria-expanded="${open}"><td><div class="nm">${x.name}</div><div class="meta">${x.state==='laid'||!x.line?'laid up':ROUTES[x.line].name}</div></td>${n(t)}${n(r)}${n(y)}${n(pr,1)}</tr>${det}`;}).join('');
  const adv=D.cat.adv||0,other=all(D.cat)-tp-adv,H=S.plHist||[],LM=S.lastMonth;
  const seg=`<div class="seg" role="group"><button data-act="plmonth" data-id="year" aria-pressed="${D.mode==='year'}" ${H.length?'':'disabled'}>Last ${H.length>1?H.length+' months':'12 months'}</button><button data-act="plmonth" data-id="last" aria-pressed="${D.mode==='last'}" ${LM&&LM.ships?'':'disabled'}>${LM?MONTHS[LM.m%12]:'Last month'}</button><button data-act="plmonth" data-id="now" aria-pressed="${D.mode==='now'}">${MONTHS[S.m%12]} so far</button></div>`;
  return `${seg}<p class="note" style="margin:4px 0 0">${D.mode==='year'?'<strong>A month, on average.</strong> Single months swing: a ship is paid when she arrives, so one month may catch two arrivals and the next none, and yard bills land all at once.':'One month on its own swings with arrivals and yard bills; the average is the truer picture.'}</p>
    <div class="tablewrap"><table class="board pltab"><thead><tr><th>Ship</th><th class="r">Takings</th><th class="r">Running</th><th class="r">Yard etc</th><th class="r">Profit</th></tr></thead><tbody>${rows}
    <tr class="bline"><td><strong>All ships</strong></td>${n(tt)}${n(tr)}${n(ty)}${n(tp,1)}</tr>
    <tr><td colspan="4">Advertising on the lines</td>${n(adv)}</tr>
    <tr><td colspan="4">Head office, shore, interest and the rest</td>${n(other)}</tr>
    <tr class="btot"><td colspan="4"><strong>The Line</strong></td>${n(all(D.cat),1)}</tr></tbody></table></div>
    <p class="note"><strong>Takings</strong>: fares, cargo, mail and money spent aboard. <strong>Running</strong>: coal, ports and agents, crew and provisions, maintenance and insurance. <strong>Yard etc</strong>: drydocks, refits, repairs, salvage, refunds and fines. Click a ship to see what is costing her.</p>`;
}
function ledgerHTML(){
  const M=S.mtd,LM=S.lastMonth,sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
  const n=v=>v===undefined||v===null?'<td class="r meta">–</td>':`<td class="r num ${v<0?'neg':''}">${fmt(Math.round(v))}</td>`;
  const H=S.plHist||[],Y=H.length?{cat:avgOf(H.map(h=>h.cat)),lines:avgOf(H.map(h=>h.lines))}:null;
  const hd=t=>`<tr class="bline"><td><strong>${t}</strong></td><td></td><td></td><td></td></tr>`;
  const cats=CATS.filter(([k])=>M.cat[k]||LM&&LM.cat[k]).map(([k,l])=>`<tr><td>${l}</td>${n(M.cat[k]||0)}${n(LM&&(LM.cat[k]||0))}${n(Y&&(Y.cat[k]||0))}</tr>`).join('');
  const lk=[...new Set([...Object.keys(S.lines),...Object.keys(M.lines),...Object.keys(LM?LM.lines:{})])].filter(k=>k==='_office'||k==='_idle'||ROUTES[k]).sort((a,b)=>(a[0]==='_')-(b[0]==='_'));
  const lines=lk.map(k=>`<tr${ROUTES[k]?` data-act="selline" data-id="${k}"`:''}><td>${k==='_office'?'Head office, shore and bank':k==='_idle'?'Laid up and in yard':ROUTES[k].name}</td>${n(M.lines[k]||0)}${n(LM&&LM.lines[k])}${n(Y&&(Y.lines[k]||0))}</tr>`).join('');
  return `<div class="tablewrap"><table class="board ledger"><thead><tr><th></th><th class="r">${MONTHS[S.m%12].slice(0,3)} so far</th><th class="r">${LM?MONTHS[LM.m%12].slice(0,3):'Last'}</th><th class="r">Avg month</th></tr></thead><tbody>
    ${hd('By account')}${cats||'<tr><td class="meta" colspan="4">Nothing booked yet</td></tr>'}
    <tr class="btot"><td><strong>The Line</strong></td>${n(sum(M.cat))}${n(LM&&LM.net)}${n(Y&&sum(Y.cat))}</tr>
    ${hd('By line')}${lines}</tbody></table></div>
    <p class="note">A line's figures include its ships and its advertising. The average is over the last ${H.length>1?H.length+' months':'twelve months'}.</p>`;
}
function renderFinance(){
  const c=S.mtd.cat;
  const LM=S.lastMonth,hr=headroom();
  setHTML($('pane-finance'),`
    <section class="sec"><h2>Profit and loss by ship</h2>${plHTML()}</section>
    <section class="sec"><h2>Ledger</h2>${ledgerHTML()}
      ${LM?`<p class="note">${monthName(LM.m)} closed at <span class="num ${LM.net<0?'neg':'pos'}">${fmt(LM.net)}</span>, with ${fmt(LM.repay)} repaid to the bank.</p>`:''}
      ${chart()}</section>
    <section class="sec"><h2>Bank</h2>
      ${S.call?`<p class="badline">Called loan: ${fmt(S.call.amt)} due by ${monthName(S.call.due)}. If the account cannot pay it, the bank seizes ships in port and sells them cheaply.</p>`:''}
      ${S.noLend>S.m?`<p class="warnline">No new lending until ${monthName(S.noLend)}.</p>`:''}
      <dl class="kv"><dt>Debt</dt><dd>${fmt(S.debt)}</dd><dt>Interest (${S.rateUp>S.m?'8.5':'6.5'}%)</dt><dd>${fmt(S.debt*(S.rateUp>S.m?0.085:0.065)/12)}/mo</dd>
      <dt>Required repayment</dt><dd>${fmt(Math.round(S.debt*0.004))}/mo</dd><dt>Fleet value</dt><dd>${fmt(fleetValue())}</dd><dt>Can still borrow</dt><dd>${fmt(hr)}</dd></dl>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,hr,S.debt)).map(v=>`<button class="btn" data-act="borrow" data-id="${v}" ${hr<v||S.noLend>S.m||S.over?'disabled':''}>Borrow ${fmt(v)}</button>`).join('')}</div>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,S.debt)).map(v=>`<button class="btn" data-act="repay" data-id="${v}" ${S.cash<Math.min(v,S.debt)||S.debt<=0||S.over?'disabled':''}>Repay ${fmt(v)}</button>`).join('')}</div>
      <p class="note">The bank lends up to 70% of your fleet and property, and 90% of your government stock. Its overdraft runs to ${fmt(odLimit())} (£8,000 plus half your unused borrowing); below that it forecloses.</p></section>
    <section class="sec"><h2>Government stock</h2>
      <p class="note">Consols pay 3½% a year and are safe if your bank fails. They fall a little in a panic, and selling costs ½%. Cash in the bank earns nothing${S.m>=ym(1936,0)?', and banks do fail':''}.</p>
      <dl class="kv"><dt>Holding</dt><dd>${fmt(S.gilts||0)}</dd><dt>Interest</dt><dd>${fmt((S.gilts||0)*0.035/12)}/mo</dd></dl>
      <div class="btns">${[10000,100000,1000000].filter(v=>v<=Math.max(10000,S.cash)).map(v=>`<button class="btn" data-act="giltbuy" data-id="${v}" ${S.cash<v||S.over?'disabled':''}>Buy ${fmt(v)}</button>`).join('')}</div>
      ${S.gilts>0?`<div class="btns">${[10000,100000,1000000].filter(v=>v<=S.gilts).map(v=>`<button class="btn" data-act="giltsell" data-id="${v}">Sell ${fmt(v)}</button>`).join('')}<button class="btn" data-act="giltsell" data-id="all">Sell all</button></div>`:''}</section>
    <section class="sec"><h2>Prices</h2>
      <p class="note">Prices are ${Math.abs(Math.round((PX()-1)*100))}% ${PX()>=1?'higher':'lower'} than in 1921: wages, coal, yard work, ships and fares all follow them, but money in the bank does not. What cost ${fmt(10000)} in 1921 costs ${fmt(10000*PX())} now.${S.wageK>1.001?` Union agreements have put crew pay ${Math.round((S.wageK-1)*100)}% above the going rate.`:''}</p>
      ${S.crash&&S.crash.stage==='panic'?`<p class="badline">The panic of ${monthName(S.crash.panicAt)} is ${crashF(S.m)>0.7?'at its worst':'easing'}: trade is down and ships sell for little.</p>`:''}</section>`);
}

/* ---------- Company ---------- */
function ownersByRoute(o){const c={};for(const y of S.rships)if(y.owner===o)c[y.route]=(c[y.route]||0)+1;return Object.keys(c).map(rk=>`${ROUTES[rk].name} ${c[rk]}`).join(' · ');}
const confBtn=()=>S.conf?(UI.confirm==='leave'?`<div class="btns"><button class="btn danger" data-act="leave">Confirm: leave</button><button class="btn" data-act="cancel">Stay</button></div>`:`<button class="btn" data-act="leave" style="width:fit-content">Leave the conference</button>`)
  :`<div class="row"><button class="btn" data-act="join" ${S.cash<3000||S.over?'disabled':''} style="width:fit-content">Join the conference · £3,000</button><span class="meta">then £350 a month; fare floor and steerage quota, no rate wars</span></div>`;
function renderCompany(){
  const own='<span class="chip sea">Owned</span>',buy=(kind,key,label)=>{const c=shoreCost(kind,key);return `<button class="btn" data-act="shorebuy" data-d='${JSON.stringify([kind,key])}' ${S.cash<c||S.over?'disabled':''}>${label||'Buy'} · ${fmt(c)}</button>`;};
  const depts=Object.keys(DEPTS).map(k=>{const d=DEPTS[k],o=S.depts[k],dc=deptCost(k);
    const hd=o&&o.head?`<div class="meta"><strong>${o.head.name}</strong>, ${d.head.toLowerCase()}: ${compWord(o.head.comp)} (${o.head.comp}), ${o.head.bold?'bold':'careful'}, £${o.head.wage} a month</div>
      <div class="meta">${dc.staff} clerks £${dc.clerks} · rent £${dc.rent} · sundries £${dc.sundries} · in all ${fmt(dc.total)} a month</div>
      ${UI.headPick===k?`<div class="stack" style="gap:4px">${(o.cands||[]).map((h,i)=>`<div class="uprow"><div><strong>${h.name}</strong><div class="meta">${compWord(h.comp)} (${h.comp}), ${h.bold?'bold':'careful'}, £${h.wage} a month</div></div><button class="btn" data-act="newhead" data-d='${JSON.stringify([k,i])}'>Appoint · ${fmt(o.head.wage*3)} severance</button></div>`).join('')||'<p class="note">No candidates this quarter.</p>'}</div>`:`<button class="btn quiet" data-act="headpick" data-id="${k}" style="width:fit-content">Look for a new ${d.head.toLowerCase()}</button>`}`
      :`<div class="meta">About ${fmt(dc.total+60)} a month to run at your present size: ${dc.staff} clerks, rent and a head of department. It grows with the fleet.</div>`;
    return `<div class="card" data-key="dp${k}"><div class="row"><strong>${d.name}</strong>${o?own:''}</div><p class="note" style="margin:0">${d.does}</p>${hd}
      ${o?`<div class="row"><div class="seg" role="group"><button data-act="deptmode" data-d='${JSON.stringify([k,0])}' aria-pressed="${!o.auto}">Advise</button><button data-act="deptmode" data-d='${JSON.stringify([k,1])}' aria-pressed="${!!o.auto}">Act</button></div>
        <span class="meta">${o.auto?'Works through its advice every week. Big decisions come to you as proposals':'Advice only; you decide'}</span></div>`:buy('dept',k,'Open')}</div>`;}).join('');

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
    <section class="sec"><h2>Departments</h2>${S.ships.length<4?`<p class="warnline">With ${S.ships.length===1?'one ship':S.ships.length+' ships'} a department costs more than it can save: they start to pay their way at about four ships. Each costs its opening fee plus wages and rent every month.</p>`:''}<p class="note">Each department advises in its own field, and can be told to act on its advice. A department is only as good as its head and staff: a muddled head misses months and misjudges fares, a careful one lets small gains go. Acting departments keep a cash reserve and never open lines, buy, build or sell ships on their own: they bring those to you as proposals.</p><div class="stack">${depts}</div></section>
    ${safety}
    <section class="sec"><h2>North Atlantic conference</h2>${conf}</section>
    <section class="sec"><h2>Rival lines</h2><p class="note">Their moves on each route are on that line's panel.</p>${Object.keys(RIVAL_P).map(o=>{const x=RIVALS[o],fleet=S.rships.filter(y=>y.owner===o),by=ownersByRoute(o);
      return `<div class="card" data-key="rv${o}"><div class="row"><strong><span class="rdot" style="background:${RIVAL_P[o].col}"></span>${x.name}</strong><span class="chip ${S.rivals[o].cash<50000?'bad':S.rivals[o].cash<250000?'yard':'sea'}">${rivalHealth(S.rivals[o].cash)}</span></div>
        <div class="meta">${x.flag} · ${fleet.length} ship${fleet.length===1?'':'s'} · ${RIVAL_P[o].aggr>=1.1?'aggressive':RIVAL_P[o].aggr>=0.9?'combative':'cautious'}</div>
        <div class="meta">${by||'No ships at sea'}</div>
</div>`;}).join('')}</section>
    <section class="sec"><h2>Milestones</h2><div class="stack" style="gap:4px">${MILESTONES.map(([id,label])=>`<div class="row" data-key="mi${id}"><span class="${S.miles[id]!==undefined?'':'meta'}">${label}</span><span class="meta">${S.miles[id]!==undefined?monthName(S.miles[id]):'Not yet'}</span></div>`).join('')}</div></section>
`);
}
/* save code, settings and the game itself: kept out of the tabs, behind the Menu button */
function MENU_HTML(){return `<div class="modal" role="dialog" aria-modal="true" aria-label="Menu"><div class="panel menu stack"><div class="row"><h3>Menu</h3><button class="btn" data-act="menu">Close</button></div>
    <section class="sec"><h2>Save code</h2><p class="note">The game saves itself in this browser, but clearing site data wipes it. A save code holds the whole game as text: keep it somewhere safe, or paste it into another browser or computer to carry on there.</p>
      <div class="btns"><button class="btn" data-act="mkcode">${UI.saveCode?'Make a fresh code':'Make a save code'}</button>${UI.saveCode?`<button class="btn" data-act="copycode">Copy code</button><button class="btn" data-act="copylink">Copy save link</button>`:''}</div>
      ${UI.saveCode?`<textarea class="code" readonly rows="3" data-key="sc" onclick="this.select()">${UI.saveCode}</textarea><p class="note">Made ${UI.saveCodeAt}. ${int(UI.saveCode.length)} characters.${UI.copied?' <strong>'+UI.copied+'</strong>':''}</p>`:''}
      <label class="lbl" for="loadCode">Load a save code</label><textarea id="loadCode" data-keep="1" class="code" rows="2" placeholder="Paste a code here"></textarea>
      <div class="btns">${UI.confirm==='load'?`<button class="btn danger" data-act="loadcode">Confirm: replace this game</button><button class="btn" data-act="cancel">Cancel</button>`:`<button class="btn" data-act="askload">Load code</button>`}</div>
      ${UI.loadMsg?`<p class="${UI.loadMsg.ok?'note':'badline'}">${UI.loadMsg.t}</p>`:''}</section>
    <section class="sec"><h2>Settings</h2><div class="ctl"><span class="lbl">On big events</span><div class="seg" role="group">${[['slow','Slow down'],['pause','Pause'],['off','Carry on']].map(([k,l])=>`<button data-act="eventmode" data-v="${k}" aria-pressed="${UI.eventMode===k}">${l}</button>`).join('')}</div><p class="note">Slow down: the clock drops to a crawl for a few seconds so you can read what happened, then picks up again on its own, or as soon as you act.</p></div></section>
    <section class="sec"><h2>Game</h2><p class="note">Version <strong>${GAME_VERSION}</strong>, released ${GAME_BUILT}.</p><div class="btns">${UI.confirm==='new'?`<button class="btn danger" data-act="new">Confirm: start again</button><button class="btn" data-act="cancel">Keep playing</button>`:`<button class="btn" data-act="new">New game</button>`}</div></section></div></div>`;}
function renderModal(){
  const el=$('modal');
  if(!S.over&&UI.menu){setHTML(el,MENU_HTML());return;}
  if(!S.over){el.innerHTML='';return;}
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
