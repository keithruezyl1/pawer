package ph.pawer.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * The 2x2 widget. Every path ends in redraw-all + arm-the-next-boundary. No periodic updates
 * exist (updatePeriodMillis="0"); the only triggers are the app writing a new blob, a boundary
 * alarm, a reboot, or the launcher asking (add / resize / theme change).
 */
class PawerWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val now = System.currentTimeMillis()
    val state = WidgetStateStore.load(context)
    val views = WidgetRenderer.render(context, state, now)
    for (id in appWidgetIds) appWidgetManager.updateAppWidget(id, views)
    BoundaryScheduler.scheduleNext(context, state?.boundariesMs ?: emptyList(), now)
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == BoundaryScheduler.ACTION_BOUNDARY) {
      updateAll(context)
      return
    }
    super.onReceive(context, intent)
  }

  override fun onDisabled(context: Context) {
    // Last widget removed: stop waking the device for nobody.
    BoundaryScheduler.cancel(context)
  }

  companion object {
    fun updateAll(context: Context) {
      val awm = AppWidgetManager.getInstance(context)
      val ids = awm.getAppWidgetIds(ComponentName(context, PawerWidgetProvider::class.java))
      if (ids.isEmpty()) {
        BoundaryScheduler.cancel(context)
        return
      }
      val now = System.currentTimeMillis()
      val state = WidgetStateStore.load(context)
      val views = WidgetRenderer.render(context, state, now)
      for (id in ids) awm.updateAppWidget(id, views)
      BoundaryScheduler.scheduleNext(context, state?.boundariesMs ?: emptyList(), now)
    }
  }
}
