/* ================= DATA ================= */
const GAME_VERSION='0.7.0',GAME_BUILT='27 September 2026'; // bump on every release; see CHANGELOG.md
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const CL=['f','s','t','tt'];
const CL_NAME={f:'First',s:'Second',t:'Third',tt:'Tourist Third'};
const CL_COL={f:'#B8862B',s:'#3F7F93',t:'#6F7E8A',tt:'#4F8A5B'};
const PN=CHART.portNames;
/* Cargo commodities. Rates are pounds per ton; season multiplies the tonnage on offer by month. Reefer cargo needs refrigerated holds. */
const COMM={
  general:{name:'General cargo',rate:1.3},
  manuf:{name:'Manufactures',rate:1.7},
  grain:{name:'Grain',rate:1.1,season:[.8,.7,.6,.6,.7,.8,.9,1.1,1.4,1.5,1.4,1.1]},
  cotton:{name:'Raw cotton',rate:2.0,season:[1.4,1.3,1.1,.8,.5,.4,.4,.5,.8,1.3,1.5,1.5]},
  bananas:{name:'Bananas',rate:3.0,reefer:true,season:[.9,1,1.2,1.3,1.2,1,.9,.9,.9,.9,1,1]},
  beef:{name:'Chilled beef',rate:4.2,reefer:true},
  palm:{name:'Palm oil and kernels',rate:2.0}
};
/* Services. Calls come from the chart in outbound order; homeward reverses them. base = passengers per round trip market unit. */
const ROUTE_GROUPS=['North Atlantic','Canada','Mediterranean','Trades'];
const ROUTES={
  exp:{group:'North Atlantic',prestige:1.7,ref:{f:70,s:28,t:13,tt:21},base:{f:130,s:230,t:450,tt:300},cargo:{out:{c:'general',t:1000},home:{c:'general',t:1000}},war:0.04,
       blurb:'The express route to New York via Cherbourg. The richest first class on the ocean, the biggest and fastest rivals, and the Blue Riband.'},
  liv:{group:'North Atlantic',prestige:1.5,ref:{f:55,s:24,t:12,tt:19},base:{f:70,s:200,t:700,tt:250},cargo:{out:{c:'general',t:1500},home:{c:'general',t:1500}},war:0.03,
       blurb:'The traditional Liverpool run, calling at Queenstown for Irish emigrants. Rich first class if your name can win it.'},
  gny:{group:'North Atlantic',prestige:1.2,ref:{f:50,s:22,t:11,tt:18},base:{f:45,s:170,t:650,tt:180},cargo:{out:{c:'general',t:1400},home:{c:'grain',t:1400}},war:0.01,
       blurb:'Scots and Ulster emigrants via Moville, and a solid cargo trade. Less glamour than Liverpool, fewer giants.'},
  ham:{group:'North Atlantic',prestige:1.1,ref:{f:50,s:24,t:12,tt:19},base:{f:50,s:180,t:1100,tt:180},cargo:{out:{c:'general',t:1500},home:{c:'general',t:1500}},war:0.03,
       blurb:'Continental emigrants from Hamburg, calling at Southampton and Cherbourg. Nordmark country.'},
  hal:{group:'Canada',prestige:0.8,ref:{f:40,s:20,t:10,tt:17},base:{f:40,s:150,t:650,tt:130},cargo:{out:{c:'general',t:1300},home:{c:'grain',t:1500}},war:0,
       blurb:'Canadian emigrant and grain trade. Modest fares, few rivals, steady steerage.'},
  lha:{group:'Canada',prestige:0.9,ref:{f:42,s:21,t:10,tt:17},base:{f:35,s:140,t:600,tt:120},cargo:{out:{c:'general',t:1400},home:{c:'grain',t:1500}},war:0.02,mload:0.85,
       blurb:'Emigrants, grain and timber to Canada, fighting the Canadian Pacific for every berth.'},
  stl:{group:'Canada',prestige:1.0,ref:{f:45,s:21,t:10,tt:17},base:{f:40,s:160,t:750,tt:150},cargo:{out:{c:'general',t:1400},home:{c:'grain',t:2200}},war:0.02,
       winter:{key:'stlw',months:[11,0,1,2,3]},
       blurb:'Up the St Lawrence to Quebec and Montreal, spring to autumn. The river freezes from December to April, when sailings turn for Saint John.'},
  nap:{group:'Mediterranean',prestige:1.0,ref:{f:58,s:28,t:16,tt:22},base:{f:25,s:90,t:1300,tt:100},cargo:{out:{c:'general',t:1000},home:{c:'general',t:1000}},war:0.01,
       blurb:'Italian emigrants from Genoa and Naples, via Gibraltar. Huge steerage demand, for now. The longest passage to New York.'},
  rpl:{group:'Trades',prestige:1.1,ref:{f:70,s:32,t:16,tt:22},base:{f:50,s:150,t:900,tt:150},dirw:{t:.85},cargo:{out:{c:'general',t:2600},home:{c:'beef',t:3600}},war:0.02,
       blurb:'The River Plate via Lisbon and Rio: Spanish and Portuguese emigrants south, chilled beef home in refrigerated holds. The richest cargo trade of the decade.'},
  cot:{group:'Trades',prestige:0.7,ref:{f:35,s:20,t:8,tt:15},base:{f:6,s:12,t:0,tt:0},cargo:{out:{c:'general',t:2500},home:{c:'cotton',t:3800}},war:0.01,
       blurb:"Lancashire's cotton: coal and manufactures out, raw cotton home from New Orleans and Galveston. The harvest ships from October to March."},
  ban:{group:'Trades',prestige:0.9,ref:{f:45,s:25,t:10,tt:16},base:{f:30,s:40,t:0,tt:0},cargo:{out:{c:'general',t:800},home:{c:'bananas',t:2600}},war:0.01,
       blurb:'Bananas from Jamaica to Avonmouth. Fast refrigerated ships only: without cold holds the fruit rots. A few planters and tourists in the cabins.'},
  waf:{group:'Trades',prestige:0.8,ref:{f:50,s:28,t:14,tt:18},base:{f:28,s:40,t:40,tt:0},cargo:{out:{c:'manuf',t:2200},home:{c:'palm',t:2400}},war:0.01,
       blurb:'Liverpool to Freetown and Lagos: cotton goods, salt and hardware out, palm oil and kernels home. Colonial officials in the cabins.'}
};
/* geography: a route (or its winter variant) as sailed in a given month */
const geoKey=(rk,m)=>{const w=ROUTES[rk].winter;return w&&w.months.includes(((m%12)+12)%12)?w.key:rk;};
const GEO=k=>CHART.routes[k];
const geoEnds=k=>{const c=GEO(k).calls;return [c[0][0],c[c.length-1][0]];};
for(const [k,r] of Object.entries(ROUTES)){const g=GEO(k);r.dist=g.dist;r.calls=g.calls.map(c=>c[0]);r.a=r.calls[0];r.b=r.calls[r.calls.length-1];
  r.name=r.calls.length>2?PN[r.a]+' → '+PN[r.b]:PN[r.a]+' ↔ '+PN[r.b];r.via=r.calls.slice(1,-1).map(c=>PN[c]);}
const DIRW={f:.5,s:.5,t:.8,tt:.5}; // share of round-trip demand travelling westbound
const SEASON={
  f:[.55,.55,.75,.95,1.2,1.45,1.5,1.4,1.1,.85,.65,.7],
  s:[.65,.65,.8,1,1.15,1.35,1.4,1.3,1.1,.9,.75,.8],
  t:[.7,.8,1.1,1.3,1.3,1.1,1,1,1,.9,.8,.7],
  tt:[.35,.35,.6,.9,1.4,1.9,2,1.8,1.2,.7,.4,.45]
};
const E={f:1.3,s:1.5,t:1.9,tt:1.8};
const SERV={f:[.8,1,1.15],s:[.9,1,1.08],t:[.97,1,1.02],tt:[.88,1,1.1]};
const SPD_D={f:[.92,1,1.06],s:[.95,1,1.04],t:[1,1,1],tt:[.95,1,1.03]};
const PROV={f:1.2,s:.45,t:.12,tt:.25}; // catering, pounds per passenger per day
const SERV_COST=[.7,1,1.9], SERV_REP=[-.8,.1,1.2];
const SPD=[.85,1,1.1], SPD_REP=[-.3,0,.4], SPD_WEAR=[.8,1,1.7];
const MAINT_COST=[0,700,1800], MAINT_GAIN=[0,1.4,3.2];
const ADV_COST=[0,300,800,1500], ADV_MULT=[1,1.06,1.12,1.17];
/* Yard work: maintenance jobs and upgrades. days are before any repair-yard discount. */
const YARD_DAYS={dock:25,oil:55,tourist:30,repair:45,engine:10,reefer:40,wireless:7,turbines:70,lux:35,refurb:25,gear:15};
const YARD_NAME={dock:'overhaul',oil:'oil conversion',tourist:'Tourist Third refit',repair:'fire repairs',engine:'engine repairs',
  reefer:'refrigerated holds',wireless:'wireless telegraphy',turbines:'new turbines',lux:'luxury first-class refit',refurb:'refurbishment',gear:'new cargo gear'};
/* Upgrades a ship can have fitted once. */
const UPGRADES={
  reefer:{name:'Refrigerated holds',desc:'Carries chilled beef and bananas. Without them she can take only a sliver of those cargoes.'},
  wireless:{name:'Wireless telegraphy',desc:'She reports from sea as things happen; without it you hear late, through Lloyd\'s. Needed for the mails, and tugs reach her sooner.'},
  turbines:{name:'New turbines',desc:'About 1.5 knots faster, and a little more economical.'},
  lux:{name:'Luxury first class',desc:'Suites and a grand saloon: first class appeal up a fifth.'},
  gear:{name:'Modern cargo gear',desc:'Electric winches and derricks: a day less in every port.'}
};
const DOCK_TH=[0,40,50,60,70];
const RIVALS={
  imperial:{name:'Imperial Atlantic Line',flag:'British'},
  nordmark:{name:'Nordmark Line',flag:'German'},
  columbia:{name:'Columbia Steamship Co.',flag:'American, dry'},
  dominion:{name:'Dominion Pacific Line',flag:'Canadian'},
  partenope:{name:'Navigazione Partenope',flag:'Italian'},
  aurore:{name:'Compagnie Aurore',flag:'French'},
  antilles:{name:'Antilles Fruit Company',flag:'British'},
  guinea:{name:'Guinea Coast Line',flag:'British'},
  pampas:{name:'Pampas & Plate Line',flag:'British'},
  gulf:{name:'Mersey & Gulf Line',flag:'British'}
};
const SPEEDS=[0,0.6,1.8,4.2]; // game days per real second at Pause, 1×, 3×, 7×
const TEMPL=[
  {name:'Morven',built:1899,grt:8000,knots:14,berths:{f:60,s:180,t:900,tt:0},cargo:3000,fuel:'coal',base:200000},
  {name:'Tay Castle',built:1895,grt:5500,knots:13,berths:{f:30,s:110,t:700,tt:0},cargo:2400,fuel:'coal',base:140000},
  {name:'Arcadian Queen',built:1902,grt:10500,knots:15,berths:{f:120,s:250,t:1100,tt:0},cargo:3400,fuel:'coal',base:280000},
  {name:'Clydesdale',built:1912,grt:9000,knots:15,berths:{f:90,s:220,t:950,tt:0},cargo:3200,fuel:'coal',base:260000},
  {name:'Principessa Elena',built:1907,grt:12000,knots:16,berths:{f:150,s:300,t:1400,tt:0},cargo:3000,fuel:'coal',base:330000},
  {name:'Kronberg',built:1911,grt:15000,knots:17,berths:{f:250,s:350,t:1500,tt:0},cargo:4000,fuel:'coal',base:420000,note:'Ex-German, handed over under the peace treaty.'},
  {name:'Alcyone',built:1920,grt:7000,knots:15,berths:{f:80,s:200,t:600,tt:0},cargo:2800,fuel:'oil',base:230000,note:'Nearly new and oil-fired.'},
  {name:'Lady Ailsa',built:1904,grt:6500,knots:13.5,berths:{f:40,s:150,t:850,tt:0},cargo:2600,fuel:'coal',base:160000},
  {name:'Ardmore',built:1910,grt:5800,knots:11.5,berths:{f:12,s:0,t:0,tt:0},cargo:8500,fuel:'coal',base:120000,note:'A plain cargo liner: big holds, a dozen cabins.'},
  {name:'Kinross',built:1906,grt:4800,knots:10.5,berths:{f:6,s:0,t:0,tt:0},cargo:7500,fuel:'coal',base:80000,note:'A slow, cheap cargo steamer.'},
  {name:'Rio Negro',built:1911,grt:9500,knots:14,berths:{f:70,s:80,t:500,tt:0},cargo:5500,fuel:'coal',base:260000,reefer:true,note:'Built for the River Plate, with refrigerated holds.'},
  {name:'Golden Hind',built:1913,grt:4600,knots:15,berths:{f:50,s:30,t:0,tt:0},cargo:2600,fuel:'coal',base:150000,reefer:true,note:'A fast refrigerated fruit ship.'},
  {name:'Montrose Castle',built:1909,grt:6500,knots:12.5,berths:{f:60,s:50,t:80,tt:0},cargo:5000,fuel:'coal',base:150000,note:'A passenger-cargo ship built for the West Africa trade.'}
];
/* Captains' traits and their effects (used in sim). */
const CAPT_TRAITS={
  cautious:{name:'Cautious',good:true,desc:'Fewer accidents and breakdowns; slightly slower passages.'},
  driver:{name:'Hard-driving',good:true,desc:'Faster passages; wears the ship harder.'},
  popular:{name:'Popular with passengers',good:true,desc:'First and second class like sailing with him; the crew too.'},
  weather:{name:'Weather-wise',good:true,desc:'Loses far less time to gales.'},
  veteran:{name:'Old hand',good:true,desc:'Nurses his engines; the ship wears more slowly.'},
  martinet:{name:'Martinet',good:false,desc:'A tight, disciplined ship, and an unhappy crew.'},
  lax:{name:'Lax',good:false,desc:'Easy-going; the crew smuggle and the fines follow.'},
  drinker:{name:'Fond of a drink',good:false,desc:'Cheap to hire, and a risk at sea.'}
};
const CAPT_FIRST=['Alexander','Angus','Archibald','Arthur','Charles','David','Donald','Duncan','Edward','Ernest','Frederick','George','Hector','Hugh','James','John','Kenneth','Malcolm','Neil','Patrick','Robert','Thomas','Walter','William'];
const CAPT_LAST=['Anderson','Baird','Buchanan','Cameron','Campbell','Crawford','Doherty','Dunlop','Ferguson','Fraser','Gillespie','Grant','Hamilton','Kerr','Lamont','MacAulay','MacKinnon','MacLeod','McBride','Montgomery','Morrison','Munro','Reid','Robertson','Sinclair','Stewart','Walker','Wallace'];
const CREW_PAY=['Low','Standard','High'],CREW_PAY_MULT=[0.88,1,1.15],MORALE_TARGET=[35,60,80];
/* Shore establishment. */
const PIER_COST={NYC:60000,LIV:35000,GLA:30000,SOU:45000,HAM:40000,HAL:20000,QBC:20000,MTL:25000,NAP:20000,GEN:20000,BUE:30000,RIO:25000,NOL:20000,GAL:15000,KIN:12000,FRE:10000,LAG:12000,AVO:15000,CHE:20000,QUE:12000,MOV:8000,GIB:15000,LIS:15000,MVD:15000,SJN:15000};
const AGENCY={
  british:{name:'British and Irish agents',ports:['GLA','LIV','MOV','QUE','AVO'],cost:12000},
  continent:{name:'Continental agents (Germany, Scandinavia, Central Europe)',ports:['HAM','SOU','CHE'],cost:15000},
  med:{name:'Mediterranean and Iberian agents',ports:['GEN','NAP','GIB','LIS'],cost:12000},
  americas:{name:'American and Canadian agents',ports:['NYC','HAL','SJN','QBC','MTL','NOL','GAL','KIN','RIO','MVD','BUE'],cost:15000}
};
/* head-office departments: each advises on its own business, and can be told to act on it within a cash reserve */
/* staff grow with the fleet; rent is the office floor in West George Street; heads are hired and can be replaced */
const DEPTS={
  fares:{name:'Fares Office',head:'Chief Fares Clerk',cost:6000,rent:60,staff:[3,0.3,1],does:'Watches the conference tariffs and rival sailings. Sets fares, answers rate wars and matches cuts.'},
  traffic:{name:'Traffic Department',head:'Traffic Manager',cost:10000,rent:90,staff:[4,0.5,0.5],does:'Studies every trade for loads and returns. Moves ships between your lines, lays up losers, spends on advertising. Proposes new lines, ships to buy or build, and sales.'},
  marine:{name:'Marine Superintendent',head:'Marine Superintendent',cost:8000,rent:70,staff:[3,0.6,0],does:'Keeps the fleet in class. Sets dock thresholds and speeds, and books refits that pay for themselves.'},
  crew:{name:'Crewing Office',head:'Crewing Manager',cost:5000,rent:50,staff:[2,0.4,0],does:'Hires and keeps crews. Sets pay to hold morale and replaces bad masters from the pool.'}
};
const CLERK_WAGE=14;
const HOSTEL_PORTS=['GLA','LIV','SOU','HAM'];
const YARD_PORTS={GLA:'the Clyde',LIV:'the Mersey'};
const HIST=[
  {m:0,t:'The Morven Line opens its Glasgow office with one elderly ship, the SS Morven, and a £40,000 mortgage. The post-war freight boom has collapsed and coal is dear.'},
  {m:5,t:'The US Emergency Quota Act caps immigration by nationality. Southern European steerage to New York falls sharply.'},
  {m:24,t:'Trade is recovering. Wealthier Americans are crossing to Europe in growing numbers.'},
  {m:42,t:'The Johnson-Reed Act slashes US immigration again. Italian emigration to New York all but stops. Canada still wants settlers.'},
  {m:48,t:'The big lines are refitting steerage into Tourist Third Cabin for students and teachers. Your yard can now do the same.'},
  {m:62,t:'The coal owners and miners are deadlocked. The newspapers talk of a general strike by May: bunker coal may soon be very dear.'},
  {m:64,t:'General Strike. The miners are locked out and bunker coal prices soar.'},
  {m:71,t:'The coal dispute is over. Bunker prices ease.'},
  {m:105,t:'Wall Street has crashed. Expect bookings to fall, first class hardest.'},
  {m:108,t:'Bookings for next season are falling away, and the other lines are already shading their fares to fill berths.'},
  {m:113,t:'The United States raises its tariffs sharply. Cargo is getting scarce on every route.'},
  {m:128,t:'Britain leaves the gold standard. Freight rates and fares are in turmoil.'},
  {m:132,t:'The depths of the Depression. Across the world, ships are being laid up by the hundred.'},
  {m:156,t:'Trade is slowly recovering. Bookings are creeping back.'},
  {m:170,t:'Imperial Atlantic announces an 80,000-ton express liner for the Southampton run. The race for the Blue Riband is on again.'},
  {m:180,t:'Radio-telephone service from mid-ocean opens. First-class passengers can now call London from the Grand Banks.'},
  {m:185,t:'The Zeppelin company opens a weekly airship service from Frankfurt to New Jersey. The newspapers call it the end of the liner, and some first-class passengers agree.'},
  {m:193,t:'Air conditioning comes to sea: cooled dining saloons for the tropical trades.'},
  {m:200,t:'A sharp recession in America. Bookings dip for the coming season.'},
  {m:208,t:'The airship Graf Aurelian burns at her mooring mast in New Jersey. The airship boom ends overnight, and first class comes back to the liners.'},
  {m:213,t:'The Ocean Aid Convention is signed in London. From January 1940 every passenger ship must keep a continuous wireless watch, and every ship must answer a distress call. Ships without wireless may carry no passengers.'},
  {m:215,t:"Imperial Atlantic's superliner Britannic Queen enters service: 80,000 tons, 30 knots, and the Blue Riband on her maiden voyage."},
  {m:222,t:'The war scare of the late thirties passes. The governments of Europe turn to trade, and the shipyards to liners.'},
  {m:228,t:'The Ocean Aid Convention is in force. Silent ships are barred from carrying passengers.'},
  {m:243,t:'Washington eases the immigration quotas. With Europe at peace and prospering, the emigrant trade to New York revives.'},
  {m:258,t:'The coal mines cannot keep up. Bunker coal is dearer every year, and oil is the fuel of the future.'},
  {m:280,t:'Paid holidays for American workers: the tourist-class boom begins.'},
  {m:302,t:'Radiolocation sets, developed from naval experiments, are offered for merchant ships. They see through fog and darkness.'},
  {m:308,t:'The long boom: trade across the Atlantic grows year on year.'},
  {m:325,t:'Model basins at Clydebank and Hamburg are refining hull lines as never before.'},
  {m:348,t:'High-pressure steam turbines and a new contemporary style in ship interiors.'},
  {m:354,t:'Middle-Eastern oil floods the market. Bunker oil is cheaper than it has been for a generation.'},
  {m:375,t:'Flying boats begin carrying the transatlantic mails. The Post Office cuts its mail payments by a fifth.'},
  {m:401,t:'Fin stabilisers: retractable fins that all but stop a ship rolling.'},
  {m:418,t:'Winter cruising from New York to the Caribbean is all the rage. Liners that once lay idle in winter now sail full.'},
  {m:453,t:'A jet airliner crosses the Atlantic in six hours. Few can afford it, but the shipping men are uneasy.'},
  {m:496,t:'After a run of accidents, the Atlantic Air Conference caps jet flights and fares. The liner keeps its passengers.'},
  {m:540,t:'The Atomic Energy Authority offers a nuclear power plant for large ships: no bunkers, ever, at a price.'}
];
const MILESTONES=[
  ['ships2','A second ship',()=>S.ships.length>=2],
  ['ships5','A fleet of five',()=>S.ships.length>=5],
  ['ships10','A fleet of ten',()=>S.ships.length>=10],
  ['lines3','Three lines in service',()=>Object.keys(S.lines).length>=3],
  ['trades','A cargo trade',()=>Object.keys(S.lines).some(k=>ROUTES[k].group==='Trades')],
  ['south','A line to South America',()=>!!S.lines.rpl],
  ['mail','A mail contract',()=>Object.keys(S.mail).length>0],
  ['rep50','Reputation 50',()=>S.rep>=50],
  ['nw250','Net worth £250,000',()=>netWorth()>=250000],
  ['nw1m','Net worth £1,000,000',()=>netWorth()>=1000000],
  ['pier','A pier of your own',()=>Object.keys(S.shore.piers).length>0],
  ['yard','A repair yard',()=>Object.keys(S.shore.yards).length>0],
  ['debtfree','Free of debt',()=>S.debt<=0]
];
