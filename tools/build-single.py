"""Bundle index.html, css and js into one self-contained HTML file (for the claude.ai artifact).
Usage: python tools/build-single.py [output path]   default: dist/steerage-saloon.html
Since 0.38.0 the page loads its files through js/boot.js (see there); the bundle inlines the style sheet in place of the
loader and every file named in BOOT_FILES, in order, in place of the bootScripts() call."""
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()
html = rd('index.html')
boot = rd('js/boot.js')
files = re.findall(r"'([a-z0-9-]+)'", re.search(r'BOOT_FILES=\[([^\]]*)\]', boot).group(1))
ver = re.search(r"BOOT_VER='([^']+)'", boot).group(1)
gv = re.search(r"GAME_VERSION='([^']+)'", rd('js/data.js')).group(1)
if ver != gv: sys.exit('js/boot.js BOOT_VER %s does not match GAME_VERSION %s' % (ver, gv))
loader = re.search(r'<script>document\.write\(\'<script src="js/boot\.js[^\n]*</script>', html)
if not loader: sys.exit('no loader in index.html')
html = html.replace(loader.group(0), '<style>\n' + rd('css/style.css') + '</style>')
inl = ''.join('<script>\n' + rd('js/%s.js' % f) + '</script>\n' for f in files)
html = html.replace('<script>bootScripts();</script>\n', inl)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'dist', 'steerage-saloon.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, len(html), 'bytes,', len(files), 'scripts, version', ver)
