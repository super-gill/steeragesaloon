/* ================= LEDGER ================= */
const CATS=[['fares','Passenger fares'],['cargo','Cargo freight'],['mail','Mail'],['fuel','Coal and oil'],['crew','Crew and provisions'],
  ['port','Ports, agents, handling'],['upkeep','Maintenance and insurance'],['adv','Advertising'],['yard','Yard and repairs'],['shore','Shore establishment'],['office','Head office'],['interest','Interest']];
const blankLedger=()=>({cat:{},lines:{}});
function book(cat,amt,key){S.cash+=amt;S.mtd.cat[cat]=(S.mtd.cat[cat]||0)+amt;const k=key||'_office';S.mtd.lines[k]=(S.mtd.lines[k]||0)+amt;}
