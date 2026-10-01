/* ================= THE FLEET MANAGER: every ship in one table, in a window over the chart ================= */
/* The Fleet tab lists the ships compactly; this window is for a larger fleet. One table, five views of columns
   (trading, condition, money, crew, fittings), sorting, filters, and actions on the ticked ships together.
   It pauses the clock like the other windows. On a wide screen the chosen ship's full panel stays open beside it. */
const FM_VIEWS=[['trade','Trading'],['cond','Condition'],['money','Money'],['crew','Crew'],['fit','Fittings']];
const FM_STATES=[['','Every state'],['sea','At sea'],['port','In port'],['yard','In the yard'],['laid','Laid up'],['req','War service']];
const fmNarrow=()=>typeof matchMedia==='function'&&matchMedia('(max-width:980px)').matches;
function fmState(){return UI.fm=UI.fm||{view:'trade',sort:{k:'name',dir:1},line:'*',state:'',attn:false,q:'',sel:{},msg:null,confirm:null};}
function openFleetMgr(view){
  const F=fmState();if(view)F.view=view;F.msg=null;F.confirm=null;UI.fmBack=false;
  if(!UI.fmOpen){UI.fmPrev=UI.speed;if(UI.speed>0){UI.speed=0;UI.banner='Paused while you look over the fleet.';}}
  UI.fmOpen=true;UI.designOpen=false;UI.crewOpen=false;UI.refitOpen=false;UI.dirty=true;
}
function closeFleetMgr(){UI.fmOpen=false;if(UI.fmPrev>0&&!S.over){UI.speed=UI.fmPrev;UI.banner=null;}UI.fmPrev=0;UI.dirty=true;}

/* ---------- what the table knows about a ship ---------- */
let FM_A=null; // the month's advice, read once per drawing of the window
const fmLive=()=>S.ships.filter(x=>x.state!=='lost');
function fmStateOf(sh){if(sh.state==='req')return 'req';if(sh.state==='yard')return 'yard';if(sh.state==='laid'||!sh.line||!S.lines[sh.line])return 'laid';return sh.state==='sea'||sh.state==='repo'?'sea':'port';}
const fmLast=sh=>{const v=(sh.pl||[]).slice(-1)[0];return v===undefined?null:v;};
const fmAvg=sh=>{const p=sh.pl||[];return p.length?p.reduce((a,b)=>a+b,0)/p.length:null;};
const fmLineName=sh=>fmStateOf(sh)==='req'?'War service':sh.line&&S.lines[sh.line]&&sh.state!=='laid'?ROUTES[sh.line].name:'Laid up';
const fmBerths=sh=>CL.reduce((a,c)=>a+(sh.berths[c]||0),0);
/* reasons a ship wants looking at, most pressing first */
function fmAttn(sh){
  const out=[],st=fmStateOf(sh),busy=st==='yard'||sh.pendingYard;
  const chip=shipStatus(sh).chip;if(/chip bad/.test(chip)&&st!=='req')out.push(['bad',chip.replace(/<[^>]+>/g,'')]);
  if(sh.cond<35&&!busy)out.push(['bad','Run down']);else if(sh.cond<(sh.autoDock||50)&&!busy)out.push(['warn','Due for the yard']);
  const a=fmAvg(sh);if(a!==null&&a<0&&(sh.pl||[]).length>=6&&st!=='req')out.push(['warn','Losing money']); // over the year, not a winter month
  if(insOf(sh).cover==='none')out.push(['warn','Uninsured']);
  if(sh.pendingExit)out.push(['idle',sh.pendingExit==='scrap'?'To be scrapped':'To be sold']);
  const adv=(FM_A||shownAdvice()).filter(h=>h.scope==='ship'&&h.ref===sh.id&&h.sev!=='tip').length;if(adv)out.push(['sea',adv===1?'Advice':adv+' advice']);
  return out;
}
const fmChips=L=>L.slice(0,2).map(([c,t])=>`<span class="chip ${c}">${t}</span>`).join(' ')+(L.length>2?` <span class="meta" title="${L.slice(2).map(x=>x[1]).join(', ')}">+${L.length-2}</span>`:'');
const fmMoney=v=>v===null||v===undefined?'<span class="meta">–</span>':`<span class="${v<0?'neg':'pos'}">${fmt(Math.round(v/10)*10)}</span>`;
const fmTick=v=>v?'<span class="pos">Yes</span>':'<span class="meta">No</span>';
const fmMini=v=>`<span class="fmbar" aria-hidden="true"><i class="${v<40?'low':v<65?'mid':''}" style="width:${clamp(v,0,100)}%"></i></span>`;
const fmNum=(v,lo)=>`<span class="${lo!==undefined&&v<lo?'neg':''}">${Math.round(v)}</span>`;

/* ---------- the columns of each view: key, heading, sort value, cell; opt columns fold away on a phone ---------- */
function fmCols(view){
  const C=(k,h,val,cell,cls='r',opt=true)=>({k,h,val,cell,cls,opt});
  if(view==='cond')return [
    C('cond','Condition',sh=>sh.cond,sh=>`${fmMini(sh.cond)} ${fmNum(sh.cond,40)}%`,'r',false),
    C('age','Age',sh=>yearNow()-sh.built,sh=>`${Math.floor(yearNow()-sh.built)} yrs`),
    C('hull','Hull',sh=>fatOf(sh),sh=>`<span class="${fatOf(sh)>=75?'neg':''}">${fatWord(sh).split(':')[0]}</span>`,''),
    C('th','Threshold',sh=>sh.autoDock||0,sh=>sh.autoDock?sh.autoDock+'%':'<span class="meta">Off</span>'),
    C('maint','Upkeep',sh=>sh.maint,sh=>['None','Routine','Thorough'][sh.maint],''),
    C('fitg','Fittings',sh=>sh.fit,sh=>fmNum(sh.fit,50)+'%'),
    C('yard','Yard',sh=>sh.state==='yard'?-sh.yardLeft:sh.pendingYard?1:2,sh=>sh.state==='yard'?`In yard, ${Math.ceil(sh.yardLeft)} days`:sh.pendingYard?'<span class="meta">Booked</span>':'',''),
  ];
  if(view==='money')return [
    C('value','Worth',sh=>shipValue(sh),sh=>fmt(Math.round(shipValue(sh)/100)*100),'r',false),
    C('mort','Mortgage',sh=>shipMortgage(sh),sh=>shipMortgage(sh)>100?fmt(Math.round(shipMortgage(sh)/100)*100):'<span class="meta">–</span>'),
    C('cover','Cover',sh=>INS_KEYS.indexOf(insOf(sh).cover),sh=>insOf(sh).cover==='none'?'<span class="neg">None</span>':INS_COVER[insOf(sh).cover].short,''),
    C('excess','Excess',sh=>insOf(sh).excess,sh=>INS_EXCESS[insOf(sh).excess].name,''),
    C('prem','Premium',sh=>insCost(sh),sh=>fmt(Math.round(insCost(sh)))),
    C('last','Last month',sh=>fmLast(sh)??-1e12,sh=>fmMoney(fmLast(sh))),
  ];
  if(view==='crew')return [
    C('master','Master',sh=>sh.captain?capScore(sh.captain):-99,sh=>sh.captain?`${esc(sh.captain.name.replace(/^Captain /,''))}${sh.captain.traits.length?` <span class="meta fmwhere">${sh.captain.traits.map(t=>CAPT_TRAITS[t].name).join(', ')}</span>`:''}`:'<span class="meta">none</span>','',false),
    C('hands','Hands',sh=>crewHands(sh),sh=>Math.round(crewHands(sh))),
    C('wages','Wages',sh=>crewCostOf(sh),sh=>fmt(Math.round(crewCostOf(sh)+(sh.captain?sh.captain.wage:0)))),
    ...CD_KEYS.map(d=>C('cm'+d,CDEPT[d].name.split(' ')[0],sh=>deptCount(sh,d)>=1?cwOf(sh)[d].mor:-1,sh=>deptCount(sh,d)>=1?fmNum(cwOf(sh)[d].mor,45):'<span class="meta">–</span>')),
    ...CD_KEYS.map(d=>C('cs'+d,CDEPT[d].name.split(' ')[0],sh=>deptCount(sh,d)>=1?cwSk(sh,d):-1,sh=>deptCount(sh,d)>=1?fmNum(cwSk(sh,d),45):'<span class="meta">–</span>')),
    C('weak','Officers',sh=>OFF_KEYS.filter(r=>offOf(sh)[r]&&offOf(sh)[r].skill<40).length,sh=>{const n=OFF_KEYS.filter(r=>offOf(sh)[r]&&offOf(sh)[r].skill<40).length;return n?`<span class="chip bad">${n} weak</span>`:'';}),
  ];
  if(view==='fit')return fmFit(C);
  return fmTrade(C);
}
function fmFit(C){return [
    C('grt','Tons',sh=>sh.grt,sh=>int(sh.grt),'r',false),
    C('kn','Knots',sh=>knotsOf(sh),sh=>knotsOf(sh)),
    C('fuel','Fuel',sh=>sh.fuel==='oil'?1:0,sh=>sh.fuel==='oil'?'Oil':'Coal',''),
    C('berths','Berths',sh=>fmBerths(sh),sh=>{const k=CL.filter(c=>sh.berths[c]);return `${int(fmBerths(sh))}${k.length>1?` <span class="meta">${k.map(c=>int(sh.berths[c])).join('/')}</span>`:''}`;}),
    C('cargo','Cargo',sh=>sh.cargo||0,sh=>int(sh.cargo||0)),
    C('wl','Wireless',sh=>sh.up&&sh.up.wireless?1:0,sh=>fmTick(sh.up&&sh.up.wireless),''),
    ...(newCal()?[C('boats','Boats for all',sh=>hasBoats(sh)?1:0,sh=>fmTick(hasBoats(sh)),'')]:[]),
    C('reefer','Reefer',sh=>sh.up&&sh.up.reefer?1:0,sh=>fmTick(sh.up&&sh.up.reefer),''),
    ...(atWar()||S.ships.some(x=>x.wcSave)?[C('wc','War cargo',sh=>sh.wcSave?1:0,sh=>fmTick(!!sh.wcSave),'')]:[]),
  ];}
function fmTrade(C){return [
    C('line','Line',sh=>fmLineName(sh),sh=>fmLineName(sh),'',false),
    C('status','Where',sh=>['sea','port','yard','laid','req'].indexOf(fmStateOf(sh)),sh=>{const s=shipStatus(sh);return `<span title="${esc(s.short)}">${s.chip}</span> <span class="meta fmwhere">${s.short}</span>`;},''),
    C('speed','Speed',sh=>sh.speed,sh=>['Economical','Service','Full'][sh.speed],''),
    C('last','Last month',sh=>fmLast(sh)??-1e12,sh=>fmMoney(fmLast(sh))),
    C('avg','Average',sh=>fmAvg(sh)??-1e12,sh=>fmMoney(fmAvg(sh))),
    C('attn','Needs',sh=>-fmAttn(sh).length,sh=>fmChips(fmAttn(sh)),''),
  ];
}
/* the crew columns sit under two group headings */
const fmGroup=c=>/^cm/.test(c.k)?'Morale':/^cs/.test(c.k)?'Skill':'';

/* ---------- the ships shown: filters, search and sort ---------- */
function fmShown(){
  const F=fmState(),cols=fmCols(F.view),q=(F.q||'').trim().toLowerCase();
  let L=fmLive();
  if(F.line==='_laid')L=L.filter(sh=>fmStateOf(sh)==='laid');else if(F.line!=='*')L=L.filter(sh=>sh.line===F.line&&fmStateOf(sh)!=='laid');
  if(F.state)L=L.filter(sh=>fmStateOf(sh)===F.state);
  if(F.attn)L=L.filter(sh=>fmAttn(sh).length);
  if(q)L=L.filter(sh=>sh.name.toLowerCase().includes(q));
  const col=cols.find(c=>c.k===F.sort.k),val=col?col.val:(sh=>sh.name),d=F.sort.dir;
  return L.sort((a,b)=>{const x=val(a),y=val(b);const r=typeof x==='string'?x.localeCompare(y):x-y;return (r||a.name.localeCompare(b.name))*d;});
}
const fmSelected=()=>fmLive().filter(sh=>fmState().sel[sh.id]);

/* ---------- acting on the ticked ships ---------- */
/* each returns [done, left out and why] so the window can say what happened */
function fmBulk(kind,v){
  const F=fmState(),L=fmSelected();let n=0;const skip=[];
  const own=sh=>{sh.ownerSet=S.t;};
  for(const sh of L){const st=fmStateOf(sh);
    switch(kind){
      case 'speed':case 'maint':own(sh);doAction('setship',[sh.id,kind,+v]);n++;break;
      case 'autoDock':sh.autoDock=DOCK_TH[+v];n++;break;
      case 'cover':if(v==='none'&&S.debt>0){skip.push([sh,'the bank insists on cover']);break;}if(setCover(sh,v)!==true)skip.push([sh,'at sea: from her next port']);own(sh);n++;break;
      case 'excess':if(setCover(sh,null,+v)!==true)skip.push([sh,'at sea: from her next port']);n++;break;
      case 'move':if(st==='req'){skip.push([sh,'on war service']);break;}own(sh);if(doAction('moveship',[sh.id,v||'']))n++;break;
      case 'dock':if(st==='req'){skip.push([sh,'on war service']);break;}if(sh.state==='yard'&&sh.yardKind==='dock'||sh.pendingYard==='dock'){skip.push([sh,'already booked']);break;}
        if(doAction('setyard',[sh.id,'dock']))n++;else skip.push([sh,'not enough cash']);break;
    }
  }
  MOD_EPOCH++;ADV_CACHE.key=null;return [n,skip];
}
/* selling and scrapping: the Line keeps at least one ship, and ships on war service stay */
function fmExitPlan(how){
  const L=fmSelected().filter(sh=>!sh.pendingExit),keep=S.ships.filter(sh=>!sh.pendingExit&&!L.includes(sh)).length,out=[],skip=[];
  for(const sh of L){if(sh.state==='req'){skip.push([sh,'on war service']);continue;}out.push(sh);}
  if(!keep&&out.length){const k=out.sort((a,b)=>shipValue(b)-shipValue(a)).shift();skip.push([k,'the Line must keep one ship']);}
  const sum=out.reduce((a,sh)=>a+(how==='scrap'?scrapValue(sh):saleValue(sh)),0);
  return {out,skip,sum};
}
function fmExit(how){const P=fmExitPlan(how);for(const sh of P.out)doAction(how==='scrap'?'scrapship':'sellship',[sh.id]);
  for(const sh of P.out)delete fmState().sel[sh.id];MOD_EPOCH++;ADV_CACHE.key=null;return P;}
const fmDockCost=()=>fmSelected().filter(sh=>sh.state!=='req'&&sh.pendingYard!=='dock'&&!(sh.state==='yard'&&sh.yardKind==='dock')).reduce((a,sh)=>a+refitCost(sh,'dock'),0);
const fmSkipText=skip=>skip.length?` Left out: ${skip.map(([sh,why])=>`${sh.name} (${why})`).join(', ')}.`:'';
const fmShips=n=>`${n} ship${n===1?'':'s'}`;
function fmAct(a,b){
  const F=fmState(),v=b.dataset.v,id=+b.dataset.id;
  switch(a){
    case 'fmopen':openFleetMgr(v);break;
    case 'fmclose':closeFleetMgr();break;
    case 'fmview':F.view=v;F.confirm=null;if(!fmCols(v).some(c=>c.k===F.sort.k)&&F.sort.k!=='name')F.sort={k:'name',dir:1};break;
    case 'fmsort':F.sort=F.sort.k===v?{k:v,dir:-F.sort.dir}:{k:v,dir:v==='name'||v==='line'?1:-1};break;
    case 'fmattn':F.attn=!F.attn;break;
    case 'fmclear':F.sel={};F.confirm=null;F.msg=null;break;
    case 'fmship':if(F.view==='crew'){S.selShip=id;openCrew(id);break;} // in the crew columns a name opens her crew
      S.selShip=id;UI.tab='fleet';(S.tutSeen=S.tutSeen||{}).fleet=true;if(fmNarrow()){closeFleetMgr();UI.fmBack=true;setTimeout(()=>{const d=$('detailD');if(d&&d.scrollIntoView)d.scrollIntoView({block:'start'});},60);}break;
    case 'fmback':UI.fmBack=false;openFleetMgr();break;
    case 'fmask':F.confirm=v;F.msg=null;break;
    case 'fmno':F.confirm=null;break;
    case 'fmdo':{if(v==='sell'||v==='scrap'){const P=fmExit(v);F.msg=`${fmShips(P.out.length)} to be ${v==='scrap'?'scrapped':'sold'} for about ${fmt(P.sum)}; any at sea go when they reach port.${fmSkipText(P.skip)}`;}
      else if(v==='dock'){const c=fmDockCost(),[n,skip]=fmBulk('dock');F.msg=`${fmShips(n)} booked into drydock${n?`, about ${fmt(c)} in all`:''}; any at sea go in when they reach port.${fmSkipText(skip)}`;}
      else if(v==='layup'){const [n,skip]=fmBulk('move','');F.msg=`${fmShips(n)} laid up; any at sea lay up when they reach port.${fmSkipText(skip)}`;}
      F.confirm=null;break;}
  }
}
/* the drop-downs in the action bar and the filters */
function fmChange(t){
  const F=fmState();
  if(t.dataset.fmsel!==undefined){const id=+t.dataset.fmsel;if(t.checked)F.sel[id]=true;else delete F.sel[id];F.msg=null;F.confirm=null;return true;}
  if(t.dataset.fmall!==undefined){const L=fmShown();if(t.checked)L.forEach(sh=>F.sel[sh.id]=true);else L.forEach(sh=>delete F.sel[sh.id]);F.msg=null;F.confirm=null;return true;}
  if(t.dataset.fmline!==undefined){F.line=t.value;return true;}
  if(t.dataset.fmstate!==undefined){F.state=t.value;return true;}
  if(t.dataset.fmbulk){const k=t.dataset.fmbulk,v=t.value;if(v==='')return true;const L=fmSelected();if(!L.length)return true;
    const [n,skip]=fmBulk(k,v);
    const what={speed:()=>`Speed set to ${['Economical','Service','Full'][+v]}`,maint:()=>`Upkeep set to ${['None','Routine','Thorough'][+v]}`,
      autoDock:()=>`Service threshold set to ${DOCK_TH[+v]?DOCK_TH[+v]+'%':'Off'}`,cover:()=>`Cover set to ${INS_COVER[v].name.toLowerCase()}`,
      excess:()=>`Excess set to ${INS_EXCESS[+v].name.toLowerCase()}`,move:()=>`Assigned to ${ROUTES[v].name}`}[k];
    F.msg=`${what()} on ${fmShips(n)}.${k==='move'?' Any at sea change when they reach port; a ship in port elsewhere sails light to join.':''}${fmSkipText(skip)}`;F.confirm=null;
    return true;}
  return false;
}

/* ---------- the window ---------- */
function renderFleetMgr(){
  const el=$('designer');if(!UI.fmOpen)return false;el.hidden=false;FM_A=shownAdvice();
  const F=fmState(),live=fmLive(),cols=fmCols(F.view),shown=fmShown(),sel=fmSelected();
  for(const k in F.sel)if(!live.some(sh=>sh.id===+k))delete F.sel[k];
  const allOn=shown.length&&shown.every(sh=>F.sel[sh.id]);
  const arrow=k=>F.sort.k===k?(F.sort.dir>0?' ▲':' ▼'):'';
  const th=c=>`<th class="${c.cls}${c.opt?' opt':''}"><button class="fmsort" data-act="fmsort" data-v="${c.k}" aria-sort="${F.sort.k===c.k?(F.sort.dir>0?'ascending':'descending'):'none'}">${c.h}${arrow(c.k)}</button></th>`;
  const grpRow=cols.some(fmGroup)?`<tr class="fmgrp"><th colspan="2"></th>${cols.reduce((a,c)=>{const g=fmGroup(c),l=a[a.length-1];if(l&&l.g===g)l.n++;else a.push({g,n:1,opt:c.opt});return a;},[]).map(x=>`<th colspan="${x.n}" class="${x.g?'c':''}${x.opt?' opt':''}">${x.g}</th>`).join('')}</tr>`:'';
  const rows=shown.map(sh=>`<tr data-key="fm${sh.id}" class="${S.selShip===sh.id?'cur':''}${F.sel[sh.id]?' on':''}">
      <td class="fmtick"><input type="checkbox" data-fmsel="${sh.id}" aria-label="Select SS ${esc(sh.name)}" ${F.sel[sh.id]?'checked':''}></td>
      <td class="fmname"><button class="fmsort" data-act="fmship" data-id="${sh.id}">SS ${esc(sh.name)}</button></td>
      ${cols.map(c=>`<td class="${c.cls}${c.opt?' opt':''}">${c.cell(sh)}</td>`).join('')}</tr>`).join('');
  /* by line: where the fleet is, and what each service made */
  const groups=[...Object.keys(S.lines).filter(rk=>ROUTES[rk]),'_laid','_req'].map(g=>{
    const on=live.filter(sh=>g==='_laid'?fmStateOf(sh)==='laid':g==='_req'?fmStateOf(sh)==='req':sh.line===g&&!['laid','req'].includes(fmStateOf(sh)));
    if(!on.length)return null;const lm=on.reduce((a,sh)=>a+(fmLast(sh)||0),0),av=on.reduce((a,sh)=>a+(fmAvg(sh)||0),0);
    return {g,name:g==='_laid'?'Laid up':g==='_req'?'War service':ROUTES[g].name,n:on.length,b:on.reduce((a,sh)=>a+fmBerths(sh),0),c:on.reduce((a,sh)=>a+(sh.cargo||0),0),lm,av};}).filter(Boolean);
  const tot=groups.reduce((a,r)=>({n:a.n+r.n,b:a.b+r.b,c:a.c+r.c,lm:a.lm+r.lm,av:a.av+r.av}),{n:0,b:0,c:0,lm:0,av:0});
  const byLine=`<table class="board fmlines" data-key="fmlines"><thead><tr><th>By line</th><th class="r">Ships</th><th class="r opt">Berths</th><th class="r opt">Cargo tons</th><th class="r">Last month</th><th class="r opt">Average</th></tr></thead><tbody>
    ${groups.map(r=>`<tr data-key="fl${r.g}"><td>${r.name}</td><td class="r">${r.n}</td><td class="r opt">${int(r.b)}</td><td class="r opt">${int(r.c)}</td><td class="r">${fmMoney(r.lm)}</td><td class="r opt">${fmMoney(r.av)}</td></tr>`).join('')}
    <tr class="fmtot"><td>The fleet</td><td class="r">${tot.n}</td><td class="r opt">${int(tot.b)}</td><td class="r opt">${int(tot.c)}</td><td class="r">${fmMoney(tot.lm)}</td><td class="r opt">${fmMoney(tot.av)}</td></tr></tbody></table>`;
  /* the action bar for the ticked ships */
  const opt=(k,labels,vals)=>`<label class="fmdd"><span class="lbl">${k[1]}</span><select data-fmbulk="${k[0]}" aria-label="${k[1]} for the ticked ships" ${S.over?'disabled':''}><option value="" selected>Set…</option>${labels.map((l,i)=>`<option value="${vals?vals[i]:i}">${l}</option>`).join('')}</select></label>`;
  const openLines=Object.keys(S.lines).filter(rk=>ROUTES[rk]&&!isCruise(rk));
  const confirmTxt=()=>{const c=F.confirm;if(!c)return '';
    if(c==='sell'||c==='scrap'){const P=fmExitPlan(c);return `<div class="fmconfirm"><span>${P.out.length?`${c==='sell'?'Sell':'Scrap'} ${fmShips(P.out.length)} for about <strong>${fmt(P.sum)}</strong>?`:'None of these can go.'}${fmSkipText(P.skip)}</span>${P.out.length?`<button class="btn danger" data-act="fmdo" data-v="${c}">Confirm</button>`:''}<button class="btn" data-act="fmno">Cancel</button></div>`;}
    if(c==='dock'){const cost=fmDockCost();return `<div class="fmconfirm"><span>Drydock ${fmShips(sel.length)}: about <strong>${fmt(cost)}</strong> in all, ${YARD_DAYS.dock} days each, +35 condition.${cost>S.cash?' <span class="neg">More than the cash in hand: some will not be booked.</span>':''}</span><button class="btn" data-act="fmdo" data-v="dock">Book them</button><button class="btn" data-act="fmno">Cancel</button></div>`;}
    if(c==='layup')return `<div class="fmconfirm"><span>Lay up ${fmShips(sel.length)}? A laid-up ship earns nothing and still costs her interest, insurance and a skeleton crew.</span><button class="btn danger" data-act="fmdo" data-v="layup">Lay them up</button><button class="btn" data-act="fmno">Cancel</button></div>`;
    return '';};
  const bar=sel.length?`<div class="fmbulk"><div class="row"><strong>${fmShips(sel.length)} ticked</strong><button class="btn quiet" data-act="fmclear">Clear</button></div>
    <div class="fmctl">
      ${opt(['speed','Speed'],['Economical','Service','Full'])}${opt(['maint','Upkeep'],['None','Routine','Thorough'])}
      ${opt(['autoDock','Threshold'],DOCK_TH.map(v=>v?v+'%':'Off'))}
      ${opt(['cover','Cover'],INS_KEYS.map(k=>INS_COVER[k].short),INS_KEYS)}${opt(['excess','Excess'],INS_EXCESS.map(e=>e.name))}
      ${openLines.length?opt(['move','Assign to'],openLines.map(rk=>ROUTES[rk].name),openLines):''}
      <div class="btns"><button class="btn" data-act="fmask" data-v="dock" ${S.over?'disabled':''}>Drydock</button><button class="btn" data-act="fmask" data-v="layup" ${S.over?'disabled':''}>Lay up</button>
        <button class="btn danger" data-act="fmask" data-v="sell" ${S.over?'disabled':''}>Sell</button><button class="btn danger" data-act="fmask" data-v="scrap" ${S.over?'disabled':''}>Scrap</button></div></div>
    ${confirmTxt()}</div>`:`<p class="note fmhint">Tick ships to set speed, upkeep, service threshold or insurance for them together, assign them to a line, send them to drydock, lay them up, or sell them.</p>`;
  const lineOpts=`<option value="*" ${F.line==='*'?'selected':''}>Every line</option>${Object.keys(S.lines).filter(rk=>ROUTES[rk]).map(rk=>`<option value="${rk}" ${F.line===rk?'selected':''}>${ROUTES[rk].name}</option>`).join('')}<option value="_laid" ${F.line==='_laid'?'selected':''}>Laid up</option>`;
  const nAttn=live.filter(sh=>fmAttn(sh).length).length;
  setHTML(el,`<div class="dz-head"><div><span class="eyebrow">Marine superintendent's office</span><h2>The fleet <small>${fmShips(live.length)} · ${int(live.reduce((a,sh)=>a+sh.grt,0))} tons · worth about ${fmt(Math.round(fleetValue()/1000)*1000)}</small></h2></div>
    <div class="btns"><button class="btn" data-act="fmclose">Close</button></div></div>
  <div class="fm">
    <div class="fmtop">
      <div class="seg" role="group" aria-label="Columns">${FM_VIEWS.map(([k,l])=>`<button data-act="fmview" data-v="${k}" aria-pressed="${F.view===k}">${l}</button>`).join('')}</div>
      <div class="fmfilt">
        <select data-fmline="1" aria-label="Line">${lineOpts}</select>
        <select data-fmstate="1" aria-label="State">${FM_STATES.map(([k,l])=>`<option value="${k}" ${F.state===k?'selected':''}>${l}</option>`).join('')}</select>
        <button class="btn${F.attn?' on':''}" data-act="fmattn" aria-pressed="${F.attn}">Needs attention (${nAttn})</button>
        ${live.length>15?`<input type="search" data-fmq="1" placeholder="Find a ship" aria-label="Find a ship by name" value="${esc(F.q||'')}">`:''}
      </div>
    </div>
    <div data-key="fmbar">${bar}</div>
    <div data-key="fmmsg">${F.msg?`<p class="goodline fmmsg">${esc(F.msg)}</p>`:''}</div>
    <div class="tablewrap fmwrap" data-key="fmtab"><table class="board fmt"><thead>${grpRow}<tr><th class="fmtick"><input type="checkbox" data-fmall="1" aria-label="Select every ship shown" ${allOn?'checked':''}></th>
      <th><button class="fmsort" data-act="fmsort" data-v="name">Ship${arrow('name')}</button></th>${cols.map(th).join('')}</tr></thead>
      <tbody>${rows||`<tr><td colspan="${cols.length+2}" class="meta">No ships match.</td></tr>`}</tbody></table></div>
    <p class="note" data-key="fmnote">${shown.length<live.length?`Showing ${shown.length} of ${live.length}. `:''}Click a heading to sort, a name to open her ${F.view==='crew'?'crew':'panel'+(fmNarrow()?'':' beside the table')}. Profits are each ship's own takings less her running costs; the average is over her last twelve months.${F.view==='crew'?' Red is below 45; "weak" counts officers of little ability. Her crew window sets manning, pay and training.':''}</p>
    ${byLine}
  </div>`);
  return true;
}
