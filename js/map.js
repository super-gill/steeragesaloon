/* ================= MAP ================= */
const W=CHART.W,H=CHART.H;
/* position along a route's sea lane by nautical miles from its first call; rev turns the heading for homeward ships */
const pointAtNm=(gk,nm,rev)=>pointOn(CHART.routes[gk],nm,rev);
const PORT_XY=c=>CHART.ports[c];
// label offsets [dx, dy, side]: tuned so the crowded Channel, Irish Sea and Maritimes stay legible
const PORT_LABEL={VIL:[-8,-4,'right'],GLA:[8,-14,'left'],LIV:[8,-4,'left'],SOU:[8,-10,'left'],CHE:[8,2,'left'],AVO:[-8,-14,'right'],QUE:[-8,0,'right'],MOV:[-8,-14,'right'],
  HAM:[8,-8,'left'],NYC:[8,4,'left'],HAL:[8,-2,'left'],SJN:[-8,-14,'right'],QBC:[-8,-14,'right'],MTL:[-8,2,'right'],NAP:[-8,-14,'right'],GEN:[8,-14,'left'],
  GIB:[8,2,'left'],LIS:[-8,-6,'right'],NOL:[8,-14,'left'],GAL:[-8,-14,'right'],KIN:[8,2,'left'],FRE:[-8,-6,'right'],LAG:[8,-6,'left'],RIO:[8,-2,'left'],MVD:[8,2,'left'],BUE:[-8,-14,'right']};
const PORT_STACK={GLA:[-14,-6,-11,0],LIV:[-14,6,-11,0],HAL:[14,8,11,0],NYC:[14,-4,11,0]};
const stackOf=c=>PORT_STACK[c]||[12,10,10,0];
document.getElementById('mapsvg').setAttribute('viewBox',`0 0 ${W} ${H}`);
document.querySelector('#mapsvg rect').setAttribute('height',H);document.querySelector('#mapsvg rect').setAttribute('width',W);
document.getElementById('land').setAttribute('d',CHART.land);
document.getElementById('grat').setAttribute('d',CHART.grat);
function renderPorts(){
  const used=new Set();for(const rk in S.lines)for(const p of ROUTES[rk].calls)used.add(p);if(S.lines.stl)geoEnds('stlw').forEach(p=>used.add(p));
  setHTML(document.getElementById('portsO'),Object.keys(PN).filter(c=>c!=='OFF').map(c=>{const [x,y]=PORT_XY(c),[dx,dy,side]=PORT_LABEL[c]||[8,-6,'left'];
    return `<div class="port${used.has(c)?'':' dim'}" data-key="p${c}" style="left:${x/W*100}%;top:${y/H*100}%"><i></i><span style="${side}:${side==='left'?dx:-dx}px;top:${dy}px">${PN[c]}</span></div>`;}).join(''));
}

/* pan and zoom: the world is sized in pixels so markers and labels stay crisp */
const VIEW={s:null,x:0,y:0,fit:1,z:1};
const FOC=CHART.focus;
function applyView(){
  const m=document.getElementById('map'),w=m.clientWidth,h=m.clientHeight;if(!w||!h)return;
  const fw=FOC[2]-FOC[0],fh=FOC[3]-FOC[1];
  VIEW.fit=Math.min(w/fw,h/fh);const sMin=Math.min(Math.max(w/W,h/H),VIEW.fit);
  if(VIEW.s===null){VIEW.s=VIEW.fit;VIEW.x=w/2-(FOC[0]+fw/2)*VIEW.s;VIEW.y=h/2-(FOC[1]+fh/2)*VIEW.s;}
  VIEW.s=clamp(VIEW.s,sMin,VIEW.fit*4);VIEW.z=VIEW.s/VIEW.fit;
  const ww=W*VIEW.s,hh=H*VIEW.s;
  VIEW.x=ww<=w?(w-ww)/2:clamp(VIEW.x,w-ww,0);VIEW.y=hh<=h?(h-hh)/2:clamp(VIEW.y,h-hh,0);
  const wd=document.getElementById('world');
  wd.style.width=ww+'px';wd.style.height=hh+'px';wd.style.transform=`translate(${VIEW.x}px,${VIEW.y}px)`;
}
function zoomAt(f,cx,cy){
  const m=document.getElementById('map'),sMin=Math.min(Math.max(m.clientWidth/W,m.clientHeight/H),VIEW.fit);
  const old=VIEW.s,ns=clamp(old*f,sMin,VIEW.fit*4);VIEW.s=ns;
  VIEW.x=cx-(cx-VIEW.x)*ns/old;VIEW.y=cy-(cy-VIEW.y)*ns/old;applyView();
}
function zoomFit(){VIEW.s=null;applyView();}
(function(){
  const m=document.getElementById('map');let drag=null;
  m.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.zoomctl,.banner'))return;drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,vx:VIEW.x,vy:VIEW.y,moved:false};});
  m.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
    if(!drag.moved&&Math.hypot(dx,dy)>4){drag.moved=true;m.classList.add('dragging');try{m.setPointerCapture(e.pointerId);}catch(_){}}
    if(drag.moved){VIEW.x=drag.vx+dx;VIEW.y=drag.vy+dy;applyView();}});
  const end=e=>{if(!drag)return;if(drag.moved){UI.suppressClick=true;setTimeout(()=>UI.suppressClick=false,0);}m.classList.remove('dragging');drag=null;};
  m.addEventListener('pointerup',end);m.addEventListener('pointercancel',end);
  m.addEventListener('wheel',e=>{e.preventDefault();const r=m.getBoundingClientRect();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);},{passive:false});
  if(window.ResizeObserver)new ResizeObserver(()=>applyView()).observe(m);else window.addEventListener('resize',applyView);
})();

function renderMap(){
  const g=Object.keys(ROUTES).map(rk=>{
    const open=!!S.lines[rk],war=open&&S.wars[rk],sel=S.selLine===rk&&UI.tab==='lines';
    const pts=GEO(geoKey(rk,S.m)).pts.map(p=>p.join(',')).join(' ');
    return `<polyline class="route ${open?'open':'closed'}${war?' war':''}${sel?' selr':''}" points="${pts}"/><polyline class="routehit" data-act="selline" data-id="${rk}" points="${pts}"><title>${ROUTES[rk].name}</title></polyline>`;
  }).join('');
  setHTML(document.getElementById('routesG'),g);
  let chips='';
  for(const rk of Object.keys(ROUTES)){
    const gk=geoKey(rk,S.m),p=pointAtNm(gk,GEO(gk).dist*0.5,false);const tags=[];
    if(S.wars[rk]&&S.lines[rk])tags.push('<span class="chipm war" style="position:static;transform:none">Rate war</span>');
    if(S.mail[rk])tags.push('<span class="chipm mail" style="position:static;transform:none">Mail</span>');
    if(tags.length)chips+=`<div class="chipm" style="left:${p.x/W*100}%;top:${p.y/H*100}%;border:0;background:none;padding:0;display:flex;gap:4px">${tags.join('')}</div>`;
  }
  setHTML(document.getElementById('chipsHolder'),chips);
  renderPorts();
  const b=document.getElementById('banner');
  if(UI.speed===0&&UI.banner&&!S.over){b.hidden=false;setHTML(b,`<span>${UI.banner}</span><button class="btn primary" data-act="speed" data-v="1">Resume</button>`);}
  else if(UI.slow&&UI.speed>0&&!S.over){b.hidden=false;setHTML(b,`<span><b>Slowed</b> · ${UI.slow.text}</span><button class="btn primary" data-act="unslow">Carry on</button>`);}
  else b.hidden=true;
}
const MARKS={};
function drawShips(){
  if(!S)return;
  const O=document.getElementById('shipsO'),stackN={};
  const seen=new Set();
  for(const sh of S.ships){
    seen.add(sh.id);
    let el=MARKS[sh.id];
    if(!el){el=document.createElement('div');el.className='shipm';el.dataset.act='selship';el.dataset.id=sh.id;
      el.innerHTML='<div class="hit"></div><div class="hull"></div><div class="tag"></div>';O.appendChild(el);MARKS[sh.id]=el;}
    let x,y,ang=0,ox=0,oy=0;
    const est=isSilent(sh);
    if(est){const p=estXY(sh);x=p.x;y=p.y;ang=p.ang;}
    else if(sh.state==='sea'){const g=GEO(sh.geo),p=pointAtNm(sh.geo,sh.dir===0?sh.pos:g.dist-sh.pos,sh.dir===1);x=p.x;y=p.y;ang=p.ang;}
    else if(sh.state==='repo'){const T=trackBetween(sh.port,sh.repoTo),p=pointOn(T,(1-sh.repoLeft/Math.max(1e-6,sh.repoTotal))*T.dist);x=p.x;y=p.y;ang=p.ang;}
    else{const c=sh.port,i=stackN[c]=(stackN[c]||0)+1,st=stackOf(c),[px,py]=PORT_XY(c);
      x=px;y=py;ox=st[0]+st[2]*(i-1);oy=st[1]+st[3]*(i-1);ang=st[2]<0?180:st[2]>0?0:90;}
    el.hidden=false;
    el.style.left=(x/W*100)+'%';el.style.top=(y/H*100)+'%';
    el.style.transform=(ox||oy)?`translate(${ox}px,${oy}px)`:'';
    el.querySelector('.hull').style.transform=`rotate(${ang}deg)`;
    const sel=S.selShip===sh.id;
    {const P=paintOf(sh),c=lum(P.funnel)>0.8?(P.band1||P.hull):P.funnel;el.querySelector('.hull').style.background=sh.state==='yard'||sh.state==='laid'||(!est&&sh.state==='sea'&&(sh.stopLeft>0||sh.limp||sh.towed))?'':c;}
    el.className='shipm'+(sel?' sel':'')+(est?' est'+(sh.overdue?' overdue':''):'')+(!est&&sh.state==='sea'&&(sh.stopLeft>0||sh.limp||sh.towed)?' broken':'')+(sh.state==='yard'?' yard':'')+(sh.state==='laid'?' laid':'');
    const tag=el.querySelector('.tag');const txt=sel||VIEW.z>=1.8?'SS '+sh.name+(est?' (reckoned)':''):'';if(tag.textContent!==txt)tag.textContent=txt;
  }
  for(const id of Object.keys(MARKS))if(!seen.has(+id)){MARKS[id].remove();delete MARKS[id];}
  drawRivals();
}
const RMARKS={};
function rivalXY(x){const p=rivalPos(x);if(p.inPort){const a=jr(x.id)*6.283;return {x:p.x,y:p.y,ang:a*57.3,ox:Math.cos(a)*9,oy:Math.sin(a)*9};}return p;}
function drawRivals(){
  const O=document.getElementById('shipsO'),seen=new Set();
  for(const x of (S.rships||[]).concat(S.ghosts||[])){
    seen.add(x.id);let el=RMARKS[x.id];
    if(!el){el=document.createElement('div');el.className='shipm rival';el.dataset.act='rcard';el.dataset.id=x.id;el.innerHTML='<div class="hull"></div>';O.prepend(el);RMARKS[x.id]=el;}
    const p=rivalXY(x);
    el.style.left=(p.x/W*100)+'%';el.style.top=(p.y/H*100)+'%';el.style.transform=p.ox?`translate(${p.ox.toFixed(1)}px,${p.oy.toFixed(1)}px)`:'';
    const h=el.firstChild;h.style.transform=`rotate(${p.ang}deg)`;h.style.background=RIVAL_P[x.owner].col;
    const t=`SS ${x.name}, ${RIVALS[x.owner].name}`;if(el.title!==t)el.title=t;
  }
  for(const id of Object.keys(RMARKS))if(!seen.has(id)){RMARKS[id].remove();delete RMARKS[id];}
}

