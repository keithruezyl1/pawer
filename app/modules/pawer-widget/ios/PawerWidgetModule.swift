import ExpoModulesCore
import WidgetKit

/// iOS half of the bridge (PRD NFR-14: written, unshipped). Stores the same blob in an App Group
/// so a WidgetKit extension can read it, and asks WidgetKit to reload timelines.
/// The extension target under ios/PawerWidget/ is NOT added to the Xcode project in v1.
public class PawerWidgetModule: Module {
  static let suite = "group.ph.pawer.app"
  static let key = "pawer_widget_state"

  public func definition() -> ModuleDefinition {
    Name("PawerWidget")

    Function("setState") { (json: String) in
      UserDefaults(suiteName: Self.suite)?.set(json, forKey: Self.key)
      if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
    }

    Function("clear") {
      UserDefaults(suiteName: Self.suite)?.removeObject(forKey: Self.key)
      if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
    }

    // iOS has no programmatic "pin widget"; the tour shows instructions instead.
    Function("isPinSupported") { false }
    Function("requestPin") { false }
    Function("instanceCount") { 0 }
  }
}
