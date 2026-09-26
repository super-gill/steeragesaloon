/* ================= DATA ================= */
const END_M=108;
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const CL=['f','s','t','tt'];
const CL_NAME={f:'First',s:'Second',t:'Third',tt:'Tourist Third'};
const CL_COL={f:'#B8862B',s:'#3F7F93',t:'#6F7E8A',tt:'#4F8A5B'};
const PN={GLA:'Glasgow',LIV:'Liverpool',NAP:'Naples',HAL:'Halifax',NYC:'New York'};
const ROUTES={
  hal:{a:'GLA',b:'HAL',prestige:0.8,ref:{f:40,s:20,t:10,tt:17},base:{f:40,s:150,t:650,tt:220},cargo:2600,cargoRate:1.3,war:0,
       blurb:'Canadian emigrant and grain trade. Modest fares, few rivals, steady steerage.'},
  lha:{a:'LIV',b:'HAL',prestige:0.9,ref:{f:42,s:21,t:10,tt:17},base:{f:35,s:140,t:600,tt:200},cargo:2800,cargoRate:1.3,war:0.02,
       blurb:'Emigrants, grain and timber to Canada, fighting the Canadian Pacific for every berth.'},
  liv:{a:'LIV',b:'NYC',prestige:1.5,ref:{f:55,s:24,t:12,tt:19},base:{f:70,s:200,t:700,tt:420},cargo:3000,cargoRate:1.5,war:0.03,
       blurb:'The prestige run. Rich first class if your name can win it, and the big lines watching every move.'},
  gny:{a:'GLA',b:'NYC',prestige:1.2,ref:{f:50,s:22,t:11,tt:18},base:{f:45,s:170,t:650,tt:300},cargo:2800,cargoRate:1.4,war:0.01,
       blurb:'Scots emigrants for New York and a solid cargo trade. Less glamour than Liverpool, fewer giants.'},
  nap:{a:'NAP',b:'NYC',prestige:1.0,ref:{f:58,s:28,t:16,tt:22},base:{f:25,s:90,t:1300,tt:160},cargo:2000,cargoRate:1.2,war:0.01,
       blurb:'Italian emigrant trade. Huge steerage demand, for now. Long passage, thin first class.'}
};
for(const [k,r] of Object.entries(ROUTES)){r.dist=CHART.dist[k];r.name=PN[r.a]+' ↔ '+PN[r.b];}
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
const PROV={f:.45,s:.18,t:.07,tt:.12};
const SERV_COST=[.7,1,1.9], SERV_REP=[-.8,.1,1.2];
const SPD=[.85,1,1.1], SPD_REP=[-.3,0,.4], SPD_WEAR=[.8,1,1.7];
const MAINT_COST=[0,700,1800], MAINT_GAIN=[0,1.4,3.2];
const ADV_COST=[0,300,800,1500], ADV_MULT=[1,1.06,1.12,1.17];
const YARD_DAYS={dock:25,oil:55,tourist:30,repair:45,engine:10};
const YARD_NAME={dock:'overhaul',oil:'oil conversion',tourist:'Tourist Third refit',repair:'fire repairs',engine:'engine repairs'};
const DOCK_TH=[0,40,50,60,70];
const RIVALS={
  imperial:{name:'Imperial Atlantic Line',flag:'British'},
  nordmark:{name:'Nordmark Line',flag:'German'},
  columbia:{name:'Columbia Steamship Co.',flag:'American, dry'},
  dominion:{name:'Dominion Pacific Line',flag:'Canadian'},
  partenope:{name:'Navigazione Partenope',flag:'Italian'}
};
// [rival, market weight, aggression]
const ROUTE_RIVALS={
  hal:[['dominion',3,.6],['imperial',1,.8]],
  lha:[['dominion',4,1.0],['imperial',2,.8]],
  liv:[['imperial',5,1.2],['nordmark',3,1.0],['columbia',2,.7]],
  gny:[['imperial',2,.9],['columbia',2,.7]],
  nap:[['partenope',4,.9],['columbia',1,.7]]
};
const SPEEDS=[0,0.75,2.25,5.25]; // game days per real second at Pause, 1×, 3×, 7×
const TEMPL=[
  {name:'Morven',built:1899,grt:8000,knots:14,berths:{f:60,s:180,t:900,tt:0},cargo:3000,fuel:'coal',base:200000},
  {name:'Tay Castle',built:1895,grt:5500,knots:13,berths:{f:30,s:110,t:700,tt:0},cargo:2400,fuel:'coal',base:140000},
  {name:'Arcadian Queen',built:1902,grt:10500,knots:15,berths:{f:120,s:250,t:1100,tt:0},cargo:3400,fuel:'coal',base:280000},
  {name:'Clydesdale',built:1912,grt:9000,knots:15,berths:{f:90,s:220,t:950,tt:0},cargo:3200,fuel:'coal',base:260000},
  {name:'Principessa Elena',built:1907,grt:12000,knots:16,berths:{f:150,s:300,t:1400,tt:0},cargo:3000,fuel:'coal',base:330000},
  {name:'Kronberg',built:1911,grt:15000,knots:17,berths:{f:250,s:350,t:1500,tt:0},cargo:4000,fuel:'coal',base:420000,note:'Ex-German, handed over under the peace treaty.'},
  {name:'Alcyone',built:1920,grt:7000,knots:15,berths:{f:80,s:200,t:600,tt:0},cargo:2800,fuel:'oil',base:230000,note:'Nearly new and oil-fired.'},
  {name:'Lady Ailsa',built:1904,grt:6500,knots:13.5,berths:{f:40,s:150,t:850,tt:0},cargo:2600,fuel:'coal',base:160000}
];
const HIST=[
  {m:0,t:'The Morven Line opens its Glasgow office with one elderly ship, the SS Morven, and a £40,000 mortgage. The post-war freight boom has collapsed and coal is dear.'},
  {m:5,t:'The US Emergency Quota Act caps immigration by nationality. Southern European steerage to New York falls sharply.'},
  {m:24,t:'Trade is recovering. Wealthier Americans are crossing to Europe in growing numbers.'},
  {m:42,t:'The Johnson-Reed Act slashes US immigration again. Italian emigration to New York all but stops. Canada still wants settlers.'},
  {m:48,t:'The big lines are refitting steerage into Tourist Third Cabin for students and teachers. Your yard can now do the same.'},
  {m:64,t:'General Strike. The miners are locked out and bunker coal prices soar.'},
  {m:71,t:'The coal dispute is over. Bunker prices ease.'},
  {m:105,t:'Wall Street has crashed. Expect bookings to fall, first class hardest.'},
  {m:107,t:'Final month of the prototype campaign. Your net worth at the end is your score.'}
];
