#!/usr/bin/env node
/* Steerage & Saloon headless play (0.35.3): a game played a few months at a time from the command line, for test
   players (people or programs) who want to play the real game through its own functions without the screen.

   The game is saved to tools/play/<slot>.json between calls, exactly as the browser saves it, and loaded as the
   browser loads it, so every step is also a save-and-reload test.

   Usage:
     node tools/play.js new  <slot> [seed]              a new game in January 1900
     node tools/play.js step <slot> [actions] [months]  do the actions, play on (default 3 months), report
     node tools/play.js look <slot> <view> [arg]        look without changing anything (nothing is saved)
     node tools/play.js do   <slot> [actions]           do the actions and report, without playing on

   Actions are a JSON array (or @file holding one) of [name, ...args], for example
     [["move",3,"liv"],["fares","liv",30,12,6],["borrow",20000]]
   Run `node tools/play.js look <slot> help` for every action and view. Only the player's own controls are offered:
   nothing here does what a player could not do on the screen. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), DIR = path.join(__dirname, 'play');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice', 'design']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const [cmd, slot, a3, a4, a5] = process.argv.slice(2);
if (!cmd || !slot) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
fs.mkdirSync(DIR, { recursive: true });
const file = path.join(DIR, slot + '.json');
const meta = path.join(DIR, slot + '.meta.json');
const M = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : { seed: 1, steps: 0 };

const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} }, document: undefined };
vm.createContext(ctx);
const seed = cmd === 'new' ? (+a3 || 1) : M.seed;
// the dice: seeded from the game's seed and the step, so a replay of the same actions plays the same
vm.runInContext(`Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(${seed * 7919 + 13 + M.steps * 104729});`, ctx);
for (const f of FILES) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const run = s => vm.runInContext(s, ctx);
run(fs.readFileSync(path.join(__dirname, 'play-lib.js'), 'utf8'));

const readActions = s => { if (!s || s === '-') return []; const t = s.startsWith('@') ? fs.readFileSync(s.slice(1), 'utf8') : s; const v = JSON.parse(t); return Array.isArray(v[0]) || v.length === 0 ? v : [v]; };
const save = () => { fs.writeFileSync(file, run('JSON.stringify(S)')); fs.writeFileSync(meta, JSON.stringify(M)); };
const load = () => { if (!fs.existsSync(file)) { console.log('No game in slot ' + slot + '. Start one with: node tools/play.js new ' + slot); process.exit(1); } ctx.__SAVE = fs.readFileSync(file, 'utf8'); run('PL.load(__SAVE)'); };

if (cmd === 'new') { M.seed = seed; M.steps = 0; run('PL.fresh()'); save(); console.log(run('PL.report(true)')); }
else if (cmd === 'look') { load(); console.log(run(`PL.look(${JSON.stringify(a3 || 'help')},${JSON.stringify(a4 === undefined ? null : a4)},${JSON.stringify(a5 === undefined ? null : a5)})`)); }
else if (cmd === 'do' || cmd === 'step') {
  load(); ctx.__ACT = readActions(a3); const months = cmd === 'step' ? (a4 === undefined || a4 === '' ? 3 : Math.max(0, Math.min(12, Math.floor(+a4) || 0))) : 0; // step <slot> <actions> 0 plays no months (0.39.3: it played three)
  console.log(run('PL.act(__ACT)'));
  if (months) { console.log(run(`PL.play(${months})`)); M.steps++; }
  save(); console.log(run('PL.report(false)'));
}
else console.log('Unknown command ' + cmd);
