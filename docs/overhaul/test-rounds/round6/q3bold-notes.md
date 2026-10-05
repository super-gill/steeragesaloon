# q3bold notes (0.39.5 working copy, slot q3bold): bold but sane growth, Jan 1900 to Jan 1914

## Findings
- [balance, S2] (1912-1914) Same pattern as q1/q2/r6 on a third seed: the Line ends at NW £2,495.6k on 1 Jan 1914, 2.5 times the top of the bold band (£1m). Year profits (taxable): 1909 £203k, 1910 £331k, 1911 £361k, 1912 £764k, 1913 £916k, on a fleet worth £2.51m (17 ships, 191,000grt). Up to 1908 this game was the slowest of the four (NW £287k Jan 1908 against q1 £420k, r6 £837k); the jump came from the 13,000-ton emigrant ships (33-51% a year on cost, see returns below) and from Imperial Atlantic's failure. Sure (finance view, ship ledgers).
- [odd, S2] (1 Oct 1912) Imperial Atlantic fails in the boom for the third seed running ("Of its 24 ships, 4 go to other lines, 2 are offered through the brokers, 18 go for scrap or abroad"). Liverpool <-> Halifax and Glasgow <-> Halifax were left with NO rival ship (line view, Oct 1912), Liverpool -> New York with 3, Glasgow -> Montreal with 1. Every one of my ships then forecast 6-10k/mo on stl (against 2-6k where they were). On copies of the Oct 1912 save, six months of four redeployments gave +£125k to +£284k cash over staying put; I took the best. By Jan 1914 rivals had only partly come back: lha 2 ships (St Maurice), hal 2 (Hudson & Harbor), liv 5, stl 7, against my 8, 3, 3 and 3. Real 1912-13 trades were full and the big lines were adding tonnage. Sure.
- [balance] (Sep-Dec 1913) Loads from the sailing cables (S.wire, 122 sailings sampled from a copy of the Oct 1913 save stepped monthly plus the live save): outbound all berths lha 59%, hal 69%, liv 68%, stl 72%; third class outbound tops out at exactly 80% on every trade (the conference cap), range 42-80%; homeward 17-27% of all berths. Off-season months only; I did not sample the 1912-13 summers. Sure about these numbers.
- [text, low] (Oct 1913) A rival company is called "Glen Affric Line" (key caledon12, 2 ships on stl) while my own SS Glen Affric (delivered Apr 1912) sails the next trade over. Company names should not reuse a name the player has given a ship. Sure (line view).
- [text, low] (Oct 1902) The help says buy() is "40% down, the rest on mortgage", but buyTerms (js/sim.js:445) lends min(0.6 price, 0.7 worth + headroom): with headroom 0 and asking about 1.35x worth the deposit is about 45% (Hesperia, £63.1k: deposit £28.5k; Silver Wave £82.6k: £37.2k), and a buy with only 40% in cash is refused (Tay Castle, Oct 1902). The game is right to lend against worth; the help text is what misleads. Sure.
- [harness] (Feb-Apr 1904) The lha mail tender lapsed inside a 3-month step (known from q2).
- [design note] Combine offers: £118k (Oct 1904, NW £85k), £386k (Apr 1908, NW £254k), £1,424k (Jan 1911, NW £938k), each about 1.4-1.5x net worth.

### Returns on the best ships (12 months to Jan 1914, ship ledger before office, interest and tax, on price paid)
- New builds: Ben Morven (1910) £108k on £212k (51%), Loch Shira £100k on £219k (46%), Strath Shira £106k on £228k (46%), Ben Shira £100k on £221k (45%), Glen Affric £94k on £209k (45%), Strath Morven £85k on £215k (40%), Loch Affric £95k on £239k (40%), Glen Morven £71k on £192k (37%), Loch Morven £64k on £193k (33%), Glen Shira £72k on £221k (33%).
- Second-hand: Hesperia £30k on £63k (47%), Silver Wave £33k on £79k (42%), Caledonian £19k on £52k (36%), Holstein £16k on £45k (36%), Arcadian Queen £37k on £108k (35%).

## Log
- Jan 1900: start. SS Morven (1881, 4,600grt) on hal, NW £26.1k, cash £7.0k, debt £16.0k. Feb 1900 breakdown at sea (salvage + refunds). Apr 1900 replaced Capt McBride (driver) with Capt Crawford (cautious).
- **Jan 1901: NW £29.3k, cash £7.0k, debt £15.3k, 1 ship.**
- Oct 1901: borrowed £3.5k, bought Caledonian (£51.5k, worth £34.4k) for liv. Jan 1902 Imperial added Atrebatic to liv; Morven back to hal on advice.
- **Jan 1902: NW £23.4k, cash £3.4k, debt £48.5k, 2 ships.**
- Apr 1902 Morven to lha (opened). Jul 1902 British agents £10k, closed hal, refurb Morven. Oct 1902 buy of Tay Castle refused: buyTerms mortgage = min(0.6 price, 0.7 worth + headroom) and headroom was 0, so the deposit is ~50%, not 40%.
- **Jan 1903: NW £44.6k, cash £28.1k, debt £46.2k, 2 ships.** 1902 taxable £39.5k.
- May 1903: bought Hesperia (£63.1k, deposit £28.5k) for liv, veteran master. Jul 1903 bunker contract (£4k), lavish liv. Oct 1903 American agents (£12k), Caledonian to lha.
- **Jan 1904: NW £55.7k, cash £18.7k, debt £77.5k, 3 ships.** 1903 taxable £36.0k.
- Jan-Apr 1904: missed lha mail tender (lapsed inside the step); lavish lha (copy test +£1.2k/6mo). Jul 1904 Halifax pier £20k. Oct 1904 Imperial rate war on lha; Combine offered £118k (refused). Hesperia + Caledonian to hal (copy test best of three plans).
- **Jan 1905: NW £83.4k, cash £31.6k, debt £73.9k, 3 ships.**
- Apr 1905: Silver Wave (£79.4k, deposit £31.8k) for liv, replaced lax master. Jul 1905 bunker renewed, pier space sold at Halifax. Oct 1905 Tay Castle (£55.2k) for lha, Morven to lha, Liverpool pier £35k, borrowed £15k buffer.
- **Jan 1906: NW £117.6k, cash £44.3k, debt £171.6k, 5 ships.** 1905 taxable £88.7k.
- Apr 1906: ordered Glen Morven (emig 12,000grt 15kn, Elbe £192k, liv). Jul 1906 liv mail (£500/rt); ordered Loch Morven (same, Elbe £193k, lha); Glasgow pier tested on a copy: about 23%/yr, skipped. Oct 1906 lha rate war: Morven and Tay Castle to liv (copy test).
- **Jan 1907: NW £273.9k, cash £84.7k, debt £163.6k, 5 ships + 2 on order.**
- Jul 1907: bunker renewed, borrowed £9k ahead of the crash. Glen Morven delivered Sep 1907 (14.8kn trial). Oct 1907 Black October: £23.6k called for Apr 1908, no lending until Oct 1908; liv rate war, Glen Morven to lha, Tay Castle to hal (copy test).
- **Jan 1908: NW £287.4k, cash £112.7k, debt £259.2k, 6 ships + Loch Morven in trials.**
- Jan 1908 joined the conference; Apr 1908 refused Combine £386k; Hesperia to hal. Jul 1908 Glasgow pier £30k, ordered Ben Morven (13,000grt 16kn wireless, Elbe £212k, lha). Oct 1908 lending back (headroom £162k): borrowed £120k, ordered Strath Morven (Elbe £215k, hal) and Glen Shira (Solent £221k, liv). Forecasts for new builds were only 2-3k/mo in the slump; ordered on the strength of Glen/Loch Morven's 5k/mo actuals.
- **Jan 1909: NW £484.9k, cash £33.4k, debt £342.8k, 7 ships + 3 on order.**
- 1909: wireless on all ships (Apr), bunker renewed, Liverpool pier space sold, borrowed £50k (Jul). Oct 1909 ordered Loch Shira (Elbe £219k, hal); forecasts back to 5k/mo.
- **Jan 1910: NW £660.7k, cash -£2.3k, debt £375.5k, 7 ships + 4 on order (Ben Morven in trials).**
- Jan 1910 borrowed £33k; Ben Morven delivered (16.2kn) Q1 1910. Apr 1910 lha mail (£550/rt), replated Morven, ordered Strath Shira (Solent £228k, lha). Strath Morven (hal) and Glen Shira (liv) delivered mid 1910: Strath Morven 9k/mo in her first months. Jul 1910 borrowed £200k, ordered Ben Shira (Elbe £221k, hal), Glen Affric (Liguria £209k, lha), Loch Affric (Mersey £239k, hal); Silver Wave to lha. Jan 1911 refused Combine £1.424m.
- **Jan 1911: NW £938.2k, cash £133.4k, debt £793.9k, 10 ships + 5 on order.**
- Apr 1911: bought Holstein (Nordmark's receivers, 1890 7,000grt 15.7kn, £44.5k, worth £63.6k) for lha (drinker master replaced) and Arcadian Queen (£108.4k) for hal. Jun 1911 seamen's strike: June earnings collapsed; Jul 1911 cash -£15k and Loch Affric's keel unpaid; borrowed £180k. Oct 1911 wireless for Holstein and Arcadian Queen; sold Tay Castle and Morven (copy test +£46k NW over 6 months), Hesperia to lha.
- **Jan 1912: NW £1,217.2k, cash £251.3k, debt £1,020.8k, 11 ships + 4 on order (3 in trials).**
- Apr 1912: lha has 1 rival ship, hal 1; ordered Ben Nevis (Elbe £244k) and Ben Lui (Liguria £231k) for lha, borrowed £100k. Jul 1912 ordered Ben Alder (Solent £254k, hal); £81k net in June 1912. Oct 1912 Imperial Atlantic failed (24 ships, 18 to scrap or abroad): lha and hal left with NO rival ships, stl with 1; every ship's forecast on stl jumped to 6-10k/mo. Tested 4 redeployments on copies (6 months: +£125k to +£284k cash over staying put); took the best: Arcadian Queen, Caledonian, Hesperia, Holstein, Silver Wave to stl; Strath Morven, Glen Morven to liv.
- **Jan 1913: NW £1,847.1k, cash £556.0k, debt £1,183.7k, 15 ships + 3 on order.** 1912 taxable £763.7k.
- 1912: Jan NW £1,217k. Oct 1912 to Jan 1913 boats for all and Montreal, Quebec and New York piers (Jan 1913), stl mail; ordered Ben Ledi (Clyde £273k, stl) and Ben Vorlich (Mersey £264k, liv), forecast 9k/mo each.
- Apr 1913 Arcadian Queen back to lha (copy test). Jul 1913 bunker renewed, repaid £300k; Oct 1913 repaid £200k, Silver Wave to lha. Ben Nevis and Ben Lui delivered Q4 1913.
- **Jan 1914: NW £2,495.6k, cash £30.0k, debt £637.6k, 17 ships (191,000grt, worth £2.51m) + 3 in fitting (Ben Alder, Ben Ledi, Ben Vorlich).** 1913 taxable £916.4k. End of this run.

## Net worth every January
1900 £26.1k · 1901 £29.3k · 1902 £23.4k · 1903 £44.6k · 1904 £55.7k · 1905 £83.4k · 1906 £117.6k · 1907 £273.9k · 1908 £287.4k · 1909 £484.9k · 1910 £660.7k · 1911 £938.2k · 1912 £1,217.2k · 1913 £1,847.1k · 1914 £2,495.6k

## Strategy so far (for a next player)
1900-05: one old ship at a time (deposit is about half the price, not 40%), agents both sides (1902-03), bunker contracts, Halifax and Liverpool piers, lavish tables, move ships off any trade in a rate war (copy-test moves). 1906-07: first two 12,000-ton emigrant ships from Elbe (cheapest, 14 months), delivered before Black October. Join the conference Jan 1908. Oct 1908-1913: 13,000-ton 16-knot emigrant ships with wireless, two or three a year, mostly Elbe/Liguria/Solent; sell the worst old ships; after Imperial Atlantic fails (Oct 1912) spread ships to stl and liv. State left Jan 1914: 17 ships on lha (8), hal (3), liv (3), stl (3), mails on all four, piers at Glasgow, Liverpool, Halifax, Montreal, Quebec, New York, 3 ships fitting out, £638k debt, in the conference.
