package ph.pawer.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews

/**
 * Builds the RemoteViews for one state (DG §7.2). Pure presentation: no network, no JS, no
 * file cache — just the blob and the clock. The countdown is a system Chronometer in count-down
 * mode, so a live timer costs zero app wakeups (ARCH §9.3).
 */
object WidgetRenderer {

  fun render(ctx: Context, s: WidgetState?, nowMs: Long): RemoteViews {
    val v = RemoteViews(ctx.packageName, R.layout.pawer_widget)
    v.setOnClickPendingIntent(R.id.pawer_root, launchIntent(ctx))

    if (s == null) {
      // Not configured yet: the app has never written a blob.
      v.setInt(R.id.pawer_root, "setBackgroundResource", R.drawable.pawer_bg_clear)
      text(v, "PAWER", "Open PAWER", "Add your barangay", "")
      hideCountdown(v)
      return v
    }

    val stale = s.isStale(nowMs)
    v.setInt(R.id.pawer_root, "setBackgroundResource", if (stale) R.drawable.pawer_bg_stale else background(s.state))

    when (s.state) {
      "UPCOMING_TODAY", "ONGOING" -> {
        val until = s.primaryUntilMs
        if (until != null && until > nowMs) {
          showCountdown(v, until, nowMs)
          text(v, s.label, null, s.secondary, line4(s, stale))
        } else {
          hideCountdown(v)
          text(v, s.label, if (s.state == "ONGOING") "Now" else "Soon", s.secondary, line4(s, stale))
        }
      }
      "ENDED_TODAY" -> {
        hideCountdown(v)
        text(v, s.label, "Restored", s.secondary, line4(s, stale)) // qualified by line 3: "Should be back by now"
      }
      else -> { // NONE_TODAY
        hideCountdown(v)
        if (s.nextStartMs != null && s.secondary.contains(" · ")) {
          // "Fri · 9:00 AM – 5:00 PM" → display the day, window on line 3
          text(v, s.label, s.secondary.substringBefore(" · "), s.secondary.substringAfter(" · "), line4(s, stale))
        } else {
          text(v, s.label, "Clear", s.secondary, line4(s, stale))
        }
      }
    }
    return v
  }

  private fun background(state: String): Int = when (state) {
    "UPCOMING_TODAY" -> R.drawable.pawer_bg_upcoming
    "ONGOING" -> R.drawable.pawer_bg_ongoing
    "ENDED_TODAY" -> R.drawable.pawer_bg_ended
    else -> R.drawable.pawer_bg_clear
  }

  /** Line 4 is the first thing dropped for space, and STALE takes it over (DG §7.5, §4.5). */
  private fun line4(s: WidgetState, stale: Boolean): String =
    if (stale) "Data may be outdated" else s.areaLabel

  private fun text(v: RemoteViews, tag: String, display: String?, line3: String, line4: String) {
    v.setTextViewText(R.id.pawer_tag, tag)
    if (display != null) {
      v.setViewVisibility(R.id.pawer_display, View.VISIBLE)
      v.setTextViewText(R.id.pawer_display, display)
    } else {
      v.setViewVisibility(R.id.pawer_display, View.GONE)
    }
    v.setTextViewText(R.id.pawer_line3, line3)
    v.setTextViewText(R.id.pawer_line4, line4)
    v.setViewVisibility(R.id.pawer_line4, if (line4.isEmpty()) View.GONE else View.VISIBLE)
  }

  private fun showCountdown(v: RemoteViews, untilMs: Long, nowMs: Long) {
    // Chronometer bases are in elapsedRealtime; translate the wall-clock target.
    val base = SystemClock.elapsedRealtime() + (untilMs - nowMs)
    v.setViewVisibility(R.id.pawer_countdown, View.VISIBLE)
    v.setChronometerCountDown(R.id.pawer_countdown, true) // API 24+
    v.setChronometer(R.id.pawer_countdown, base, null, true)
  }

  private fun hideCountdown(v: RemoteViews) {
    v.setChronometer(R.id.pawer_countdown, SystemClock.elapsedRealtime(), null, false)
    v.setViewVisibility(R.id.pawer_countdown, View.GONE)
  }

  private fun launchIntent(ctx: Context): PendingIntent {
    val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
      ?: Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setPackage(ctx.packageName)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    return PendingIntent.getActivity(ctx, 0, intent, flags)
  }
}
