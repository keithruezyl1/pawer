"""
Regenerates the PAWER design artboards.

One shared shell (embedded fonts, checkerboard ground, token constants, shape kit) so ten
artboards can never drift apart. The tour's highlight geometry is COMPUTED from the same layout
constants the dashboard uses, so it cannot end up framing the wrong thing again.

Run:  python design/build.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FACES = open(os.path.join(HERE, "fonts", "faces.css"), encoding="utf-8").read()

# --- tokens (mirrors app/src/theme/tokens.ts + packages/shared/src/palette.ts) ---
GROUND, SURFACE2, SLATE, INK, ACCENT, NOTICE = "#F5F5F5", "#D6D7D7", "#4F5D75", "#212431", "#EA5C1F", "#DDE0E6"
CLEAR, UPCOMING, ONGOING, ENDED = "#9BF06B", "#FF90E8", "#FF5C5C", "#FFD93D"
BORDER, SHADOW, RADIUS = "2px solid " + INK, "4px 4px 0 " + INK, "5px"
SHADOW_HOVER, SHADOW_NONE = "6px 6px 0 " + INK, "0 0 0 " + INK

DISPLAY = "font-family: 'Getai Grotesk', Impact, sans-serif; font-weight: 900; font-size: 40px; line-height: 42px; letter-spacing: -0.02em;"
TITLE   = "font-family: 'Getai Grotesk', Impact, sans-serif; font-weight: 900; font-size: 24px; line-height: 28px; letter-spacing: -0.01em;"
HEAD    = "font-family: Aspekta, system-ui, sans-serif; font-weight: 700; font-size: 18px; line-height: 23px;"
BODY    = "font-family: Aspekta, system-ui, sans-serif; font-weight: 400; font-size: 15px; line-height: 21px;"
LABEL   = "font-family: Aspekta, system-ui, sans-serif; font-weight: 500; font-size: 13px; line-height: 17px;"
CAPTION = "font-family: Aspekta, system-ui, sans-serif; font-weight: 400; font-size: 11px; line-height: 14px;"
MUTED   = " color: " + SLATE + ";"

CHECKER = ("background-color: " + GROUND + "; "
           "background-image: repeating-conic-gradient(rgba(33,36,49,0.045) 0% 25%, transparent 0% 50%); "
           "background-size: 24px 24px;")

# --- layout constants; the tour spotlight is derived from these ---
SCREEN_W, MARGIN, CARD_PAD, TOUCH = 390, 20, 24, 48
STATUS_GAP, HEADER_H, STACK_GAP = 28, 64, 12

# ================================================================ shape kit
def burst(size, fill, spikes=12):
    import math
    pts = []
    for i in range(spikes * 2):
        r = size / 2 if i % 2 == 0 else size / 4.2
        a = math.pi * i / spikes - math.pi / 2
        pts.append(f"{size/2 + r*math.cos(a):.1f},{size/2 + r*math.sin(a):.1f}")
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" aria-hidden="true">'
            f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/></svg>')

def sparkle(size, fill):
    h = size / 2
    d = (f"M{h} 0 C{h} {h*0.65} {h*0.65} {h} 0 {h} C{h*0.65} {h} {h} {h*1.35} {h} {size} "
         f"C{h} {h*1.35} {h*1.35} {h} {size} {h} C{h*1.35} {h} {h} {h*0.65} {h} 0 Z")
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" aria-hidden="true">'
            f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/></svg>')

def squiggle(w, h, stroke):
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none" aria-hidden="true">'
            f'<path d="M2 {h-4} Q {w*0.25} 2 {w*0.5} {h/2} T {w-2} 4" stroke="{stroke}" stroke-width="3" stroke-linecap="round"/></svg>')

def pill(w, h, fill):
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" aria-hidden="true">'
            f'<rect x="1.5" y="1.5" width="{w-3}" height="{h-3}" rx="{h/2}" fill="{fill}" stroke="{INK}" stroke-width="2"/></svg>')

def disc(size, fill):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" aria-hidden="true">'
            f'<circle cx="{size/2}" cy="{size/2}" r="{size/2-1.5}" fill="{fill}" stroke="{INK}" stroke-width="2"/></svg>')

def dots(active, total=5, animated=False):
    """Dot pagination. The current page is a wider oblong rather than a circle, so position reads
    at a glance without counting. Width and fill are transitioned, so moving between screens
    morphs one dot open and the previous one closed."""
    cells = []
    for i in range(1, total + 1):
        on = (i == active) and not animated
        w = 24 if on else 9
        fill = INK if on else GROUND
        anim = f"animation: pageDot 5s ease-in-out {i-1}s infinite; " if animated else ""
        cells.append(f'<div style="width: {w}px; height: 9px; border: 2px solid {INK}; border-radius: 999px; '
                     f'background: {fill}; transition: width 220ms ease-out, background-color 220ms ease-out; '
                     f'{anim}box-sizing: border-box;"></div>')
    return ('<div style="display: flex; gap: 8px; align-items: center; justify-content: center;">'
            + "".join(cells) + '</div>')


def floater(shape, top=None, left=None, right=None, bottom=None, cls="drift", delay="0s"):
    pos = "".join(f"{k}: {v}px; " for k, v in
                  [("top", top), ("left", left), ("right", right), ("bottom", bottom)] if v is not None)
    return (f'<div class="{cls}" style="position: absolute; {pos}animation-delay: {delay}; '
            f'pointer-events: none;">{shape}</div>')

# ================================================================ primitives
def block(inner, fill=GROUND, pad=CARD_PAD, shadow=SHADOW, style=""):
    sh = ("box-shadow: " + shadow + "; ") if shadow else ""
    return ('<div style="background: ' + fill + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            + sh + 'padding: ' + str(pad) + 'px; ' + style + '">' + inner + '</div>')

def button(label, primary=False, ghost=False, state="default"):
    if ghost:
        return ('<div style="min-height: 48px; display: flex; align-items: center; justify-content: center; padding: 12px;">'
                '<div style="' + LABEL + '">' + label + '</div></div>')
    fill = ACCENT if primary else GROUND
    shift, sh, extra = "", SHADOW, ""
    if state == "hover":
        shift, sh = "transform: translate(-2px, -2px); ", SHADOW_HOVER
    elif state == "pressed":
        shift, sh = "transform: translate(4px, 4px); ", SHADOW_NONE
    elif state == "disabled":
        extra = "opacity: 0.45; "
    return ('<div style="min-height: 48px; background: ' + fill + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'box-shadow: ' + sh + '; display: flex; align-items: center; justify-content: center; padding: 12px 24px; '
            + shift + extra + '">'
            '<div style="' + HEAD + ' text-align: center;">' + label + '</div></div>')

def chip(text, fill=GROUND):
    return ('<div style="border: ' + BORDER + '; border-radius: ' + RADIUS + '; background: ' + fill + '; '
            'padding: 3px 9px; ' + LABEL + '">' + text + '</div>')

def removable_chip(text):
    x = ('<div style="width: 16px; height: 16px; position: relative;">'
         '<div style="position: absolute; top: 7px; left: 1px; width: 14px; height: 2px; background: ' + INK + '; transform: rotate(45deg);"></div>'
         '<div style="position: absolute; top: 7px; left: 1px; width: 14px; height: 2px; background: ' + INK + '; transform: rotate(-45deg);"></div>'
         '</div>')
    return ('<div style="display: flex; align-items: center; gap: 8px; min-height: 34px; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; background: ' + GROUND + '; padding: 6px 12px;">'
            '<div style="' + LABEL + '">' + text + '</div>' + x + '</div>')

CHEVRON = ('<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="' + INK + '" stroke-width="2.5" '
           'stroke-linecap="square"><path d="M6 3l5 5-5 5"/></svg>')
CHECK = ('<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="' + INK + '" stroke-width="2.5" '
         'stroke-linecap="square" style="flex-shrink: 0; margin-top: 2px;"><path d="M3 9.5l4 4 8-9"/></svg>')
CROSS = ('<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="' + INK + '" stroke-width="2.5" '
         'stroke-linecap="square" style="flex-shrink: 0; margin-top: 2px;"><path d="M4 4l10 10M14 4L4 14"/></svg>')

def checkbox(checked=False, disabled=False):
    return ('<div style="width: 24px; height: 24px; border: ' + BORDER + '; border-radius: 4px; background: '
            + (ACCENT if checked else GROUND) + '; display: flex; align-items: center; justify-content: center; '
            'flex-shrink: 0;' + (' opacity: 0.45;' if disabled else '') + '">'
            + ('<div style="width: 10px; height: 10px; background: ' + INK + ';"></div>' if checked else '') + '</div>')

def toggle(on=True):
    fill, just = (INK, "flex-end") if on else (SURFACE2, "flex-start")
    return ('<div style="width: 50px; height: 30px; border: ' + BORDER + '; border-radius: 15px; background: ' + fill + '; '
            'display: flex; align-items: center; justify-content: ' + just + '; padding: 2px; box-sizing: border-box; flex-shrink: 0;">'
            '<div style="width: 22px; height: 22px; border-radius: 11px; background: ' + GROUND + ';"></div></div>')

def fade(height=72):
    """A scrollable list never ends on a hard edge; content dissolves into the ground."""
    return ('<div style="position: absolute; left: 0; right: 0; bottom: 0; height: ' + str(height) + 'px; '
            'background: linear-gradient(to bottom, rgba(245,245,245,0) 0%, rgba(245,245,245,0.85) 55%, ' + GROUND + ' 100%); '
            'pointer-events: none;"></div>')

def app_header(title="PAWER"):
    dots = "".join('<div style="width: 5px; height: 5px; background: ' + INK + ';"></div>' for _ in range(3))
    return ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 20px;">'
            '<div style="' + TITLE + ' font-size: 26px;">' + title + '</div>'
            '<div style="width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; '
            'justify-content: center; gap: 4px;">' + dots + '</div></div>')

def page(inner, h=980, pad="28px 20px 0 20px", gap=12, w=SCREEN_W, extra=""):
    return ('<div style="width: ' + str(w) + 'px; height: ' + str(h) + 'px; ' + CHECKER + ' display: flex; '
            'flex-direction: column; padding: ' + pad + '; gap: ' + str(gap) + 'px; box-sizing: border-box; '
            'overflow: hidden; position: relative; ' + extra + '">' + inner + '</div>')

ANIM = """
@keyframes drift { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(0,-14px) rotate(7deg); } }
@keyframes bob   { 0%,100% { transform: translateY(0) rotate(0deg); }  50% { transform: translateY(10px) rotate(-6deg); } }
@keyframes turn  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pageDot { 0%, 17% { width: 24px; background: #212431; } 21%, 100% { width: 9px; background: #F5F5F5; } }
.drift { animation: drift 6s ease-in-out infinite; }
.bob   { animation: bob 5s ease-in-out infinite; }
.turn  { animation: turn 22s linear infinite; }
@media (prefers-reduced-motion: reduce) { .drift, .bob, .turn { animation: none; } }
"""

def doc(inner):
    return ("<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n"
            "  <script src=\"./support.js\"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n<style>\n"
            + FACES + ANIM +
            "body { margin: 0; font-family: Aspekta, system-ui, sans-serif; color: " + INK + "; }\n"
            "a { color: " + ACCENT + "; } a:hover { color: #C24A16; }\n"
            "</style>\n</helmet>\n" + inner + "\n</x-dc>\n</body>\n</html>\n")

def write(name, inner):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as fh:
        fh.write(doc(inner))
    print("  wrote", name)

# ================================================================ shared pieces
def hero(fill, tag, display, detail, area):
    inner = ('<div style="display: flex; flex-direction: column; gap: 8px;">'
             '<div style="' + LABEL + '">' + tag + '</div>'
             '<div style="' + DISPLAY + ' margin-top: 4px;">' + display + '</div>'
             '<div style="' + HEAD + '">' + detail + '</div>'
             + ('<div style="' + LABEL + ' margin-top: 4px;">' + area + '</div>' if area else '') + '</div>')
    return block(inner, fill=fill, style="min-height: 210px;")

def outage_card(date, window, chips, note=None, fill=GROUND, following=False):
    head = ('<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">'
            '<div style="' + HEAD + '">' + date + '</div>'
            + ('<div style="' + CAPTION + MUTED + '">Following</div>' if following else '') + '</div>')
    n = ('<div style="' + CAPTION + MUTED + ' margin-top: 4px;">' + note + '</div>') if note else ''
    ch = ('<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">'
          + "".join(chip(c) for c in chips) + '</div>')
    return block(head + '<div style="' + BODY + '">' + window + '</div>' + n + ch,
                 fill=fill, pad=16, style="margin-bottom: 4px;")

def browse_row():
    return ('<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
            'border-top: ' + BORDER + '; border-bottom: ' + BORDER + ';">'
            '<div style="' + LABEL + '">Browse all areas</div>' + CHEVRON + '</div>')

def empty_card():
    """Shared by DashboardEmpty and Tour so the spotlight can never point at the wrong place."""
    return block('<div style="' + LABEL + '">TODAY</div>'
                 '<div style="' + DISPLAY + ' margin-top: 8px;">No areas yet</div>'
                 '<div style="' + BODY + ' margin-top: 8px;">Add your barangay to see its schedule.</div>'
                 '<div style="margin-top: 24px;">' + button("Add area", primary=True) + '</div>')

def empty_dashboard_body():
    return ('<div style="height: ' + str(STATUS_GAP) + 'px;"></div>' + app_header()
            + '<div style="padding: 0 20px;">' + empty_card() + '</div>'
            + '<div style="padding: 0 20px; margin-top: 24px;">' + browse_row() + '</div>')

# Derived from the constants above; see the assertion in __main__.
ADD_BTN_TOP = STATUS_GAP + STACK_GAP + HEADER_H + STACK_GAP + 2 + CARD_PAD + 17 + 8 + 42 + 8 + 21 + 24
ADD_BTN_LEFT = MARGIN + 2 + CARD_PAD

# ================================================================ artboards
def main_dashboard():
    meta = ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px;">'
            '<div style="' + CAPTION + MUTED + '">Checked 4 min ago</div>'
            '<div style="' + CAPTION + MUTED + '">2 scheduled</div></div>')
    cards = ('<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">'
             + outage_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas", "Lahug"])
             + outage_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Mabolo"]) + '</div>')
    foot = '<div style="padding: 0 20px; margin-top: 20px;">' + browse_row() + '</div>'
    inner = ('<div style="height: ' + str(STATUS_GAP) + 'px;"></div>' + app_header()
             + '<div style="padding: 0 20px;">' + hero(ONGOING, "SCHEDULED · NOW", "Outage in progress",
                                                       "Expected back 3:00 PM · 2h 10m left", "Part of Lahug") + '</div>'
             + meta + cards + foot + fade())
    write("Main.dc.html", page(inner, pad="0", gap=12))

def status_states():
    rows = []
    for label, fill, tag, disp, detail in [
        ("NONE_TODAY · clear " + CLEAR, CLEAR, "TODAY", "No outage today", "Next one Sat, Sep 12 at 8:00 AM"),
        ("UPCOMING_TODAY · upcoming " + UPCOMING, UPCOMING, "SCHEDULED · TODAY", "Outage in 3h 20m", "9:00 AM – 3:00 PM · 6h"),
        ("ONGOING · ongoing " + ONGOING, ONGOING, "SCHEDULED · NOW", "Outage in progress", "Expected back 3:00 PM · 2h 10m left"),
        ("ENDED_TODAY · ended " + ENDED, ENDED, "TODAY", "Power should be back", "Outage ended 3:00 PM"),
    ]:
        rows.append('<div style="display: flex; flex-direction: column; gap: 6px;">'
                    '<div style="' + CAPTION + MUTED + '">' + label + '</div>'
                    + hero(fill, tag, disp, detail, "Part of Lahug") + '</div>')
    head = ('<div style="display: flex; flex-direction: column; gap: 4px;">'
            '<div style="' + TITLE + '">Hero states</div>'
            '<div style="' + CAPTION + MUTED + '">The widget mirrors these exactly.</div></div>')
    write("StatusStates.dc.html", page(head + "".join(rows), h=1180, gap=18))

def component_states():
    def row(title, cells):
        return ('<div style="display: flex; flex-direction: column; gap: 10px;">'
                '<div style="' + LABEL + '">' + title + '</div>'
                '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; align-items: start;">'
                + "".join('<div style="display: flex; flex-direction: column; gap: 8px;">'
                          '<div style="' + CAPTION + MUTED + '">' + n + '</div>' + c + '</div>' for n, c in cells)
                + '</div></div>')

    btn_row = row("Primary button", [(n, button("Add area", primary=True, state=s))
                                     for n, s in [("Default", "default"), ("Hover", "hover"), ("Pressed", "pressed"), ("Disabled", "disabled")]])
    sec_row = row("Secondary button", [(n, button("Refresh now", state=s))
                                       for n, s in [("Default", "default"), ("Hover", "hover"), ("Pressed", "pressed"), ("Disabled", "disabled")]])
    chk_row = row("Checkbox", [("Off", checkbox()), ("On", checkbox(True)),
                               ("Already added", checkbox(True, disabled=True)), ("Toggle on / off",
                               '<div style="display: flex; gap: 10px;">' + toggle(True) + toggle(False) + '</div>')])
    chip_row = row("Chip", [("Plain", chip("Lahug")), ("Following", chip("Mabolo", fill=SURFACE2)),
                            ("Removable", removable_chip("Apas")), ("With LGU", chip("Basak, Mandaue City"))])

    card_states = ('<div style="display: flex; flex-direction: column; gap: 10px;">'
                   '<div style="' + LABEL + '">Card</div>'
                   '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px;">'
                   '<div style="display: flex; flex-direction: column; gap: 8px;">'
                   '<div style="' + CAPTION + MUTED + '">Default</div>'
                   + outage_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas"]) + '</div>'
                   '<div style="display: flex; flex-direction: column; gap: 8px;">'
                   '<div style="' + CAPTION + MUTED + '">Pressed</div>'
                   + block('<div style="' + HEAD + '">Tomorrow</div>'
                           '<div style="' + BODY + '">9:00 AM – 3:00 PM · 6h</div>'
                           '<div style="display: flex; gap: 8px; margin-top: 12px;">' + chip("Apas") + '</div>',
                           pad=16, shadow=SHADOW_NONE, style="transform: translate(4px, 4px);") + '</div>'
                   '</div></div>')

    note = ('<div style="' + CAPTION + MUTED + '">Hover exists on the canvas only. On a phone the same '
            'lift is skipped and the press state does all the work.</div>')
    head = ('<div style="display: flex; flex-direction: column; gap: 4px;">'
            '<div style="' + TITLE + '">Component states</div>'
            '<div style="' + CAPTION + MUTED + '">Default, hover, pressed, disabled.</div></div>')
    pag = ('<div style="display: flex; flex-direction: column; gap: 10px;">'
           '<div style="' + LABEL + '">Onboarding pagination</div>'
           '<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px;">'
           + "".join('<div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">'
                     '<div style="' + CAPTION + MUTED + '">Page ' + str(i) + '</div>' + dots(i) + '</div>'
                     for i in range(1, 6))
           + '</div>'
           '<div style="display: flex; align-items: center; gap: 14px; margin-top: 6px;">'
           + dots(1, animated=True)
           + '<div style="' + CAPTION + MUTED + '">The oblong opens as the next screen arrives and the old one '
             'closes. 220ms ease out on width and fill.</div></div></div>')
    inner = head + btn_row + sec_row + chk_row + chip_row + pag + card_states + note
    write("ComponentStates.dc.html", page(inner, h=1240, w=620, pad="28px 28px 28px 28px", gap=26))

def picker():
    field = ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
             'padding: 12px 16px; display: flex; align-items: center; box-sizing: border-box;">'
             '<div style="' + BODY + MUTED + '">Search 232 barangays</div></div>')
    chips = ('<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Apas") + removable_chip("Basak, Mandaue City") + '</div>')

    def brgy(name, checked=False, dimmed=False, note=None):
        n = ('<div style="' + CAPTION + MUTED + '">' + note + '</div>') if note else ''
        return ('<div style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0;'
                + (' opacity: 0.55;' if dimmed else '') + '">' + checkbox(checked, dimmed)
                + '<div style="' + BODY + '">' + name + '</div>' + n + '</div>')

    def group(name, open_=False):
        return ('<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
                'border-bottom: ' + BORDER + '; margin-top: 8px;">'
                '<div style="' + HEAD + '">' + name + '</div>'
                '<div style="' + HEAD + '">' + ("–" if open_ else "+") + '</div></div>')

    listing = ('<div style="position: relative; flex-grow: 1; overflow: hidden;">'
               '<div style="display: flex; flex-direction: column;">'
               + group("Cebu City", True) + brgy("Apas", checked=True) + brgy("Lahug", checked=True, dimmed=True, note="added")
               + brgy("Mabolo") + brgy("Basak, Cebu City")
               + group("Mandaue City") + group("Talisay City") + group("Naga") + '</div>' + fade(64) + '</div>')
    actions = ('<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0 16px 0;">'
               + button("Add 2", primary=True) + button("Cancel", ghost=True) + '</div>')
    inner = ('<div style="' + TITLE + ' margin-top: 8px;">Add areas</div>' + field
             + '<div style="' + CAPTION + MUTED + '">Your barangay is on your Visayan Electric bill.</div>'
             + chips + listing + actions)
    write("Picker.dc.html", page(inner))

def all_areas():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">All areas</div>' + button("Back", ghost=True) + '</div>')
    field = ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
             'padding: 12px 16px; display: flex; align-items: center; box-sizing: border-box;">'
             '<div style="' + BODY + MUTED + '">Search by barangay</div></div>')
    note = '<div style="' + CAPTION + MUTED + '">14 scheduled. Viewing here doesn\'t add alerts.</div>'
    cards = (outage_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas, Cebu City", "Lahug, Cebu City"], following=True)
             + outage_card("Fri, Sep 11", "8:00 AM – 12:00 PM · 4h", ["Basak, Mandaue City", "Tipolo, Mandaue City"])
             + outage_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Colon, Naga", "Tinaan, Naga"],
                           note="Some areas couldn't be matched", fill=NOTICE)
             + outage_card("Advisory", "Couldn't read this one. Tap to view the original.", ["Poblacion, Liloan"], fill=NOTICE))
    write("AllAreas.dc.html", page(head + field + note + cards + fade()))

def detail():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">Tomorrow</div>' + button("Back", ghost=True) + '</div>')
    chips = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + chip("Apas") + chip("Lahug") + '</div>'
    notice = block('<div style="' + BODY + '">Some area names couldn\'t be matched. The original is linked below.</div>'
                   '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Couldn\'t match Sitio Kalubihan or Villa Aurora Subd.</div>',
                   fill=NOTICE, pad=16, shadow=None)
    quote = ('<div style="border-left: 3px solid ' + ACCENT + '; padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">'
             '<div style="' + CAPTION + MUTED + '">Areas affected</div>'
             '<div style="' + BODY + '">Portion of Brgy. Apas and Brgy. Lahug, Cebu City along Salinas Drive, Nasipit, '
             'Sitio Kalubihan, Villa Aurora Subd. and nearby areas</div>'
             '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Purpose</div>'
             '<div style="' + BODY + '">Replacement of deteriorated poles and re-stringing of primary lines</div></div>')
    inner = (head + '<div style="' + HEAD + '">9:00 AM – 3:00 PM · 6h</div>' + chips + notice
             + '<div style="' + LABEL + ' margin-top: 16px;">FROM VISAYAN ELECTRIC</div>' + quote
             + '<div style="' + CAPTION + MUTED + '">Quoted as published. Outages often affect only part of a barangay.</div>'
             + '<div style="margin-top: 16px;">' + button("View original post") + '</div>')
    write("Detail.dc.html", page(inner))

def settings():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">Settings</div>' + button("Done", ghost=True) + '</div>')
    chips = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + removable_chip("Lahug") + removable_chip("Mabolo") + '</div>'

    def alert_row(name, hint, on=True):
        return ('<div style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; '
                'border-bottom: 2px solid ' + SURFACE2 + '; padding: 8px 0; gap: 12px;">'
                '<div style="flex-grow: 1; display: flex; flex-direction: column;">'
                '<div style="' + BODY + '">' + name + '</div>'
                '<div style="' + CAPTION + MUTED + '">' + hint + '</div></div>' + toggle(on) + '</div>')

    alerts = (alert_row("New advisory", "A new outage is scheduled")
              + alert_row("Evening before", "Around 8:00 PM")
              + alert_row("An hour before", "Give or take a few minutes", on=False)
              + alert_row("Expected restoration", "When the window ends")
              + alert_row("Sounds", "Respects silent mode"))
    inner = (head + '<div style="' + LABEL + '">MY AREAS</div>' + chips + button("Add area", primary=True)
             + '<div style="' + LABEL + ' margin-top: 20px;">ALERTS</div>' + alerts
             + '<div style="' + LABEL + ' margin-top: 20px;">DATA</div>'
             + '<div style="' + BODY + '">Last checked 9:04 PM</div>' + button("Refresh now")
             + '<div style="' + LABEL + ' margin-top: 20px;">ABOUT</div>'
             + '<div style="' + BODY + MUTED + '">PAWER reads Visayan Electric\'s public advisories. It isn\'t made by them '
               'and isn\'t affiliated with them. It covers scheduled outages only, and shows the published schedule rather '
               'than the real state of the grid.</div>' + fade())
    write("Settings.dc.html", page(inner))

def ob_field(placeholder):
    return ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'padding: 12px 16px; display: flex; align-items: center; box-sizing: border-box;">'
            '<div style="' + BODY + MUTED + '">' + placeholder + '</div></div>')


def ob_screen(n, title, body_html, actions_html, shapes):
    """S1 to S5 share one frame.

    COPY IS KEITH'S, edited on the canvas — not the ONBOARDING-AND-TOUR text. Buttons are
    Cebuano ("Mao jud", "Sure eyyyy?", "Gegege"). Keep it in sync with the live canvas; the
    canvas is authoritative, this file only reseeds from it."""
    body = ('<div style="position: relative; z-index: 1; flex-grow: 1; display: flex; flex-direction: column; '
            'justify-content: center; gap: 16px;">'
            '<div style="' + TITLE + '">' + title + '</div>' + body_html + '</div>')
    return page(shapes + body
                + '<div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; '
                  'margin-bottom: 16px;">' + actions_html + '</div>'
                + '<div style="position: relative; z-index: 1; margin-bottom: 24px;">' + dots(n) + '</div>',
                gap=0)


def onboarding_all():
    P = lambda t: '<div style="' + BODY + '">' + t + '</div>'

    def item(icon, text):
        return ('<div style="display: flex; gap: 12px; align-items: flex-start;">' + icon
                + '<div style="' + BODY + '">' + text + '</div></div>')

    # --- S1: the problem ---------------------------------------------------------------
    write("Onboarding1.dc.html", ob_screen(
        1, "Power advisories exist, keeping track is a hassle.",
        P("Visayan Electric publishes every scheduled outage days ahead. The problem is it sits buried in "
          "social media feeds, between everything else.") + P("Sound familiar?"),
        button("Mao jud", primary=True) + button("Skip", ghost=True),
        floater(burst(96, ENDED), top=40, right=-26, cls="turn")
        + floater(squiggle(84, 30, INK), top=176, left=-16, cls="bob", delay="0.3s")
        + floater(disc(30, ONGOING), bottom=270, right=30, cls="drift", delay="0.9s")))

    # --- S2: the promise ---------------------------------------------------------------
    write("Onboarding2.dc.html", ob_screen(
        2, "What if it just told you?",
        P("In one card. Your barangay, on your home screen, before it happens."),
        button("Sure eyyyy?", primary=True) + button("Skip", ghost=True),
        floater(pill(120, 40, UPCOMING), top=60, left=-36, cls="drift")
        + floater(sparkle(46, CLEAR), top=200, right=-10, cls="bob", delay="0.5s")
        + floater(disc(64, ACCENT), bottom=250, left=-22, cls="drift", delay="1.1s")
        + floater(sparkle(26, ENDED), bottom=170, right=44, cls="drift", delay="1.6s")))

    # --- S3: the honest limit (not skippable) ------------------------------------------
    write("Onboarding3.dc.html", ob_screen(
        3, "What PAWER can and can&#39;t tell you",
        item(CHECK, "Scheduled outages, days ahead")
        + item(CHECK, "When one starts, and when the power should be back")
        + block(item(CROSS, "Sudden outages. Visayan Electric doesn&#39;t publish those ahead, so PAWER "
                            "can&#39;t warn you."), fill=NOTICE, pad=16, shadow=SHADOW)
        + '<div style="' + CAPTION + MUTED + '">PAWER is in its early stages. Future updates include improved '
          'announcement frequency and accuracy, as well as crowd-gathered info on power conditions.</div>',
        button("Gegege", primary=True),
        floater(burst(78, ENDED), top=52, right=-14, cls="turn")
        + floater(sparkle(40, UPCOMING), top=150, left=-12, cls="drift", delay="0.4s")
        + floater(disc(26, CLEAR), top=250, right=42, cls="bob", delay="1s")
        + floater(squiggle(70, 26, INK), bottom=300, right=16, cls="bob", delay="0.2s")))

    # --- S4: the optional name ---------------------------------------------------------
    write("Onboarding4.dc.html", ob_screen(
        4, "What should we call you?",
        ob_field("Your name")
        + '<div style="' + CAPTION + MUTED + '">Optional. Stays on your phone.</div>',
        button("Continue", primary=True) + button("Skip"),
        floater(sparkle(52, UPCOMING), top=70, right=-16, cls="drift")
        + floater(pill(92, 34, CLEAR), top=210, left=-30, cls="bob", delay="0.6s")
        + floater(disc(34, ACCENT), bottom=290, right=34, cls="drift", delay="1.2s")))

    # --- S5: the handover --------------------------------------------------------------
    write("Onboarding5.dc.html", ob_screen(
        5, "Welcome to PAWER",
        P("Let&#39;s get started by adding your barangay."),
        button("Start", primary=True) + button("I&#39;ll set it up myself", ghost=True),
        floater(burst(104, CLEAR), top=44, left=-34, cls="turn")
        + floater(sparkle(44, ENDED), top=168, right=-12, cls="drift", delay="0.4s")
        + floater(disc(28, UPCOMING), top=280, left=48, cls="bob", delay="0.8s")
        + floater(squiggle(76, 28, INK), bottom=280, left=-10, cls="bob", delay="0.2s")
        + floater(sparkle(30, ACCENT), bottom=190, right=36, cls="drift", delay="1.4s")))


def _tint(hex_, amount):
    """A status hue laid over ground. Keeps the SATURATED four for status only, so a decorative
    card fill can never be mistaken for a status."""
    g = (245, 245, 245)
    c = tuple(int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02X%02X%02X" % tuple(round(gg * (1 - amount) + cc * amount) for gg, cc in zip(g, c))


TINT_UPCOMING = _tint(UPCOMING, 0.32)
TINT_CLEAR = _tint(CLEAR, 0.32)
TINT_ENDED = _tint(ENDED, 0.32)
CARD_TINTS = [TINT_UPCOMING, TINT_CLEAR, TINT_ENDED]

# --- drawn icons; nothing from an icon library ------------------------------------------------
def clock_icon(size=14, tone=None):
    tone = tone or INK
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 16 16" fill="none" aria-hidden="true" '
            f'style="flex-shrink: 0;"><circle cx="8" cy="8" r="6.4" stroke="{tone}" stroke-width="2"/>'
            f'<path d="M8 4.4V8.2l2.6 1.9" stroke="{tone}" stroke-width="2" stroke-linecap="round"/></svg>')


def pin_icon(size=14, tone=None):
    tone = tone or INK
    h = round(size * 15 / 12)
    return (f'<svg width="{size}" height="{h}" viewBox="0 0 12 15" fill="none" aria-hidden="true" '
            f'style="flex-shrink: 0;"><path d="M6 13.6S10.4 8.4 10.4 5.4A4.4 4.4 0 0 0 1.6 5.4C1.6 8.4 6 13.6 6 13.6Z" '
            f'stroke="{tone}" stroke-width="2" stroke-linejoin="round"/>'
            f'<circle cx="6" cy="5.3" r="1.5" fill="{tone}"/></svg>')


def ext_icon(size=12, tone=None):
    tone = tone or ACCENT
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 12 12" fill="none" aria-hidden="true" '
            f'style="flex-shrink: 0;"><path d="M3 9L9 3M9 3H4.6M9 3v4.4" stroke="{tone}" stroke-width="2" '
            f'stroke-linecap="square"/></svg>')


def iconed(icon, text, text_style):
    return ('<div style="display: flex; align-items: center; gap: 7px;">' + icon
            + '<div style="' + text_style + '">' + text + '</div></div>')


def placed(text, text_style, size=13):
    """A geographical value never travels without its pin."""
    return ('<div style="display: flex; align-items: center; gap: 6px;">' + pin_icon(size)
            + '<div style="' + text_style + '">' + text + '</div></div>')


def card_pattern():
    """Neobrutalist hatch in the bottom-right corner, masked so it dissolves into the card."""
    mask = "linear-gradient(to top left, #000 8%, transparent 70%)"
    return ('<div style="position: absolute; right: 0; bottom: 0; width: 128px; height: 82px; '
            'background-image: repeating-linear-gradient(45deg, rgba(33,36,49,0.22) 0 3px, transparent 3px 9px); '
            f'-webkit-mask-image: {mask}; mask-image: {mask}; pointer-events: none;"></div>')


def pin_chip(text):
    return ('<div style="display: flex; align-items: center; gap: 5px; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; background: ' + GROUND + '; padding: 3px 9px 3px 7px;">'
            + pin_icon(12) + '<div style="' + LABEL + '">' + text + '</div></div>')


def upcoming_card(date, window, chips, fill, note=None, pattern=True):
    head = '<div style="' + HEAD + ' margin-bottom: 6px;">' + date + '</div>'
    when = iconed(clock_icon(15), window, BODY)
    n = ('<div style="' + CAPTION + MUTED + ' margin-top: 6px;">' + note + '</div>') if note else ''
    ch = ('<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; position: relative; z-index: 1;">'
          + "".join(pin_chip(c) for c in chips) + '</div>')
    return ('<div style="position: relative; overflow: hidden; background: ' + fill + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; padding: 16px; margin-bottom: 4px;">'
            + (card_pattern() if pattern else '')
            + '<div style="position: relative; z-index: 1;">' + head + when + n + '</div>' + ch + '</div>')


def browse_button():
    """Bottom right, a real button rather than a rule with a chevron."""
    return ('<div style="display: flex; justify-content: flex-end; padding: 0 20px; margin-top: 20px;">'
            '<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; display: inline-flex; '
            'align-items: center; gap: 9px; padding: 12px 18px;">'
            '<div style="' + HEAD + ' font-size: 15px;">Browse all areas</div>' + CHEVRON + '</div></div>')


def latest_advisory():
    """Below upcoming. The link goes to visayanelectric.com — the only post URL the pipeline
    stores (D-1 ingests the website, not Facebook)."""
    link = ('<div style="display: flex; align-items: center; gap: 6px; min-height: 48px;">'
            '<div style="' + HEAD + ' font-size: 15px; color: ' + ACCENT + '; text-decoration: underline; '
            'text-underline-offset: 3px;">View</div>' + ext_icon(13) + '</div>')
    body = ('<div style="position: relative; z-index: 1;">'
            + iconed(clock_icon(15), "Posted Wed, Sep 3 at 4:12 PM", BODY)
            + '<div style="' + BODY + ' margin-top: 8px;">Scheduled service interruption, September 5 to 11. '
              'Nine barangays across Cebu City and Mandaue City.</div>'
            + link + '</div>')
    return ('<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 10px; margin-top: 22px;">'
            '<div style="' + LABEL + '">LATEST ADVISORY</div>'
            '<div style="position: relative; overflow: hidden; background: ' + SURFACE2 + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; padding: 16px; margin-bottom: 4px;">'
            + body + '</div></div>')


def hero2(fill, tag, display, detail, area, stale=False):
    """The status card is the one place a time carries no clock — the time IS the headline."""
    inner = ('<div style="display: flex; flex-direction: column; gap: 8px;">'
             '<div style="' + LABEL + '">' + tag + '</div>'
             '<div style="' + DISPLAY + ' margin-top: 4px;">' + display + '</div>'
             '<div style="' + HEAD + '">' + detail + '</div>'
             + ('<div style="margin-top: 6px;">' + placed(area, LABEL, 14) + '</div>' if area else '')
             + ('<div style="' + CAPTION + ' margin-top: 12px;">Data may be outdated</div>' if stale else '')
             + '</div>')
    return ('<div style="background: ' + fill + '; border: ' + ("2px dashed " + SLATE if stale else BORDER) + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; padding: 24px; min-height: 210px;'
            + (' opacity: 0.85;' if stale else '') + '">' + inner + '</div>')


def dashboard(name, fill, tag, display, detail, area, cards, meta_left="Checked 4 min ago",
              meta_right="2 scheduled", stale=False):
    meta = ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px;">'
            + iconed(clock_icon(12, SLATE), meta_left, CAPTION + MUTED)
            + '<div style="' + CAPTION + MUTED + '">' + meta_right + '</div></div>')
    body = ('<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">'
            '<div style="' + LABEL + ' margin-top: 4px;">UPCOMING</div>' + cards + '</div>')
    inner = ('<div style="height: ' + str(STATUS_GAP) + 'px;"></div>' + app_header()
             + '<div style="padding: 0 20px;">' + hero2(fill, tag, display, detail, area, stale) + '</div>'
             + meta + body + latest_advisory() + browse_button() + fade())
    write(name, page(inner, pad="0", gap=12))


def nothing_block(text):
    return ('<div style="background: ' + TINT_CLEAR + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'box-shadow: ' + SHADOW + '; padding: 16px; margin-bottom: 4px;">'
            '<div style="' + BODY + '">' + text + '</div></div>')


def all_dashboards():
    two = (upcoming_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas", "Lahug"], CARD_TINTS[0])
           + upcoming_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Mabolo"], CARD_TINTS[1]))
    one = upcoming_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Mabolo"], CARD_TINTS[1])

    dashboard("DashClear.dc.html", CLEAR, "TODAY", "No outage today",
              "Nothing scheduled for your areas", "",
              nothing_block("Nothing else scheduled this week."), meta_right="0 scheduled")
    dashboard("DashUpcoming.dc.html", UPCOMING, "SCHEDULED · TODAY", "Outage in 3h 20m",
              "9:00 AM – 3:00 PM · 6h", "Part of Lahug", two)
    dashboard("Main.dc.html", ONGOING, "SCHEDULED · NOW", "Outage in progress",
              "Expected back 3:00 PM · 2h 10m left", "Part of Lahug", two)
    dashboard("DashEnded.dc.html", ENDED, "TODAY", "Power should be back",
              "Outage ended 3:00 PM", "Part of Lahug", one, meta_right="1 scheduled")
    dashboard("DashStale.dc.html", UPCOMING, "SCHEDULED · TODAY", "Outage in 3h 20m",
              "9:00 AM – 3:00 PM · 6h", "Part of Lahug", two,
              meta_left="Last checked Tue, 9:04 PM",
              meta_right="Couldn&#39;t check. Showing saved data.", stale=True)


def dashboard_empty():
    """No areas yet. No upcoming, no advisory section, but the browse button still belongs."""
    inner = ('<div style="height: ' + str(STATUS_GAP) + 'px;"></div>' + app_header()
             + '<div style="padding: 0 20px;">' + empty_card() + '</div>'
             + latest_advisory() + browse_button())
    write("DashboardEmpty.dc.html", page(inner, pad="0", gap=STACK_GAP))


def search_field(placeholder, typed=False):
    txt = (BODY if typed else BODY + MUTED)
    return ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; padding: 12px 16px; display: flex; align-items: center; '
            'box-sizing: border-box;"><div style="' + txt + '">' + placeholder + '</div>'
            + ('<div style="width: 2px; height: 20px; background: ' + ACCENT + '; margin-left: 2px;"></div>' if typed else '')
            + '</div>')


def picker_search():
    def brgy(nm, checked=False, dimmed=False, note=None):
        n = ('<div style="' + CAPTION + MUTED + '">' + note + '</div>') if note else ''
        return ('<div style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0;'
                + (' opacity: 0.55;' if dimmed else '') + '">' + checkbox(checked, dimmed)
                + '<div style="' + BODY + '">' + nm + '</div>' + n + '</div>')

    def group(nm):
        return ('<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
                'border-bottom: ' + BORDER + '; margin-top: 8px;">'
                '<div style="' + HEAD + '">' + nm + '</div></div>')

    chips = ('<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Basak, Cebu City") + removable_chip("Basak, Mandaue City") + '</div>')
    # A search hides the +/- toggles and flattens every LGU that still has a match.
    listing = ('<div style="position: relative; flex-grow: 1; overflow: hidden;">'
               '<div style="display: flex; flex-direction: column;">'
               + group("Cebu City") + brgy("Basak, Cebu City", checked=True) + brgy("Basak Pardo")
               + group("Mandaue City") + brgy("Basak, Mandaue City", checked=True)
               + group("Talisay City") + brgy("Basak, Talisay City")
               + '</div>' + fade(64) + '</div>')
    inner = ('<div style="' + TITLE + ' margin-top: 8px;">Add areas</div>'
             + search_field("Basak", typed=True)
             + '<div style="' + CAPTION + MUTED + '">Four barangays share this name, so each one shows its city.</div>'
             + chips
             + '<div style="' + CAPTION + MUTED + '">You&#39;ll get alerts for 5 areas, which may be frequent.</div>'
             + listing
             + '<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0 16px 0;">'
             + button("Add 2", primary=True) + button("Cancel", ghost=True) + '</div>')
    write("PickerSearch.dc.html", page(inner))


def all_areas_no_match():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">All areas</div>' + button("Back", ghost=True) + '</div>')
    inner = (head + search_field("Talamban", typed=True)
             + '<div style="' + CAPTION + MUTED + '">0 scheduled. Viewing here doesn&#39;t add alerts.</div>'
             + '<div style="' + BODY + MUTED + ' margin-top: 24px;">No scheduled outages match.</div>')
    write("AllAreasNoMatch.dc.html", page(inner))


def detail_variants():
    def shell(title, extra):
        return ('<div style="display: flex; justify-content: space-between; align-items: center;">'
                '<div style="' + TITLE + '">' + title + '</div>' + button("Back", ghost=True) + '</div>') + extra

    quote = ('<div style="border-left: 3px solid ' + ACCENT + '; padding-left: 16px; display: flex; '
             'flex-direction: column; gap: 4px;">'
             '<div style="' + CAPTION + MUTED + '">Areas affected</div>'
             '<div style="' + BODY + '">Portion of Brgy. Apas and Brgy. Lahug, Cebu City along Salinas Drive, '
             'Nasipit and nearby areas</div>'
             '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Purpose</div>'
             '<div style="' + BODY + '">Replacement of deteriorated poles and re-stringing of primary lines</div></div>')

    # fully parsed — no notice block at all
    write("DetailClean.dc.html", page(shell("Tomorrow",
        '<div style="' + HEAD + '">9:00 AM – 3:00 PM · 6h</div>'
        '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + chip("Apas") + chip("Lahug") + '</div>'
        + '<div style="' + LABEL + ' margin-top: 16px;">FROM VISAYAN ELECTRIC</div>' + quote
        + '<div style="' + CAPTION + MUTED + '">Quoted as published. Outages often affect only part of a barangay.</div>'
        + '<div style="margin-top: 16px;">' + button("View original post") + '</div>')))

    # the time could not be read at all
    write("DetailFailed.dc.html", page(shell("Advisory",
        '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + chip("Poblacion, Liloan") + '</div>'
        + block('<div style="' + BODY + '">PAWER couldn&#39;t read the time on this advisory. The original is '
                'linked below.</div>', fill=NOTICE, pad=16, shadow=None)
        + '<div style="' + LABEL + ' margin-top: 16px;">FROM VISAYAN ELECTRIC</div>'
        + '<div style="border-left: 3px solid ' + ACCENT + '; padding-left: 16px; display: flex; '
          'flex-direction: column; gap: 4px;">'
          '<div style="' + CAPTION + MUTED + '">Areas affected</div>'
          '<div style="' + BODY + '">Portion of Brgy. Poblacion, Liloan and nearby areas</div>'
          '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Purpose</div>'
          '<div style="' + BODY + '">Upgrading of distribution transformer</div></div>'
        + '<div style="' + CAPTION + MUTED + '">Quoted as published. Outages often affect only part of a barangay.</div>'
        + '<div style="margin-top: 16px;">' + button("View original post") + '</div>')))

    # the advisory has aged out of the saved data
    write("DetailNotFound.dc.html", page(shell("Not found",
        '<div style="' + BODY + MUTED + '">This advisory is no longer in the saved data.</div>'
        + '<div style="margin-top: 16px;">' + button("Back") + '</div>')))


def settings_empty():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">Settings</div>' + button("Done", ghost=True) + '</div>')

    def alert_row(nm, hint, on=True):
        return ('<div style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; '
                'border-bottom: 2px solid ' + SURFACE2 + '; padding: 8px 0; gap: 12px;">'
                '<div style="flex-grow: 1; display: flex; flex-direction: column;">'
                '<div style="' + BODY + '">' + nm + '</div>'
                '<div style="' + CAPTION + MUTED + '">' + hint + '</div></div>' + toggle(on) + '</div>')

    inner = (head
             + '<div style="' + LABEL + '">MY AREAS</div>'
             + '<div style="' + BODY + MUTED + '">None yet.</div>'
             + button("Add area", primary=True)
             + '<div style="' + LABEL + ' margin-top: 20px;">ALERTS</div>'
             + alert_row("New advisory", "A new outage is scheduled")
             + alert_row("Evening before", "Around 8:00 PM")
             + alert_row("An hour before", "Give or take a few minutes", on=False)
             + alert_row("Expected restoration", "When the window ends")
             + alert_row("Sounds", "Respects silent mode")
             + '<div style="' + LABEL + ' margin-top: 20px;">DATA</div>'
             + '<div style="' + BODY + '">Not checked yet</div>' + button("Refresh now") + fade())
    write("SettingsEmpty.dc.html", page(inner))


# ================================================================ the rest of the icon set
# All drawn here, none from a library. One 16x16 grid, 2px stroke, so they sit together.
def _svg(paths, size=15, tone=None, box=16):
    tone = tone or INK
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 {box} {box}" fill="none" aria-hidden="true" '
            f'style="flex-shrink: 0;">{paths.replace("@", tone)}</svg>')


def magnifier(size=15, tone=None):
    return _svg('<circle cx="6.6" cy="6.6" r="4.6" stroke="@" stroke-width="2"/>'
                '<path d="M10.3 10.3L14.2 14.2" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def warn(size=15, tone=None):
    return _svg('<path d="M8 2.1L14.6 13.6H1.4L8 2.1Z" stroke="@" stroke-width="2" stroke-linejoin="round"/>'
                '<path d="M8 6.4v3.0" stroke="@" stroke-width="2" stroke-linecap="round"/>'
                '<circle cx="8" cy="11.5" r="1" fill="@"/>', size, tone)


def bell(size=15, tone=None):
    return _svg('<path d="M4.2 10.9V7.5a3.8 3.8 0 0 1 7.6 0v3.4" stroke="@" stroke-width="2" stroke-linejoin="round"/>'
                '<path d="M2.7 10.9h10.6" stroke="@" stroke-width="2" stroke-linecap="round"/>'
                '<path d="M6.5 13.1a1.7 1.7 0 0 0 3 0" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def moon(size=15, tone=None):
    return _svg('<path d="M12.9 10.1A5.5 5.5 0 0 1 6.4 3.2 5.7 5.7 0 1 0 12.9 10.1Z" stroke="@" '
                'stroke-width="2" stroke-linejoin="round"/>', size, tone)


def bolt(size=15, tone=None):
    return _svg('<path d="M9.4 1.7L3.5 9.1h3.4l-.5 5.3 5.9-7.7H8.8l.6-5Z" stroke="@" stroke-width="2" '
                'stroke-linejoin="round"/>', size, tone)


def speaker(size=15, tone=None):
    return _svg('<path d="M8.2 2.7L4.7 5.8H2.1v4.4h2.6l3.5 3.1V2.7Z" stroke="@" stroke-width="2" stroke-linejoin="round"/>'
                '<path d="M10.9 5.7a3.5 3.5 0 0 1 0 4.6" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def refresh(size=15, tone=None):
    return _svg('<path d="M13.3 8.2A5.3 5.3 0 1 1 11.3 4" stroke="@" stroke-width="2" stroke-linecap="round"/>'
                '<path d="M13.6 2.3v3.5H10.1" stroke="@" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>', size, tone)


def info(size=15, tone=None):
    return _svg('<circle cx="8" cy="8" r="6.2" stroke="@" stroke-width="2"/>'
                '<path d="M8 7.3v4.1" stroke="@" stroke-width="2" stroke-linecap="round"/>'
                '<circle cx="8" cy="4.8" r="1" fill="@"/>', size, tone)


def doc_icon(size=15, tone=None):
    return _svg('<path d="M3.8 2.4h8.4v11.2H3.8V2.4Z" stroke="@" stroke-width="2" stroke-linejoin="round"/>'
                '<path d="M6.1 6h3.8M6.1 9.2h3.8" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def plus(size=15, tone=None):
    return _svg('<path d="M8 2.8v10.4M2.8 8h10.4" stroke="@" stroke-width="2.4" stroke-linecap="round"/>', size, tone)


def chev(direction="right", size=14, tone=None):
    deg = {"right": 0, "down": 90, "left": 180, "up": 270}[direction]
    return (f'<span style="display: inline-flex; transform: rotate({deg}deg); flex-shrink: 0;">'
            + _svg('<path d="M6 3l5 5-5 5" stroke="@" stroke-width="2.5" stroke-linecap="square"/>', size, tone)
            + '</span>')


def check_badge(size=15, tone=None):
    return _svg('<circle cx="8" cy="8" r="6.2" stroke="@" stroke-width="2"/>'
                '<path d="M5.1 8.3l2.1 2.1 3.8-4.4" stroke="@" stroke-width="2" stroke-linecap="round" '
                'stroke-linejoin="round"/>', size, tone)


def pin_filled(size=14, tone=None):
    tone = tone or INK
    h = round(size * 15 / 12)
    return (f'<svg width="{size}" height="{h}" viewBox="0 0 12 15" fill="none" aria-hidden="true" '
            f'style="flex-shrink: 0;"><path d="M6 13.6S10.4 8.4 10.4 5.4A4.4 4.4 0 0 0 1.6 5.4C1.6 8.4 6 13.6 6 13.6Z" '
            f'fill="{tone}" stroke="{tone}" stroke-width="2" stroke-linejoin="round"/>'
            f'<circle cx="6" cy="5.3" r="1.5" fill="{GROUND}"/></svg>')


def back_btn():
    """A bare chevron. On a phone the word 'Back' earns nothing the arrow does not."""
    return ('<div style="width: 48px; height: 48px; display: flex; align-items: center; '
            'justify-content: flex-end;">' + chev("left", 17) + '</div>')


def icon_button(label, icon, primary=False):
    fill = ACCENT if primary else GROUND
    return ('<div style="min-height: 48px; background: ' + fill + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; display: flex; align-items: center; '
            'justify-content: center; gap: 9px; padding: 12px 24px;">' + icon
            + '<div style="' + HEAD + ' text-align: center;">' + label + '</div></div>')


def section_label(text, icon):
    return ('<div style="display: flex; align-items: center; gap: 7px;">' + icon
            + '<div style="' + LABEL + '">' + text + '</div></div>')


def notice_row(icon, text, sub=None):
    s = ('<div style="' + CAPTION + MUTED + ' margin-top: 6px;">' + sub + '</div>') if sub else ''
    return ('<div style="display: flex; gap: 10px; align-items: flex-start;">' + icon
            + '<div><div style="' + BODY + '">' + text + '</div>' + s + '</div></div>')


def field(placeholder, typed=False):
    txt = BODY if typed else BODY + MUTED
    return ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; padding: 12px 16px; display: flex; align-items: center; gap: 10px; '
            'box-sizing: border-box;">' + magnifier(16, SLATE) + '<div style="' + txt + '">' + placeholder + '</div>'
            + ('<div style="width: 2px; height: 20px; background: ' + ACCENT + ';"></div>' if typed else '')
            + '</div>')


# ---- stale hero and card notes now carry the warning mark ------------------------------------
def hero2(fill, tag, display, detail, area, stale=False):
    inner = ('<div style="display: flex; flex-direction: column; gap: 8px;">'
             '<div style="' + LABEL + '">' + tag + '</div>'
             '<div style="' + DISPLAY + ' margin-top: 4px;">' + display + '</div>'
             '<div style="' + HEAD + '">' + detail + '</div>'
             + ('<div style="margin-top: 6px;">' + placed(area, LABEL, 14) + '</div>' if area else '')
             + ('<div style="margin-top: 12px;">' + iconed(warn(13), "Data may be outdated", CAPTION) + '</div>'
                if stale else '')
             + '</div>')
    return ('<div style="background: ' + fill + '; border: ' + ("2px dashed " + SLATE if stale else BORDER) + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; padding: 24px; min-height: 210px;'
            + (' opacity: 0.85;' if stale else '') + '">' + inner + '</div>')


def upcoming_card(date, window, chips, fill, note=None, pattern=True, following=False, no_time=False):
    head = ('<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">'
            '<div style="' + HEAD + '">' + date + '</div>'
            + (pin_filled(13) if following else '') + '</div>')
    when = ('' if no_time else iconed(clock_icon(15), window, BODY))
    n = ('<div style="margin-top: 8px;">' + iconed(warn(13, SLATE), note, CAPTION + MUTED) + '</div>') if note else ''
    ch = ('<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; position: relative; z-index: 1;">'
          + "".join(pin_chip(c) for c in chips) + '</div>')
    lead = ('<div style="' + BODY + MUTED + '">' + window + '</div>') if no_time else when
    return ('<div style="position: relative; overflow: hidden; background: ' + fill + '; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; box-shadow: ' + SHADOW + '; padding: 16px; margin-bottom: 4px;">'
            + (card_pattern() if pattern else '')
            + '<div style="position: relative; z-index: 1;">' + head + lead + n + '</div>' + ch + '</div>')


# ---- the four screens, re-cut with the icon language --------------------------------------
def picker():
    def brgy(nm, checked=False, dimmed=False, added=False):
        badge = ('<div style="margin-left: auto;">' + check_badge(15, SLATE) + '</div>') if added else ''
        return ('<div style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0;'
                + (' opacity: 0.55;' if dimmed else '') + '">' + checkbox(checked, dimmed)
                + '<div style="' + BODY + '">' + nm + '</div>' + badge + '</div>')

    def group(nm, open_=False):
        return ('<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
                'border-bottom: ' + BORDER + '; margin-top: 8px;">'
                '<div style="' + HEAD + '">' + nm + '</div>' + chev("up" if open_ else "down", 14) + '</div>')

    listing = ('<div style="position: relative; flex-grow: 1; overflow: hidden;">'
               '<div style="display: flex; flex-direction: column;">'
               + group("Cebu City", True) + brgy("Apas", checked=True)
               + brgy("Lahug", checked=True, dimmed=True, added=True) + brgy("Mabolo") + brgy("Basak, Cebu City")
               + group("Mandaue City") + group("Talisay City") + group("Naga") + '</div>' + fade(64) + '</div>')
    inner = ('<div style="' + TITLE + ' margin-top: 8px;">Add areas</div>' + field("Search 232 barangays")
             + '<div style="' + CAPTION + MUTED + '">Your barangay is on your Visayan Electric bill.</div>'
             + '<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Apas") + removable_chip("Basak, Mandaue City") + '</div>'
             + listing
             + '<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0 16px 0;">'
             + icon_button("Add 2", plus(15), primary=True) + button("Cancel", ghost=True) + '</div>')
    write("Picker.dc.html", page(inner))


def picker_search():
    def brgy(nm, checked=False):
        return ('<div style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0;">'
                + checkbox(checked) + '<div style="' + BODY + '">' + nm + '</div></div>')

    def group(nm):
        return ('<div style="display: flex; align-items: center; min-height: 48px; border-bottom: ' + BORDER + '; '
                'margin-top: 8px;"><div style="' + HEAD + '">' + nm + '</div></div>')

    listing = ('<div style="position: relative; flex-grow: 1; overflow: hidden;">'
               '<div style="display: flex; flex-direction: column;">'
               + group("Cebu City") + brgy("Basak, Cebu City", True) + brgy("Basak Pardo")
               + group("Mandaue City") + brgy("Basak, Mandaue City", True)
               + group("Talisay City") + brgy("Basak, Talisay City")
               + '</div>' + fade(64) + '</div>')
    inner = ('<div style="' + TITLE + ' margin-top: 8px;">Add areas</div>' + field("Basak", typed=True)
             + '<div style="' + CAPTION + MUTED + '">Four barangays share this name, so each one shows its city.</div>'
             + '<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Basak, Cebu City") + removable_chip("Basak, Mandaue City") + '</div>'
             + '<div style="margin-top: 2px;">' + iconed(warn(13, SLATE),
               "You&#39;ll get alerts for 5 areas, which may be frequent.", CAPTION + MUTED) + '</div>'
             + listing
             + '<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0 16px 0;">'
             + icon_button("Add 2", plus(15), primary=True) + button("Cancel", ghost=True) + '</div>')
    write("PickerSearch.dc.html", page(inner))


def screen_head(title):
    return ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">' + title + '</div>' + back_btn() + '</div>')


def all_areas():
    cards = (upcoming_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas, Cebu City", "Lahug, Cebu City"],
                           CARD_TINTS[0], following=True)
             + upcoming_card("Fri, Sep 11", "8:00 AM – 12:00 PM · 4h",
                             ["Basak, Mandaue City", "Tipolo, Mandaue City"], CARD_TINTS[1])
             + upcoming_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Colon, Naga", "Tinaan, Naga"],
                             CARD_TINTS[2], note="Some areas couldn&#39;t be matched")
             + upcoming_card("Advisory", "Couldn&#39;t read this one. Tap to view the original.",
                             ["Poblacion, Liloan"], NOTICE, pattern=False, no_time=True))
    inner = (screen_head("All areas") + field("Search by barangay")
             + '<div style="' + CAPTION + MUTED + '">14 scheduled. Viewing here doesn&#39;t add alerts.</div>'
             + cards + fade())
    write("AllAreas.dc.html", page(inner))


def all_areas_no_match():
    inner = (screen_head("All areas") + field("Talamban", typed=True)
             + '<div style="' + CAPTION + MUTED + '">0 scheduled. Viewing here doesn&#39;t add alerts.</div>'
             + '<div style="margin-top: 24px;">' + iconed(magnifier(16, SLATE), "No scheduled outages match.",
                                                          BODY + MUTED) + '</div>')
    write("AllAreasNoMatch.dc.html", page(inner))


def _quote(areas, purpose):
    return ('<div style="border-left: 3px solid ' + ACCENT + '; padding-left: 16px; display: flex; '
            'flex-direction: column; gap: 6px;">'
            + iconed(pin_icon(13, SLATE), "Areas affected", CAPTION + MUTED)
            + '<div style="' + BODY + '">' + areas + '</div>'
            + '<div style="margin-top: 8px;">' + iconed(doc_icon(13, SLATE), "Purpose", CAPTION + MUTED) + '</div>'
            + '<div style="' + BODY + '">' + purpose + '</div></div>')


def _detail(name, title, when, chips, notice, areas, purpose):
    inner = (screen_head(title)
             + (('<div style="margin-top: 2px;">' + iconed(clock_icon(16), when, HEAD) + '</div>') if when else '')
             + '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + "".join(pin_chip(c) for c in chips) + '</div>'
             + (notice or '')
             + '<div style="' + LABEL + ' margin-top: 16px;">FROM VISAYAN ELECTRIC</div>' + _quote(areas, purpose)
             + '<div style="' + CAPTION + MUTED + '">Quoted as published. Outages often affect only part of a '
               'barangay.</div>'
             + '<div style="margin-top: 16px;">' + icon_button("View original post", ext_icon(14, INK)) + '</div>')
    write(name, page(inner))


def detail():
    notice = ('<div style="background: ' + NOTICE + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
              'padding: 16px;">' + notice_row(warn(16), "Some area names couldn&#39;t be matched. The original is "
              "linked below.", "Couldn&#39;t match Sitio Kalubihan or Villa Aurora Subd.") + '</div>')
    _detail("Detail.dc.html", "Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas", "Lahug"], notice,
            "Portion of Brgy. Apas and Brgy. Lahug, Cebu City along Salinas Drive, Nasipit, Sitio Kalubihan, "
            "Villa Aurora Subd. and nearby areas",
            "Replacement of deteriorated poles and re-stringing of primary lines")


def detail_variants():
    _detail("DetailClean.dc.html", "Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas", "Lahug"], None,
            "Portion of Brgy. Apas and Brgy. Lahug, Cebu City along Salinas Drive, Nasipit and nearby areas",
            "Replacement of deteriorated poles and re-stringing of primary lines")

    notice = ('<div style="background: ' + NOTICE + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
              'padding: 16px;">' + notice_row(warn(16), "PAWER couldn&#39;t read the time on this advisory. The "
              "original is linked below.") + '</div>')
    _detail("DetailFailed.dc.html", "Advisory", None, ["Poblacion, Liloan"], notice,
            "Portion of Brgy. Poblacion, Liloan and nearby areas", "Upgrading of distribution transformer")

    inner = (screen_head("Not found")
             + '<div style="margin-top: 8px;">' + notice_row(warn(16, SLATE),
               "This advisory is no longer in the saved data.") + '</div>')
    write("DetailNotFound.dc.html", page(inner))


def _settings(name, areas_html, data_line, about=None):
    def alert_row(icon, nm, hint, on=True):
        return ('<div style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; '
                'border-bottom: 2px solid ' + SURFACE2 + '; padding: 8px 0; gap: 12px;">'
                '<div style="flex-shrink: 0;">' + icon + '</div>'
                '<div style="flex-grow: 1; display: flex; flex-direction: column;">'
                '<div style="' + BODY + '">' + nm + '</div>'
                '<div style="' + CAPTION + MUTED + '">' + hint + '</div></div>' + toggle(on) + '</div>')

    inner = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
             '<div style="' + TITLE + '">Settings</div>' + button("Done", ghost=True) + '</div>'
             + section_label("MY AREAS", pin_icon(13)) + areas_html
             + icon_button("Add area", plus(15), primary=True)
             + '<div style="margin-top: 20px;">' + section_label("ALERTS", bell(13)) + '</div>'
             + alert_row(bell(16), "New advisory", "A new outage is scheduled")
             + alert_row(moon(16), "Evening before", "Around 8:00 PM")
             + alert_row(clock_icon(16), "An hour before", "Give or take a few minutes", on=False)
             + alert_row(bolt(16), "Expected restoration", "When the window ends")
             + alert_row(speaker(16), "Sounds", "Respects silent mode")
             + '<div style="margin-top: 20px;">' + section_label("DATA", refresh(13)) + '</div>'
             + iconed(clock_icon(15), data_line, BODY)
             + icon_button("Refresh now", refresh(15))
             + (('<div style="margin-top: 20px;">' + section_label("ABOUT", info(13)) + '</div>'
                 + '<div style="' + BODY + MUTED + '">' + about + '</div>') if about else '')
             + fade())
    write(name, page(inner))


def settings():
    chips = ('<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Lahug") + removable_chip("Mabolo") + '</div>')
    _settings("Settings.dc.html", chips, "Last checked 9:04 PM",
              about="PAWER reads Visayan Electric&#39;s public advisories. It isn&#39;t made by them and isn&#39;t "
                    "affiliated with them. It covers scheduled outages only, and shows the published schedule rather "
                    "than the real state of the grid.")


def settings_empty():
    _settings("SettingsEmpty.dc.html", '<div style="' + BODY + MUTED + '">None yet.</div>', "Not checked yet")


# ================================================================ empty, loading, error
def bolt_off(size=15, tone=None):
    return _svg('<path d="M9.4 1.7L3.5 9.1h3.4l-.5 5.3 5.9-7.7H8.8l.6-5Z" stroke="@" stroke-width="2" '
                'stroke-linejoin="round"/>'
                '<path d="M1.8 1.8l12.4 12.4" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def cloud_off(size=15, tone=None):
    return _svg('<path d="M4.4 12.2h6.6a3 3 0 0 0 .3-6 4 4 0 0 0-7.3-1.2 3.1 3.1 0 0 0 .4 7.2Z" stroke="@" '
                'stroke-width="2" stroke-linejoin="round"/>'
                '<path d="M1.8 1.8l12.4 12.4" stroke="@" stroke-width="2" stroke-linecap="round"/>', size, tone)


def clear_mark(size=58):
    """Good news needs a mark that says so. A green disc alone is decoration; the tick is the message."""
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 58 58" fill="none" aria-hidden="true">'
            f'<circle cx="29" cy="29" r="26.5" fill="{CLEAR}" stroke="{INK}" stroke-width="2.5"/>'
            f'<path d="M17.5 30.5l7.8 7.8L41 20.5" stroke="{INK}" stroke-width="3.6" stroke-linecap="round" '
            f'stroke-linejoin="round"/></svg>')


def bar(width, h=14, fill=SURFACE2):
    return f'<div style="width: {width}; height: {h}px; background: {fill}; border-radius: 3px;"></div>'


def code_chip(code):
    """Neutral surface, never a status colour — a status hue here would read as an outage."""
    return ('<div style="display: inline-flex; align-items: center; border: ' + BORDER + '; '
            'border-radius: ' + RADIUS + '; background: ' + SURFACE2 + '; padding: 5px 11px;">'
            '<div style="' + LABEL + ' letter-spacing: 0.10em;">' + code + '</div></div>')


def state_screen(name, mark, display, body, primary, secondary=None, code=None, foot=None, shapes=""):
    """One shape for every dead end: a mark, a plain sentence, and exactly one obvious way out."""
    head = ('<div style="display: flex; align-items: center; gap: 12px;">' + mark
            + (('<div style="margin-left: auto;">' + code_chip(code) + '</div>') if code else '') + '</div>')
    inner = (shapes
             + '<div style="position: relative; z-index: 1; flex-grow: 1; display: flex; flex-direction: column; '
               'justify-content: center; gap: 16px;">'
             + head
             + '<div style="' + DISPLAY + ' font-size: 34px; line-height: 36px;">' + display + '</div>'
             + '<div style="' + BODY + '">' + body + '</div>'
             + (('<div style="' + CAPTION + MUTED + '">' + foot + '</div>') if foot else '')
             + '</div>'
             + '<div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; '
               'margin-bottom: 28px;">' + primary + (secondary or '') + '</div>')
    write(name, page(inner, gap=0))


def error_screens():
    state_screen("ErrOffline.dc.html", cloud_off(30), "No connection",
                 "PAWER needs the internet to fetch new advisories. Everything already saved is still here.",
                 icon_button("Try again", refresh(15), primary=True),
                 button("Use saved data", ghost=True),
                 shapes=floater(burst(84, ENDED), top=60, right=-22, cls="turn")
                        + floater(disc(28, UPCOMING), top=200, left=-10, cls="bob", delay="0.6s"))

    state_screen("ErrFeed.dc.html", warn(30), "Can&#39;t reach the schedule",
                 "PAWER&#39;s data feed did not answer. This one is on our side, not yours.",
                 icon_button("Try again", refresh(15), primary=True),
                 button("Use saved data", ghost=True),
                 code="503",
                 shapes=floater(squiggle(80, 28, INK), bottom=290, left=-14, cls="bob"))

    state_screen("ErrUpdate.dc.html", bolt(30), "Time for an update",
                 "VECO&#39;s advisories now use a newer format than this copy of PAWER can read.",
                 icon_button("Get the update", ext_icon(15, INK), primary=True),
                 button("Not now", ghost=True),
                 foot="Your saved schedule still works, but new advisories will not appear until you update.",
                 shapes=floater(burst(92, CLEAR), top=48, left=-30, cls="turn")
                        + floater(sparkle(34, ACCENT), bottom=260, right=-8, cls="drift", delay="0.5s"))

    state_screen("ErrUnknown.dc.html", bolt_off(30), "Something broke",
                 "PAWER hit an error it did not expect.",
                 icon_button("Restart PAWER", refresh(15), primary=True),
                 code="500",
                 shapes=floater(disc(70, ONGOING), bottom=230, right=-26, cls="drift"))


def picker_no_match():
    empty = ('<div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; '
             'align-items: center; justify-content: center; gap: 12px; padding: 0 20px;">'
             + magnifier(34, SLATE)
             + '<div style="' + HEAD + ' text-align: center;">No barangay matches that</div>'
             + '<div style="' + BODY + MUTED + ' text-align: center;">Try fewer letters, or check the spelling '
               'against your VECO bill.</div></div>')
    inner = ('<div style="' + TITLE + ' margin-top: 8px;">Add areas</div>' + field("Talambn", typed=True)
             + '<div style="' + CAPTION + MUTED + '">Searching all 232 barangays.</div>'
             + empty
             + '<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0 16px 0;">'
             + button("Add", primary=True, state="disabled") + button("Cancel", ghost=True) + '</div>')
    write("PickerNoMatch.dc.html", page(inner))


def all_areas_empty():
    empty = ('<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; '
             'justify-content: center; gap: 14px;">' + clear_mark(58)
             + '<div style="' + HEAD + ' text-align: center;">Nothing scheduled right now</div>'
             + '<div style="' + BODY + MUTED + ' text-align: center;">Visayan Electric has not published any '
               'interruptions for the coming week.</div></div>')
    inner = (screen_head("All areas") + field("Search by barangay")
             + '<div style="' + CAPTION + MUTED + '">0 scheduled across the franchise.</div>' + empty)
    write("AllAreasEmpty.dc.html", page(inner))


# ---- skeletons. No shimmer: DG 11 forbids it, and a pulse is a loop. -------------------------
def skel_block(height, rows, fill=GROUND):
    body = "".join('<div style="margin-bottom: 10px;">' + bar(w, h) + '</div>' for w, h in rows)
    return ('<div style="background: ' + fill + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'box-shadow: ' + SHADOW + '; padding: 16px; margin-bottom: 4px; min-height: ' + str(height) + 'px;">'
            + body + '</div>')


def dash_skeleton():
    hero = ('<div style="background: ' + GROUND + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'box-shadow: ' + SHADOW + '; padding: 24px; min-height: 210px; display: flex; flex-direction: column; '
            'gap: 14px;">' + bar("38%", 13) + bar("88%", 34) + bar("64%", 34) + bar("74%", 18) + bar("42%", 14)
            + '</div>')
    cards = ('<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">'
             '<div style="' + LABEL + MUTED + ' margin-top: 4px;">UPCOMING</div>'
             + skel_block(96, [("46%", 18), ("70%", 15), ("54%", 22)])
             + skel_block(96, [("38%", 18), ("66%", 15), ("34%", 22)]) + '</div>')
    inner = ('<div style="height: ' + str(STATUS_GAP) + 'px;"></div>' + app_header()
             + '<div style="padding: 0 20px;">' + hero + '</div>'
             + '<div style="display: flex; justify-content: space-between; padding: 0 20px;">'
             + bar("34%", 12) + bar("18%", 12) + '</div>'
             + cards
             + '<div style="padding: 0 20px; margin-top: 22px; display: flex; align-items: center; gap: 10px;">'
             + iconed(refresh(14, SLATE), "Fetching this week&#39;s advisories", CAPTION + MUTED) + '</div>')
    write("DashSkeleton.dc.html", page(inner, pad="0", gap=12))


def all_areas_skeleton():
    inner = (screen_head("All areas") + field("Search by barangay") + bar("58%", 12)
             + '<div style="height: 6px;"></div>'
             + skel_block(104, [("44%", 18), ("68%", 15), ("58%", 22)])
             + skel_block(104, [("36%", 18), ("72%", 15), ("46%", 22)])
             + skel_block(104, [("50%", 18), ("62%", 15), ("64%", 22)])
             + '<div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">'
             + iconed(refresh(14, SLATE), "Fetching this week&#39;s advisories", CAPTION + MUTED) + '</div>'
             + fade())
    write("AllAreasSkeleton.dc.html", page(inner))


def state_boards():
    picker_no_match(); all_areas_empty(); dash_skeleton(); all_areas_skeleton(); error_screens()


SCRIM = "rgba(33, 36, 49, 0.32)"   # a recede, not a blackout


def scrim_around(x, y, w, h):
    """Four rectangles, so the target keeps its real colours and stays tappable."""
    return (f'<div style="position: absolute; left: 0; top: 0; width: {SCREEN_W}px; height: {y}px; background: {SCRIM};"></div>'
            f'<div style="position: absolute; left: 0; top: {y}px; width: {x}px; height: {h}px; background: {SCRIM};"></div>'
            f'<div style="position: absolute; left: {x + w}px; top: {y}px; width: {SCREEN_W - x - w}px; height: {h}px; background: {SCRIM};"></div>'
            f'<div style="position: absolute; left: 0; top: {y + h}px; width: {SCREEN_W}px; bottom: 0; background: {SCRIM};"></div>'
            f'<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; '
            f'border: 2px solid {ACCENT}; border-radius: {RADIUS}; box-sizing: border-box;"></div>')


def tour_callout(title, body, actions, top):
    """The message sits ABOVE the scrim, so it is never dimmed."""
    return (f'<div style="position: absolute; left: 20px; right: 20px; top: {top}px; '
            'display: flex; flex-direction: column; gap: 12px;">'
            + block('<div style="' + TITLE + '">' + title + '</div>'
                    '<div style="' + BODY + ' margin-top: 8px;">' + body + '</div>'
                    '<div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' + actions + '</div>')
            + '<div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">'
              '<div style="' + LABEL + '">Skip for now</div></div></div>')


def tour():
    """T1 — the one step that highlights a control already on screen."""
    pad = 6
    x, y = ADD_BTN_LEFT - pad, ADD_BTN_TOP - pad
    w, h = (SCREEN_W - ADD_BTN_LEFT * 2) + pad * 2, TOUCH + pad * 2
    behind = ('<div style="position: absolute; inset: 0; display: flex; flex-direction: column; gap: '
              + str(STACK_GAP) + 'px;">' + empty_dashboard_body() + '</div>')
    callout = tour_callout("Where do you live?",
                           "Pick your barangay and PAWER will keep an eye on it for you.",
                           button("Add area", primary=True), y + h + 24)
    inner = ('<div style="width: 390px; height: 980px; ' + CHECKER + ' position: relative; overflow: hidden;">'
             + behind + scrim_around(x, y, w, h) + callout + '</div>')
    write("Tour.dc.html", inner)


def tour_centre():
    """T7 — the shape every other step takes. Nothing on screen to highlight, so the whole
    background recedes and only the message stays lit."""
    behind = ('<div style="position: absolute; inset: 0; display: flex; flex-direction: column; gap: '
              + str(STACK_GAP) + 'px;">' + empty_dashboard_body() + '</div>')
    full = f'<div style="position: absolute; inset: 0; background: {SCRIM};"></div>'
    callout = tour_callout("Want it on your home screen?",
                           "One tap and you can see the day&#39;s status without opening anything.",
                           button("Add widget", primary=True) + button("Maybe later"), 300)
    inner = ('<div style="width: 390px; height: 980px; ' + CHECKER + ' position: relative; overflow: hidden;">'
             + behind + full + callout + '</div>')
    write("TourCentre.dc.html", inner)


if __name__ == "__main__":
    assert ADD_BTN_TOP == 262 and ADD_BTN_LEFT == 46, (ADD_BTN_TOP, ADD_BTN_LEFT)
    all_dashboards(); dashboard_empty(); component_states(); picker(); picker_search()
    all_areas(); all_areas_no_match(); detail(); detail_variants(); settings(); settings_empty()
    state_boards()
    onboarding_all(); tour(); tour_centre()
    print(f"done — tour highlight anchored to the Add area button at y {ADD_BTN_TOP}..{ADD_BTN_TOP+TOUCH}")
