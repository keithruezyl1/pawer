package ph.pawer.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Transition-only wakeups (PRD FR-26, ARCH §9.4). Arms exactly one alarm — the next boundary
 * in the blob — with setAndAllowWhileIdle: inexact, Doze-tolerant, no exact-alarm permission.
 * A quiet day is one wakeup (local midnight); an outage day is three.
 */
object BoundaryScheduler {
  const val ACTION_BOUNDARY = "ph.pawer.widget.ACTION_BOUNDARY"
  private const val REQUEST = 7001
  private const val SLACK_MS = 1500L // land just after the boundary so the state has flipped

  fun scheduleNext(ctx: Context, boundariesMs: List<Long>, nowMs: Long) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pi = pendingIntent(ctx)
    am.cancel(pi)
    val next = boundariesMs.filter { it > nowMs }.minOrNull() ?: return
    val at = next + SLACK_MS
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    } else {
      am.set(AlarmManager.RTC_WAKEUP, at, pi)
    }
  }

  fun cancel(ctx: Context) {
    (ctx.getSystemService(Context.ALARM_SERVICE) as? AlarmManager)?.cancel(pendingIntent(ctx))
  }

  private fun pendingIntent(ctx: Context): PendingIntent {
    val intent = Intent(ctx, PawerWidgetProvider::class.java).setAction(ACTION_BOUNDARY)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    return PendingIntent.getBroadcast(ctx, REQUEST, intent, flags)
  }
}
