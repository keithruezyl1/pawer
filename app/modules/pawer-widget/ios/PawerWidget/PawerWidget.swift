// WidgetKit extension — WRITTEN, NOT SHIPPED (PRD NFR-14). Not part of any target in v1.
//
// WidgetKit is a better fit for this problem than Android's model: it takes a TIMELINE, and since
// PAWER knows every start/end in advance, the blob's boundaries_ms become exact timeline entries
// (ARCH §9.6). No alarms, no polling — the system flips the view at the instant the state changes.

import SwiftUI
import WidgetKit

struct Blob: Decodable {
  let state: String
  let label: String
  let primary_until_ms: Double?
  let secondary: String
  let area_label: String
  let next_start_ms: Double?
  let fetched_at_ms: Double
  let boundaries_ms: [Double]
}

struct Entry: TimelineEntry {
  let date: Date
  let blob: Blob?
}

struct Provider: TimelineProvider {
  static let suite = "group.ph.pawer.app"
  static let key = "pawer_widget_state"

  func load() -> Blob? {
    guard let json = UserDefaults(suiteName: Self.suite)?.string(forKey: Self.key),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Blob.self, from: data)
  }

  func placeholder(in context: Context) -> Entry { Entry(date: Date(), blob: nil) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), blob: load())) }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let blob = load()
    var entries = [Entry(date: Date(), blob: blob)]
    // One entry per boundary: the widget re-renders exactly when the state changes.
    for ms in blob?.boundaries_ms ?? [] {
      let d = Date(timeIntervalSince1970: ms / 1000 + 1)
      if d > Date() { entries.append(Entry(date: d, blob: blob)) }
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct PawerWidgetView: View {
  let entry: Entry
  var body: some View {
    let b = entry.blob
    let stale = b.map { Date().timeIntervalSince1970 * 1000 - $0.fetched_at_ms > 48 * 3600 * 1000 } ?? false
    VStack(alignment: .leading, spacing: 4) {
      Text(b?.label ?? "PAWER").font(.system(size: 11)).opacity(0.7)
      if let b = b, let until = b.primary_until_ms, b.state == "UPCOMING_TODAY" || b.state == "ONGOING" {
        // System-driven countdown — the iOS twin of Android's Chronometer.
        Text(Date(timeIntervalSince1970: until / 1000), style: .timer).font(.system(size: 28, weight: .bold)).monospacedDigit()
      } else {
        Text(display(b)).font(.system(size: 28, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
      }
      Text(line3(b)).font(.system(size: 13)).lineLimit(1)
      Text(stale ? "Data may be outdated" : (b?.area_label ?? "")).font(.system(size: 11)).opacity(0.7).lineLimit(1)
      Spacer(minLength: 0)
    }
    .foregroundColor(Color(hex: 0x212431))
    .padding(12)
    .background(RoundedRectangle(cornerRadius: 2).fill(fill(b, stale)))
    .overlay(RoundedRectangle(cornerRadius: 2).strokeBorder(stale ? Color(hex: 0x4F5D75) : Color(hex: 0x212431), style: StrokeStyle(lineWidth: 2, dash: stale ? [6, 4] : [])))
  }

  func display(_ b: Blob?) -> String {
    guard let b = b else { return "Open PAWER" }
    switch b.state {
    case "ENDED_TODAY": return "Restored"
    case "NONE_TODAY": return b.next_start_ms != nil ? String(b.secondary.split(separator: "·").first ?? "Next").trimmingCharacters(in: .whitespaces) : "Clear"
    default: return b.state == "ONGOING" ? "Now" : "Soon"
    }
  }
  func line3(_ b: Blob?) -> String {
    guard let b = b else { return "Add your barangay" }
    if b.state == "NONE_TODAY", b.next_start_ms != nil, let r = b.secondary.range(of: " · ") { return String(b.secondary[r.upperBound...]) }
    return b.secondary
  }
  func fill(_ b: Blob?, _ stale: Bool) -> Color {
    if stale { return Color(hex: 0xE9E9E7) }
    switch b?.state {
    case "UPCOMING_TODAY": return Color(hex: 0xFF90E8)
    case "ONGOING": return Color(hex: 0xFF5C5C)
    case "ENDED_TODAY": return Color(hex: 0xFFD93D)
    default: return Color(hex: 0x9BF06B)
    }
  }
}

extension Color {
  init(hex: UInt32) {
    self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
  }
}

@main
struct PawerWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "PawerWidget", provider: Provider()) { entry in PawerWidgetView(entry: entry) }
      .configurationDisplayName("PAWER")
      .description("Today's scheduled outage status for your barangay.")
      .supportedFamilies([.systemSmall])
  }
}
