/* ================= LEDGER ================= */
const CATS=[['fares','Passenger fares'],['onboard','Bars, shops and shows'],['cargo','Cargo freight'],['mail','Mail'],['fuel','Coal and oil'],['crew','Crew and provisions'],
  ['port','Ports, agents, handling'],['upkeep','Maintenance and insurance'],['adv','Advertising'],['yard','Yard and repairs'],['shore','Shore establishment'],['office','Head office'],['interest','Interest'],['invest','Government stock'],['tax','Taxes'],['crash','Bank failure'],['legal','Courts, fines and claims'],['salvage','Salvage and towage'],['refund','Fares refunded'],['safety','Safety and training']];
const blankLedger=()=>({cat:{},lines:{}});
function book(cat,amt,key,sh){S.cash+=amt;S.mtd.cat[cat]=(S.mtd.cat[cat]||0)+amt;const k=key||'_office';S.mtd.lines[k]=(S.mtd.lines[k]||0)+amt;
  if(sh){const q=S.mtd.ships||(S.mtd.ships={}),o=q[sh.id]||(q[sh.id]={});o[cat]=(o[cat]||0)+amt;}} // each ship's own account, before head office
