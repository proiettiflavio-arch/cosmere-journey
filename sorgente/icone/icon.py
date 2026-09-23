import math
def icon_svg(simple=False):
    """Icona Cosmere Journey · Codice stellare (viewBox 512).
    Tutto il disegno sta entro r=205 dal centro: vale anche come maskable (zona sicura 40%)."""
    cx=cy=256
    s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
       '<defs>',
       '<radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#17243C"/><stop offset=".55" stop-color="#0A101B"/><stop offset="1" stop-color="#06090F"/></radialGradient>',
       '<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8FC7CF" stop-opacity=".30"/><stop offset="1" stop-color="#8FC7CF" stop-opacity="0"/></radialGradient>',
       '<linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="#A9D5DB" stop-opacity="0"/><stop offset=".5" stop-color="#BFE3E8"/><stop offset="1" stop-color="#A9D5DB" stop-opacity="0"/></linearGradient>',
       '<linearGradient id="v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#A9D5DB" stop-opacity="0"/><stop offset=".5" stop-color="#BFE3E8"/><stop offset="1" stop-color="#A9D5DB" stop-opacity="0"/></linearGradient>',
       '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>',
       '</defs>',
       '<rect width="512" height="512" fill="url(#bg)"/>']
    if not simple:
        # anelli della carta, sullo sfondo
        s+= [f'<ellipse cx="{cx}" cy="{cy}" rx="200" ry="112" fill="none" stroke="#22304A" stroke-width="3.5"/>',
             f'<ellipse cx="{cx}" cy="{cy}" rx="150" ry="84" fill="none" stroke="#22304A" stroke-width="3.5"/>',
             f'<line x1="{cx-200}" y1="{cy}" x2="{cx+200}" y2="{cy}" stroke="#1C2840" stroke-width="2.5" stroke-dasharray="6 10"/>']
    s.append(f'<circle cx="{cx}" cy="{cy}" r="150" fill="url(#halo)"/>')
    R = 170 if simple else 108
    if not simple:
        # due orbite inclinate, come nello splash, con due pianeti color gemma
        for ang, col, t in ((24,"#E8BE5A",-68),(-24,"#5B8FF0",112)):
            rx, ry = 88, 164
            s.append(f'<g transform="rotate({ang} {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#8FC7CF" stroke-opacity=".55" stroke-width="4.5"/>')
            px = cx + rx*math.cos(math.radians(t)); py = cy + ry*math.sin(math.radians(t))
            s.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="24" fill="{col}" opacity=".55" filter="url(#glow)"/><circle cx="{px:.1f}" cy="{py:.1f}" r="14" fill="{col}"/></g>')
    # anello, mirino, gemma
    sw = 34 if simple else 7
    s+= [f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#8FC7CF" stroke-width="{sw+8}" opacity=".22" filter="url(#glow)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#070C15" fill-opacity=".55" stroke="#8FC7CF" stroke-width="{sw}"/>']
    L = R*0.8
    if not simple:
        s+= [f'<rect x="{cx-L}" y="{cy-1.75}" width="{2*L}" height="3.5" fill="url(#h)"/>',
             f'<rect x="{cx-1.75}" y="{cy-L}" width="3.5" height="{2*L}" fill="url(#v)"/>']
    g = 96 if simple else 36   # semi-diagonale della gemma
    gi = g*(0.8 if simple else 0.52)
    s+= [f'<path d="M{cx} {cy-g}L{cx+g} {cy}L{cx} {cy+g}L{cx-g} {cy}Z" fill="#8FC7CF" opacity=".5" filter="url(#glow)"/>',
         f'<path d="M{cx} {cy-g}L{cx+g} {cy}L{cx} {cy+g}L{cx-g} {cy}Z" fill="#0B1420" stroke="#BFE3E8" stroke-width="{0 if simple else 4.5}" stroke-linejoin="miter"/>',
         f'<path d="M{cx} {cy-gi}L{cx+gi} {cy}L{cx} {cy+gi}L{cx-gi} {cy}Z" fill="#8FC7CF"/>',
         '</svg>']
    return "".join(s)
if __name__=="__main__":
    open("icon.svg","w").write(icon_svg()); open("icon-simple.svg","w").write(icon_svg(True))
