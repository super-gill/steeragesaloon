/* ================= STATE ================= */
const KEY='steerage-saloon-v3',OLD_KEYS=['steerage-saloon-v2']; // v3: the calendar counts from 1900 (0.19.0); older saves are retired
let S=null;
const UI={speed:0,tab:'overview',confirm:null,banner:'Paused. Press 1× to start the clock.',eventMode:(()=>{try{return localStorage.getItem('ss_eventmode')||'slow';}catch(e){return 'slow';}})(),view:'ext',dirty:true};
function newGame(){
  const m0=START,t0=tOfM(m0,1),pi=piAt(m0);
  S={v:3,t:t0,m:m0,t0,m0,cash:Math.round(18000*pi/500)*500,debt:Math.round(40000*pi/1000)*1000,rep:30,conf:false,ships:[],lines:{},wars:{},mail:{},offer:null,market:[],news:[],hist:[18000],
     mtd:blankLedger(),lastMonth:null,nextId:1,over:false,selShip:1,selLine:'hal',odWarn:false,tension:{},pax:{},lastPax:{},rivalIdx:{},dismiss:{},
     shore:{piers:{},agents:{},hostels:{},yards:{},bunker:null,fagents:{},sheds:{},cold:{},sell:{},earn:{},est:{}},miles:{},capPool:[],capNext:1,depts:{},tut:{},tutSeen:{},orders:[],bslips:{},yardNext:534,wire:[],wireQ:[],wireNext:0,ghosts:[]};
  S.lines.hal={fares:defaultFares('hal'),service:1,adv:1,last:[null,null]};
  S.pi=pi;S.fareIdx=pi;applyPrices();S.lines.hal.fares=defaultFares('hal'); // the tables at the day's prices before anything is priced
  const mv=makeShip(START_SHIP,58,'GLA');mv.line='hal';mv.state='port';mv.portLeft=2;S.ships.push(mv);
  initRivals();refreshMarket();S.capPool=[0,1,2,3].map(()=>makeCaptain());news(histNow().find(h=>h.m===m0).t,'hist');
  UI.speed=0;UI.banner='Paused. Press 1× to start the clock.';UI.confirm=null;
  save();UI.dirty=true;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const t=localStorage.getItem(KEY);if(t){const s=JSON.parse(t);if(s&&s.v===3)return migrate(s);}}catch(e){}return null;}
/* a save from before 0.19 is from another calendar: it cannot be carried over, so the owner is told once */
function oldSaveNote(){try{if(OLD_KEYS.some(k=>localStorage.getItem(k))&&!localStorage.getItem(KEY)&&!localStorage.getItem('ss_oldnote')){localStorage.setItem('ss_oldnote','1');return true;}}catch(e){}return false;}
function migrate(s){
  (s.emerg||[]).forEach(e=>{e.rateM=e.rateM||1;e.capA=e.capA||0;e.saveA=e.saveA||0;e.later=e.later||[];e.orders=e.orders||[];e.sev=e.sev||2;if(e.k==='illness'&&!e.dis)e.dis='flu';});
  s.tension=s.tension||{};s.dismiss=s.dismiss||{};s.pax=s.pax||{};s.lastPax=s.lastPax||{};s.rivalIdx=s.rivalIdx||{};
  if(s.sel){if(s.sel.k==='ship')s.selShip=s.sel.id;else s.selLine=s.sel.id;delete s.sel;}
  if(!s.selShip&&s.ships[0])s.selShip=s.ships[0].id;if(!s.selLine)s.selLine=Object.keys(s.lines)[0]||'hal';
  s.ships.concat(s.market||[]).forEach(sh=>{if(sh.autoDock===undefined)sh.autoDock=50;});
  const prev=S;S=s;
  s.pi=s.pi||1;s.gilts=s.gilts||0;
  if(!s.rships)initRivals();
  // 0.4: shore establishment, milestones, captains and crew, upgrades, multi-stop voyages, new routes and rival lines
  s.shore=s.shore||{piers:{},agents:{},hostels:{},yards:{},bunker:null};s.miles=s.miles||{};s.depts=s.depts||{};s.wire=s.wire||[];s.orders=s.orders||[];s.bslips=s.bslips||{};s.yardNext=s.yardNext||534;s.wireQ=s.wireQ||[];s.ghosts=s.ghosts||[];
  // 0.4.1: breakdowns resolve themselves; an old save waiting for orders repairs at sea
  s.ships.forEach(sh=>{if(sh.incident){sh.incident=null;sh.brk={o:'long',tell:s.t,told:false,wait:4};sh.stopLeft=4;}});s.capNext=s.capNext||1;
  s.ships.concat(s.market||[]).forEach(sh=>{
    if(!sh.up)sh.up={reefer:false,wireless:sh.built>=1905};
    if(sh.fit===undefined)sh.fit=Math.round(clamp(95-(yearNow()-sh.built)*3.5,30,95));
    if(!sh.captain)sh.captain=makeCaptain();if(sh.pay===undefined)sh.pay=1;if(sh.morale===undefined)sh.morale=60;
    if(sh.state==='sea'&&!sh.geo){sh.geo=sh.legRoute;sh.pos=Math.min(sh.pos,GEO(sh.geo).dist-1);sh.stops=stopsFor(sh.geo,sh.dir).filter(x=>x[1]>sh.pos);sh.nextCall=0;sh.callLeft=0;}
  });
  if(!s.capPool||!s.capPool.length)s.capPool=[0,1,2,3].map(()=>makeCaptain());
  applyPrices(); // the tables at the save's own prices, before the rival companies are set up against them
  ensureRivals();
  if(s.over==='end')s.over=false;
  S=prev;
  return s;
}

/* ---------- save codes: the whole game as compressed base64url text ---------- */
const CODE_TAG='SS1.';
const b64u=b=>{let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=t=>{t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;};
async function pipeBytes(bytes,stream){const r=new Response(new Blob([bytes]).stream().pipeThrough(stream));return new Uint8Array(await r.arrayBuffer());}
async function makeSaveCode(){
  const snap=JSON.parse(JSON.stringify(S));snap.news=snap.news.slice(0,30);snap.wire=(snap.wire||[]).slice(0,20);snap.ver=GAME_VERSION;
  const raw=new TextEncoder().encode(JSON.stringify(snap));
  if(typeof CompressionStream==='undefined')return CODE_TAG+'j'+b64u(raw);
  return CODE_TAG+'z'+b64u(await pipeBytes(raw,new CompressionStream('deflate-raw')));
}
async function readSaveCode(code){
  code=(code||'').trim().replace(/^.*#save=/,'').replace(/\s+/g,'');
  if(!code.startsWith(CODE_TAG))throw new Error('That does not look like a Steerage & Saloon save code.');
  const kind=code[CODE_TAG.length],body=unb64u(code.slice(CODE_TAG.length+1));
  const bytes=kind==='z'?await pipeBytes(body,new DecompressionStream('deflate-raw')):body;
  const s=JSON.parse(new TextDecoder().decode(bytes));
  if(!s||s.v!==3||!Array.isArray(s.ships))throw new Error('The code is damaged or from an incompatible version.');
  return migrate(s);
}
async function loadSaveCode(code){
  const s=await readSaveCode(code);S=s;applyPrices();save();UI.speed=0;UI.banner='Save loaded. Paused.';UI.confirm=null;UI.saveCode=null;UI.dirty=true;
  if(typeof VIEW!=='undefined')VIEW.s=null;
  return s;
}
