#!/usr/bin/env node
/* Steerage & Saloon fingerprint (#4): proves a change plays exactly as another commit did.
   Plays the same fixed games on this checkout (with any uncommitted edits) and on the given commit side by side, and
   compares a hash of the save at the start of every month. Says IDENTICAL, or names for each game the first month that
   differs and which parts of the save differ there.
   Usage:
     npm run fingerprint -- <commit>            1900 to the end of 1922, 6 owners x 3 seeds
     npm run fingerprint -- <commit> --full     on to the end of 1945
     npm run fingerprint -- <commit> --quick    one seed per owner, for a quick look while working
     npm run fingerprint -- <commit> --seeds 5  more seeds per owner
   Exit code 0 when identical, 1 when different, 2 when it could not run.

   How it works: the commit's js/ and tools/harness.js are copied out of git into a temporary folder. Each side loads its
   own rule scripts (the list in its own harness), so a refactor that splits or renames a file still compares; the
   scripted owners and the dice come from this checkout and are the same on both sides. Each game runs in a process of
   its own, as many at once as the machine has cores. The hash covers the save exactly as the browser stores it
   (JSON.stringify(S)), one hash per part of the save, so a difference names the parts that moved. What is not in the
   save (the advice on screen, the screen itself) is not covered. */
const fs = require('fs'),
  os = require('os'),
  path = require('path'),
  vm = require('vm'),
  crypto = require('crypto'),
  { execFileSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
// the harness's scripted owners, slowest first (advisor and keen read the advice each month) so the cores finish
// together; most of them can go bust, so 'kept' (below) makes sure every seed plays to the last year
const OWNERS = ['advisor', 'keen', 'kept', 'office', 'careful', 'expander', 'undercutter'];
/* the careful owner with a benefactor who keeps the Line in cash, as tools/companies.js does: never bankrupt, so the
   later years are always covered. Defined here, not in the harness, so the harness's own numbers do not change */
const KEPT = 'STRATS.kept = function () { if (S.cash < 20000) S.cash = 20000; STRATS.careful(); };';
const START_YEAR = 1900;

/* ---------- one side: play the games and print their hashes (run as a child process) ---------- */

/* the rule scripts a tree loads: the names in its own tools/harness.js FILES list */
function simFiles(root) {
  const src = fs.readFileSync(path.join(root, 'tools', 'harness.js'), 'utf8');
  const list = src.match(/const FILES = \[([\s\S]*?)\]/);
  if (!list) throw new Error('no FILES list in ' + path.join(root, 'tools', 'harness.js'));
  return [...list[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const shortHash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);

/* one hash per part of the save, in the order the save holds them */
function hashSave(S) {
  const parts = {};
  for (const key of Object.keys(S)) {
    const json = JSON.stringify(S[key]);
    if (json !== undefined) parts[key] = shortHash(json);
  }
  return parts;
}

function playGame(owner, seed, simRoot, endYear) {
  const { sources, loadGame } = require('./harness.js');
  const ctx = loadGame(seed, sources(simRoot, simFiles(simRoot)));
  const months = [];
  let failed = null,
    game;
  try {
    // the game's names are top-level consts, so they are reached through this window rather than as ctx properties
    vm.runInContext(KEPT, ctx);
    game = vm.runInContext('({ get S() { return S; }, owner: (o) => STRATS[o](), advance, monthName })', ctx);
    vm.runInContext('newGame();UI.autoPause=false;UI.speed=1;UI.rev=0;', ctx);
    // the harness's game loop: each new month, hash the save, then the owner acts; then a day passes
    const days = (endYear - START_YEAR) * 365.25;
    let lastMonth = -1;
    while (!game.S.over && game.S.t - game.S.t0 < days) {
      if (game.S.m !== lastMonth) {
        lastMonth = game.S.m;
        months.push({ m: game.monthName(game.S.m), parts: hashSave(game.S) });
        game.owner(owner);
      }
      game.advance(1);
    }
    months.push({ m: 'the end (' + (game.S.over || 'still trading') + ')', parts: hashSave(game.S) });
  } catch (e) {
    // the message and the line of the game it came from
    const lines = String((e && e.stack) || e).split('\n');
    const where = lines.find((l) => l.includes(path.sep + 'js' + path.sep));
    failed = {
      at: months.length ? months[months.length - 1].m : 'the start',
      error: lines[0] + (where ? ' (' + where.trim().replace(/^at /, '') + ')' : ''),
    };
  }
  return { owner, seed, months, failed };
}

function runSide(simRoot, endYear, owner, seed) {
  process.stdout.write(JSON.stringify(playGame(owner, +seed, simRoot, endYear)));
}

/* ---------- the comparison (the command Jason runs) ---------- */

const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function stop(message) {
  console.error('fingerprint: ' + message);
  process.exit(2);
}

/* copy the commit's js/ and tools/harness.js out of git into a temporary folder */
function extract(sha) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-fingerprint-'));
  const tar = path.join(dir, 'tree.tar');
  execFileSync('git', ['archive', '--output', tar, sha, 'js', 'tools/harness.js'], { cwd: ROOT });
  execFileSync('tar', ['-xf', tar, '-C', dir]);
  fs.unlinkSync(tar);
  return dir;
}

/* play one game on one side in its own process; resolves to the game */
function playElsewhere(simRoot, endYear, owner, seed) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, TZ: 'UTC' };
    for (const k of ['PATCH', 'PROT', 'MKT', 'FLOAT', 'FLDIV', 'END', 'DEBUG']) delete env[k]; // a fixed world on both sides
    const child = spawn(process.execPath, [__filename, '--side', simRoot, String(endYear), owner, String(seed)], {
      env,
    });
    let out = '',
      err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) =>
      code === 0
        ? resolve(JSON.parse(out))
        : reject(new Error(`${owner} seed ${seed} would not run (${simRoot}):\n${err}`)),
    );
  });
}

/* play every game on both sides, as many at once as the machine has cores; the slow owners go first */
async function playAll(roots, endYear, seeds) {
  const jobs = [];
  for (const owner of OWNERS)
    for (let seed = 1; seed <= seeds; seed++) for (const root of roots) jobs.push({ root, owner, seed });
  const results = roots.map(() => ({}));
  const workers = Math.max(2, (os.availableParallelism ? os.availableParallelism() : os.cpus().length) || 2);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      results[roots.indexOf(j.root)][j.owner + ' seed ' + j.seed] = await playElsewhere(
        j.root,
        endYear,
        j.owner,
        j.seed,
      );
    }
  }
  await Promise.all(Array.from({ length: workers }, worker));
  return results;
}

/* the first month where two runs of one game differ, and the parts of the save that differ there */
function firstDifference(a, b) {
  const n = Math.max(a.months.length, b.months.length);
  for (let i = 0; i < n; i++) {
    const x = a.months[i],
      y = b.months[i];
    if (!x || !y) return { m: (x || y).m, parts: ['the game ends at a different time'] };
    const keys = [...new Set([...Object.keys(x.parts), ...Object.keys(y.parts)])];
    const differ = keys.filter((k) => x.parts[k] !== y.parts[k]);
    if (differ.length || x.m !== y.m) return { m: x.m, parts: differ.length ? differ : ['the date'] };
  }
  return null;
}

async function compare(ref, opts) {
  let sha;
  try {
    sha = git('rev-parse', '--verify', '--quiet', ref + '^{commit}');
  } catch (e) {
    stop(`no commit "${ref}" here. If this is a shallow clone, fetch it first: git fetch --depth=50 origin main`);
  }
  const subject = git('log', '-1', '--format=%h %s', sha);
  const edits = git('status', '--porcelain', '--', 'js', 'tools/harness.js').split('\n').filter(Boolean).length;
  const endYear = opts.full ? 1946 : 1923;
  const games = OWNERS.length * opts.seeds;
  console.log(
    `Fingerprint: this checkout${edits ? ` (with ${edits} uncommitted file${edits > 1 ? 's' : ''} in js/ or the harness)` : ''}`,
  );
  console.log(`  against ${subject}`);
  console.log(
    `  ${games} games (${OWNERS.join(', ')}; seeds 1 to ${opts.seeds}), January ${START_YEAR} to the end of ${endYear - 1}`,
  );

  const t0 = Date.now();
  const dir = extract(sha);
  let here, there, failure;
  try {
    [here, there] = await playAll([ROOT, dir], endYear, opts.seeds);
  } catch (e) {
    failure = e.message;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  if (failure) stop(failure);
  const secs = ((Date.now() - t0) / 1000).toFixed(0);

  const rows = [];
  let checks = 0,
    trading = 0;
  for (const name of Object.keys(here)) {
    const a = here[name],
      b = there[name];
    if (a.failed || b.failed) {
      const which = a.failed && b.failed ? 'both sides' : a.failed ? 'this checkout' : sha.slice(0, 7);
      const f = a.failed || b.failed;
      rows.push({ name, m: f.at, note: `${which} stopped with an error: ${f.error}` });
      continue;
    }
    checks += a.months.length;
    if (a.months[a.months.length - 1].m.includes('still trading')) trading++;
    const d = firstDifference(a, b);
    if (d) rows.push({ name, m: d.m, note: 'in ' + d.parts.join(', ') });
  }

  if (!rows.length) {
    console.log(
      `\nIDENTICAL: all ${games} games matched at every one of ${checks.toLocaleString('en-GB')} monthly checks (${secs}s)`,
    );
    // how far the games reached: a change to the later years is only tested by the games still trading then
    console.log(
      `  ${trading} of ${games} games still trading at the end of ${endYear - 1}; the rest went under earlier`,
    );
    return 0;
  }
  console.log(`\nDIFFERENT in ${rows.length} of ${games} games (${secs}s). First difference in each:`);
  const w = Math.max(...rows.map((r) => r.name.length));
  for (const r of rows) console.log(`  ${r.name.padEnd(w)}  ${r.m.padEnd(14)}  ${r.note}`);
  return 1;
}

/* ---------- command line ---------- */

const args = process.argv.slice(2);
if (args[0] === '--side') {
  runSide(args[1], +args[2], args[3], args[4]);
} else {
  const ref = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
  const seedsAt = args.indexOf('--seeds');
  const seeds = seedsAt >= 0 ? +args[seedsAt + 1] || 3 : args.includes('--quick') ? 1 : 3;
  const opts = { full: args.includes('--full'), seeds };
  if (!ref) stop('name a commit to compare with, e.g. npm run fingerprint -- HEAD~1');
  compare(ref, opts).then((code) => process.exit(code));
}
