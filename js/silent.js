/* ================= SILENT SHIPS =================
   A ship without wireless is only known by her sailing time and her master's reckoning. The chart shows where she
   ought to be. If she is in trouble, only a ship close enough to see her lamps and flares can pass the word on.
   What really happens to her is learned when she arrives, when someone reports her, or when she is posted missing. */
const radioOf=sh=>!!(sh.up&&sh.up.wireless);
const isSilent=sh=>(sh.state==='sea'||sh.state==='lost')&&!radioOf(sh);
/* nautical miles per chart pixel at a chart position (Mercator) */
function nmBetween(a,b){const q=latLon((a.x+b.x)/2,(a.y+b.y)/2);return Math.hypot(a.x-b.x,a.y-b.y)*6*Math.cos(q.lat*Math.PI/180);}
function plannedSpeed(sh){return knotsOf(sh)*SPD[sh.speed]*shipMods(sh).speed*24;}
/* where the office thinks a silent ship is: from her last report, at her planned speed */
function estimateOf(sh){
  const g=GEO(sh.geo),base=sh.seen||{t:sh.sailedAt||S.t,pos:0,stopped:false},v=base.v||plannedSpeed(sh);
  // a ship last seen stopped is assumed under way again after three days
  let pos=base.stopped?base.pos+Math.max(0,S.t-base.t-3)*v:base.pos+Math.max(0,S.t-base.t)*v;
  if(!base.stopped)for(const st of stopsFor(sh.geo,sh.dir))if(st[1]>base.pos&&st[1]<pos)pos-=CALL_DAYS*v;
  const over=pos>g.dist?(pos-g.dist)/v:0;
  return {pos:Math.min(pos,g.dist),over,due:over>0?0:(g.dist-pos)/v,stopped:base.stopped,seen:sh.seen||null};
}
function estXY(sh){const g=GEO(sh.geo),e=estimateOf(sh);return pointOn(CHART.routes[sh.geo],sh.dir===0?e.pos:g.dist-e.pos,sh.dir===1);}
/* the ships near a position that could see her: rivals on the lanes and your own ships at sea */
function shipsNear(p,range,except){
  const out=[];
  for(const x of S.rships||[]){const q=rivalPos(x);if(!q)continue;const d=nmBetween(p,q);if(d<=range)out.push({name:x.name,line:RIVALS[x.owner].name,radio:jr(x.id+'w')<0.85,d});}
  for(const x of S.ships){if(x===except||(x.state!=='sea'&&x.state!=='repo'))continue;const q=shipXY(x),d=nmBetween(p,q);if(d<=range)out.push({name:x.name,line:'your own',radio:radioOf(x),d,own:true});}
  return out.sort((a,b)=>a.d-b.d);
}
/* each step, a silent ship in trouble may be seen by a passing ship */
function spotCheck(sh,step){
  const B=sh.brk;if(!B||B.found||radioOf(sh))return;
  const p=shipXY(sh),near=shipsNear(p,40,sh);
  const chance=near.length?0.8*step:(B.drift?0.1*step:0); // otherwise fishing boats, coasters and ships off the usual track
  if(Math.random()>=chance)return;
  const f=near[0],who=f?`SS ${f.name} (${f.line==='your own'?'your own ship':f.line})`:'a fishing schooner';
  B.found=true;sh.seen={t:S.t,pos:sh.pos,stopped:true};
  const via=f&&f.radio?`Relayed by ${who.replace(/^SS /,'SS ')}`:`Reported by ${who} on reaching port`;
  const delay=f&&f.radio?0:1+Math.random()*2;
  relay(sh,`${who} reports SS ${sh.name} ${B.o==='fail'?'disabled and drifting':'stopped'} ${posText(sh)}. Saw her distress lamps${B.drift?' and flares':''}. Standing by.`,via,delay,'bad');
  if(B.drift){B.drift=false;const d=(f&&f.radio?1.5:3)+Math.random()*1.5;sh.stopLeft=d;B.wait=d;
    relay(sh,`Salvage tug dispatched to SS ${sh.name}. Alongside in about ${Math.round(d)} days.`,via,delay);}
}
/* messages from a silent ship wait aboard until she arrives or someone passes them on */
function relay(sh,txt,via,delay,kind){
  for(const m of sh.held||[]){m.via=via+', master\'s report';if(delay){m.at=S.t+delay;(S.wireQ=S.wireQ||[]).push(m);}else deliverWire(m);}
  sh.held=[];
  const m={id:S.wireNext=(S.wireNext||0)+1,t:S.t,ship:sh.name,sid:sh.id,txt:telegram(txt),k:kind||'',via};
  if(delay){m.at=S.t+delay;(S.wireQ=S.wireQ||[]).push(m);}else deliverWire(m);
}
function deliverHeld(sh,via){for(const m of sh.held||[]){m.via=via;m.t=S.t;deliverWire(m);}sh.held=[];}
/* a drifting or burning ship may founder. Subdivision, condition and the season decide how likely */
function sinkRisk(sh){const w=[0,1,2,10,11].includes(mOf(S.t)%12)?2.5:1;return 0.002*w*(sh.safety||1)*(sh.cond<40?1.6:1);}
function founder(sh){
  const p=shipXY(sh),where=posText(sh),radio=radioOf(sh),near=shipsNear(p,radio?180:25,sh);
  const saved=near.length?(radio?0.97:0.9):(radio?0.55:0.15),souls=sh.load?CL.reduce((a,c)=>a+(sh.load.pax[c]?sh.load.pax[c].n:0),0):0;
  const crew=Math.round(sh.grt/45)+40,lost=Math.round((souls+crew)*(1-saved));
  sh.lost={t:S.t,where,saved,lost,rescuer:near[0]||null};
  if(radio){
    wire(sh,`SOS SOS SOS. SS ${sh.name} ${where}. Taking water fast. Abandoning ship.`,'bad');
    const r=near[0];
    relay(sh,r?`SS ${r.name} (${r.line}) reached the position at dawn and picked up ${int(souls+crew-lost)} survivors from the boats.${lost?` ${lost} are missing.`:' All saved.'}`:`Boats from SS ${sh.name} picked up after two days by a passing steamer. ${lost} are missing.`,`${STATION[destOf(sh)]||'Portishead'} Radio`,0,'bad');
    loseShip(sh);
  } else {sh.state='lost';sh.stopLeft=0;}
}
/* the mortgagees are paid first out of the insurance: her share of the line's debt */
function payMortgage(sh,v){if(!(S.debt>0))return;const fv=S.ships.reduce((a,x)=>a+shipValue(x),0)||1,p=Math.min(S.debt,v,S.debt*shipValue(sh)/fv);S.debt-=p;S.cash-=p;
  if(p>100)news(`${fmt(Math.round(p))} of the insurance goes straight to the mortgagees.`);}
/* the underwriters pay the insured value; the loss of life is never forgotten */
function loseShip(sh){
  const L=sh.lost||{lost:0,saved:1},v=Math.round(shipValue(sh));
  S.cash+=v;S.rep=clamp(S.rep-(L.lost>200?18:L.lost>20?10:4),0,100);payMortgage(sh,v);
  news(`SS ${sh.name} is lost${L.where?' '+L.where:''}. ${L.lost?`${int(L.lost)} lives lost.`:'Everyone aboard was saved.'} The underwriters pay ${fmt(v)}.`,'bad',true);
  S.ships=S.ships.filter(x=>x!==sh);if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;
}
/* daily: overdue ships, drifting ships, posted missing */
function silentDaily(){
  for(const sh of S.ships.slice()){
    if(sh.brk&&sh.brk.o==='fail'&&!sh.towed&&!sh.em&&sh.state==='sea'&&Math.random()<sinkRisk(sh)*3)startEmergency(sh,'seam');
    if(!isSilent(sh))continue;
    const e=estimateOf(sh),to=PN[destOf(sh)];
    if(e.over>=1&&!sh.overdue){sh.overdue=1;news(`SS ${sh.name} is overdue at ${to}. There has been no word of her since she sailed.`,'bad',true);}
    if(e.over>=7&&sh.overdue===1){sh.overdue=2;news(`Grave anxiety for SS ${sh.name}, now a week overdue at ${to}. Ships on her track are asked to keep a lookout.`,'bad',true);}
    if(sh.state==='lost'&&e.over>=14){
      news(`SS ${sh.name} is posted missing at Lloyd's. The bell is rung once. Nothing is known of her fate.`,'bad',true);loseShip(sh);}
  }
}
