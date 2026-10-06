/* Steerage & Saloon headless play: the game side of tools/play.js, run inside the game's own scope.
   Every action here is one of the player's own controls, written the way the screen's buttons do it (main.js),
   and refuses what the screen would refuse. */
var PL = (function () {
  const k = v => Math.round(v / 1000) + 'k', p = v => (v < 0 ? '-' : '') + '£' + Math.round(Math.abs(v)).toLocaleString('en-GB');
  const ship = id => S.ships.find(x => x.id === +id);
  const lineName = rk => ROUTES[rk] ? ROUTES[rk].name : rk;
  const openLine = rk => { if (S.lines[rk]) return true; const fee = Math.round(2500 * PX()); if (!ROUTES[rk] || !routeOpen(rk, S.m) || S.cash < fee) return false; book('office', -fee, rk); S.lines[rk] = { fares: defaultFares(rk), service: 1, adv: 1, last: [null, null] }; news(`The Morven Line opens a ${ROUTES[rk].name} service.`, 'good'); return true; };
  const own = id => { const x = ship(id); if (x) x.ownerSet = S.t; return x; };
  const quiet = () => { if (S.war) S.war.show = false; if (S.dis) S.dis.show = false; UI.disOpen = false; };
  const shut = () => typeof mkShut === 'function' && mkShut();
  const A = {
    // ---- a head-office advice button, exactly as the screen presses it: press(verb, ...args) from {button: [label, verb, ...args]}
    // the advice's Build button opens the drawing office on the screen; here it places the order as drawn (0.39.3: it opened the
    // office, which stops the clock, so the step played no months and ordered nothing)
    press: (verb, ...args) => verb === 'build' ? (() => { const d = JSON.parse(JSON.stringify(args[0] || {})); if (!d.purpose) return 'no design'; if (!d.name) { const L = SHIP_NAMES[d.purpose] || SHIP_NAMES.inter, used = new Set(S.ships.map(x => x.name).concat((S.orders || []).map(o => o.d.name))); d.name = L.find(n => !used.has(n)) || L[0] + ' II'; } const r = placeOrder(d); return r.ok ? true : 'refused: ' + r.why; })() : DOING.includes(verb) || ['propyes','propno','newhead','cruiseadd','cruisedrop','setwc','openmove','buyship','build'].includes(verb) ? doAction(verb, args) : 'not an action button',
    // ---- ships and lines
    move: (id, rk) => { if (!own(id)) return false; if (rk && !S.lines[rk] && !openLine(rk)) return false; return doAction('moveship', [+id, rk || '']); },
    layup: id => own(id) && doAction('moveship', [+id, '']),
    open: rk => openLine(rk),
    close: rk => { if (!S.lines[rk]) return false; delete S.lines[rk]; delete S.mail[rk]; S.ships.forEach(x => { if (x.line === rk) x.line = null; }); news(`The ${ROUTES[rk].name} service is closed.`); return true; },
    fares: (rk, f, s, t) => doAction('setfares', [rk, +f, +s, +t]),
    fare: (rk, cls, v) => doAction('setfare', [rk, cls, +v]),
    table: (rk, v) => doAction('setlineopt', [rk, 'service', +v]),
    adv: (rk, v) => doAction('setlineopt', [rk, 'adv', +v]),
    speed: (id, v) => own(id) && doAction('setship', [+id, 'speed', +v]),
    // the war at sea (0.39.3, KI-100): as the ship panel's own buttons; no underwriter adds cover on a ship already in trouble
    zigzag: (id, on) => own(id) && doAction('setship', [+id, 'zigzag', on ? 1 : 0]),
    convoy: (id, on) => own(id) && doAction('setship', [+id, 'convoy', on ? 1 : 0]),
    wartop: (id, on) => { const x = own(id); if (!x) return false; if (on && !x.warTop && shipInTrouble(x)) return 'no underwriter will add cover on her now'; return doAction('setship', [+id, 'warTop', on ? 1 : 0]); },
    maint: (id, v) => own(id) && doAction('setship', [+id, 'maint', +v]),
    threshold: (id, pct) => { const x = own(id); if (!x || !DOCK_TH.includes(+pct)) return false; x.autoDock = +pct; return true; },
    yard: (id, kind) => { if (!YARD_NAME[kind]) return false; return doAction('setyard', [+id, kind]); },
    unyard: id => { const x = ship(id); if (!x || x.pendingYard === 'repair') return false; x.pendingYard = null; x.yardAdd = []; x.facPlan = null; return true; },
    sell: id => doAction('sellship', [+id]),
    scrap: id => doAction('scrapship', [+id]),
    unsell: id => { const x = ship(id); if (!x || !x.pendingExit) return false; x.pendingExit = null; x.saleAmt = null; return true; },
    buy: (name, rk) => { const r = doAction('buyship', [name, rk || '']); const x = S.ships.find(q => q.name === name); return r && rk && x && x.line !== rk ? 'bought, but the line could not be opened: she has no line' : r; },
    build: (purpose, over) => { if (!PURPOSES[purpose]) return 'no purpose ' + purpose; const d = defaultDesign(purpose); Object.assign(d, over || {}); if (over && over.grt && !over.fac) d.fac = defaultFac(purpose, d.grt, yNow());
      if (!d.name) { const L = SHIP_NAMES[purpose] || SHIP_NAMES.inter, used = new Set(S.ships.map(x => x.name).concat((S.orders || []).map(o => o.d.name))); d.name = L.find(n => !used.has(n)) || L[0] + ' II'; }
      const r = placeOrder(d); return r.ok ? true : 'refused: ' + r.why; },
    cancelorder: id => { const o = (S.orders || []).find(x => x.id === +id); if (!o) return false; if (o.slip) { o.slip.who = null; o.slip.until = S.m; } S.orders = S.orders.filter(x => x !== o); news(`The contract for SS ${o.d.name} is cancelled. The ${fmt(o.paid)} already paid is lost.`, 'bad'); return true; },
    cruise: (id, rk) => own(id) && doAction('cruiseadd', [+id, rk || '']),
    uncruise: (id, rk) => doAction('cruisedrop', [+id, rk]),
    insurance: (id, cover, excess) => { const x = own(id); if (!x || !INS_COVER[cover] || (cover === 'none' && S.debt > 0)) return false; return setCover(x, cover, excess === undefined ? undefined : +excess); },
    insall: (cover, excess) => { if (!INS_COVER[cover] || (cover === 'none' && S.debt > 0)) return false; S.insDefault = { cover, excess: excess === undefined ? 1 : +excess }; S.ships.forEach(x => setCover(x, cover, S.insDefault.excess)); return true; },
    hire: (id, cid) => doAction('hire', [+id, +cid]),
    crew: (id, dept, key, v) => { const x = ship(id); if (x) x.crewSet = S.t; return doAction('crewset', [+id, dept, key, +v]); },
    appoint: (id, role, cid) => { const x = ship(id); if (x) x.crewSet = S.t; return doAction('appoint', [+id, role, +cid]); },
    // ---- shore and head office
    shore: (kind, key) => doAction('shorebuy', [kind, key]),
    shoresell: (key, on) => doAction('shoresell', [key, !!on]),
    dept: key => doAction('shorebuy', ['dept', key]),
    deptmode: (key, act) => doAction('deptmode', [key, !!act]),
    newhead: (key, i) => doAction('newhead', [key, +i]),
    propose: (id, yes) => doAction(yes ? 'propyes' : 'propno', [id]),
    safety: v => { if (![0, 1, 2].includes(+v)) return false; S.safety = +v; return true; },
    // ---- the bank and money
    borrow: amt => { amt = +amt; if (!(headroom() >= amt) || S.noLend > S.m) return false; S.debt += amt; S.cash += amt; return true; },
    repay: amt => repayBank(+amt),
    gilts: amt => +amt >= 0 ? gilts(true, +amt) : gilts(false, -amt),
    giltsall: () => gilts(false, S.gilts),
    // ---- the trade
    join: () => confJoin(),
    leave: () => confLeave(),
    mail: yes => { if (!S.offer) return false; if (yes) { S.mail[S.offer.route] = { pay: S.offer.pay, strikes: 0, ok: false }; news(`Mail contract won on ${ROUTES[S.offer.route].name}: ${fmt(S.offer.pay)} per round trip.`, 'good'); } else (S.mailNo = S.mailNo || {})[S.offer.route] = S.m + 24; S.offer = null; return true; },
    union: yes => { if (!S.union) return false; unionAnswer(!!yes); return true; },
    combine: yes => { if (!S.trustOffer) return false; if (yes) trustAccept(); else trustRefuse(false); return true; },
    // ---- the war
    reserve: (id, on) => { const x = ship(id); if (!x || atWar()) return false; x.reserve = !!on; return true; },
    offership: id => { if (!S.war || !atWar()) return false; reqChoose(+id); return true; },
    waroffer: (sid, yes) => { if (!S.war || !S.war.offers || !S.war.offers.some(o => o.sid === +sid)) return 'no such offer (it may have lapsed)'; offerTake(+sid, !!yes); return true; }, // 0.39.3: a lapsed offer answered "done"
    auction: (i, kk) => { if (!S.war || !S.war.auction) return false; auctionBid(+i, +kk); return true; },
    // ---- shares (Finance, Shares)
    shares: (o, amt, margin) => mkBuy(o, +amt, !!margin),
    takeship: (o, id) => mkTakeShip(o, +id), // the controlling holder's "take a ship" (0.39.8)
    sharespct: (o, pct) => mkBuyPct(o, +pct),
    sellshares: (o, frac) => mkSell(o, +frac),
    repaymargin: amt => mkRepay(+amt),
    agentdrop: (kind, a) => { const k = kind === 'fagents' ? 'fagents' : 'agents'; if (!S.shore[k] || !S.shore[k][a]) return false; delete S.shore[k][a]; return true; },
    rescuepay: amt => { const R = S.rescue; if (!R || !(R.loan > 0)) return false; const x = Math.min(+amt, R.loan); if (S.cash < x) return false; R.loan -= x; S.cash -= x; return true; },
    lend: (o, amt) => mkLend(o, +amt),
    merge: o => mkMerge(o),
    windup: o => mkWindUp(o),
    buyout: o => mkBuyout(o),
    control: (o, key, v) => mkCtrlSet(o, key, v),
    peace: o => mkPeace(o),
    fundopen: mgr => mkFundOpen(mgr || 'broker'),
    fundpay: amt => mkFundPay(+amt),
    fundtake: amt => mkFundTake(+amt, false),
    fundclose: () => mkFundTake(0, true),
    fundbrief: b => { const F = S.ex && S.ex.fund; if (!F || !['preserve', 'balanced', 'growth'].includes(b)) return false; F.brief = b; return true; },
    office: () => typeof mkOfficeOpen === 'function' ? mkOfficeOpen() : 'no such control',
    officehire: i => mkOfficeHire(+i),
    // ---- floating the Line, and the advanced moves
    float: (pct, founders) => flFloat(+pct, !!founders),
    buyback: pct => flBuyback(+pct),
    founders: () => flFounders(),
    knight: o => flKnight(o),
    crown: () => flCrown(),
    appeal: () => flAppeal(),
    raid: o => mvRaid(o),
    tender: (o, prem) => mvTender(o, +prem),
    proxy: o => mvProxy(o),
    short: (o, pct) => mvShort(o, +pct),
    cover: o => mvCover(o),
    bear: (o, rk) => mvBear(o, rk),
    proxyagainst: () => mvProxyAgainst(),
    defend: () => typeof mvDefend === 'function' ? mvDefend() : 'no such control',
  };
  const HELP = `ACTIONS: a JSON array of [name, ...args]. Ship ids, line keys (rk) and company keys (o) are shown in the reports.
 advice: press(verb,...args) presses a head-office button shown as {button: [label, verb, ...args]}, e.g. press("hire",1,14)
 ships/lines: move(id,rk) [opens the line if needed, £2,500 × prices] · layup(id) · open(rk) · close(rk) · fares(rk,first,second,third) · fare(rk,'f'|'s'|'t'|'tt',v)
   table(rk,0 spartan|1 standard|2 lavish) · adv(rk,0-3: none,£300,£800,£1500) · speed(id,0 econ|1 service|2 full) · maint(id,0-2) · threshold(id,0|40|50|60|70)
   yard(id,kind) kinds: ${Object.keys(YARD_NAME).join(', ')} · unyard(id) · sell(id) · scrap(id) · unsell(id)
   buy(shipName,rk?) [second-hand, 40% down, the rest on mortgage] · build(purpose,{grt,knots,line,builder,fuel,mach,quality,...}) purposes: ${Object.keys(PURPOSES).join(', ')}
   cancelorder(yardNo) · cruise(id,rk) / uncruise(id,rk) · insurance(id,'none'|'mort'|'value'|'agreed',excess 0-2) · insall(cover,excess)
   hire(id,captainId) · crew(id,'deck'|'eng'|'cat','man'|'pay'|'train',0-2) · appoint(id,role,candidateId)
 shore/office: shore(kind,key) kinds pier, agency, fagent, shed, cold, hostel, yard, slip, bunker, dept · shoresell(key,on) · dept(key) · deptmode(key,act) · newhead(key,i) · propose(id,yes) · safety(0-2)
 money: borrow(amt) · repay(amt) · rescuepay(amt) · gilts(amt) [negative sells] · giltsall()
 trade: join() · leave() [the conference] · mail(yes) · union(yes) · combine(yes) [selling to the Combine ENDS the game]
 war: zigzag(id,on) · convoy(id,on) · wartop(id,on) · reserve(id,on) · offership(id) · waroffer(shipId,yes) · auction(lot,0-2)
 shares: shares(o,amt,margin) · sharespct(o,pct) · sellshares(o,frac) · repaymargin(amt) · lend(o,amt) · merge(o) · takeship(o,rivalShipId) · windup(o) · buyout(o) · control(o,'div'|'strat'|'keep',v) · peace(o)
   fundopen('broker'|'office') · fundpay(amt) · fundtake(amt) · fundclose() · fundbrief('preserve'|'balanced'|'growth') · officehire(i)
 floating: float(0.25|0.49|0.6|0.75,founders) · buyback(pct) · founders() · knight(o) · crown() · appeal()
 moves: raid(o) · tender(o,premium e.g. 0.3) · proxy(o) · short(o,0.02|0.05) · cover(o) · bear(o,rk) · proxyagainst()
VIEWS (look <view> [arg]): help · ship <id> · line <rk> · routes · market · build <purpose> [json] · shares · company <o> · advice · finance · news [n] · yardjobs <id> · captains · shore · eval <expression, read-only>`;

  function fresh() { newGame(); setup(); }
  function setup() { UI.autoPause = false; UI.speed = 1; UI.eventMode = 'off'; S.tut = { off: true }; UI.liv = null; quiet(); }
  function load(t) { newGame(); S = migrate(JSON.parse(t)); setup(); if (typeof mkEnsure === 'function' && S.ex) mkEnsure(); }
  function act(list) {
    const out = []; S._plNews = S.news[0] ? S.news[0].t : null;
    for (const a of list) {
      const [name, ...args] = a; let r;
      try { r = A[name] ? A[name](...args) : 'no such action'; } catch (e) { r = 'ERROR ' + e.message; }
      out.push(`${JSON.stringify(a)} → ${r === true ? 'done' : r === false || r === undefined || r === null ? 'refused' : r}`);
    }
    MOD_EPOCH++; if (typeof ADV_CACHE !== 'undefined') ADV_CACHE.key = null;
    return out.length ? 'ACTIONS\n' + out.join('\n') : '';
  }
  function play(months) {
    const to = S.m + months, nw0 = netWorth(); let g = 0; const t0 = S.t;
    while (!S.over && S.m < to && g++ < 400000) { quiet(); advance(1); }
    quiet(); return `PLAYED ${monthName(S.m - months)} to ${monthName(S.m)}${S.over ? ' · GAME OVER: ' + S.over : ''}`;
  }
  const lastOf = sh => { const v = (sh.pl || []).slice(-1)[0]; return v === undefined ? '-' : k(v); };
  const avgOf = sh => { const q = sh.pl || []; return q.length ? k(q.reduce((a, b) => a + b, 0) / q.length) : '-'; };
  function pending() {
    const P = [];
    if (S.offer) P.push(`mail contract offered on ${lineName(S.offer.route)}: ${p(S.offer.pay)} a round trip; the offer is open until ${monthName(S.offer.exp)}, and the contract runs while the sailings are kept → mail(true|false)`);
    if (S.trustOffer) P.push(`the Combine offers ${p(S.trustOffer.amt)} for the Line (accepting ENDS the game) → combine(true|false)`);
    if (S.union) P.push(`union claims ${S.union.pct}% more pay → union(true|false)`);
    if (S.call) P.push(`the bank has called in ${p(S.call.amt)} of loans, due ${monthName(S.call.due)}`);
    if (S.ex && S.ex.call) P.push(`MARGIN CALL: pay in ${p(S.ex.call.amt)} or sell by ${monthName(S.ex.call.due)}`);
    if (S.war && S.war.ask) P.push(`the Admiralty asks for ${S.war.ask.n} more ship(s) from the reserve → offership(id)`);
    if (S.war && S.war.offers && S.war.offers.length) P.push('buyers bid for ships: ' + S.war.offers.map(o => `${(ship(o.sid) || {}).name} (id ${o.sid}) ${p(o.amt || o.price || 0)}`).join('; ') + ' → waroffer(id,yes)');
    if (S.war && S.war.auction) P.push('reparations auction: ' + S.war.auction.lots.map((L, i) => `lot ${i} ${L.name} ${int(L.grt)}grt worth ~${p(L.value)}`).join('; ') + ` closes ${monthName(S.war.auction.close)} → auction(lot,0|1|2 for 80|100|130% of value)`);
    for (const q of S.props || []) P.push(`proposal ${q.id}: ${q.title || q.act} → propose("${q.id}",true|false)`);
    if (S.fl && S.fl.bid) P.push(`BID for the Line by ${mkName(S.fl.bid.by)} at ${pxTxt(S.fl.bid.price)} a share, decided ${monthName(S.fl.bid.due)}`);
    if (S.crash && S.crash.stage === 'rumour') P.push('whispers in the City: a panic may be coming' + (S.crash.bank ? ', and the bank that holds the Line\'s cash is said to be overextended' : ''));
    return P;
  }
  function report(first) {
    const L = [];
    L.push(`=== ${dateLong(S.t)} · cash ${p(S.cash)} · debt ${p(S.debt)} · net worth ${p(netWorth())}${ownsAll() ? '' : ' (yours ' + p(ownerWorth()) + ')'} · can borrow ${S.noLend > S.m ? 'nothing (lending stopped until ' + monthName(S.noLend) + ')' : p(headroom())} · reputation ${Math.round(S.rep)} (${repWord(S.rep)}) · prices ×${PX().toFixed(2)}${S.gilts ? ' · Consols ' + p(S.gilts) : ''}${S.ex && S.ex.fund ? ' · investment account ' + p(mkFundVal(S.ex.fund)) : ''}${S.conf ? ' · in the conference' : ''}${S.over ? ' · GAME OVER: ' + S.over : ''}`);
    if (S.lastMonth) L.push(`last month: net ${p(S.lastMonth.net)}`);
    L.push('SHIPS id | name | grt kn built | line | where | cond% | speed | last month | 12-mo avg £/mo');
    for (const sh of S.ships.filter(x => x.state !== 'lost')) {
      L.push(`${sh.id} | ${sh.name} | ${int(sh.grt)} ${knotsOf(sh)} ${sh.built} | ${sh.line && sh.state !== 'laid' ? sh.line : '-'} | ${sh.state}${sh.state === 'yard' ? ' ' + sh.yardKind + ' ' + Math.ceil(sh.yardLeft) + 'd' : ''}${sh.pendingYard ? ' (yard booked: ' + sh.pendingYard + ')' : ''}${sh.pendingExit ? ' (to be ' + sh.pendingExit + ')' : ''} | ${Math.round(sh.cond)} | ${['econ', 'service', 'full'][sh.speed]} | ${lastOf(sh)} | ${avgOf(sh)}`); }
    if ((S.orders || []).length) L.push('ORDERS ' + S.orders.map(o => `yard no ${o.id} ${o.d.name} ${int(o.d.grt)}grt ${o.stage}, ${p(o.paid)} of ${p(o.price)} paid`).join('; '));
    const lines = Object.keys(S.lines).filter(rk => ROUTES[rk]);
    if (lines.length) { L.push('LINES rk | name | fares f/s/t (line rate) | table | adv | last month | rivals fares | tension'); for (const rk of lines) { const Ln = S.lines[rk], r = defaultFares(rk), lm = S.lastMonth && S.lastMonth.lines ? S.lastMonth.lines[rk] : undefined;
      L.push(`${rk} | ${ROUTES[rk].name} | ${Ln.fares.f}/${Ln.fares.s}/${Ln.fares.t} (${r.f}/${r.s}/${r.t}) | ${['spartan', 'standard', 'lavish'][Ln.service]} | ${Ln.adv} | ${lm === undefined ? '-' : k(lm)} | ${S.rfare && S.rfare[rk] ? Math.round(S.rfare[rk] * 100) + '%' : '-'} | ${Math.round((S.tension || {})[rk] || 0)}${S.wars[rk] ? ' · RATE WAR' : ''}${S.mail[rk] ? ' · mail' : ''}`); } }
    const P = pending(); if (P.length) L.push('WAITING ON YOU\n- ' + P.join('\n- '));
    const adv = advice().filter(h => h.act && h.act.length).slice(0, 10);
    if (adv.length) L.push('HEAD OFFICE ADVISES\n' + adv.map(h => `- [${h.sev}] ${h.title}: ${String(h.why).replace(/<[^>]+>/g, '').slice(0, 220)} {button: ${JSON.stringify(h.act[0])}}`).join('\n'));
    const seen = first ? null : S._plSeen; const fresh = []; for (const n of S.news) { if (seen && n.t === seen) break; fresh.push(n); if (fresh.length >= 45) break; }
    if (fresh.length) L.push('NEWS (newest first)\n' + fresh.map(n => `- ${dateLong(n.d)}: ${String(n.t).replace(/<[^>]+>/g, '')}`).join('\n'));
    S._plSeen = S.news[0] ? S.news[0].t : null;
    return L.join('\n');
  }
  function look(view, arg, arg2) {
    const L = [];
    switch (view) {
      case 'help': return HELP;
      case 'ship': { const sh = ship(arg); if (!sh) return 'no ship ' + arg; L.push(`${sh.name} id ${sh.id}: built ${sh.built}, ${int(sh.grt)} grt, ${knotsOf(sh)} kn, ${sh.fuel}, berths ${JSON.stringify(sh.berths)}, cargo ${int(sh.cargo || 0)}, worth ${p(shipValue(sh))}, condition ${Math.round(sh.cond)}%, fittings ${Math.round(sh.fit)}%, hull ${fatWord(sh)}, morale ${Math.round(sh.morale)}`);
        L.push(`upgrades: ${Object.keys(sh.up || {}).filter(q => sh.up[q]).join(', ') || 'none'} · insurance ${JSON.stringify(insOf(sh))} premium ${p(insCost(sh))}/mo · captain ${sh.captain ? sh.captain.name + ' ' + sh.captain.traits.join(',') : 'none'}`);
        L.push('expected £/month on each line, averaged over a year: ' + Object.keys(ROUTES).filter(rk => routeOpen(rk, S.m)).map(rk => ({ rk, pm: econYear(sh, rk).pm })).sort((a, b) => b.pm - a.pm).slice(0, 10).map(o => `${o.rk}${S.lines[o.rk] ? '' : '(not open)'} ${k(o.pm)}`).join(', ') + ` · laid up ${k(-idleCost(sh))}`);
        return L.join('\n'); }
      case 'yardjobs': { const sh = ship(arg); if (!sh) return 'no ship'; return Object.keys(YARD_NAME).filter(q => !(EQUIP[q] && EQUIP[q].from > yearNow())).map(q => { try { return `${q}: ${YARD_NAME[q]} ${p(refitCost(sh, q))}, ${YARD_DAYS[q]} days`; } catch (e) { return q + ': -'; } }).join('\n'); }
      case 'line': { const rk = arg; if (!ROUTES[rk]) return 'no line ' + rk; const r = ROUTES[rk]; L.push(`${r.name} (${rk}): calls ${r.calls.map(q => PN[q]).join(' → ')}, open ${routeOpen(rk, S.m)}, line rate ${JSON.stringify(defaultFares(rk))}`);
        if (S.lines[rk]) L.push(`yours: ${JSON.stringify(S.lines[rk].fares)} table ${S.lines[rk].service} adv ${S.lines[rk].adv}; your ships ${lineShips(rk).map(x => x.name).join(', ')}; forecast ${k(lineEcon(rk, {}).pm)}/mo`);
        const own = {}; for (const x of S.rships) if (x.route === rk) own[x.owner] = (own[x.owner] || 0) + 1; L.push('rivals on it: ' + Object.keys(own).map(o => `${mkName ? mkName(o) : o} (${o}) ${own[o]} ships${warRivalF(o, S.m) === 0 ? ' (laid up in neutral ports)' : ''}`).join(', ')); { const ow = S.otw && S.otw[rk]; if (ow && ow.k > 0) L.push(`outside ships (new lines, charters, tramps): about ${Math.round(ow.k * 100)} berths for every 100 passengers wanting to sail`); }
        return L.join('\n'); }
      case 'routes': return Object.keys(ROUTES).map(rk => `${rk} | ${ROUTES[rk].name} | ${routeOpen(rk, S.m) ? 'open' : 'closed'}${S.lines[rk] ? ' | yours' : ''} | line rate ${JSON.stringify(defaultFares(rk))}`).join('\n');
      case 'market': return (S.market.length ? S.market.map(m => { const b = bestLine(m, null); return `"${m.name}" built ${m.built} ${int(m.grt)}grt ${knotsOf(m)}kn berths ${JSON.stringify(m.berths)} cargo ${int(m.cargo || 0)} price ${p(m.price)} (worth ${p(shipValue(m))}) at ${PN[m.port]} · best ${b ? b.rk + ' ' + k(b.pm) + '/mo' : '-'}`; }).join('\n') : 'nothing for sale') + `\nsecond-hand prices ×${shipMkt().toFixed(2)}`;
      case 'build': { const pk = arg || 'inter'; if (!PURPOSES[pk]) return 'purposes: ' + Object.keys(PURPOSES).join(', '); const d = defaultDesign(pk); if (arg2) { const o = JSON.parse(arg2); Object.assign(d, o); if (o.grt && !o.fac) d.fac = defaultFac(pk, d.grt, yNow()); } const st = designStats(d), f = designForecast(d);
        return `design ${JSON.stringify(d)}\nprice ${p(st.price)}, ${st.months} months, berths ${JSON.stringify(st.berths)}, warnings: ${st.warn.join('; ') || 'none'}\nforecast: ${f.best ? 'best on ' + f.best.rk + ' ' + k(f.best.pm) + '/mo' : 'pays nowhere'}${f.line ? ', on its line ' + k(f.line.pm) + '/mo' : ''}\nbuilders: ${Object.keys(BUILDERS).map(b => b + ' (slip free ' + monthName(Math.max(S.m, slipFreeAt(b))) + ')').join(', ')}`; }
      case 'shares': { if (!S.ex) return 'no market yet'; const Mx = S.ex; return Object.keys(Mx.cos).filter(o => !Mx.cos[o].gone && o !== 'morven').map(o => { const c = Mx.cos[o]; return `${o} | ${mkName(o)} | price ${c.px.toFixed(3)} (worth ${mkVal(o).toFixed(3)}) | cap ${k(mkCap(o))} | div ${c.dy.toFixed(3)} | yours ${Math.round(mkStake(o) * 100)}%${mkInfl(o) ? ' influence ' + mkInfl(o) : ''} | on offer ${Math.round(mkFree(o) / c.n * 100)}%`; }).join('\n') + `\nmargin loan ${p(Mx.me.loan)} · the Line's shares valued ${p(mkPosVal(Mx.me))}`; }
      case 'company': { const o = arg, co = S.rivals[o]; if (!co) return 'no company ' + o; return `${mkName(o)}: cash ${p(co.cash)} debt ${p(co.debt)} ships ${coFleet(o).length} (${[...new Set(coFleet(o).map(x => x.route))].join(', ')}) profit last year ${p(coYear(o, 'net'))} health ${coHealth(o)[0]} · your stake ${Math.round(mkStake(o) * 100)}% · loan from the Line ${p(co.lineLoan || 0)} · div policy ${co.divPol || '-'} strategy ${co.strat || '-'}`; }
      case 'advice': return advice().map(h => `- [${h.sev}] ${h.title}: ${String(h.why).replace(/<[^>]+>/g, '')} {button: ${JSON.stringify(h.act[0] || null)}}`).join('\n');
      case 'finance': { const lm = S.lastMonth; return `last month by account: ${lm ? Object.keys(lm.cat).map(c => c + ' ' + k(lm.cat[c])).join(', ') : '-'}\nloan rate ${(loanRate() * 100).toFixed(2)}% · overdraft ${(odRate() * 100).toFixed(2)}% (Bank Rate ${bankRate().toFixed(2)}%) · overdraft limit ${p(odLimit())} · Consols yield ${giltYield().toFixed(2)}% · year profits ${JSON.stringify(S.annual || {})}`; }
      case 'news': return S.news.slice(0, +arg || 30).map(n => `- ${dateLong(n.d)}: ${n.t}`).join('\n');
      case 'captains': return (S.capPool || []).map(c => `${c.id} ${c.name} age ${c.age} exp ${c.exp} ${c.traits.join(',')} £${c.wage}`).join('\n') || 'none';
      case 'shore': return `owned ${JSON.stringify(S.shore)}\ndepartments ${JSON.stringify(Object.keys(S.depts).map(q => [q, S.depts[q].auto]))}`;
      case 'eval': { const snap = JSON.stringify(S); try { const r = (0, eval)(arg); return typeof r === 'string' ? r : JSON.stringify(r, null, 0); } catch (e) { return 'ERROR ' + e.message; } finally { S = JSON.parse(snap); } }
      default: return 'unknown view; try help';
    }
  }
  return { fresh, load, act, play, report, look };
})();
