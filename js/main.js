/* ================= INPUT ================= */
document.addEventListener('click',e=>{
  if(UI.suppressClick&&e.target.closest('#map'))return;
  UI.rev=(UI.rev||0)+1;
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const prevTab=UI.tab;
  {const al=b.closest('.alert[data-aid]:not([data-sticky])');if(al)(S.attnSeen=S.attnSeen||{})[al.dataset.aid]=true;}
  const a=b.dataset.act,sh=S.ships.find(x=>x.id===S.selShip),L=S.lines[S.selLine];
  if(a!=='cancel'&&!a.startsWith('ask')&&!['exit','closeline','leave','new','loadcode'].includes(a))UI.confirm=null;
  if(UI.slow&&!['zoom','zoomfit'].includes(a))UI.slow=null; // the owner is dealing with it: back to full speed
  switch(a){
    case 'eventmode':UI.eventMode=b.dataset.v;try{localStorage.setItem('ss_eventmode',UI.eventMode);}catch(e){}break;
    case 'unslow':UI.slow=null;break;
    case 'inscover':if(sh&&INS_COVER[b.dataset.v]&&!(b.dataset.v==='none'&&S.debt>0)){insOf(sh);sh.ins.cover=b.dataset.v;sh.ownerSet=S.t;}break;
    case 'insall':if(sh){const p=insOf(sh);S.insDefault={cover:p.cover,excess:p.excess};S.ships.forEach(x=>{x.ins={...S.insDefault};});}break;
    case 'insexcess':if(sh){insOf(sh);sh.ins.excess=+b.dataset.v;}break;
    case 'speed':if(!S.over){UI.speed=+b.dataset.v;if(UI.speed>0)UI.banner=null;else UI.banner='Paused.';}break;
    case 'selship':S.selShip=+b.dataset.id;UI.tab='fleet';(S.tutSeen=S.tutSeen||{}).fleet=true;break;
    case 'selline':S.selLine=b.dataset.id;UI.tab='lines';(S.tutSeen=S.tutSeen||{}).lines=true;break;
    case 'tabgo':UI.tab=(UI.wide&&b.dataset.tab==='overview')?UI.tab:b.dataset.tab;(S.tutSeen=S.tutSeen||{})[b.dataset.tab]=true;break;
    case 'tutoff':if(S.tut)S.tut.off=true;break;
    case 'setfare':case 'setfares':case 'setlineopt':case 'setship':case 'moveship':case 'setyard':case 'sellship':case 'hire':case 'shorebuy':case 'shoresell':case 'deptmode':case 'openmove':case 'buyship':case 'newhead':case 'propyes':case 'propno':case 'build':case 'scrapship':case 'crewset':case 'appoint':case 'setwc':case 'cruiseadd':case 'cruisedrop':
      {const d=JSON.parse(b.dataset.d||'[]');if(a==='moveship'||a==='openmove'||a==='setship'||a==='setwc'||a==='cruiseadd'||a==='cruisedrop'){const x=S.ships.find(q=>q.id===d[0]);if(x)x.ownerSet=S.t;}if(a==='crewset'||a==='appoint'){const x=S.ships.find(q=>q.id===d[0]);if(x)x.crewSet=S.t;}const bef=advice().map(h=>[h.id,h.title]);doAction(a,d);ADV_CACHE.key=null;UI.rev++;
        const now=new Set(advice().map(h=>h.id)),gone=bef.filter(([id])=>!now.has(id)&&!(b.closest('.advice[data-key]')&&b.closest('.advice[data-key]').dataset.key===id));
        UI.advGone=gone.length&&b.closest('.advice')?{rev:UI.rev,titles:gone.map(q=>q[1])}:null;}ADV_CACHE.key=null;break;
    case 'shipgrp':{const o=UI.shipGrp=UI.shipGrp||{earn:true,upkeep:true,crew:false,retire:false};o[b.dataset.id]=!o[b.dataset.id];break;}
    case 'plopen':UI.plOpen=UI.plOpen===+b.dataset.id?null:+b.dataset.id;break;
    case 'plmonth':UI.plMonth=b.dataset.id;break;
    case 'crew':openCrew(+b.dataset.id||+(JSON.parse(b.dataset.d||'[]')[0])||S.selShip);break;
    case 'crewclose':closeCrew();break;
    case 'crewfleet':UI.crewFleet=true;break;
    case 'crewship':UI.crewSid=+b.dataset.id;UI.crewFleet=false;UI.offPool=null;break;
    case 'offpool':UI.offPool=UI.offPool===b.dataset.id?null:b.dataset.id;break;
    case 'cruisehelp':UI.cruiseHelp=!UI.cruiseHelp;break;
    case 'menu':UI.menu=!UI.menu;break;
    case 'fcship':(UI.fcShip=UI.fcShip||{})[b.dataset.k]=+b.dataset.id;break;
    case 'cappool':UI.capPool=UI.capPool===+b.dataset.id?null:+b.dataset.id;break;
    case 'mkcode':UI.copied=null;(S.tutSeen=S.tutSeen||{}).code=true;makeSaveCode().then(c=>{UI.saveCode=c;UI.saveCodeAt=dateLong(S.t)+' (game date)';UI.dirty=true;});break;
    case 'copycode':case 'copylink':{const txt=a==='copylink'?location.href.split('#')[0]+'#save='+UI.saveCode:UI.saveCode;
      const ok=()=>{UI.copied=a==='copylink'?'Link copied.':'Code copied.';UI.dirty=true;},fail=()=>{UI.copied='Your browser blocked copying: select the text and copy it by hand.';UI.dirty=true;};
      try{navigator.clipboard.writeText(txt).then(ok,fail);}catch(err){fail();}break;}
    case 'askload':if(($('loadCode').value||'').trim())UI.confirm='load';else UI.loadMsg={ok:false,t:'Paste a code into the box first.'};break;
    case 'loadcode':{const el=$(b.dataset.src||'loadCode'),code=el?el.value:'';UI.confirm=null;
      loadSaveCode(code).then(s2=>{UI.loadMsg={ok:true,t:`Loaded: ${dateLong(s2.t)}, ${s2.ships.length} ship${s2.ships.length===1?'':'s'}.`};layoutMode();applyView();},e2=>{UI.loadMsg={ok:false,t:e2.message||'That code could not be read.'};UI.dirty=true;});break;}
    case 'dismiss':putAside(b.dataset.id);break;
    case 'alladvice':UI.allAdvice=!UI.allAdvice;break;
    case 'newline':{const rk=Object.keys(ROUTES).find(k=>!S.lines[k]);if(rk)S.selLine=rk;UI.tab='lines';break;}
    case 'zoom':{const m=$('map');zoomAt(+b.dataset.v>0?1.3:1/1.3,m.clientWidth/2,m.clientHeight/2);break;}
    case 'zoomfit':zoomFit();break;
    case 'view':UI.view=b.dataset.v;break;
    case 'shipset':if(sh){sh.ownerSet=S.t;if(b.dataset.k==='autoDock')sh.autoDock=DOCK_TH[+b.dataset.v];else sh[b.dataset.k]=+b.dataset.v;}break;
    case 'alldock':if(sh)S.ships.forEach(x=>x.autoDock=sh.autoDock);break;
    case 'dzopen':openDesigner();break;
    case 'dzclose':closeDesigner();break;
    case 'dzview':UI.dzView=b.dataset.v;break;
    case 'dzauto':if(UI.dz)UI.dz.auto={mach:true,form:true};break;
    case 'dz':dzSet(b.dataset.k,b.dataset.v);UI.dzMsg=null;break;
    case 'dzadm':if(UI.dz)UI.dz.adm=!UI.dz.adm;break;
    case 'dzname':{const L=SHIP_NAMES[UI.dz.purpose]||SHIP_NAMES.inter,used=new Set(S.ships.map(x=>x.name).concat((S.orders||[]).map(o=>o.d.name)));
      const c=L.filter(n=>!used.has(n));UI.dz.name=c.length?c[Math.floor(Math.random()*c.length)]:L[0]+' II';const i=$('dzName');if(i)i.value=UI.dz.name;break;}
    case 'dzorder':{const r=placeOrder(UI.dz);if(r.ok){UI.dz=null;UI.dzMsg=null;closeDesigner();UI.tab='brokers';}else UI.dzMsg=r.why;break;}
    case 'askcxl':UI.confirm='cxl'+b.dataset.id;break;
    case 'cxlorder':{const o=(S.orders||[]).find(x=>x.id===+b.dataset.id);if(o){if(o.slip){o.slip.who=null;o.slip.until=S.m;}S.orders=S.orders.filter(x=>x!==o);news(`The contract for SS ${o.d.name} is cancelled. The ${fmt(o.paid)} already paid is lost.`,'bad');}UI.confirm=null;break;}
    case 'headpick':UI.headPick=UI.headPick===b.dataset.id?null:b.dataset.id;break;
    case 'traytab':UI.trayTab=b.dataset.id;UI.trayHold=false;{const t=$('traybody');if(t)t.scrollTop=0;}break;
    case 'advopen':UI.advOpen=UI.advOpen===b.dataset.id?null:b.dataset.id;break;
    case 'wread':{const m=(S.wire||[]).find(x=>x.id===+b.dataset.id);if(m&&m.read===false){m.read=true;UI.wa={id:m.id,txt:m.txt,mode:'decode',made:performance.now()};UI._tray=null;}break;}
    case 'wreadall':{for(const m of S.wire||[])if(m.read===false){m.read=true;const e=document.querySelector(`[data-hold="${m.id}"] .tg-an`);if(e)e.textContent=m.txt;}if(UI.wa)UI.wa.done=true;UI._tray=null;break;}
    case 'emmin':UI.emMin=true;break;
    case 'warclose':warClose();break;
    case 'reqpick':reqChoose(+b.dataset.id);break;
    case 'rcard':UI.rcard=b.dataset.id;break;
    case 'rclose':UI.rcard=null;break;
    case 'livopen':livPickOpen('change');break;
    case 'livpre':if(UI.liv){UI.liv.l=livFill(JSON.parse(JSON.stringify(LIV_PRESETS[+b.dataset.id])));}break;
    case 'livown':if(UI.liv)UI.liv.own=!UI.liv.own;break;
    case 'livok':livOk();break;
    case 'livcancel':livCancel();break;
    case 'dissend':disSend(+b.dataset.id);break;
    case 'dismin':UI.disMin=true;break;
    case 'disshow':UI.disMin=false;UI.disOpen=true;break;
    case 'disclose':disClose();break;
    case 'emshow':{UI.emMin=false;const L=(S.emerg||[]).filter(x=>x.known&&(!x.over||S.t-x.t1<3));if(L.length&&!L.some(x=>x.id===UI.emOpen))UI.emOpen=(L.find(x=>!x.over)||L[0]).id;break;}
    case 'emtab':UI.emOpen=+b.dataset.id;break;
    case 'emreport':emOrder('report',+b.dataset.id);break;
    case 'emorder':emOrder('order',+b.dataset.id,b.dataset.o);break;
    case 'emoffice':emOrder('office',+b.dataset.id,b.dataset.o);break;
    case 'emspeed':UI.emNormal=!UI.emNormal;break;
    case 'emclose':{const e=(S.emerg||[]).find(x=>x.id===+b.dataset.id);if(e)e.t1=-99;break;}
    case 'maptoggle':UI.noMap=!UI.noMap;requestAnimationFrame(()=>{VIEW.s=null;applyView();});break;
    case 'wireall':UI.wireAll=!UI.wireAll;break;
    case 'lineset':if(L)L[b.dataset.k]=+b.dataset.v;break;
    case 'yard':if(sh){const k=b.dataset.k;if(sh.state==='sea'||sh.state==='repo')sh.pendingYard=k;else if(S.cash>=refitCost(sh,k))enterYard(sh,k);}break;
    case 'unyard':if(sh&&sh.pendingYard!=='repair'){sh.pendingYard=(sh.yardAdd||[]).shift()||null;}break;
    case 'unyardall':if(sh&&sh.pendingYard!=='repair'){sh.pendingYard=null;sh.yardAdd=[];sh.facPlan=null;}break;
    case 'yardadd':if(sh)addYardJob(sh,b.dataset.k);break;
    case 'unyardx':if(sh&&sh.state!=='yard')sh.yardAdd=(sh.yardAdd||[]).filter(x=>x!==b.dataset.k);break;
    case 'askexit':UI.confirm=b.dataset.k+sh.id;break;
    case 'exit':if(sh){if(sh.state==='sea'||sh.state==='repo')sh.pendingExit=b.dataset.k;else exitShip(sh,b.dataset.k);}UI.confirm=null;break;
    case 'unexit':if(sh)sh.pendingExit=null;break;
    case 'openline':{const rk=b.dataset.id,fee=Math.round(2500*PX());if(S.cash>=fee&&!S.lines[rk]&&routeOpen(rk,S.m)){book('office',-fee,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};news(`The Morven Line opens a ${ROUTES[rk].name} service.`,'good');}break;}
    case 'askclose':UI.confirm='close'+b.dataset.id;break;
    case 'closeline':{const rk=b.dataset.id;delete S.lines[rk];delete S.mail[rk];delete S.wars[rk];S.ships.forEach(x=>{if(x.line===rk){x.line=null;}});news(`The ${ROUTES[rk].name} service is closed.`);UI.confirm=null;break;}
    case 'buy':{const s2=S.market.find(x=>x.id===+b.dataset.id);if(s2){const dep=Math.round(s2.price*0.4);if(S.cash>=dep){S.cash-=dep;S.debt+=s2.price-dep;delete s2.price;s2.acq=S.m;S.ships.push(s2);S.market=S.market.filter(x=>x!==s2);S.selShip=s2.id;news(`Bought SS ${s2.name}, lying at ${PN[s2.port]}. Assign her to a line.`,'good');}}break;}
    case 'borrow':{const v=+b.dataset.id||10000;if(headroom()>=v&&!(S.noLend>S.m)){S.debt+=v;S.cash+=v;}break;}
    case 'repay':{const x=Math.min(+b.dataset.id||10000,S.debt);if(S.cash>=x){S.debt-=x;S.cash-=x;}break;}
    case 'trustyes':trustAccept();break;
    case 'trustno':trustRefuse(false);break;
    case 'join':if(confOpen()&&S.cash>=3000*PX()){S.cash-=3000*PX();S.conf=true;S.wars={};S.tension={};news('The Morven Line has joined the North Atlantic conference.','good');}break;
    case 'leave':if(UI.confirm!=='leave')UI.confirm='leave';else{S.conf=false;UI.confirm=null;news('The Morven Line has left the conference. Expect retaliation if you undercut.','bad');}break;
    case 'accept':if(S.offer){S.mail[S.offer.route]={pay:S.offer.pay,strikes:0,ok:false};news(`Mail contract won on ${ROUTES[S.offer.route].name}: ${fmt(S.offer.pay)} per round trip.`,'good');S.offer=null;}break;
    case 'decline':S.offer=null;break;
    case 'safety':S.safety=+b.dataset.id;break;
    case 'refit':{const d=b.dataset.d?JSON.parse(b.dataset.d):[+b.dataset.id];openRefit(+d[0],d[1]);break;}
    case 'rfclose':closeRefit();break;
    case 'rflevel':case 'rfpicks':case 'rfbook':rfAct(a,b);break;
    case 'union':unionAnswer(b.dataset.id==='yes');break;
    case 'giltbuy':gilts(true,+b.dataset.id);break;
    case 'giltsell':gilts(false,b.dataset.id==='all'?S.gilts:+b.dataset.id);break;
    case 'new':if(UI.confirm!=='new')UI.confirm='new';else{UI.confirm=null;newGame();}break;
    case 'newnow':newGame();break;
    case 'cancel':UI.confirm=null;break;
  }
  save();UI.dirty=true;
  if(UI.tab!==prevTab){render();UI.dirty=false;$('tabbody').scrollTop=0;}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.fare&&S.lines[S.selLine]){S.lines[S.selLine].fares[t.dataset.fare]=clamp(Math.round(+t.value||1),1,500);}
  if(t.dataset.shipline){const sh=S.ships.find(x=>x.id===S.selShip);if(sh){sh.line=t.value||null;sh.ownerSet=S.t;if(sh.line&&sh.state==='laid'){sh.state='port';sh.portLeft=1;}}}
  if(t.dataset.wirert)UI.wireRoutine=t.checked;
  if(t.dataset.dzx&&UI.dz){UI.dz.extras[t.dataset.dzx]=t.checked;}
  if(t.dataset.dzline&&UI.dz){UI.dz.line=t.value;}
  if(t.dataset.rfjob&&UI.rf){UI.rf.jobs[t.dataset.rfjob]=t.checked;}
  if(t.dataset.reserve){const x=S.ships.find(y=>y.id===+t.dataset.reserve);if(x&&!atWar())x.reserve=t.checked;}
  if((t.dataset.livc||t.dataset.livon||t.dataset.livem||t.dataset.livdock)&&UI.liv)livInput(t);
  t.blur();UI.rev=(UI.rev||0)+1;save();UI.dirty=true;
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button][data-act]')){e.preventDefault();e.target.click();return;}
  if(e.code==='Space'&&!e.target.closest('input,select,textarea,button')){e.preventDefault();if(S.over)return;
    if(UI.speed>0){UI.last=UI.speed;UI.speed=0;UI.banner='Paused.';}else{UI.speed=UI.last||1;UI.banner=null;}UI.dirty=true;}
});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.dz&&UI.dz){dzSet(t.dataset.dz,t.value);UI.dzMsg=null;UI.dirty=true;}
  if(t.dataset.dzname&&UI.dz){UI.dz.name=t.value;UI.dirty=true;}
});
// hold the tray still while the pointer or a finger is on it
document.addEventListener('pointerover',e=>{const on=!!e.target.closest('#traybody');if(on!==!!UI.trayHover){UI.trayHover=on;UI.trayHold=on||UI.trayTouch>performance.now();if(!UI.trayHold)UI.dirty=true;}});
document.addEventListener('touchstart',e=>{if(e.target.closest('#traybody')){UI.trayTouch=performance.now()+3000;UI.trayHold=true;setTimeout(()=>{if(!UI.trayHover&&UI.trayTouch<=performance.now()){UI.trayHold=false;UI.dirty=true;}},3100);}},{passive:true});
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='traybody'){UI.trayTouch=performance.now()+2500;UI.trayHold=true;setTimeout(()=>{if(!UI.trayHover&&UI.trayTouch<=performance.now()){UI.trayHold=false;UI.dirty=true;}},2600);}},true);
window.addEventListener('pagehide',()=>save());

{const old=oldSaveNote();S=load();if(!S){newGame();if(old)news('Saves from before version 0.19 cannot be carried over: the calendar now runs from 1900, so this is a new game. The old save is left untouched in the browser.','bad');}}applyPrices();
if(location.hash.startsWith('#save=')){const code=location.hash.slice(1);history.replaceState(null,'',location.pathname+location.search);
  loadSaveCode(code).then(()=>news('Game loaded from a save link.'),e=>{UI.loadMsg={ok:false,t:'The save link could not be read: '+(e.message||'damaged code')};UI.menu=true;UI.dirty=true;});}
layoutMode();UI.dirty=true;applyView();requestAnimationFrame(frame);
