/**
 * Keeps `tools:replace="android:resource"` on the Firebase default-notification-color meta-data.
 *
 * Two plugins write that meta-data and only one of them adds the override:
 *   - expo-notifications writes it (from its `icon`/`color` props) WITHOUT tools:replace
 *   - @react-native-firebase/messaging adds it WITH tools:replace, but only when it is absent
 *
 * expo-notifications runs first, so RNFirebase's guard skips and the attribute is lost. The
 * firebase-messaging AAR declares the same key as @color/white, so without the override the
 * manifest merger fails. Registered last, this restores the attribute regardless of plugin order.
 */
const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

const META_DATA = "com.google.firebase.messaging.default_notification_color";
const TOOLS_NS = "http://schemas.android.com/tools";

module.exports = function withFirebaseNotificationColorReplace(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults.manifest.$ = { ...cfg.modResults.manifest.$, "xmlns:tools": TOOLS_NS };
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const item = (application["meta-data"] ?? []).find((m) => m.$["android:name"] === META_DATA);
    if (item) item.$["tools:replace"] = "android:resource";
    return cfg;
  });
};
