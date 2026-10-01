#!/usr/bin/env node
/* Steerage & Saloon frame-time check (0.36.0). Opens a bundled build in headless Chromium, gives the Line a fleet of the
   chosen size, runs the clock at top speed for six seconds on each main tab and prints frames a second and the slowest
   frames. Emergencies are kept from slowing the clock so the run measures the screen, not the story.
   Needs Playwright with its Chromium (npm i -g playwright). A container without a GPU paints on the processor, so the
   numbers are a floor: a desktop with a graphics card does better.
   Usage:  python3 tools/build-single.py /tmp/ss.html && node tools/perf.mjs /tmp/ss.html [ships]   (default 70) */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT || 'playwright'); }
const { chromium } = pw;
const FILE = process.argv[2], N = +process.argv[3] || 70;
if (!FILE) { console.log('usage: node tools/perf.mjs <bundled html> [ships]'); process.exit(1); }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 950 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + FILE); await p.waitForTimeout(800);
await p.evaluate((N) => {
  if (!S || !S.ships) newGame(); UI.liv = null; UI.speed = 0; const lines = ['liv', 'exp', 'lha', 'hal', 'nap', 'gny'];
  for (const k of lines) S.lines[k] = S.lines[k] || { fares: defaultFares(k), service: 1, adv: 1, last: [null, null] };
  while (S.ships.length < N) { refreshMarket(); const m = S.market.shift(); if (!m) break; delete m.price; m.line = lines[S.ships.length % 6]; if (m.state === 'laid') { m.state = 'port'; m.portLeft = 1; } S.ships.push(m); }
  S.cash = 1e8; UI.autoPause = false;
}, N);
const rows = {};
for (const tab of ['overview', 'fleet', 'lines', 'finance']) {
  rows[tab] = await p.evaluate(async (tab) => {
    UI.tab = tab; UI.dirty = true; const t0 = S.t; const fr = []; let last = performance.now();
    await new Promise(res => { const start = performance.now(); const f = (t) => { UI.slow = null; emClock = () => null; UI.speed = SPEEDS.length - 1; if (S.dis) S.dis.show = false; if (S.war) S.war.show = false; fr.push(t - last); last = t; if (t - start < 6000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    UI.speed = 0; fr.shift(); const ds = fr.slice().sort((a, b) => a - b), q = k => ds[Math.floor(k * (ds.length - 1))];
    return { fps: Math.round(fr.length / 6), p50: Math.round(q(.5)), p95: Math.round(q(.95)), slowest: Math.round(q(1)), over100: fr.filter(x => x > 100).length, 'game days/s': +((S.t - t0) / 6).toFixed(1) };
  }, tab);
}
console.log(`${N} ships`); console.table(rows); if (errs.length) console.log('page errors', errs); await b.close();
