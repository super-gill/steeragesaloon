# Emigration and migration volumes, 1900 to 1940

Research notes for a British emigrant/passenger line sim. All figures are persons unless stated. "FY" = fiscal year. "~" = approximate or rounded in the source. "[check]" = source extraction looked shaky; treat as indicative only.

## 1. United States: immigrant arrivals

### 1a. Immigrant aliens admitted, every year (US FY ending 30 June)
Source: INS/DHS Table 1 series "Immigration to the United States, FY 1820-1998" (as reproduced in the River City PDF); cross-checked against Willcox (NBER 1931) Table 16 for 1908-1930 (matches to the thousand) and the 1914 and 1930 Commissioner-General reports.

| Year | Immigrants | Year | Immigrants | Year | Immigrants |
|---|---|---|---|---|---|
| 1900 | 448,572 | 1914 | 1,218,480 | 1928 | 307,255 |
| 1901 | 487,918 | 1915 | 326,700 | 1929 | 279,678 |
| 1902 | 648,743 | 1916 | 298,826 | 1930 | 241,700 |
| 1903 | 857,046 | 1917 | 295,403 | 1931 | 97,139 |
| 1904 | 812,870 | 1918 | 110,618 | 1932 | 35,576 |
| 1905 | 1,026,499 | 1919 | 141,132 | 1933 | 23,068 |
| 1906 | 1,100,735 | 1920 | 430,001 | 1934 | 29,470 |
| 1907 | **1,285,349** (peak) | 1921 | 805,228 | 1935 | 34,956 |
| 1908 | 782,870 | 1922 | 309,556 | 1936 | 36,329 |
| 1909 | 751,786 | 1923 | 522,919 | 1937 | 50,244 |
| 1910 | 1,041,570 | 1924 | 706,896 | 1938 | 67,895 |
| 1911 | 878,587 | 1925 | 294,314 | 1939 | 82,998 |
| 1912 | 838,172 | 1926 | 304,488 | 1940 | 70,756 |
| 1913 | 1,197,892 | 1927 | 335,175 | 1941 | 51,776 |

Story beats for the sim:
- 1905-1907 boom, 1907 all-time peak (1.285m); Ellis Island's busiest day 17 Apr 1907, 11,747 received.
- 1908 slump (Panic of 1907): arrivals down ~39% and departures spike (see 2b).
- 1913-1914 second peak (~1.2m each), then collapse: FY1915 327k, FY1918 111k (war, U-boats, shipping requisitioned).
- 1920-21 rebound (FY1921 805k) triggers the Emergency Quota Act (May 1921): FY1922 falls to 310k.
- 1923-24 rush before the Johnson-Reed Act (FY1924 707k, heavily Canadian/Mexican non-quota plus quota), then FY1925 294k.
- Late 1920s plateau ~280-335k, of which a large share is Western Hemisphere (Canada, Mexico) and not carried by transatlantic lines.
- Depression: FY1932 35.6k, FY1933 23.1k (lowest since the 1830s); slight recovery to 83k in 1939 driven by refugees (German quota fully used 1939-40).

Averages (EH.net): 1900-1914 ~900,000/yr (10.2 per 1,000 US pop); 1915-1919 234,536/yr; 1920-1930 412,474/yr; 1931-1946 50,507/yr (0.4 per 1,000).

### 1b. By origin: decade totals (country of last residence)
Source: DHS Yearbook 2020 Table 2 (decades run 1900-1909 etc.).

| Origin | 1900-09 | 1910-19 | 1920-29 | 1930-39 |
|---|---|---|---|---|
| **Total, all countries** | 8,202,388 | 6,347,380 | 4,295,510 | 699,375 |
| United Kingdom (GB, excl. Ireland) | 469,518 | 371,878 | 342,762 | 61,813 |
| Ireland | 344,940 | 166,445 | 201,644 | 28,195 |
| Norway-Sweden | 426,981 | 192,445 | 170,329 | 13,452 |
| Denmark | 61,227 | 45,830 | 34,406 | 3,470 |
| Germany | 328,722 | 174,227 | 386,634 | 117,736 |
| Italy | 1,930,475 | 1,229,916 | 528,133 | 85,053 |
| Austria-Hungary (all) | 2,001,376 | 1,154,727 | 60,891 | 13,902 |
| Russia | 1,501,301 | 1,106,998 | 61,604 | 2,473 |
| Poland (separate from 1920s) | n/a | n/a | 224,420 | 26,460 |
| Greece | 145,402 | 198,108 | 60,774 | 10,599 |
| Portugal | 65,154 | 82,489 | 44,829 | 3,518 |
| Netherlands | 42,463 | 46,065 | 29,397 | 7,791 |
| Canada | 123,067 | 708,715 | 949,286 | 162,703 |
| Mexico | 31,188 | 185,334 | 498,945 | 32,709 |

Note: pre-1920 Poland is inside Russia/Austria-Hungary/Germany. Austria-Hungary in the source also lists Austria and Hungary sub-rows that do not add to the total (part of the flow was unallocated).

Shares (EH.net): 1900-1914 Central/Eastern Europe 45%, Southern Europe 26%, Great Britain 6%, Scandinavia/NW Europe 4%, other Americas 5%. 1920-1930: Central/Eastern 14%, Southern 16%, other Americas 26%, Great Britain 8%, Scandinavia 5%.

Approximate annual mix for game tuning (derived by dividing decade totals by 10; mark as approximation): in 1900-09 the US took roughly 193k/yr Italians, 200k/yr Austro-Hungarians, 150k/yr from Russia, 47k/yr from Britain, 34k/yr Irish, 43k/yr Scandinavians, 33k/yr Germans. Single-year by-country figures were NOT captured reliably (the NBER Ferenczi-Willcox US table OCR was misaligned) - gap.

### 1c. Quota regime
- Emergency Quota Act (May 1921): 3% of each nationality's foreign-born in 1910 census; total ~357,803/yr (FY1922); ~55% for N and W Europe (Cato).
- Johnson-Reed Act (1924, effective FY1925): 2% of 1890 foreign-born; total ~164,667 to 165,000 Eastern Hemisphere (82% N/W Europe, 14% S/E Europe per Cato). Consular visa required before boarding ("no alien ... without a valid immigration visa issued by an American consular officer abroad").
- National Origins quotas from 1929: 150,000 total, min 100/country. Wikipedia gives GB (and Ireland, see note) 34,007 [check: other sources split GB/N. Ireland and Irish Free State], Germany 51,227, Italy 3,854, Poland 5,982 (these appear to be the 1924-29 quotas).
- Western Hemisphere (Canada, Mexico) unrestricted by quota; hence the 1920s Canadian surge into the US.
- Italian US immigration fell by more than 90% after 1924 (Wikipedia).
- 1930 onward: Hoover's "likely to become a public charge" instruction choked visa issuance. German quota 25,957 (27,370 after merger with Austria 1938); 27,370 visas 1939, 27,355 in 1940 (USHMM).

## 2. Ports and return migration (US)

### 2a. Port of arrival
- New York took "more than four-fifths" of US immigrants in the 1890s (Ancestry port guide); Philadelphia 5.6% in 1880-1900 and under 1% after WWI.
- Ellis Island processed >12 million, 1892-1954; 1907 busiest year (>1 million).
- First and second class passengers were inspected aboard ship and did not go to Ellis Island; only steerage/third class were ferried there.
- After 1924 (visa system), Ellis Island handled mainly problem cases.
- Precise NY share for 1900-1914 by year: NOT found in an opened source (commonly cited as ~70-75%; unverified - gap).

### 2b. Aliens admitted vs departed, FY1908-1930 (thousands)
Source: Willcox, NBER 1931, Table 16. "All aliens" includes nonimmigrants (visitors, transits); "departed" includes nonemigrant (temporary) departures. Row arithmetic checked (admitted - departed = net) and matches to within 1 except 1919.

| FY | Immigrants | All aliens admitted | All aliens departed | Net | Departed per 100 admitted |
|---|---|---|---|---|---|
| 1908 | 783 | 925 | 715 | 210 | 77 |
| 1909 | 752 | 944 | 400 | 544 | 42 |
| 1910 | 1,042 | 1,198 | 380 | 818 | 32 |
| 1911 | 879 | 1,030 | 518 | 512 | 50 |
| 1912 | 838 | 1,017 | 615 | 401 | 60 |
| 1913 | 1,198 | 1,427 | 612 | 815 | 43 |
| 1914 | 1,218 | 1,403 | 634 | 769 | 45 |
| 1915 | 327 | 434 | 384 | 50 | 88 |
| 1916 | 299 | 367 | 241 | 126 | 66 |
| 1917 | 295 | 363 | 146 | 216 | 40 |
| 1918 | 111 | 212 | 193 | 19 | 91 |
| 1919 | 141 | 237 | 216 | 27 [check] | 91 |
| 1920 | 430 | 622 | 428 | 194 | 69 |
| 1921 | 805 | 978 | 426 | 552 | 44 |
| 1922 | 310 | 433 | 345 | 87 | 80 |
| 1923 | 523 | 673 | 201 | 473 | 30 |
| 1924 | 707 | 879 | 217 | 663 | 25 |
| 1925 | 294 | 458 | 225 | 232 | 49 |
| 1926 | 304 | 496 | 228 | 268 | 46 |
| 1927 | 335 | 538 | 254 | 284 | 47 |
| 1928 | 307 | 501 | 274 | 226 | 55 |
| 1929 | 280 | 479 | 252 | 227 | 53 |
| 1930 | 242 | 446 | 272 | 174 | 61 |

Cross-checks: FY1914 Commissioner-General: 1,218,480 immigrants; 633,805 aliens left; net 769,276. FY1930 report: 446,214 aliens admitted (241,700 immigrants, 204,514 nonimmigrants); 272,425 left (50,661 emigrants, 221,764 nonemigrants); 16,631 deported.

Implication for a line: eastbound steerage demand was real. 1908-1930 cumulative net = ~63% of gross (Willcox), i.e. roughly a third came back.

Return rates by group (1908 departures vs 1907 arrivals, Genealogy.com citing contemporary data; a crude ratio, not a cohort rate): Southern Italians 61%, Croatians/Slovenes 59.8%, Slovaks 56.1%, Hungarians 48.7%, Northern Italians 37.8%, Poles 33.9%, Finns 23.3%, Germans 15.5%, Scandinavians 10.9%, English 10.4%, Czechs 7.8%, Irish 6.3%, Jews 5.1%. Stanford (Abramitzky et al.): about one in three immigrants returned, 1850-1913.

1931-1940 departures: sources say more aliens left than arrived in the early 1930s (Genealogy.com), but annual 1931-40 departure figures were not obtained from an opened source - gap.

## 3. Canada: immigrant arrivals

### 3a. 1901-1913, government fiscal years (Canada Year Book 1922-23, Table 65)
FY ended 30 June to 1906; "1907" is a 9-month period (Jul 1906 to Mar 1907); from 1908 FY ends 31 March.

| FY | Arrivals | FY | Arrivals |
|---|---|---|---|
| 1901 | 49,149 | 1908 | 262,469 |
| 1902 | 67,379 | 1909 | 146,908 |
| 1903 | 128,364 | 1910 | 208,794 |
| 1904 | 130,331 | 1911 | 311,084 |
| 1905 | 146,266 | 1912 | 354,237 |
| 1906 | 189,064 | 1913 | 402,432 |
| 1907 (9 mo) | 124,667 | 1914 | 384,878 |

Year 1900 value not captured (gap; "~" 40-45k is commonly cited, unverified).

### 3b. 1913-1940, calendar years (Canada Year Book 1963-64, Table 1)

| Year | Arrivals | Year | Arrivals | Year | Arrivals |
|---|---|---|---|---|---|
| 1913 | **400,870** (all-time peak) | 1923 | 133,729 | 1933 | 14,382 |
| 1914 | 150,484 | 1924 | 124,164 | 1934 | 12,476 |
| 1915 | 36,665 | 1925 | 84,907 | 1935 | 11,277 |
| 1916 | 55,914 | 1926 | 135,982 | 1936 | 11,643 |
| 1917 | 72,910 | 1927 | 158,886 | 1937 | 15,101 |
| 1918 | 41,845 | 1928 | 166,783 | 1938 | 17,244 |
| 1919 | 107,698 | 1929 | 164,993 | 1939 | 16,994 |
| 1920 | 138,824 | 1930 | 104,806 | 1940 | 11,324 |
| 1921 | 91,728 | 1931 | 27,530 | | |
| 1922 | 64,224 | 1932 | 20,591 | | |

Origin split (Canada Year Books):
- Calendar 1912: 395,804 total = UK 145,859 / US 140,143 / other 109,802.
- FY to 31 Mar 1913: 402,232 = UK 150,542 / US 139,009 / other 112,681.
- Calendar 1914: 168,930 = UK 49,879 / US 68,659 / other 50,392 (note: differs from the 150,484 in the later series; definitions revised).
- Note that roughly a third of Canadian arrivals came overland from the US, so only ~2/3 are ocean passengers.
- 1913 = 5.3% of Canada's population in one year (Wikipedia, annual immigration statistics).

## 4. Argentina (River Plate) and Brazil

### 4a. Argentina: overseas immigrants (2nd and 3rd class sea arrivals) and emigrants (2nd/3rd class sea departures)
Source: Ferenczi and Willcox, International Migrations vol. 1 (NBER 1929), Argentina Tables I and IV.

| Year | Immigrants | Emigrants | Net | Year | Immigrants | Emigrants | Net |
|---|---|---|---|---|---|---|---|
| 1900 | 84,851 | 38,334 | 46,517 | 1913 | 302,047 | 156,829 | 145,218 |
| 1901 | 90,127 | 48,697 | 41,430 | 1914 | 115,321 | 178,684 | -63,363 |
| 1902 | 57,992 | 44,558 | 13,434 | 1915 | 45,290 | 111,459 | -66,169 |
| 1903 | 75,227 | 40,610 | 34,617 | 1916 | 32,990 | 73,348 | -40,358 |
| 1904 | 125,567 | 38,923 | 86,644 | 1917 | 18,064 | 50,995 | -32,931 |
| 1905 | 177,117 | 42,869 | 134,248 | 1918 | 13,701 | 24,075 | -10,374 |
| 1906 | 252,336 | 60,124 | 192,212 | 1919 | 41,299 | 42,279 | -980 |
| 1907 | 209,103 | 90,190 | 118,913 | 1920 | 87,032 | 57,187 | 29,845 |
| 1908 | 255,710 | 85,412 | 170,298 | 1921 | 98,086 | 44,638 | 53,448 |
| 1909 | 231,084 | 94,644 | 136,440 | 1922 | 129,263 | 45,993 | 83,270 |
| 1910 | 289,640 | 97,854 | 191,786 | 1923 | 195,063 | 46,810 | 148,253 |
| 1911 | 225,772 | 120,709 | 105,063 | 1924 | 159,939 | 46,105 | 113,834 |
| 1912 | **323,403** | 120,260 | 203,143 | | | | |

(Net column computed here.) About 72-74% of arrivals were male in the pre-war years.
- 1925-1940 annual: not obtained - gap. bpb: 1923 (~200,000) was the post-war peak; the 1930s were low.
- Return is high: bpb says ~36% of 1881-1910 arrivals returned; Wikipedia says ~52% of 1857-1939 immigrants settled permanently. "Golondrinas" (seasonal Italian harvest workers) shuttled yearly.
- Origin: Italians ~44-45% and Spaniards ~27-31% of 1857-1940 arrivals (Wikipedia; Spanish Wikipedia gives 2.97m Italians, 2.08m Spaniards gross).

### 4b. Brazil: immigrants admitted (Ferenczi and Willcox, Brazil Tables I-II)

| Year | Arrivals | Year | Arrivals | Year | Arrivals |
|---|---|---|---|---|---|
| 1900 | 40,300 | 1909 | 90,066 | 1918 | 19,793 |
| 1901 | 85,306 | 1910 | 85,823 | 1919 | 36,027 |
| 1902 | 52,204 | 1911 | 132,456 | 1920 | 69,042 |
| 1903 | 34,062 | 1912 | 177,192 | 1921 | 58,476 |
| 1904 | 46,164 | 1913 | **189,790** | 1922 | 65,007 |
| 1905 | 70,295 | 1914 | 79,232 | 1923 | 84,849 |
| 1906 | 73,672 | 1915 | 30,333 | 1924 | 96,032 |
| 1907 | 67,787 | 1916 | 31,245 | | |
| 1908 | 83,740 | 1917 | 30,277 | | |

## 5. Australia and New Zealand assisted migration

### 5a. Australia: assisted settlers arriving (Australian Immigration Consolidated Statistics No. 13, 1982, via TAPRI)

| Year | Assisted | Year | Assisted | Year | Assisted |
|---|---|---|---|---|---|
| 1900 | 3,631 | 1914 | 20,805 | 1928 | 22,394 |
| 1901 | 1,510 | 1915 | 5,796 | 1929 | 12,943 |
| 1902 | 1,003 | 1916 | 1,397 | 1930 | 2,683 |
| 1903 | 437 | 1917 | 504 | 1931 | 275 |
| 1904 | 372 | 1918 | 426 | 1932 | 175 |
| 1905 | 545 | 1919 | 245 | 1933 | 72 |
| 1906 | 1,799 | 1920 | 9,059 | 1934 | 159 |
| 1907 | 5,097 | 1921 | 14,682 | 1935 | 100 |
| 1908 | 6,367 | 1922 | 24,258 | 1936 | 9 |
| 1909 | 9,820 | 1923 | 26,645 | 1937 | 141 |
| 1910 | 16,781 | 1924 | 25,036 | 1938 | 852 |
| 1911 | 39,796 | 1925 | 24,827 | 1939 | 2,686 |
| 1912 | **46,712** | 1926 | 31,260 | 1940 | 140 |
| 1913 | 37,445 | 1927 | 30,123 | | |

Cross-check: 1904-1913 sum here = 164,734 vs Hatton (IZA DP 16298, citing Pope) 165,050. Hatton: assisted share of total migration to Australia was 47% overall in the long run, below 30% in 1889-1906. Fares 1911-13: selected migrants to NSW, Victoria, WA typically paid GBP 12 (lower for farmers, labourers, domestics); nominated migrants' deposit ~GBP 8 (GBP 4 for Queensland); subsidy ~half the fare. Assisted migrants are a steady contract cargo for lines on the Australia run (non-British migrants mostly paid their own way).

### 5b. New Zealand (Te Ara)
- 1904-1915: 36,563 assisted immigrants (about half nominated). Net gain 1900-1915 just over 120,000; two-thirds of immigrants from the UK, one-third from Australia. Trans-Tasman fare GBP 2.
- 1916-1919: net migration gain under 3,000.
- 1921-1927: assisted UK migrants were over half of all long-term immigrants.
- 1931-1935: net loss of ~10,000; in 1935 exactly one assisted migrant.

### 5c. Imperial schemes (UK-funded)
- 1919-1922 ex-servicemen free passages: over 86,000 (Canada 26,560; Australia 34,750; NZ 12,890; South Africa 5,890; other ~3,000) (Exodus 2013 site).
- Empire Settlement Act 1922 to ~1930s: ~212,000 to Australia, ~130,000 to Canada (Exodus 2013); Pier 21 gives ~165,000 British to Canada under settlement programmes, ending effectively in 1930. Figures differ by definition - approximate.
- Of 8,000+ British miners recruited to Canada (1928 harvest scheme era), 75% returned (Pier 21).

## 6. UK outward emigration (British subjects) by destination

Source: Ferenczi and Willcox (NBER 1929), British Isles Table VII, "emigrant citizens (British nationality) to extra-European countries" from Board of Trade passenger returns. Rows sum exactly to the totals. These are outward passengers of British nationality (mostly steerage emigrants); from 1912 the Board of Trade also published a narrower "emigrants" (intending permanent residence) series, which is lower - use these as passenger volume.

| Year | USA | British N. America | Australia & NZ | South Africa | Other | Total |
|---|---|---|---|---|---|---|
| 1900 | 102,797 | 18,443 | 14,922 | 20,815 | 11,848 | 168,825 |
| 1905 | 122,370 | 82,437 | 15,139 | 26,307 | 15,824 | 262,077 |
| 1907 | 170,264 | 151,216 | 24,767 | 20,925 | 28,508 | 395,680 |
| 1910 | 132,192 | 156,990 | 45,701 | 27,297 | 35,668 | 397,848 |
| 1912 | 117,310 | 186,147 | 96,800 | 28,216 | 39,193 | 467,666 |
| 1913 | 129,169 | **196,278** | 77,934 | 25,855 | 40,404 | **469,640** |
| 1914 | 92,808 | 94,482 | 48,013 | 21,124 | 36,777 | 293,204 |
| 1919 | 32,765 | 89,102 | 17,757 | 7,761 | 32,847 | 180,232 |
| 1920 | 90,811 | 134,079 | 49,357 | 29,019 | 49,545 | 352,811 |
| 1921 | 67,499 | 84,145 | 46,073 | 28,138 | 42,404 | 268,259 |
| 1923 | 101,063 | 121,941 | 55,156 | 18,938 | 40,469 | 337,567 |
| 1924 | 39,057 | 99,717 | 58,500 | 22,452 | 43,754 | 263,480 |

Key shift: Canada overtook the US as the main British destination from about 1910; Australasia peaked 1912. After 1924 the US quota and then the Depression cut British flows; the 1930s saw net inward movement to Britain (returnees) - annual 1925-1938 figures NOT obtained (gap).

Decade totals, intercontinental emigration (thousands; Woodruff 1966 via Encyclopedia.com; some rows look misaligned [check]):

| Origin | 1901-10 | 1911-20 | 1921-30 | 1931-40 |
|---|---|---|---|---|
| British Isles | 3,150 | 2,587 | 2,151 | 262 |
| Italy | 3,615 | 2,194 | 1,370 | 235 |
| Spain | 1,091 | 1,306 | 560 | 132 |
| Portugal | 324 | 402 | 995 | 108 |
| Germany | 274 | 91 | 564 | 121 |
| Austria-Hungary [check] | 1,111 | 418 | 61 | 11 |
| Russia | 911 | 420 | 80 | n/a |
| Poland | n/a | n/a | 634 | 164 |
| Sweden | 224 | 86 | 107 | 8 |
| Norway | 191 | 62 | 87 | 6 |

Long-run: 1853-1913 British outflow 12.9 million (10.1m after 1870); 1871-1913 cumulative net outflow 5.9m = 13.1% of 1913 UK population; nearly half of emigrants to Australia/NZ were assisted (Hatton, ANU WP 2019-07).

## 7. Rules that affected lines

US head tax per alien passenger (paid by the carrier, recovered in the fare):
| From | Amount | Source |
|---|---|---|
| 1882 | $0.50 | 1882 Act (SUNY Ulster, GG Archives, 1930 CG report) |
| 1894 | $1.00 | commonly cited, NOT verified in an opened source |
| 1903 | $2.00 | GG Archives |
| 1907 | $4.00 | 1907 Act (SUNY Ulster, GG Archives) |
| 1917 | $8.00 | Immigration Act 1917 (Wikipedia, CBP) |
From 1924 an immigrant also needed a US consular visa (fee not captured - gap).

Rejections and carrier liability:
- Ellis Island exclusions ~2% of arrivals over its life (Statue of Liberty-Ellis Island Foundation; Duke migration memorials). FY1914: 33,041 debarred = 2.3% of 1,436,122 applicants (Commissioner-General 1914). FY1930: 8,233 denied admission.
- Excluded immigrants were "sent back at the steamship company's expense" (Duke).
- Section 9 fines for bringing aliens with excludable diseases or defects: FY1914, 366 cases, $36,600 collected (= $100 per case) (CG 1914).
- 1917 Act: literacy test (read 30-40 words in own language); pre-inspection and more rigorous medical exams at the port of departure (USCIS).
- 1918: passports required by presidential proclamation (USCIS).

European-side controls:
- Germany: control stations on the Prussian-Russian border from 1894 (bathing, disinfection, screening against US rules, "smaller Ellis Islands"); Leipzig registration station 1904; Russian transmigrants routed via Berlin for disinfection (Botstiber Institute). The lines (HAPAG, NDL) ran these to avoid return-passage costs.
- Hamburg: HAPAG emigrant halls on Veddel ("BallinStadt"), originally built 1901, named for HAPAG director Albert Ballin; ~5 million emigrants passed through Hamburg 1850s to early 1930s; demolished 1934 (Wikipedia). Capacity figures not verified - gap.
- Italy: Law no. 23 of 31 Jan 1901 created the Commissariato Generale dell'Emigrazione; abolished shipping agents in favour of licensed "carrier representatives" needing an annual "patente di vettore"; inspection commissions at Genoa, Naples, Palermo; travelling commissioners and military doctors aboard emigrant ships; an Emigration Fund financed from carriers and emigrants; provincial arbitration commissions for emigrant-carrier disputes (Mare Nostrum Rapallo; Museo Emigrazione Italiana). Bond and per-emigrant fee amounts not captured - gap.

## Reliability note
- US annual totals (1a) are official and cross-checked against three sources: high confidence. Decade by-country (1b) is official DHS: high. Single-year by-country figures are a gap.
- US departures (2b): Willcox Table 16, arithmetic verified; 1919 net slightly inconsistent. "Aliens departed" includes temporary visitors; permanent "emigrant aliens" are lower (e.g. 1930: 50,661 of 272,425).
- Canada: two series with different year bases (fiscal pre-1913, calendar after); do not splice without noting the 1907 nine-month period. 1914 figures differ between year books.
- Argentina/Brazil to 1924: from the standard Ferenczi-Willcox compilation: good. Argentina 1925-40: gap.
- UK Table VII: internally consistent (rows sum), but it is British-nationality outward passengers, not strictly permanent emigrants.
- Woodruff decade table: extraction partly suspect for smaller countries; British Isles and Italy rows match widely cited values.
- All US figures are fiscal years ending 30 June.

## Sources (opened)
- River City (WUSD) PDF, "US Census Immigration Figures 1820-2010" / INS Table 1 FY1820-1998: https://rivercity.wusd.k12.ca.us/subsites/Gerald-OConnor/documents/US-History/Unit-3-World-Power/298298892925735045.pdf
- DHS OHSS Yearbook 2020, Table 2 (LPR by country of last residence 1820-2020): https://ohss.dhs.gov/topics/immigration/yearbook/2020/table2
- Willcox, "Immigration into the United States" (NBER, International Migrations vol. 2, 1931): https://www.nber.org/system/files/chapters/c5104/c5104.pdf
- Ferenczi and Willcox, "Statistics of Migrations, National Tables, Argentina, Brazil..." (NBER 1929): https://www.nber.org/system/files/chapters/c5136/c5136.pdf
- Ferenczi and Willcox, "Statistics of Migrations, National Tables, British Isles" (NBER 1929): https://www.nber.org/system/files/chapters/c5138/c5138.pdf
- Ferenczi and Willcox, "Statistics of Migrations, National Tables, United States" (NBER 1929; opened, OCR unusable): https://www.nber.org/system/files/chapters/c5134/c5134.pdf
- EH.net, "Immigration to the United States": https://eh.net/encyclopedia/immigration-to-the-united-states/
- Spartacus Educational, "Immigration to the USA: 1900-1920": https://spartacus-educational.com/USAE1900.htm
- Cato Institute, "A Brief History of U.S. Immigration Policy": https://www.cato.org/policy-analysis/brief-history-us-immigration-policy-colonial-period-present-day
- Annual Report of the Commissioner-General of Immigration, FY1914 (archive.org): https://archive.org/stream/annualreportofco1914unit/annualreportofco1914unit_djvu.txt
- Annual Report of the Commissioner-General of Immigration, FY1930 (archive.org): https://archive.org/stream/annualreportofco1930unit/annualreportofco1930unit_djvu.txt
- Statue of Liberty-Ellis Island Foundation, "Overview + History": https://www.statueofliberty.org/ellis-island/overview-history/
- NPS, "Fact Sheet: Ellis Island": https://www.nps.gov/npnh/learn/news/fact-sheet-elis.htm
- Duke Migration Memorials, "Immigrant Processing in New York": https://migrationmemorials.trinity.duke.edu/items/immigrant-processing-new-york.html
- History.com, "Ellis Island": https://www.history.com/topics/immigration/ellis-island
- Ancestry, "Major U.S. ports" PDF: https://www.ancestrycdn.com/support/us/2016/11/majorusports.pdf
- GlobalSecurity, "Immigration - early": https://www.globalsecurity.org/military/world/usa/immigration-early.htm
- SUNY Ulster, "Summary of Immigration Laws 1875-1918": https://people.sunyulster.edu/voughth/immlaws1875_1918.htm
- GG Archives, "Summary of United States Immigration Laws": https://www.ggarchives.com/IMM/LawsAndActs/SummaryOfImmigrationLaws.html
- USCIS, "Mass Immigration and WWI": https://www.uscis.gov/about-us/our-history/explore-agency-history/overview-of-agency-history/mass-immigration-and-wwi
- Wikipedia, "Immigration Act of 1917": https://en.wikipedia.org/wiki/Immigration_Act_of_1917
- CBP, "Immigration Controls 1917-1924": https://www.cbp.gov/about/history/timeline/timeline-date/immigration-controls-1917-1924
- Wikipedia, "Emergency Quota Act": https://en.wikipedia.org/wiki/Emergency_Quota_Act
- Wikipedia, "Immigration Act of 1924": https://en.wikipedia.org/wiki/Immigration_Act_of_1924
- USHMM, "Immigration to the United States 1933-41": https://encyclopedia.ushmm.org/content/en/article/immigration-to-the-united-states-1933-41
- Genealogy.com, "Immigrants Who Returned Home": https://www.genealogy.com/articles/research/96_donna.html
- Stanford Report, "Returning home during Age of Mass Migration": https://news.stanford.edu/stories/2017/09/returning-home-age-mass-migration
- Canada Year Book 1922-23, p. 208 (Table 65): https://www66.statcan.gc.ca/eng/1922-23/192202480208_p.%20208.pdf
- Canada Year Book 1963-64, p. 208 (immigrant arrivals): https://www66.statcan.gc.ca/fra/1963-64/196302300208_p.%20208.pdf
- Canada Year Book 1912, Immigration: https://www66.statcan.gc.ca/eng/1912/191200640040_Immigration.pdf
- Canada Year Book 1914, Immigration: https://www66.statcan.gc.ca/eng/1914/191401150084_Immigration.pdf
- Pier 21, "Borders, Groups, Statistics": https://pier21.ca/blog/jan-raska-phd/borders-groups-statistics-researching-immigrant-arrival-at-pier-21
- Pier 21, "Empire Settlement Act, 1922": https://pier21.ca/research/immigration-history/empire-settlement-act-1922
- Wikipedia, "Annual immigration statistics of Canada": https://en.wikipedia.org/wiki/Annual_immigration_statistics_of_Canada
- OpenText BC, "Immigrants by the Numbers": https://opentextbc.ca/postconfederation/chapter/5-3-immigrants-by-the-numbers/
- bpb, "Argentina: Historical Developments of Immigration and Emigration": https://www.bpb.de/themen/migration-integration/regionalprofile/english-version-country-profiles/203942/historical-developments-of-immigration-and-emigration/
- Wikipedia, "Immigration to Argentina": https://en.wikipedia.org/wiki/Immigration_to_Argentina
- Wikipedia (es), "Gran inmigración europea en Argentina": https://es.wikipedia.org/wiki/Gran_inmigraci%C3%B3n_europea_en_Argentina
- SciELO, "Análisis histórico-demográfico de la inmigración en la Argentina": https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S1405-74252016000300201
- TAPRI, "Migration to Australia": https://tapri.org.au/wp-content/uploads/2019/04/Migration-to-Australia-finalV3.pdf
- Hatton, "The Political Economy of Assisted Immigration" (IZA DP 16298): https://docs.iza.org/dp16298.pdf
- Hatton, "Emigration from the UK 1870-1913: Quantity and Quality" (ANU WP): https://cbe.anu.edu.au/researchpapers/CEH/WP201907.pdf
- Te Ara, "History of immigration" (print view): https://teara.govt.nz/en/history-of-immigration/print
- Te Ara, "Migration: 1900 to 1914": https://teara.govt.nz/en/history-of-immigration/page-11
- Exodus 2013, "Empire Settlement Schemes after WWI": https://www.exodus2013.co.uk/empire-settlement-schemes-after-wwi/
- Encyclopedia.com, "Population: Emigration and Immigration" (Woodruff table): https://www.encyclopedia.com/history/news-wires-white-papers-and-books/population-emigration-and-immigration
- NIESR, "How did we get here?": https://niesr.ac.uk/blog/how-did-we-get-here
- Wikipedia, "BallinStadt": https://en.wikipedia.org/wiki/BallinStadt
- Botstiber Institute, "Emigration Routes from Austria-Hungary: Germany Part II": https://botstiberbiaas.org/germany-part-ii/
- Mare Nostrum Rapallo, "Le navi degli emigranti": https://www.marenostrumrapallo.it/emig/
- Museo Nazionale Emigrazione Italiana, "For the emigrant": https://www.museoemigrazioneitaliana.org/en/dallitalia-in-the-world/for-lemigrant/
