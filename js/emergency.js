/* ================= EMERGENCIES =================
   Anything a master would send a distress call for: collision, flooding, fire, illness, mutiny, piracy.
   Each emergency is a struggle between a threat (water, fire, sickness, unrest: 0 to 100) and the crew's control of it.
   Ships nearby answer the call and steam to help. While an emergency the office knows of is running, the clock slows to
   an hour a second, and a window follows it from the first signal to the end.
   At each turn of the struggle the master asks the owners for orders by wireless. Orders only reach a ship with a set;
   without one, or if the office does not answer in time, the master acts on his own judgement, which is only as good
   as the man. Some things only the office can do: call every ship on the ocean, send salvage tugs, land the sick. */
const EMERG={
  ice:{name:'Struck ice',type:'water',rate:[4,11],sos:true,grave:0.09,
    first:w=>`Struck iceberg ${w}. Holed forward. Water in number 1 and 2 holds. Pumps working.`},
  wreck:{name:'Struck wreckage',type:'water',rate:[3,8],sos:true,grave:0.06,
    first:w=>`Struck submerged wreckage ${w}. Taking water in the forepeak. Pumps working. Stand by.`},
  collision:{name:'Collision',type:'water',rate:[4,10],sos:true,other:true,grave:0.14,
    first:(w,o)=>`In collision with ${o} in fog ${w}. Holed abreast number 3 hold. Both ships stopped.`},
  seam:{name:'Taking water',type:'water',rate:[2,6],sos:true,grave:0.08,
    first:w=>`Heavy seas have sprung plates aft ${w}. Water gaining in the shaft tunnel. Pumps working.`},
  fire:{name:'Fire',type:'fire',rate:[4,10],sos:true,grave:0.08,
    first:w=>`Fire in the bunkers ${w}. Hoses on it. Passengers mustered on deck.`},
  illness:{name:'Outbreak of illness',type:'sick',rate:[1.2,3.2],sos:false,grave:0.12,
    first:(w,o,d,crew)=>`${crew?'Several of the crew':'Several third-class passengers'} down with ${d.first}. Surgeon ${d.sure?'confirms':'suspects'} ${d.name}. Isolating them. Request instructions.`},
  mutiny:{name:'Mutiny',type:'unrest',rate:[3,8],sos:true,grave:0.1,
    first:w=>`Firemen refuse duty over pay and food. Stokehold abandoned. Engines stopped ${w}. Officers armed.`},
  piracy:{name:'Piracy',type:'unrest',rate:[5,11],sos:true,grave:0.1,
    first:w=>`Armed men among the passengers have tried to seize the bridge ${w}. Officers holding the wheelhouse. Require assistance.`},
  quar:{name:'Quarantine',type:'quar',rate:[0,0],sos:false,grave:0}
};
/* the diseases a ship might carry. mort: share of the sick who die. qd: days of quarantine a port health officer imposes */
const DISEASE={
  flu:{name:'influenza',first:'fever and a cough',mort:0.015,spread:1.4,qd:3,rep:1,sure:true},
  measles:{name:'measles',first:'fever and a rash, mostly children',mort:0.03,spread:1.2,qd:5,rep:2,sure:true},
  typhoid:{name:'typhoid',first:'a low fever and the flux',mort:0.07,spread:0.8,qd:7,rep:3},
  typhus:{name:'typhus',first:'high fever and a spotted rash',mort:0.1,spread:0.9,qd:10,rep:4},
  cholera:{name:'cholera',first:'violent sickness and cramps',mort:0.2,spread:1.1,qd:10,rep:6},
  smallpox:{name:'smallpox',first:'fever and pustules',mort:0.18,spread:0.8,qd:14,rep:8},
  yellow:{name:'yellow fever',first:'fever and jaundice',mort:0.15,spread:0.7,qd:6,rep:3,crew:true}
};
function pickDisease(rk,m,R){
  const winter=[0,1,2,10,11].includes(m);
  const W=['waf','ban'].includes(rk)?[['yellow',4],['typhoid',3],['flu',1],['cholera',1]]
    :['cot','rpl'].includes(rk)?[['typhoid',3],['yellow',2],['flu',2],['measles',1]]
    :rk==='nap'?[['typhoid',3],['cholera',2],['typhus',2],['measles',2],['smallpox',1]]
    :[['flu',winter?6:2],['measles',3],['typhus',2],['typhoid',2],['smallpox',0.6]];
  let s=W.reduce((a,w)=>a+w[1],0)*R();for(const [k,w] of W){s-=w;if(s<=0)return k;}return W[0][0];
}
const SEV=['','minor','serious','grave'],SEV_RATE=[0,0.6,1,1.5],SEV_T0=[0,8,16,24],SEV_SLOW=[1,1,1.5,2.2],SEV_CAP=[0,0,4,14];
const NAVY=['HMS Vigilant','HMS Resolute','HMS Curlew','USS Concord','USS Brandywine','the French cruiser Aventure'];
const TUGS=['Zwarte Zee','Roode Zee','Lady Brassey','Bustler','Seefalke','Foundation Franklin'];
const EM_RATE=1/24; // an hour of game time per second while an emergency runs
const DEC_H=4;      // hours the master waits for orders; at a fifth of EM_RATE that is about twenty seconds
const hhmm=t=>{const h=((t%1)+1)%1*24;return String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0');};
const soulsOf=sh=>(sh.load?CL.reduce((a,c)=>a+(sh.load.pax[c]?sh.load.pax[c].n:0),0):0);
const crewOf=sh=>Math.round(sh.grt/45)+40;
const R01=()=>Math.random();
function activeEmergency(){return (S.emerg||[]).find(e=>!e.over&&e.known);}
/* how fast the clock may run: an hour a second through an emergency, slower still while the master waits for orders */
const emBig=e=>e.sev>1||e.k==='quar';
function emClock(){
  const a=(S.emerg||[]).filter(e=>!e.over&&e.known&&emBig(e));if(!a.length)return S.dis&&S.dis.state==='rival'?EM_RATE:null;
  const d=a.filter(e=>e.dec&&e.dec.owner);if(!d.length)return EM_RATE;
  // while the master waits for orders on something serious the clock all but stops: two or three minutes to decide
  return d.some(e=>e.sev>=3&&e.k!=='quar')?EM_RATE/45:d.some(e=>e.k!=='quar')?EM_RATE/30:EM_RATE/15;
}
const emShip=e=>S.ships.find(x=>x.id===e.sid);
function nearestPort(p){let b=null;for(const k in CHART.ports){const [x,y]=CHART.ports[k],d=nmBetween(p,{x,y});if(!b||d<b.d)b={k,d};}return b;}

/* at sailing: will something go badly wrong this voyage? */
function rollEmergency(sh,gk,dist,R){
  const m=mOf(S.t)%12,winter=[0,1,2,10,11].includes(m),north=GEO(gk).calls.some(c=>['HAL','SJN','NYC','QBC','MTL'].includes(c[0]));
  const mods=shipMods(sh),lenF=dist/3000,old=sh.cond<50?1.6:1;
  const W=[];
  if(north&&[2,3,4,5,6].includes(m))W.push(['ice',0.006*(sh.up&&sh.up.radar?0.4:1)*(newCal()&&nightOn(sh)?0.8:1)*ruleRisk('ice')]);
  const fr=fatRisk(sh);W.push(['wreck',0.003*ruleRisk('wreck')],['collision',0.004*(sh.up&&sh.up.radar?0.4:1)*(winter?1.4:1)*ruleRisk('collision')],['seam',0.004*old*fr*(winter?1.8:1)*(sh.safety||1)*(1+2*seaSev(sh,sh.legRoute,m))]);
  W.push(['fire',0.003*old*Math.sqrt(fr)*(sh.fuel==='coal'?1.3:1)]);
  const steer=sh.load&&sh.load.pax.t?sh.load.pax.t.n:0,hot=TROPIC.includes(sh.legRoute);
  if(steer>80||hot)W.push(['illness',0.012*Math.min(2,steer/500)+(hot?0.008:0)]);
  if((sh.morale||60)<35)W.push(['mutiny',0.02*(35-sh.morale)/35*(has(sh,'martinet')?1.6:1)]);
  if(['ban','waf','cot','rpl'].includes(sh.legRoute))W.push(['piracy',0.0015]);
  for(const [k,p] of W)if(R()<p*0.5*lenF*mods.risk)return {k,at:dist*(0.1+R()*0.8)};
  return null;
}
/* ships that hear the call and turn towards her */
function addResponders(e,sh,range,max){
  const p=shipXY(sh),have=new Set(e.resp.map(r=>r.name)),R=Math.random;
  // by wireless at night, only ships keeping a watch hear her (rockets and lamps are seen by anyone on deck)
  const all=shipsNear(p,range,sh).filter(x=>!have.has(x.name)),deaf=range>20?all.filter(n=>!hearsNow(n)):[];
  if(deaf.length)e.deaf=Math.min(e.deaf||1e9,deaf[0].d);
  const heard=all.filter(n=>!deaf.includes(n)).slice(0,max);
  for(const n of heard){const kn=n.own?knotsOf(S.ships.find(x=>x.name===n.name)||{knots:16}):15+R()*4;
    e.resp.push({name:n.name,line:n.line,own:n.own,radio:n.radio,eta:S.t+n.d/kn/24,arrived:false,d:n.d});}
  return heard;
}
function startEmergency(sh,k){
  const R=Math.random,D=EMERG[k],where=posText(sh),radio=radioOf(sh),p=shipXY(sh);
  const cap=clamp(safetyOf().cap+66+(sh.captain?Math.min(20,sh.captain.exp*0.7):5)+(has(sh,'cautious')?5:0)-(has(sh,'drinker')?8:0)+((sh.morale||60)-60)/3+(sh.cond-60)/5+crewMods(sh).cap,25,90);
  const g=R(),old=fatOf(sh),sev=g<D.grave*(sh.cond<45?1.5:1)*(old>75?1.8:1)*safetyOf().grave?3:g<0.45+(old>75?0.15:0)?2:1;
  const e={id:(S.emNext=(S.emNext||0)+1),sid:sh.id,ship:sh.name,k,t0:S.t,sev,peak:0,ctrl:0,cap,capA:0,rateM:SEV_RATE[sev],saveA:0,
    rate:D.rate[0]+R()*(D.rate[1]-D.rate[0]),resp:[],known:radio,over:null,where,lines:[],later:[],orders:[],dead:0,abandon:false};
  e.threat=D.type==='sick'?4:D.type==='unrest'?10:SEV_T0[sev];
  if(D.type==='sick'){e.dis=pickDisease(sh.legRoute,mOf(S.t)%12,R);const dd=DISEASE[e.dis];e.rate*=dd.spread*crewMods(sh).sick;e.crew=!!dd.crew||soulsOf(sh)<60;}
  let oth=null;if(D.other){oth=shipsNear(p,400,sh).find(x=>!x.own);e.other=oth?`SS ${oth.name} (${oth.line})`:'an unknown steamer';
    if(oth)e.resp.push({name:oth.name,line:oth.line,radio:oth.radio,eta:S.t,arrived:true});}
  S.emerg=S.emerg||[];S.emerg.push(e);if(S.emerg.length>40)S.emerg=S.emerg.filter(x=>!x.over||S.t-x.t1<30);sh.em=e.id;
  if(D.type!=='sick'){sh.stopLeft=Math.max(sh.stopLeft||0,1e6);}
  const sevTxt=D.type==='water'?['',' Damage appears slight.','',' Damage heavy. Water coming in fast.'][sev]:D.type==='fire'?['','','',' Fire has a strong hold.'][sev]:'';
  emSay(e,sh,(D.sos&&radio?'SOS. ':'')+`SS ${sh.name}. `+D.first(where,e.other,DISEASE[e.dis],e.crew)+sevTxt,'bad');
  // who hears: by wireless within 250 miles, by rockets and lamps within 20
  const heard=addResponders(e,sh,radio&&D.sos?250:(D.sos?20:0),3);
  if(!radio&&heard.some(n=>n.radio))e.known=true;
  if(D.type==='unrest'){const nv=NAVY[Math.floor(R()*NAVY.length)];e.resp.push({name:nv,line:'navy',navy:true,radio:true,eta:S.t+(0.8+R()*1.2),arrived:false});}
  if(e.known){emSay(e,null,D.sos?(e.resp.length?`Answering: ${e.resp.filter(r=>!r.arrived).map(r=>`${r.navy?r.name:'SS '+r.name}${r.navy?'':' ('+r.line+')'}, about ${Math.max(1,Math.round((r.eta-S.t)*24))} h away`).join('; ')}.`:'No ship has answered yet.'):'Ship proceeding. Surgeon reports twice daily.',radio?'':'relay',stationFor(sh)+' Radio');
    if(typeof UI!=='undefined'&&emBig(e)){UI.emOpen=e.id;UI.emMin=false;UI.emNormal=false;}}
  askOrders(e,sh,D.type==='water'?'w1':D.type==='fire'?'f1':D.type==='sick'?'s1':e.k==='piracy'?'p1':'u1');
  return e;
}
/* a line in the emergency log, and in the wireless room */
function emSay(e,sh,txt,kind,via){
  const m={id:S.wireNext=(S.wireNext||0)+1,t:S.t,ship:e.ship,sid:e.sid,txt:telegram(txt),k:kind==='relay'?'bad':(kind||''),em:e.id};
  m.via=via||(sh&&sh.state==='port'?'Cable, '+PN[sh.port]+' agents':sh&&radioOf(sh)?stationFor(sh)+' Radio':sh?'Rockets and lamp, seen by a passing ship':'Coast station');
  e.lines.unshift({t:S.t,txt:m.txt,via:m.via});if(e.lines.length>40)e.lines.length=40;
  if(e.known||(sh&&radioOf(sh))){deliverWire(m);if(/head office/.test(m.via))m.read=true;} // our own orders need no decoding
}
const emLater=(e,hrs,txt,kind,via)=>e.later.push({at:S.t+hrs/24,txt,kind,via});

/* ---------- the master's questions, and the owners' orders ----------
   Each option: label, hint (what the office knows of its effect), ok (can it be done now), owner (only the office can
   order it), fx (what it does). Hints are honest: an attentive owner who reads them will usually choose well. */
const DECIDE={
  w1:{q:'Water is coming in faster than she can spare. How is she to be fought?',opts:{
    doors:{label:'Close the watertight doors and pump',hint:(e,sh)=>(sh.safety||1)<1?'She has enhanced subdivision. The doors will hold most of it.':'The standard answer. Slows the water, does not stop it.',
      fx:(e,sh)=>{e.rateM*=(sh.safety||1)<1?0.55:0.8;return 'Watertight doors closed. All pumps on it.';}},
    jettison:{label:'Jettison cargo to lift the bow',hint:()=>'Takes weight off the damaged end. The cargo is lost and the shippers will claim.',ok:(e,sh)=>sh.load&&sh.load.cargoRev>200,
      fx:(e,sh)=>{const c=Math.round(sh.load.cargoRev*0.7);sh.load.cargoRev-=c;book('cargo',-Math.round(c*0.4),sh.legRoute,sh);e.rateM*=0.62;return 'Cargo going over the side from the forward holds. She is lifting.';}}
  },dflt:(e,sh)=>'doors'},
  f1:{q:'The fire has a hold in the bunkers. How is it to be fought?',opts:{
    hoses:{label:'Fight it with the hoses',hint:()=>'Keeps her whole. Slow against a coal fire.',fx:e=>{e.rateM*=0.9;return 'Fighting it with every hose.';}},
    flood:{label:'Flood the hold',hint:()=>'Drowns the fire quickly. The cargo is ruined and the repair bill larger.',ok:(e,sh)=>!!sh.load,
      fx:(e,sh)=>{e.rateM*=0.42;e.flooded=true;const c=Math.round(sh.load.cargoRev*0.6);sh.load.cargoRev-=c;book('cargo',-Math.round(c*0.4),sh.legRoute,sh);return 'Flooding the hold. Steam rising through the hatches.';}},
    wind:{label:'Put her stern to the wind and slow down',hint:()=>'Stops the wind fanning the fire forward. Costs a day.',
      fx:e=>{e.rateM*=0.7;e.delay=(e.delay||0)+1;return 'Stern to the wind. Smoke going clear of the ship.';}},
  },dflt:(e,sh)=>has(sh,'cautious')?'wind':'hoses'},
  w2:{q:'She is settling. What of the passengers?',opts:{
    transfer:{label:'Transfer the passengers to the ships standing by',hint:e=>'Takes them out of danger while it is calm enough. Costs passage money and goodwill with the other lines.',
      ok:e=>e.resp.some(r=>r.arrived&&!r.navy&&!r.tug),fx:(e,sh)=>{e.transfer=true;e.capA+=6;book('fares',-Math.round((sh.load?sh.load.paxRev:0)*0.3),sh.legRoute,sh);return 'Passengers going across in the boats. Women and children first.';}},
    boats:{label:'Swing out the boats and keep pumping',hint:()=>'Everyone at boat stations. If she goes, she goes with the boats ready.',fx:e=>{e.saveA+=0.2;return 'Boats swung out. Passengers at their stations in lifebelts.';}},
    press:{label:'Keep them below and make for port',hint:()=>'Saves the passage if she holds. If she does not, the boats go late.',fx:(e,sh)=>{e.rateM*=1.12;e.saveA-=0.15;e.press=true;sh.stopLeft=0;return 'Making for port at slow speed. Passengers told to keep to their cabins.';}},
    beach:{label:'Run her for the shore',ok:(e,sh)=>!e.doom&&nearestPort(shipXY(sh)).d<160,hint:(e,sh)=>{const n=nearestPort(shipXY(sh));return `Beach her near ${PN[n.k]}, about ${Math.max(1,Math.round(n.d/7))} h away. Everyone lives. She may never float again.`;},
      fx:(e,sh)=>{const n=nearestPort(shipXY(sh));e.beach={at:S.t+n.d/7/24,port:n.k};return `Steering for the shore near ${PN[n.k]}. Will beach her if she will not float.`;}}
  },dflt:(e,sh)=>has(sh,'driver')||has(sh,'drinker')?'press':'boats'},
  w3:{q:'She cannot last long like this.',opts:{
    abandon:{label:'Abandon ship now',hint:()=>'Gets everyone off while there is time. The pumps stop and she will very likely go.',
      fx:e=>{e.abandon=S.t;e.saveA+=0.2;e.rateM*=1.6;e.capA-=45;e.ctrl=Math.min(e.ctrl,20);return 'Abandoning ship. All passengers to the boats.';}},
    fight:{label:'Fight on with volunteers, the rest to the boats',hint:()=>'A last chance to save her. Men will die if she goes.',
      fx:e=>{e.fight=true;e.saveA+=0.1;e.capA+=10;return 'Passengers in the boats. Engineers and volunteers staying aboard to pump.';}}
  },dflt:(e,sh)=>has(sh,'driver')||has(sh,'martinet')?'fight':'abandon'},
  u1:{q:'The stokehold crowd hold the engine room. What are the master\'s orders?',opts:{
    meet:{label:'Meet their demands',hint:()=>'Ends it within hours. Costs money now and a softer crew later.',fx:(e,sh)=>{e.settle=true;book('crew',-Math.round(600+sh.grt*0.04),sh.legRoute,sh);sh.morale=Math.min(100,(sh.morale||50)+15);return 'Demands met. Men returning to the stokehold.';}},
    firm:{label:'Hold firm and wait for the navy',hint:()=>'Safe for the officers, slow for the passengers.',fx:e=>{e.rateM*=0.8;return 'Holding the bridge. Waiting for the navy.';}},
    arm:{label:'Arm the officers and retake the engine room',hint:(e,sh)=>`Quick if it works. If it fails, men will die.${has(sh,'martinet')?' He has the discipline for it.':''}`,
      fx:(e,sh)=>{const p=0.55+(has(sh,'martinet')?0.12:0)+(sh.captain?Math.min(0.15,sh.captain.exp/100):0);
        if(Math.random()<p){e.threat=Math.max(0,e.threat-60);e.ctrl=100;return 'Officers retook the engine room. Ringleaders in irons.';}
        const d=2+Math.floor(Math.random()*9);e.dead+=d;e.threat=Math.min(99,e.threat+30);S.rep=clamp(S.rep-3,0,100);return `Rush failed. ${d} killed. Mutineers hold the after deck.`;}}
  },dflt:(e,sh)=>has(sh,'martinet')?'arm':'firm'},
  p1:{q:'Armed men are trying for the bridge. What are the master\'s orders?',opts:{
    pay:{label:'Hand over the specie and the mail',hint:()=>'Ends it without blood. Costs money, and the newspapers will call it cowardice.',fx:(e,sh)=>{e.settle=true;book('fares',-Math.round(2000+Math.random()*3000),sh.legRoute,sh);S.rep=clamp(S.rep-2,0,100);return 'Strongroom opened. The men are leaving in a launch.';}},
    hold:{label:'Hold the bridge and wait for the navy',hint:()=>'Safe while the wheelhouse holds.',fx:e=>{e.rateM*=0.8;return 'Holding the wheelhouse. Waiting for the navy.';}},
    rush:{label:'Rush them',hint:()=>'Over quickly if it works. Passengers may be hurt if not.',
      fx:(e,sh)=>{if(Math.random()<0.5+(sh.captain?Math.min(0.15,sh.captain.exp/100):0)){e.threat=Math.max(0,e.threat-60);e.ctrl=100;return 'Rushed them on the boat deck. Ringleaders taken.';}
        const d=3+Math.floor(Math.random()*12);e.dead+=d;e.threat=Math.min(99,e.threat+30);S.rep=clamp(S.rep-4,0,100);return `Rush failed. ${d} killed including passengers. They hold the bridge.`;}}
  },dflt:(e,sh)=>has(sh,'driver')||has(sh,'martinet')?'rush':'hold'},
  s1:{q:'How is the outbreak to be handled?',opts:{
    isolate:{label:'Isolate the sick and fumigate',hint:()=>'Slows the spread and shortens any quarantine. Costs a little.',fx:(e,sh)=>{e.rateM*=0.55;e.iso=true;book('port',-Math.round(150+soulsOf(sh)*0.2),sh.legRoute,sh);return 'Sick bay extended into the after well deck. Fumigating the steerage.';}},
    land:{label:'Put in and land the sick at the nearest port',owner:true,ok:(e,sh)=>nearestPort(shipXY(sh)).d<700,hint:(e,sh)=>{const n=nearestPort(shipXY(sh));return `${PN[n.k]}, about ${Math.round(n.d/(knotsOf(sh)*24)*10)/10} days off her track. Ends it and avoids quarantine. Costs time and the hospital bill.`;},
      fx:(e,sh)=>{const n=nearestPort(shipXY(sh));e.landed=true;e.rateM*=0.3;sh.stopLeft=Math.max(sh.stopLeft||0,0.5+n.d/(knotsOf(sh)*24));book('port',-Math.round(300+soulsOf(sh)*0.6),sh.legRoute,sh);S.rep=clamp(S.rep+1,0,100);return `Diverting to ${PN[n.k]} to land the sick.`;}},
    quiet:{label:'Say nothing and carry on',hint:()=>'No delay if the port doctor misses it. If he does not, the papers will have it.',fx:e=>{e.quiet=true;e.rateM*=1.2;return 'Understood. Proceeding. Log kept private.';}}
  },dflt:(e,sh)=>has(sh,'driver')||has(sh,'lax')||has(sh,'drinker')?'quiet':'isolate'},
  q1:{who:'The agents ask',q:'The port health officer has ordered her into quarantine.',opts:{
    accept:{label:'Accept the quarantine',hint:e=>`${e.days} days at anchor off the quarantine station, and the fees.`,fx:()=> 'Quarantine accepted. Ship at the quarantine anchorage.'},
    station:{label:'Land steerage at the quarantine station and pay their keep',ok:e=>e.steer>0,hint:e=>`The ship is released in a day. You pay for ${int(e.steer)} people ashore for ${e.days} days, about ${fmt(Math.round(e.steer*e.days*0.8+300))}.`,
      fx:(e,sh)=>{if(sh.state==='port')sh.portLeft=Math.max(1,sh.portLeft-(e.days-1));book('port',-Math.round(e.steer*e.days*0.8+300),sh.legRoute||sh.line,sh);return 'Steerage landed to the quarantine station. Ship released tomorrow.';}},
    protest:{label:'Protest to the health officer',hint:()=>`Your name carries weight with the port${S.rep>60?'':', though perhaps not enough'}. If he will not budge, he adds a day for the trouble.`,
      fx:(e,sh)=>{if(Math.random()<0.2+S.rep/220){if(sh.state==='port')sh.portLeft=Math.max(1,sh.portLeft-Math.floor(e.days/2));return 'Health officer relents. Quarantine halved.';}
        if(sh.state==='port')sh.portLeft+=1;S.rep=clamp(S.rep-1,0,100);return 'Health officer will not move. A day added for the trouble.';}}
  },dflt:()=> 'accept'}
};
/* things only the office can do, at any time, once each: they do not wait for the master to ask */
const OFFICE={
    distress:{label:'Call every ship within 500 miles',owner:true,hint:e=>e.resp.length?'More ships on the way. The newspapers will hear of it.':'No ship is near her yet. This widens the call. The newspapers will hear of it.',
      fx:(e,sh)=>{const h=addResponders(e,sh,500,3);S.rep=clamp(S.rep-1,0,100);return h.length?`General call answered by ${h.map(n=>'SS '+n.name).join(', ')}.`:'General call sent. Nothing answering yet.';}},
    tugs:{label:'Send salvage tugs, no cure no pay',owner:true,ok:(e,sh)=>nearestPort(shipXY(sh)).d<600,hint:(e,sh)=>{const n=nearestPort(shipXY(sh));return `Ocean tugs from ${PN[n.k]}, about ${Math.round(n.d/11)} h away. Pumps and a tow. Costs a salvage award only if she is saved.`;},
      fx:(e,sh)=>{const n=nearestPort(shipXY(sh));e.salvage=true;e.resp.push({name:TUGS[e.id%TUGS.length],line:'salvage tug, '+PN[n.k],tug:true,radio:true,eta:S.t+n.d/11/24+1/24,arrived:false});return `Salvage tug ${TUGS[e.id%TUGS.length]} sailing from ${PN[n.k]}.`;}}
};
const officeOpts=(e,sh)=>(EMERG[e.k].type==='water'||EMERG[e.k].type==='fire')&&radioOf(sh)&&!e.over?Object.entries(OFFICE).filter(([id,o])=>!(e.office||{})[id]&&(!o.ok||o.ok(e,sh))):[];
const decOpts=(e,sh,k)=>Object.entries(DECIDE[k].opts).filter(([id,o])=>o&&(!o.ok||o.ok(e,sh))&&(!o.owner||e.canOrder));
/* the master asks. With a wireless set he waits a few hours for orders; without one he decides at once */
function askOrders(e,sh,k){
  if(e.dec)emDecide(e,null,'master'); // an earlier question overtaken by events
  e.canOrder=(radioOf(sh)||sh.state==='port')&&emBig(e); // a minor emergency the master handles himself
  const opts=decOpts(e,sh,k);if(!opts.length)return;
  let d=DECIDE[k].dflt(e,sh);if(!opts.some(o=>o[0]===d))d=opts.find(o=>!o[1].owner)[0];
  if(has(sh,'drinker')&&Math.random()<0.35){const own=opts.filter(o=>!o[1].owner);d=own[Math.floor(Math.random()*own.length)][0];}
  e.dec={k,at:S.t,until:S.t+DEC_H/24,dflt:d,owner:e.canOrder};
  if(!e.canOrder)return emDecide(e,d,'master');
  emSay(e,sh,`${k==='q1'?'Agents':'Master'} to owners. ${DECIDE[k].q} Request orders. Will ${DECIDE[k].opts[d].label.toLowerCase()} unless ordered otherwise.`,'bad');
  if(typeof UI!=='undefined'){UI.emOpen=e.id;UI.emMin=false;UI.emNormal=false;}
}
function emDecide(e,id,by){
  const dec=e.dec;if(!dec)return;const sh=emShip(e);e.dec=null;if(!sh)return;
  if(!id)id=dec.dflt;const o=DECIDE[dec.k].opts[id];if(!o)return;
  if(by==='owner')emSay(e,null,`Owners to master. ${o.label}.`,'','Morven Line, head office');
  const r=o.fx(e,sh);e.orders.push({k:dec.k,id,by,t:S.t});
  emSay(e,sh,(by==='owner'?'':e.canOrder?'No orders received. ':'')+r,'');
  if(e.k==='quar'){e.over='saved';e.t1=S.t;}
}

/* each step: the threat grows or is beaten back; help arrives; the master asks */
function emergencyStep(e,sh,step){
  if(e.over||e.k==='quar')return;
  const D=EMERG[e.k],h=step*24;
  for(const r of e.resp)if(!r.arrived&&S.t>=r.eta){r.arrived=true;
    emSay(e,null,r.navy?`${r.name} alongside SS ${e.ship}. Boarding party sent across.`:r.tug?`Tug ${r.name} alongside SS ${e.ship}. Salvage pumps going aboard.`:`SS ${r.name} standing by SS ${e.ship}${D.type==='water'||D.type==='fire'?'. Boats lowered, pumps and hoses passed across':''}.`,'good',r.navy?'Naval wireless':r.tug?'Tug\'s wireless':`SS ${r.name}'s wireless`);
    if(r.own)S.rep=clamp(S.rep+1,0,100);}
  const help=e.resp.reduce((a,r)=>a+(r.arrived?(r.tug?2.5:1):0),0);
  // worse damage is harder to get on top of: control comes more slowly and never as fully without help
  const sv=e.sev||1,cap=Math.min(100,e.cap+e.capA-SEV_CAP[sv]+help*(D.type==='unrest'?35:D.type==='sick'?6:12));
  e.ctrl=Math.min(cap,e.ctrl+h*(D.type==='sick'?4:12)/SEV_SLOW[sv]);
  const beat=e.ctrl>55?(e.ctrl-55)/6:0;
  if(e.settle)e.threat=Math.max(0,e.threat-20*h);
  else e.threat=clamp(e.threat+h*(e.rate*e.rateM*(1-e.ctrl/100)-beat),0,100);
  if(e.doom)e.threat=Math.max(e.threat,100*Math.min(1,(S.t-e.t0)/Math.max(1e-6,e.doomAt-e.t0))); // the 1912 ship: nothing saves her
  e.peak=Math.max(e.peak,e.threat);
  const w=Math.round(e.threat),mark=Math.floor(e.threat/25);
  if(mark>(e.mark||0)&&mark<4){e.mark=mark;
    emSay(e,sh,D.type==='water'?['','Water gaining. Pumps just holding.','Stokeholds flooding. Fires drawn in the forward boilers.','Down by the head. Well deck awash.'][mark]
      :D.type==='fire'?['','Fire spreading aft along the bunkers.','Fire through to the upper decks. Saloons lost.','Fire out of control amidships.'][mark]
      :D.type==='sick'?`${sickNow(e,sh)} now ill with ${DISEASE[e.dis].name}. ${mark>1?'Surgeon exhausted. Hospital full.':'Surgeon coping.'}${mark>2&&DISEASE[e.dis].mort>0.05?' Burials at sea today.':''}`
      :`Situation worsening. ${w>50?'Mutineers hold the engine room and the after deck.':'Stokers barricaded aft.'}`,'bad');}
  else if(e.threat<(e.mark||0)*25-15&&e.mark>0){e.mark--;emSay(e,sh,D.type==='sick'?`${DISEASE[e.dis].name[0].toUpperCase()+DISEASE[e.dis].name.slice(1)} abating. No new cases today.`:'Gaining on it. Situation improving.','');}
  if(e.dec&&S.t>=e.dec.until)emDecide(e,null,'master');
  if(D.type==='water'||D.type==='fire'){
    if(!e.st2&&e.threat>=45){e.st2=true;askOrders(e,sh,'w2');}
    if(!e.st3&&e.threat>=80&&!e.beach&&!e.abandon){e.st3=true;askOrders(e,sh,'w3');}
    if(!e.chill&&e.threat>=92&&!e.beach){e.chill=true;
      emSay(e,sh,D.type==='water'?`CQD SOS. SS ${e.ship} ${posText(sh)}. Sinking fast by the head. ${e.transfer?'Passengers away.':'Women and children in the boats.'} Engine room flooding. Cannot last.`
        :`SOS. SS ${e.ship} ${posText(sh)}. Fire through the bridge deck. ${e.transfer?'Passengers away.':'All hands to the boats.'} Cannot hold her.`,'bad');}
    if(e.beach&&S.t>=e.beach.at&&e.threat<100)return emEnd(e,sh,'beached');
  }
  if(e.threat>=100)return emEnd(e,sh,'lost');
  if(e.threat<=0.5&&S.t-e.t0>2/24)return emEnd(e,sh,'saved');
  if(D.type==='sick'&&S.t-e.t0>8)return emEnd(e,sh,'saved');
}
const sickNow=(e,sh)=>{const n=Math.max(2,Math.round((e.crew?crewOf(sh):soulsOf(sh))*e.threat/100*0.45));return `${int(n)} ${e.crew?'of the crew':'passengers'}`;};
/* a ship given up: to the sea, or to the underwriters */
function writeOff(e,sh,how){
  sh.lost={t:S.t,where:posText(sh),saved:1,lost:0};const c=insClaim(sh,0.85);queueInquiry(sh,e);S.rep=clamp(S.rep-3,0,100);
  news(`SS ${e.ship} is a constructive total loss ${how}. Everyone aboard was saved. ${insOf(sh).cover==='none'?c.txt:`The underwriters take her over. ${c.txt}`}`,'bad',2);
  S.ships=S.ships.filter(x=>x!==sh);if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;
}
function emEnd(e,sh,how){
  const D=EMERG[e.k],help=e.resp.filter(r=>r.arrived&&!r.navy).length,souls=soulsOf(sh),crew=crewOf(sh),rk=sh.legRoute,R=Math.random;
  e.over=how;e.t1=S.t;sh.em=null;if(e.dec){e.dec=null;}
  if(how==='lost'&&(D.type==='water'||D.type==='fire')){
    const hrs=e.abandon?(S.t-e.abandon)*24:0;
    let sv=clamp((help?0.8+0.06*help:0.42)+e.saveA+safetyOf().save+Math.min(0.2,hrs*0.05),0.1,0.995);
    // no more can get away than her boats hold, and the ships standing by, launched full or half empty as she was drilled
    const cover=boatCover(sh);if(cover<1)sv=Math.min(sv,clamp(cover*([0.62,0.75,0.88][S.safety??1]+(e.saveA>0?0.05:0)+Math.min(0.1,hrs*0.03))+help*0.25+0.02,0.05,0.995));
    let paxLost=e.transfer?0:Math.round(souls*(1-sv)),crewLost=Math.round(crew*(1-sv)*(e.fight?1.4:1)*(e.transfer?0.7:1));
    if(e.doom){const all=souls+crew,n=Math.round(all*disDeath(sh,e));crewLost=Math.min(crew,Math.round(n*crew/Math.max(1,all)*1.2));paxLost=n-crewLost;}
    const lost=Math.min(souls+crew,paxLost+crewLost);e.dead=lost;
    emSay(e,sh,e.abandon?(D.type==='water'?'Last boats away. She is going now. Master and wireless operators leaving her. God speed.':'Last boats away. Fire through the wireless room. Leaving her. God speed.')
      :D.type==='water'?`SOS SOS. We are sinking. Abandoning ship. God speed.`:`SOS. Ship burning end to end. Abandoning her. God speed.`,'bad');
    emSay(e,null,`Signals from SS ${e.ship} ceased ${hhmm(S.t)}. ${e.resp.some(r=>!r.arrived)?'Ships still steaming for the position.':'Nothing further heard.'}`,'bad','Coast station');
    if(e.doom)ownEnd(e,sh,lost,souls,crew);else emLater(e,help?3:9,help?`${e.resp.filter(r=>r.arrived).map(r=>r.navy?r.name:(r.tug?'Tug ':'SS ')+r.name).join(' and ')} picked up ${int(souls+crew-lost)} survivors from SS ${e.ship}.${lost?` ${int(lost)} missing.`:' All saved.'}`
      :`${lost?`Boats of SS ${e.ship} found after a long night. ${int(souls+crew-lost)} survivors. ${int(lost)} missing.`:`All the boats of SS ${e.ship} picked up. Everyone saved.`}`,lost?'bad':'good','Coast station');
    if(sh.load)book('fares',-Math.round(sh.load.paxRev*0.5),rk,sh);
    sh.lost={t:S.t,where:posText(sh),saved:1-lost/Math.max(1,souls+crew),lost};
    queueInquiry(sh,e);sh.inqQ=true;
    if(radioOf(sh)||e.known)loseShip(sh);else{sh.state='lost';sh.stopLeft=0;}
    return;}
  if(how==='beached'){
    emSay(e,sh,`Beached near ${PN[e.beach.port]}. Everyone ashore safe. ${e.peak>65||e.sev===3?'Back broken on the rocks.':'Holding on the sand.'}`,'good');
    if(sh.load)book('fares',-Math.round(sh.load.paxRev*0.25),rk,sh);
    if(e.peak>65||e.sev===3){if(sh.load)book('cargo',-Math.round(sh.load.cargoRev*0.5),rk,sh);writeOff(e,sh,`on the beach near ${PN[e.beach.port]}`);return;}
    sh.brk=null;sh.stopLeft=5;sh.towed=true;book('yard',-Math.round(sh.grt*0.9),rk,sh);sh.cond=clamp(sh.cond-20,5,95);sh.pendingYard='repair';S.rep=clamp(S.rep-2,0,100);
    news(`SS ${e.ship} was beached near ${PN[e.beach.port]}. Everyone was saved. Salvors will refloat her in about five days.`,'bad');return;}
  if(how==='lost'&&D.type==='unrest'){
    // the ship is taken until the navy arrives, then released; a costly delay
    e.over=null;e.t1=null;e.threat=99;e.rate=0.5;if(!e.seized){e.seized=true;emSay(e,sh,e.k==='piracy'?'Bridge taken. Ship under the orders of armed men.':'Mutineers have taken the ship. Officers confined.','bad');}
    if(!e.resp.some(r=>r.navy))e.resp.push({name:NAVY[0],line:'navy',navy:true,radio:true,eta:S.t+1,arrived:false});
    if(e.resp.some(r=>r.navy&&r.arrived)){e.threat=0;return emEnd(e,sh,'saved');}
    sh.em=e.id;return;}
  // saved
  if(D.type==='water'||D.type==='fire'){const sev=e.peak/100;
    if(e.salvage){const aw=Math.round(shipValue(sh)*0.06);book('yard',-aw,rk,sh);emLater(e,2,`Salvage award to the tug owners agreed at ${fmt(aw)}.`,'','Lloyd\'s');}
    if((e.peak>=85&&R()<(e.peak-80)/25)||(e.sev===3&&e.peak>=70&&R()<0.3)){
      emSay(e,sh,`${D.type==='water'?'Leak held':'Fire out'}. Surveyor's report: frames buckled and the hull strained through. Not worth repairing.`,'bad');
      if(sh.load){book('fares',-Math.round(sh.load.paxRev*0.3),rk,sh);}writeOff(e,sh,'after her '+D.name.toLowerCase());return;}
    sh.brk=null;book('yard',-Math.round(sh.grt*(0.2+sev*0.8)*(e.flooded?1.3:1)),rk,sh);sh.cond=clamp(sh.cond-sev*15,5,95);sh.pendingYard=sev>0.5?'repair':'engine';sh.limp=sev>0.3;sh.limpF=0.6;
    S.rep=clamp(S.rep-Math.round(sev*4),0,100);sh.stopLeft=e.delay||0;
    emSay(e,sh,`${D.type==='water'?'Leak under control':'Fire out'}. Proceeding at reduced speed${help?', escorted':''}. ${sev>0.5?'Damage heavy. Will need the yard.':'Damage moderate.'}`,'good');}
  if(D.type==='sick'){const dd=DISEASE[e.dis]||DISEASE.flu,pool=e.crew?crewOf(sh):souls,ill=Math.round(pool*e.peak/100*0.45),dead=Math.round(ill*dd.mort*(e.iso?0.7:1)*crewMods(sh).sick);
    e.dead=dead;const sg=offOf(sh).surg;S.rep=clamp(S.rep-(dead>10?dd.rep+2:dead?dd.rep:(sg&&sg.skill>=60?-1:0)),0,100); // an outbreak with no deaths is no scandal; a good surgeon's handling of it is praised
    if(!e.landed)sh.quarantine={dis:e.dis,iso:!!e.iso,quiet:!!e.quiet,peak:e.peak};
    emSay(e,sh,`Outbreak over. ${ill} were ill. ${dead?dead+' died.':'No deaths.'}${e.landed?' Sick landed ashore.':e.quiet?'':' Expect quarantine on arrival.'}`,dead?'bad':'good');}
  if(D.type==='unrest'){sh.stopLeft=0;if(!e.settle){const c=Math.round(800+R()*2000);book('crew',-c,rk,sh);S.rep=clamp(S.rep-3,0,100);}
    emSay(e,sh,e.settle?'Order restored. Proceeding.':e.k==='piracy'?`Order restored. Ringleaders in irons. ${e.seized?'Mail and valuables taken.':'Nothing lost.'} Proceeding.`:`Order restored. Ringleaders in irons for the courts. Proceeding with a scratch stokehold.`,'good');
    if(e.k==='mutiny')sh.morale=Math.max(sh.morale,45);}
  news(`SS ${e.ship}: ${D.type==='sick'?DISEASE[e.dis].name+' aboard':D.name.toLowerCase()} ${how==='saved'?'survived':'ended'}.${e.dead?' '+e.dead+' dead.':''}`,how==='saved'&&!e.dead?'':'bad');
}
/* on arrival with sickness aboard: the port health officer */
function startQuarantine(sh,rk){
  const q=sh.quarantine===true?{dis:'flu'}:sh.quarantine;sh.quarantine=null;const dd=DISEASE[q.dis]||DISEASE.flu;
  let found=true;
  if(q.quiet){found=Math.random()<0.45+(q.peak||30)/200;
    if(!found){news(`SS ${sh.name} passed the port doctor at ${PN[sh.port]}.`);return;}
    S.rep=clamp(S.rep-dd.rep*2,0,100);news(`The health officer at ${PN[sh.port]} found ${dd.name} aboard SS ${sh.name} that her master had not reported. The newspapers have it.`,'bad',false);}
  const days=Math.max(2,Math.round(dd.qd*(q.iso?0.6:1)*(q.quiet?1.5:1)));
  sh.portLeft+=days;book('port',-Math.round(400+soulsOf(sh)*0.5),rk,sh);
  const steer=sh.load&&sh.load.pax.t?sh.load.pax.t.n:0;
  const e={id:(S.emNext=(S.emNext||0)+1),sid:sh.id,ship:sh.name,k:'quar',t0:S.t,sev:1,peak:0,ctrl:0,cap:0,capA:0,rateM:1,saveA:0,rate:0,resp:[],known:true,over:null,
    where:PN[sh.port],lines:[],later:[],orders:[],dead:0,threat:0,days,steer,dis:q.dis};
  S.emerg=S.emerg||[];S.emerg.push(e);
  emSay(e,sh,`Port health officer ${PN[sh.port]} orders SS ${sh.name} to the quarantine anchorage for ${days} days. ${dd.name[0].toUpperCase()+dd.name.slice(1)} aboard.`,'bad');
  askOrders(e,sh,'q1');
}
/* every step: overdue decisions, and news that follows an emergency */
function emTick(){
  for(const e of S.emerg||[]){
    if(e.dec&&S.t>=e.dec.until&&(e.k==='quar'||!emShip(e)||emShip(e).state!=='sea'))emDecide(e,null,'master');
    if(e.later&&e.later.length){const due=e.later.filter(l=>l.at<=S.t);if(due.length){e.later=e.later.filter(l=>l.at>S.t);
      for(const l of due){emSay(e,null,l.txt,l.kind,l.via);}}}
  }
}
/* the office learns of a silent ship's emergency only when someone sees her rockets */
function emHourly(e,sh,step){
  if(e.known||e.over)return;
  if(shipsNear(shipXY(sh),20,sh).some(n=>n.radio)&&Math.random()<0.5*step*24){e.known=true;
    emSay(e,null,`Passing steamer reports rockets and distress signals from SS ${e.ship} ${posText(sh)}. Standing by.`,'bad','Relayed by a passing ship');
    if(typeof UI!=='undefined'&&emBig(e)){UI.emOpen=e.id;UI.emMin=false;}}
}

/* ---------- the emergency window ---------- */
function emergencyHTML(){
  const L=(S.emerg||[]).filter(e=>e.known&&(!e.over||S.t-e.t1<3));
  if(!L.length||(S.dis&&S.dis.state==='rival'&&!L.some(x=>!x.over)))return disRivalHTML();
  const e=L.find(x=>x.id===UI.emOpen)||L.find(x=>!x.over)||L[0];
  const asking=L.some(x=>x.dec&&x.dec.owner);
  if(UI.emMin||!L.some(x=>emBig(x)||x.id===UI.emOpen))return `<button class="empill${L.some(emBig)?'':' minor'}" data-act="emshow">${asking?'Orders wanted':!L.some(emBig)?'Incident':L.some(x=>!x.over)?'Emergency':'Emergency over'}: SS ${esc(e.ship)}</button>`;
  const D=EMERG[e.k],sh=emShip(e),hrs=Math.max(0,((e.t1||S.t)-e.t0)*24);
  const tabs=L.length>1?`<div class="emtabs">${L.map(x=>`<button data-act="emtab" data-id="${x.id}" aria-pressed="${x.id===e.id}">SS ${esc(x.ship)}${x.dec&&x.dec.owner?' ●':''}</button>`).join('')}</div>`:'';
  const log=`<div><span class="lbl">Signals</span><div class="em-log">${e.lines.map(l=>`<div><time>${hhmm(l.t)}</time> <span class="meta">${esc(l.via)}</span><br>${esc(l.txt)}</div>`).join('')}</div></div>`;
  const dec=e.dec&&e.dec.owner&&sh?decHTML(e,sh):'';
  const radio=sh&&radioOf(sh);
  if(D.type==='quar'){
    return `<div class="emerg${e.over?' done':''}" role="dialog" aria-label="Quarantine">
    <div class="em-head"><div><span class="eyebrow">Port health · ${hhmm(e.t0)} ${dateLong(e.t0)}</span><h3>SS ${esc(e.ship)}: quarantine at ${esc(e.where)}</h3></div>
      <button class="btn" data-act="emmin">Minimise</button></div>${tabs}
    <div class="em-body">${dec}${log}${e.over?`<button class="btn" data-act="emclose" data-id="${e.id}">Close</button>`:''}</div></div>`;}
  const gname={water:'Water',fire:'Fire',sick:'Sickness',unrest:'Unrest'}[D.type];
  const aboard=sh?`${int(soulsOf(sh))} passengers and about ${int(crewOf(sh))} crew aboard.`:'';
  const title=D.type==='sick'?`${DISEASE[e.dis].name[0].toUpperCase()+DISEASE[e.dis].name.slice(1)} aboard`:D.name;
  const state=e.over==='saved'?'Over. She was saved.':e.over==='beached'?'Over. She was beached.':e.over==='lost'?`Over. She was lost${e.dead?', with '+e.dead+' lives':''}.`
    :e.seized?'The ship has been seized. Waiting for the navy.':e.abandon?'Abandoning ship.':e.beach?'Running for the shore.':e.threat>60?'Losing the fight.':e.ctrl>70?'Getting on top of it.':'Fighting it.';
  const resp=e.resp.length?e.resp.map(r=>`<li>${r.navy?esc(r.name):(r.tug?'Tug ':'SS ')+esc(r.name)} <span class="meta">${r.navy?'navy':esc(r.line)}${r.own?' · yours':''}</span><span class="num">${r.arrived||S.t>=r.eta?'alongside':Math.max(1,Math.round((r.eta-S.t)*24))+' h away'}</span></li>`).join(''):`<li class="meta">${D.sos?'No ship has answered.':'No help needed at sea.'}</li>`;
  return `<div class="emerg${e.over?' done':''}" role="dialog" aria-label="Emergency">
    <div class="em-head"><div><span class="eyebrow">${e.over?'Emergency over':'Emergency'} · ${hhmm(e.t0)} ${dateLong(e.t0)}</span><h3>SS ${esc(e.ship)}: ${title}</h3></div>
      <button class="btn" data-act="emmin">Minimise</button></div>${tabs}
    <div class="em-body">
      <p class="em-state"><strong>${state}</strong> ${Math.floor(hrs)} h ${Math.round((hrs%1)*60)} min since the first signal, ${e.where}. ${aboard}</p>
      ${dec}
      <div class="em-gauges"><div><span class="lbl">${gname}</span><div class="bar"><i class="${e.threat>60?'low':e.threat>30?'mid':''}" style="width:${Math.round(e.threat)}%"></i></div></div>
        <div><span class="lbl">Crew in control</span><div class="bar"><i style="width:${Math.round(e.ctrl)}%"></i></div></div></div>
      <div><span class="lbl">Answering the call</span><ul class="em-resp">${resp}</ul></div>
      ${log}
      ${!e.over?`<div class="em-orders"><span class="lbl">From the office</span>${radio?`<div class="em-opts">${sh?officeOpts(e,sh).map(([id,o])=>`<button class="em-opt" data-act="emoffice" data-id="${e.id}" data-o="${id}"><b>${esc(o.label)}</b><span>${esc(o.hint(e,sh))}</span></button>`).join(''):''}</div><button class="btn quiet" data-act="emreport" data-id="${e.id}">Ask for a report</button>`:'<p class="note">She has no wireless. The office cannot reach her; the master decides alone.</p>'}</div>`:''}
      ${!e.over?`<p class="note">${UI.emNormal?'The clock is at normal speed.':e.dec&&e.dec.owner?'The clock is all but stopped while the master waits for your orders.':'The clock runs at one hour a second until this is over.'} <button class="btn quiet" data-act="emspeed">${UI.emNormal?'Slow it down again':'Run at normal speed'}</button></p>`:`<button class="btn" data-act="emclose" data-id="${e.id}">Close</button>`}
    </div></div>`;
}
function decHTML(e,sh){
  const k=e.dec.k,left=Math.max(0,(e.dec.until-S.t)*24),opts=decOpts(e,sh,k);
  return `<div class="em-dec"><span class="lbl">${DECIDE[k].who||'The master asks'}</span><p class="em-q">${esc(DECIDE[k].q)}</p>
    <div class="em-opts">${opts.map(([id,o])=>`<button class="em-opt" data-act="emorder" data-id="${e.id}" data-o="${id}"><b>${esc(o.label)}${id===e.dec.dflt?' <span class="meta">his own choice</span>':''}${o.owner?' <span class="meta">only the office can</span>':''}</b><span>${esc(o.hint(e,sh))}</span></button>`).join('')}</div>
    <p class="note">No order within ${left>=1?Math.floor(left)+' h '+Math.round((left%1)*60)+' min':Math.round(left*60)+' min'} and ${k==='q1'?'the master':'he'} will ${esc(DECIDE[k].opts[e.dec.dflt].label.toLowerCase())}.</p></div>`;
}
function emOrder(kind,id,o){
  const e=(S.emerg||[]).find(x=>x.id===id);if(!e||e.over)return;const sh=emShip(e);if(!sh)return;
  if(kind==='office'){const q=OFFICE[o];if(!q||!officeOpts(e,sh).some(x=>x[0]===o))return;(e.office=e.office||{})[o]=true;
    emSay(e,null,`Owners. ${q.label}.`,'','Morven Line, head office');emSay(e,sh,q.fx(e,sh),'');e.orders.push({k:'office',id:o,by:'owner',t:S.t});return;}
  if(kind==='order'){if(!e.dec||!e.dec.owner||!DECIDE[e.dec.k].opts[o])return;if(!decOpts(e,sh,e.dec.k).some(x=>x[0]===o))return;emDecide(e,o,'owner');return;}
  if(kind==='report')emSay(e,sh,EMERG[e.k].type==='sick'?`${sickNow(e,sh)} ill. ${e.dead?e.dead+' dead so far. ':''}${e.threat>50?'Spreading.':'Holding.'}`
    :`${EMERG[e.k].type==='water'?'Water':EMERG[e.k].type==='fire'?'Fire':'Trouble'} ${e.threat>75?'winning':e.threat>50?'gaining':e.threat>25?'held for now':'under control'}. ${e.resp.filter(r=>r.arrived).length} ships with us. ${e.threat>60?'Grave.':'Holding.'}`,'');
}
