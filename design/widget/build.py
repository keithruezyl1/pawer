"""
Generates the widget state artboards for the design canvas.

Every number here is lifted from the shipped native source, not eyeballed:
  layout/pawer_widget.xml            paddings, text sizes, margins, maxLines
  drawable/pawer_bg_*.xml            fills, border, 14dp radius, 4dp hard shadow
  xml/pawer_widget_info.xml          the 110dp cell
  WidgetRenderer.kt + widgetState.ts every string, per state

1 CSS px == 1 dp == 1 sp, so anything Keith edits on the canvas is already the
Android value. The canvas pans and zooms, so it does not need scaling up.
"""
import base64, json, pathlib

HERE = pathlib.Path(__file__).parent
RES = HERE / "../../app/modules/pawer-widget/android/src/main/res"

CELL, SHADOW, RADIUS, BORDER = 110, 4, 22, 2
CARD = CELL - SHADOW                      # the layer-list insets the card by the shadow offset
PAD_T, PAD_L = 10 - BORDER, 11 - BORDER   # android:padding is from the view edge, inside the stroke
INK, SLATE, GROUND = "#212431", "#4F5D75", "#F5F5F5"
FILL = {"clear": "#9BF06B", "upcoming": "#FF90E8", "ongoing": "#FF5C5C",
        "ended": "#FFD93D", "stale": "#E9E9E7"}

# The headline is drawn as a bitmap in the app's process, so it is genuinely Getai Grotesk Black.
# The countdown cannot be a bitmap and still tick for free, so it stays a Chronometer in the
# platform's heaviest weight. The other three slots set no fontFamily, so they are the default.
SYS = "Roboto, 'Helvetica Neue', system-ui, sans-serif"
GETAI = base64.b64encode((RES / "font/getai_black.ttf").read_bytes()).decode()

def clamp(lines):
    """maxLines, faithfully: clips at N lines with no ellipsis, because the layout sets none."""
    return (f"display:-webkit-box;-webkit-line-clamp:{lines};-webkit-box-orient:vertical;"
            "overflow:hidden;")

def board(state, tag, display, line3, line4, *, countdown=False, pill=True):
    dashed = state == "stale"
    shadow_col = SLATE if dashed else INK
    border = f"{BORDER}px {'dashed' if dashed else 'solid'} {SLATE if dashed else INK}"
    big = ((f"font-family:{SYS};font-weight:900;font-size:16px;") if countdown else
           # 1.14 = the layout's 0.95 multiplier x Getai's 1.20em natural line box.
           ("font-family:'Getai Grotesk Black',Impact,sans-serif;font-size:13px;line-height:1.14;"))
    face = "" if countdown else f"""
    @font-face {{{{
      font-family: 'Getai Grotesk Black';
      src: url(data:font/ttf;base64,{GETAI}) format('truetype');
      font-weight: 400; font-display: block;
    }}}}"""
    # The area chip, as on the dashboard card. The stale notice is not a place, so it keeps the
    # plain slate line rather than being dressed up as one.
    if not line4:
        four = ""
    elif pill:
        four = (f'<div style="align-self: flex-start; margin-top: 4px; background: {GROUND}; '
                f'border: {BORDER}px solid {INK}; border-radius: 9px; padding: 2px 6px; '
                f'font-size: 9px; font-weight: 700; color: {INK}; {clamp(2)}">{line4}</div>')
    else:
        four = (f'<div style="align-self: flex-start; margin-top: 4px; font-size: 9px; '
                f'font-weight: 700; color: {SLATE}; {clamp(1)}">{line4}</div>')
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;900&display=swap">
  <style>{face}
    body {{ margin: 0; background: transparent; font-family: {SYS}; color: {INK}; }}
    a {{ color: #EA5C1F; }} a:hover {{ color: #C24A16; }}
  </style>
</helmet>
<div style="width: {CELL}px; height: {CELL}px; display: flex; align-items: flex-start; justify-content: flex-start;">
  <div style="width: {CARD}px; height: {CARD}px; box-sizing: border-box; background: {FILL[state]}; border: {border}; border-radius: {RADIUS}px; box-shadow: {SHADOW}px {SHADOW}px 0 {shadow_col}; padding: {PAD_T}px {PAD_L}px; display: flex; flex-direction: column; align-items: stretch; overflow: hidden;">
    <div style="font-size: 9px; letter-spacing: 0.06em; color: {INK}; {clamp(1)}">{tag}</div>
    <div style="margin-top: 2px; overflow-wrap: anywhere; {big} color: {INK}; {clamp(1 if countdown else 2)}">{display}</div>
    <div style="margin-top: 1px; font-size: 7px; font-weight: 700; color: {INK}; {clamp(1)}">{line3}</div>
    <div style="flex: 1;"></div>
    {four}
  </div>
</div>
</x-dc>
</body>
</html>
"""

# Every state WidgetRenderer.render can produce, with the strings deriveWidgetState feeds it.
BOARDS = [
    ("Main",         "Upcoming · counting down", "upcoming", "TODAY",     "3:20:00",     "until 3:00 PM",         "Lahug",  True),
    ("UpcomingSoon", "Upcoming · countdown run out", "upcoming", "TODAY", "Soon",        "until 3:00 PM",         "Lahug",  False),
    # DateUtils.formatElapsedTime drops the hour field under an hour, so this really is "42:00".
    ("Ongoing",      "Ongoing · counting down", "ongoing",  "TODAY",     "42:00",       "until 3:00 PM",         "Lahug",  True),
    ("OngoingNow",   "Ongoing · no countdown",  "ongoing",  "TODAY",     "Outage in-progress", "until 3:00 PM",  "Lahug",  False),
    ("Ended",        "Ended today",             "ended",    "TODAY",     "Restored",    "Should be back by now", "Lahug",  False),
    # No outage at all means no affected areas, so area_label is "" and the chip is hidden.
    ("ClearToday",   "Clear · nothing ahead",   "clear",    "TODAY",     "No outages today", "No scheduled outage", "",  False),
    ("ClearNext",    "Clear · next one known",  "clear",    "NEXT",      "Fri",         "9:00 AM – 5:00 PM",     "Lahug",  False),
    ("TwoToday",     "Two outages today",       "upcoming", "TODAY 1/2", "3:20:00",     "until 3:00 PM",         "2 areas", True),
    ("Stale",        "Stale · over 48h old",    "stale",    "TODAY",     "No outages today", "No scheduled outage", "",  False),
    # Stale is an overlay on ANY state, not just a clear one: the background swaps, the text does not.
    ("StaleCounting","Stale · still counting down", "stale", "TODAY",    "3:20:00",     "until 3:00 PM",         "Lahug",  True),
    ("Unconfigured", "No barangay yet",         "clear",    "PAWER",     "No location set in app", "Add your barangay", "", False),
    # The longest countdown reachable: an outage later today, read just after midnight.
    ("LongCountdown","Widest countdown",        "upcoming", "TODAY",     "22:55:00",    "until 11:00 PM",        "Lahug",  True),
    # Worst case in every slot AT ONCE, and reachable: only NONE_TODAY puts a window on line 3, so
    # the tag is NEXT and the headline is the day. formatWindow keeps both weekdays across midnight.
    ("Longest",      "Worst case · longest strings", "clear", "NEXT",   "Tomorrow",    "10:00 PM Fri – 6:00 AM Sat", "San Isidro, San Fernando", False),
]


for name, _title, state, tag, display, line3, line4, cd in BOARDS:
    (HERE / f"{name}.dc.html").write_text(
        board(state, tag, display, line3, line4, countdown=cd, pill=(state != "stale")), encoding="utf-8")

FRAME, GAP_X, GAP_Y, PER_ROW = 110, 80, 130, 5   # the frame IS the 110dp cell now
artboards, titles = [], {n: t for n, t, *_ in BOARDS}
for i, (name, *_rest) in enumerate(BOARDS):
    artboards.append({"file": f"{name}.dc.html", "title": titles[name],
                      "x": (i % PER_ROW) * (FRAME + GAP_X),
                      "y": (i // PER_ROW) * (FRAME + GAP_Y),
                      "w": FRAME, "h": FRAME})

canvas = {
    "artboards": artboards,
    "annotations": [
        {"id": "scale", "x": 0, "y": -210, "w": 430,
         "text": "1 px here = 1 dp on the phone, so every size you change is already the Android "
                 "value. Zoom the canvas in to work; the widget really is this small.\n\n"
                 "The widget is fixed at 2x2 and cannot be resized.\n\n"
                 "The cell is 110x110 dp. The card is 106 and sits top-left, so its 4 dp hard "
                 "shadow lands inside the cell and no launcher clips it.\n\n"
                 "Nothing else is painted. The strip past the shadow and the two small corners are "
                 "transparent, so your wallpaper shows through. The chip is the only part of the "
                 "widget that is really white."},
        {"id": "autosize", "x": 500, "y": -210, "w": 430,
         "text": "Each size here is the one that fits the longest text that slot can ever hold, "
                 "with no help. That is why the time looks small.\n\n"
                 "Android 9 and up resizes each slot to fit the space, up or down, so short text "
                 "grows back and nothing is ever cut off. Only Android 8 and older see exactly "
                 "these sizes.\n\n"
                 "So treat these as the floor, not the finished look."},
        {"id": "faces", "x": 1000, "y": -210, "w": 430,
         "text": "The big line is Getai Grotesk Black, same as the dashboard card. The other lines "
                 "use the phone's own font, which is what the widget actually does.\n\n"
                 "Exported PNGs and PDFs substitute a different face for the small text, so judge "
                 "that here on the canvas rather than in an export."},
    ],
    "launch": {"view": "canvas"},
}
(HERE / "canvas.json").write_text(json.dumps(canvas, indent=2) + "\n", encoding="utf-8")
print(f"{len(BOARDS)} artboards + canvas.json")
print(f"  cell {CELL}dp · card {CARD}dp · radius {RADIUS}dp · shadow {SHADOW}dp · padding {PAD_T}/{PAD_L}dp inside the stroke")
print("  headline: Getai (drawn as pixels on device) · countdown: platform heaviest")
