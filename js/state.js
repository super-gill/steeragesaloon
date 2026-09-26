/* ================= STATE ================= */
const KEY='steerage-saloon-v2';
let S=null;
const UI={speed:0,tab:'overview',confirm:null,banner:'Paused. Press 1× to start the clock.',autoPause:true,view:'ext',dirty:true};
function newGame(){
  S={v:2,t:0,m:0,cash:18000,debt:40000,rep:30,conf:false,ships:[],lines:{},wars:{},mail:{},offer:null,market:[],news:[],hist:[18000],
     mtd:blankLedger(),lastMonth:null,nextId:1,over:false,selShip:1,selLine:'hal',odWarn:false,tension:{},pax:{},lastPax:{},rivalIdx:{},dismiss:{}};
  S.lines.hal={fares:defaultFares('hal'),service:1,adv:1,last:[null,null]};
  const mv=makeShip(TEMPL[0],64,'GLA');mv.line='hal';mv.state='port';mv.portLeft=2;S.ships.push(mv);
  initRivals();refreshMarket();news(HIST[0].t,'hist');
  UI.speed=0;UI.banner='Paused. Press 1× to start the clock.';UI.confirm=null;
  save();UI.dirty=true;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const t=localStorage.getItem(KEY);if(t){const s=JSON.parse(t);if(s&&s.v===2)return migrate(s);}}catch(e){}return null;}
function migrate(s){
  s.tension=s.tension||{};s.dismiss=s.dismiss||{};s.pax=s.pax||{};s.lastPax=s.lastPax||{};s.rivalIdx=s.rivalIdx||{};
  if(s.sel){if(s.sel.k==='ship')s.selShip=s.sel.id;else s.selLine=s.sel.id;delete s.sel;}
  if(!s.selShip&&s.ships[0])s.selShip=s.ships[0].id;if(!s.selLine)s.selLine=Object.keys(s.lines)[0]||'hal';
  s.ships.concat(s.market||[]).forEach(sh=>{if(sh.autoDock===undefined)sh.autoDock=50;});
  if(!s.rships){const prev=S;S=s;initRivals();S=prev;}
  return s;
}
