/* ================= NAVAL ARCHITECTURE =================
   Rough but representative: displacement from tonnage, length chosen for speed (wave-making rises steeply once
   knots / sqrt(length in feet) passes about 0.72), power from the Admiralty rule P = D^(2/3) V^3 / C, machinery weight,
   space and fuel from what engineering can do in a given year, bunkers for the line she is meant for. */

/* how deep and how long a ship each port can take alongside (feet). Beyond it she lies off and works into lighters */
const PORT_LIMIT={GLA:{len:720,dr:28,note:'the Clyde up to Glasgow'},LIV:{len:950,dr:34,note:'the Mersey bar'},SOU:{len:1100,dr:40},CHE:{len:2000,dr:60,tender:true},
  QUE:{len:2000,dr:60,tender:true},MOV:{len:2000,dr:60,tender:true},HAM:{len:950,dr:36,note:'the Elbe'},AVO:{len:640,dr:31,note:'the Avonmouth locks'},
  GEN:{len:850,dr:33},NAP:{len:850,dr:36},GIB:{len:2000,dr:50},LIS:{len:850,dr:33,note:'the Tagus bar'},NYC:{len:1050,dr:40,note:'the North River piers'},
  HAL:{len:950,dr:38},SJN:{len:720,dr:31,note:'Saint John harbour'},QBC:{len:800,dr:33,note:'the St Lawrence'},MTL:{len:620,dr:27,note:'the ship channel to Montreal'},
  NOL:{len:620,dr:30,note:'the Mississippi bar'},GAL:{len:540,dr:28,note:'the Galveston bar'},KIN:{len:700,dr:32},FRE:{len:750,dr:36},
  LAG:{len:450,dr:22,note:'the Lagos bar'},RIO:{len:850,dr:34},MVD:{len:600,dr:27,note:'the Plate'},BUE:{len:580,dr:25,note:'the river channel to Buenos Aires'}};
/* where a ship can take on coal or oil */
const BUNKER_PORTS=['GLA','LIV','SOU','HAM','AVO','GEN','NAP','GIB','LIS','NYC','HAL','SJN','QBC','MTL','NOL','GAL','KIN','FRE','LAG','RIO','MVD','BUE'];
/* how hard a route's weather is on a ship, by month (0 kind, 1 the winter North Atlantic) */
function roughness(rk,m){const g=ROUTES[rk].group,mo=m%12,winter=[10,11,0,1,2].includes(mo),shoulder=[3,9].includes(mo);
  if(g==='North Atlantic'||g==='Canada')return winter?1:shoulder?0.65:0.35;
  if(rk==='rpl')return [5,6,7].includes(mo)?0.55:0.35;
  if(rk==='cot'||rk==='ban')return [7,8,9].includes(mo)?0.6:0.25;
  return winter?0.35:0.2;}
const eraMaxLen=y=>Math.min(1150,950+Math.max(0,y-1921)*6);
const lenForSize=g=>15*Math.pow(g,0.38);
const DISP={cruise:1.3,express:1.25,inter:1.3,emig:1.35,tourist:1.3,mixed:1.5,cargo:2,reefer:1.6};
/* machinery, by what the engineers of the day could do */
const MACH_DATA={
  recip:{dens:y=>7,space:0.13,sfc:{coal:1.6,oil:1.15},pps:9},
  quad:{dens:y=>8,space:0.12,sfc:{coal:1.4,oil:1.0},pps:10},
  turb:{dens:y=>13+Math.max(0,y-1921)*0.15,space:0.1,sfc:{coal:1.5,oil:1.05},pps:11},
  geared:{dens:y=>16+Math.max(0,y-1921)*0.3,space:0.075,sfc:{coal:1.2,oil:0.78},pps:12},
  turbel:{dens:y=>15+Math.max(0,y-1928)*0.25,space:0.08,sfc:{oil:0.72},pps:14},
  motor:{dens:y=>9+Math.max(0,y-1924)*0.3,space:0.09,sfc:{oil:0.42},pps:17},
  hp:{dens:y=>26+Math.max(0,y-1950)*0.3,space:0.055,sfc:{oil:0.56},pps:13},
  atomic:{dens:y=>12,space:0.09,sfc:{oil:0.02},pps:45}
};
const sfcNow=(mk,fuel,y)=>((MACH_DATA[mk].sfc[fuel]||MACH_DATA[mk].sfc.oil)*Math.max(0.8,1-Math.max(0,y-1925)*0.004));
/* power a hull needs for a speed. The wall: a penalty once speed-length passes 0.72 */
function powerFor(disp,L,kn,formEff,Cb){
  const slr=kn/Math.sqrt(L),g=slr<=0.72?1:1/(1+8*(slr-0.72)*(slr-0.72)),full=1+Math.max(0,Cb-0.62)*Math.max(0,slr-0.6)*2.5;
  return Math.pow(disp,2/3)*Math.pow(kn,3)/(300/formEff*g)*full;}
/* the longest run between bunkering ports on a line (one way) */
function longestLeg(rk){
  const g=GEO(geoKey(rk,6)),pts=g.calls.filter(c=>BUNKER_PORTS.includes(c[0]));let m=0;
  for(let i=1;i<pts.length;i++)m=Math.max(m,pts[i][1]-pts[i-1][1]);return m||g.dist;}
/* how well a ship suits a line, from her build (0.36.2): short-legged for its longest leg between coaling ports, or too
   deep or too long to lie alongside at a port it calls at (she works into lighters there, at a cost in time and money) */
function lineFit(sh,rk){if(!ROUTES[rk])return [];const D=dimsOf(sh),out=[],leg=longestLeg(rk);
  if(D.range&&D.range<leg*1.05)out.push(`short-legged for the ${int(leg)}-mile leg (she fills cargo space with coal)`);
  for(const p of linePorts(rk)){const L=PORT_LIMIT[p];if(L&&!L.tender&&(D.draught>L.dr||D.len>L.len))out.push(`too ${D.draught>L.dr?'deep':'long'} for ${L.note||PN[p]}, so she works into lighters there`);}
  return out;}
/* the line a ship was built for, if the Line built her for one */
const builtFor=sh=>sh.designLine&&ROUTES[sh.designLine]?sh.designLine:null;
const linePorts=rk=>{const s=new Set(ROUTES[rk].calls);if(ROUTES[rk].winter)geoEnds(ROUTES[rk].winter.key).forEach(p=>s.add(p));return [...s];};
/* can she get alongside? */
function portFit(sh,p){const L=PORT_LIMIT[p],d=dimsOf(sh);if(!L)return {ok:true};
  const lo=d.len-L.len,dr=d.draught-L.dr;return {ok:lo<=0&&dr<=0,lenOver:Math.max(0,lo),drOver:Math.max(0,dr),tender:L.tender,note:L.note};}
/* dimensions for any ship: designed ones carry their own, older ones are estimated from tonnage and speed */
function dimsOf(sh){
  if(sh.len)return {len:sh.len,beam:sh.beam,draught:sh.draught,shp:sh.shp,range:sh.range||6000};
  if(sh._dims&&sh._dims.g===sh.grt)return sh._dims;
  const len=lenForSize(sh.grt),draught=12+0.028*len,disp=sh.grt*(sh.cargo>sh.grt?1.8:1.3);
  const shp=powerFor(disp,len,sh.knots,1,0.66)*1.15,range=sh.cargo>sh.grt*1.2?9000:6000;
  const r={len,beam:len/8.8,draught,shp,range,g:sh.grt};if(sh.id!==undefined)sh._dims=r;return r;
}
/* ---------- the naval architects' working, from the owner's brief ---------- */
function engineer(d){
  const y=yNow(),P=PURPOSES[d.purpose],H=HULLFORMS[d.form],M=MACH_DATA[d.mach],g=d.grt,kn=d.knots,problems=[],notes=[];
  const disp=g*(DISP[d.purpose]||1.3),Ls=lenForSize(g),slrT=d.purpose==='express'?0.88:d.purpose==='cargo'?0.72:0.8;
  const ports=d.line&&ROUTES[d.line]?linePorts(d.line):[];
  const lim=ports.reduce((a,p)=>{const L=PORT_LIMIT[p];return L&&!L.tender?{len:Math.min(a.len,L.len),dr:Math.min(a.dr,L.dr),lp:L.len<a.len?p:a.lp,dp:L.dr<a.dr?p:a.dp}:a;},{len:9999,dr:99,lp:null,dp:null});
  let L=clamp(Math.max(Ls*0.92,Math.pow(kn/slrT,2)),Ls*0.9,Ls*1.3);
  const eraL=eraMaxLen(y);if(L>eraL)L=eraL;
  const wantL=L;if(L>lim.len)L=Math.max(Ls*0.85,lim.len);
  const slr=kn/Math.sqrt(L),Cb=clamp(0.84-0.42*(slr-0.5),0.55,0.82);
  let B=L/(d.purpose==='express'?9.2:d.purpose==='cargo'?7.6:8.6),T=35*disp/(Cb*L*B);
  if(T>lim.dr){B=Math.min(L/7,35*disp/(Cb*L*lim.dr));T=35*disp/(Cb*L*B);}
  // power installed for the service speed, with a margin for weather and a fouled bottom
  const shp=powerFor(disp,L,kn,H.eff,Cb)*1.15;
  const machW=shp/M.dens(y),machSpace=shp*M.space,sfc=sfcNow(d.mach,d.fuel,y),fuelDay=shp*24*sfc/2240*0.85;
  const leg=d.line&&ROUTES[d.line]?longestLeg(d.line):3500,bunkT=fuelDay*leg/(kn*24)*1.35+fuelDay*2,bunkSpace=bunkT*(d.fuel==='coal'?0.45:0.38);
  const usable=g*0.95-machSpace-bunkSpace,range=bunkT/fuelDay*kn*24;
  if(machW>disp*0.24)problems.push(`${MACHINES[d.mach].name} of ${Math.floor(y)} weigh too much for the power she needs (${int(shp)} horsepower). Lengthen her, lower the speed, or choose lighter engines.`);
  if(usable<g*0.3)problems.push(`Engines and bunkers would fill her. There is no room left to earn a living.`);
  if(d.knots>MACHINES[d.mach].max(y)+0.01)problems.push(`${MACHINES[d.mach].name} cannot drive any hull faster than ${MACHINES[d.mach].max(y).toFixed(1)} knots in ${Math.floor(y)}.`);
  // fit for the line
  const bad=ports.map(p=>({p,f:portFit({len:L,draught:T,grt:g},p)})).filter(x=>!x.f.ok);
  // sea-keeping: length is what carries a ship through heavy weather
  const worst=d.line&&ROUTES[d.line]?Math.max(...[0,1,2,11].map(mo=>roughness(d.line,mo))):0.6,small=clamp((560-L)/350,0,1);
  const sea=worst*small;
  return {disp,len:Math.round(L),wantLen:Math.round(wantL),beam:Math.round(B),draught:Math.round(T),Cb,slr,shp:Math.round(shp/100)*100,machW,machSpace,fuelDay,bunkT,range:Math.round(range),usable,
    problems,badPorts:bad,sea,lim,ports,notes,eraL};
}
/* the engineers' own pick of engines and hull form for a brief */
function recommend(d){
  const y=yNow(),opts=Object.keys(MACHINES).filter(k=>techOn(MACHINES[k].from,y)&&k!=='atomic');
  let best=null;
  for(const k of opts){const fuel=MACHINES[k].fuels.includes('oil')&&y>=1923?'oil':MACHINES[k].fuels.find(f=>fuelOK(f,y));if(!fuel)continue;
    const e=engineer({...d,mach:k,fuel});if(e.problems.length)continue;
    // capital plus ten years of fuel at today's prices, less the value of the space the engines leave free
    const cost=e.shp*MACH_DATA[k].pps+e.fuelDay*250*10*(fuel==='coal'?coalPrice(S.m):oilPrice(S.m))-e.usable*12;
    if(!best||cost<best.cost)best={mach:k,fuel,cost};}
  const forms=Object.keys(HULLFORMS).filter(k=>techOn(HULLFORMS[k].from,y));
  const form=d.knots<14?(forms.includes('cruiser')?'cruiser':'trad'):forms.reduce((a,k)=>HULLFORMS[k].eff<HULLFORMS[a].eff?k:a,forms[0]);
  return {mach:best?best.mach:(y>=1911?'geared':'quad'),fuel:best?best.fuel:(fuelOK('oil',y)?'oil':'coal'),form};
}
/* the speed-power curve, for the drawing office */
function powerCurveSVG(d,e){
  const H=HULLFORMS[d.form],k0=Math.max(8,d.knots-8),k1=d.knots+5,pts=[];let mx=0;
  for(let k=k0;k<=k1;k+=0.25){const p=powerFor(e.disp,e.len,k,H.eff,e.Cb)*1.15;pts.push([k,p]);mx=Math.max(mx,p);}
  const W=360,Hh=220,L=54,R=12,T=12,B=36,x=k=>L+(k-k0)/(k1-k0)*(W-L-R),yv=p=>Hh-B-(p/mx)*(Hh-B-T);
  const wk=Math.sqrt(e.len)*0.72,cur=powerFor(e.disp,e.len,d.knots,H.eff,e.Cb)*1.15;
  const path=pts.map(([k,p],i)=>`${i?'L':'M'}${x(k).toFixed(1)},${yv(p).toFixed(1)}`).join(' ');
  const step=[1000,2000,5000,10000,20000,50000,100000,200000].find(v=>mx/v<=5)||mx/4;
  let grid='';for(let v=step;v<mx;v+=step)grid+=`<line x1="${L}" x2="${W-R}" y1="${yv(v)}" y2="${yv(v)}" style="stroke:var(--line)"/><text x="${L-8}" y="${yv(v)+4}" font-size="13" text-anchor="end" style="fill:var(--muted)">${v>=1000?int(v/1000)+'k':int(v)}</text>`;
  let ticks='';for(let k=Math.ceil(k0/2)*2;k<=k1;k+=2)ticks+=`<text x="${x(k)}" y="${Hh-B+17}" font-size="13" text-anchor="middle" style="fill:var(--muted)">${k}</text>`;
  const lx=x(d.knots),ly=yv(cur),right=lx>W*0.62;
  return `<svg class="pcurve" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Power needed against speed: ${int(Math.round(cur/100)*100)} horsepower at ${d.knots} knots">
    ${wk>k0&&wk<k1?`<rect x="${x(wk)}" y="${T}" width="${W-R-x(wk)}" height="${Hh-B-T}" style="fill:var(--bad)" opacity=".08"/><text x="${x(wk)+6}" y="${T+15}" font-size="13" style="fill:var(--bad)">the wall</text>`:''}
    ${grid}<line x1="${L}" x2="${W-R}" y1="${Hh-B}" y2="${Hh-B}" style="stroke:var(--muted)"/><line x1="${L}" x2="${L}" y1="${T}" y2="${Hh-B}" style="stroke:var(--muted)"/>
    ${ticks}<text x="${(L+W-R)/2}" y="${Hh-2}" font-size="13" text-anchor="middle" style="fill:var(--muted)">knots</text>
    <text x="13" y="${(T+Hh-B)/2}" font-size="13" text-anchor="middle" transform="rotate(-90 13 ${(T+Hh-B)/2})" style="fill:var(--muted)">horsepower</text>
    <path d="${path}" style="fill:none;stroke:var(--brass)" stroke-width="3.5"/>
    <line x1="${lx}" y1="${ly}" x2="${lx}" y2="${Hh-B}" style="stroke:var(--ink)" stroke-dasharray="4 3"/><circle cx="${lx}" cy="${ly}" r="5.5" style="fill:var(--ink)"/>
    <text x="${right?lx-10:lx+10}" y="${Math.max(T+14,ly-10)}" font-size="15" font-weight="700" text-anchor="${right?'end':'start'}" style="fill:var(--ink)">${d.knots} kn · ${int(Math.round(cur/100)*100)} hp</text></svg>`;
}

/* ---------- in service: fouling, harbours, weather and bunkers, as the master sees them ---------- */
const foulF=sh=>1-0.1*(sh.foul||0);
const seaSev=(sh,rk,m)=>roughness(rk,m)*clamp((560-dimsOf(sh).len)/350,0,1);
const LEG_CACHE={};const legOf=rk=>LEG_CACHE[rk]!==undefined?LEG_CACHE[rk]:(LEG_CACHE[rk]=longestLeg(rk));
const rangeShort=(sh,rk)=>Math.max(0,legOf(rk)-dimsOf(sh).range);
/* the master's own words, now and then; a hard-case says it harder */
function remark(sh,key,calm,rough,kind,coolDays){
  sh.rmk=sh.rmk||{};if(sh.rmk[key]>S.t-(coolDays||120))return;sh.rmk[key]=S.t;
  const hard=has(sh,'driver')||has(sh,'drinker')||has(sh,'martinet');const txt=hard&&rough?rough:calm;
  sh.lastRemark={t:S.t,txt,who:sh.captain?sh.captain.name:'Her master'};
  wire(sh,txt,kind||'');
}
function foulDaily(sh){
  if(sh.state==='yard'||sh.state==='lost')return;
  const tropic=sh.legRoute&&TROPIC.includes(sh.legRoute),rate=sh.state==='sea'?0.0009*(tropic?1.8:1):sh.state==='laid'?0.0007:0.0004;
  const before=sh.foul||0;sh.foul=Math.min(1,before+rate*(yearNow()>=1945?0.7:1));
  if(before<0.35&&sh.foul>=0.35)remark(sh,'foul1',`Master to owners. She is getting sluggish. Her bottom wants scraping before long.`,`She is getting sluggish. The bottom is growing a garden. Get her into dock.`,'',60);
  if(before<0.6&&sh.foul>=0.6)remark(sh,'foul2',`Master to owners. Lost the best part of a knot this voyage and burning more to do it. She needs drydocking.`,`Lost a knot this trip and burning coal like a furnace to do it. Her bottom is foul. Drydock her or stop asking me why we are late.`,'bad',60);
  if(before<0.85&&sh.foul>=0.85)remark(sh,'foul3',`Master to owners. She is badly foul and slow. I cannot keep the schedule.`,`She is a floating reef and I cannot keep time with her. For God's sake dock her.`,'bad',60);
}
/* a port she is too big for: she lies off and works into lighters, and if she draws too much she may touch */
/* working into lighters off a port she is too big for, in the pounds of the day */
const lighterFee=(cargoT,souls)=>(250+cargoT*0.4+souls*0.3)*PX();
/* the same, for the forecasts: every port on a leg she cannot enter, with that leg's cargo and passengers */
function lighterLeg(sh,l,dir){if(!l||!l.geo)return 0;const ports=stopsFor(l.geo,dir).map(q=>q[0]).concat([dir===0?geoEnds(l.geo)[1]:geoEnds(l.geo)[0]]);
  const souls=CL.reduce((a,c)=>a+(l.pax[c]?l.pax[c].n:0),0);let c=0;for(const p of ports){const f=portFit(sh,p);if(!f.ok&&!f.tender)c+=lighterFee(l.cargoT,souls);}return c;}
function portCall(sh,p,terminal){
  const f=portFit(sh,p);if(f.ok||f.tender)return 0;
  const lg=sh.load||sh.lastLoad,rk=sh.legRoute,souls=lg?CL.reduce((a,c)=>a+(lg.pax[c]?lg.pax[c].n:0),0):0;
  book('port',-Math.round(lighterFee(lg?lg.cargoT:0,souls)),rk,sh);
  let extra=terminal?2:1;
  if(f.drOver>1.5&&Math.random()<Math.min(0.5,0.12*f.drOver/2)){
    const c=Math.round(sh.grt*0.4);book('yard',-c,rk,sh);sh.cond=clamp(sh.cond-8,5,95);extra+=2;
    remark(sh,'aground'+p,`Master to owners. Touched bottom going in to ${PN[p]}. She draws too much for ${f.note||'the harbour'}. Divers are down. She should not be on this run.`,
      `Put her on the bottom at ${PN[p]}. She draws ${Math.round(f.drOver)} feet more than ${f.note||'the harbour'} will take. I nearly lost her. Move me or change the ship.`,'bad',90);
  } else remark(sh,'lighter'+p,`Master to owners. Could not get alongside at ${PN[p]}: she is too ${f.drOver?'deep':'long'} for ${f.note||'the berths'}. Working passengers and cargo by lighter. Expect delay.`,
      `Could not get her alongside at ${PN[p]}. Too ${f.drOver?'deep':'long'} for ${f.note||'the berths'}. Everything by lighter again. She is the wrong ship for this port.`,'',150);
  return extra;
}
