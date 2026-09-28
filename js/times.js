/* ================= THE TIMES ================= */
/* What is going on in the world and what it is doing to trade, in numbers, for the owner who has lost track:
   the season, each condition in force, what is coming, and the history so far. Everything here is read from the
   same functions the simulation uses, so the panel can never disagree with what the ships actually earn. */

const SEASON_NAME=m=>['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'][((m%12)+12)%12];
const SEASON_NOTE={
  Winter:'the Atlantic is quiet: few cabin passengers cross in the gales, and the emigrants wait for spring',
  Spring:'emigrant bookings pick up, and the first tourists book for the summer',
  Summer:'the season: first and second class are at their peak, eastbound as well as westbound',
  Autumn:'the tourists go home and cabin bookings fall away towards winter'};
/* which history headlines belong to which condition, so the history can mark those still in force */
const TIMES_TAG={5:'quota',42:'quota',62:'strike',64:'strike',105:'dep',108:'dep',113:'dep',128:'dep',132:'dep',185:'air',200:'era',213:'oceanaid',222:'era',243:'era',280:'era',308:'era',375:'air',453:'air',496:'air'};

const capF=s=>s[0].toUpperCase()+s.slice(1);
const pctTxt=v=>{const p=Math.round(v*100);return p===0?'unchanged':p>0?`up ${p}%`:`down ${-p}%`;};
/* the line to describe: the one with most of the fleet on it, or the Liverpool run */
function timesRef(){
  const n={};for(const sh of S.ships)if(sh.line&&sh.state!=='laid'&&ROUTES[sh.line]&&!ROUTES[sh.line].cruise)n[sh.line]=(n[sh.line]||0)+1;
  const best=Object.keys(n).sort((a,b)=>n[b]-n[a])[0];return best||Object.keys(S.lines).find(k=>!ROUTES[k].cruise)||'liv';
}
const seasonAvg=(rk,c)=>{let s=0;for(let i=0;i<12;i++)s+=seasonOf(rk,c,i);return s/12;};

/* every condition in force this month, with what it does, on one route (the fleet's main line by default) */
function timesConditions(m,rk){
  rk=rk||timesRef();const R=ROUTES[rk],g=R.group,out=[];const add=(key,name,txt,k)=>out.push({key,name,txt,k:k||''});
  if(!R.cruise){const sn=SEASON_NAME(m),df=seasonOf(rk,'f',m)/seasonAvg(rk,'f')-1,dt=seasonOf(rk,'t',m)/seasonAvg(rk,'t')-1;
    add('season',sn,`${capF(SEASON_NOTE[sn])}. On ${R.name}, first class is ${pctTxt(df)} and steerage ${pctTxt(dt)} on the year's average.`,df<-0.12?'bad':df>0.12?'good':'');}
  // the American quotas, from the same figures the sailings use
  if(m>=5&&(g==='North Atlantic'||rk==='nap'||rk==='ham')){const late=m>=42,q=rk==='nap'?(late?0.14:0.45):rk==='ham'?(late?0.6:0.85):(late?0.45:0.8);
    add('quota',late?'American immigration quotas (the 1924 act)':'American immigration quotas (the 1921 act)',
      `Steerage on ${R.name} ${pctTxt(q-1)} on the old emigrant trade${rk==='nap'?'':`; from Italy it is ${pctTxt((late?0.14:0.45)-1)}`}.${late?' Only those with a visa may sail.':''}`,'bad');}
  if(m>=42&&g==='Canada')add('canada','Canada wants settlers','With the United States all but closed, steerage to Canada is up 20%.','good');
  if(rk==='rpl'&&m>=110)add('argentina','Argentina closes its doors','Steerage to the River Plate is down 40% while the slump lasts.','bad');
  // the recovery of the early twenties and the growth that follows, for the cabin classes
  if(m<106){const f=m<12?0.85:m>=24?1+0.035*(Math.min(m,105)-24)/12:1;
    if(f<0.97)add('postwar','After the post-war crash',`Cabin passengers are ${pctTxt(f-1)} on a normal year: the boom has collapsed and people are nervous of spending.`,'bad');
    else if(f>1.03)add('growth','Prosperous times',`Wealthier Americans are crossing to Europe in growing numbers: first and second class ${pctTxt(f-1)} on 1922.`,'good');}
  const dep=['f','s','t'].map(c=>depression(c,m));
  if(dep[0]<0.99){const sl=slump(m);
    add('dep','The Depression',`First class ${pctTxt(dep[0]-1)}, second ${pctTxt(dep[1]-1)}, steerage ${pctTxt(dep[2]-1)}; cargo ${pctTxt(cargoMod(m)-1)}.${sl>0.05?` Costs have come down with it: coal ${pctTxt(-SLUMP_CUT.fuel*sl)}, wages ${pctTxt(-SLUMP_CUT.wage*sl)}, port dues ${pctTxt(-SLUMP_CUT.dues*sl)}.`:''}`,'bad');}
  if(typeof crashF==='function'&&crashF(m)>0)add('panic','A panic in the City',`First class ${pctTxt(crashMod('f',m)-1)}, steerage ${pctTxt(crashMod('t',m)-1)}, second-hand ships ${pctTxt(shipMkt()-1)}. The bank is nervous.`,'bad');
  const e=eraMod('f',rk,m);if(Math.abs(e-1)>0.02){const y=1921+m/12;add('era',y>=1937.7&&y<1938.8?'A recession in America':'The long boom',`First class ${pctTxt(e-1)} on the underlying trade.`,e<1?'bad':'good');}
  const a=airShare(rk,'f',m);if(a>0.005)add('air','Competition from the air',`About ${Math.round(a*100)}% of first class ${a>0.1?'now flies':'goes by air'} on this route.`,'bad');
  if(m>=64&&m<=70)add('strike','The coal dispute','Bunker coal is up about 90% until the miners go back.','bad');
  else{const cp=coalPrice(m)/(1+0.04*Math.sin(m*1.3))/1.6-1;if(cp>0.12)add('coal','Dear coal',`Bunker coal ${pctTxt(cp)} on the mid-twenties price${m>=258?': the mines cannot keep up, and oil is the fuel of the future':''}.`,'bad');}
  const px=PX();if(Math.abs(px-1)>0.03)add('prices','The cost of living',`Prices are ${Math.abs(Math.round((px-1)*100))}% ${px>1?'above':'below'} 1921: wages, coal, yard work, ships and fares all follow them.`,'');
  for(const w in S.wars)if(S.lines[w])add('war:'+w,`A rate war on ${ROUTES[w].name}`,'Fares are being cut to the bone on this line until one side gives way.','bad');
  if(m<156)add('dry','Prohibition','American ports are dry: nothing sold at the bar in New York, and fines when crew are caught smuggling. The cruises to nowhere sell drink beyond the limit.','');
  return out;
}
/* what a real owner would know is coming */
function timesComing(m){
  const out=[];let n=m+1;while(SEASON_NAME(n)===SEASON_NAME(m))n++;
  const sn=SEASON_NAME(n);out.push(`${sn} from ${MONTHS[n%12]}. ${capF(SEASON_NOTE[sn])}.`);
  if(m>=36&&m<42)out.push('A far tighter immigration law is before Congress. If it passes, steerage to New York will fall much further.');
  if(m>=150&&m<155)out.push('Prohibition looks likely to be repealed by the end of 1933: New York will sell drink again, and the cruises to nowhere will lose their point.');
  if(m>=213&&m<228)out.push('The Ocean Aid Convention comes into force in January 1940: from then, ships without wireless may carry no passengers.');
  if(m>=62&&m<64)out.push('The coal owners and miners are deadlocked: a general strike and dear coal look likely by May.');
  return out;
}
function timesHTML(){
  const m=S.m,rk=timesRef(),C=timesConditions(m,rk),act=new Set(C.map(c=>c.key)),soon=timesComing(m);
  const hist=HIST.filter(h=>h.m<=m).slice().reverse();
  const inForce=h=>{const t=TIMES_TAG[h.m];return t&&(act.has(t)||t==='dep'&&act.has('dep'));};
  return `<section class="sec times"><h2>The times · ${MONTHS[m%12]} ${1921+Math.floor(m/12)}</h2>
    <ul class="tlist">${C.map(c=>`<li class="${c.k}"><strong>${c.name}.</strong> ${c.txt}</li>`).join('')}</ul>
    ${soon.length?`<div class="tsoon"><span class="lbl">Coming</span><ul class="tlist">${soon.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
    <details class="thist"><summary>History so far (${hist.length})</summary><ul class="news">${hist.map(h=>`<li class="hist"><time>${monthName(h.m)}${inForce(h)?' · <span class="chip bad">still in force</span>':''}</time>${h.t}</li>`).join('')}</ul></details></section>`;
}
/* the causes weighing on one ship's line, for her profit and loss */
function timesCauses(rk){if(!rk||!ROUTES[rk])return '';const C=timesConditions(S.m,rk).filter(c=>c.k==='bad');
  return C.length?`Weighing on ${ROUTES[rk].name} now: ${C.map(c=>c.name.toLowerCase()).join(', ')}. See The times on the Overview.`:'';}
/* one line in the news as each season turns */
function seasonNews(m){if(SEASON_NAME(m)===SEASON_NAME(m-1))return;const sn=SEASON_NAME(m);news(`${sn}. ${capF(SEASON_NOTE[sn])}.`);}
