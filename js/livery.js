/* ================= LIVERIES AND SHIP VARIETY =================
   Every line has a livery: funnel colour with up to two bands and a black top or not, hull, boot-topping (the band at the
   waterline), upperworks, and a house flag. The player chooses the Line's at a new game and may change it; a ship wears
   the colours she was last painted in (sh.paint) until she is repainted in the yard. Each rival has a fixed livery.
   Every ship is drawn from her own seed and her design, so no two look alike unless they were built as sisters. */
const LIV_DEFAULT={name:'Buff, blue band, black top',funnel:'#C79A4E',band1:'#1B4757',band2:null,top:true,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#1B4757',fg:'#E9D9B6',em:'cross'}};
const LIV_PRESETS=[
  LIV_DEFAULT,
  {name:'Red, two black bands, black top',funnel:'#C8412B',band1:'#15181A',band2:'#15181A',top:true,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#C8412B',fg:'#E9C54A',em:'saltire'}},
  {name:'Buff, black top',funnel:'#C9A15A',band1:null,band2:null,top:true,hull:'#15181A',boot:'#9C2F22',upper:'#F2EFE6',flag:{bg:'#B53A2E',fg:'#F7F4EC',em:'star'}},
  {name:'All black',funnel:'#1A1D1F',band1:null,band2:null,top:false,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#F7F4EC',fg:'#1A1D1F',em:'diamond'}},
  {name:'Red, white band, black top',funnel:'#B8352B',band1:'#F3F1EA',band2:null,top:true,hull:'#1C2226',boot:'#5A6A48',upper:'#EFECE4',flag:{bg:'#F3F1EA',fg:'#B8352B',em:'ball'}},
  {name:'Yellow, black top',funnel:'#D9A93A',band1:null,band2:null,top:true,hull:'#20262A',boot:'#9C2F22',upper:'#ECE7D8',flag:{bg:'#1F3B6B',fg:'#D9A93A',em:'cross'}},
  {name:'Blue, white band, black top',funnel:'#2C4F7C',band1:'#F3F1EA',band2:null,top:true,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#2C4F7C',fg:'#F3F1EA',em:'star'}},
  {name:'Red, lavender hull',funnel:'#B8352B',band1:null,band2:null,top:true,hull:'#8C8AA8',boot:'#9C2F22',upper:'#F2EFE6',flag:{bg:'#B8352B',fg:'#F3F1EA',em:'cross'}},
  {name:'Black, red and white bands',funnel:'#1A1D1F',band1:'#B8352B',band2:'#F3F1EA',top:false,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#B8352B',fg:'#F3F1EA',em:'band'}},
  {name:'Green, black top, grey hull',funnel:'#3E6B4A',band1:null,band2:null,top:true,hull:'#5D666B',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#3E6B4A',fg:'#F3F1EA',em:'diamond'}},
  {name:'White, blue band, white hull',funnel:'#F1EFE8',band1:'#2C4F7C',band2:null,top:true,hull:'#F3F1EA',boot:'#2C6A56',upper:'#F6F4EE',flag:{bg:'#2C4F7C',fg:'#F1EFE8',em:'ball'}},
  {name:'Buff, red band, black top',funnel:'#C9A15A',band1:'#A8322A',band2:null,top:true,hull:'#1C2226',boot:'#9C2F22',upper:'#EFECE4',flag:{bg:'#F3F1EA',fg:'#A8322A',em:'cross'}}
];
const LIV_EMBLEMS={plain:'Plain',cross:'Cross',star:'Star',diamond:'Diamond',ball:'Ball',band:'Band',saltire:'Saltire'};
/* the rivals' colours, fixed; a line founded later takes colours built from its own */
const RIVAL_LIV={
  imperial:{funnel:'#B8432F',top:true,hull:'#15181A',flag:{bg:'#B8432F',fg:'#F3F1EA',em:'star'}},
  nordmark:{funnel:'#D2A24C',top:false,band1:'#15181A',hull:'#15181A',flag:{bg:'#F3F1EA',fg:'#2A2E33',em:'diamond'}},
  columbia:{funnel:'#15181A',band1:'#F3F1EA',band2:'#2E4E7A',top:false,hull:'#1C2226',flag:{bg:'#2E4E7A',fg:'#F3F1EA',em:'star'}},
  dominion:{funnel:'#B8352B',band1:'#F3F1EA',top:true,hull:'#1C2226',flag:{bg:'#B8352B',fg:'#F3F1EA',em:'band'}},
  partenope:{funnel:'#F1EFE8',band1:'#2E6A4A',band2:'#B8352B',top:true,hull:'#2A2E30',flag:{bg:'#2E6A4A',fg:'#F1EFE8',em:'cross'}},
  aurore:{funnel:'#C8412B',top:true,hull:'#15181A',boot:'#B8352B',flag:{bg:'#3B4F8F',fg:'#F3F1EA',em:'ball'}},
  antilles:{funnel:'#E1B43A',top:true,hull:'#F3F1EA',boot:'#2C6A56',flag:{bg:'#E1B43A',fg:'#2A2E30',em:'diamond'}},
  guinea:{funnel:'#556B2F',band1:'#F1EFE8',top:true,hull:'#3A3F3A',flag:{bg:'#556B2F',fg:'#F1EFE8',em:'plain'}},
  pampas:{funnel:'#8B3A62',band1:'#F3F1EA',top:true,hull:'#1C2226',flag:{bg:'#8B3A62',fg:'#F3F1EA',em:'star'}},
  meridian:{funnel:'#5C7C8A',band1:'#F3F1EA',top:false,hull:'#F3F1EA',boot:'#2C4F7C',flag:{bg:'#5C7C8A',fg:'#F3F1EA',em:'ball'}},
  gulf:{funnel:'#15181A',band1:'#C0602A',top:false,hull:'#3A3A36',flag:{bg:'#C0602A',fg:'#15181A',em:'plain'}}
};
const livFill=l=>({...LIV_DEFAULT,band1:null,band2:null,...l,flag:{...LIV_DEFAULT.flag,...(l.flag||{})}});
function rivalLiv(o){
  if(RIVAL_LIV[o])return livFill(RIVAL_LIV[o]);
  const P=RIVAL_P[o]||{col:'#555'},r=jr(o+'liv');
  return livFill({funnel:P.col,top:r<0.6,band1:r>0.3&&r<0.8?'#F3F1EA':null,hull:r>0.85?'#5D666B':'#1C2226',flag:{bg:P.col,fg:'#F3F1EA',em:['plain','cross','star','diamond','ball','band'][Math.floor(r*6)]}});
}
/* the Line's colours, and a ship's own: she keeps what she was last painted in */
const lineLiv=()=>livFill(S.livery||LIV_DEFAULT);
const paintOf=sh=>sh.owner?rivalLiv(sh.owner):livFill(sh.paint||S.livery||LIV_DEFAULT);
const livKey=l=>{const q=livFill(l);return [q.funnel,q.band1,q.band2,q.top,q.hull,q.boot,q.upper].join('|');};
const paintDiff=sh=>(!!sh.dazzle&&!atWar())||livKey(paintOf(sh))!==livKey(lineLiv());
/* a ship on the brokers' list comes in her old owners' colours */
/* seeded from the ship herself, so the game's dice are not disturbed */
function oldOwnerPaint(sh){
  const Rn=seed(strHash((sh?sh.name+sh.built:'')+'|'+S.m)),R=Rn(),ks=Object.keys(RIVAL_LIV);
  if(R<0.5){const l=rivalLiv(ks[Math.floor(Rn()*ks.length)]);return {...l,name:'her old owners\' colours'};}
  const c=['#15181A','#8A5A1E','#4A4F55','#6D3B2E','#2F5E7A','#7A6A3A'][Math.floor(Rn()*6)];
  return livFill({name:'her old owners\' colours',funnel:c,band1:Rn()<0.5?'#F3F1EA':null,top:c!=='#15181A'&&Rn()<0.6,hull:Rn()<0.8?'#1C2226':'#5D666B',flag:{bg:c,fg:'#F3F1EA',em:'plain'}});
}
/* the Line takes new colours: ships keep their old ones until they are repainted */
function setLivery(l){
  for(const sh of S.ships)if(!sh.paint)sh.paint=livFill(S.livery||LIV_DEFAULT);
  S.livery=livFill(l);
}
/* when a ship goes into dry dock she can be repainted there at the same visit (charged as extra work) */
const repaintAtDock=sh=>S.repaintDock!==false&&paintDiff(sh);

/* ---------- variety ---------- */
const strHash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
/* the key that makes sisters alike: her design if she was built to one, else her own particulars */
function varKey(sh){
  const D=sh.design;
  if(D&&D.form)return JSON.stringify([sh.grt,D.form,D.funnels,D.purpose,D.mach,D.quality,D.builder,D.layout]);
  return (sh.name||'')+'|'+sh.built+'|'+sh.grt;
}
function varOf(sh){
  const k=varKey(sh);if(sh._vk===k&&sh._v)return sh._v;
  const R=seed(strHash(k)),y=sh.built||1900,old=y<1893;
  const v={fh:0.86+R()*0.28,fw:0.9+R()*0.2,rake:old?2+R()*4:4+R()*7,s0:0.21+R()*0.07,s1:0.73+R()*0.07,sheer:R()*6,
    masts:old?(R()<0.5?3:4):y<1905?(R()<0.8?2:3):(R()<0.85?2:1),rows:sh.grt>=15000?(R()<0.6?3:2):sh.grt>=6000?2:(R()<0.5?1:2),
    win:6+Math.floor(R()*3),boatGap:18+Math.floor(R()*8),vents:2+Math.floor(R()*5),fc:9+R()*6,poop:5+R()*4,bridgeW:24+R()*10};
  try{Object.defineProperty(sh,'_v',{value:v,writable:true,configurable:true,enumerable:false});Object.defineProperty(sh,'_vk',{value:k,writable:true,configurable:true,enumerable:false});}catch(e){}
  return v;
}
/* how light a colour is, to pick legible lettering and portholes */
const lum=c=>{const h=(c||'#000').replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);return ((n>>16&255)*0.299+(n>>8&255)*0.587+(n&255)*0.114)/255;};

/* the house flag, flying from the mainmast */
function flagSVG(x,y,f,w=13,h=9){
  const o=`<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${f.bg};stroke:#2B2E30" stroke-width=".3"/>`;
  const cx=x+w/2,cy=y+h/2,fg=f.fg;
  const em={cross:`<rect x="${cx-0.9}" y="${y}" width="1.8" height="${h}" style="fill:${fg}"/><rect x="${x}" y="${cy-0.9}" width="${w}" height="1.8" style="fill:${fg}"/>`,
    star:`<polygon points="${[0,1,2,3,4,5,6,7,8,9].map(i=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?1.4:3.3;return (cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1);}).join(' ')}" style="fill:${fg}"/>`,
    diamond:`<polygon points="${cx},${y+1} ${x+w-2},${cy} ${cx},${y+h-1} ${x+2},${cy}" style="fill:${fg}"/>`,
    ball:`<circle cx="${cx}" cy="${cy}" r="2.6" style="fill:${fg}"/>`,
    band:`<rect x="${x}" y="${cy-1.5}" width="${w}" height="3" style="fill:${fg}"/>`,
    saltire:`<path d="M${x},${y} L${x+w},${y+h} M${x+w},${y} L${x},${y+h}" style="stroke:${fg}" stroke-width="1.8"/>`,plain:''}[f.em]||'';
  return o+em;
}

/* ---------- the colour chooser ---------- */
function livPickOpen(mode){UI.liv={mode,l:livFill(lineLiv())};UI.livPrev=UI.speed;UI.speed=0;UI.dirty=true;}
function livPickHTML(){
  const P=UI.liv,l=P.l,sh=S.ships[0]||{id:0,name:'Morven',grt:4600,built:1881,berths:{f:36,s:80,t:1050,tt:0},cargo:2200,up:{},state:'port',cond:90,fuel:'coal'};
  const demo={...sh,paint:l,state:'port',stopLeft:0,cond:95,id:'liv'};
  const sw=q=>`<svg viewBox="0 0 22 30" width="22" height="30" aria-hidden="true"><rect x="3" y="2" width="16" height="26" style="fill:${q.funnel};stroke:#2B2E30" stroke-width=".5"/>${q.band1?`<rect x="3" y="11" width="16" height="3" style="fill:${q.band1}"/>`:''}${q.band2?`<rect x="3" y="15" width="16" height="3" style="fill:${q.band2}"/>`:''}${q.top?'<rect x="3" y="2" width="16" height="6" style="fill:#15181A"/>':''}</svg>`;
  const presets=LIV_PRESETS.map((q,i)=>`<button class="livp" data-act="livpre" data-id="${i}" aria-pressed="${livKey(q)===livKey(l)}">${sw(livFill(q))}<span>${esc(q.name)}</span></button>`).join('');
  const col=(k,lab,v,opt)=>`<label class="livc"><span>${lab}</span>${opt?`<input type="checkbox" data-livon="${k}" ${v?'checked':''} aria-label="${lab} on">`:''}<input type="color" data-livc="${k}" value="${v||'#F3F1EA'}" ${opt&&!v?'disabled':''} aria-label="${lab}"></label>`;
  const change=P.mode==='change';
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="panel livpick">
    <h3 id="mt">${change?'The Line\'s colours':'Choose the Line\'s colours'}</h3>
    <p class="note" style="margin:0">${change?`New colours go on each ship when she is next in dry dock${S.repaintDock===false?' and you book her repaint':''}, or when you send her to be repainted. Until then she sails in the colours she has.`:'Funnel, hull and house flag: every ship you build or repaint wears them. You can change them later, but repainting takes a spell in dry dock.'}</p>
    <div class="livprev">${profileSVG(demo,'ext')}</div>
    <div class="livgrid">${presets}</div>
    <details class="livown"${P.own?' open':''}><summary data-act="livown">Make your own</summary>
      <div class="livcs">${col('funnel','Funnel',l.funnel)}${col('band1','First band',l.band1,true)}${col('band2','Second band',l.band2,true)}
      <label class="livc"><span>Black top</span><input type="checkbox" data-livon="top" ${l.top?'checked':''}></label>
      ${col('hull','Hull',l.hull)}${col('boot','Boot-topping',l.boot)}${col('upper','Upperworks',l.upper)}
      ${col('flag.bg','Flag',l.flag.bg)}${col('flag.fg','Flag emblem',l.flag.fg)}
      <label class="livc"><span>Emblem</span><select data-livem="1">${Object.keys(LIV_EMBLEMS).map(k=>`<option value="${k}" ${l.flag.em===k?'selected':''}>${LIV_EMBLEMS[k]}</option>`).join('')}</select></label></div></details>
    ${change?`<label class="check"><input type="checkbox" data-livdock="1" ${S.repaintDock!==false?'checked':''}> Repaint each ship at her next dry dock (charged with the visit)</label>`:''}
    <div class="btns"><button class="btn primary" data-act="livok">${change?'Adopt these colours':'Sail in these colours'}</button>${change?'<button class="btn" data-act="livcancel">Keep the old colours</button>':''}</div></div></div>`;
}
function livInput(el){
  const l=UI.liv&&UI.liv.l;if(!l)return;
  if(el.dataset.livc){const k=el.dataset.livc;if(k.startsWith('flag.'))l.flag[k.slice(5)]=el.value;else l[k]=el.value;}
  if(el.dataset.livon){const k=el.dataset.livon;if(k==='top')l.top=el.checked;else{l[k]=el.checked?(l[k]||'#F3F1EA'):null;}}
  if(el.dataset.livem)l.flag.em=el.value;
  if(el.dataset.livdock)S.repaintDock=el.checked;
  l.name='The Line\'s own colours';UI.liv.own=true;UI.dirty=true;
}
function livOk(){
  const P=UI.liv;if(!P)return;const was=S.livery?livKey(S.livery):null;setLivery(P.l);
  if(P.mode==='change'&&was!==livKey(S.livery))news(`The Line adopts new colours. ${S.repaintDock!==false?'Each ship takes them at her next dry dock.':'Each ship keeps her old colours until she is sent to be repainted.'}`);
  UI.liv=null;if(UI.livPrev>0&&!S.over)UI.speed=UI.livPrev;UI.dirty=true;save();
}
function livCancel(){UI.liv=null;if(UI.livPrev>0&&!S.over)UI.speed=UI.livPrev;UI.dirty=true;}

/* ---------- a rival's ship, from her marker ---------- */
function rivalCardHTML(){
  const id=UI.rcard;if(!id)return '';const x=(S.rships||[]).concat(S.ghosts||[]).find(y=>y.id===id);if(!x){UI.rcard=null;return '';}
  const P=RIVAL_P[x.owner]||{},berths=x.berths||{f:0,s:0,t:0,tt:0};
  const demo={id:'rv'+x.id,name:x.name,grt:x.grt,built:x.built||1900,knots:x.knots,berths:{f:berths.f||0,s:berths.s||0,t:berths.t||0,tt:berths.tt||0},cargo:x.cargo||0,
    up:{wireless:(x.built||1900)>=1911},state:'sea',stopLeft:0,cond:85,fuel:'coal',owner:x.owner,cruiser:P.kind==='cruise',design:null};
  const pax=(berths.f||0)+(berths.s||0)+(berths.t||0)+(berths.tt||0),rk=x.route&&ROUTES[x.route]?ROUTES[x.route].name:'between services';
  return `<div class="rcard"><div class="row"><div><span class="eyebrow">${esc(RIVALS[x.owner]?RIVALS[x.owner].name:'')}</span><h3>SS ${esc(x.name)}</h3></div><button class="btn quiet" data-act="rclose" aria-label="Close">×</button></div>
    ${profileSVG(demo,'ext')}
    <div class="meta">Built ${x.built||'?'} · ${int(x.grt)} grt · ${x.knots} knots · ${pax?int(pax)+' passengers':'cargo'}${x.cargo?' · '+int(x.cargo)+' t cargo':''} · ${esc(rk)}</div></div>`;
}
