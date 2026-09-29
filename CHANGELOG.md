# Changelog

The version shows in the game header and in the Company tab.

## 0.31.0 (29 September 2026)
Floating the Line (stage R4).
- Float the Line on the Stock Exchange from the Shares view, once it has three ships, three years of accounts and a solid net worth: sell 25%, 49%, 60% or 75% as new shares for capital. The more you sell, the more you raise. The 1919 and 1920 boom is the best time.
- A minority float brings a board that sets you targets each year and complains when you miss them, but cannot remove you, and nobody can bid for the Line. A majority float brings more money, and two risks: the board can vote you out, and other lines can bid for the Line.
- The board's targets: a dividend, profit, the share price against shipping shares as a whole, and safety. Its confidence rises and falls at the January meeting and with events (losses at sea, gross negligence, the Blue Riband). Below 20, after a year's warning under 35, it removes you: a new ending.
- Set the dividend (none, normal or generous), paid each January to the public.
- Buy shares back at the market to regain control, or all of them to go private again.
- Bids for the Line: the biggest rich line bids now and then, more often when your shares are cheap; until 1914 the Combine bids instead of offering. If holders of over half the votes accept, the Line is taken over: another new ending.
- Defences: a white knight, Pac-Man (take control of the bidder), scorched earth (sell the ships), a buyback, founders' voting shares (set up beforehand; your shares carry three votes), a crown jewel sale, and an appeal to the government against a foreign bidder (at the price of staying British with every ship at the Admiralty's call).
- A private Line plays exactly as before.
- New check `tools/float.js`, and the harness can float the careful owner (`FLOAT=0.6`).

## 0.30.0 (29 September 2026)
Stakes and control (stage R3).
- A stake in a rival line brings powers, shown under its card on the Shares view: a seat on its board at 20%, control over 50%, special resolutions at 75%, and a buy-out of the rest at 90%.
- A seat: on a trade it leads, pressure over your fares builds half as fast. Crossing a fifth is noticed in the City and its shares rise.
- Control: set its dividend and its strategy, keep it off your trades, end its rate wars, and buy its ships at book value. It stays a company of its own, under its own name and flag, and pays you dividends. On a trade it leads, no rate war starts against you.
- Merge it into the Line at 75%: its ships, trades, cash and debts become yours, and the other shareholders are paid their share of what it is worth. Or wind it up and take your share of what is left; a new line comes for its trades.
- At 90%, buy out the rest: at a quarter over the market until the Companies Act of November 1929, at the market after.
- Buy 1%, 5% or 10% of a line at a time. The more of what is left on the market you buy, the more the price moves. The Combine holds three fifths of each member and will not sell.
- Dividends from lines are now the real ones their directors vote each January out of their own cash, instead of a notional quarterly figure. The dilution that stood in for them is lighter.
- The Company tab's card for each rival shows your stake.
- New check `tools/stakes.js`: every threshold gives exactly its powers, and a merger's accounts add up.

## 0.29.0 (29 September 2026)
The share market and the broker (stage R2).
- A small London market on the Finance tab, under Shares: every rival line, and eight companies next to shipping (two shipbuilders, coal, oil from 1909, docks, the boat-train railway, a marine insurer, and an aircraft maker from 1919). Prices follow what each company owns and earns, the news and the mood of the City, which overshoots both ways.
- The mood falls in the 1907 panic, the war, the 1921 slump and the Depression, with the Wall Street crash in October 1929; it rises in the 1919 and 1920 boom and the late twenties. The 1912 disaster, the outbreak of war, the Combine's buying, bank reconstructions, rate wars and the Blue Riband move the companies they touch. A line that fails is struck off. The Stock Exchange closes from July 1914 to January 1915.
- Buy and sell (1% to buy, 0.5% to sell, and a big order moves the price against you), on margin if you like: the broker lends half at 5.5% and calls for money when the loan passes three quarters of the shares' value. Dividends each quarter.
- An investment account run by a City broker (1% a year) or by your own Investment Office, with a brief: preserve, balanced or growth. It rebalances each quarter and reports.
- The Investment Office shows each company's price against its worth, advises each quarter, and can run the account; how well depends on its head.
- Shares count in net worth, and half towards what the bank will lend.
- The market keeps its own dice: a game that never uses it plays out exactly as before. The harness can switch it off (`MKT=0`) to prove it.
- New check `tools/market.js`: broker accounts and a buy-and-hold against government stock from 1901 to 1940, falls in the slumps, and shares against worth.

## 0.28.0 (29 September 2026)
The bubble and the handover, 1919 and 1920.
- From the armistice the world wants ships. Second-hand prices climb to about two and a half times their normal level by the spring of 1920; the yards take orders again, at up to three fifths over normal; freight still pays well and, in 1920, emigrants rush to cross the North Atlantic before America closes the door.
- Buyers make offers for the Line's ships, a little over their inflated worth, under Needs attention. Sell and she goes now, or when she next reaches port. A ship sold at the top fetches two to three times her 1913 worth in 1913 money.
- Speculative lines are floated on borrowed money at the top of the market. They mostly fail in the crash.
- In June 1919 the peace treaty hands the German lines' big ships to the Allies. The two largest are auctioned by the Reparations Commission on the Buy and build tab: sealed bids (low, fair or high) by October, against the Allied lines. The rest go to the biggest Allied lines.
- The boom breaks in the autumn of 1920 and from January 1921 the game carries on as the 1921 game, crash and all. A ship held through it loses half to two thirds of her peak value; a ship built at 1920 prices is worth her real cost once the boom is gone. The 1920 emigrant rush does not carry into the demand after 1921.
- Head office gives no advice to buy or build at boom prices, and the brokers list fewer ships while the boom lasts. The times shows the boom and warns when it turns.
- Fixed: an emergency could stay open for months when the fight and the flooding balanced almost exactly, or when her ship had moved on. A fight that holds for three days is now won, and an emergency whose ship has moved on is closed after a week.
- The harness reports the handover (lines solvent in 1914 still trading, their fleets, and net worth over the crash), and its careful owner does not buy at boom prices.

## 0.27.0 (29 September 2026)
The Great War, part two: the war at sea.
- Raiders on the southern trades in the autumn of 1914, mines off the home ports, and submarines from February 1915, at their worst in the spring of 1917 when the war on merchant ships becomes unrestricted.
- An attack plays out in the emergency window. A submarine sighted: run, zigzag, hold her course, open fire if she carries a gun, or ram her if she surfaced close ahead. A ship torpedoed nearby: stop for her people, or keep going as ordered. A raider: run, or stop and let her people be taken off. A torpedo hit is a flooding emergency fought like any other, and most torpedoed ships are lost.
- Protections, each with a price: convoys from June 1917, speed, zigzagging, dazzle paint from March 1917, a gun and naval gunners (for lines with the Admiralty's goodwill), the wireless kept day and night, and a good deck crew. A new War at sea section on each ship's panel shows her risk and her protections; the Marine Superintendent advises them.
- The state's war-risk scheme pays four fifths of a ship sunk by the enemy; a private top-up on her panel pays the rest, dearer after each loss. No court of inquiry sits on a war loss. Ships on war service can be lost too, and the state pays an agreed value close to their pre-war worth.
- In May 1915 a rival's express liner is torpedoed off Ireland with Americans aboard; fewer cabin passengers cross.
- Dazzle paint replaces the livery until the ship is repainted after the war.
- The harness counts war losses and plays the careful owner with protections (or without, `PROT=0`), and reports war growth with ships at their pre-war worth.

## 0.26.0 (29 September 2026)
The Great War, part one: the war economy.
- War breaks out in August 1914. A page says what changes. Emigration stops and the cabin trade falls to a fifth or less within three months (Americans keep crossing until April 1917); reservists crowd the eastbound steerage home in August and September. Hamburg and the cruises close until 1920. The rate wars end.
- Freight pays: every hold fills, at rates that climb over the rise in prices until the Ministry of Shipping holds them down in 1917. A liner can clear her steerage decks for cargo in the refit office and put them back after the war; head office advises it when it pays.
- Coal, wages and second-hand ships climb faster than prices. Every ship still trading pays the state's war-risk insurance each month, dearest in 1917. No yard takes a new order, no keel is laid, and ships on the stocks go at a quarter of the pace. The brokers have a ship only now and then until 1917, and none after.
- The Admiralty's reserve list opens in October 1912 on the Company tab. In the war the state takes a growing share of the fleet as armed merchant cruisers, hospital ships, troopships and transports, at a fixed hire well below freight: Admiralty-terms ships first, then the list. A line on the list chooses which ships go (under Needs attention) and is paid more; otherwise the state takes the biggest and fastest. War service wears ships hard and earns the Line standing. They come home through 1919 with a sum towards their refit.
- Excess Profits Duty each January from 1915 to 1921: half the profit above the pre-war standard, rising to four fifths for 1917 and 1918.
- The German lines' ships lie in neutral ports; other belligerent lines lose ships to their states; the American lines grow while neutral. No rival line builds, founds or fails while the war lasts.
- The times shows the war, the duty and what the state holds, and warns of the Austrian ultimatum in July 1914.
- The dangers at sea (raiders, submarines, convoys and war-risk losses) come in 0.27; 1919 and 1920 hold for now and are written in 0.28.
- The harness plays on to any year (`END=1920`) and reports growth over the war.

## 0.25.1 (28 September 2026)
A balance pass on 1900 to 1913: a sensible owner now goes bankrupt in about 1 game in 10 before the war, down from about 3 in 10.
- A court of inquiry before 1914 no longer calls a ship of four or five thousand tons "too small for the weather" on the North Atlantic: in those years she was an ordinary Atlantic ship. The Morven, on the route the game gives you, was being blamed for it in every winter loss.
- Claims from families before 1914 are half what they are later (emigrants' families abroad seldom claimed), and all claims are limited by law to £15 a ton of the ship, except after gross negligence, when there is no limit.
- A called loan the Line cannot pay is first taken by overdraft, within the overdraft's limit; the bank seizes ships only for the rest. The notice now gives the right date (six months in 1907, not three).
- Head office says when the account is going deep into overdraft, and which ship to sell to raise cash (the one that has earned least for her value).
- The harness's `careful` owner does the same, and the harness can print a half-yearly trace of each bankrupt game (`DEBUG=2`).

## 0.25.0 (28 September 2026)
Liveries and ship variety.
- The Line has its own colours: funnel with up to two bands and a black top, hull, boot-topping, upperworks and a house flag. A new game opens a chooser with twelve presets and a live drawing of the Morven, or you can make your own. The Company tab shows the colours and changes them.
- Each ship wears the colours she was last painted in. New ships come out in the Line's colours; ships from the brokers arrive in their old owners'. Changing the Line's colours changes no ship at once.
- Repainting takes dry dock: a repaint job in the refit office (about a week), or, with the setting on (the default), at a ship's next overhaul, re-plating or repair, charged as extra work.
- Every rival line has its own colours. Click a rival's ship on the chart for a card with her drawing, size, speed, age and route.
- No two ships look alike unless they are sisters: funnels, masts, superstructure, portholes, sheer, ventilators and boats vary with each ship's seed, and ships built to one design share it. Old ships of the 1880s carry three or four masts. A ship with boats for all shows a second row of boats. The house flag flies from the mainmast.
- Your ships' markers on the chart take the Line's funnel colour.
- Corrected the 0.24 balance note: the `careful` owner went bankrupt in 6 of 20 games at 0.24, not 5 (the figure was taken before 0.24's last timing fixes).

## 0.24.0 (28 September 2026)
The 1912 disaster, the safety rules and the negligence ending.
- Lifeboats are part of every ship. Before the disaster the law asks only for the old scale: room for 960 people on any ship of 10,000 tons or more, fewer on smaller ships, whatever she carries. Boats for all can be fitted at any time (a week in the yard, or an extra in the drawing office). In every sinking no more can get away than her boats hold, and a well-drilled crew launches them fuller.
- The wireless watch: each ship with a set can keep it by day only or day and night, the second operator costing about a hand's wage. At night a call for help is heard only by ships keeping a watch, and a watched bridge gets the ice warnings.
- The 1912 disaster. Between late March and early May 1912 a giant of 40,000 tons or more is lost on the North Atlantic: the worst-run one at sea. The rival Imperial Atlantic's Hyperborean always fits well, so the Line's own giant is chosen only if she is run as badly or worse. She strikes ice at night, is rammed in fog on the approaches, or hits a derelict, depending on where she is, and always sinks in about two and a half hours. Between a third and two thirds of those aboard die, set by her boats, drills, deck crew, the night watch and the orders given.
- If the ship is a rival's, the wireless room follows her. Your ships within 150 miles that hear the call can be sent to help: they lose the time, earn reputation, and save lives if they arrive before the rescuer.
- Afterwards one page is shown, the same whoever owned her: what happened, why so many died, what changes. Only numbers are given for the dead, the name is retired, routine advice keeps quiet for four weeks, and first class is nervous of the giants until 1914.
- The rules that follow: boats for all are law for British ships from July 1913 (a ship without them carries only as many passengers as her boats hold), announced in October 1912. The London Convention is signed in January 1914 and makes the night watch compulsory on passenger ships from July. The way the ship was lost adds one more: the southern spring track after ice, fog speed after a collision, or the removal of derelicts.
- The court's tiers, in every game: a censure brings the Board of Trade's inspections for two years, which detain unfit ships and send them to the yard. Gross negligence with lives lost takes away the insurance and the limit on claims (four times as large), and the owners and master are tried. A line that cannot pay is wound up: a new ending, with what the court found and what the Line saved money on.
- New findings at the inquiry: poorly trained lookouts and boat crews, and full speed kept after warnings (weighted heavily). The underwriters write, and the Marine Superintendent warns, about any ship whose loss would count as gross negligence.
- The ship's panel has a Boats and wireless section. The refit office offers boats for all. The times warns of the boats law and the Convention.
- The clock stops on the minute of the 1912 strike so it falls at the right hour.
- The harness's `careful` and `cautious` owners fit boats for all after the ruling. Bankruptcies count a line wound up by the court.

## 0.23.0 (28 September 2026)
Speed and splendour: 1907 to 1913.
- The great lines race for speed and size. Nordmark's Nordstern (1907) and Imperial Atlantic's turbine twins Invicta and Indomita (1907, 25 knots) contest the Blue Riband; Imperial's giants Atlantean (1911) and Hyperborean (1912), each over 45,000 tons, and Nordmark's 52,000-ton Weltmeer (1913) follow, with Compagnie Aurore's Provence Royale. Each is ordered two or three years ahead, and The times says when she is due.
- The panic of 1907: rumours on Wall Street in September, panic in October. Ships lose a quarter of their value, the bank calls in part of the Line's loans with six months to pay and stops lending for a year, and the Line's bank may fail. Government stock is safe from a failing bank.
- In 1908 more emigrants go home than come out: eastbound steerage is full and westbound half empty, and 1909 is still heavy.
- The North Atlantic conference forms in January 1908: fare floors, a steerage quota, no rate wars for members. The Line may join. Wars between the lines become rare.
- The seamen's strike of June 1911 holds ships in the home ports for about three weeks. The national coal strike of March 1912 puts bunker coal at up to two and a half times its price until May; a bunker contract keeps its price through it (and through the 1926 strike).
- The Blue Riband goes to the fastest ship on the North Atlantic. Win it and the Line's standing rises while she holds it.
- The Admiralty's terms for fast ships: from July 1903 a ship of 24 knots and 20,000 tons or more can be ordered on Admiralty terms in the drawing office. Built to naval standards (5% dearer), she has two thirds of every payment lent at 2.75% over twenty years, and earns a yearly subsidy of 4.5% of her price. The loan counts against net worth and the bank's lending, and is repaid from her sale or her insurance. In a war she may be taken as an armed merchant cruiser.
- A great line in trouble is reconstructed once by its bankers instead of failing outright.
- The American wireless law of July 1911, the $4 head tax of 1907 and the coal strike are in the history, and The times warns of them before they come.
- Canada's emigration boom is damped a little, so one old ship on the Canadian run no longer makes a fortune on its own.
- Rival lines add tonnage a little sooner in the boom years.
- Scrapping a ship pays at the day's prices.
- Head office's forecasts run about 40% faster: rival weights and each ship's modifiers are worked out once a day instead of thousands of times.
- The harness's `careful` owner shelters cash in government stock on rumours of a panic, sells stock to pay its bills, pays down its mortgage when flush and keeps its net debt under a third of its fleet's value.

## 0.22.0 (28 September 2026)
The steerage flood: the game starts in 1900.
- A new game starts in January 1900. The Morven Line opens in Glasgow with one elderly emigrant ship, the 1881 SS Morven (4,600 tons, 12.5 knots, over a thousand steerage berths), £7,000 in the bank and a £16,000 mortgage.
- Money follows the real price level year by year, from about two-fifths of 1921 prices in 1900. Fares, wages, coal, ships and yard work all follow it; money in the bank does not. The Finance tab measures prices against the year the Line was founded.
- Emigration follows the real figures: steerage to New York more than doubles by 1906, to Canada it climbs far faster, and the River Plate booms. First and second class grow steadily; cargo with world trade. Coal is dear in the 1900 boom and cheap by 1910. The dip in 1908 is real, and hard.
- The rival lines of 1900 sail smaller, slower ships with far more steerage to the ton. Their new ships take a year or more to build, and before the war they add tonnage only when their ships run well above their usual loads, so a boom leaves the trades short of berths for a while.
- The brokers offer ships of the period: 1880s and 1890s emigrant ships, cargo steamers, a frozen-meat ship and a West Africa steamer, and later the ships built in the years since. Nothing is offered before it was built.
- No conference until 1908. The lines fight over the trades: a war between two of them can halve steerage fares for months until they agree a pool. The great New York rate war of 1904 runs from February to November. Undercutting the other lines can still bring a war on you.
- The International Ocean Combine forms in October 1902: American money over Imperial Atlantic and Columbia, which keep their names. It buys weaker lines now and then. Once the Morven Line has three ships it may offer to buy it for well over its worth: selling ends the game; refusing, or letting the offer lapse, brings a rate war on your two busiest trades. It never forces a sale. The Company tab shows the Combine and its members.
- Ellis Island: a head tax on every immigrant landed at New York ($1, $2 from 1903, $4 from 1907), and about 2 in 100 refused and carried home at the Line's cost. A hostel at the port of sailing halves the refusals.
- Booking agents matter more in the emigrant years: steerage up 12% on the routes they serve until the war.
- Technology arrives on its dates: turbines in 1905, geared turbines in 1911, oil firing in 1919 (for new ships, conversions and head office's advice). The biggest slip grows from 20,000 tons in 1900 to 50,000 by 1911. Wireless is a dear novelty at first; ships built before 1911 do not come with it, and the mails need it only from July 1911. The cruises to nowhere wait for Prohibition in 1920.
- The times shows the steerage flood, the absence of a conference, the Combine and Ellis Island, with what is coming (the trust, the head tax). New history headlines for 1900 to 1906.
- The office no longer posts a silent ship overdue because she is a day or two late: it allows for her schedule, a foul bottom and a coaling stop, and waits three days (a quarter of the passage on a long one). With few ships carrying wireless before 1911, this matters.
- Lighterage off a port a ship is too big for is charged at the day's prices and counted in the forecasts, so head office no longer overrates big ships in the West Africa trade.
- No rival line is allowed to swallow the rest: the biggest grow more slowly, answer interlopers less readily and are kept off the receivers' sales.
- The conference fee and dues are shown at the day's prices. The tutorial says the clock slows on big events, and that undercutting angers the other lines.
- From 1907 to 1920 the game runs on the pre-war curves for now: the 1907 panic, the conference, the 1912 disaster, the war and the bubble come in the next releases. From January 1921 it carries on as the 1921 game, joined to the pre-war curves.
- Games begun in 1921 with 0.19 to 0.21 still load and keep their own rules.
- The harness plays 1900 to 1914 and has a new `careful` strategy, the sensible owner the 1914 targets are set for.

## 0.21.0 (28 September 2026)
Shore services that earn.
- Piers, repair yards, emigrant hostels, booking agents and freight canvassers can sell what your own fleet does not use to the other lines. Each has a switch on the Shore tab: own use (the default) or sell spare.
- A pier takes other lines' ships in the berths your own ships leave free, for a fee well below the dues they save. A repair yard takes outside work in the berths your fleet is not using, busier when the rival fleets are big and quieter in a slump. A hostel beds other lines' emigrants for a fee. Agents and canvassers book for other lines on commission.
- The rival lines pay out of their own accounts, and gain by it: berths and repairs are cheaper for them, and a shared hostel or agency wins them passengers and cargo on the routes it serves, some of which may be yours. That is the trade-off.
- Each place shows what it would earn from other lines before you switch it on, and what it has earned since, with how busy it is. The Finance ledger has a line for shore earnings from other lines.
- Head office suggests selling spare berths at a pier or a yard once they would earn about £400 a month. Hostels and agents are left to you.
- A new tool, `tools/outside.js`, prints what every kind of place earns year by year against its cost, and the effect of selling everything on the Line's own takings. With a full shore establishment, selling everything earns about a tenth of what it cost each year; the shared hostels and agents take about 6% off a small fleet's own takings on the routes they serve.

## 0.20.0 (28 September 2026)
Rival lines are real companies.
- Every rival line keeps accounts: cash, money borrowed against its fleet, what its fleet is worth, and a year of takings and profit. It earns from the same passengers and cargo your ships compete for on each route, and pays running costs that follow wages, coal and port dues (all lower in a slump), plus interest.
- Each line has a character: aggressive, combative or cautious; going for prestige or for volume; a heavy borrower, careful, or one that keeps its money in the bank.
- Lines build where their ships are running full and they can pay for it, borrowing as far as their character allows. The biggest lines grow more slowly. Flush lines repay their loans, pay a dividend each January and replace their oldest ships with faster new ones.
- A line that runs short and cannot borrow more sells ships, oldest first, to other lines or abroad. One that still cannot pay its way fails: the receivers sell up to two of its ships cheaply through your brokers, others to lines with money, and the rest for scrap or abroad. A small line with one or two ships left is wound up instead.
- New lines come in behind failed ones four months to a year later, sooner where a trade has been left with no rival ships at all, and later while a slump is deep. They put their ships where loads are best. A line that has a busy trade to itself may draw a challenger.
- The Company tab shows each rival's accounts and character with a health mark (prospering, sound, stretched, in trouble), and the lines that have failed and been founded. Each line's panel lists rival failures, sales, new ships and new lines on that route.
- A young ship taken off a weak route is sold, not sent to the breakers.
- The combine against the Morven Line is funded by the lines still trading.
- A new tool, `tools/companies.js`, plays forty years and checks the rival companies stay healthy as a group: in 1921 to 1940 about one failure a decade in the 1920s and two in the 1930s, no line with more than about 60% of rival tonnage, and no trade left empty for two years outside a slump.
- Balance: the plain harness strategies end close to where they did in 0.19 and the first year is a little kinder. Following head office does better than before (median net worth in 1930 about £360,000 against £260,000), mostly from rivals failing on the lines the Morven Line is winning.

## 0.19.0 (28 September 2026)
The calendar moves to 1900. Nothing in the game changes yet: this is the groundwork for the 1900 start.
- The game's calendar now runs from January 1900. The game still starts in January 1921, and plays exactly as before: the same seeds give the same games, day by day and in the balance harness.
- Every date the game cares about is written as a date (a year and a month) instead of a count of months since 1921, and the calendar lives in one place (data.js and helpers.js).
- Saves from earlier versions cannot be carried over. A player with an old save starts a new game and is told why once; the old save is left in the browser, untouched.
- Cash history on the Finance tab counts from the start of the game, not from January 1921.

## 0.18.0 (28 September 2026)
Current affairs.
- The times, on the Overview: the month's season and what it means, then every condition in force and what it is doing to trade in numbers, for the line most of the fleet sails: the season against the year's average, the American quotas, the post-war slump and the prosperous twenties, the Depression (and how far costs have fallen with it), a panic in the City, the long boom, air competition, the coal dispute and dear coal, the cost of living, rate wars on your lines and Prohibition. Everything is read from the same figures the sailings use.
- Coming: the next season and when it starts, and what a real owner would know was on the way (the 1924 immigration bill, the coal strike, the end of Prohibition, the Ocean Aid Convention).
- History so far: every headline since 1921, newest first, with those still in force marked.
- A line in the news as each season turns.
- A ship's profit and loss names what is weighing on her line now (winter, the quotas, the Depression and so on).
- The page's scripts carry the version, so a browser picks up each release instead of an old copy.

## 0.17.1 (28 September 2026)
- A ship's panel says in her description whether she has wireless, and the refit office lists what each section already has fitted, so equipment that is already aboard no longer just seems to be missing.
- Head office's yard suggestions for a ship stay up when she is already booked into the yard, and offer to add the work to the same visit, instead of disappearing.
- When acting on one suggestion settles others (a line now has its ship, a contract changes the sums), the Advice tray says which ones and why they went, instead of them vanishing without a word.

## 0.17.0 (28 September 2026)
The clock and insurance.
- The clock runs at half its old speed: a year takes about 20 minutes at 1×. A new 14× runs at the old 7× for quiet stretches.
- Big events slow the clock instead of stopping it: it drops to a quarter of 1× for about 20 seconds (a tenth, for 30 seconds, when a ship is lost), with the news in the banner, then picks up again on its own. Acting on anything, or pressing Carry on, brings it back at once. In Company settings, "On big events" chooses slow down (the default), pause as before, or carry on.
- Insurance on each ship's panel, in its own group. Choose the cover: none, the mortgage only, her market value (the default) or an agreed value a quarter above it; while she is mortgaged the bank insists on cover for its share. Choose the excess: none, standard or high, trading the premium against what the Line pays itself on a claim.
- The panel shows what she is insured for, the premium and rate, and what a loss would pay, how much of it goes to the mortgagees and what the Line keeps. One button sets the same policy for the whole fleet and for new ships.
- Premiums follow her condition and wear as before, plus the excess and the Line's recent claims, which fade over a few years. Laid up, she is insured for port risks only, at about a third of the premium.
- A loss now pays by her policy: the insured sum less the excess, the mortgagees first, and the news says what the Line keeps. With no cover the Line bears the whole loss; with mortgage-only cover salvage is not covered either.
- Insurance has its own line in the Finance ledger and in each ship's profit and loss, apart from maintenance.

## 0.16.0 (28 September 2026)
A balance pass, the first release of the 1900 overhaul.
- In the Depression the costs of running ships fall too: at the trough coal and oil cost a quarter less, wages a tenth less, port dues 15% less and insurance a tenth less, easing back with the recovery. A good ship on a good line can keep sailing through the slump.
- Government stock counts in the Line's net worth, and the bank lends against it (90% of its value).
- A laid-up ship keeps her crew content, but with no sea time and no training their skill drifts down; training costs stop while she is laid up.
- An outbreak aboard with no deaths costs no reputation, and a good surgeon's handling of it earns a little.
- The forecasts count each ship's own turnaround at both ends of her route, so cargo gear, hatches, piers and transit sheds now show the days and money they save.
- Oil gets cheaper through the mid-twenties to about nine-tenths the cost of coal for the same miles, so an oil conversion can pay for itself.
- Freight canvassers win about 8% more cargo instead of 15%, and cost twice as much to appoint and to keep.
- A repair yard costs £150,000 instead of £300,000, and £800 a month instead of £1,200.
- An emigrant hostel costs £35,000 instead of £60,000, and lifts steerage on lines calling there by 12% instead of 5%.
- A lavish table costs less to keep (provisions at 1.6 times standard instead of 1.9).
- The refit office warns when stabilisers, the radio-telephone, air conditioning or luxury suites would only pay on a big first-class ship, with what they would earn her and how long they would take to pay back.
- Beside a cruise conversion, the refit office shows what she would earn on her best cruise once converted, against her own line in the same months and cruising as she is.

## 0.15.0 (27 September 2026)
- Cruise programmes: a ship can have several cruises, not just one. In each cruise's months she sails it from its home port; where two seasons meet she finishes the one she is on first; in the months between she goes back to her own line, or lays up if she had none. A converted ship can cruise most of the year: Madeira in winter, the Mediterranean in spring and autumn, the fjords in summer.
- Her year, on her panel: a strip of the next twelve months showing where she will sail and about what she makes each month, and her average month with the programme against her own line all year, after the light passages between home ports.
- The cruise table on her panel adds and removes cruises one by one, with what each makes in its season against her line. Each cruise's panel on the Lines tab adds a ship to its programme, or makes it her line all year.
- Her panel says plainly what happens next: cruising now and where she goes after, joining when she next sails, or her next cruise and when.
- "How cruising works", on her panel and on each cruise's panel: what sells on a cruise, how the programme runs, and what changing home port costs.
- A ship's single cruise from 0.14 becomes her programme.

## 0.14.1 (27 September 2026)
- Fixed: an acting Traffic Department took ships off their cruise in the middle of the season and cancelled their cruising, and head office kept advising moving or laying up a ship away cruising. Departments now leave a ship with seasonal cruising alone, and only your own choice of line ends her season early.
- Choosing a cruise in its season takes effect at once if she is in port, and her panel says plainly what happens next: cruising now, joining when she next sails, or going in which months.
- Each cruise's panel on the Lines tab has a Send a ship table: every passenger ship, what she would make on the cruise in its season against her own line, and buttons to send her for the season or all year.
- The Villefranche label no longer runs into Naples on the chart.

## 0.14.0 (27 September 2026)
Cruises.
- Five cruises, a new group on the Lines tab and new routes on the chart: Madeira and the Canaries (winter sun, from Southampton), the Mediterranean (spring and autumn), Norway and the fjords (summer, from Glasgow), the West Indies (winter, from New York), and the cruises to nowhere (two nights from New York to beyond the limit, where the bar can open, until Prohibition ends in December 1933).
- A cruise goes out by its calls, spends a day ashore at the far end, and comes home non-stop with the same passengers. The fare is for the whole cruise, and passengers spend far more aboard. There is no cargo, no mail and no conference, so no rate wars, but the market is small and shared with the Meridian Cruising Company. Cruise ships lie off and land passengers by launch, so dues are lighter. Each cruise has its own season, and cruising grows through the twenties, dips in the slump and booms again on cheap cruises.
- Steerage sells nothing on a cruise (except the cruises to nowhere, which sell bunks cheap), so an emigrant ship makes a poor cruiser. Cabins, fittings and public rooms sell cruises; speed hardly matters.
- Seasonal cruising, on each ship's panel: choose a cruise and she leaves her line for its season and goes back after; a laid-up ship comes out for the season and lays up again. It shows what she would make on each cruise in its season against her line in the same months. Head office suggests it when it would pay, and a Traffic Department proposes it.
- Convert her for cruising, in the refit office: steerage out, a smaller number of Tourist cabins and a few more in first and second, sun decks and a white hull. Cruise passengers like her a quarter more; she can no longer carry emigrants.
- The cruise ship, in the drawing office from 1928: one white ship of cabins, pools and public rooms, and no steerage.
- Advertising is only charged while a line has a ship on it.

Also:
- Scrape and paint the bottom, a separate refit job: five days and about a fifth of the cost of an overhaul, for a clean bottom and her speed back, without the overhaul. Head office suggests a scrape rather than a full drydock for a foul ship in good condition.
- The mails: when the Line's reputation first reaches 40 you are told that it now qualifies for mail contracts. Tenders come up more often (about every four months), and only for lines with a wireless ship on them, since only wireless ships carry the mails and a contract without one is soon lost. Each line's panel says where it stands for the mail.
- Fixed: "Open it and assign her" from head office advice charged a flat £2,500 instead of the price-adjusted cost.

## 0.13.1 (27 September 2026)
- A ship's crew is always yours to set, ship by ship, from her Master and crew section ("Manage her crew"). An acting Crewing Office manages crews for you, but anything you set on a ship yourself (manning, pay, training or an officer) it leaves alone for three months, the same rule as the other departments.
- The crew window is now called "Her crew", so it is not confused with the Crewing Office department, and says whether the office is managing her and until when your own settings stand.

## 0.13.0 (27 September 2026)
- The crew office: a window for each ship's company, opened from her Master and crew section, with the clock stopped while it is open. Left alone, every ship runs on standard terms as before; the office is there when you want it.
- Officers you appoint: a chief officer and chief engineer on every ship, and a purser, chief steward and surgeon on ships with 60 or more passengers. Each has a skill and a wage, ages, and retires at 65. Candidates change every quarter.
  - The chief engineer means fewer breakdowns and less coal burned.
  - The chief officer means fewer fires, and emergencies fought better.
  - The purser brings more spending aboard and less smuggling.
  - The chief steward means better-liked service.
  - The surgeon means sickness spreads slower and kills fewer.
- Three departments, deck, engine room and catering, each with its own manning (short-handed, standard or full), pay (low, union rates or good) and training (none, drills or thorough). Morale follows pay, manning, training and the officers; skill follows training and the officers, slowly. Short-handed saves wages but adds half a day in port and more risk; full manning costs more and does better.
- The seamen's union's claims cover deck and engine-room hands only; stewards are paid their own rates.
- With a Crewing Office, the window also shows the whole fleet's crews in one table, the officers on offer are more and better, and when set to Act the office raises pay where morale is low, starts drills where skill is poor, and appoints better officers.
- Head office advice for crews is now by department: pay, drills and officers.
- Fixed: advice to change a line's advertising or table flipped back and forth when you accepted it. The options were judged against a figure that assumed rivals had already matched your fares, so every other setting looked better than the current one.

## 0.12.1 (27 September 2026)
- Profit and loss by ship, at the top of Finance: one row a ship with her takings, running costs, yard bills and mishaps, and profit, then advertising and head office, adding up to the Line's result.
- It shows a month on average over the last twelve months by default, since single months swing: a ship is paid when she arrives, so one month catches two arrivals and the next none, and yard bills land all at once. Last month and this month are a click away.
- Click a ship to see what is costing her: each bill as a share of every £100 she takes, the one or two things worth doing about it (speed, oil firing, pay, piers and sheds, her age), whether another line would pay her better, and her full account.
- The ledger has an average-month column beside this month and last month, by account and by line.

## 0.12.0 (27 September 2026)
Every view regrouped so each question has one place to look.
- Overview: Needs attention, Advice and Wireless, Fleet by line, and the news. The summary boxes, shortcuts and cash chart are gone (the chart is on Finance).
- Lines: everything about a route in one panel: fares, table and advertising; the ships on it with last month, their average and what each should make there; the forecast; the market report; conference tension with a button to join or leave; and the rivals' recent moves on that route.
- Fleet: the ship panel is in four groups that fold away: Earnings and line, Upkeep (condition, maintenance, threshold, fittings, refits and the hull), Master and crew, and Sell or scrap. A folded group shows a one-line summary, and the open ones stay open from ship to ship.
- Finance: one ledger with this month and last month side by side, by account, by line and by ship. Click a line or ship to open it.
- Company: the departments (moved from Shore), safety and inquiries, the conference, a short summary of each rival line, and milestones.
- Shore: property only: piers, agencies, hostels, yards, freight and bunkers.
- Save code, the pause setting and new game move to a Menu button beside the date.

## 0.11.0 (27 September 2026)
- Fleet by line on the Overview: one table with every line and the ships on it, what each line and each ship has made this month and last month, each ship's average over the last twelve months, the laid-up ships, head office costs and the Line's total. Click a line or a ship to open it. It replaces the separate Fleet and Lines lists.
- Every ship now keeps her own account: her takings and running costs (fares, cargo, mail, coal, crew, ports, upkeep, yard bills). Lines already kept theirs; head office, advertising, shore property and interest stay with the company.
- The ship panel shows her account (this month, last month, her average and where last month's money went) and a table of her lines: what she would make a month on each open line, laid up, or on a better line not yet open, with a button to assign her. It replaces the line drop-down.
- The Fleet list is grouped by line, with each line's result last month, and every ship shows her own last month.
- Ships on a line's panel show their last month beside their names.

## 0.10.4 (27 September 2026)
- Fixed: a line's fare table only showed the classes carried by the first ship on it, so buying an emigrant ship for a line whose first ship was a cargo liner hid third class altogether. The table now shows every class any ship on the line carries.
- The sailing forecast has a button for each ship on the line, starting with the biggest, instead of always showing the first.
- The line panel says which ship made the last outward and homeward sailings, since the Last out and Last home figures are hers.

## 0.10.3 (27 September 2026)
- Head office advice no longer withdraws itself after a few weeks. It stays until you act on it or put it aside.
- Advice with something to do (set a fare, book the yard, buy a pier) has a Not now button: a tip stays away for six months, a warning for three, a ship purchase for a year and a half, and it comes back only if it still stands.
- Advice that is only news (last month's losses, a rival adding a ship, rivals matching your fares, a thin cash reserve, the conference) has an Understood button instead, and stays away until the situation passes.
- Putting aside advice about a ship now sticks: lay-up, sell and similar suggestions no longer come back with the new month.
- Needs attention items you note or act on stay away until the situation passes, instead of for a month. The mail offer, the union claim, a called loan and an overdraft stay until dealt with.
- "Send SS ... to the breakers" advice now has a button that does it.

## 0.10.2 (27 September 2026)
- Removed the "Reputation 40 unlocks mail contracts" tip: the Post Office tells you itself when you qualify.
- "Put idle cash to work" only appears when cash is really piling up (more than a year of running costs beyond the deposit), and once withdrawn stays away for a year and a half.

## 0.10.1 (27 September 2026)
- Fixed: acting departments undid your changes. A ship whose line, speed or settings you change yourself is left alone by the departments for three months.
- Head office advice for a bunker contract, a pier or a booking agency now has a button that does it, not just one that opens the Shore tab.
- Head office no longer advises buying a worn-out ship from the brokers.

## 0.10.0 (27 September 2026)
- Hull layouts. Ships are drawn by how they are arranged, not all as liners:
  - Liners: classic (tall funnels and square decks), streamlined from 1930 (rounded fronts, terraced after decks, no more than two broad funnels, cruiser stern) and post-war from 1950 (a white hull, one great funnel, a raked stem, a mast on the bridge).
  - Cargo ships: the three-island tramp until 1945 (raised bow, bridge and poop, masts with derricks over the well decks, a tall thin funnel), the centre-castle cargo liner (a white house, cargo posts at every hatch, cruiser stern) and the modern motor ship from 1945 (grey hull, streamlined house, squat funnel).
  - Refrigerated ships: the white fruit ship, or either cargo layout.
  - Passenger-cargo liners: the centre-castle layout or any liner layout.
- Freighters no longer have rows of portholes: only the crew's few, or a row under the house when she carries passengers. The cutaway puts her passengers in the house and her cargo in the holds.
- The drawing office has a Layout choice for each kind of ship. Layouts matter a little: a tramp is cheaper to build but loses some hold space, a motor ship gains a little, and first class likes the streamlined and post-war looks.
- Ships already built or bought are drawn in the layout that fits what they carry and when they were built.

## 0.9.2 (27 September 2026)
- Acting departments no longer lay ships up on their own: they propose it under Needs attention and you approve or decline. A declined lay-up is not proposed again for three months.
- Unanswered department proposals lapse after two months.
- Head office no longer advises selling a laid-up ship during the winter months, when every ship looks like a loss.

## 0.9.1 (27 September 2026)
- Fixed: freighters were crewed like liners. Crew is now counted as deck and engine-room hands by size and fuel, plus stewards by the passengers carried, so a cargo ship costs about a third of what she did to crew while passenger ships cost much the same. Freighters now pay on a good cargo route once the 1921 freight slump is over.
- Cargo fittings, at build and at refit: more hatches and tween decks (cheaper handling, faster turnarounds), heavy-lift derricks (general cargo and manufactures pay more), deep tanks (palm oil pays more), alongside cargo gear and refrigerated holds. New cargo liners and refrigerated ships come with extra hatches.
- The refit office and drawing office leave out public rooms for ships that carry too few passengers for them to pay.
- Freight on the Shore tab: freight canvassers by region win more cargo for every ship calling there; transit sheds at a port cut handling and turnaround; cold stores at the meat and fruit ports win more chilled cargo.
- Cargo handling costs follow the price level.

## 0.9.0 (27 September 2026)
- The refit office: every yard job, upgrade and facility for a ship in one window, like the drawing office, with the clock stopped while it is open. Tick what you want, see the cost, the days out of service, the berths it takes and what it would add a month on her line, and book it all as one yard visit. The Marine Superintendent marks the options that would pay for themselves within about three years; one button takes his picks. It replaces the yard and upgrade buttons on the ship panel, and head office advice about yard work now has a button to open it.
- Public rooms and facilities, at build and at refit: first, second and third-class dining, theatre and music, a cinema, shops and duty free, swimming pools, a gymnasium and spa, a winter garden, and family rooms, each with levels from the modest to the grand. Each level takes a venue (a ship has two plus one per 8,000 tons), takes room from the cabins of the classes it serves, costs money to fit and to staff, and draws passengers. Shops, bars and shows earn money aboard, which shows in the ledger. Indoor rooms (pools, winter gardens, enclosed promenades) bring more passengers in the winter months. The grandest rooms need big ships and later years.
- New equipment can be fitted at refit, not only at build: gyro and fin stabilisers, a radio-telephone, air conditioning and a radiolocation set.
- The drawing office lays out public rooms for each kind of ship, and you can change them. The old pool and cinema extras are now facilities.

## 0.8.4 (27 September 2026)
- Salvage after a breakdown beyond repair is mostly paid by the underwriters: the Line pays an excess and a quarter of the rest.
- A tow is explained in full: the salvage bill, who pays it, and the passengers' refunded fares when she is towed back. The ledger shows salvage and refunds on their own lines instead of hiding them in yard costs and fares.
- The Shore tab warns that departments cost more than they save until the fleet reaches about four ships.

## 0.8.3 (27 September 2026)
- Fixed: head office kept advising big first-class rises. Demand above the line rate now falls away much faster than below it, because passengers simply book with the line next door; the most profitable fare is now close to the line rate unless the ship is faster or finer than her rivals.
- Fixed: head office advised fare cuts that the rivals would match within months, then advised raising them back. Fare advice now judges a fare where it settles, after the rivals respond.

## 0.8.2 (27 September 2026)
- Yard visits can be combined. Once a ship is booked into the yard or is there, any other job or upgrade can be added to the same visit for 15% off, and most of the extra work runs alongside the first, so the visit grows by far less than the job's own time. Jobs added while she is at sea are paid when she goes in. Head office advice for yard work adds to a visit already booked.
- Upgrade rows no longer squeeze their descriptions on narrow panels.

## 0.8.1 (27 September 2026)
- Overdue ship notices no longer pause the clock. The notices still appear.

## 0.8.0 (27 September 2026)
- Money loses its value. Prices rise over the decades, slowly in the twenties and faster after the war, and fall in a slump. Wages, coal, dues, yard work, ships, shore property and line rates follow them; each January the lines revise their tariffs and your fares follow. Cash in the bank does not: hold ships, property or government stock instead. The Finance tab shows how far prices have moved.
- Panics. From the mid-1930s the City panics every decade or so. First rumours, then the crash: trade falls away, second-hand ship prices collapse, the bank calls in part of its loans with three months to pay, lending stops for a year and interest rises. Sometimes the Line's own bank fails and most of the cash on deposit goes with it. Unpaid called loans are taken by seizing ships in port. Do nothing and the Line goes under.
- Government stock: buy and sell consols in the Finance tab. They pay 3½%, survive a bank failure and fall a little in a panic.
- A big line is exposed. Head office costs grow faster than the fleet. Excess profits duty takes 30% of a year's profit above a threshold. The seamen's union claims more from a big, rich line: agree, or risk a strike in the home ports. When the Morven Line outgrows the biggest rival, the others form a combine: pooled money, new tonnage and fighting rates on your main routes, and expulsion from the conference.
- The aeroplane takes a slice but never the trade: airships until the Graf Aurelian burns, flying boats after the war, then jets until the Air Conference caps them. It takes express first class and some second, never steerage or cargo, and never more than a quarter of a route's first class. Ships of 26 knots or more hold their first class best. The line panel shows the air's share.
- Ships wear out. Every crossing uses up some of a hull's life: more at full speed, in a run-down ship, with a hard-driving master, in gales and without maintenance. A well-kept ship lasts thirty-five years or more; a thrashed one a dozen. An ageing ship cannot be brought back to full condition, breaks down and springs leaks far more, fetches less and costs more to insure; at the end she loses her steerage certificate. Re-plating buys years, less each time. The ship panel shows her state, and the Marine Superintendent advises re-plating and the breakers.
- Courts of inquiry. Every lost or written-off ship is investigated. A well-found ship lost to ice with her people saved costs little. A worn-out, run-down, undermanned or unsuitable ship, one without wireless, or one whose owners gave no orders when asked, brings fines, claims from families and shippers, recovery costs, a clawback of the insurance if she was unseaworthy, and a stain on the Line's name that fades only slowly. The immediate reputation hit of a loss is smaller; the inquiry decides the rest.
- Safety and training policy for the whole fleet (Company tab): cut corners, Board of Trade rules, or exemplary. It changes how well crews fight emergencies, how many people live, what the courts find, and your standing.
- Reputation brings better freight: general cargo, manufactures and chilled goods favour a line with a good name.
- Bigger ships cost far more than their tonnage: a superliner costs about twice what it did. Piers cost two and a half times as much and agencies twice.
- Emergencies: minor ones are handled by the master without asking you, and no longer slow the clock or open the window. Serious and grave ones stop the clock almost completely while the master waits for orders: about two minutes to decide, three for a grave one.
- Needs attention: acting on an item, or pressing Noted, clears it for a month.
- Borrow, repay and buy stock in larger amounts.

## 0.7.1 (27 September 2026)
- The drawing office power curve is full width with readable axes: horsepower against knots, the wall marked, and the design speed and horsepower labelled on the curve.

## 0.7.0 (27 September 2026)
- The drawing office works like one. You set the job (purpose, the line she is for, size, speed, what she carries) and the naval architects work out her length, beam, draught, lines, horsepower, coal or oil per day and bunkers. Speed costs power steeply past what her length allows, shown on a power curve; a longer hull is easier to drive but is limited by the era and by the ports on her line. Leave engines and hull form to the engineers or overrule them.
- The architects' report says in plain words what she will be: her dimensions, why they chose them, how much of her the engines and bunkers take, whether she fits every port on the line, what kind of sea boat she will be, and whether her bunkers reach the longest leg.
- Ships in service live with their design. Bottoms foul over months at sea (faster in the tropics) and cost speed and coal until the next drydock. Ships too big for a port lighter their cargo at anchor, or ground. Small ships on rough routes lose passengers, time and condition to the weather. Short-legged ships give up cargo space to bunkers.
- Masters report in their own words when something is wrong with the ship or the job: a foul bottom, a hard passage, a port she does not fit. Some masters are blunter than others. The ship panel shows the master's last word and the state of her hull.
- Emergencies have a severity: most are minor, some serious, a few grave. Grave ones can end with the ship lost, the last signals going out in the log, or with a ship saved but not worth repairing and given up to the underwriters.
- The master asks the owners for orders at each turn: how to fight the water or the fire, what to do with the passengers, whether to abandon her; how to handle a mutiny, pirates or an outbreak. The clock nearly stops while he waits. Each answer is explained, and the right one depends on the situation. If no order comes in time he does what he thinks best, and some masters think better than others. A ship without wireless cannot be ordered at all.
- The office can act on its own during an emergency: call every ship within 500 miles, or send ocean salvage tugs on no cure, no pay terms.
- Outbreaks are named diseases (influenza, measles, typhoid, typhus, cholera, smallpox, yellow fever), depend on the route and the season, and are more common. Isolate the sick, land them at the nearest port, or say nothing and hope the port doctor misses it. On arrival the agents ask whether to accept the quarantine, land steerage at the quarantine station at your expense, or protest to the health officer.
- When a ship is lost or given up, her share of the mortgage is paid first out of the insurance.
- Advice goes stale: a tip nobody acts on is withdrawn after a month (for four months) and a warning after six weeks (for two). Buying advice is no longer given when the line is already heavily mortgaged.
- Telegrams use QUERY for a question mark. The owners' own orders arrive in the wireless room already decoded.
- The game has an icon.

## 0.6.4 (27 September 2026)
- The drawing office has an Exterior and Cutaway switch: the cutaway shows the new ship's spaces as you change her class split and cargo, with berths and tonnage in the legend.

## 0.6.3 (27 September 2026)
- The cutaway is laid out from what the ship actually carries: cargo fills the holds from the bottom up, passengers fill from the top down with the best class highest and amidships, and the rest is crew, stores and mail. Cargo ships, fruit ships, tourist liners and emigrant ships now look like what they are.

## 0.6.2 (27 September 2026)
- Funnels stand on the top deck: they are spaced evenly between its after end and the bridge, and the superstructure steps in only as far as the funnels allow. Lifeboats keep clear of them.

## 0.6.1 (27 September 2026)
- Ship drawings scale as a whole: every ship is drawn to one plan and shrunk or enlarged by her tonnage, so funnels, decks and hull stay in proportion. Big ships get a fifth deck; funnels are spaced evenly and no longer run off the top of the picture.

## 0.6.0 (27 September 2026)
- Emergencies: collision, striking ice or wreckage, sprung plates, fire, outbreaks of illness, mutiny and piracy. The crew fight the threat, ships within wireless range answer the call and steam to help, and the master orders the boats away if she cannot be saved. Ships without wireless can only fire rockets.
- An emergency window follows each one: the situation, water or fire against the crew's control, the ships answering and how far off they are, and every signal. The clock slows to an hour a second while it lasts. Owner's orders are a placeholder for now.
- Wireless messages from sea arrive in Morse and are decoded when you tap them; the Wireless tab counts the undecoded ones. Agents' cables arrive in plain words.
- Acting departments now work through their advice every week instead of monthly. Traffic moves one ship a week at most, leaves a moved ship for two months, and never moves a ship onto a losing line.
- Fixed: advice buttons in the tray appeared to do nothing while the pointer was over it.
- The overdraft warning no longer pauses the clock.

## 0.5.1 (27 September 2026)
- Needs attention, advice and the wireless room share one fixed-height tray with tabs and counts, so arrivals never push the page about.
- The tray holds still while the pointer is over it, or for a few seconds after touching or scrolling it on a phone.
- A wireless message keeps its final size while it prints and decodes.
- Advice for a ship or a line sits behind one row that opens on request; the ship's wireless log moves to the foot of her panel.
- Long names and statuses in the overview no longer wrap and shift the rows below.

## 0.5.0 (27 September 2026)
- Shipbuilding. A drawing office over the chart: choose her purpose, size, hull form, subdivision, funnels, speed, machinery and fuel, the split between passengers and cargo and between the classes, the quality and style of her fittings, extras such as stabilisers and air conditioning, the builder and the contract, and her name. Builders have slips that other lines keep busy. She is drawn, waits for a slip, is framed, plated, launched, fitted out and tried on the measured mile. Payments come in stages; if you cannot pay, work stops, and six months unpaid loses the contract. A repair yard can take a building slip of your own.
- Interior styles go in and out of fashion. Old ships date; refurbishment brings them up to the current style.
- The timeline runs on past 1935, with no war: the superliner race, airships, a recession, the Ocean Aid Convention (wireless compulsory for passenger ships from 1940), a reopened America, the tourist boom, radiolocation, the long boom, cheap oil, winter cruising and jets held at bay. New machinery, hull forms and fittings arrive over the years, rivals build faster and bigger ships, and the brokers offer newer second-hand ships.
- Ships without wireless are silent. The chart shows where she ought to be. If she is in trouble, only a ship near enough to see her lamps and flares can pass the word on; otherwise you hear when she arrives, overdue, or when she is posted missing. A ship can founder: rescuers depend on who is nearby, the underwriters pay, and lives lost cost reputation.
- Departments have a head (competence, careful or bold), staff that grow with the fleet, rent and sundries. Weak heads miss months and misjudge fares. They never open lines, buy, sell or build on their own: they bring proposals to you. Lines already open are preferred to opening new ones.
- First-year briefing from Mr Ferguson for new games.
- Early game less generous: agents and hostels do less, brokers ask more, the Morven starts more worn, and shore spending is not suggested in the first year.
- Phones: compact header, a shorter chart that can be hidden, the drawing office as a full-screen page.

## 0.4.1 (27 September 2026)
- Ships never vanish: moving light between lines they sail real passages (the Irish Sea, round Land's End, the Gulf of St Lawrence, the Florida Strait and more), and rival ships finish their voyage before changing route or going to the breakers.
- Breakdowns sort themselves out. The engineers report what they find: fixed within hours, under way slowly on a temporary repair, days of repairs at sea, or no repair possible and a salvage tug on its way.
- Wireless room: ships report by wireless through coast stations such as Malin Head and Cape Race, printed as Morse and decoded on the tape. Ships without wireless are reported late by passing steamers through Lloyd's. Sailings and arrivals come by cable from the Line's agents.
- Voyage news by wireless: gales, fog, ice, stowaways, rescues.
- Clock slowed by a further 20%.

## 0.4.0 (26 September 2026)
- Save codes: copy the whole game as text or as a link, and load it in any browser (Company tab).
- Open-ended: the game no longer stops in 1930. The Depression bites from late 1929, rates and fares fall with it, and recovery starts in 1934.
- Chart extended to the South Atlantic. Twelve services in four groups, many with calls: Queenstown, Moville, Cherbourg, Naples, Gibraltar, Lisbon, Rio, Montevideo.
- New trades: Liverpool to Halifax, Glasgow to Montreal (Saint John in winter), Liverpool to the Gulf for cotton, Avonmouth to Jamaica for bananas, West Africa for palm oil, the River Plate for chilled beef.
- Cargo by commodity, with seasons; bananas and beef need refrigerated holds.
- Upgrades: refrigerated holds, wireless, turbines, luxury first class, cargo gear. Fittings wear out; refurbish them.
- Masters with personalities (cautious, hard-driving, popular, weather-wise, old hand, martinet, lax, fond of a drink). They age and retire; appoint replacements from a quarterly pool.
- Crew pay and morale: low pay saves money and costs you in breakdowns, service and desertions.
- Shore tab: piers, booking agencies, emigrant hostels, repair yards and a bunker contract.
- Head-office departments (Fares Office, Traffic Department, Marine Superintendent, Crewing Office). Each advises in its own field and can be set to act on its advice, within a cash reserve.
- Advice now covers lay-ups in slumps, selling losers, refits, crews and shore property, and warns before a cash crunch.
- Rivals hold their home trades instead of melting away, and answer an interloper with new tonnage.
- Milestones in the Company tab.

## 0.3.0 (26 September 2026)
- Rival lines as real companies: fleets on the chart, cash, expansion, retreat, scrapping, insolvency.
- One shared market per route: every ship, yours or theirs, takes a slice by berths, crossings and appeal.
- Rivals match fare cuts; rate wars are led by a named rival.
- Reputation is a standing earned by service and speed; its effect on demand is capped.
- Naples rush before the June 1921 quota; higher Mediterranean fares.
- Bank overdraft: £8,000 plus half of unused borrowing.
- Market report shows real rival ships, shares and fares; rival profiles in the Company tab.
- Mr Ferguson notes rival moves and matched fares; buy and move advice uses year-round averages.
- Clock 25% slower; alert and advice lists no longer make the menus jump.
- Repo split into modules; balance harness and route report tools.

## 0.2.0
- Real time with pause, chart with pannable map, tabs, ship drawings, breakdown decisions, service thresholds, Mr Ferguson's advice.

## 0.1.0
- Turn-based prototype.
