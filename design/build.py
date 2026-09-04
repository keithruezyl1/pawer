"""
Regenerates the PAWER design artboards.

One shared shell (embedded fonts, checkerboard ground, token constants) so nine artboards can
never drift apart. Run:  python design/build.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FACES = open(os.path.join(HERE, "fonts", "faces.css"), encoding="utf-8").read()

# --- tokens (mirrors app/src/theme/tokens.ts + packages/shared/src/palette.ts) ---
GROUND, SURFACE2, SLATE, INK, ACCENT, NOTICE = "#F5F5F5", "#D6D7D7", "#4F5D75", "#212431", "#EA5C1F", "#DDE0E6"
CLEAR, UPCOMING, ONGOING, ENDED = "#9BF06B", "#FF90E8", "#FF5C5C", "#FFD93D"
BORDER, SHADOW, RADIUS = "2px solid " + INK, "4px 4px 0 " + INK, "5px"

DISPLAY = "font-family: 'Getai Grotesk', Impact, sans-serif; font-weight: 900; font-size: 40px; line-height: 42px; letter-spacing: -0.02em;"
TITLE   = "font-family: 'Getai Grotesk', Impact, sans-serif; font-weight: 900; font-size: 24px; line-height: 28px; letter-spacing: -0.01em;"
HEAD    = "font-family: Aspekta, system-ui, sans-serif; font-weight: 700; font-size: 18px; line-height: 23px;"
BODY    = "font-family: Aspekta, system-ui, sans-serif; font-weight: 400; font-size: 15px; line-height: 21px;"
LABEL   = "font-family: Aspekta, system-ui, sans-serif; font-weight: 500; font-size: 13px; line-height: 17px;"
CAPTION = "font-family: Aspekta, system-ui, sans-serif; font-weight: 400; font-size: 11px; line-height: 14px;"
MUTED   = " color: " + SLATE + ";"

CHECKER = (
    "background-color: " + GROUND + "; "
    "background-image: repeating-conic-gradient(rgba(33,36,49,0.045) 0% 25%, transparent 0% 50%); "
    "background-size: 24px 24px;"
)

def block(inner, fill=GROUND, pad=24, shadow=True, style=""):
    sh = ("box-shadow: " + SHADOW + "; ") if shadow else ""
    return ('<div style="background: ' + fill + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            + sh + 'padding: ' + str(pad) + 'px; ' + style + '">' + inner + '</div>')

def button(label, primary=False, ghost=False):
    if ghost:
        return ('<div style="min-height: 48px; display: flex; align-items: center; justify-content: center; padding: 12px;">'
                '<div style="' + LABEL + '">' + label + '</div></div>')
    fill = ACCENT if primary else GROUND
    return ('<div style="min-height: 48px; background: ' + fill + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
            'box-shadow: ' + SHADOW + '; display: flex; align-items: center; justify-content: center; padding: 12px 24px;">'
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

def toggle(on=True):
    fill = INK if on else SURFACE2
    just = "flex-end" if on else "flex-start"
    return ('<div style="width: 50px; height: 30px; border: ' + BORDER + '; border-radius: 15px; background: ' + fill + '; '
            'display: flex; align-items: center; justify-content: ' + just + '; padding: 2px; box-sizing: border-box; flex-shrink: 0;">'
            '<div style="width: 22px; height: 22px; border-radius: 11px; background: ' + GROUND + ';"></div></div>')

def statusbar_gap():
    return '<div style="height: 28px;"></div>'

def app_header(title="PAWER"):
    dots = "".join('<div style="width: 5px; height: 5px; background: ' + INK + ';"></div>' for _ in range(3))
    return ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 20px;">'
            '<div style="' + TITLE + ' font-size: 26px;">' + title + '</div>'
            '<div style="width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; '
            'justify-content: center; gap: 4px;">' + dots + '</div></div>')

def page(inner, h=980, pad="28px 20px 0 20px", gap=12, checker=True):
    bg = CHECKER if checker else ("background: " + GROUND + ";")
    return ('<div style="width: 390px; height: ' + str(h) + 'px; ' + bg + ' display: flex; flex-direction: column; '
            'padding: ' + pad + '; gap: ' + str(gap) + 'px; box-sizing: border-box; overflow: hidden;">' + inner + '</div>')

def doc(inner):
    return (
        "<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n"
        "  <script src=\"./support.js\"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n<style>\n"
        + FACES +
        "body { margin: 0; font-family: Aspekta, system-ui, sans-serif; color: " + INK + "; }\n"
        "a { color: " + ACCENT + "; } a:hover { color: #C24A16; }\n"
        "</style>\n</helmet>\n" + inner + "\n</x-dc>\n</body>\n</html>\n"
    )

def write(name, inner):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as fh:
        fh.write(doc(inner))
    print("  wrote", name)

# ---------------------------------------------------------------- hero
def hero(fill, tag, display, detail, area):
    inner = (
        '<div style="display: flex; flex-direction: column; gap: 8px;">'
        '<div style="' + LABEL + '">' + tag + '</div>'
        '<div style="' + DISPLAY + ' margin-top: 4px;">' + display + '</div>'
        '<div style="' + HEAD + '">' + detail + '</div>'
        + ('<div style="' + LABEL + ' margin-top: 4px;">' + area + '</div>' if area else '') +
        '</div>'
    )
    return block(inner, fill=fill, style="min-height: 210px;")

# ---------------------------------------------------------------- outage card
def outage_card(date, window, chips, note=None, fill=GROUND, following=False):
    head = ('<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">'
            '<div style="' + HEAD + '">' + date + '</div>'
            + ('<div style="' + CAPTION + MUTED + '">Following</div>' if following else '') + '</div>')
    body = '<div style="' + BODY + '">' + window + '</div>'
    n = ('<div style="' + CAPTION + MUTED + ' margin-top: 4px;">' + note + '</div>') if note else ''
    ch = ('<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">'
          + "".join(chip(c) for c in chips) + '</div>')
    return block(head + body + n + ch, fill=fill, pad=16, style="margin-bottom: 4px;")

# ================================================================ artboards

def main_dashboard():
    freshness = ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px;">'
                 '<div style="' + CAPTION + MUTED + '">Checked 4 min ago</div>'
                 '<div style="' + CAPTION + MUTED + '">2 scheduled</div></div>')
    cards = ('<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">'
             + outage_card("Tomorrow", "9:00 AM – 3:00 PM · 6h", ["Apas", "Lahug"])
             + outage_card("Sat, Sep 12", "8:00 AM – 5:00 PM · 9h", ["Mabolo"])
             + '</div>')
    foot = ('<div style="padding: 0 20px; margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">'
            '<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
            'border-top: ' + BORDER + '; border-bottom: ' + BORDER + ';">'
            '<div style="' + LABEL + '">Browse all areas</div>' + CHEVRON + '</div>'
            '<div style="' + CAPTION + MUTED + '">Unofficial · scheduled outages only</div></div>')
    inner = (statusbar_gap() + app_header()
             + '<div style="padding: 0 20px;">' + hero(ONGOING, "SCHEDULED · NOW", "Outage in progress",
                                                       "Expected back 3:00 PM · 2h 10m left", "Part of Lahug") + '</div>'
             + freshness + cards + foot)
    write("Main.dc.html", page(inner, pad="0", gap=12))

def dashboard_empty():
    card = block('<div style="' + LABEL + '">TODAY</div>'
                 '<div style="' + DISPLAY + ' margin-top: 8px;">No areas yet</div>'
                 '<div style="' + BODY + ' margin-top: 8px;">Add your barangay to see its schedule.</div>'
                 '<div style="margin-top: 24px;">' + button("Add area", primary=True) + '</div>')
    foot = ('<div style="padding: 0 20px; margin-top: 24px; display: flex; flex-direction: column; gap: 10px;">'
            '<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
            'border-top: ' + BORDER + '; border-bottom: ' + BORDER + ';">'
            '<div style="' + LABEL + '">Browse all areas</div>' + CHEVRON + '</div>'
            '<div style="' + CAPTION + MUTED + '">Unofficial · scheduled outages only</div></div>')
    inner = statusbar_gap() + app_header() + '<div style="padding: 0 20px;">' + card + '</div>' + foot
    write("DashboardEmpty.dc.html", page(inner, pad="0", gap=12))

def status_states():
    rows = []
    for label, fill, tag, disp, detail in [
        ("NONE_TODAY · " + CLEAR, CLEAR, "TODAY", "No outage today", "Next: Sat, Sep 12 · 8:00 AM"),
        ("UPCOMING_TODAY · " + UPCOMING, UPCOMING, "SCHEDULED · TODAY", "Outage in 3h 20m", "9:00 AM – 3:00 PM · 6h"),
        ("ONGOING · " + ONGOING, ONGOING, "SCHEDULED · NOW", "Outage in progress", "Expected back 3:00 PM · 2h 10m left"),
        ("ENDED_TODAY · " + ENDED, ENDED, "TODAY", "Power should be back", "Outage ended 3:00 PM"),
    ]:
        rows.append('<div style="display: flex; flex-direction: column; gap: 6px;">'
                    '<div style="' + CAPTION + MUTED + '">' + label + '</div>'
                    + hero(fill, tag, disp, detail, "Part of Lahug") + '</div>')
    head = ('<div style="display: flex; flex-direction: column; gap: 4px;">'
            '<div style="' + TITLE + '">Hero states</div>'
            '<div style="' + CAPTION + MUTED + '">The widget mirrors these exactly.</div></div>')
    write("StatusStates.dc.html", page(head + "".join(rows), h=1180, gap=18))

def picker():
    field = ('<div style="min-height: 48px; background: ' + GROUND + '; border: ' + BORDER + '; border-radius: ' + RADIUS + '; '
             'padding: 12px 16px; display: flex; align-items: center; box-sizing: border-box;">'
             '<div style="' + BODY + MUTED + '">Search 232 barangays</div></div>')
    chips = ('<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Apas") + removable_chip("Basak, Mandaue City") + '</div>')

    def row(name, checked=False, dimmed=False, note=None):
        box = ('<div style="width: 24px; height: 24px; border: ' + BORDER + '; border-radius: 4px; background: '
               + (ACCENT if checked else GROUND) + '; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">'
               + ('<div style="width: 10px; height: 10px; background: ' + INK + ';"></div>' if checked else '') + '</div>')
        n = ('<div style="' + CAPTION + MUTED + '">' + note + '</div>') if note else ''
        return ('<div style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 0;'
                + (' opacity: 0.55;' if dimmed else '') + '">' + box
                + '<div style="' + BODY + '">' + name + '</div>' + n + '</div>')

    def group(name, open_=False):
        return ('<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; '
                'border-bottom: ' + BORDER + '; margin-top: 8px;">'
                '<div style="' + HEAD + '">' + name + '</div>'
                '<div style="' + HEAD + '">' + ("–" if open_ else "+") + '</div></div>')

    listing = ('<div style="display: flex; flex-direction: column; flex-grow: 1;">'
               + group("Cebu City", True) + row("Apas", checked=True) + row("Lahug", checked=True, dimmed=True, note="added")
               + row("Mabolo") + row("Basak, Cebu City")
               + group("Mandaue City") + group("Talisay City") + group("Naga") + '</div>')
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
             + outage_card("Advisory", "Couldn't read this one — tap to view the original", ["Poblacion, Liloan"], fill=NOTICE))
    write("AllAreas.dc.html", page(head + field + note + cards))

def detail():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">Tomorrow</div>' + button("Back", ghost=True) + '</div>')
    when = '<div style="' + HEAD + '">9:00 AM – 3:00 PM · 6h</div>'
    chips = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + chip("Apas") + chip("Lahug") + '</div>'
    notice = block('<div style="' + BODY + '">Some area names couldn\'t be matched. The original is linked below.</div>'
                   '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Unmatched: Sitio Kalubihan, Villa Aurora Subd.</div>',
                   fill=NOTICE, pad=16, shadow=False)
    quote = ('<div style="border-left: 3px solid ' + ACCENT + '; padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">'
             '<div style="' + CAPTION + MUTED + '">Areas affected</div>'
             '<div style="' + BODY + '">Portion of Brgy. Apas and Brgy. Lahug, Cebu City along Salinas Drive, Nasipit, '
             'Sitio Kalubihan, Villa Aurora Subd. and nearby areas</div>'
             '<div style="' + CAPTION + MUTED + ' margin-top: 8px;">Purpose</div>'
             '<div style="' + BODY + '">Replacement of deteriorated poles and re-stringing of primary lines</div></div>')
    inner = (head + when + chips + notice
             + '<div style="' + LABEL + ' margin-top: 16px;">FROM VISAYAN ELECTRIC</div>' + quote
             + '<div style="' + CAPTION + MUTED + '">Quoted as published. Outages often affect only part of a barangay.</div>'
             + '<div style="margin-top: 16px;">' + button("View original post") + '</div>')
    write("Detail.dc.html", page(inner))

def settings():
    head = ('<div style="display: flex; justify-content: space-between; align-items: center;">'
            '<div style="' + TITLE + '">Settings</div>' + button("Done", ghost=True) + '</div>')
    chips = ('<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
             + removable_chip("Lahug") + removable_chip("Mabolo") + '</div>')

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
    inner = (head
             + '<div style="' + LABEL + '">MY AREAS</div>' + chips + button("Add area", primary=True)
             + '<div style="' + LABEL + ' margin-top: 20px;">ALERTS</div>' + alerts
             + '<div style="' + LABEL + ' margin-top: 20px;">DATA</div>'
             + '<div style="' + BODY + '">Last checked 9:04 PM</div>' + button("Refresh now")
             + '<div style="' + LABEL + ' margin-top: 20px;">ABOUT</div>'
             + '<div style="' + BODY + MUTED + '">PAWER reads Visayan Electric\'s public advisories. Not affiliated with them. '
               'Scheduled outages only — it shows the published schedule, not the state of the grid.</div>')
    write("Settings.dc.html", page(inner))

def onboarding():
    def item(icon, text):
        return ('<div style="display: flex; gap: 12px; align-items: flex-start;">' + icon
                + '<div style="' + BODY + '">' + text + '</div></div>')
    body = ('<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px;">'
            '<div style="' + TITLE + '">What PAWER can and can\'t tell you</div>'
            + item(CHECK, "Scheduled outages, days ahead")
            + item(CHECK, "When one starts, and when power should return")
            + block(item(CROSS, "Sudden outages. Visayan Electric doesn\'t publish these ahead, so PAWER can\'t warn you."),
                    fill=NOTICE, pad=16, shadow=False)
            + '<div style="' + CAPTION + MUTED + '">Not affiliated with Visayan Electric. Don\'t rely on it for anything '
              'medical or safety-critical.</div></div>')
    inner = (body + '<div style="margin-bottom: 16px;">' + button("Got it", primary=True) + '</div>'
             + '<div style="' + CAPTION + MUTED + ' text-align: center; margin-bottom: 20px;">3 of 5</div>')
    write("Onboarding.dc.html", page(inner, gap=0))

def tour():
    behind = ('<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">'
              + statusbar_gap() + app_header()
              + '<div style="padding: 0 20px;">'
              + block('<div style="' + LABEL + '">TODAY</div>'
                      '<div style="' + DISPLAY + ' margin-top: 8px;">No areas yet</div>'
                      '<div style="' + BODY + ' margin-top: 8px;">Add your barangay to see its schedule.</div>'
                      '<div style="margin-top: 24px;">' + button("Add area", primary=True) + '</div>')
              + '</div></div>')
    scrim = "rgba(33,36,49,0.72)"
    cuts = ('<div style="position: absolute; left: 0; top: 0; width: 390px; height: 300px; background: ' + scrim + ';"></div>'
            '<div style="position: absolute; left: 0; top: 300px; width: 38px; height: 64px; background: ' + scrim + ';"></div>'
            '<div style="position: absolute; left: 352px; top: 300px; width: 38px; height: 64px; background: ' + scrim + ';"></div>'
            '<div style="position: absolute; left: 0; top: 364px; width: 390px; height: 616px; background: ' + scrim + ';"></div>'
            '<div style="position: absolute; left: 38px; top: 300px; width: 314px; height: 64px; border: 2px solid '
            + ACCENT + '; border-radius: ' + RADIUS + '; box-sizing: border-box;"></div>')
    callout = ('<div style="position: absolute; left: 20px; right: 20px; top: 392px; display: flex; flex-direction: column; gap: 12px;">'
               + block('<div style="' + BODY + '">Start here. Add the barangay you want alerts for.</div>'
                       '<div style="margin-top: 16px;">' + button("Add area", primary=True) + '</div>')
               + '<div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">'
                 '<div style="' + LABEL + ' color: ' + GROUND + ';">Skip tour</div></div></div>')
    inner = ('<div style="width: 390px; height: 980px; ' + CHECKER + ' position: relative; overflow: hidden;">'
             + behind + cuts + callout + '</div>')
    write("Tour.dc.html", inner)

if __name__ == "__main__":
    main_dashboard(); dashboard_empty(); status_states(); picker()
    all_areas(); detail(); settings(); onboarding(); tour()
    print("done")
