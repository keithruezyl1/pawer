package ph.pawer.widget

import android.content.Context
import org.json.JSONObject

/**
 * The precomputed blob the app writes and the widget reads (ARCH §9.2). Mirrors @pawer/shared
 * WidgetState. The widget never parses the main feed cache and never runs JavaScript.
 */
data class WidgetState(
  val state: String,               // NONE_TODAY | UPCOMING_TODAY | ONGOING | ENDED_TODAY
  val label: String,               // TODAY · NOW · NEXT · "TODAY 1/2"
  val primaryUntilMs: Long?,       // Chronometer target, or null
  val secondary: String,
  val areaLabel: String,
  val nextStartMs: Long?,
  val fetchedAtMs: Long,
  val boundariesMs: List<Long>,
) {
  companion object {
    const val STALE_AFTER_MS = 48L * 60 * 60 * 1000

    fun fromJson(json: String): WidgetState {
      val o = JSONObject(json)
      val b = o.optJSONArray("boundaries_ms")
      val boundaries = ArrayList<Long>()
      if (b != null) for (i in 0 until b.length()) boundaries.add(b.getLong(i))
      return WidgetState(
        state = o.getString("state"),
        label = o.optString("label", "TODAY"),
        primaryUntilMs = if (o.isNull("primary_until_ms")) null else o.getLong("primary_until_ms"),
        secondary = o.optString("secondary", ""),
        areaLabel = o.optString("area_label", ""),
        nextStartMs = if (o.isNull("next_start_ms")) null else o.getLong("next_start_ms"),
        fetchedAtMs = o.optLong("fetched_at_ms", 0L),
        boundariesMs = boundaries,
      )
    }
  }

  fun isStale(nowMs: Long): Boolean = fetchedAtMs > 0 && nowMs - fetchedAtMs > STALE_AFTER_MS
}

object WidgetStateStore {
  private const val PREFS = "pawer_widget"
  private const val KEY = "state"

  fun save(ctx: Context, json: String) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
  }

  fun clear(ctx: Context) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
  }

  fun load(ctx: Context): WidgetState? {
    val json = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
    return try { WidgetState.fromJson(json) } catch (_: Exception) { null }
  }
}
