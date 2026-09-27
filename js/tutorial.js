/* ================= FIRST-YEAR BRIEFING =================
   Mr Ferguson walks a new owner through the desk, one step at a time. Each step ticks itself off. */
const TUT=[
  {id:'clock',title:'Start the clock',tab:null,
    text:'The Line runs in real time. Press 1× in the header to let the days pass, and pause whenever you need to think. The clock stops by itself when something big happens.',
    done:()=>S.t>=1},
  {id:'ship',title:'Look over the Morven',tab:'fleet',
    text:'The Fleet tab is your ship: where she is, her condition, her master and crew, and the yard. She is old and slow, but she is paid for, bar the mortgage.',
    done:()=>S.tutSeen&&S.tutSeen.fleet},
  {id:'line',title:'Check your fares against the market',tab:'lines',
    text:'The Lines tab shows each service: your fares, how full she sailed, and the market report of rival lines. Cutting fares below the line rate wins passengers but angers the conference.',
    done:()=>S.tutSeen&&S.tutSeen.lines},
  {id:'wire',title:'Read the wireless room',tab:'overview',
    text:'Reports from your ships arrive in the wireless room on the Overview. The Morven has no wireless set: between ports you will hear nothing from her unless another ship passes the word on. The chart shows only where she ought to be.',
    done:()=>(S.wire||[]).length>=2&&S.t>=8},
  {id:'trip',title:'See her through a round trip',tab:'lines',
    text:'Glasgow to Halifax and back takes about three weeks. Watch how many she carries each way and what the round trip earns. Winter is lean; summer pays.',
    done:()=>{const L=S.lines.hal;return !!(L&&L.last[0]&&L.last[1]);}},
  {id:'books',title:'Read your first month\'s accounts',tab:'finance',
    text:'The Finance tab shows where the money went, by account and by line, and what you owe the bank. If the account goes too far overdrawn, the bank forecloses.',
    done:()=>!!S.lastMonth&&S.tutSeen&&S.tutSeen.finance},
  {id:'save',title:'Make a save code',tab:'company',
    text:'The game saves itself in this browser. A save code keeps a copy you can carry to another browser or computer. Make one now and then.',
    done:()=>!!(S.tutSeen&&S.tutSeen.code)},
  {id:'second',title:'Buy a second ship',tab:'brokers',
    text:'When you can put down 40% of a price and still hold three months of running costs, look at the brokers\' list. A second ship on a second trade spreads the risk. Pick one with wireless if you can.',
    done:()=>S.ships.length>=2},
  {id:'line2',title:'Open a second line',tab:'lines',
    text:'Open a new service from the Lines tab and assign a ship to it. Some lines carry emigrants and mail, some carry cotton, bananas or beef. Each has its own seasons.',
    done:()=>Object.keys(S.lines).length>=2},
  {id:'shore',title:'Look ashore',tab:'shore',
    text:'Piers, agents, hostels, yards and head-office departments all cost money every month. They pay only once you have enough ships to use them. When you do, the departments can take routine work off your hands.',
    done:()=>S.tutSeen&&S.tutSeen.shore&&S.ships.length>=2}
];
function tutorialHTML(){
  if(!S.tut||S.tut.off)return '';
  const i=TUT.findIndex(s=>!s.done());
  if(i<0){if(!S.tut.fin){S.tut.fin=S.m;news('Mr Ferguson: "That is the briefing done. The rest you will learn the hard way, as we all did."','good');}
    if(S.m-S.tut.fin>1)return '';return `<section class="sec tut"><h2>First-year briefing</h2><p class="note">All done. Mr Ferguson will keep advising below.</p></section>`;}
  const s=TUT[i];
  return `<section class="sec tut" data-key="tut"><div class="row"><h2>First-year briefing · ${i+1} of ${TUT.length}</h2><button class="btn quiet" data-act="tutoff">Skip the briefing</button></div>
    <div class="tutcard"><strong>${s.title}</strong><p class="note" style="margin:0">${s.text}</p>
    ${s.tab&&!(UI.wide&&s.tab==='overview')?`<button class="btn" data-act="tabgo" data-tab="${s.tab}" style="width:fit-content">Go there</button>`:''}</div>
    <div class="tutdots">${TUT.map((t,j)=>`<i class="${j<i?'on':j===i?'now':''}" title="${t.title}"></i>`).join('')}</div></section>`;
}
