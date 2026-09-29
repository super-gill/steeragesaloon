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
const TIMES_TAG={[ym(1921,5)]:'quota',[ym(1924,6)]:'quota',[ym(1926,2)]:'strike',[ym(1926,4)]:'strike',[ym(1929,9)]:'dep',[ym(1930,0)]:'dep',[ym(1930,5)]:'dep',[ym(1931,8)]:'dep',[ym(1932,0)]:'dep',[ym(1936,5)]:'air',[ym(1937,8)]:'era',[ym(1938,9)]:'oceanaid',[ym(1939,6)]:'era',[ym(1941,3)]:'era',[ym(1944,4)]:'era',[ym(1946,8)]:'era',[ym(1952,3)]:'air',[ym(1958,9)]:'air',[ym(1962,4)]:'air'};

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
  rk=rk||timesRef();const k=m-M21,R=ROUTES[rk],g=R.group,out=[];const add=(key,name,txt,k)=>out.push({key,name,txt,k:k||''});
  if(!R.cruise){const sn=SEASON_NAME(m),df=seasonOf(rk,'f',m)/seasonAvg(rk,'f')-1,dt=seasonOf(rk,'t',m)/seasonAvg(rk,'t')-1;
    add('season',sn,`${capF(SEASON_NOTE[sn])}. On ${R.name}, first class is ${pctTxt(df)} and steerage ${pctTxt(dt)} on the year's average.`,df<-0.12?'bad':df>0.12?'good':'');}
  // the American quotas, from the same figures the sailings use
  if(k>=5&&(g==='North Atlantic'||rk==='nap'||rk==='ham')){const late=k>=42,q=rk==='nap'?(late?0.14:0.45):rk==='ham'?(late?0.6:0.85):(late?0.45:0.8);
    add('quota',late?'American immigration quotas (the 1924 act)':'American immigration quotas (the 1921 act)',
      `Steerage on ${R.name} ${pctTxt(q-1)} on the old emigrant trade${rk==='nap'?'':`; from Italy it is ${pctTxt((late?0.14:0.45)-1)}`}.${late?' Only those with a visa may sail.':''}`,'bad');}
  if(k>=42&&g==='Canada')add('canada','Canada wants settlers','With the United States all but closed, steerage to Canada is up 20%.','good');
  if(rk==='rpl'&&k>=110)add('argentina','Argentina closes its doors','Steerage to the River Plate is down 40% while the slump lasts.','bad');
  // the emigrant years before the war: the flood, the lines' wars, the Combine, Ellis Island
  if(k<0){const t=preDemand('t',rk,m)/preDemand('t',rk,S.m0),f=preDemand('f',rk,m)/preDemand('f',rk,S.m0),y=Math.floor(yearOfM(m));
    if((!R.cruise&&R.group!=='Trades'||rk==='rpl')&&!pre21(m))add('flood','The steerage flood',`Emigrants are leaving Europe in huge numbers: steerage on ${R.name} is ${t>=1.05?`${pctTxt(t-1)} on 1900`:'about as it was in 1900'}, first class ${pctTxt(f-1)}.`,t>1.3?'good':'');
    if(m<CONF_FROM)add('noconf','No conference','The lines price as they like. Wars between them break out on the busy trades and can halve steerage fares for months, until they agree a pool.','');
    if(S.trust)add('trust',`The ${TRUST_NAME}`,`American money holds ${trustMembers().map(o=>RIVALS[o].name).join(', ')}. ${m<ym(1908,0)?'It buys what lines it can, and':'It has stopped buying, but it still'} answers any line that will not sell with a rate war.`,'bad');
    if(g==='North Atlantic'||rk==='nap')add('ellis','Ellis Island',`America taxes each immigrant $${m>=ym(1907,0)?4:m>=ym(1903,0)?2:1}, paid by the line, and refuses about 2 in 100; the line carries them home at its own cost. A hostel at the port of sailing halves the refusals.`,'');}
  if(k<0&&m>=CONF_FROM)add('conf','The conference',`The North Atlantic lines hold fares to the conference rates and share out the steerage; members are spared rate wars.${S.conf?' The Morven Line is a member.':' The Morven Line sails outside it.'}`,'');
  if(k<0&&coalStrike(m)>1.05)add('coalstrike','The coal strike',`Bunker coal is ${pctTxt(coalStrike(m)-1)} while the miners are out.${bunkerHeld()?' Your bunker contract keeps its price.':' A bunker contract would have kept its price.'}`,'bad');
  if(atWar(m)){const f=warPax('f',rk||'liv',m),t=warPax('t',rk||'liv',m);
    add('war','The war',`Steerage ${pctTxt(t-1)} and first class ${pctTxt(f-1)} on the pre-war trade; freight pays ${pctTxt(warFreight(m)*warCargoVol(m)-1)} more, and every hold fills. Coal ${pctTxt(warCoal(m)-1)} and wages ${pctTxt(warWage(m)-1)} over their pre-war price, and the state's war-risk insurance costs ${(warInsRate(m)*100).toFixed(1)}% of a ship's value a month. The Admiralty has about ${Math.round(reqShare(m)*100)}% of the fleets on war service. No yard will take an order.`,'bad');
    {const w=warThreat(m);add('sea','The war at sea',`${m<SUB_FROM?'German cruisers are raiding the southern trades; mines lie off the home ports.':w>=2.5?'Unrestricted submarine warfare: the worst losses of the war.':w>=1.5?'The submarines are still sinking ships every day.':'Submarines hunt the approaches; mines lie off the home ports.'}${convoyOK()?' Ships sail in escorted convoys.':''} The state's scheme pays four fifths of a ship sunk by the enemy.`,'bad');}
    add('epd','Excess Profits Duty',`${Math.round((EPD_RATE[Math.floor(yearOfM(m))]||0.5)*100)}% of this year's profit above the Line's pre-war standard goes to the Treasury next January.`,'bad');}
  else if(newCal()&&m>ARMISTICE&&m<M21){add('peace','After the armistice',`${m<ym(1920,0)?'The ships are coming home from war service. ':''}Cabin passengers are ${pctTxt(warPax('f',rk||'liv',m)-1)} and steerage ${pctTxt(warPax('t',rk||'liv',m)-1)} on the pre-war trade${warPax('t',rk||'liv',m)>1.01?' (the emigrants are rushing to cross before America shuts the door)':''}, and freight still pays ${pctTxt(warFreight(m)-1)} more.`,'');
    add('bubble','The shipping boom',`${bubbleOn(m)?`Second-hand ships fetch ${pctTxt(warShips(m)-1)} over their normal price and new ships cost ${pctTxt(warBuild(m)-1)} more. Buyers are offering for ships; speculators are floating new lines on borrowed money.`:m<ym(1920,9)?'The yards are taking orders again, at inflated prices.':`The boom is breaking. Ships fetch ${pctTxt(warShips(m)-1)} over normal and falling; freight is dropping every month.`}`,m>=ym(1920,9)?'bad':'good');}
  if(k<0&&S.dis&&S.dis.fin&&m<ym(1914,0))add('giants','After the loss',`First class is nervous of the giant ships since SS ${S.dis.name} was lost: about 8% fewer book on ships of ${int(DIS_GRT)} tons or more.`,'');
  if(k<0&&S.dis&&S.dis.rule==='ice'&&rk&&GEO(geoKey(rk,m))&&trackF(geoKey(rk,m),m)>1)add('track','The southern track','Ships keep well south of the ice in spring: crossings on this route are about 4% longer until July.','');
  if(k<0&&preReturn(m)>1.05&&(g==='North Atlantic'||rk==='nap'))add('returns','Going home',`The American slump has closed the factories: steerage home from New York is ${pctTxt(preReturn(m)-1)} on a usual year, and fewer come out.`,'');
  if(S.riband&&k<0)add('riband','The Blue Riband',S.riband.o==='morven'?`Your SS ${S.riband.name} holds it at ${S.riband.knots} knots: the Line's standing rises while she does.`:`${RIVALS[S.riband.o]?RIVALS[S.riband.o].name:'A rival'}'s SS ${S.riband.name} holds it at ${S.riband.knots} knots.`,S.riband.o==='morven'?'good':'');
  // the recovery of the early twenties and the growth that follows, for the cabin classes
  if(k>=0&&k<106){const f=k<12?0.85:k>=24?1+0.035*(Math.min(k,105)-24)/12:1;
    if(f<0.97)add('postwar','After the post-war crash',`Cabin passengers are ${pctTxt(f-1)} on a normal year: the boom has collapsed and people are nervous of spending.`,'bad');
    else if(f>1.03)add('growth','Prosperous times',`Wealthier Americans are crossing to Europe in growing numbers: first and second class ${pctTxt(f-1)} on 1922.`,'good');}
  const dep=['f','s','t'].map(c=>depression(c,m));
  if(dep[0]<0.99){const sl=slump(m);
    add('dep','The Depression',`First class ${pctTxt(dep[0]-1)}, second ${pctTxt(dep[1]-1)}, steerage ${pctTxt(dep[2]-1)}; cargo ${pctTxt(cargoMod(m)-1)}.${sl>0.05?` Costs have come down with it: coal ${pctTxt(-SLUMP_CUT.fuel*sl)}, wages ${pctTxt(-SLUMP_CUT.wage*sl)}, port dues ${pctTxt(-SLUMP_CUT.dues*sl)}.`:''}`,'bad');}
  if(typeof crashF==='function'&&crashF(m)>0)add('panic','A panic in the City',`First class ${pctTxt(crashMod('f',m)-1)}, steerage ${pctTxt(crashMod('t',m)-1)}, second-hand ships ${pctTxt(shipMkt()-1)}. The bank is nervous.`,'bad');
  const e=eraMod('f',rk,m);if(Math.abs(e-1)>0.02){const y=yearOfM(m);add('era',y>=1937.7&&y<1938.8?'A recession in America':'The long boom',`First class ${pctTxt(e-1)} on the underlying trade.`,e<1?'bad':'good');}
  const a=airShare(rk,'f',m);if(a>0.005)add('air','Competition from the air',`About ${Math.round(a*100)}% of first class ${a>0.1?'now flies':'goes by air'} on this route.`,'bad');
  if(k>=64&&k<=70)add('strike','The coal dispute','Bunker coal is up about 90% until the miners go back.','bad');
  else if(!(k<0&&coalStrike(m)>1.05)){const ref=k<0?1.9:1.6,cp=coalPrice(m)/(1+0.04*Math.sin(k*1.3))/ref-1;if(cp>0.12)add('coal','Dear coal',`Bunker coal ${pctTxt(cp)} on ${k<0?'its usual price':'the mid-twenties price'}${k>=258?': the mines cannot keep up, and oil is the fuel of the future':''}.`,'bad');}
  const px=PX();if(k>=0&&Math.abs(px-1)>0.03)add('prices','The cost of living',`Prices are ${Math.abs(Math.round((px-1)*100))}% ${px>1?'above':'below'} 1921: wages, coal, yard work, ships and fares all follow them.`,'');
  for(const w in S.wars)if(S.lines[w]){const W=S.wars[w];add('war:'+w,`A rate war on ${ROUTES[w].name}`,W.lines?`${W.by.map(o=>RIVALS[o].name).join(' and ')} are fighting over the trade: steerage at about ${Math.round(W.multT*100)}% of the usual fare and cabins ${Math.round(W.mult*100)}%, the other lines following part of the way, for about ${W.left} more month${W.left>1?'s':''}.`:W.trust?`The Combine's lines are carrying at a loss to punish your refusal, for about ${W.left} more month${W.left>1?'s':''}.`:'Fares are being cut to the bone on this line until one side gives way.','bad');}
  if(k>=-12&&k<156)add('dry','Prohibition','American ports are dry: nothing sold at the bar in New York, and fines when crew are caught smuggling. The cruises to nowhere sell drink beyond the limit.','');
  return out;
}
/* what a real owner would know is coming */
function timesComing(m){
  const k=m-M21,out=[];let n=m+1;while(SEASON_NAME(n)===SEASON_NAME(m))n++;
  const sn=SEASON_NAME(n);out.push(`${sn} from ${MONTHS[n%12]}. ${capF(SEASON_NOTE[sn])}.`);
  if(m>=ym(1902,3)&&m<TRUST_FROM)out.push('An American banker is quietly buying Atlantic lines. The talk is of a trust to rule the ocean, and of what it would do to lines that will not sell.');
  if(m>=ym(1902,9)&&m<ym(1903,2))out.push('Congress is set to double the head tax on immigrants to $2 from March, paid by the lines.');
  if(m>=ym(1906,9)&&m<ym(1907,0))out.push('The head tax on immigrants rises to $4 in January.');
  if(m>=ym(1907,9)&&m<CONF_FROM)out.push('The big lines are negotiating a North Atlantic conference, to end the rate wars. It should be formed by the new year.');
  if(m>=ym(1911,0)&&m<ym(1911,6))out.push('American wireless law comes into force in July: ships leaving American ports with fifty or more aboard must carry it, and only ships with it will carry the mails.');
  if(m>=ym(1911,10)&&m<ym(1912,2))out.push('The miners are balloting for a national strike. If they come out, bunker coal will cost two or three times its price for weeks; a bunker contract would keep its price.');
  if(newCal()&&m<M21)for(const q of PREWAR_SHIPS)if(S.prewar&&S.prewar.ordered[q.name]&&!S.prewar.done[q.name]&&q.at-m<=6&&q.at>m)out.push(`${RIVALS[S.prewar.ordered[q.name]].name}'s ${PREWAR_NAME[q.kind]} SS ${q.name} (${int(q.grt)} tons, ${q.knots} knots) enters service on ${ROUTES[q.rk].name} in ${MONTHS[q.at%12]}.`);
  if(newCal()&&m===ym(1914,6))out.push('Austria has sent Serbia an ultimatum after the murder of the Archduke. The City is nervous; if the great powers are drawn in, the Atlantic trade will be the first casualty.');
  if(newCal()&&m>=ym(1920,6)&&m<M21)out.push('Freight rates have passed their peak. The bankers expect a hard winter for owners who bought or built at the top.');
  if(S.war&&S.war.auction)out.push(`The Reparations Commission auctions ${S.war.auction.lots.map(l=>'SS '+l.name).join(' and ')} in ${monthName(S.war.auction.close)}. Bids on the Buy and build tab.`);
  if(newCal()&&m>=RESERVE_FROM&&m<WAR_FROM)out.push('The Admiralty wants ships for its reserve list, in case of war. A line that volunteers chooses which ships it gives up and is paid better. See the Company tab.');
  if(newCal()&&m>=BOAT_NEWS&&m<BOAT_LAW)out.push('From July 1913 every British ship must carry boats for everyone aboard. A ship without them may carry only as many passengers as her boats hold.');
  if(newCal()&&m>=ym(1913,8)&&m<CONV_SIGN)out.push('The maritime nations are meeting in London to agree rules for the safety of life at sea: boats, drills and the wireless watch.');
  if(newCal()&&m>=CONV_SIGN&&m<WATCH_LAW)out.push('From July the London Convention requires a wireless watch day and night on every passenger ship: a second operator in each.');
  if(k>=36&&k<42)out.push('A far tighter immigration law is before Congress. If it passes, steerage to New York will fall much further.');
  if(k>=150&&k<155)out.push('Prohibition looks likely to be repealed by the end of 1933: New York will sell drink again, and the cruises to nowhere will lose their point.');
  if(k>=213&&k<228)out.push('The Ocean Aid Convention comes into force in January 1940: from then, ships without wireless may carry no passengers.');
  if(k>=62&&k<64)out.push('The coal owners and miners are deadlocked: a general strike and dear coal look likely by May.');
  return out;
}
function timesHTML(){
  const m=S.m,rk=timesRef(),C=timesConditions(m,rk),act=new Set(C.map(c=>c.key)),soon=timesComing(m);
  const hist=histNow().filter(h=>h.m<=m&&h.m>=(S.m0??M21)).slice().reverse();
  const inForce=h=>{const t=TIMES_TAG[h.m];return t&&(act.has(t)||t==='dep'&&act.has('dep'));};
  return `<section class="sec times"><h2>The times · ${MONTHS[m%12]} ${YEAR0+Math.floor(m/12)}</h2>
    <ul class="tlist">${C.map(c=>`<li class="${c.k}"><strong>${c.name}.</strong> ${c.txt}</li>`).join('')}</ul>
    ${soon.length?`<div class="tsoon"><span class="lbl">Coming</span><ul class="tlist">${soon.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
    <details class="thist"><summary>History so far (${hist.length})</summary><ul class="news">${hist.map(h=>`<li class="hist"><time>${monthName(h.m)}${inForce(h)?' · <span class="chip bad">still in force</span>':''}</time>${h.t}</li>`).join('')}</ul></details></section>`;
}
/* the causes weighing on one ship's line, for her profit and loss */
function timesCauses(rk){if(!rk||!ROUTES[rk])return '';const C=timesConditions(S.m,rk).filter(c=>c.k==='bad');
  return C.length?`Weighing on ${ROUTES[rk].name} now: ${C.map(c=>c.name.toLowerCase()).join(', ')}. See The times on the Overview.`:'';}
/* one line in the news as each season turns */
function seasonNews(m){if(SEASON_NAME(m)===SEASON_NAME(m-1))return;const sn=SEASON_NAME(m);news(`${sn}. ${capF(SEASON_NOTE[sn])}.`);}
