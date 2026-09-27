/* ================= EMERGENCIES =================
   Anything a master would send a distress call for: collision, flooding, fire, illness, mutiny, piracy.
   Each emergency is a struggle between a threat (water, fire, sickness, unrest: 0 to 100) and the crew's control of it.
   Ships nearby answer the call and steam to help. While an emergency the office knows of is running, the clock slows to
   an hour a second, and a window follows it from the first signal to the end. */
const EMERG={
  ice:{name:'Struck ice',type:'water',rate:[5,14],sos:true,
    first:w=>`Struck iceberg ${w}. Holed forward. Water in number 1 and 2 holds. Pumps working.`},
  wreck:{name:'Struck wreckage',type:'water',rate:[3,8],sos:true,
    first:w=>`Struck submerged wreckage ${w}. Taking water in the forepeak. Pumps working. Stand by.`},
  collision:{name:'Collision',type:'water',rate:[4,10],sos:true,other:true,
    first:(w,o)=>`In collision with ${o} in fog ${w}. Holed abreast number 3 hold. Both ships stopped.`},
  seam:{name:'Taking water',type:'water',rate:[2,6],sos:true,
    first:w=>`Heavy seas have sprung plates aft ${w}. Water gaining in the shaft tunnel. Pumps working.`},
  fire:{name:'Fire',type:'fire',rate:[5,11],sos:true,
    first:w=>`Fire in the bunkers ${w}. Hoses on it. Passengers mustered on deck.`},
  illness:{name:'Outbreak of illness',type:'sick',rate:[1.2,3.2],sos:false,
    first:w=>`Several cases of fever among the third-class passengers. Surgeon isolating them. Request advice.`},
  mutiny:{name:'Mutiny',type:'unrest',rate:[3,8],sos:true,
    first:w=>`Firemen refuse duty over pay and food. Stokehold abandoned. Engines stopped ${w}. Officers armed.`},
  piracy:{name:'Piracy',type:'unrest',rate:[5,11],sos:true,
    first:w=>`Armed men among the passengers have tried to seize the bridge ${w}. Officers holding the wheelhouse. Require assistance.`}
};
const NAVY=['HMS Vigilant','HMS Resolute','HMS Curlew','USS Concord','USS Brandywine','the French cruiser Aventure'];
const EM_RATE=1/24; // an hour of game time per second while an emergency runs
const hhmm=t=>{const h=((t%1)+1)%1*24;return String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0');};
const soulsOf=sh=>(sh.load?CL.reduce((a,c)=>a+(sh.load.pax[c]?sh.load.pax[c].n:0),0):0);
const crewOf=sh=>Math.round(sh.grt/45)+40;
function activeEmergency(){return (S.emerg||[]).find(e=>!e.over&&e.known);}

/* at sailing: will something go badly wrong this voyage? */
function rollEmergency(sh,gk,dist,R){
  const m=mOf(S.t)%12,winter=[0,1,2,10,11].includes(m),north=GEO(gk).calls.some(c=>['HAL','SJN','NYC','QBC','MTL'].includes(c[0]));
  const mods=shipMods(sh),lenF=dist/3000,old=sh.cond<50?1.6:1;
  const W=[];
  if(north&&[2,3,4,5,6].includes(m))W.push(['ice',0.006*(sh.up&&sh.up.radar?0.4:1)]);
  W.push(['wreck',0.003],['collision',0.004*(sh.up&&sh.up.radar?0.4:1)*(winter?1.4:1)],['seam',0.004*old*(winter?1.8:1)*(sh.safety||1)]);
  W.push(['fire',0.003*old*(sh.fuel==='coal'?1.3:1)]);
  const steer=sh.load&&sh.load.pax.t?sh.load.pax.t.n:0;if(steer>100)W.push(['illness',0.006*Math.min(2,steer/600)]);
  if((sh.morale||60)<35)W.push(['mutiny',0.02*(35-sh.morale)/35*(has(sh,'martinet')?1.6:1)]);
  if(['ban','waf','cot','rpl'].includes(sh.legRoute))W.push(['piracy',0.0015]);
  for(const [k,p] of W)if(R()<p*0.5*lenF*mods.risk)return {k,at:dist*(0.1+R()*0.8)};
  return null;
}
function startEmergency(sh,k){
  const R=Math.random,D=EMERG[k],where=posText(sh),radio=radioOf(sh),p=shipXY(sh);
  const cap=clamp(66+(sh.captain?Math.min(20,sh.captain.exp*0.7):5)+(has(sh,'cautious')?5:0)-(has(sh,'drinker')?12:0)+((sh.morale||60)-60)/3+(sh.cond-60)/5,25,90);
  const e={id:(S.emNext=(S.emNext||0)+1),sid:sh.id,ship:sh.name,k,t0:S.t,threat:k==='illness'?4:10,peak:0,ctrl:0,cap,
    rate:D.rate[0]+R()*(D.rate[1]-D.rate[0]),resp:[],known:radio,over:null,where,lines:[],sick:0,dead:0,abandon:false};
  let oth=null;if(D.other){oth=shipsNear(p,400,sh).find(x=>!x.own);e.other=oth?`SS ${oth.name} (${oth.line})`:'an unknown steamer';
    if(oth)e.resp.push({name:oth.name,line:oth.line,radio:oth.radio,eta:S.t,arrived:true});}
  S.emerg=S.emerg||[];S.emerg.push(e);sh.em=e.id;
  if(D.type!=='sick'){sh.stopLeft=Math.max(sh.stopLeft||0,1e6);}
  emSay(e,sh,(D.sos&&radio?'SOS. ':radio?'':'')+`SS ${sh.name}. `+D.first(where,e.other),'bad');
  // who hears: by wireless within 250 miles, by rockets and lamps within 20
  const heard=shipsNear(p,radio&&D.sos?250:(D.sos?20:0),sh).filter(x=>!oth||x.name!==oth.name).slice(0,3);
  for(const n of heard){const kn=n.own?knotsOf(S.ships.find(x=>x.name===n.name)||{knots:16}):15+R()*4;
    e.resp.push({name:n.name,line:n.line,own:n.own,radio:n.radio,eta:S.t+n.d/kn/24,arrived:false});
    if(!radio&&n.radio)e.known=true;}
  if(D.type==='unrest'){const nv=NAVY[Math.floor(R()*NAVY.length)];e.resp.push({name:nv,line:'navy',navy:true,radio:true,eta:S.t+(0.8+R()*1.2),arrived:false});}
  if(e.known){emSay(e,null,e.resp.length?`Answering: ${e.resp.filter(r=>!r.arrived).map(r=>`${r.navy?r.name:'SS '+r.name}${r.navy?'':' ('+r.line+')'}, about ${Math.max(1,Math.round((r.eta-S.t)*24))} h away`).join('; ')}.`:'No ship has answered yet.',radio?'':'relay',stationFor(sh)+' Radio');
    if(typeof UI!=='undefined'){UI.emOpen=e.id;UI.emMin=false;UI.emNormal=false;}}
  return e;
}
/* a line in the emergency log, and in the wireless room */
function emSay(e,sh,txt,kind,via){
  const m={id:S.wireNext=(S.wireNext||0)+1,t:S.t,ship:e.ship,sid:e.sid,txt:telegram(txt),k:kind==='relay'?'bad':(kind||''),em:e.id};
  m.via=via||(sh&&radioOf(sh)?stationFor(sh)+' Radio':sh?'Rockets and lamp, seen by a passing ship':'Coast station');
  e.lines.unshift({t:S.t,txt:m.txt,via:m.via});if(e.lines.length>30)e.lines.length=30;
  if(e.known||(sh&&radioOf(sh)))deliverWire(m);
}
/* each step: the threat grows or is beaten back; help arrives; the master decides */
function emergencyStep(e,sh,step){
  if(e.over)return;
  const D=EMERG[e.k],h=step*24,R=Math.random;
  for(const r of e.resp)if(!r.arrived&&S.t>=r.eta){r.arrived=true;
    emSay(e,null,r.navy?`${r.name} alongside SS ${e.ship}. Boarding party sent across.`:`SS ${r.name} standing by SS ${e.ship}${D.type==='water'||D.type==='fire'?'. Boats lowered, pumps and hoses passed across':''}.`,'good',r.navy?'Naval wireless':`SS ${r.name}'s wireless`);
    if(r.own)S.rep=clamp(S.rep+1,0,100);}
  const help=e.resp.filter(r=>r.arrived).length;
  const cap=Math.min(100,e.cap+help*(D.type==='unrest'?35:D.type==='sick'?10:12));
  e.ctrl=Math.min(cap,e.ctrl+h*(D.type==='sick'?4:12));
  const beat=e.ctrl>55?(e.ctrl-55)/6:0;
  e.threat=clamp(e.threat+h*(e.rate*(1-e.ctrl/100)-beat),0,100);e.peak=Math.max(e.peak,e.threat);
  const w=Math.round(e.threat),mark=Math.floor(e.threat/25);
  if(mark>(e.mark||0)&&mark<4){e.mark=mark;
    emSay(e,sh,D.type==='water'?['','Water gaining. Pumps just holding. Passengers at boat stations.','Stokeholds flooding. Fires drawn in the forward boilers.','Down by the head. Boats swung out.'][mark]
      :D.type==='fire'?['','Fire spreading aft along the bunkers. Fighting it.','Fire through to the upper decks. Saloons lost.','Fire out of control amidships. Boats swung out.'][mark]
      :D.type==='sick'?`${Math.round(soulsOf(sh)*w/400)} passengers now ill. Surgeon exhausted. Hospital full.`
      :`Situation worsening. ${w>50?'Mutineers hold the engine room and the after deck.':'Stokers barricaded aft.'}`,'bad');}
  else if(e.threat<(e.mark||0)*25-15&&e.mark>0){e.mark--;emSay(e,sh,D.type==='sick'?'Fever abating. No new cases today.':'Gaining on it. Situation improving.','');}
  // the master orders the boats away when the ship cannot be saved
  if((D.type==='water'||D.type==='fire')&&e.threat>=80&&!e.abandon){e.abandon=S.t;emSay(e,sh,`Abandoning ship. Passengers in the boats. ${help?'Ships alongside taking them aboard.':'Stand by for us.'}`,'bad');}
  if(e.threat>=100)return emEnd(e,sh,'lost');
  if(e.threat<=0.5&&S.t-e.t0>2/24)return emEnd(e,sh,'saved');
  if(D.type==='sick'&&S.t-e.t0>8)return emEnd(e,sh,'saved');
}
function emEnd(e,sh,how){
  const D=EMERG[e.k],help=e.resp.filter(r=>r.arrived).length,souls=soulsOf(sh),crew=crewOf(sh),rk=sh.legRoute;
  e.over=how;e.t1=S.t;sh.em=null;
  if(how==='lost'&&(D.type==='water'||D.type==='fire')){
    const hrs=e.abandon?(S.t-e.abandon)*24:0,saved=clamp((help?0.75+0.08*help:0.35)+Math.min(0.2,hrs*0.05),0,0.995);
    const lost=Math.round((souls+crew)*(1-saved));e.dead=lost;
    emSay(e,sh,D.type==='water'?`SS ${e.ship} has foundered ${posText(sh)}.`:`SS ${e.ship} burnt out and abandoned ${posText(sh)}.`,'bad','Coast station');
    emSay(e,null,help?`${e.resp.filter(r=>r.arrived).map(r=>r.navy?r.name:'SS '+r.name).join(' and ')} picked up ${int(souls+crew-lost)} survivors.${lost?` ${lost} missing.`:' All saved.'}`
      :`${lost?`Boats picked up after a long night. ${lost} missing.`:'All the boats picked up. Everyone saved.'}`,lost?'bad':'good','Coast station');
    sh.lost={t:S.t,where:posText(sh),saved,lost};
    if(radioOf(sh)||e.known)loseShip(sh);else{sh.state='lost';sh.stopLeft=0;}
    return;}
  if(how==='lost'&&D.type==='unrest'){
    // the ship is taken until the navy arrives, then released; a costly delay
    e.over=null;e.threat=99;e.rate=0.5;if(!e.seized){e.seized=true;emSay(e,sh,e.k==='piracy'?'Bridge taken. Ship under the orders of armed men.':'Mutineers have taken the ship. Officers confined.','bad');}
    if(!e.resp.some(r=>r.navy))e.resp.push({name:NAVY[0],line:'navy',navy:true,radio:true,eta:S.t+1,arrived:false});
    if(e.resp.some(r=>r.navy&&r.arrived)){e.threat=0;return emEnd(e,sh,'saved');}
    sh.em=e.id;return;}
  // saved
  if(D.type==='water'||D.type==='fire'){const sev=e.peak/100;
    sh.brk=null;book('yard',-Math.round(sh.grt*(0.2+sev*0.8)),rk);sh.cond=clamp(sh.cond-sev*15,5,95);sh.pendingYard=sev>0.5?'repair':'engine';sh.limp=sev>0.3;sh.limpF=0.6;
    S.rep=clamp(S.rep-Math.round(sev*4),0,100);sh.stopLeft=0;
    emSay(e,sh,`${D.type==='water'?'Leak under control':'Fire out'}. Proceeding at reduced speed${help?', escorted':''}. Damage heavy. Will need the yard.`,'good');}
  if(D.type==='sick'){const dead=Math.round(souls*e.peak/100*0.06);e.dead=dead;S.rep=clamp(S.rep-(dead>10?5:2),0,100);
    emSay(e,sh,`Outbreak over. ${dead?dead+' deaths.':'No deaths.'} Expect quarantine on arrival.`,dead?'bad':'good');sh.quarantine=true;}
  if(D.type==='unrest'){sh.stopLeft=0;const c=Math.round(800+R01()*2000);book('crew',-c,rk);S.rep=clamp(S.rep-3,0,100);
    emSay(e,sh,e.k==='piracy'?`Order restored. Ringleaders in irons. ${e.seized?'Mail and valuables taken.':'Nothing lost.'} Proceeding.`:`Order restored. Ringleaders in irons for the courts. Proceeding with a scratch stokehold.`,'good');
    if(e.k==='mutiny')sh.morale=Math.max(sh.morale,45);}
  news(`SS ${e.ship}: ${EMERG[e.k].name.toLowerCase()} ${how==='saved'?'survived':'ended'}. ${e.dead?e.dead+' dead.':''}`,how==='saved'?'':'bad');
}
const R01=()=>Math.random();
/* the office learns of a silent ship's emergency only when someone sees her rockets */
function emHourly(e,sh,step){
  if(e.known||e.over)return;
  if(shipsNear(shipXY(sh),20,sh).some(n=>n.radio)&&Math.random()<0.5*step*24){e.known=true;
    emSay(e,null,`Passing steamer reports rockets and distress signals from SS ${e.ship} ${posText(sh)}. Standing by.`,'bad','Relayed by a passing ship');
    if(typeof UI!=='undefined'){UI.emOpen=e.id;UI.emMin=false;}}
}

/* ---------- the emergency window ---------- */
function emergencyHTML(){
  const L=(S.emerg||[]).filter(e=>e.known&&(!e.over||S.t-e.t1<3));
  if(!L.length)return '';
  const e=L.find(x=>x.id===UI.emOpen)||L.find(x=>!x.over)||L[0];
  if(UI.emMin)return `<button class="empill" data-act="emshow">${L.some(x=>!x.over)?'Emergency':'Emergency over'}: SS ${esc(e.ship)}</button>`;
  const D=EMERG[e.k],sh=S.ships.find(x=>x.id===e.sid),hrs=Math.max(0,((e.t1||S.t)-e.t0)*24);
  const gname={water:'Water',fire:'Fire',sick:'Sickness',unrest:'Unrest'}[D.type];
  const aboard=sh?`${int(soulsOf(sh))} passengers and about ${int(crewOf(sh))} crew aboard.`:'';
  const state=e.over==='saved'?'Over. She was saved.':e.over==='lost'?`Over. She was lost${e.dead?', with '+e.dead+' lives':''}.`
    :e.seized?'The ship has been seized. Waiting for the navy.':e.abandon?'Abandoning ship.':e.threat>60?'Losing the fight.':e.ctrl>70?'Getting on top of it.':'Fighting it.';
  const resp=e.resp.length?e.resp.map(r=>`<li>${r.navy?esc(r.name):'SS '+esc(r.name)} <span class="meta">${r.navy?'navy':esc(r.line)}${r.own?' · yours':''}</span><span class="num">${r.arrived?'alongside':Math.max(1,Math.round((r.eta-S.t)*24))+' h away'}</span></li>`).join(''):'<li class="meta">No ship has answered.</li>';
  const tabs=L.length>1?`<div class="emtabs">${L.map(x=>`<button data-act="emtab" data-id="${x.id}" aria-pressed="${x.id===e.id}">SS ${esc(x.ship)}</button>`).join('')}</div>`:'';
  return `<div class="emerg${e.over?' done':''}" role="dialog" aria-label="Emergency">
    <div class="em-head"><div><span class="eyebrow">${e.over?'Emergency over':'Emergency'} · ${hhmm(e.t0)} ${dateLong(e.t0)}</span><h3>SS ${esc(e.ship)}: ${D.name}</h3></div>
      <button class="btn" data-act="emmin">Minimise</button></div>${tabs}
    <div class="em-body">
      <p class="em-state"><strong>${state}</strong> ${Math.floor(hrs)} h ${Math.round((hrs%1)*60)} min since the first signal, ${e.where}. ${aboard}</p>
      <div class="em-gauges"><div><span class="lbl">${gname}</span><div class="bar"><i class="${e.threat>60?'low':e.threat>30?'mid':''}" style="width:${Math.round(e.threat)}%"></i></div></div>
        <div><span class="lbl">Crew in control</span><div class="bar"><i style="width:${Math.round(e.ctrl)}%"></i></div></div></div>
      <div><span class="lbl">Answering the call</span><ul class="em-resp">${resp}</ul></div>
      <div><span class="lbl">Signals</span><div class="em-log">${e.lines.map(l=>`<div><time>${hhmm(l.t)}</time> <span class="meta">${esc(l.via)}</span><br>${esc(l.txt)}</div>`).join('')}</div></div>
      <div class="em-orders"><span class="lbl">Owner's orders</span>
        <div class="btns"><button class="btn" data-act="emreport" data-id="${e.id}" ${e.over?'disabled':''}>Ask for a report</button><button class="btn" data-act="emtrust" data-id="${e.id}" ${e.over?'disabled':''}>Tell the master to use his judgement</button></div>
        <p class="note">More orders are coming in a later update.</p></div>
      ${!e.over?`<p class="note">${UI.emNormal?'The clock is at normal speed.':'The clock runs at one hour a second until this is over.'} <button class="btn quiet" data-act="emspeed">${UI.emNormal?'Slow it down again':'Run at normal speed'}</button></p>`:`<button class="btn" data-act="emclose" data-id="${e.id}">Close</button>`}
    </div></div>`;
}
function emOrder(kind,id){
  const e=(S.emerg||[]).find(x=>x.id===id);if(!e||e.over)return;const sh=S.ships.find(x=>x.id===e.sid);if(!sh)return;
  if(kind==='report')emSay(e,sh,`${Math.round(e.threat)}% ${EMERG[e.k].type==='water'?'flooded':EMERG[e.k].type==='fire'?'of the fire uncontained':EMERG[e.k].type==='sick'?'of third class ill':'of the crew out of hand'}. ${e.resp.filter(r=>r.arrived).length} ships with us. ${e.threat>60?'Grave.':'Holding.'}`,'');
  if(kind==='trust'&&!e.trusted){e.trusted=true;e.ctrl=Math.min(100,e.ctrl+3);emSay(e,sh,'Understood. Thank the owners.','');}
}
