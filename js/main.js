/* ================= INPUT ================= */
document.addEventListener('click',e=>{
  if(UI.suppressClick&&e.target.closest('#map'))return;
  UI.rev=(UI.rev||0)+1;
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const prevTab=UI.tab;
  const a=b.dataset.act,sh=S.ships.find(x=>x.id===S.selShip),L=S.lines[S.selLine];
  if(a!=='cancel'&&!a.startsWith('ask')&&!['exit','closeline','leave','new','loadcode'].includes(a))UI.confirm=null;
  switch(a){
    case 'speed':if(!S.over){UI.speed=+b.dataset.v;if(UI.speed>0)UI.banner=null;else UI.banner='Paused.';}break;
    case 'selship':S.selShip=+b.dataset.id;UI.tab='fleet';break;
    case 'selline':S.selLine=b.dataset.id;UI.tab='lines';break;
    case 'tabgo':UI.tab=(UI.wide&&b.dataset.tab==='overview')?UI.tab:b.dataset.tab;break;
    case 'setfare':case 'setfares':case 'setlineopt':case 'setship':case 'moveship':case 'setyard':case 'sellship':case 'hire':case 'shorebuy':case 'deptmode':
      doAction(a,JSON.parse(b.dataset.d||'[]'));ADV_CACHE.key=null;break;
    case 'cappool':UI.capPool=UI.capPool===+b.dataset.id?null:+b.dataset.id;break;
    case 'mkcode':UI.copied=null;makeSaveCode().then(c=>{UI.saveCode=c;UI.saveCodeAt=dateLong(S.t)+' (game date)';UI.dirty=true;});break;
    case 'copycode':case 'copylink':{const txt=a==='copylink'?location.href.split('#')[0]+'#save='+UI.saveCode:UI.saveCode;
      const ok=()=>{UI.copied=a==='copylink'?'Link copied.':'Code copied.';UI.dirty=true;},fail=()=>{UI.copied='Your browser blocked copying: select the text and copy it by hand.';UI.dirty=true;};
      try{navigator.clipboard.writeText(txt).then(ok,fail);}catch(err){fail();}break;}
    case 'askload':if(($('loadCode').value||'').trim())UI.confirm='load';else UI.loadMsg={ok:false,t:'Paste a code into the box first.'};break;
    case 'loadcode':{const el=$(b.dataset.src||'loadCode'),code=el?el.value:'';UI.confirm=null;
      loadSaveCode(code).then(s2=>{UI.loadMsg={ok:true,t:`Loaded: ${dateLong(s2.t)}, ${s2.ships.length} ship${s2.ships.length===1?'':'s'}.`};layoutMode();applyView();},e2=>{UI.loadMsg={ok:false,t:e2.message||'That code could not be read.'};UI.dirty=true;});break;}
    case 'dismiss':S.dismiss[b.dataset.id]=S.m+1;break;
    case 'alladvice':UI.allAdvice=!UI.allAdvice;break;
    case 'newline':{const rk=Object.keys(ROUTES).find(k=>!S.lines[k]);if(rk)S.selLine=rk;UI.tab='lines';break;}
    case 'zoom':{const m=$('map');zoomAt(+b.dataset.v>0?1.3:1/1.3,m.clientWidth/2,m.clientHeight/2);break;}
    case 'zoomfit':zoomFit();break;
    case 'view':UI.view=b.dataset.v;break;
    case 'shipset':if(sh){if(b.dataset.k==='autoDock')sh.autoDock=DOCK_TH[+b.dataset.v];else sh[b.dataset.k]=+b.dataset.v;}break;
    case 'alldock':if(sh)S.ships.forEach(x=>x.autoDock=sh.autoDock);break;
    case 'incident':if(sh&&sh.incident)resolveIncident(sh,b.dataset.k);break;
    case 'lineset':if(L)L[b.dataset.k]=+b.dataset.v;break;
    case 'yard':if(sh){const k=b.dataset.k;if(sh.state==='sea'||sh.state==='repo')sh.pendingYard=k;else if(S.cash>=refitCost(sh,k))enterYard(sh,k);}break;
    case 'unyard':if(sh&&sh.pendingYard!=='repair')sh.pendingYard=null;break;
    case 'askexit':UI.confirm=b.dataset.k+sh.id;break;
    case 'exit':if(sh){if(sh.state==='sea'||sh.state==='repo')sh.pendingExit=b.dataset.k;else exitShip(sh,b.dataset.k);}UI.confirm=null;break;
    case 'unexit':if(sh)sh.pendingExit=null;break;
    case 'openline':{const rk=b.dataset.id;if(S.cash>=2500&&!S.lines[rk]){book('office',-2500,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};news(`The Morven Line opens a ${ROUTES[rk].name} service.`,'good');}break;}
    case 'askclose':UI.confirm='close'+b.dataset.id;break;
    case 'closeline':{const rk=b.dataset.id;delete S.lines[rk];delete S.mail[rk];delete S.wars[rk];S.ships.forEach(x=>{if(x.line===rk){x.line=null;}});news(`The ${ROUTES[rk].name} service is closed.`);UI.confirm=null;break;}
    case 'buy':{const s2=S.market.find(x=>x.id===+b.dataset.id);if(s2){const dep=Math.round(s2.price*0.4);if(S.cash>=dep){S.cash-=dep;S.debt+=s2.price-dep;delete s2.price;S.ships.push(s2);S.market=S.market.filter(x=>x!==s2);S.selShip=s2.id;news(`Bought SS ${s2.name}, lying at ${PN[s2.port]}. Assign her to a line.`,'good');}}break;}
    case 'borrow':if(headroom()>=10000){S.debt+=10000;S.cash+=10000;}break;
    case 'repay':{const x=Math.min(10000,S.debt);if(S.cash>=x){S.debt-=x;S.cash-=x;}break;}
    case 'join':if(S.cash>=3000){S.cash-=3000;S.conf=true;S.wars={};S.tension={};news('The Morven Line has joined the North Atlantic conference.','good');}break;
    case 'leave':if(UI.confirm!=='leave')UI.confirm='leave';else{S.conf=false;UI.confirm=null;news('The Morven Line has left the conference. Expect retaliation if you undercut.','bad');}break;
    case 'accept':if(S.offer){S.mail[S.offer.route]={pay:S.offer.pay,strikes:0,ok:false};news(`Mail contract won on ${ROUTES[S.offer.route].name}: ${fmt(S.offer.pay)} per round trip.`,'good');S.offer=null;}break;
    case 'decline':S.offer=null;break;
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
  if(t.dataset.shipline){const sh=S.ships.find(x=>x.id===S.selShip);if(sh){sh.line=t.value||null;if(sh.line&&sh.state==='laid'){sh.state='port';sh.portLeft=1;}}}
  if(t.dataset.autop)UI.autoPause=t.checked;
  t.blur();UI.rev=(UI.rev||0)+1;save();UI.dirty=true;
});
document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!e.target.closest('input,select,textarea,button')){e.preventDefault();if(S.over)return;
    if(UI.speed>0){UI.last=UI.speed;UI.speed=0;UI.banner='Paused.';}else{UI.speed=UI.last||1;UI.banner=null;}UI.dirty=true;}
});
window.addEventListener('pagehide',()=>save());

S=load();if(!S)newGame();
if(location.hash.startsWith('#save=')){const code=location.hash.slice(1);history.replaceState(null,'',location.pathname+location.search);
  loadSaveCode(code).then(()=>news('Game loaded from a save link.'),e=>{UI.loadMsg={ok:false,t:'The save link could not be read: '+(e.message||'damaged code')};UI.tab='company';UI.dirty=true;});}
layoutMode();UI.dirty=true;applyView();requestAnimationFrame(frame);
