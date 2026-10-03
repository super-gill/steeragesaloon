#!/usr/bin/env node
/* Steerage & Saloon lint (0.35.5): finds code hidden inside a // comment. The game's lines are long and dense, and a
   comment added in the middle of one silently swallows the code after it (twice in 0.35.4 alone: the strikes and the
   1912 disaster stopped running). Flags any // comment that is followed, on the same line, by something that looks
   like code: a call, an assignment, a keyword, or closing braces.
   Usage:  node tools/lint.js   (exit code 1 when anything is found) */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js');
let n = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && x !== 'chart-data.js')) {
  fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
    // find the first // that is outside a string, template or regex literal (a rough scan, good enough for this code)
    let q = null, k = -1;
    for (let j = 0; j < line.length - 1; j++) {
      const ch = line[j];
      if (q) { if (ch === '\\') { j++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
      if (ch === '/' && line[j + 1] === '*') { const e = line.indexOf('*/', j + 2); if (e < 0) break; j = e + 1; continue; }
      if (ch === '/' && line[j + 1] === '/') { if (line[j - 1] === ':') continue; k = j; break; }
      if (ch === '/' && /[=(,:!&|?{};]\s*$/.test(line.slice(0, j))) { // a regex literal
        for (j++; j < line.length && line[j] !== '/'; j++) if (line[j] === '\\') j++; continue; }
    }
    if (k < 0 || q) return;
    const c = line.slice(k + 2);
    if (/\)\s*;?\s*(const|let|var|if|for|return|else)\b|[;)]\s*[A-Za-z_$][\w$.]*\s*(\(|=[^=])|\}\s*\}\s*$|\)\s*;\s*\}\s*$/.test(c)) {
      n++; console.log(`${f}:${i + 1}: //${c.slice(0, 140)}`);
    }
  });
}
// the loader names the same version as the game, and loads every script in js/ (0.38.0)
{const boot = fs.readFileSync(path.join(__dirname, '..', 'js', 'boot.js'), 'utf8'), data = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
 const bv = (boot.match(/BOOT_VER='([^']+)'/) || [])[1], gv = (data.match(/GAME_VERSION='([^']+)'/) || [])[1];
 if (bv !== gv) { n++; console.log(`js/boot.js: BOOT_VER ${bv} does not match GAME_VERSION ${gv}`); }
 const listed = (boot.match(/BOOT_FILES=\[([^\]]*)\]/) || ['', ''])[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
 for (const f of fs.readdirSync(path.join(__dirname, '..', 'js'))) { const k = f.replace(/\.js$/, ''); if (f.endsWith('.js') && k !== 'boot' && !listed.includes(k)) { n++; console.log(`js/${f} is not loaded by js/boot.js`); } }}
console.log(n ? `${n} problem(s): code hidden in a comment, or the loader out of step` : 'clean');
process.exit(n ? 1 : 0);
