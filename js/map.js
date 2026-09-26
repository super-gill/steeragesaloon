/* ================= MAP ================= */
const W=CHART.W,H=CHART.H;
const RP={};
for(const [k,pts] of Object.entries(CHART.routes)){
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  RP[k]={pts,cum,len:cum[cum.length-1]};
}
function pointAt(rk,f,rev){
  const R=RP[rk];f=clamp(f,0,1);if(rev)f=1-f;
  const d=f*R.len;let i=1;while(i<R.cum.length-1&&R.cum[i]<d)i++;
  const a=R.pts[i-1],b=R.pts[i],seg=R.cum[i]-R.cum[i-1]||1,u=(d-R.cum[i-1])/seg;
  let ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(rev)ang+=180;
  return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,ang};
}
const PORT_XY=c=>CHART.ports[PN[c]];
const PORT_LABEL={GLA:[8,-14,'left'],LIV:[8,4,'left'],NAP:[-8,-14,'right'],HAL:[-8,-16,'right'],NYC:[8,6,'left']};
const PORT_STACK={GLA:[-14,-6,-11,0],LIV:[-14,6,-11,0],NAP:[0,14,0,10],HAL:[14,6,11,0],NYC:[14,-4,11,0]};
document.getElementById('mapsvg').setAttribute('viewBox',`0 0 ${W} ${H}`);
document.querySelector('#mapsvg rect').setAttribute('height',H);document.querySelector('#mapsvg rect').setAttribute('width',W);
document.getElementById('land').setAttribute('d',CHART.land);
document.getElementById('grat').setAttribute('d',CHART.grat);
document.getElementById('portsO').innerHTML=Object.keys(PN).map(c=>{const [x,y]=PORT_XY(c),[dx,dy,side]=PORT_LABEL[c];
  return `<div class="port" style="left:${x/W*100}%;top:${y/H*100}%"><i></i><span style="${side}:${side==='left'?dx:-dx}px;top:${dy}px">${PN[c]}</span></div>`;}).join('');

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
    const pts=RP[rk].pts.map(p=>p.join(',')).join(' ');
    return `<polyline class="route ${open?'open':'closed'}${war?' war':''}${sel?' selr':''}" points="${pts}"/><polyline class="routehit" data-act="selline" data-id="${rk}" points="${pts}"><title>${ROUTES[rk].name}</title></polyline>`;
  }).join('');
  setHTML(document.getElementById('routesG'),g);
  let chips='';
  for(const rk of Object.keys(ROUTES)){
    const p=pointAt(rk,0.5,false);const tags=[];
    if(S.wars[rk]&&S.lines[rk])tags.push('<span class="chipm war" style="position:static;transform:none">Rate war</span>');
    if(S.mail[rk])tags.push('<span class="chipm mail" style="position:static;transform:none">Mail</span>');
    if(tags.length)chips+=`<div class="chipm" style="left:${p.x/W*100}%;top:${p.y/H*100}%;border:0;background:none;padding:0;display:flex;gap:4px">${tags.join('')}</div>`;
  }
  setHTML(document.getElementById('chipsHolder'),chips);
  const b=document.getElementById('banner');
  if(UI.speed===0&&UI.banner&&!S.over){b.hidden=false;setHTML(b,`<span>${UI.banner}</span><button class="btn primary" data-act="speed" data-v="1">Resume</button>`);}
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
    if(sh.state==='sea'){const p=pointAt(sh.legRoute,sh.pos/ROUTES[sh.legRoute].dist,sh.dir===1);x=p.x;y=p.y;ang=p.ang;}
    else if(sh.state==='repo'){el.hidden=true;continue;}
    else{const c=sh.port,i=stackN[c]=(stackN[c]||0)+1,st=PORT_STACK[c],[px,py]=PORT_XY(c);
      x=px;y=py;ox=st[0]+st[2]*(i-1);oy=st[1]+st[3]*(i-1);ang=st[2]<0?180:st[2]>0?0:90;}
    el.hidden=false;
    el.style.left=(x/W*100)+'%';el.style.top=(y/H*100)+'%';
    el.style.transform=(ox||oy)?`translate(${ox}px,${oy}px)`:'';
    el.querySelector('.hull').style.transform=`rotate(${ang}deg)`;
    const sel=S.selShip===sh.id;
    el.className='shipm'+(sel?' sel':'')+(sh.state==='sea'&&(sh.stopLeft>0||sh.limp||sh.towed)?' broken':'')+(sh.state==='yard'?' yard':'')+(sh.state==='laid'?' laid':'');
    const tag=el.querySelector('.tag');const txt=sel||VIEW.z>=1.8?'SS '+sh.name:'';if(tag.textContent!==txt)tag.textContent=txt;
  }
  for(const id of Object.keys(MARKS))if(!seen.has(+id)){MARKS[id].remove();delete MARKS[id];}
  drawRivals();
}
const RMARKS={};
function drawRivals(){
  const O=document.getElementById('shipsO'),seen=new Set();
  for(const x of S.rships||[]){
    seen.add(x.id);let el=RMARKS[x.id];
    if(!el){el=document.createElement('div');el.className='shipm rival';el.innerHTML='<div class="hull"></div>';O.prepend(el);RMARKS[x.id]=el;}
    const out=x.phase<0.5,f=out?x.phase*2:(1-x.phase)*2,p=out?pointAt(x.route,f,false):pointAt(x.route,1-f,true);
    el.style.left=(p.x/W*100)+'%';el.style.top=(p.y/H*100)+'%';
    const h=el.firstChild;h.style.transform=`rotate(${p.ang}deg)`;h.style.background=RIVAL_P[x.owner].col;
    const t=`SS ${x.name}, ${RIVALS[x.owner].name}`;if(el.title!==t)el.title=t;
  }
  for(const id of Object.keys(RMARKS))if(!seen.has(id)){RMARKS[id].remove();delete RMARKS[id];}
}
