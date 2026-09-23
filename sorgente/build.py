"""Genera le quattro pagine di Cosmere Journey (Codice stellare) da un unico sorgente.
Uso: python3 build.py <index.html originale> <cartella di output>"""
import re, sys, base64, io, pathlib
from PIL import Image

SRC = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
HERE = pathlib.Path(__file__).parent / "src"

def between(s, start, end, include_start=True):
    i = s.index(start); j = s.index(end, i + len(start))
    return s[i if include_start else i+len(start):j]

def one(s, old, new):
    n = s.count(old)
    assert n == 1, f"atteso 1, trovato {n}: {old[:60]!r}"
    return s.replace(old, new)

# ---- head: meta, icone, manifest, startup image (del file originale) ----
head = SRC[:SRC.index("<title>")]
head = one(head, '<meta name="theme-color" content="#080b13">', '<meta name="theme-color" content="#06090F">')
head = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">',
  '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">', head)
assert "Bodoni+Moda" in head

import json
ICONS = pathlib.Path(__file__).parent / "icone"
def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(pathlib.Path(path).read_bytes()).decode()

# apple-touch-icon: iOS vuole un PNG senza trasparenza
assert "transparency" not in Image.open(ICONS/"apple-touch-icon.png").info and Image.open(ICONS/"apple-touch-icon.png").mode in ("RGB","P")
apple = b64(ICONS/"apple-touch-icon.png", "image/png")

def swap_link(h, marker, new_uri):
    i = h.index(marker); j = h.index('href="', i) + 6; k = h.index('"', j)
    if h.rfind("<link", 0, i) != h.rfind("<link", 0, j): raise SystemExit("link non trovato: "+marker)
    return h[:j] + new_uri + h[k:]

m = re.search(r'rel="manifest" href="data:application/manifest\+json;base64,([^"]+)"', head)
man = json.loads(base64.b64decode(m.group(1)))
man["background_color"] = man["theme_color"] = "#06090F"
man["icons"] = [
  {"src": b64(ICONS/"icon-192.png","image/png"), "sizes":"192x192", "type":"image/png", "purpose":"any"},
  # un solo 512 per entrambi gli usi: il disegno sta tutto nella zona sicura (r < 40%)
  {"src": b64(ICONS/"icon-512.png","image/png"), "sizes":"512x512", "type":"image/png", "purpose":"any maskable"},
]
head = head.replace(m.group(0), 'rel="manifest" href="data:application/manifest+json;base64,' + base64.b64encode(json.dumps(man, ensure_ascii=False).encode()).decode() + '"')
head = swap_link(head, 'rel="apple-touch-icon"', apple)
# Il manifest e' incorporato come data: URI, quindi un start_url relativo non
# si risolverebbe. Lo script lo riscrive all'avvio con indirizzi assoluti.
_i = head.index('rel="manifest"'); _e = head.index('>', _i) + 1
head = head[:_e] + """
<script>
(function(){
  try{
    var link = document.querySelector('link[rel="manifest"]');
    var raw = atob(link.getAttribute("href").split(",")[1]);
    var bytes = new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);
    var man = JSON.parse(new TextDecoder().decode(bytes));
    man.start_url = new URL("index.html", location.href).href;
    man.scope = new URL("./", location.href).href;
    man.id = man.start_url;
    link.setAttribute("href", "data:application/manifest+json;charset=utf-8," + encodeURIComponent(JSON.stringify(man)));
  }catch(e){}
})();
</script>""" + head[_e:]
head = swap_link(head, 'sizes="32x32"', b64(ICONS/"favicon-32.png","image/png"))
head = swap_link(head, 'sizes="192x192"', b64(ICONS/"icon-192.png","image/png"))
for w in (390,393,428,430,414,375):
    f = ICONS/f"startup-{w}.jpg"
    if f.exists():
        head = swap_link(head, f'(device-width: {w}px)', b64(f,"image/jpeg"))

# ---- splash: CSS originale ricolorato in ciano strumento ----
splash_css = between(SRC, "/* iPhone-style app launch splash */", "</style>")
for a, b in [
    ("rgba(210,171,85,", "rgba(143,199,207,"), ("#080b13", "#06090F"),
    ("var(--text)", "var(--light)"), ("var(--muted)", "var(--dim)"), ("var(--gold)", "var(--inst)"),
    ("#e6c779", "#A9D5DB"), ("#f0cf7b", "#BFE3E8"), ("#d2ab55", "#8FC7CF"), ("#e8c675", "#BFE3E8"),
    ("rgba(240,207,123,.48)", "rgba(143,199,207,.48)"), ("rgba(232,198,117,.8)", "rgba(143,199,207,.8)"),
    ("#e7dcc1", "#DCE6F2"), ("font-family:'Cormorant Garamond',serif;", "font-family:var(--display);"),
]:
    assert a in splash_css, a
    splash_css = splash_css.replace(a, b)
splash_css += """
/* Splash — Codice stellare */
.splash-brand{font-weight:400;letter-spacing:.12em;margin-left:.12em}
.splash-brand-sub,.splash-tagline,.splash-footer{font-family:var(--mono)}
.splash-brand-sub{font-size:10px;margin-top:10px}
.splash-tagline{font-weight:500;letter-spacing:.24em}
/* pianeti in punta alle orbite, come nell'icona; scaleX compensa lo schiacciamento dell'orbita */
.splash-orbit-a:after,.splash-orbit-b:after{left:50%;right:auto;margin:0 0 0 -3px;width:6px;height:6px;transform:scaleX(1.818)}
.splash-orbit-a:after{top:-3px;background:#E8BE5A;box-shadow:0 0 10px rgba(232,190,90,.8)}
.splash-orbit-b:after{top:auto;bottom:-3px;background:#5B8FF0;box-shadow:0 0 10px rgba(91,143,240,.8)}
"""

MULTIPAGE = """<style id="multi-page-layout">
/* Cosmere Journey — struttura a quattro pagine */
body[data-page="home"] #blog,
body[data-page="home"] #worlds,
body[data-page="home"] #progress { display:none !important; }

body[data-page="blog"] #home,
body[data-page="blog"] #chart,
body[data-page="blog"] #journey,
body[data-page="blog"] #worlds,
body[data-page="blog"] #progress { display:none !important; }

body[data-page="worlds"] #home,
body[data-page="worlds"] #journey,
body[data-page="worlds"] #blog,
body[data-page="worlds"] #progress { display:none !important; }

body[data-page="progress"] #home,
body[data-page="progress"] #chart,
body[data-page="progress"] #journey,
body[data-page="progress"] #blog,
body[data-page="progress"] #worlds { display:none !important; }
</style>"""

# ---- apertura body: early paint, flag splash, markup splash (originali) ----
body_open = between(SRC, '<body data-page="home">', '<div class="stars-layer stars-far"', include_start=False)
body_open = body_open.replace("#080b13", "#06090F")
OLD_EARLY = """  if(first){
    document.documentElement.classList.add("splash-first-load");
    try{ sessionStorage.setItem(key,"1"); }catch(e){}
  }"""
assert body_open.count(OLD_EARLY) == 1
body_open = body_open.replace(OLD_EARLY, """  if(first){
    document.documentElement.classList.add("splash-first-load");
    /* Aperta dall'icona sulla schermata Home: si parte sempre dalla Home,
       qualunque sia la pagina da cui e' stata aggiunta o che iOS ha
       ripristinato. Lo splash copre la pagina durante il reindirizzamento;
       il flag non viene scritto, cosi' la Home mostra lo splash. */
    var standalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    if(standalone && document.body.getAttribute("data-page") !== "home"){
      location.replace("index.html");
      return;
    }
    try{ sessionStorage.setItem(key,"1"); }catch(e){}
  }""")

# ---- script: dati e logica del blog presi dal file originale ----
books = between(SRC, "const BOOKS = [", "];") + "];"
blog = (HERE/"blog.js").read_text(encoding="utf-8")
startapp = (HERE/"start.js").read_text(encoding="utf-8")

# ---- viaggiatore: il mago pixel-art, ritagliato e ridotto per la carta ----
m = re.search(r'class="ring-avatar" src="data:image/png;base64,([A-Za-z0-9+/=]+)"', SRC)
im = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("RGBA")
im = im.crop(im.getbbox())
h = 90; im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
wizard = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

js = (HERE/"app.js").read_text(encoding="utf-8")
for k, v in {"{{BOOKS}}": books, "{{BLOG}}": blog, "{{STARTAPP}}": startapp, "{{WIZARD}}": wizard}.items():
    js = one(js, k, v)

css = (HERE/"app.css").read_text(encoding="utf-8")
body_tpl = (HERE/"body.html").read_text(encoding="utf-8")

PAGES = [("home","index.html","Home"),("blog","blog.html","Blog"),("worlds","mondi.html","Mondi"),("progress","percorso.html","Percorso")]
for page, fname, title in PAGES:
    body = body_tpl
    for p,_,_ in PAGES:
        body = body.replace("{{NAV_%s}}" % p, "active" if p == page else "")
        body = body.replace("{{CUR_%s}}" % p, "page" if p == page else "false")
    assert "{{" not in body
    html = (head + f"<title>Cosmere Journey — {title}</title>\n<style>\n{css}\n{splash_css}</style>\n\n{MULTIPAGE}\n\n</head>\n"
            f'<body data-page="{page}">' + body_open + body + "\n<script>\n" + js + "</script>\n</body>\n</html>\n")
    (OUT/fname).write_text(html, encoding="utf-8")
    print(f"{fname:14} {len(html)//1024} KB")
