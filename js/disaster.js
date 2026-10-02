/* ================= BOATS, THE WIRELESS WATCH, THE 1912 DISASTER AND THE NEGLIGENCE ENDING =================
   - Lifeboats are part of every ship. Before 1913 the law asks only for the old tonnage scale (16 boats, room for about
     960 people, on any ship of 10,000 tons or more); an owner may fit boats for all at any time. From July 1913 British
     law requires boats for everyone aboard: a ship without them may carry only as many as her boats hold.
   - The wireless watch: a ship with a set keeps it by day; a second operator keeps it through the night. Before the
     London Convention most ships' operators go to bed, and a call for help at night may go unheard.
   - The 1912 disaster: the one scripted event. Every giant of 40,000 tons or more on the North Atlantic in late March to
     early May 1912 is a candidate. It falls on the worst-run: a rival's new giant always fits well, so the player's is
     chosen only if she is run as badly or worse. She is always lost.
   - The negligence ending: a court that finds gross negligence with lives lost takes away the insurance and the limit on
     claims. A line that cannot pay them is wound up.
   Games begun in January 1921 (before 0.22) keep their rules: boats for all and a night watch are long since law. */
const BOAT_NEWS=ym(1912,9),BOAT_LAW=ym(1913,6),CONV_SIGN=ym(1914,0),WATCH_LAW=ym(1914,6);
const DIS_GRT=40000,RIVAL_FIT=6.1;

/* ---------- lifeboats ---------- */
/* the old Board of Trade scale: 960 people for any ship of 10,000 tons or more, fewer for smaller ships */
const boatScale=g=>g>=10000?960:Math.max(150,Math.round(960*g/10000/10)*10);
const hasBoats=sh=>!newCal()||!!(sh.up&&sh.up.boats);
const boatCap=sh=>hasBoats(sh)?Infinity:boatScale(sh.grt);
const fullSouls=sh=>paxBerths(sh)+crewOf(sh);
/* the share of those aboard (by default, as she sails now) who could find a place in her boats */
const boatCover=(sh,n)=>{n=n===undefined?soulsOf(sh)+crewOf(sh):n;return n>0?Math.min(1,boatCap(sh)/n):1;};
const boatLaw=()=>newCal()&&S.m>=BOAT_LAW;
/* under the law, a ship without boats for all may carry only as many passengers as her boats hold, after her crew */
const boatPaxMax=sh=>boatLaw()&&!hasBoats(sh)?Math.max(0,boatScale(sh.grt)-crewOf(sh)):Infinity;
const boatPaxF=sh=>{const mx=boatPaxMax(sh);if(mx===Infinity)return 1;const b=paxBerths(sh);return b?Math.min(1,mx/b):1;};

/* ---------- the wireless watch ---------- */
const isNight=t=>{const h=((t%1)+1)%1*24;return h>=22||h<6;};
const watchForced=sh=>newCal()&&S.m>=WATCH_LAW&&paxBerths(sh)>0;
const nightOn=sh=>radioOf(sh)&&(!newCal()||!!sh.nightWatch||watchForced(sh));
/* the second operator's wage, a month */
const watchCost=sh=>newCal()&&nightOn(sh)?16.8*PX()*slumpK('wage'):0;
/* does a ship that is in range hear a call for help? By day, yes. At night, only if someone is listening */
function hearsNow(n){
  if(!newCal()||S.m>=WATCH_LAW||!isNight(S.t))return true;
  if(n.own){const x=S.ships.find(y=>y.name===n.name);return !!x&&nightOn(x);}
  return Math.random()<0.35;
}

/* ---------- the rules that follow the disaster ---------- */
const NORTH_P=['HAL','SJN','NYC','QBC','MTL'];
const northGeo=gk=>GEO(gk).calls.some(c=>NORTH_P.includes(c[0]));
/* the longer track: the southern spring track after ice, slower in fog after a collision */
function trackF(gk,m){
  if(!newCal()||!S.dis||!S.dis.rule||!gk)return 1;const mm=m%12;
  if(S.dis.rule==='ice')return mm>=2&&mm<=5&&northGeo(gk)?1.04:1;
  if(S.dis.rule==='collision'&&S.m>=CONV_SIGN)return 1.01;
  return 1;
}
/* how much rarer each kind of accident becomes */
function ruleRisk(k){
  if(!newCal()||!S.dis||!S.dis.rule)return 1;
  if(k==='ice'&&S.dis.rule==='ice')return 0.4;
  if(k==='collision'&&S.dis.rule==='collision'&&S.m>=CONV_SIGN)return 0.6;
  if(k==='wreck'&&S.dis.rule==='derelict'&&S.m>=CONV_SIGN)return 0.4;
  return 1;
}
/* first class is nervous of the giants for a while after the loss */
const giantShy=(sh,c)=>c==='f'&&sh.grt>=DIS_GRT&&S.dis&&S.dis.fin&&newCal()&&S.m<ym(1914,0)?0.92:1;

/* ---------- which ship ---------- */
/* how well a ship fits the disaster: few boats for those aboard, neglected drills, a driven schedule, a thin crew,
   no watch at night, a careless master. The rival's giant scores RIVAL_FIT */
function disFit(sh){
  let f=(1-boatCover(sh,fullSouls(sh)))*3;
  f+=[1.5,0.8,0][S.safety??1];
  f+=[0,0.5,1.2][sh.speed??1];
  if((sh.morale??60)<50)f+=0.6;
  if(cwSk(sh,'deck')<45)f+=0.6;
  if(!nightOn(sh))f+=0.8;
  if(has(sh,'drinker'))f+=1;if(has(sh,'driver'))f+=0.5;if(has(sh,'cautious'))f-=0.8;
  if((sh.safety||1)<1)f-=0.5;
  return f;
}
const disNA=rk=>!!rk&&ROUTES[rk]&&ROUTES[rk].group==='North Atlantic'&&!ROUTES[rk].cruise;
const disMine=()=>S.ships.filter(x=>x.grt>=DIS_GRT&&disNA(x.line)&&x.state!=='laid'&&disFit(x)>=RIVAL_FIT);
function midOcean(sh){if(sh.state!=='sea'||!sh.geo||!disNA(sh.legRoute||sh.line))return false;const f=sh.pos/GEO(sh.geo).dist;return f>0.08&&f<0.92;}
/* how she is lost, by where she is: fog on the busy approaches, ice at night on the northern tracks, or a derelict */
function disWay(gk,pos,p){
  const d=GEO(gk).dist;if(pos<280||d-pos<280)return 'collision';
  const lon=p?latLon(p.x,p.y).lon:-48; // the ice comes down past the Grand Banks, west of about 38 degrees
  if(northGeo(gk)&&[2,3,4,5].includes(S.m%12)&&lon<-38&&Math.random()<0.85)return 'ice';
  return 'derelict';
}
const DIS_HOUR={ice:23.67,collision:19.2,derelict:22.9};
const DIS_EM={ice:'ice',collision:'collision',derelict:'wreck'};
const posOf=p=>{const q=latLon(p.x,p.y);return `${Math.round(Math.abs(q.lat))}${q.lat>=0?'N':'S'} ${Math.round(Math.abs(q.lon))}${q.lon<0?'W':'E'}`;};
const stationAt=p=>latLon(p.x,p.y).lon<-38?'Cape Race':'Valentia';

/* ---------- each month: the timetable, the laws, the underwriters' letters, the trial ---------- */
function disasterMonth(){
  const m=S.m;
  if(S.trial&&S.t>=S.trial.at)trialVerdict();
  // the underwriters write about a ship whose loss would go very badly at an inquiry (all games)
  for(const sh of S.ships){if(sh.state==='laid')continue;const b=potBlame(sh);
    if(b.blame>=6&&!(sh.gwarn>m-12)){sh.gwarn=m;news(`The underwriters write about SS ${sh.name}: ${b.F.slice(0,3).join('; ')}. If she were lost with lives now, a court would call it gross negligence, and they would not pay.`,'bad',true);}}
  if(!newCal())return;
  greatMonth();
  if(m===ym(1912,2)&&!S.dis){const d=24+Math.floor(Math.random()*30);S.dis={state:'wait',from:Math.floor(S.t)+d,until:Math.floor(S.t)+d+7};}
  if(m===BOAT_NEWS)news(`The Board of Trade rules that from July 1913 every British ship must carry boats for everyone aboard. A ship without them will carry only as many as her boats hold. Fitting them takes about a week in the yard.`,'bad',true);
  if(m===ym(1913,4)){const n=S.ships.filter(x=>!hasBoats(x)&&paxBerths(x)>0).length;
    if(n)news(`${n} of your ships still lack boats for all. From July they may carry only as many passengers as their boats hold.`,'bad',true);}
  if(m===BOAT_LAW)news('Boats for all are now the law for British ships.','hist');
  if(m===CONV_SIGN)news(`The maritime nations sign the Convention for the Safety of Life at Sea in London: boats for all, boat drills, and from July a wireless watch day and night on every passenger ship.${S.dis&&S.dis.rule==='collision'?' Ships must slow in fog and double their lookouts.':S.dis&&S.dis.rule==='derelict'?' Wrecks adrift must be reported and removed.':''}`,'hist',true);
  if(m===WATCH_LAW){const n=S.ships.filter(x=>radioOf(x)&&paxBerths(x)>0&&!x.nightWatch).length;
    news(`The wireless watch is now kept day and night on passenger ships.${n?` ${n} of your ships take on a second operator.`:''}`,'hist');}
}

/* ---------- each day: choose the ship, the Board of Trade's inspections, the headlines ---------- */
function disasterDaily(){
  botInspect();
  const D=S.dis;if(!D||!newCal())return;
  // its moment passes: a save from before 0.35.5 that never ran the story does not sink a ship years late (0.35.6)
  if(D.state==='wait'&&D.until&&S.t>D.until+60){D.state='none';return;}
  if(D.state==='wait'&&S.t>=D.from)disChoose();
  if(D.heads&&D.heads.length){const due=D.heads.filter(h=>h.at<=S.t);if(due.length){D.heads=D.heads.filter(h=>h.at>S.t);for(const h of due)news(h.txt,'hist');}}
}
function disChoose(){
  const D=S.dis,mine=disMine();
  if(mine.length){const at=mine.filter(x=>midOcean(x)&&!x.em).sort((a,b)=>disFit(b)-disFit(a));
    if(at.length){const sh=at[0],kn=knotsOf(sh)*SPD[sh.speed]*24,g=GEO(sh.geo);
      const way=disWay(sh.geo,clamp(sh.pos+kn*0.95,0,g.dist),shipXY(sh));
      Object.assign(D,{state:'armed',own:true,sid:sh.id,way,t0:Math.floor(S.t)+DIS_HOUR[way]/24});
      if(way==='ice')disWarnings(sh);
      return;}
    if(S.t<D.until){return;}}
  // the rival's giant: the newest on the North Atlantic, else the largest ship there
  let x=S.rships.find(y=>y.id===D.rid);
  if(!x){const na=S.rships.filter(y=>disNA(y.route));
    x=na.find(y=>y.name==='Hyperborean')||na.filter(y=>y.grt>=DIS_GRT).sort((a,b)=>b.built-a.built)[0]||na.sort((a,b)=>b.grt-a.grt)[0];
    if(!x){D.state='none';return;}
    const gk=geoKey(x.route,S.m),R=Math.random();D.rid=x.id;D.rway=northGeo(gk)?(R<0.6?'ice':R<0.85?'collision':'derelict'):(R<0.55?'collision':'derelict');}
  // she meets it where it lies: the ice off the Grand Banks, fog on the approaches, a derelict in open water
  const q=rivalPos(x),v=x.v;let fits=false;
  if(q&&!q.inPort&&v&&!v.repo){const d=GEO(v.gk).dist,lon=latLon(q.x,q.y).lon;
    fits=D.rway==='collision'?(v.pos<280||d-v.pos<280):D.rway==='ice'?(lon<-40&&lon>-56):(v.pos>=280&&d-v.pos>=280);}
  if(!fits&&S.t<D.until+8)return;
  Object.assign(D,{state:'armed',own:false,way:D.rway,t0:Math.floor(S.t)+DIS_HOUR[D.rway]/24});
}
/* the day's ice warnings, passed on by other ships */
function disWarnings(sh){
  const ow=S.rships.filter(x=>disNA(x.route)).map(x=>x.name);const pick=()=>ow.length?ow[Math.floor(Math.random()*ow.length)]:'a westbound steamer';
  const at=[9.2,13.7,19.6];S.wireQ=S.wireQ||[];
  for(const h of at)S.wireQ.push({id:S.wireNext=(S.wireNext||0)+1,t:Math.floor(S.t)+h/24,at:Math.floor(S.t)+h/24,ship:sh.name,sid:sh.id,
    txt:telegram(`Master to owners. SS ${pick()} reports bergs, growlers and field ice ahead of us on the track. ${sh.speed===2?'Maintaining full speed.':'Proceeding.'}`),k:'',via:stationFor(sh)+' Radio'});
}

/* ---------- each step: the strike, and the rival's sinking ---------- */
function disasterStep(step){
  const D=S.dis;if(!D)return;
  if(D.state==='armed'&&S.t>=D.t0)return D.own?fireOwn():fireRival();
  if(D.state==='rival')rivalTick();
  if(D.state==='after'&&D.showAt&&S.t>=D.showAt){D.showAt=null;D.show=true;
    if(typeof UI!=='undefined'){UI.dirty=true;UI.emMin=true;UI.disOpen=false;if(UI.autoPause!==false){UI.disPrev=UI.speed;UI.speed=0;}}}
}
function fireOwn(){
  const D=S.dis,sh=S.ships.find(x=>x.id===D.sid);
  if(!sh||sh.state!=='sea'||sh.em||!midOcean(sh)){D.state='wait';D.from=Math.floor(S.t)+1;D.until=Math.max(D.until,D.from+3);return;}
  const e=startEmergency(sh,DIS_EM[D.way]);
  e.doom=true;e.sev=3;e.rateM=SEV_RATE[3];e.threat=Math.max(e.threat,SEV_T0[3]);e.doomAt=S.t+(2.4+Math.random()*0.4)/24;e.warned=D.way!=='derelict';
  // nobody reaches her in time: the ship she struck is crippled, the others are hours away
  if(D.way==='collision'&&e.resp[0]&&e.resp[0].arrived)e.resp[0].hurt=true;
  for(const r of e.resp){if(r.navy||r.tug)continue;r.arrived=false;r.eta=Math.max(r.eta,e.doomAt+(r.hurt?1.1:1.4+Math.random())/24);}
  if(!e.resp.some(r=>!r.navy&&!r.tug&&!r.hurt)){const o=S.rships.filter(x=>disNA(x.route))[0];const d=52+Math.random()*18;
    e.resp.push({name:o?o.name:'Carolan',line:o?RIVALS[o.owner].name:'a Cunard-built steamer',radio:true,eta:e.doomAt+(1.6+Math.random()*0.3)/24,arrived:false,d});}
  Object.assign(D,{state:'live',eid:e.id,name:sh.name,where:e.where,t0:S.t});
}
function fireRival(){
  const D=S.dis,x=S.rships.find(y=>y.id===D.rid);if(!x){D.state='wait';D.from=S.t;D.until=S.t;return;}
  let p=null;const q=rivalPos(x);
  if(q&&!q.inPort&&x.v&&!x.v.repo&&disNA(x.route)&&(D.way!=='ice'||latLon(q.x,q.y).lon<-38))p={x:q.x,y:q.y};
  if(!p){const gk=geoKey(x.route,S.m),g=GEO(gk),am=NORTH_P.includes(g.calls[0][0]);
    const fr=D.way==='collision'?(am?0.05:0.95):D.way==='ice'?(am?0.3:0.7):0.5;const pt=pointOn(CHART.routes[gk],g.dist*fr);p={x:pt.x,y:pt.y};}
  const pax=Math.round(((x.berths.f||0)+(x.berths.s||0)+(x.berths.t||0))*(0.68+Math.random()*0.08)),crew=Math.round(x.grt/45)+40;
  const others=S.rships.filter(y=>y!==x&&disNA(y.route)),o=others[Math.floor(Math.random()*others.length)];
  const rd=50+Math.random()*20;
  Object.assign(D,{state:'rival',own:false,name:x.name,owner:x.owner,rk:x.route,grt:x.grt,p,where:posOf(p),t0:S.t,aboard:pax+crew,crew,cap:boatScale(x.grt),
    sinkAt:S.t+(2.4+Math.random()*0.4)/24,resc:{name:o?o.name:'Carolan',line:o?RIVALS[o.owner].name:'a passing steamer',d:rd},log:[],step:0,near:[],sunk:false,
    deaf:Math.random()<0.7?11+Math.random()*9:null,station:stationAt(p)});
  D.resc.eta=D.sinkAt+(1.5+Math.random()*0.4)/24;
  for(const n of shipsNear(p,150,null).filter(n=>n.own)){const sh=S.ships.find(y=>y.name===n.name);if(!sh)continue;
    const hears=radioOf(sh)&&(!isNight(S.t)||nightOn(sh));
    if(hears)D.near.push({sid:sh.id,name:sh.name,d:Math.round(n.d),sent:false,eta:null,arrived:false});
    else if(n.d<rd)D.deaf=Math.min(D.deaf||1e9,n.d);}
  const first={ice:'Struck iceberg. Require immediate assistance.',collision:`In collision in fog with an unknown steamer. Holed forward. Require immediate assistance.`,derelict:'Struck a derelict at speed. Holed forward. Require immediate assistance.'}[D.way];
  disSay(`CQD SOS. SS ${D.name} ${D.where}. ${first}`,'bad');
  disSay(`Answering: SS ${D.resc.name} (${D.resc.line}), about ${Math.round(rd)} miles off, coming hard.${D.near.length?` Your ${D.near.map(n=>'SS '+n.name).join(' and ')} heard the call.`:''}`,'',D.station+' Radio');
  news(`SS ${D.name} of the ${RIVALS[D.owner].name} is sending distress calls ${D.where}.`,'bad');
  if(typeof UI!=='undefined'){UI.disOpen=true;UI.disMin=false;UI.dirty=true;}
}
function disSay(txt,kind,via){
  const D=S.dis,m={id:S.wireNext=(S.wireNext||0)+1,t:S.t,ship:D.name,sid:null,txt:telegram(txt),k:kind||'',via:via||`SS ${D.name}'s wireless, heard at ${D.station}`};
  D.log.unshift({t:S.t,txt:m.txt,via:m.via});deliverWire(m);
}
const RIVAL_PREP=0.22; // the rival's giant: the legal minimum of boats, drills to the rules, a crew driven for speed
function rivalTick(){
  const D=S.dis,h=(S.t-D.t0)*24;
  if(D.step===0&&h>=0.6){D.step=1;disSay('We are putting the women and children off in the boats.','bad');}
  if(D.step===1&&h>=1.6){D.step=2;disSay('Engine room flooding. Cannot last much longer.','bad');}
  if(!D.sunk&&S.t>=D.sinkAt){D.sunk=true;disSay(`SOS SOS. SS ${D.name} sinking.`,'bad');
    disSay(`Signals from SS ${D.name} ceased ${hhmm(S.t)}.`,'bad',D.station+' Radio');
    const x=S.rships.find(y=>y.id===D.rid);
    if(x){S.rships=S.rships.filter(y=>y!==x);RW_CACHE.k=null;S.rmoves.unshift({m:S.m,o:x.owner,rk:x.route,kind:'lost',ship:x.name});if(S.rmoves.length>40)S.rmoves.length=40;
      if(coAlive(x.owner))coPay(x.owner,Math.round(coShipVal(x)*0.35));}}
  for(const n of D.near)if(n.sent&&!n.arrived&&S.t>=n.eta){n.arrived=true;const sh=S.ships.find(y=>y.id===n.sid);
    const early=S.t<D.resc.eta;S.rep=clamp(S.rep+(early?3:1),0,100);
    disSay(early?`SS ${n.name} at the position. Picking up survivors from the boats and the water.`:`SS ${n.name} at the position. SS ${D.resc.name} has the survivors. Searching the wreckage.`,early?'good':'',`SS ${n.name}'s wireless`);
    if(sh&&!early)sh.stopLeft=Math.min(sh.stopLeft,0.3);}
  if(!D.fin&&S.t>=D.resc.eta)rivalEnd();
}
/* the Line sends one of its own ships */
function disSend(sid){
  const D=S.dis;if(!D||D.state!=='rival'||D.fin)return;const n=D.near.find(q=>q.sid===sid),sh=S.ships.find(y=>y.id===sid);if(!n||n.sent||!sh||sh.state!=='sea')return;
  const kn=knotsOf(sh)*SPD[2]*shipMods(sh).speed;n.sent=true;n.eta=Math.max(S.t+n.d/kn/24,D.sinkAt+0.25/24);
  sh.stopLeft=Math.max(sh.stopLeft||0,(n.eta-S.t)*2+0.4); // there, the search, and back to her track
  disSay(`Owners to SS ${n.name}. Go to her at full speed.`,'','Morven Line, head office');
  disSay(`SS ${n.name} turned for SS ${D.name}. About ${Math.max(1,Math.round((n.eta-S.t)*24))} h.`,'',`SS ${n.name}'s wireless`);
}
function rivalEnd(){
  const D=S.dis,early=D.near.filter(n=>n.arrived).length;
  const death=clamp(0.67-0.34*RIVAL_PREP+(Math.random()-0.5)*0.04-0.06*early,0.33,0.67);
  D.lost=Math.round(D.aboard*death);D.saved=D.aboard-D.lost;D.nearD=Math.round(Math.min(D.resc.d,...D.near.filter(n=>n.sent).map(n=>n.d)));
  disSay(`SS ${D.resc.name} has picked up ${int(D.saved-(early?Math.round(D.aboard*0.06*early):0))} survivors from the boats of SS ${D.name}.${early?` Your ships have ${int(Math.round(D.aboard*0.06*early))} more.`:''} ${int(D.lost)} lost.`,'bad',`SS ${D.resc.name}'s wireless`);
  disFinish();
}
/* the Line's own giant: she is lost; what the owners did before decides how many die */
function disDeath(sh,e){
  const cover=boatCover(sh),p=0.4*clamp((cover-0.25)/0.75,0,1)+0.2*[0,0.5,1][S.safety??1]+0.15*clamp((cwSk(sh,'deck')-30)/50,0,1)+0.1*(nightOn(sh)?1:0)+0.15*(e.saveA>0?1:0);
  return clamp(0.67-0.34*p+(Math.random()-0.5)*0.04,0.33,0.67);
}
function ownEnd(e,sh,lost,souls,crew){
  const D=S.dis;if(!D||D.eid!==e.id)return;
  const r=e.resp.filter(q=>!q.navy&&!q.tug&&!q.hurt).sort((a,b)=>a.eta-b.eta)[0];
  Object.assign(D,{aboard:souls+crew,lost,saved:souls+crew-lost,cap:hasBoats(sh)?souls+crew:boatScale(sh.grt),boatsAll:hasBoats(sh),
    nearD:Math.round(r&&r.d?r.d:Math.max(20,(r?r.eta-S.t:0.1)*24*15)),deaf:e.deaf&&(!r||!r.d||e.deaf<r.d)?e.deaf:null,owner:'morven',rk:sh.legRoute||sh.line,grt:sh.grt});
  const at=r?Math.max(0.5,(r.eta-S.t)*24+0.3):3;
  emLater(e,at,`${r?'SS '+r.name:'A passing steamer'} has picked up ${int(D.saved)} survivors from the boats of SS ${e.ship}. ${int(lost)} lost.`,'bad',r?`SS ${r.name}'s wireless`:'Coast station');
  D.state='after';D.finAt=S.t+at/24;D.showAt=D.finAt+0.02;disFinish(true);
}
function disFinish(own){
  const D=S.dis;D.fin=true;if(!own){D.state='after';D.showAt=S.t+0.02;}
  D.rule=D.way;(S.retired=S.retired||[]).push(D.name);S.quietUntil=S.t+28;
  const line=D.owner==='morven'?'the Morven Line':RIVALS[D.owner]?RIVALS[D.owner].name:'her owners';
  const d0=Math.floor((own?D.finAt:S.t));
  D.heads=[{at:d0+1,txt:`SS ${D.name} of ${line} has been lost ${D.where}. ${int(D.aboard)} people were aboard; ${int(D.lost)} were lost. The newspapers print nothing else.`},
    {at:d0+9,txt:`Courts of inquiry into the loss of SS ${D.name} are called in London and Washington.`},
    ...(D.way==='ice'?[{at:d0+30,txt:'The lines agree a southern track for the spring crossings, well clear of the ice, and the navies send cruisers to watch the Grand Banks. Crossings on the northern routes are about 4% longer from March to June.'}]:[])];
}
/* the Line's ships that hear, near a rival's disaster */
function disRivalHTML(){
  const D=S.dis;if(!D||D.state!=='rival'&&!(D.state==='after'&&!D.own&&!D.show&&UI.disOpen&&S.t-D.t0<1))return '';
  if(UI.disMin)return `<button class="empill" data-act="disshow">Distress: SS ${esc(D.name)}</button>`;
  const hrs=Math.max(0,(S.t-D.t0)*24);
  const state=D.fin?`Over. She was lost with ${int(D.lost)} of the ${int(D.aboard)} aboard.`:D.sunk?'She has gone. Ships are steaming for the boats.':'She is sinking by the head.';
  const near=D.near.length?D.near.map(n=>`<li>SS ${esc(n.name)} <span class="meta">yours · ${n.d} miles</span><span class="num">${n.arrived?'at the position':n.sent?Math.max(1,Math.round((n.eta-S.t)*24))+' h away':D.fin?'':`<button class="btn" data-act="dissend" data-id="${n.sid}">Send her</button>`}</span></li>`).join('')
    :'<li class="meta">None of your ships is near enough to help, or none heard her.</li>';
  const log=`<div><span class="lbl">Signals</span><div class="em-log">${D.log.map(l=>`<div><time>${hhmm(l.t)}</time> <span class="meta">${esc(l.via)}</span><br>${esc(l.txt)}</div>`).join('')}</div></div>`;
  return `<div class="emerg${D.fin?' done':''}" role="dialog" aria-label="Distress call">
    <div class="em-head"><div><span class="eyebrow">Wireless room · ${hhmm(D.t0)} ${dateLong(D.t0)}</span><h3>SS ${esc(D.name)}, ${esc(RIVALS[D.owner]?RIVALS[D.owner].name:'')}</h3></div>
      <button class="btn" data-act="dismin">Minimise</button></div>
    <div class="em-body"><p class="em-state"><strong>${state}</strong> ${Math.floor(hrs)} h ${Math.round((hrs%1)*60)} min since the first call, ${D.where}. About ${int(D.aboard)} aboard.</p>
      <div><span class="lbl">Your ships</span><ul class="em-resp">${near}</ul>
      <p class="note">A ship you send loses the time there and back, and the voyage is late. She cannot save the ship; she can save people from the boats and the water.</p></div>
      <div><span class="lbl">Answering the call</span><ul class="em-resp"><li>SS ${esc(D.resc.name)} <span class="meta">${esc(D.resc.line)}</span><span class="num">${S.t>=D.resc.eta?'at the position':Math.max(1,Math.round((D.resc.eta-S.t)*24))+' h away'}</span></li></ul></div>
      ${log}${D.fin?'<button class="btn" data-act="disclose">Close</button>':''}</div></div>`;
}
/* the aftermath: one page, the same whoever owned her */
function disModalHTML(){
  const D=S.dis,own=D.owner==='morven';
  const way={ice:'Warnings of ice had reached her by wireless during the day. She kept her speed.',collision:'The fog had lain on the approaches since dusk. She kept her speed.',derelict:'The wreck she struck had been reported adrift for weeks. It was no one\'s job to remove it.'}[D.way];
  const extra={ice:'Ships on the northern routes take a longer southern track in spring, and warships watch the ice on the Grand Banks.',collision:'Ships must slow in fog and double their lookouts.',derelict:'Wrecks adrift must be reported and removed.'}[D.way];
  const boats=D.boatsAll?`She carried boats for everyone aboard. Not all of them were filled in time. ${way}`:`She carried boats for ${int(D.cap)}. The law asked for no more, and no one thought to ask for more. ${way}`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="panel aftermath stack" style="gap:10px"><h3 id="mt">The loss of the SS ${esc(D.name)}</h3>
    <p style="margin:0">${dateLong(D.t0)}, ${esc(D.where)}. ${int(D.aboard)} people were aboard. ${int(D.saved)} were saved. ${int(D.lost)} were not.</p>
    <p style="margin:0">${boats}</p>
    <p style="margin:0">The nearest ship to hear her call was ${int(D.nearD)} miles away.${D.deaf?' Another was closer, and no one aboard was listening.':''}</p>
    <p style="margin:0">Most of these deaths were avoidable. Not with better luck, but with rules that already made sense and had not been made.</p>
    <h4 style="margin:6px 0 0">What changes</h4>
    <p style="margin:0">From July 1913 every British passenger ship must carry boats for everyone aboard. From 1914 every passenger ship must drill her crew in lowering them and keep a wireless watch day and night. ${extra}</p>
    <p style="margin:0">Every one of these rules was paid for by the people who were lost with her.</p>
    ${own?'<p style="margin:0">The court of inquiry will sit, and its findings will decide what the Line owes and what its name is worth.</p>':''}
    <button class="btn primary" data-act="disclose">Close</button></div></div>`;
}
function disClose(){const D=S.dis;if(UI.disOpen&&D&&!D.show){UI.disOpen=false;return;}if(D)D.show=false;UI.disOpen=false;if(UI.disPrev>0&&!S.over)UI.speed=UI.disPrev;UI.disPrev=0;}

/* ---------- the Board of Trade's inspections after a censure ---------- */
function botInspect(){
  if(!S.bot||S.t>=S.bot.until)return;
  for(const sh of S.ships){
    if(sh.state!=='port'){sh.botSeen=false;continue;}if(sh.botSeen)continue;sh.botSeen=true;
    const worn=fatOf(sh)>=90,run=sh.cond<45,sour=(sh.morale??60)<30;if(!worn&&!run&&!sour)continue;
    const k=worn?'replate':'dock',why=worn?'her hull is worn out':run?'she is run down':'her crew are close to refusing duty';
    if(sour){sh.portLeft+=3;news(`The Board of Trade detains SS ${sh.name} at ${PN[sh.port]}: ${why}. She may sail when the crew's complaints are met.`,'bad',true);continue;}
    if(S.cash>=refitCost(sh,k)){enterYard(sh,k);news(`The Board of Trade detains SS ${sh.name} at ${PN[sh.port]}: ${why}. She goes to the yard before she may sail again.`,'bad',true);}
    else{sh.portLeft+=7;sh.botSeen=false;news(`The Board of Trade detains SS ${sh.name} at ${PN[sh.port]}: ${why}. She may not sail until she is put right, and the account cannot pay for it.`,'bad',true);}
  }
}

/* ---------- the negligence ending ---------- */
/* what a court would find if she were lost now, with lives */
function potBlame(sh){return blameOf({...lossRecord(sh,null),dead:1});}
function trialVerdict(){
  const t=S.trial;S.trial=null;const conv=Math.random()<0.4;
  news(conv?`The jury convicts the master of SS ${t.name} of manslaughter; he goes to prison. The directors of the Morven Line are acquitted, but the evidence is in every newspaper.`
    :`The master and the directors of the Morven Line are acquitted of manslaughter over SS ${t.name}. The evidence is in every newspaper all the same.`,'bad',true);
  S.rep=clamp(S.rep-(conv?8:4),0,100);
}
function woundUp(){if(S.over)return;S.over='wound';if(typeof UI!=='undefined')UI.speed=0;news('The court winds up the Morven Line.','hist');save();}
/* the last line of the ending: what the Line saved money on */
function woundLesson(F,cover){
  const S2=cover<1?['boats']:[];const on=(re,t)=>{if(F.some(f=>re.test(f))&&!S2.includes(t))S2.push(t);};
  on(/boat drills/,'drills');on(/badly paid/,'wages');on(/poorly trained/,'training');on(/worn out|tired/,'her hull');on(/run down|poorly maintained/,'upkeep');
  on(/no wireless|no watch/,'wireless');S2.splice(3);
  const lst=S2.length>1?S2.slice(0,-1).map(x=>'on '+x).join(', ')+' and on '+S2[S2.length-1]:S2.length?'on '+S2[0]:'';
  return lst?`The Line saved money ${lst}. The sea collected.`:'The Line cut corners. The sea collected.';
}
function woundHTML(){
  const g=S.gross||{};
  return `<h3 id="mt">Wound up</h3>
    <p style="margin:0">The court has wound up the Morven Line. It could not pay the claims for the loss of SS ${esc(g.name||'')}${g.dead?`, in which ${int(g.dead)} people died`:''}.</p>
    ${g.F&&g.F.length?`<p style="margin:0">The court found that ${esc(g.F.slice(0,5).join('; '))}.</p>`:''}
    ${g.total?`<p style="margin:0">Fines, claims without limit, and the insurance the underwriters took back came to ${fmt(g.total)}.</p>`:''}
    <p style="margin:0"><strong>${esc(woundLesson(g.F||[],g.cover))}</strong></p>`;
}

/* ---------- on the ship's panel ---------- */
const safeSum=sh=>`${hasBoats(sh)?'boats for all':'boats for '+int(boatScale(sh.grt))} · ${radioOf(sh)?(nightOn(sh)?'wireless day and night':'wireless by day'):'no wireless'}`;
function safeHTML(sh){
  const n=fullSouls(sh),law=boatLaw();
  const boats=hasBoats(sh)?`<span class="note">Boats for everyone aboard: all ${int(n)} when she is full.</span>`
    :`<span class="${law?'warnline':'note'}">Boats for ${int(boatScale(sh.grt))} of the ${int(n)} aboard when she is full.${law?` Under the law she may carry no more than ${int(boatPaxMax(sh))} passengers until she has boats for all.`:' That is all the law asks, for now.'}</span>
      <button class="btn" data-act="refit" data-d='[${sh.id},"boats"]' style="width:fit-content" ${S.over?'disabled':''}>Boats for all · ${fmt(refitCost(sh,'boats'))}, ${yardDays(sh,'boats')} days</button>`;
  const forced=watchForced(sh);
  const watch=!radioOf(sh)?'<span class="note">She has no wireless: nobody hears her call beyond the range of her rockets, and she hears nobody\'s.</span>'
    :`${forced?'<span class="note">The London Convention requires a watch day and night on passenger ships.</span>':seg('shipset','nightWatch',sh.nightWatch?1:0,['Day only','Day and night'])}
      <span class="note">A second operator keeps the watch through the night, for ${fmt(16.8*PX()*slumpK('wage'))} a month. Without one, a call for help after dark goes unheard, and the ice warnings other ships pass on at night never reach her bridge.</span>`;
  return `<div class="ctl"><span class="lbl">Lifeboats</span>${boats}</div><div class="ctl"><span class="lbl">Wireless watch</span>${watch}</div>`;
}

/* ---------- the great disasters (0.37.1) ----------
   About once a decade from 1920, a passenger ship somewhere is lost with heavy loss of life, and not always in the same
   way: fire (as the Morro Castle burned in 1934), collision (the Empress of Ireland, 1914), foundering with her cargo
   shifted in a gale (the Vestris, 1928), stranding in darkness (the Hong Moh, 1921), and from 1970 armed men among the
   passengers. The ship is chosen across every passenger ship at sea, the rivals' and the Line's, weighted by how she is
   run: a worn, old, badly manned ship without boats for all is several times likelier to be the one. Aboard one of the
   Line's ships it is a grave emergency like any other, and a well-found ship with a good master may yet come through.
   Aboard a rival's she is lost; for half a year after, fewer people book on that trade (greatFear). */
const GREAT_FROM=1920;
const GREAT={
  fire:{em:'fire',lost:'burns out',dead:0.3,how:'Fire broke out in a writing room in the small hours and ran through her panelling before the alarm was raised.'},
  collision:{em:'collision',lost:'sinks after a collision in fog',dead:0.55,how:'A collier struck her amidships in fog; she rolled over in fourteen minutes, before most of her boats could be lowered.'},
  founder:{em:'seam',lost:'founders in a gale',dead:0.3,how:'Her cargo shifted in a gale and she took a list she could not recover; she was abandoned too late, and the boats were badly handled.'},
  stranding:{em:'wreck',lost:'is wrecked on a reef',dead:0.4,how:'She ran onto a reef in darkness, off her course, and broke her back in the surf.'},
  hijack:{em:'piracy',from:1970,lost:'is seized by armed men',dead:0.02,how:'Armed men who boarded as passengers seized her bridge and held her for days.'}};
const greatDecade=y=>Math.max(GREAT_FROM,Math.floor(y/10)*10);
function greatPlan(fromYear){const d=greatDecade(fromYear),a=Math.max(ym(d,0),S.m+3),b=ym(d+10,0);return a<b?a+Math.floor(Math.random()*(b-a)):b+Math.floor(Math.random()*120);} // never in the first months after a save from before 0.37.1 is loaded (0.37.2)
/* how likely a ship is to be the one: the Line's ships by how they are kept and manned; a rival's is an average ship */
function greatRisk(sh){
  return (sh.cond<50?1.6:sh.cond<65?1.2:0.8)*(fatOf(sh)>75?1.6:1)*(hasBoats(sh)?1:1.5)*(radioOf(sh)?1:1.3)*((sh.morale||60)<45?1.3:1)*(sh.captain&&sh.captain.exp>=12?0.85:1);}
function greatMonth(){
  if(!newCal())return;const m=S.m,y=Math.floor(yearOfM(m));if(y<GREAT_FROM)return; // nothing drawn before 1920, so earlier years play as they did
  const G=S.great=S.great||{next:greatPlan(Math.max(y,GREAT_FROM)),done:[]};
  if(G.inq&&m>=G.inq.m){const q=G.inq;G.inq=null;
    news(`The inquiry into the loss of SS ${q.name} reports. ${GREAT[q.k].how} It calls for ${q.k==='fire'?'fire doors, patrols and detectors on every passenger ship':q.k==='collision'?'slower speeds in fog and better bulkheads':q.k==='founder'?'cargo properly secured, and boat drills that are drills':q.k==='stranding'?'closer attention to the navigation of passenger ships':'searches of passengers\' baggage'}.`,'hist',true);}
  if(m<G.next)return;
  G.next=greatPlan(greatDecade(y)+10);
  const kinds=Object.keys(GREAT).filter(k=>!GREAT[k].from||y>=GREAT[k].from),k=kinds[Math.floor(Math.random()*kinds.length)],K=GREAT[k];
  const mine=S.ships.filter(x=>x.state==='sea'&&!x.em&&paxBerths(x)>=200).map(x=>({x,w:greatRisk(x),own:true}));
  const theirs=S.rships.filter(x=>!isCruise(x.route)||y>=1925).filter(x=>(x.berths.f||0)+(x.berths.s||0)+(x.berths.t||0)>=200).map(x=>({x,w:1,own:false}));
  const all=mine.concat(theirs),tot=all.reduce((a,q)=>a+q.w,0);if(!tot)return;
  let r=Math.random()*tot,pick=all[all.length-1];for(const q of all){r-=q.w;if(r<=0){pick=q;break;}}
  G.done.push({m,k,name:pick.x.name,own:pick.own});
  if(pick.own){const sh=pick.x;startEmergency(sh,K.em);const e=(S.emerg||[]).find(z=>z.id===sh.em);
    if(e){e.sev=3;e.rateM=SEV_RATE[3];e.threat=Math.max(e.threat,SEV_T0[3]);e.great=k;}
    return;} // her own court of inquiry follows, as for any loss
  const x=pick.x,o=x.owner,aboard=Math.round(((x.berths.f||0)+(x.berths.s||0)+(x.berths.t||0))*(0.55+Math.random()*0.25))+Math.round(x.grt/45)+40,dead=Math.round(aboard*K.dead*(0.7+Math.random()*0.6));
  const grp=ROUTES[x.route]?ROUTES[x.route].group:null;
  news(`SS ${x.name} of the ${RIVALS[o].name} ${K.lost} on ${ROUTES[x.route]?ROUTES[x.route].name:'her passage'}. ${dead?`${int(dead)} of the ${int(aboard)} aboard are lost.`:'Her passengers are freed after four days.'}`,'hist',true);
  dropRival(x);if(S.rivals[o])S.rivals[o].cash-=Math.round(dead*400*PX());if(S.ex&&typeof mkShock==='function')mkShock(o,0.85);
  if(grp&&dead>=50)G.fear={group:grp,until:m+6};
  G.inq={m:m+5,k,name:x.name};
}
/* for half a year after a great loss, fewer people book on that trade, on every line */
const greatFear=(rk,m)=>{const F=S.great&&S.great.fear;return F&&m<F.until&&ROUTES[rk].group===F.group?0.92:1;};
