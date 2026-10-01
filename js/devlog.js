/* ================= WHAT'S NEW AND COMING NEXT (0.36.2) =================
   The player-facing summary of recent releases and the plan, shown from the Menu. Kept short and in plain words; the full
   record is CHANGELOG.md and ROADMAP.md. Add an entry here with every release (see Releasing in the README), and move a
   plan item to DONE when it ships. */
const DEVLOG=[
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
    {v:'0.37.0',t:'Rescue, and harder times',now:true,items:['A Line that goes under is usually rescued, by a bank, a rival or the Treasury, at a lasting cost. With that net in place, the panics and the Depression hit harder.']},
  {v:'0.37.1',t:'The war and the ship\'s hospital',items:['War freight and Admiralty hire as they were; a choice of which ships to give up.','A ship\'s surgeon and hospital that matter in an epidemic.','A great disaster at sea about once a decade, not always the same kind.']},
  {v:'Test round 4',t:'Test players, 1927 to 1945',items:['Two test players play the late game and report what is broken or exploitable.']},
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
