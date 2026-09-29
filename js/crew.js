/* ================= CREW ================= */
/* A ship's company in three departments, each with its own manning, pay, training, morale and skill, under named
   officers the owner appoints. Left alone, every ship runs as she always did: standard manning, standard pay, no
   training, officers of middling ability. */
const CDEPT={
  deck:{name:'Deck',does:'Seamen, quartermasters and the boatswain: they work the ship, keep lookout and man the boats.',union:true,off:'mate'},
  eng:{name:'Engine room',does:'Engineers, firemen, trimmers and greasers: they keep steam up and the engines turning.',union:true,off:'ceng'},
  cat:{name:'Catering',does:'Stewards, stewardesses, cooks and bakers: they look after the passengers.',union:false,off:'stew'}};
const CD_KEYS=['deck','eng','cat'];
const MAN=[['Short-handed',0.85],['Standard',1],['Full',1.12]];
const TRAIN=[['None',0,45],['Drills',1.0,62],['Thorough',2.5,80]]; // name, £ a head a month in 1921 money, the skill it works toward
const OFFICER={
  mate:{name:'Chief officer',wage:28,does:'Runs the deck: seamanship, the boats, and how a fire or flooding is fought.',need:()=>true},
  ceng:{name:'Chief engineer',wage:32,does:'Runs the engine room: fewer breakdowns and less coal burned.',need:()=>true},
  purser:{name:'Purser',wage:22,does:'Keeps the ship\'s books, bars and shops: more spent aboard, less smuggling and pilfering.',need:sh=>paxBerths(sh)>=60},
  stew:{name:'Chief steward',wage:20,does:'Runs the catering: what the passengers think of her table and service.',need:sh=>paxBerths(sh)>=60},
  surg:{name:'Surgeon',wage:24,does:'Keeps passengers and crew well: sickness spreads slower and kills fewer.',need:sh=>paxBerths(sh)>=60}};
const OFF_KEYS=Object.keys(OFFICER);
const paxBerths=sh=>CL.reduce((a,c)=>a+((sh.berths||{})[c]||0),0);

/* hands by department at standard manning: the same total the game has always used */
function deptCount(sh,d){
  const b=sh.berths||{},base=(sh.fuel==='coal'?20+sh.grt/250:16+sh.grt/350)*(sh.crewK||1),coal=sh.fuel==='coal';
  // the old headcount included the officers; they are paid separately now, so they come out of it (about 1.8 hands' wages each)
  const cat=(b.f||0)*0.6+(b.s||0)*0.25+(b.tt||0)*0.12+(b.t||0)*0.05,pax=paxBerths(sh)>=60;
  return d==='deck'?Math.max(4,base*(coal?0.35:0.5)-1.7):d==='eng'?Math.max(4,base*(coal?0.65:0.5)-2):Math.max(0,cat-(pax?4:0));
}
function cwOf(sh){
  if(!sh.cw){const p=sh.pay===undefined?1:sh.pay,m=sh.morale===undefined?60:sh.morale;sh.cw={};for(const d of CD_KEYS)sh.cw[d]={man:1,pay:p,train:0,mor:m,sk:50};sh._mor=m;}
  return sh.cw;
}
const F_FIRST=['John','William','James','George','Robert','Thomas','David','Andrew','Hugh','Arthur','Frederick','Walter','Duncan','Alexander','Henry','Charles'];
const F_LAST=['Macleod','Fraser','Morrison','Bell','Currie','Ogilvie','Rankin','Dunlop','Keir','Wallace','Baird','Munro','Hughes','Pritchard','Kelly','Moran','Harland','Price'];
/* officers draw on their own dice, so appointing them never changes what happens at sea */
const offRand=()=>{let a=S.offSeed=(S.offSeed||0x2F6E2B1)|0;a=a+0x6D2B79F5|0;S.offSeed=a;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
function makeOfficer(role,R=offRand,boost=0){
  const age=Math.floor(28+R()*30),skill=Math.round(clamp(30+R()*50+boost+(age-40)/3,15,95));
  return {id:(S.offNext=(S.offNext||0)+1),role,name:`${role==='surg'?'Dr ':''}${F_FIRST[Math.floor(R()*F_FIRST.length)]} ${F_LAST[Math.floor(R()*F_LAST.length)]}`,age,skill,
    wage:Math.round(OFFICER[role].wage*(0.75+skill/200))};
}
/* the officers she needs; a new berth is filled by a middling man until the owner appoints someone */
function offOf(sh){
  sh.off=sh.off||{};
  for(const r of OFF_KEYS){if(OFFICER[r].need(sh)){if(!sh.off[r])sh.off[r]=makeOfficer(r,offRand,4);}else if(sh.off[r])sh.off[r]=null;}
  return sh.off;
}
const offWage=o=>Math.round(o.wage*slumpK('wage')*PX());
function refreshOffPool(){
  const n=S.depts&&S.depts.crew?5:3,boost=S.depts&&S.depts.crew?8:0;
  S.offPool={};for(const r of OFF_KEYS)S.offPool[r]=Array.from({length:n},()=>makeOfficer(r,offRand,boost));
}
/* a department's working skill: the hands, and the officer over them */
const cwSk=(sh,d)=>{const q=cwOf(sh)[d],o=offOf(sh)[CDEPT[d].off];return q.sk*0.75+(o?o.skill:30)*0.25;};

function cdCost(sh,d){
  const q=cwOf(sh)[d],n=deptCount(sh,d)*MAN[q.man][1],px=PX();
  return (n*16.8*CREW_PAY_MULT[q.pay]*(CDEPT[d].union?(S.wageK||1):1)*safetyOf().crew*px+(sh.state==='laid'?0:n*TRAIN[q.train][1]*px))*slumpK('wage');
}
function crewCostOf(sh){
  let c=0;for(const d of CD_KEYS)c+=cdCost(sh,d);
  const off=offOf(sh);for(const r of OFF_KEYS)if(off[r])c+=offWage(off[r]);
  return (c+watchCost(sh))*warWage(S.m); // a second wireless operator for the night watch; war bonuses
}
const crewHands=sh=>{const cw=cwOf(sh);return CD_KEYS.reduce((a,d)=>a+deptCount(sh,d)*MAN[cw[d].man][1],0);};

/* what the crew does for her; 1 is the old behaviour, at skill 50 and standard manning */
function crewMods(sh){return modCached('crewMods',sh,crewModsRaw);}
function crewModsRaw(sh){
  const cw=cwOf(sh),off=offOf(sh),e=cwSk(sh,'eng'),dk=cwSk(sh,'deck'),ct=cwSk(sh,'cat'),man=d=>cw[d].man-1;
  return {
    brk:(1+(50-e)/120)*(1-0.12*man('eng')),
    fuel:1+(50-e)/600,
    fire:(1+(50-dk)/150)*(1-0.1*man('deck')),
    cap:(dk-50)/4+man('deck')*3,
    appFS:(1+(ct-50)/800)*(1+0.03*man('cat')),
    appT:(1+(ct-50)/1500)*(1+0.015*man('cat')),
    spend:off.purser?0.9+off.purser.skill/400:1,
    smuggle:off.purser?1.3-off.purser.skill/200:1,
    sick:off.surg?1.25-off.surg.skill/200:paxBerths(sh)>=60?1.4:1,
    turn:man('deck')<0||man('eng')<0?0.5:0};
}
/* monthly: morale and skill settle toward what pay, manning, training and officers earn; officers age */
function crewMonth(){
  for(const sh of S.ships){if(sh.state==='lost')continue;
    const cw=cwOf(sh),off=offOf(sh),m=shipMods(sh).morale;
    const dm=(sh.morale===undefined?60:sh.morale)-(sh._mor===undefined?sh.morale:sh._mor); // strikes, settlements and mutinies move the whole ship
    let tot=0,n=0;
    for(const d of CD_KEYS){const q=cw[d],o=off[CDEPT[d].off];if(dm)q.mor=clamp(q.mor+dm,0,100);
      const tgt=MORALE_TARGET[q.pay]+m+(q.man===0?-8:q.man===2?4:0)+(q.train?3:0)+(o?(o.skill-50)/10:-3);
      if(sh.state==='laid'){q.sk=clamp(q.sk-0.8,25,95);} // laid up: no training and no sea time, so skill drifts down, but the men kept on are content
      else{q.mor=clamp(q.mor+(tgt-q.mor)*0.15,0,100);
      const st=TRAIN[q.train][2]+(o?(o.skill-50)/5:-4)-(q.mor<40?10:0);
      q.sk=clamp(q.sk+(st-q.sk)*0.06,10,95);}
      const k=deptCount(sh,d)*MAN[q.man][1];tot+=q.mor*k;n+=k;}
    sh.morale=n?tot/n:60;sh._mor=sh.morale;sh.pay=cw.deck.pay;
  }
  if(S.m%12===0)for(const sh of S.ships)for(const r of OFF_KEYS){const o=(sh.off||{})[r];if(!o)continue;o.age++;if(o.age<58)o.skill=Math.min(95,o.skill+1);
    if(o.age>=65){sh.off[r]=makeOfficer(r,offRand,4);news(`${o.name}, ${OFFICER[r].name.toLowerCase()} of SS ${sh.name}, retires. A junior officer steps up; you may prefer someone else: see her crew.`);}}
  if(S.m%3===0||!S.offPool)refreshOffPool();
}
function appointOfficer(sh,role,cid){
  const pool=(S.offPool||{})[role]||[],c=pool.find(q=>q.id===cid);if(!c||!OFFICER[role].need(sh))return false;
  const old=offOf(sh)[role];sh.off[role]=c;S.offPool[role]=pool.filter(q=>q!==c);if(old&&old.age<60)S.offPool[role].push(old);
  news(`${c.name} joins SS ${sh.name} as ${OFFICER[role].name.toLowerCase()}.`);return true;
}

/* ---------- the crew office: one window, a ship at a time, or the whole fleet with a Crewing Office ---------- */
function openCrew(id){
  if(!S.offPool)refreshOffPool();
  UI.crewOpen=true;UI.crewSid=id||S.selShip;UI.crewFleet=!id&&!!(S.depts&&S.depts.crew);UI.offPool=null;UI.refitOpen=false;UI.designOpen=false;
  UI.cwPrev=UI.speed;if(UI.speed>0){UI.speed=0;UI.banner='Paused while you look over her crew.';}UI.dirty=true;
}
function closeCrew(){UI.crewOpen=false;if(UI.cwPrev>0&&!S.over){UI.speed=UI.cwPrev;UI.banner=null;}UI.dirty=true;}
const cwBar=(v,cls)=>`<span class="cwbar ${cls||''}"><i style="width:${clamp(v,0,100)}%"></i></span>`;
const morWord=v=>v<40?'sullen':v<60?'grumbling':v<75?'content':'a happy ship';
const skWord=v=>v<35?'green':v<50?'raw':v<65?'able':v<80?'smart':'crack';
function crewEffects(sh){
  const m=crewMods(sh),pc=v=>{const p=Math.round((v-1)*100);return p===0?'as usual':p>0?`${p}% more`:`${-p}% fewer`;},pl=v=>{const p=Math.round((v-1)*100);return p===0?'as usual':p>0?`+${p}%`:`${p}%`;};
  const L=[`Engine breakdowns: ${pc(m.brk)}. Coal burned: ${pl(m.fuel)}.`,
    `Fires at sea: ${pc(m.fire)}. In any emergency her crew ${m.cap>=3?'fight it better than most':m.cap<=-3?'fight it worse than most':'fight it as well as most'}.`];
  if(paxBerths(sh)>=60)L.push(`Passenger appeal from the catering: first and second ${pl(m.appFS)}, third ${pl(m.appT)}. Spending aboard: ${pl(m.spend)}.`,
    `Sickness aboard spreads and kills: ${pc(m.sick)}.`);
  if(m.turn)L.push('Short-handed on deck or below: half a day longer in every port.');
  return L;
}
function renderCrew(){
  const el=$('designer');if(!UI.crewOpen)return false;
  const hasOffice=!!(S.depts&&S.depts.crew);
  if(UI.crewFleet&&hasOffice){renderCrewFleet(el);return true;}
  const sh=S.ships.find(x=>x.id===UI.crewSid)||S.ships.find(x=>x.state!=='lost');if(!sh){closeCrew();return false;}
  el.hidden=false;const cw=cwOf(sh),off=offOf(sh),hands=Math.round(crewHands(sh)),cost=crewCostOf(sh);
  const offRow=r=>{const o=off[r],O=OFFICER[r],pool=(S.offPool||{})[r]||[],open=UI.offPool===r;
    return `<div class="cwoff" data-key="of${r}"><div class="row"><b>${O.name}</b><span class="meta">${o?`${fmt(offWage(o))} a month`:'vacant'}</span></div>
      ${o?`<div class="row"><span>${o.name} <span class="meta">age ${o.age}</span></span><span class="meta">${skWord(o.skill)} · ${o.skill}</span></div>${cwBar(o.skill)}`:''}
      <p class="note" style="margin:2px 0">${O.does}</p>
      <button class="btn quiet" data-act="offpool" data-id="${r}">${open?'Close':`Candidates (${pool.length})`}</button>
      ${open?`<div class="stack" style="gap:4px">${pool.map(c=>`<div class="uprow"><div><strong>${c.name}</strong><div class="meta">Age ${c.age} · ${skWord(c.skill)} (${c.skill}) · ${fmt(offWage(c))} a month</div></div>
        <button class="btn" data-act="appoint" data-d='${JSON.stringify([sh.id,r,c.id])}' ${S.over?'disabled':''}>Appoint</button></div>`).join('')||'<p class="note">Nobody looking for a berth this quarter.</p>'}
        <p class="note">The list changes every quarter${hasOffice?'; the Crewing Office finds more and better men':'. A Crewing Office would find more and better men'}. A replaced officer under 60 goes back on the list.</p></div>`:''}</div>`;};
  const seg3=(d,k,labels)=>`<div class="seg" role="group">${labels.map((l,i)=>`<button data-act="crewset" data-d='${JSON.stringify([sh.id,d,k,i])}' aria-pressed="${cw[d][k]===i}">${l}</button>`).join('')}</div>`;
  const deptCard=d=>{const q=cw[d],D=CDEPT[d],n=Math.round(deptCount(sh,d)*MAN[q.man][1]);if(n<1)return '';
    return `<div class="card cwdept" data-key="cd${d}"><div class="row"><b>${D.name}</b><span class="meta">${n} hands · ${fmt(cdCost(sh,d))} a month</span></div>
      <p class="note" style="margin:0">${D.does}${D.union?'':' Not in the seamen\'s union.'}</p>
      <div class="cwstat"><span>Morale</span>${cwBar(q.mor,q.mor<40?'bad':q.mor<60?'warn':'')}<span class="meta">${Math.round(q.mor)} · ${morWord(q.mor)}</span>
        <span>Skill</span>${cwBar(cwSk(sh,d))}<span class="meta">${Math.round(cwSk(sh,d))} · ${skWord(cwSk(sh,d))}</span></div>
      <div class="cwset"><span class="lbl">Manning</span>${seg3(d,'man',MAN.map(x=>x[0]))}<span class="lbl">Pay</span>${seg3(d,'pay',['Low','Union rates','Good'])}<span class="lbl">Training</span>${seg3(d,'train',TRAIN.map(x=>x[0]))}</div></div>`;};
  const others=S.ships.filter(x=>x.state!=='lost'&&x!==sh);
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">${hasOffice&&S.depts.crew.auto?'Her crew · managed by the Crewing Office':'Her crew'}</span><h2>SS ${esc(sh.name)} <small>${hands} hands · ${fmt(cost+(sh.captain?sh.captain.wage:0))} a month with her master</small></h2></div>
    <div class="btns">${hasOffice?'<button class="btn" data-act="crewfleet">The whole fleet</button>':''}<button class="btn" data-act="crewclose">Close</button></div></div>
  <div class="dz-body">
    <div class="dz-view"><div class="dz-top stack">
      <div class="dz-figs"><div><span class="lbl">Hands</span><b class="num">${hands}</b></div><div><span class="lbl">Wages and training</span><b class="num">${fmt(cost)}</b></div><div><span class="lbl">Morale</span><b class="num">${Math.round(sh.morale)}</b></div></div>
      <div class="report"><span class="lbl">What her crew does for her</span><ul>${crewEffects(sh).map(t=>`<li>${t}</li>`).join('')}</ul></div>
      ${hasOffice&&S.depts.crew.auto?`<p class="note"><strong>The Crewing Office is acting.</strong> It raises pay where morale is low, starts drills where skill is poor and appoints better officers. Anything you set here yourself it leaves alone for three months${sh.crewSet>S.t-90?`: yours until ${dateLong(sh.crewSet+90)}`:''}.</p>`:`<p class="note">You manage her crew yourself.${hasOffice?' Set the Crewing Office to Act on the Company tab and it will manage crews for you.':' A Crewing Office (Company tab) can manage every ship\'s crew for you.'}</p>`}
      <p class="note">Morale follows pay, manning, training and the officers, a little each month. Skill follows training and the officers, slowly: a crew is made over a year or two, and a sullen one loses its best men. The union's claims cover deck and engine-room hands; stewards are paid their own rates.${safetyOf().crew>1?' The fleet safety policy adds its own drills on top.':''}</p>
      ${others.length?`<div class="ctl"><span class="lbl">Another ship</span><div class="btns">${others.slice(0,12).map(x=>`<button class="btn quiet" data-act="crewship" data-id="${x.id}">${x.name}</button>`).join('')}</div></div>`:''}
    </div></div>
    <div class="dz-ctl">
      <section><h3>Officers</h3>${captainHTML(sh)}<div class="stack" style="gap:8px">${OFF_KEYS.filter(r=>OFFICER[r].need(sh)).map(offRow).join('')}</div>
        ${paxBerths(sh)<60?'<p class="note">She carries too few passengers for a purser, chief steward or surgeon.</p>':''}</section>
      <section><h3>The ship's company</h3><div class="stack" style="gap:8px">${CD_KEYS.map(deptCard).join('')}</div></section>
    </div></div>`);
  return true;
}
function renderCrewFleet(el){
  el.hidden=false;const live=S.ships.filter(x=>x.state!=='lost');
  const cell=(v,lo)=>`<td class="r num ${v<lo?'neg':''}">${Math.round(v)}</td>`;
  const rows=live.map(sh=>{const cw=cwOf(sh),off=offOf(sh),weak=OFF_KEYS.filter(r=>off[r]&&off[r].skill<40).length;
    return `<tr data-act="crewship" data-id="${sh.id}"><td><b>${sh.name}</b><div class="meta">${Math.round(crewHands(sh))} hands · ${fmt(crewCostOf(sh))}</div></td>
      ${CD_KEYS.map(d=>deptCount(sh,d)>=1?cell(cw[d].mor,45):'<td class="r meta">–</td>').join('')}${CD_KEYS.map(d=>deptCount(sh,d)>=1?cell(cwSk(sh,d),45):'<td class="r meta">–</td>').join('')}
      <td class="r">${weak?`<span class="chip bad">${weak} weak</span>`:''}</td></tr>`;}).join('');
  const tot=live.reduce((a,x)=>a+crewCostOf(x),0);
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">Crewing Office</span><h2>The fleet's crews <small>${Math.round(live.reduce((a,x)=>a+crewHands(x),0))} hands · ${fmt(tot)} a month</small></h2></div>
    <div class="btns"><button class="btn" data-act="crewclose">Close</button></div></div>
  <div class="cwfleet"><div class="tablewrap"><table class="board cwft"><thead><tr><th></th><th class="c" colspan="3">Morale</th><th class="c" colspan="3">Skill</th><th></th></tr>
    <tr><th>Ship</th><th class="r">Deck</th><th class="r">Engine</th><th class="r">Catering</th><th class="r">Deck</th><th class="r">Engine</th><th class="r">Catering</th><th class="r">Officers</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note">Red is below 45. "Weak" counts officers of little ability. Click a ship to open her crew.${S.depts.crew.auto?' The Crewing Office is acting: it raises pay where morale is low, starts drills where skill is poor, and appoints better officers when it finds them.':' Set the Crewing Office to Act on the Company tab and it will raise pay, start drills and appoint better officers for you.'}</p></div>`);
}
