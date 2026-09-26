/* ================= SIMULATION ================= */
function legCalc(sh,rk,dir,R){
  const r=ROUTES[rk],L=S.lines[rk],m=mOf(S.t),mo=m%12,sm=SPD[sh.speed];
  const seaDays=r.dist/(sh.knots*sm*24);
  const pax={};let paxRev=0,prov=0;
  for(const c of CL){
    const b=sh.berths[c];if(!b)continue;
    const fare=effFare(rk,c),myA=ourAppeal(sh,rk,c),own=b*sailings(sh.knots,rk,sm)*myA;
    const others=rivalWeight(rk,c)+ourWeight(rk,c,sh);
    // this ship's slice of the route's market for this class and direction, per crossing
    let d=marketM(rk,c,dir,m)*b*myA/Math.max(1e-9,others+own);
    if(R)d*=0.85+R()*0.3;
    const q=S.conf&&c==='t';let cap=q?Math.floor(b*0.8):b;
    const nn=Math.round(Math.min(d,cap));
    pax[c]={n:nn,cap:b,fare,rev:nn*fare,capped:q&&d>cap};
    paxRev+=nn*fare;prov+=nn*(seaDays+1)*PROV[c]*SERV_COST[L.service];
  }
  const cw=cargoWeight(rk,sh)+sh.cargo*sailings(sh.knots,rk,sm);
  const cargoT=Math.round(Math.min(sh.cargo,S.mkt[rk]*r.cargo/2*sh.cargo/cw*(R?0.8+R()*0.4:1)));
  const fuelT=sh.grt/(sh.fuel==='coal'?70:95)*Math.pow(sm,3)*seaDays;
  return {pax,paxRev,prov,cargoT,cargoRev:cargoT*r.cargoRate*cargoMod(m),fuelT,fuelC:fuelT*(sh.fuel==='coal'?coalPrice(m):oilPrice(m)),
    seaDays,mail:S.mail[rk]&&sh.speed>0?S.mail[rk].pay/2:0,agents:0.08*paxRev,port:sh.grt*0.045+0.35*cargoT};
}
function depart(sh){
  const P=sh.port;
  if(sh.pendingExit){exitShip(sh,sh.pendingExit);return;}
  if(sh.pendingYard){const k=sh.pendingYard;sh.pendingYard=null;enterYard(sh,k);return;}
  const rk=sh.line,L=rk&&S.lines[rk];
  if(!L){sh.state='laid';news(`SS ${sh.name} laid up at ${PN[P]}.`);return;}
  const r=ROUTES[rk];
  if(P!==r.a&&P!==r.b){
    const to=gcDist(P,r.a)<=gcDist(P,r.b)?r.a:r.b, d=gcDist(P,to)*1.15;
    sh.state='repo';sh.repoTo=to;sh.repoLeft=sh.repoTotal=d/(sh.knots*24);
    const m=mOf(S.t);book('fuel',-sh.grt/(sh.fuel==='coal'?70:95)*sh.repoTotal*(sh.fuel==='coal'?coalPrice(m):oilPrice(m)),rk);
    news(`SS ${sh.name} leaves ${PN[P]} light to join the ${r.name} line.`);return;
  }
  const R=Math.random;
  sh.dir=P===r.a?0:1;sh.pos=0;sh.state='sea';sh.legRoute=rk;sh.broke=false;sh.limp=false;sh.towed=false;sh.incident=null;
  const lg=legCalc(sh,rk,sh.dir,R);
  book('fares',lg.paxRev,rk);book('port',-lg.agents,rk);book('fuel',-lg.fuelC,rk);book('crew',-lg.prov,rk);
  S.pax[rk]=(S.pax[rk]||0)+CL.reduce((a,c)=>a+(lg.pax[c]?lg.pax[c].n:0),0);
  sh.load=lg;L.last[sh.dir]={name:sh.name,pax:lg.pax,cargoT:lg.cargoT};
  const mo=mOf(S.t)%12,winter=[0,1,2,10,11].includes(mo);
  sh.slow=1;if(R()<(winter?0.12:0.04)){sh.slow=0.82;news(`SS ${sh.name} has sailed into a full gale. She will be late.`);}
  const age=yearNow()-sh.built;
  sh.cond=clamp(sh.cond-0.8*SPD_WEAR[sh.speed]*(1+age/30)*(sh.fuel==='oil'?0.85:1),5,95);
  const pS=sh.cond<35?(35-sh.cond)/100*0.3:0,pB=sh.cond<75?(75-sh.cond)/100*0.175:0;
  sh.event=null;
  if(R()<pS)sh.event={kind:'fire',at:r.dist*(0.2+R()*0.6)};
  else if(R()<pB)sh.event={kind:'break',at:r.dist*(0.15+R()*0.7)};
}
function triggerEvent(sh){
  const R=Math.random,rk=sh.legRoute;
  if(sh.event.kind==='break'){
    const d=ROUTES[rk].dist,toDest=d-sh.pos,back=sh.pos<toDest,nm=Math.min(sh.pos,toDest);
    sh.incident={at:S.t,wait:5+Math.round(R()*4),tug:Math.round((800+nm*3)/50)*50,nm:Math.round(nm),back,rival:topRival(rk)};
    sh.stopLeft=1e9;sh.broke=true;S.selShip=sh.id;UI.tab='fleet';
    news(`SS ${sh.name} has broken down mid-Atlantic. She needs orders: see her panel.`,'bad',true);
  } else {
    sh.limp=true;sh.broke=true;sh.pendingYard='repair';book('yard',-sh.grt*1.5,rk);book('fares',-0.5*sh.load.paxRev,rk);S.rep=clamp(S.rep-10,0,100);
    news(`Fire in the bunkers of SS ${sh.name}. She is limping on at a crawl, half the fares refunded, and the press is savage.`,'bad',true);
  }
  sh.event=null;
}
function resolveIncident(sh,how,auto){
  const I=sh.incident,rk=sh.legRoute,lg=sh.load,r=ROUTES[rk],rep=Math.round(sh.grt*0.3);if(!I)return;
  if(how==='wait'){sh.stopLeft=I.wait;book('yard',-rep,rk);S.rep=clamp(S.rep-3,0,100);
    news(auto?`No orders came, so the engineers are repairing SS ${sh.name} at sea. About ${I.wait} days adrift.`:`SS ${sh.name} will repair at sea. About ${I.wait} days adrift.`,'bad');}
  if(how==='tug'){book('yard',-(I.tug+rep),rk);sh.stopLeft=0;sh.towed=true;S.rep=clamp(S.rep-1,0,100);
    if(I.back){book('fares',-lg.paxRev,rk);lg.cargoRev=0;lg.mail=0;sh.dir^=1;sh.pos=r.dist-sh.pos;}
    const to=PN[sh.dir===0?r.b:r.a];sh.pendingYard=sh.pendingYard||'engine';
    news(`An ocean tug is towing SS ${sh.name} ${I.back?'back ':''}to ${to}${I.back?'. All fares refunded':''}.`);}
  if(how==='transfer'){book('fares',-0.7*lg.paxRev,rk);book('yard',-rep,rk);sh.stopLeft=I.wait;S.rep=clamp(S.rep-1,0,100);
    for(const c in lg.pax)lg.pax[c].n=Math.round(lg.pax[c].n*0.3);
    news(`Most passengers from SS ${sh.name} have been taken off by a ${RIVALS[I.rival].name} steamer. 70% of fares refunded.`);}
  sh.incident=null;
}
function arrive(sh){
  const rk=sh.legRoute,r=ROUTES[rk],lg=sh.load,R=Math.random;
  sh.port=sh.dir===0?r.b:r.a;sh.state='port';sh.portLeft=4;
  book('cargo',lg.cargoRev,rk);book('port',-lg.port,rk);
  if(lg.mail&&!sh.broke&&S.mail[rk]){book('mail',lg.mail,rk);S.mail[rk].ok=true;}
  const L=S.lines[rk],spartan=L&&L.service===0,lavish=L&&L.service===2;
  if(sh.port==='NYC'){
    if(R()<0.03+(spartan?0.03:0)){book('yard',-1200,rk);S.rep=clamp(S.rep-2,0,100);news(`Prohibition agents found crew smuggling liquor aboard SS ${sh.name} in New York. £1,200 fine.`,'bad');}
    if(lg.pax.t&&lg.pax.t.n>150&&R()<0.02+(spartan?0.04:0)){book('yard',-1500,rk);S.rep=clamp(S.rep-3,0,100);news(`Typhus scare in steerage. SS ${sh.name} held in quarantine off New York.`,'bad');}
  }
  const fo=lg.pax.f?lg.pax.f.n/Math.max(1,lg.pax.f.cap):0;
  if(fo>0.5&&R()<(lavish?0.1:0.03)){S.rep=clamp(S.rep+4,0,100);news(`A film star crossed first class on SS ${sh.name} and praised the table to the newspapers.`,'good');}
  sh.lastLoad=lg;sh.load=null;sh.broke=false;sh.limp=false;sh.slow=1;sh.stopLeft=0;sh.towed=false;
  if(sh.autoDock&&sh.cond<sh.autoDock&&!sh.pendingYard&&!sh.pendingExit){const c=refitCost(sh,'dock');
    if(S.cash>=c){sh.pendingYard='dock';sh.dockWarn=false;news(`SS ${sh.name} is below her ${sh.autoDock}% service threshold and goes into drydock at ${PN[sh.port]}.`);}
    else if(!sh.dockWarn){sh.dockWarn=true;news(`SS ${sh.name} is due for drydock but the account cannot cover ${fmt(c)}. She keeps sailing.`,'bad',true);}}
}
function enterYard(sh,k){
  const c=refitCost(sh,k);if(c)book('yard',-c,'_idle');
  sh.state='yard';sh.yardKind=k;sh.yardLeft=YARD_DAYS[k];
  news(`SS ${sh.name} enters the yard at ${PN[sh.port]} for ${YARD_NAME[k]}${c?' ('+fmt(c)+')':''}.`);
}
function finishYard(sh){
  const k=sh.yardKind;
  if(k==='dock'){sh.cond=Math.min(92,sh.cond+35);news(`SS ${sh.name} is out of drydock, scraped, painted and sound.`,'good');}
  if(k==='oil'){sh.fuel='oil';news(`SS ${sh.name} now burns oil. Half her stokers have been paid off.`,'good');}
  if(k==='tourist'){const cv=Math.round(sh.berths.t*0.5);sh.berths.t-=cv;sh.berths.tt+=Math.round(cv*0.6);news(`SS ${sh.name} returns with Tourist Third Cabin.`,'good');}
  if(k==='repair'){sh.cond=Math.min(95,sh.cond+15);news(`SS ${sh.name} has been repaired and returns to service.`);}
  if(k==='engine'){sh.cond=Math.min(95,sh.cond+8);news(`SS ${sh.name}'s engines are repaired.`);}
  sh.yardKind=null;sh.state='port';sh.portLeft=1;
}
function exitShip(sh,how){
  const v=how==='scrap'?sh.grt*2:Math.round(shipValue(sh)*0.9);
  S.cash+=v;S.ships=S.ships.filter(x=>x!==sh);
  news(how==='scrap'?`SS ${sh.name} sold to the breakers for ${fmt(v)}.`:`SS ${sh.name} sold for ${fmt(v)}.`);
  if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;
}
function moveAll(step){
  moveRivals(step);
  for(const sh of [...S.ships]){
    if(sh.state==='sea'){
      if(sh.incident&&S.t-sh.incident.at>2)resolveIncident(sh,'wait',true);
      if(sh.stopLeft>0){sh.stopLeft-=step;if(sh.stopLeft<=0)news(`SS ${sh.name} has steam up again.`);continue;}
      sh.pos+=(sh.towed?120:sh.knots*SPD[sh.speed]*24*sh.slow*(sh.limp?0.4:1))*step;
      if(sh.event&&sh.pos>=sh.event.at)triggerEvent(sh);
      if(sh.pos>=ROUTES[sh.legRoute].dist)arrive(sh);
    } else if(sh.state==='port'){
      sh.portLeft-=step;if(sh.portLeft<=0)depart(sh);
    } else if(sh.state==='repo'){
      sh.repoLeft-=step;if(sh.repoLeft<=0){sh.state='port';sh.port=sh.repoTo;sh.portLeft=1;}
    } else if(sh.state==='yard'){
      sh.yardLeft-=step;if(sh.yardLeft<=0)finishYard(sh);
    }
  }
}
function dailyTick(){
  for(const sh of S.ships){
    const act=ACTIVE.includes(sh.state),f=act?1:sh.state==='yard'?0.5:0.25;
    const key=act?(sh.state==='sea'?sh.legRoute:sh.line):'_idle';
    book('crew',-crewCost(sh)/30*f,key);
    book('upkeep',-(insCost(sh)/30+(act?MAINT_COST[sh.maint]*sh.grt/8000/30:0)),key);
    if(act)sh.cond=clamp(sh.cond+MAINT_GAIN[sh.maint]/30,5,95);
    else if(sh.state==='laid')sh.cond=clamp(sh.cond-0.02,5,95);
  }
  for(const rk in S.lines)book('adv',-ADV_COST[S.lines[rk].adv]/30,rk);
  book('office',-((600+250*S.ships.length)+(S.conf?350:0))/30);
  book('interest',-S.debt*0.065/365);
  const m=mOf(S.t);if(m!==S.m){const pm=S.m;S.m=m;monthRoll(pm);}
  if(S.cash<0&&!S.odWarn){S.odWarn=true;news(`The account is overdrawn. The bank will foreclose below ${fmt(-odLimit())}.`,'bad',true);}
  if(S.cash>0)S.odWarn=false;
  if(S.cash<-odLimit()&&!S.over){S.over='bust';UI.speed=0;save();}
}
function monthRoll(pm){
  const repay=Math.min(S.debt,Math.round(S.debt*0.004));S.debt-=repay;S.cash-=repay;
  const net=Object.values(S.mtd.cat).reduce((a,b)=>a+b,0);
  S.lastMonth={m:pm,cat:S.mtd.cat,lines:S.mtd.lines,net,repay};S.mtd=blankLedger();
  S.lastPax=S.pax;S.pax={};
  for(const id in RIVALS)S.rivalIdx[id]=clamp((S.rivalIdx[id]||1)+(Math.random()-0.5)*0.04,0.93,1.06);
  S.hist.push(Math.round(S.cash));
  for(const rk of Object.keys(S.mail)){
    if(!S.mail[rk].ok){S.mail[rk].strikes++;
      if(S.mail[rk].strikes>=2){delete S.mail[rk];S.rep=clamp(S.rep-5,0,100);news(`The Post Office has cancelled your ${ROUTES[rk].name} mail contract after missed sailings.`,'bad',true);}
      else news(`No mail was landed on ${ROUTES[rk].name} last month. One more and the contract goes.`,'bad',true);}
    else S.mail[rk].strikes=0;
    if(S.mail[rk])S.mail[rk].ok=false;
  }
  for(const rk of Object.keys(S.wars)){S.wars[rk].left--;if(S.wars[rk].left<=0){delete S.wars[rk];S.tension[rk]=20;news(`The rate war on ${ROUTES[rk].name} has burned out. Fares recover.`,'good');}}
  for(const rk of Object.keys(ROUTES)){
    const n=shipsOn(rk).filter(x=>ACTIVE.includes(x.state)).length;
    if(S.conf||!S.lines[rk]||!n){S.tension[rk]=(S.tension[rk]||0)*0.6;continue;}
    const pr=pressure(rk,S.lines[rk].fares,S.lastPax[rk]||0,n,S.m);
    const prev=S.tension[rk]||0,t=prev+(pr.p-prev)*0.35;S.tension[rk]=t;
    if(prev<40&&t>=40)news(`${RIVALS[topRival(rk)].name} is complaining about your fares on ${ROUTES[rk].name}. Tension ${Math.round(t)}.`,'bad');
    if(!S.wars[rk]&&t>=40&&Math.random()<(t-40)/100*0.9){
      S.wars[rk]={left:4+Math.floor(Math.random()*4),mult:0.72};
      news(`${RIVALS[topRival(rk)].name} leads a rate war on ${ROUTES[rk].name}. Conference fares are down a quarter to drive you off.`,'bad',true);}
  }
  rivalsMonth();
  // reputation drifts toward the standing your service and speed earn; events push it around on top
  const act=S.ships.filter(x=>x.line&&S.lines[x.line]&&ACTIVE.includes(x.state));
  if(act.length){const svc=act.reduce((a,x)=>a+(S.lines[x.line].service-1),0)/act.length,spd=act.reduce((a,x)=>a+(x.speed-1),0)/act.length;
    const target=32+22*svc+8*spd+(Object.keys(S.mail).length?5:0);S.rep=clamp(S.rep+(target-S.rep)*0.12,0,100);}
  if(S.offer&&S.offer.exp<=S.m)S.offer=null;
  if(!S.offer&&S.rep>=40){
    const c=Object.keys(S.lines).filter(rk=>!S.mail[rk]&&shipsOn(rk).length);
    if(c.length&&Math.random()<0.12){const rk=c[Math.floor(Math.random()*c.length)];
      S.offer={route:rk,pay:Math.round((1200+Math.random()*600)/50)*50,exp:S.m+2};
      news(`The Post Office is inviting tenders for the ${ROUTES[rk].name} mail.`,'good',true);}
  }
  if(S.m%3===0)refreshMarket();
  HIST.filter(h=>h.m===S.m).forEach(h=>news(h.t,'hist',true));
  if(S.m>=END_M){S.over='end';UI.speed=0;}
  save();
}
function refreshMarket(){
  const ports=['GLA','LIV','NAP'];
  const pool=TEMPL.filter(t=>!S.ships.some(s=>s.name===t.name)).sort(()=>Math.random()-0.5).slice(0,3);
  S.market=pool.map(t=>{const sh=makeShip(t,45+Math.random()*35,ports[Math.floor(Math.random()*3)]);sh.price=Math.round(shipValue(sh)*(0.92+Math.random()*0.22)/100)*100;return sh;});
}
const fleetValue=()=>S.ships.reduce((a,s)=>a+shipValue(s),0);
const netWorth=()=>S.cash+fleetValue()-S.debt;
const headroom=()=>Math.max(0,0.7*fleetValue()-S.debt);
const odLimit=()=>8000+0.5*headroom(); // the bank forecloses when cash falls below minus this
function news(t,k,pauseIt){
  S.news.unshift({d:Math.floor(S.t),t,k:k||''});if(S.news.length>80)S.news.length=80;
  if(pauseIt&&UI.autoPause&&UI.speed>0){UI.speed=0;UI.banner=t;}
}
