/* ================= WIRELESS =================
   Ships report by wireless telegraphy through coast stations; ships without a set are reported by passing
   steamers through Lloyd's, a day or more late. Sailings and arrivals come by cable from the Line's agents. */
const STATION={GLA:'Malin Head',MOV:'Malin Head',LIV:'Valentia',QUE:'Valentia',AVO:'Portishead',SOU:'Niton',CHE:'Niton',HAM:'Norddeich',
  NYC:'Siasconset',HAL:'Cape Race',SJN:'Cape Race',QBC:'Father Point',MTL:'Father Point',GEN:'Coltano',NAP:'Coltano',GIB:'Gibraltar',LIS:'Gibraltar',
  NOL:'New Orleans',GAL:'New Orleans',KIN:'Kingston',FRE:'Freetown',LAG:'Freetown',RIO:'Rio de Janeiro',MVD:'Rio de Janeiro',BUE:'Rio de Janeiro'};
/* chart position back to latitude and longitude (the chart is Mercator, 100°W to 40°E, 72°N at the top) */
function latLon(x,y){const rad=Math.PI/180,s=CHART.W/(140*rad),ty=s*Math.log(Math.tan(Math.PI/4+72*rad/2));
  return {lon:-100+x/CHART.W*140,lat:(2*Math.atan(Math.exp((ty-y)/s))-Math.PI/2)/rad};}
function shipXY(sh){
  if(sh.state==='sea'){const g=GEO(sh.geo);return pointOn(CHART.routes[sh.geo],sh.dir===0?sh.pos:g.dist-sh.pos);}
  if(sh.state==='repo'){const T=trackBetween(sh.port,sh.repoTo);return pointOn(T,(1-sh.repoLeft/Math.max(1e-6,sh.repoTotal))*T.dist);}
  const [x,y]=CHART.ports[sh.port];return {x,y};
}
function posText(sh){const p=shipXY(sh),q=latLon(p.x,p.y);
  return `${Math.round(Math.abs(q.lat))}${q.lat>=0?'N':'S'} ${Math.round(Math.abs(q.lon))}${q.lon<0?'W':'E'}`;}
function stationFor(sh){
  if(sh.state!=='sea')return STATION[sh.port]||'Portishead';
  const g=GEO(sh.geo),at=sh.dir===0?sh.pos:g.dist-sh.pos;let best=g.calls[0],bd=1e9;
  for(const c of g.calls){const d=Math.abs(c[1]-at);if(d<bd){bd=d;best=c;}}
  if(bd>1000){const p=shipXY(sh),q=latLon(p.x,p.y);if(q.lat>30)return q.lon<-38?'Cape Race':'Valentia';}
  return STATION[best[0]]||'Portishead';
}
/* send a message. kind: '' incident or report, 'bad', 'good', 'r' routine traffic. via: override the sender line */
function wire(sh,txt,kind,opt){
  opt=opt||{};S.wire=S.wire||[];
  const radio=sh.up&&sh.up.wireless;
  const m={id:S.wireNext=(S.wireNext||0)+1,t:S.t,ship:sh.name,sid:sh.id,txt:telegram(txt),k:kind||''};
  if(opt.via)m.via=opt.via;
  else if(radio||sh.state!=='sea')m.via=radio&&sh.state==='sea'?stationFor(sh)+' Radio':'Cable, '+PN[sh.port]+' agents';
  else{(sh.held=sh.held||[]).push(m);return m;} // no set aboard: the news waits for port or a passing ship
  deliverWire(m,opt.pause);return m;
}
function deliverWire(m,pause){
  m.t=Math.max(m.t,Math.floor(S.t*24)/24);S.wire.unshift(m);if(S.wire.length>60)S.wire.length=60;
  m.read=m.k==='r'; // agents' cables arrive in plain words; signals from sea wait to be decoded
  if(typeof UI!=='undefined'){if(!m.read)UI.wa={id:m.id,txt:m.txt,mode:'print',made:typeof performance!=='undefined'?performance.now():0};
    if(pause)eventClock(`SS ${m.ship}: ${plainTel(m.txt)}`);}
}
function wireTick(){if(!S.wireQ||!S.wireQ.length)return;const due=S.wireQ.filter(m=>m.at<=S.t);if(!due.length)return;
  S.wireQ=S.wireQ.filter(m=>m.at>S.t);due.forEach(m=>{delete m.at;deliverWire(m);});}
/* telegraphese: capitals, full stops become STOP, no other punctuation */
const telegram=t=>t.toUpperCase().replace(/\?\s*/g,' QUERY ').replace(/\.\s*/g,' STOP ').replace(/[,;:]/g,'').replace(/\s+/g,' ').replace(/ STOP\s*$/,'').trim();
const plainTel=t=>t.replace(/ QUERY ?/g,'? ').replace(/ STOP ?/g,'. ').toLowerCase().replace(/(^|\. )([a-z])/g,(a,b,c)=>b+c.toUpperCase()).replace(/\bss\b/gi,'SS');
const MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',
  S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',
  "'":'.----.','-':'-....-','/':'-..-.','(':'-.--.',')':'-.--.-','£':'.-..'};
const morseOf=t=>t.split('').map(c=>c===' '?'/':(MORSE[c]||'').replace(/\./g,'·').replace(/-/g,'−')).join(' ');
