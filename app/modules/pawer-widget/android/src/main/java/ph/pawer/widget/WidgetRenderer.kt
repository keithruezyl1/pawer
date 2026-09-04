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

  /* Line 4 is the area, in every state. It used to be taken over by "Data may be outdated" when
     the feed was over 48h old; that was removed on 2026-09-04, so the dashed slate card is now
     the only thing that says the data is stale. */

  /** Root padding, left+right and top+bottom, including the 4dp the card is inset for its shadow. */
  private const val PAD_H = 26
  private const val PAD_V = 24

  /** The tag, subtitle, area chip and their margins, at the sizes the layout gives them. */
  private const val OTHER_ROWS_DP = 56

  /** Never let the headline get so small it stops being the thing you read first. */
  private const val HEADLINE_MIN_DP = 22

  fun render(ctx: Context, s: WidgetState?, nowMs: Long, sizeDp: Pair<Int, Int> = Pair(110, 110)): RemoteViews {
    val contentDp = (sizeDp.first - PAD_H).coerceAtLeast(40)
    val headlineDp = (sizeDp.second - PAD_V - OTHER_ROWS_DP).coerceAtLeast(HEADLINE_MIN_DP)
    val v = RemoteViews(ctx.packageName, R.layout.pawer_widget)
    v.setOnClickPendingIntent(R.id.pawer_root, launchIntent(ctx))

    if (s == null) {
      // Not configured yet: the app has never written a blob.
      v.setInt(R.id.pawer_root, "setBackgroundResource", R.drawable.pawer_bg_clear)
      text(ctx, v, contentDp, headlineDp, "PAWER", "No location set in app", "Add your barangay", "", false)
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
          text(ctx, v, contentDp, headlineDp, s.label, null, s.secondary, s.areaLabel, true)
        } else {
          hideCountdown(v)
          text(ctx, v, contentDp, headlineDp, s.label, if (s.state == "ONGOING") "Outage in-progress" else "Soon", s.secondary, s.areaLabel, true)
        }
      }
      "ENDED_TODAY" -> {
        hideCountdown(v)
        text(ctx, v, contentDp, headlineDp, s.label, "Restored", s.secondary, s.areaLabel, true) // qualified by line 3: "Should be back by now"
      }
      else -> { // NONE_TODAY
        hideCountdown(v)
        if (s.nextStartMs != null && s.secondary.contains(" · ")) {
          // "Fri · 9:00 AM – 5:00 PM" → display the day, window on line 3
          text(ctx, v, contentDp, headlineDp, s.label, s.secondary.substringBefore(" · "), s.secondary.substringAfter(" · "), s.areaLabel, true)
        } else {
          text(ctx, v, contentDp, headlineDp, s.label, "No outages today", s.secondary, s.areaLabel, true)
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

  private fun dp(ctx: Context, v: Float): Int = (v * ctx.resources.displayMetrics.density).toInt()

  /**
   * `pill` dresses line 4 as the dashboard card's area chip. It is off for the stale notice and
   * the unconfigured prompt, because neither is a place, and a warning inside a location chip
   * reads as a location.
   */
  private fun text(ctx: Context, v: RemoteViews, contentDp: Int, headlineDp: Int, tag: String, display: String?, line3: String, line4: String, pill: Boolean) {
    v.setTextViewText(R.id.pawer_tag, tag)
    if (display != null) {
      v.setViewVisibility(R.id.pawer_display, View.VISIBLE)
      // Two rows, and the same 84dp content box the layout's padding leaves.
      val bmp = Headline.render(ctx, display, contentDp, headlineDp, maxLines = 3, colorInt = ctx.getColor(R.color.pawer_ink))
      if (bmp != null) v.setImageViewBitmap(R.id.pawer_display, bmp)
      v.setContentDescription(R.id.pawer_display, display)
    } else {
      v.setViewVisibility(R.id.pawer_display, View.GONE)
    }
    v.setTextViewText(R.id.pawer_line3, line3)
    v.setTextViewText(R.id.pawer_line4, line4)
    v.setViewVisibility(R.id.pawer_line4, if (line4.isEmpty()) View.GONE else View.VISIBLE)
    v.setInt(R.id.pawer_line4, "setBackgroundResource", if (pill) R.drawable.pawer_pill else 0)
    v.setTextColor(R.id.pawer_line4, ctx.getColor(if (pill) R.color.pawer_ink else R.color.pawer_slate))
    // Without the chip the padding would indent the notice out of line with everything above it.
    if (pill) v.setViewPadding(R.id.pawer_line4, dp(ctx, 6f), dp(ctx, 2f), dp(ctx, 6f), dp(ctx, 2f))
    else v.setViewPadding(R.id.pawer_line4, 0, 0, 0, 0)
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
