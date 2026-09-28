/* ================= SIMULATION ================= */
const TURN_DAYS=4,CALL_DAYS=1;
const turnDays=(sh,port)=>Math.max(2,TURN_DAYS-(sh.up&&sh.up.gear?1:0)-(S.shore&&S.shore.piers[port]?1:0)-((sh.up&&sh.up.hatch)||(S.shore&&S.shore.sheds&&S.shore.sheds[port])?0.5:0)+crewMods(sh).turn);
/* freight canvassers in a region the route calls at, and cold stores at its ports, win this line more cargo */
const cargoPull=(rk,reefer)=>{const sh=S.shore||{},calls=ROUTES[rk].calls;let f=1;for(const a in sh.fagents||{})if(FAGENCY[a]&&FAGENCY[a].ports.some(p=>calls.includes(p)))f+=0.075;if(reefer&&Object.keys(sh.cold||{}).some(p=>calls.includes(p)))f+=0.2;return f;};
const bunkerDiscount=()=>S.shore&&S.shore.bunker&&S.shore.bunker.until>=S.m?0.88:1;
const fuelPrice=(sh,m)=>(sh.fuel==='coal'?coalPrice(m):oilPrice(m))*bunkerDiscount()*slumpK('fuel',m)*PX();
const fuelRate=(sh,sm)=>sh.grt/(sh.fuel==='coal'?70:95)*Math.pow(sm,3)*(sh.up&&sh.up.turbines?0.92:1)*(sh.fuelK||1)*crewMods(sh).fuel;
const duesAt=(sh,port,mult)=>sh.grt*mult*(S.shore&&S.shore.piers[port]?0.4:1)*slumpK('dues')*PX();
/* the intermediate calls of a geography in sailing order for a direction, as [port, nm from departure] */
function stopsFor(gk,dir){if(dir===1&&ROUTES[gk]&&ROUTES[gk].cruise)return []; // a cruise sails home non-stop
  const g=GEO(gk),c=g.calls.slice(1,-1);return (dir===0?c.map(x=>[x[0],x[1]]):c.reverse().map(x=>[x[0],g.dist-x[1]]));}

function legCalc(sh,rk,dir,R,gk){
  const r=ROUTES[rk],L=S.lines[rk],m=mOf(S.t),mods=shipMods(sh),sm=SPD[sh.speed]*mods.speed;
  gk=gk||geoKey(rk,m);const g=GEO(gk),kn=knotsOf(sh);
  // a foul bottom slows her; a short-legged ship stops to coal or fills cargo space with bunkers
  const short=rangeShort(sh,rk),range=dimsOf(sh).range;
  const cr=r.cruise,back=cr&&dir===1;
  const seaDays=g.dist/(kn*sm*foulF(sh)*24)+(short>range*0.5?1.5:0),calls=back?0:g.calls.length-2;
  const pax={};let paxRev=0,prov=0;
  // a cruise's passengers book once, for the whole cruise: homeward she carries the same people, and takes no fares
  const outPax=back?(R&&sh.load&&sh.load.cruiseOut&&sh.load.geo===gk?sh.load.pax:legCalc(sh,rk,0,null,gk).pax):null;
  for(const c of CL){
    if(back){const o=outPax[c];if(!o||!o.n)continue;pax[c]={n:o.n,cap:o.cap,fare:0,rev:0};prov+=o.n*(seaDays+1)*PROV[c]*SERV_COST[L.service];continue;}
    const b=(m>=ym(1940,0)&&!(sh.up&&sh.up.wireless))||(c==='t'&&fatOf(sh)>=90)?0:sh.berths[c];if(!b)continue;
    const fare=effFare(rk,c),myA=ourAppeal(sh,rk,c),own=b*sailings(kn,rk,sm)*myA;
    const others=rivalWeight(rk,c)+ourWeight(rk,c,sh);
    // this ship's slice of the route's market for this class and direction, per crossing
    let d=marketM(rk,c,dir,m)*b*myA/Math.max(1e-9,others+own);
    d*=facWinter(sh,c,m%12); // indoor rooms keep people travelling in winter
    if(R)d*=0.85+R()*0.3;
    const q=S.conf&&c==='t';let cap=q?Math.floor(b*0.8):b;
    const nn=Math.round(Math.min(d,cap));
    pax[c]={n:nn,cap:b,fare,rev:nn*fare,capped:q&&d>cap};
    paxRev+=nn*fare;prov+=nn*(seaDays+calls*CALL_DAYS+1)*PROV[c]*SERV_COST[L.service];
  }
  // cargo: this direction's commodity, shared by cargo capacity; refrigerated cargo needs cold holds
  const cd=dir===0?r.cargo.out:r.cargo.home,cm=COMM[cd.c];
  const myCap=Math.max(0,sh.cargo*(cm.reefer&&!(sh.up&&sh.up.reefer)?0.15:1)-(short?fuelRate(sh,sm)*Math.min(short,range*0.5)/(kn*24)*1.2:0));
  const cw=cargoWeight(rk,sh,cm.reefer)+myCap*sailings(kn,rk,sm);
  const offer=S.cmkt[rk]*cd.t*cargoSeason(cd.c,m);
  const cargoT=Math.round(Math.min(myCap,offer*myCap*cargoPull(rk,cm.reefer)/Math.max(1,cw)*(R?0.8+R()*0.4:1)));
  const fuelT=fuelRate(sh,sm)*seaDays*(1+0.1*(sh.foul||0));
  const endPort=dir===0?geoEnds(gk)[1]:geoEnds(gk)[0];
  // cruise ships lie off and land their passengers by launch: lighter dues, and none at all out at sea
  const insp=dir===0&&endPort==='NYC'&&pax.t?usInspection(pax.t.n,pax.t.fare,r.calls[0],m):0;
  let dues=insp+(endPort==='OFF'?0:duesAt(sh,endPort,cr?(dir===0?0.03:0.06):0.08));for(const [p] of stopsFor(gk,dir))dues+=duesAt(sh,p,cr?0.02:0.04);
  const fm=facMods(sh);let onboard=0;for(const c in pax)onboard+=pax[c].n*(seaDays+calls*CALL_DAYS)*((fm.spend[c]||0)*(cr?cr.spend:1)+(cr?(cr.bar?cr.bar[c]:CRUISE_SPEND[c]*cr.spend/2):0))*PX();onboard*=crewMods(sh).spend;
  return {cruiseOut:!!cr&&dir===0,onboard,pax,paxRev,prov,cargoT,comm:cd.c,cargoRev:cargoT*cm.rate*cargoMod(m)*(sh.up&&sh.up.heavy&&(cd.c==='general'||cd.c==='manuf')?1.12:1)*(sh.up&&sh.up.deep&&cd.c==='palm'?1.3:1)*(['grain','cotton','palm'].includes(cd.c)?1:clamp(1+(S.rep-30)/150,0.85,1.3)),fuelT,fuelC:fuelT*fuelPrice(sh,m),
    seaDays:seaDays+calls*CALL_DAYS,geo:gk,mail:S.mail[rk]&&sh.speed>0&&mailShip(sh)?S.mail[rk].pay/2:0,
    agents:0.08*paxRev,port:dues+0.35*cargoT*PX()*((sh.up&&sh.up.hatch)?0.75:1)*(S.shore&&S.shore.sheds&&S.shore.sheds[endPort]?0.6:1)};
}
/* cruise programmes: a ship may have several cruises. In each cruise's months she sails it from its home port, finishing the cruise
   she is on before she moves; between seasons she goes back to her own line, or lays up if she had none */
const cruiseInSeason=(rk,m)=>ROUTES[rk].cruise.months.includes(((m%12)+12)%12);
function cruiseProg(sh){if(sh.wc&&!sh.cp)sh.cp=[sh.wc];delete sh.wc;return (sh.cp||[]).filter(k=>ROUTES[k]&&isCruise(k)&&S.lines[k]&&routeOpen(k,S.m));}
/* the cruise she should be on in a month: the one she is on while it is still in season, else the first in her programme that is */
function cruiseFor(sh,m,noStick){const cp=cruiseProg(sh);if(!cp.length||sh.wcHold>S.m)return null;
  if(!noStick&&cp.includes(sh.line)&&cruiseInSeason(sh.line,m))return sh.line;
  return cp.find(k=>cruiseInSeason(k,m))||null;}
const onProgramme=sh=>isCruise(sh.line)&&sh.homeLine!==undefined;
function cruiseSeason(sh){
  const want=cruiseFor(sh,mOf(S.t)),nm=k=>ROUTES[k].cruise.cname;
  if(onProgramme(sh)){
    if(want===sh.line)return;
    if(sh.port!==ROUTES[sh.line].a)return; // she finishes the cruise she is on and brings her passengers home first
    const from=sh.line;
    if(want){sh.line=want;news(`SS ${sh.name}'s ${nm(from).replace(/^the /,'')} season is over: she moves on to ${nm(want)}.`);}
    else{const h=sh.homeLine;sh.line=h&&S.lines[h]?h:null;delete sh.homeLine;
      news(`SS ${sh.name}'s cruising season is over. ${sh.line?'She goes back to the '+ROUTES[sh.line].name+' service.':'She is laid up until her next cruise.'}`);}
  } else if(want&&sh.line!==want){sh.homeLine=sh.line||null;sh.line=want;
    news(`SS ${sh.name} leaves ${sh.homeLine?'the '+ROUTES[sh.homeLine].name+' service':'her lay-up'} for the cruising season: ${nm(want)}.`);}
}
function depart(sh){
  const P=sh.port;
  if(sh.pendingExit){exitShip(sh,sh.pendingExit);return;}
  if(sh.pendingYard){const k=sh.pendingYard;sh.pendingYard=null;enterYard(sh,k);return;}
  cruiseSeason(sh);
  const rk=sh.line,L=rk&&S.lines[rk];
  if(!L){sh.state='laid';news(`SS ${sh.name} laid up at ${PN[P]}.`);return;}
  const r=ROUTES[rk],m=mOf(S.t),gk=geoKey(rk,m),[A,B]=geoEnds(gk);
  if(P!==A&&P!==B){
    const to=laneDist(P,A)<=laneDist(P,B)?A:B,d=laneDist(P,to);
    sh.state='repo';sh.repoTo=to;sh.repoLeft=sh.repoTotal=d/(knotsOf(sh)*24);
    book('fuel',-fuelRate(sh,1)*sh.repoTotal*fuelPrice(sh,m),rk,sh);
    news(`SS ${sh.name} leaves ${PN[P]} light to join the ${r.name} service at ${PN[to]}.`);return;
  }
  // an unhappy crew may walk off before sailing
  if((sh.morale||60)<30&&sh.lastStrike!==S.m&&Math.random()<0.25){
    const d=4+Math.round(Math.random()*4);sh.lastStrike=S.m;sh.portLeft=d;
    news(`The crew of SS ${sh.name} have walked off at ${PN[P]} over pay and conditions. She is held for about ${d} days.`,'bad',true);return;}
  const R=Math.random,mods=shipMods(sh);
  sh.dir=P===A?0:1;sh.geo=gk;sh.pos=0;sh.state='sea';sh.legRoute=rk;sh.broke=false;sh.limp=false;sh.limpF=0.4;sh.towed=false;sh.incident=null;sh.brk=null;sh.galeAt=null;sh.flav=null;sh.sailedAt=S.t;
  sh.stops=stopsFor(gk,sh.dir);sh.nextCall=0;sh.callLeft=0;
  const lg=legCalc(sh,rk,sh.dir,R,gk);
  book('fares',lg.paxRev,rk,sh);if(lg.onboard)book('onboard',lg.onboard,rk,sh);book('port',-lg.agents,rk,sh);book('fuel',-lg.fuelC,rk,sh);book('crew',-lg.prov,rk,sh);
  S.pax[rk]=(S.pax[rk]||0)+CL.reduce((a,c)=>a+(lg.pax[c]?lg.pax[c].n:0),0);
  sh.load=lg;L.last[sh.dir]={name:sh.name,pax:lg.pax,cargoT:lg.cargoT,comm:lg.comm};
  const mo=m%12,winter=[0,1,2,10,11].includes(mo),dist=GEO(gk).dist,lenF=dist/3000;
  { const pc=CL.filter(c=>lg.pax[c]&&lg.pax[c].n).map(c=>`${lg.pax[c].n} ${CL_NAME[c].toLowerCase()}`).join(' ');
    wire(sh,`SS ${sh.name} sailed ${PN[P]} for ${PN[dir0end(gk,sh.dir)]}. ${pc||'No passengers'}. ${int(lg.cargoT)} tons ${COMM[lg.comm].name.toLowerCase()}.`,'r',{via:'Cable, '+PN[P]+' agents'}); }
  const sev=seaSev(sh,rk,m),len=dimsOf(sh).len;sh.galeSev=sev;
  sh.slow=1;if(R()<(winter?0.12:0.04)*mods.gale*Math.min(2,lenF)*(1+1.2*sev)*(len>750?0.7:1))sh.galeAt=dist*(0.15+R()*0.5);
  if(R()<0.22)sh.flav={at:dist*(0.1+R()*0.8),k:R()};
  const age=yearNow()-sh.built;
  sh.cond=clamp(sh.cond-0.8*SPD_WEAR[sh.speed]*(1+age/30)*(sh.fuel==='oil'?0.85:1)*mods.wear*lenF,5,95);
  fatVoyage(sh,lenF);const fr=fatRisk(sh);
  const cm=crewMods(sh),pS=(sh.cond<35?(35-sh.cond)/100*0.3*mods.risk*lenF:0)*fr*cm.fire,pB=((sh.cond<75?(75-sh.cond)/100*0.175*mods.risk*lenF:0)*fr+(fr>1?0.01*(fr-1)*lenF:0))*cm.brk;
  sh.event=null;
  sh.emEvent=null;sh.em=null;
  if(R()<pS)sh.emEvent={k:'fire',at:dist*(0.2+R()*0.6)};
  else if(R()<pB)sh.event={kind:'break',at:dist*(0.15+R()*0.7)};
  if(!sh.emEvent)sh.emEvent=rollEmergency(sh,gk,dist,R);
}
const dir0end=(gk,dir)=>geoEnds(gk)[dir===0?1:0];
function triggerEvent(sh){
  const R=Math.random,rk=sh.legRoute,where=posText(sh);
  if(sh.event.kind==='break'){
    // the engineers go to work at once; what they find decides the rest
    const mods=shipMods(sh),skill=(has(sh,'veteran')?0.25:0)+(has(sh,'cautious')?0.1:0)+((sh.morale||60)-60)/200+(sh.cond-40)/150;
    const pF=clamp(0.14-skill*0.1,0.05,0.3),pL=clamp(0.3-skill*0.1,0.12,0.4),pS=0.25,r=R();
    const o=r<pF?'fail':r<pF+pL?'long':r<pF+pL+pS?'slow':'minor',radio=sh.up&&sh.up.wireless;
    const assess=0.3+R()*0.4,dur={minor:0.2+R()*0.5,slow:0.3+R()*0.5,long:3+R()*3,fail:radio?1.5+R()*1.5:1e6}[o];
    sh.brk={o,tell:S.t+assess,told:false,wait:dur,drift:o==='fail'&&!radio};sh.stopLeft=assess+dur;sh.broke=true;
    wire(sh,`Main engine failure ${where}. Stopped. Engineers at work. Will advise.`,'bad');
  } else {
    if(sh.cond<25&&R()<0.15*(sh.safety||1)){book('fares',-sh.load.paxRev,rk,sh);founder(sh);sh.event=null;return;}
    sh.limp=true;sh.limpF=0.4;sh.broke=true;sh.pendingYard='repair';book('yard',-sh.grt*1.5,rk,sh);book('fares',-0.5*sh.load.paxRev,rk,sh);S.rep=clamp(S.rep-10,0,100);
    wire(sh,`Fire in the bunkers ${where}. Under control after six hours. Stokehold damaged. Proceeding at reduced speed. Passengers shaken.`,'bad',{pause:true});
    news(`Fire aboard SS ${sh.name}. Half the fares refunded, and the press is savage.`,'bad');
  }
  sh.event=null;
}
/* the chief engineer's verdict, some hours after a breakdown */
function breakdownVerdict(sh){
  const B=sh.brk,rk=sh.legRoute,d=Math.max(1,Math.round(B.wait));B.told=true;
  if(B.o==='minor'){book('yard',-Math.round(sh.grt*0.05),rk,sh);wire(sh,`Defect found and made good. Expect under way within hours.`);}
  if(B.o==='slow'){sh.pendingYard=sh.pendingYard||'engine';wire(sh,`Engine damaged. Temporary repair in hand. Will proceed at reduced speed. Yard work needed on arrival.`,'bad');}
  if(B.o==='long'){book('yard',-Math.round(sh.grt*0.3),rk,sh);S.rep=clamp(S.rep-3,0,100);
    wire(sh,`Crankshaft bearing gone. Repairing at sea. About ${d} day${d>1?'s':''} stopped. Passengers informed and restless.`,'bad');}
  if(B.o==='fail'){S.rep=clamp(S.rep-4,0,100);sh.pendingYard=sh.pendingYard||'engine';
    wire(sh,radioOf(sh)?`Damage beyond repair at sea. Require tow. Drifting ${posText(sh)}.`:`Damage beyond repair at sea. Drifting ${posText(sh)}. Burning flares at night and showing not-under-command lights.`,'bad');
    if(sh.up&&sh.up.wireless)wire(sh,`Salvage tug dispatched to SS ${sh.name}. Alongside in about ${d} day${d>1?'s':''}.`,'',{via:stationFor(sh)+' Radio'});}
}
/* steam up again, or the tug takes her in tow */
function breakdownResume(sh){
  const B=sh.brk,rk=sh.legRoute,lg=sh.load,dist=GEO(sh.geo).dist;sh.brk=null;
  if(B.o==='slow'){sh.limp=true;sh.limpF=0.6;wire(sh,`Under way on temporary repairs making ${Math.round(knotsOf(sh)*0.6)} knots.`);return;}
  if(B.o==='fail'){
    const toDest=dist-sh.pos,back=sh.pos<toDest*0.8,nm=Math.min(sh.pos,toDest);
    // the underwriters meet salvage above the owner's excess; passengers sent home get their money back
    const tug=Math.round((800+nm*3)*(sh.up&&sh.up.wireless?0.7:1)*PX()/50)*50,ic=insOf(sh),ix=INS_EXCESS[ic.excess],own=ic.cover==='value'||ic.cover==='agreed'?Math.min(tug,Math.round((600*PX()*ix.own+Math.max(0,tug-600*PX()*ix.own)*0.25)/50)*50):tug;book('salvage',-own,rk,sh);
    const refund=back?Math.round(lg.paxRev):0;
    if(back){book('refund',-refund,rk,sh);lg.cargoRev=0;lg.mail=0;sh.dir^=1;sh.pos=dist-sh.pos;sh.stops=[];sh.nextCall=0;}
    else{sh.stops=sh.stops.slice(sh.nextCall).filter(x=>x[1]>sh.pos);sh.nextCall=0;}
    sh.towed=true;const tt=`Tug alongside SS ${sh.name}. Tow connected. Proceeding to ${PN[destOf(sh)]} at five knots.${back?' All fares to be refunded.':''}`;
    if(radioOf(sh))wire(sh,tt,'bad');else{relay(sh,tt,"Salvage tug's wireless",0,'bad');sh.seen={t:S.t,pos:sh.pos,stopped:false,v:120};}
    news(`SS ${sh.name} broke down beyond repair at sea and is under tow to ${PN[destOf(sh)]}. Salvage ${fmt(tug)}, ${own<tug?`of which the underwriters pay ${fmt(tug-own)} and the Line ${fmt(own)}`:'all of it the Line\'s: her policy does not cover salvage'}.${back?` She is going back, so her passengers are sent on by other lines and their fares refunded: ${fmt(refund)}.`:''}`,'bad');return;}
  wire(sh,`Repairs complete. Under way again at full speed.`,'good');
}
function voyageFlavour(sh){
  const k=sh.flav.k,R=Math.random,rk=sh.legRoute,w=posText(sh),m=mOf(S.t)%12,north=GEO(sh.geo).calls.some(c=>['HAL','SJN','QBC','NYC','MTL'].includes(c[0]));
  sh.flav=null;
  if(north&&[1,2,3,4,5].includes(m)&&k<0.3){wire(sh,`Ice reported ${w}. Field and several bergs. Altering course south. Slight delay.`);sh.slow=Math.min(sh.slow,0.85);return;}
  if(k<0.45){wire(sh,`Third-class passenger taken ill. Surgeon attending. No cause for alarm.`);return;}
  if(k<0.6){const n=1+Math.floor(R()*3);wire(sh,`${n} stowaway${n>1?'s':''} found in the forepeak. Put to work in the galley. Will land them to the authorities.`);return;}
  if(k<0.72){wire(sh,`Answered distress call from a schooner ${w}. Crew of ${5+Math.floor(R()*6)} taken off safely. Resuming passage.`,'good');S.rep=clamp(S.rep+1,0,100);sh.slow=Math.min(sh.slow,0.93);return;}
  if(k<0.84){wire(sh,`Ship's concert in aid of seamen's charities raised ${fmt(20+Math.floor(R()*60))}. All well aboard.`,'good');return;}
  wire(sh,`Fog on the banks. Proceeding at half speed with the whistle going.`);sh.slow=Math.min(sh.slow,0.9);
}
const destOf=sh=>{const [A,B]=geoEnds(sh.geo);return sh.dir===0?B:A;};
function arrive(sh){
  const rk=sh.legRoute,lg=sh.load,R=Math.random,mods=shipMods(sh);
  sh.port=destOf(sh);sh.state='port';const cr=ROUTES[rk]&&ROUTES[rk].cruise;
  sh.portLeft=(cr?(sh.dir===0?cr.turn:(cr.home!==undefined?cr.home:turnDays(sh,sh.port))):turnDays(sh,sh.port))+portCall(sh,sh.port,true); // a cruise spends a day or so ashore at the far end
  if(rangeShort(sh,rk))remark(sh,'range',`Master to owners. Had to carry coal in the holds to make the long leg. That is cargo we did not carry. She was not built for this distance.`,`Filled a hold with bunkers again to make the long leg. She has not the legs for this run.`,'',180);
  if(sh.em){const e=(S.emerg||[]).find(x=>x.id===sh.em);if(e&&!e.over)emEnd(e,sh,'saved');sh.em=null;}
  if(sh.quarantine)startQuarantine(sh,rk);
  const late=sh.overdue||(sh.held&&sh.held.some(m=>m.k==='bad'));
  deliverHeld(sh,`Cable, ${PN[sh.port]} agents, master's report`);
  wire(sh,`SS ${sh.name} arrived ${PN[sh.port]}${sh.towed?' in tow':''}. ${Math.max(1,Math.round(S.t-(sh.sailedAt||S.t)))} days out.${sh.limp?' Needs the yard.':''}`,sh.towed||sh.limp||late?'bad':'r');
  if(sh.overdue)news(`SS ${sh.name} has reached ${PN[sh.port]}, overdue but safe.`,'good');
  sh.seen=null;sh.overdue=0;
  book('cargo',lg.cargoRev,rk,sh);book('port',-lg.port,rk,sh);
  if(lg.mail&&!sh.broke&&S.mail[rk]){book('mail',lg.mail,rk,sh);S.mail[rk].ok=true;}
  const L=S.lines[rk],spartan=L&&L.service===0,lavish=L&&L.service===2;
  if(sh.port==='NYC'){
    if(R()<(0.03+(spartan?0.03:0))*mods.smuggle){book('yard',-1200,rk,sh);S.rep=clamp(S.rep-2,0,100);news(`Prohibition agents found crew smuggling liquor aboard SS ${sh.name} in New York. £1,200 fine.`,'bad');}
    const hostelled=ROUTES[rk].calls.some(p=>S.shore.hostels[p]);
    if(lg.pax.t&&lg.pax.t.n>150&&R()<(0.02+(spartan?0.04:0))*(hostelled?0.5:1)){book('yard',-1500,rk,sh);S.rep=clamp(S.rep-3,0,100);news(`Typhus scare in steerage. SS ${sh.name} held in quarantine off New York.`,'bad');}
  }
  if((sh.morale||60)<40&&!['GLA','LIV','SOU','HAM','AVO'].includes(sh.port)&&R()<0.25*(40-sh.morale)/40){
    const c=Math.round(300+R()*600);book('crew',-c,rk,sh);sh.portLeft+=1;
    news(`Firemen and stewards deserted SS ${sh.name} at ${PN[sh.port]}. Replacements cost ${fmt(c)} and a day.`,'bad');}
  const fo=lg.pax.f?lg.pax.f.n/Math.max(1,lg.pax.f.cap):0;
  if(fo>0.5&&R()<(lavish?0.1:0.03)*(has(sh,'popular')?1.5:1)){S.rep=clamp(S.rep+4,0,100);news(`A film star crossed first class on SS ${sh.name} and praised the table to the newspapers.`,'good');}
  sh.lastLoad=lg;sh.load=null;sh.broke=false;sh.limp=false;sh.slow=1;sh.stopLeft=0;sh.towed=false;sh.stops=[];sh.brk=null;sh.galeAt=null;sh.flav=null;
  if(sh.autoDock&&sh.cond<sh.autoDock&&!sh.pendingYard&&!sh.pendingExit){const c=refitCost(sh,'dock');
    if(S.cash>=c){sh.pendingYard='dock';sh.dockWarn=false;news(`SS ${sh.name} is below her ${sh.autoDock}% service threshold and goes into drydock at ${PN[sh.port]}.`);}
    else if(!sh.dockWarn){sh.dockWarn=true;news(`SS ${sh.name} is due for drydock but the account cannot cover ${fmt(c)}. She keeps sailing.`,'bad',true);}}
}
/* extra work added to a yard visit shares the dock, the cranes and the survey: 15% off, and most of it runs alongside */
const YARD_BUNDLE=0.85,bundleCost=(sh,k)=>Math.round(refitCost(sh,k)*YARD_BUNDLE);
const bundleDays=days=>{const d=days.slice().sort((a,b)=>b-a);return Math.round(d[0]+0.3*d.slice(1).reduce((a,b)=>a+b,0));};
function enterYard(sh,k){
  const c=refitCost(sh,k);if(c)book('yard',-c,'_idle',sh);
  const add=[];for(const x of sh.yardAdd||[]){if(x===k)continue;const cx=bundleCost(sh,x);if(S.cash>=cx){if(cx)book('yard',-cx,'_idle',sh);add.push(x);}
    else news(`The account cannot cover ${YARD_NAME[x]} for SS ${sh.name} (${fmt(cx)}); the yard leaves it out.`,'bad');}
  sh.yardAdd=add;sh.state='yard';sh.yardKind=k;sh.yardLeft=bundleDays([k,...add].map(x=>yardDays(sh,x)));
  news(`SS ${sh.name} enters the yard at ${PN[sh.port]} for ${[k,...add].map(x=>YARD_NAME[x]).join(', ')}${c?' ('+fmt(c+add.reduce((a,x)=>a+bundleCost(sh,x),0))+')':''}${atOwnYard(sh)?', at your own yard':''}.`);
}
/* add a job to a ship already booked into the yard, or already there */
function addYardJob(sh,k){
  if(!yardAdd(sh,k))return false;const c=bundleCost(sh,k);
  if(sh.state==='yard'){if(S.cash<c)return false;if(c)book('yard',-c,'_idle',sh);const d=yardDays(sh,k);sh.yardLeft=Math.round(Math.max(sh.yardLeft,d)+0.3*Math.min(sh.yardLeft,d));}
  (sh.yardAdd=sh.yardAdd||[]).push(k);return true;
}
const yardAdd=(sh,k)=>(sh.pendingYard||sh.state==='yard')&&sh.pendingYard!==k&&sh.yardKind!==k&&!(sh.yardAdd||[]).includes(k);
function finishYard(sh){
  sh.up=sh.up||{};sh.foul=0;
  for(const k of [sh.yardKind,...(sh.yardAdd||[])])yardJobDone(sh,k);
  sh.yardKind=null;sh.yardAdd=[];sh.state='port';sh.portLeft=1;
}
function yardJobDone(sh,k){
  if(sh.rmk){delete sh.rmk.foul1;delete sh.rmk.foul2;delete sh.rmk.foul3;}
  if(k==='cruise'){sh.berths=cruiseBerths(sh.berths);sh.cruiser=true;sh.fit=100;news(`SS ${sh.name} returns from the yard a cruise ship: white, with sun decks and cabins where her steerage was.`,'good');}
  if(k==='scrape')news(`SS ${sh.name} is out of dry dock, her bottom scraped and painted.`);
  if(k==='dock'){const cap=Math.min(92,condCap(sh));sh.cond=Math.max(sh.cond,Math.min(cap,sh.cond+35));news(`SS ${sh.name} is out of drydock, scraped and painted${cap<85?`, but the yard could only bring her to ${cap}%: she is getting old`:' and sound'}.`,'good');}
  if(k==='replate'){const n=sh.replates||0,gain=[25,15,8,4][Math.min(3,n)];sh.replates=n+1;sh.fat=Math.max(0,fatOf(sh)-gain);sh.cond=Math.min(condCap(sh),sh.cond+20);news(`SS ${sh.name} is re-plated and her frames renewed. ${n?'Less of her is original each time; the gain is smaller.':'Good for years yet.'}`,'good');}
  if(k==='oil'){sh.fuel='oil';news(`SS ${sh.name} now burns oil. Half her stokers have been paid off.`,'good');}
  if(k==='tourist'){const cv=Math.round(sh.berths.t*0.5);sh.berths.t-=cv;sh.berths.tt+=Math.round(cv*0.6);news(`SS ${sh.name} returns with Tourist Third Cabin.`,'good');}
  if(k==='repair'){sh.cond=Math.min(condCap(sh),sh.cond+15);news(`SS ${sh.name} has been repaired and returns to service.`);}
  if(k==='engine'){sh.cond=Math.min(condCap(sh),sh.cond+8);news(`SS ${sh.name}'s engines are repaired.`);}
  if(k==='refurb'){sh.fit=100;const ns=currentStyle();const re=ns!==(sh.style||'edw');sh.style=ns;news(`SS ${sh.name} returns freshly refurbished${re?', her public rooms redone in the '+STYLES[ns].name+' style':', her saloons like new'}.`,'good');}
  if(k==='lux'){sh.up.lux=true;sh.fit=100;news(`SS ${sh.name} returns with luxury first-class suites.`,'good');}
  if(k==='fac')applyFacPlan(sh);
  if(k==='hatch'||k==='heavy'||k==='deep'){sh.up[k]=true;news(`SS ${sh.name} returns with ${YARD_NAME[k]}.`,'good');}
  if(EQUIP[k]){sh.up[k]=true;(sh.upR=sh.upR||{})[k]=true;news(`SS ${sh.name} returns with ${EQUIP[k].name.toLowerCase()}.`,'good');}
  if(UPGRADES[k]&&k!=='lux'){sh.up[k]=true;news(`SS ${sh.name} returns with ${UPGRADES[k].name.toLowerCase()}.`,'good');}
}
function exitShip(sh,how){
  const v=how==='scrap'?sh.grt*2:Math.round(shipValue(sh)*0.9);
  S.cash+=v;S.ships=S.ships.filter(x=>x!==sh);
  news(how==='scrap'?`SS ${sh.name} sold to the breakers for ${fmt(v)}.`:`SS ${sh.name} sold for ${fmt(v)}.`);
  if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;
}
function moveAll(step){
  moveRivals(step);emTick();
  for(const sh of [...S.ships]){
    if(sh.state==='lost')continue;
    if(sh.state==='sea'){
      if(sh.em){const e=(S.emerg||[]).find(x=>x.id===sh.em);if(e){emergencyStep(e,sh,step);emHourly(e,sh,step);}else sh.em=null;if(!S.ships.includes(sh)||sh.state!=='sea')continue;}
      if(sh.emEvent&&!sh.em&&!sh.towed&&sh.pos>=sh.emEvent.at){const k=sh.emEvent.k;sh.emEvent=null;startEmergency(sh,k);continue;}
      if(sh.brk&&!sh.brk.found&&!radioOf(sh))spotCheck(sh,step);
      if(sh.brk&&!sh.brk.told&&S.t>=sh.brk.tell)breakdownVerdict(sh);
      if(sh.stopLeft>0){sh.stopLeft-=step;if(sh.stopLeft<=0){sh.stopLeft=0;if(sh.brk)breakdownResume(sh);}continue;}
      if(sh.callLeft>0){sh.callLeft-=step;continue;}
      sh.pos+=(sh.towed?120:knotsOf(sh)*SPD[sh.speed]*shipMods(sh).speed*24*sh.slow*foulF(sh)*(sh.limp?(sh.limpF||0.4):1))*step;
      if(sh.event&&sh.pos>=sh.event.at)triggerEvent(sh);
      if(sh.galeAt&&sh.pos>=sh.galeAt){sh.galeAt=null;const gs=sh.galeSev||0;sh.slow=0.75-0.2*gs;sh.cond=clamp(sh.cond-gs*6,5,95);addFat(sh,gs*0.5);
        if(gs>0.3){S.rep=clamp(S.rep-1,0,100);remark(sh,'sea',`Master to owners. Worst crossing I have known. She rolled her rails under for three days and the passengers are in a bad way. She is too small for this run in winter.`,`Nearly lost her off the Banks. Rolled her rails under for three days, boats stove in, passengers praying. She is too small for this run in winter. Move me or give me a bigger ship.`,'bad',100);}wire(sh,`Full gale ${posText(sh)}. Heavy seas. Hove to for some hours, now proceeding at reduced speed. Expect a day late.`);}
      if(sh.flav&&sh.pos>=sh.flav.at&&!sh.towed)voyageFlavour(sh);
      const st=sh.stops&&sh.stops[sh.nextCall];
      if(st&&sh.pos>=st[1]&&!sh.towed){sh.pos=st[1];sh.callLeft=CALL_DAYS+portCall(sh,st[0],false);sh.callPort=st[0];sh.nextCall++;continue;}
      if(sh.pos>=GEO(sh.geo).dist)arrive(sh);
    } else if(sh.state==='port'){
      sh.portLeft-=step;if(sh.portLeft<=0)depart(sh);
    } else if(sh.state==='repo'){
      sh.repoLeft-=step;if(sh.repoLeft<=0){sh.state='port';sh.port=sh.repoTo;sh.portLeft=1;}
    } else if(sh.state==='yard'){
      sh.yardLeft-=step;if(sh.yardLeft<=0)finishYard(sh);
    }
  }
}
const shoreUpkeep=()=>{const s=S.shore;return Object.keys(s.fagents||{}).length*500+Object.keys(s.sheds||{}).length*200+Object.keys(s.cold||{}).length*400+Object.keys(s.piers).length*350+Object.keys(s.agents).length*300+Object.keys(s.hostels).length*250+Object.keys(s.yards).length*800+(s.slip?1500:0)+Object.keys(S.depts||{}).reduce((a,k)=>a+deptCost(k).total,0);};
function dailyTick(){
  wireTick();silentDaily();if(Math.floor(S.t-D21)%7===0)deptWeek(); // Saturdays, counted as the 1921 game did
  for(const sh of S.ships){
    if(sh.state==='lost')continue;
    const act=ACTIVE.includes(sh.state),f=act?1:sh.state==='yard'?0.5:0.25;
    const key=act?(sh.state==='sea'?sh.legRoute:sh.line):'_idle';
    book('crew',-(crewCost(sh)*f+(sh.captain?sh.captain.wage:0))/30,key,sh);
    if(act&&sh.fac)book('crew',-facMods(sh).staff*PX()/30,key,sh);
    book('ins',-insCost(sh)/30,key,sh);if(act)book('upkeep',-MAINT_COST[sh.maint]*sh.grt/8000/30,key,sh);
    if(act&&sh.cond<condCap(sh))sh.cond=clamp(sh.cond+MAINT_GAIN[sh.maint]/30,5,condCap(sh));
    else if(sh.state==='laid')sh.cond=clamp(sh.cond-0.02,5,95);
    foulDaily(sh);
    if(sh.state!=='yard')sh.fit=Math.max(0,(sh.fit===undefined?80:sh.fit)-0.6/30*(sh.decayK||1));
  }
  for(const rk in S.lines)if(S.ships.some(x=>x.line===rk&&ACTIVE.includes(x.state)))book('adv',-ADV_COST[S.lines[rk].adv]/30,rk); // no sailings to sell, no advertising
  book('office',-officeCost()/30);const sc=safetyCost();if(sc)book('safety',-sc/30);inquiryDaily();
  const up=shoreUpkeep()*PX();if(up)book('shore',-up/30);
  book('interest',-S.debt*(0.065+(S.rateUp>S.m?0.02:0))/365);strikeDaily();
  const m=mOf(S.t);if(m!==S.m){const pm=S.m;S.m=m;monthRoll(pm);}
  if(S.cash<0&&!S.odWarn){S.odWarn=true;news(`The account is overdrawn. The bank will foreclose below ${fmt(-odLimit())}.`,'bad');}
  if(S.cash>0)S.odWarn=false;
  if(S.cash<-odLimit()&&!S.over){S.over='bust';UI.speed=0;save();}
}
function monthRoll(pm){
  const repay=Math.min(S.debt,Math.round(S.debt*0.004));S.debt-=repay;S.cash-=repay;
  const net=Object.values(S.mtd.cat).reduce((a,b)=>a+b,0);
  const shipAcc=S.mtd.ships||{};for(const sh of S.ships){if(sh.state==='lost')continue;const v=Object.values(shipAcc[sh.id]||{}).reduce((x,y)=>x+y,0);(sh.pl=sh.pl||[]).push(Math.round(v));if(sh.pl.length>12)sh.pl.shift();
    const c={};for(const k in shipAcc[sh.id]||{})c[k]=Math.round(shipAcc[sh.id][k]);(sh.plc=sh.plc||[]).push(c);if(sh.plc.length>12)sh.plc.shift();}
  S.lastMonth={m:pm,cat:S.mtd.cat,lines:S.mtd.lines,ships:shipAcc,net,repay,capex:S.mtd.capex||0};
  {const r=o=>{const q={};for(const k in o)q[k]=Math.round(o[k]);return q;};(S.plHist=S.plHist||[]).push({m:pm,cat:r(S.mtd.cat),lines:r(S.mtd.lines)});if(S.plHist.length>12)S.plHist.shift();}S.mtd=blankLedger();
  inflate();giltsMonth();insMonth();taxMonth(net);crashMonth();if(typeof seasonNews==='function')seasonNews(S.m);unionMonth();combineMonth();
  S.lastPax=S.pax;S.pax={};
  for(const id in RIVALS)S.rivalIdx[id]=clamp((S.rivalIdx[id]||1)+(Math.random()-0.5)*0.04,0.93,1.06);
  S.hist.push(Math.round(S.cash));if(S.hist.length>240)S.hist.splice(0,S.hist.length-240);
  for(const rk of Object.keys(S.mail)){
    if(!S.mail[rk].ok){S.mail[rk].strikes++;
      if(S.mail[rk].strikes>=2){delete S.mail[rk];S.rep=clamp(S.rep-5,0,100);news(`The Post Office has cancelled your ${ROUTES[rk].name} mail contract after missed sailings.`,'bad',true);}
      else news(`No mail was landed on ${ROUTES[rk].name} last month. One more and the contract goes.`,'bad',true);}
    else S.mail[rk].strikes=0;
    if(S.mail[rk])S.mail[rk].ok=false;
  }
  for(const rk of Object.keys(S.wars)){const w=S.wars[rk];w.left--;if(w.left<=0){delete S.wars[rk];S.tension[rk]=20;if(!w.quiet)news(warEndText(rk,w),S.lines[rk]?'good':'');}}
  lineWarsMonth();trustMonth(); // the early years: lines at war with each other, and the Combine (trust.js)
  for(const rk of Object.keys(ROUTES)){
    const n=shipsOn(rk).filter(x=>ACTIVE.includes(x.state)).length;
    if(S.conf||!S.lines[rk]||!n||isCruise(rk)){S.tension[rk]=(S.tension[rk]||0)*0.6;continue;} // no conference on cruises
    const pr=pressure(rk,S.lines[rk].fares,S.lastPax[rk]||0,n,S.m);
    const prev=S.tension[rk]||0,t=prev+(pr.p+(combineOn(rk)?45:0)-prev)*0.35;S.tension[rk]=t;
    if(prev<40&&t>=40)news(`${RIVALS[topRival(rk)].name} is complaining about your fares on ${ROUTES[rk].name}. Tension ${Math.round(t)}.`,'bad');
    if(!S.wars[rk]&&t>=40&&Math.random()<(t-40)/100*0.9){
      S.wars[rk]={left:4+Math.floor(Math.random()*4),mult:0.72};
      news(`${RIVALS[topRival(rk)].name} leads a rate war on ${ROUTES[rk].name}. ${confOpen()?'Conference fares':'Fares'} are down a quarter to drive you off.`,'bad',true);}
  }
  rivalsMonth();
  // crew morale drifts toward what pay and captain earn
  crewMonth(); // morale and skill by department, officers ageing: crew.js
  // captains age; old masters retire
  if(S.m%12===0){for(const sh of S.ships)if(sh.captain){sh.captain.age++;sh.captain.exp++;
    if(sh.captain.age>=65){const old=sh.captain.name;sh.captain=makeCaptain();sh.captain.traits=[];sh.captain.exp=Math.min(sh.captain.exp,8);sh.captain.wage=Math.round(38+sh.captain.exp*1.3);
      news(`${old} retires from SS ${sh.name}. Her chief officer, ${sh.captain.name}, takes command. You may prefer to appoint someone from the pool.`);}}}
  if(S.m%3===0)S.capPool=[0,1,2,3].map(()=>makeCaptain());
  // reputation drifts toward the standing your service, speed, captains and shore establishment earn
  const act=S.ships.filter(x=>x.line&&S.lines[x.line]&&ACTIVE.includes(x.state));
  if(act.length){const svc=act.reduce((a,x)=>a+(S.lines[x.line].service-1),0)/act.length,spd=act.reduce((a,x)=>a+(x.speed-1),0)/act.length;
    const pop=act.filter(x=>has(x,'popular')).length/act.length;
    S.stain=(S.stain||0)*0.97;
    const target=32-S.stain+[0,0,3][S.safety===undefined?1:S.safety]+22*svc+8*spd+(Object.keys(S.mail).length?5:0)+4*pop+Math.min(4,2*Object.keys(S.shore.hostels).length);S.rep=clamp(S.rep+(target-S.rep)*0.12,0,100);}
  if(S.shore.bunker&&S.shore.bunker.until===S.m-1)news('Your bunker contract has expired. Coal and oil are back at market prices.','bad');
  if(S.offer&&S.offer.exp<=S.m)S.offer=null;
  // a cruise that has ended (Prohibition's repeal ends the cruises to nowhere): its ships are laid up and the line closes
  for(const rk of Object.keys(S.lines))if(!routeOpen(rk,S.m)){delete S.lines[rk];for(const x of S.ships){if(x.line===rk){x.line=null;delete x.homeLine;}if(x.cp)x.cp=x.cp.filter(k=>k!==rk);}
    news(`Prohibition is over, and so are the ${ROUTES[rk].cruise.cname}: nobody need go to sea for a drink. The ${ROUTES[rk].name} service is closed and its ships laid up.`,'bad',true);}
  // seasonal cruising: a laid-up ship with a cruise season comes out for it
  for(const x of S.ships)if(x.state==='laid'&&cruiseFor(x,S.m)){x.state='port';x.portLeft=1;}
  // the mails: from reputation 40 the Post Office invites tenders, on lines where one of our ships carries wireless
  if(S.rep>=40&&!S.mailOk){S.mailOk=true;news(`The Line's standing now qualifies it for Post Office mail contracts. Tenders come up every few months${wirelessRule()?' for lines where your ships carry wireless':''}.`,'good',true);}
  if(!S.offer&&S.rep>=40){
    const c=Object.keys(S.lines).filter(rk=>!S.mail[rk]&&!isCruise(rk)&&ROUTES[rk].group!=='Trades'&&shipsOn(rk).some(x=>mailShip(x)&&ACTIVE.includes(x.state)));
    if(c.length&&Math.random()<0.25){const rk=c[Math.floor(Math.random()*c.length)];
      S.offer={route:rk,pay:Math.round((1200+Math.random()*600)*ROUTES[rk].dist/3100*(S.m>=ym(1952,3)?0.8:1)*PX()/50)*50,exp:S.m+2};
      news(`The Post Office is inviting tenders for the ${ROUTES[rk].name} mail. See Needs attention.`,'good',true);}
  }
  if(S.m%3===0)refreshMarket();
  runDepartments();
  ordersMonth();
  for(const [id,label,test] of MILESTONES)if(!S.miles[id]&&test()){S.miles[id]=S.m;news(`Milestone: ${label}.`,'good');}
  histNow().filter(h=>h.m===S.m).forEach(h=>news(h.t,'hist',true));
  eraEvents();
  save();
}
function refreshMarket(){
  const ports=['GLA','LIV','NAP','SOU','HAM','AVO'];
  const keep=S.market.filter(x=>x.bargain&&x.listed>=S.m-3);
  const y=yearNow(),old=TEMPL.filter(t=>t.built<=y-1&&(!t.from||y>=t.from)&&y-t.built<34&&!S.ships.some(s=>s.name===t.name)&&!keep.some(k=>k.name===t.name)).sort(()=>Math.random()-0.5);
  // as the old list ages, the brokers offer ships built in the years since
  const nNew=Math.min(4,Math.max(0,Math.round((y-1924)/4),old.length<4?4-old.length:0,newCal()?Math.round((y-yearOfM(S.m0)-2)/3):0));const pool=old.slice(0,4-nNew);for(let i=pool.length;i<4;i++)pool.push(genMarketShip());
  S.market=keep.concat(pool.map(t=>{const sh=makeShip(t,45+Math.random()*35,ports[Math.floor(Math.random()*ports.length)]);if(t.gen)Object.assign(sh,t.gen);sh.price=Math.round(shipValue(sh)*(1.25+Math.random()*0.25)/100)*100;return sh;}));
}
/* the monthly bill for keeping the fleet and office going, before fuel and port costs */
const runningCost=()=>S.ships.reduce((a,x)=>a+crewCost(x)+(x.captain?x.captain.wage:0)+insCost(x)+MAINT_COST[x.maint]*x.grt/8000,0)+600+250*S.ships.length+shoreUpkeep();
const fleetValue=()=>S.ships.reduce((a,s)=>a+shipValue(s),0);
const shoreValue=()=>{const s=S.shore;let v=0;for(const p in s.piers)v+=PIER_COST[p]*0.6;for(const y in s.yards)v+=120000*0.6;if(s.slip)v+=OWN_SLIP_COST*0.5;for(const h in s.hostels)v+=35000*0.5;for(const p in s.sheds||{})v+=SHED_COST*0.5;for(const p in s.cold||{})v+=COLD_COST*0.5;return v;};
const netWorth=()=>S.cash+(S.gilts||0)+fleetValue()+shoreValue()-S.debt;
const headroom=()=>Math.max(0,0.7*(fleetValue()+shoreValue())+0.9*(S.gilts||0)-S.debt); // government stock is the best security a bank can hold
const odLimit=()=>8000+0.5*headroom(); // the bank forecloses when cash falls below minus this
function news(t,k,pauseIt){
  S.news.unshift({d:Math.floor(S.t),t,k:k||''});if(S.news.length>80)S.news.length=80;
  if(pauseIt)eventClock(t,pauseIt===2);
}
/* on big news the clock slows (or pauses, or carries on, as the owner prefers); it picks up again once the owner acts or the moment passes */
function eventClock(t,grave){
  if(typeof UI==='undefined'||UI.speed===0||S.over||UI.eventMode==='off')return;
  if(UI.eventMode==='pause'){UI.speed=0;UI.banner=t;return;}
  const s=grave?SLOW_GRAVE:SLOW_EVENT,now=typeof performance!=='undefined'?performance.now():0;
  if(UI.slow&&UI.slow.rate<s.rate&&UI.slow.until>now)return; // a graver slow-down already running stays
  UI.slow={rate:s.rate,until:now+s.ms,text:t};UI.dirty=true;
}

/* things the timeline does, besides the news */
function eraEvents(){
  if(S.m===ym(1938,11)&&!S.rships.some(x=>x.name==='Britannic Queen')){
    const x=makeRivalShip('imperial','exp',1938);Object.assign(x,{name:'Britannic Queen',grt:80000,knots:30});const K=RIVAL_KIND.liner(80000);
    x.berths={f:Math.round(K.berths.f),s:Math.round(K.berths.s),t:Math.round(K.berths.t)};x.cargo=Math.round(K.cargo);S.rships.push(x);newRivalVis(x);}
  if(S.m===ym(1952,3))for(const rk in S.mail)S.mail[rk].pay=Math.round(S.mail[rk].pay*0.8);
}
