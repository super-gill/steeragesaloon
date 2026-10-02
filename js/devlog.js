/* ================= WHAT'S NEW AND COMING NEXT (0.36.2; 0.37.0) =================
   The player-facing summary of recent releases and the plan, shown from the Menu. Kept short and in plain words; the full
   record is CHANGELOG.md and ROADMAP.md. Add an entry here with every release (see Releasing in the README), and move a
   plan item to DONE when it ships. */
const DEVLOG=[
  {v:'0.37.2',d:'2 October 2026',t:'Fixes from the 1927-45 test players',items:['A Line rich in government stock is no longer rescued, with its debts written off, when it runs short of cash: the bank sells its stock first. Borrowing on stock is limited, and Consols no longer follow a path you can know in advance.','The rescue terms can no longer be dodged by borrowing more or merging another line in.','The Depression bites harder: ship values fall by two fifths at the trough, and the emigrant trade to America and Canada all but stops.','A failed bank now freezes your money and pays most of it back over eighteen months, instead of taking three quarters at once.','The Fares Office stops flipping tables, head office stops moving ships back and forth, and it suggests one ship at a time for each cruise.']},
  {v:'0.37.1',d:'1 October 2026',t:'The war, the ship\'s hospital and the great disasters',items:['War freight as it was: by 1916 a ship\'s freight earns four or five times 1913, until the Ministry of Shipping holds the rates down from 1917. After the armistice the 1919-20 boom pays, until the crash.','Excess Profits Duty now bites: its standard is the pre-war profit in pounds, as the Act had it, and ships sold at boom prices pay it on the gain.','In the war you can offer ships to the Admiralty at any time (Company tab), and a Line that has offered one chooses which go after.','An isolation hospital for any passenger ship: sickness spreads slower and kills fewer, and quarantines are shorter. Built in as standard from 1935.','A great disaster at sea about once a decade from the 1920s, by fire, collision, foundering or stranding. Usually it is a rival\'s ship. A worn, old, ill-found ship is likelier to be the one.']},
  {v:'0.37.0',d:'1 October 2026',t:'Rescue',items:['A Line the bank forecloses on is usually rescued, once: by a consortium of banks, by a rival line that takes two fifths of it, or, from 1921 for a Line that matters to the country, by the Treasury. Each rescue has its price, from no dividends to a government director who will not let a ship be sold. A second failure is final.','The Bank tab shows the rescue, what is still owed and your own share of the Line, and you can repay early.','Rescue sums are small for a small Line: a fleet that loses money every month is only given time to put it right.','The panics and the Depression are not made harder yet: they already finish many Lines. That waits for the next test players.']},
  {v:'0.36.5',d:'1 October 2026',t:'Costs that grow with the fleet, and a follow camera',items:['Head office costs grow with the tonnage, lines and ports you run, and more again for a big fleet from one office; each department you keep takes some of that off. The Company tab shows the sums.','Fast ships burn the coal they should: an express of 25 knots about twice an ordinary ship of her size.','Follow on the chart: from a ship\'s page, the chart keeps her in the middle.']},
  {v:'0.36.4',d:'1 October 2026',t:'Fixes from the phone',items:['The Menu button no longer sits under the clock on a phone.','A ship that is lost, seized or sold off stays under Needs attention until noted, and the Fleet tab lists the ships gone from the fleet.','A ship without wireless that sinks stays on the lists, reckoned at sea, until she is posted missing.']},
  {v:'0.36.3',d:'1 October 2026',t:'Hotfix',items:['If a panel fails to draw, the rest of the game keeps going and a notice at the foot of the screen says what went wrong. Please send that line to the developer.']},
  {v:'0.36.2',d:'1 October 2026',t:'Running a fleet by line',items:[
    'Each ship shows the line she was built for, and anything about her build that does not suit the line she is on (too deep for a port, short of coal for the longest leg). The Fleet Manager\'s Fittings view has a Built for column.',
    'Head office keeps a ship on the line she was built for unless another pays clearly more, and suggests bringing her home when she would do as well there.',
    'Head office advises only one ship onto a line at a time, so it no longer piles the fleet onto whichever line looks best.',
    'Forecasts now allow for time in the yard, breakdowns and repairs. They were about twice what ships then earned; tested over many games they are now about right.',
    'The drawing office says how full your ships on a line are sailing, and how many are already on order for it.',
    'Each line can be left to you or managed by your departments. The Advice tab gathers the same advice for many ships into one item.',
    'Inside the conference no fare is set below its floor.']},
  {v:'0.36.1',d:'1 October 2026',t:'Delegation for big fleets',items:[
    'Standing orders: acting departments work under orders you can turn off one by one (Company tab).',
    'The Advice tab shows only what needs you, gravest first, and says what the departments have in hand.',
    'Interruptions (Menu, Settings): every emergency, grave only, Auto, or Quiet watch. Masters handle the rest.']},
  {v:'0.36.0',d:'1 October 2026',t:'Performance',items:[
    'No more freeze each month with a big fleet; the chart and the ship drawing are much lighter.',
    'Frame times readout (Menu, Settings).']},
  {v:'0.35.7',d:'1 October 2026',t:'Small fixes',items:['Unique ship and company names, fairer fare revisions, fewer false overdue reports, and a run of wartime fixes.']},
  {v:'0.35.6',d:'1 October 2026',t:'Loopholes closed',items:['Buying, merging and stripping a rival in the war, and flipping boom-built ships, no longer pay.']}
];
/* what is coming, in order; 'now' marks the next release */
const DEVPLAN=[
  {v:'0.38',t:'Balancing 1900 to 1940',now:true,items:['The Depression and the scripted owners, Tourist Third, and the open items from the test players, ahead of 1900 to 1940 being complete.']},
  {v:'0.40.0',t:'1900 to 1940 complete',items:['Every serious known issue closed and the game balanced to 1940.']},
  {v:'0.4x to 0.9x',t:'The later decades, to the present day',items:['Researched and built era by era, as 1900 to 1930 was: two-class liners, the cruise boom and ever bigger ships, casinos and night life aboard, Soviet budget lines, family cruising, and more.']},
  {v:'1.0',t:'The game complete to the present day',items:[]}
];
function devlogHTML(){
  const n=UI.devAll?DEVLOG.length:2;
  return `<section class="sec"><h2>Coming next</h2>${DEVPLAN.map(p=>`<div class="devitem${p.now?' now':''}"><div class="row"><strong>${p.v}</strong><span>${p.t}</span>${p.now?'<span class="chip sea">Next</span>':''}</div>${p.items.length?`<ul>${p.items.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}</div>`).join('')}</section>
    <section class="sec"><h2>What's new</h2>${DEVLOG.slice(0,n).map(r=>`<div class="devitem"><div class="row"><strong>${r.v}</strong><span>${r.t}</span><span class="meta">${r.d}</span></div><ul>${r.items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('')}
    ${DEVLOG.length>2?`<button class="btn quiet" data-act="devall">${UI.devAll?'Show less':'Earlier releases'}</button>`:''}</section>`;
}
