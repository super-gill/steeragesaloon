"""Bundle index.html, css and js into one self-contained HTML file (for the claude.ai artifact).
Usage: python tools/build-single.py [output path]   default: dist/steerage-saloon.html"""
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
html = re.sub(r'<link rel="stylesheet" href="(css/[^"?]+)(?:\?[^"]*)?">',
              lambda m: '<style>\n' + open(os.path.join(root, m.group(1)), encoding='utf-8').read() + '</style>', html)
html = re.sub(r'<script src="(js/[^"?]+)(?:\?[^"]*)?"></script>\n?',
              lambda m: '<script>\n' + open(os.path.join(root, m.group(1)), encoding='utf-8').read() + '</script>\n', html)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'dist', 'steerage-saloon.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, len(html), 'bytes')
