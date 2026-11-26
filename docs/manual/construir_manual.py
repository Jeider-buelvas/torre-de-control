#!/usr/bin/env python3
"""Arma el manual publicado (privado/manual.html) desde docs/manual/manual_fuente.html.
Mete todas las capturas dentro del HTML (WebP en base64), así el manual no depende de ver.php
ni de subir la carpeta img/ completa. El PDF sigue saliendo por ver.php.
Uso: python3 docs/manual/construir_manual.py   (desde la raíz del repositorio)
IMPORTANTE: los cambios de texto se hacen en manual_fuente.html, no en privado/manual.html
(este se reescribe completo al construir)."""
import base64, io, re, os
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FUENTE = os.path.join(RAIZ, 'docs/manual/manual_fuente.html')
PRIV = os.path.join(RAIZ, 'web/torre_de_control_v2/manual_torre_control/privado')
s = open(FUENTE, encoding='utf-8').read()
cache = {}
def datos(f):
    if f in cache: return cache[f]
    im = Image.open(os.path.join(PRIV, 'img', f))
    b = io.BytesIO()
    if f.endswith('.png'):
        im.save(b, 'PNG', optimize=True); uri = 'data:image/png;base64,'
    else:
        im = im.convert('RGB')
        if im.width > 1600: im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(b, 'WEBP', quality=80, method=6); uri = 'data:image/webp;base64,'
    cache[f] = uri + base64.b64encode(b.getvalue()).decode()
    return cache[f]
s = re.sub(r'<a href="ver\.php\?f=([\w.\-]+\.(?:jpg|png))" target="_blank">', '<a href="#">', s)
s = re.sub(r'src="ver\.php\?f=([\w.\-]+\.(?:jpg|png))"', lambda m: 'src="%s"' % datos(m.group(1)), s)
s = s.replace(' loading="lazy"', '')
s = s.replace("lb.querySelector('img').src=a.getAttribute('href')", "lb.querySelector('img').src=a.querySelector('img').src")
assert 'ver.php?f=' not in re.sub(r'ver\.php\?f=[\w.\-]+\.pdf', '', s), 'quedó una imagen sin incrustar'
open(os.path.join(PRIV, 'manual.html'), 'w', encoding='utf-8').write(s)
print('manual.html:', len(cache), 'imágenes incrustadas,', round(len(s.encode()) / 1048576, 2), 'MB')
