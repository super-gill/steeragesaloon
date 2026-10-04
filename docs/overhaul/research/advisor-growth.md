# Why head office's owner grows so fast before 1914 (0.39.2)

KI-065 said an owner who takes every piece of head office's advice reaches about £930k by 1914 against about £80k for the careful scripted owner, and blamed old ships bought second-hand. 0.39.2 set out to fix that. The diagnosis was wrong, three fixes failed, and the one change kept is small. This note records what was measured so the question can be judged on human play in the 0.40 test round.

## What the advisor's fortune is made of

The advisor's fleet in January 1914 (seed 1, `tools/harness.js advisor`, 0.39.1):

| Ship | Built | Tons | Paid | Worth | Profit, last 12 months |
|---|---|---|---|---|---|
| Harness 537 (new emigrant ship) | 1913 | 11,000 | £206k | £184k | £82k |
| Harness 536 (new emigrant ship) | 1911 | 11,000 | £195k | £160k | £77k |
| Harness 534 (new emigrant ship) | 1908 | 11,000 | £189k | £143k | £69k |
| Arcadian Queen | 1902 | 10,500 | £103k | £72k | £38k |
| Auchbride | 1893 | 6,200 | £70k | £47k | £33k |
| Caledonian | 1886 | 5,200 | £44k | £25k | £19k |
| Morven | 1881 | 4,600 | | £33k | £18k |
| five more | | | | | £-3k to £21k |

Most of it is new emigrant ships on the Canadian routes, returning 37% to 40% a year on their cost in 1913. In another game the old ships did best: the Morven cleared £49k in 1913 on a worth of £28k. Old or new, the money is steerage in the boom years (1903 to 1907, 1910 to 1913).

## Why the trades were so full

Emigrant demand to Canada grows 4.6 times from 1900 to 1913 (immigration to Canada grew about ninefold; the game takes it to the power 0.7), to New York 2.7 times. Rival capacity on the Canadian and Liverpool routes grew about 2.5 to 3 times. In 1911 to 1913 a new emigrant ship on Liverpool to Halifax sails 80% to 100% full westbound in the summer; rival lines run 1.25 to 1.5 times their 1900 loads (all classes, both ways), against 30% to 40% for emigrant liners over the whole pre-war period (Keeling). Rivals add a ship only when loads run 20% over 1900's, one order per trade at a time, and the biggest line was over its borrowing limit in 1912 and 1913; small lines that failed in the 1908 slump left their trades short.

## What was tried

| Change | Advisor, 1914 | Careful owner, 1914 | Careful owner bankrupt by 1922 |
|---|---|---|---|
| 0.39.1 as released | £933k to £948k | £83k to £91k | 4 or 5 of 40 |
| Old-type steerage loses 20% of its appeal on the northern routes by 1910 (US Immigration Commission, 1911) | £626k | £54k | 8 of 40 |
| Rivals build for the boom (two orders a trade, keener the fuller) and booms draw new lines | £563k | £53k | 7 of 40 |
| Rivals replace ships they break up (kept) | £948k | £91k | 5 of 40 |
| A ship price cycle: new ships 0.82 to 1.25 of normal, second-hand 1.6 times the swing | £968k | £91k | 10 of 40 |

Every market-wide change cut the careful owner as much as the advisor, because both earn from the same steerage. The price cycle made it worse: a weak line forced to sell in the 1908-09 slump sold at the bottom, while the advisor had the cash to buy there, as Burrell did. The experiments are kept in `experiments/0.39.2-cycle-and-boom.patch` (against 0.39.1).

## The price cycle's sources

The timing is sourced: a peak in 1900, a crash in 1901 and depressed years to 1904, recovery to 1907, the slump of 1908-09, and the boom of 1911-13 ([Stopford, via lawexplores](https://lawexplores.com/shipping-market-cycles/); the New York to Liverpool grain rate, NBER series m03034 on [FRED](https://fred.stlouisfed.org/data/M03034M504NNBR), fell about two thirds from 1900 to 1904 and more than doubled from 1910 to 1912; [Burrell's orders in slumps](https://carp.arts.gla.ac.uk/essay/?enum=1097247776)). The size of the swing was not found: Pollard and Robertson's Fairplay series, the Glasgow thesis tables ([theses.gla.ac.uk](https://theses.gla.ac.uk/71126/1/10390703.pdf), pp.56-57) and Kaukiainen's second-hand price table could not be read.

## Where this leaves KI-065

The advisor is a script that takes every piece of advice, at once, with all the Line's credit. The careful owner keeps six months' costs in hand and pays its debts down. A gap of ten times between them in thirteen boom years is what compounding at 30% against 7% gives. Whether it matters depends on whether a human player gets near the advisor, so KI-065 becomes a question for the 0.40 test round.
