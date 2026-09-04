package ph.pawer.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle

/**
 * The 2x2 widget. Every path ends in redraw-all + arm-the-next-boundary. No periodic updates
 * exist (updatePeriodMillis="0"); the only triggers are the app writing a new blob, a boundary
 * alarm, a reboot, or the launcher asking (add / resize / theme change).
 */
class PawerWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val now = System.currentTimeMillis()
    val state = WidgetStateStore.load(context)
    // Rendered per id, not once for all of them: the headline is a bitmap, so it has to be laid
    // out for the room THIS widget has. Launchers do not all honour a pinned 2x2.
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, WidgetRenderer.render(context, state, now, sizeOf(appWidgetManager, id)))
    }
    BoundaryScheduler.scheduleNext(context, state?.boundariesMs ?: emptyList(), now)
  }

  /**
   * The launcher resized us. The headline is a bitmap laid out for a specific box, so a resize has
   * to redraw or the old one is left stretched or adrift in the new one.
   */
  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    val now = System.currentTimeMillis()
    val state = WidgetStateStore.load(context)
    appWidgetManager.updateAppWidget(appWidgetId, WidgetRenderer.render(context, state, now, sizeOf(appWidgetManager, appWidgetId)))
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

    /**
     * The dp the launcher has actually given this widget. Portrait reads the MIN width and the MAX
     * height, which is the pair that describes the portrait box; landscape is the other diagonal.
     * A launcher that reports nothing falls back to the 2x2 the provider asks for.
     */
    fun sizeOf(awm: AppWidgetManager, id: Int): Pair<Int, Int> {
      val o: Bundle? = runCatching { awm.getAppWidgetOptions(id) }.getOrNull()
      val w = o?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH) ?: 0
      val h = o?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT) ?: 0
      return Pair(if (w > 0) w else 110, if (h > 0) h else 110)
    }

    fun updateAll(context: Context) {
      val awm = AppWidgetManager.getInstance(context)
      val ids = awm.getAppWidgetIds(ComponentName(context, PawerWidgetProvider::class.java))
      if (ids.isEmpty()) {
        BoundaryScheduler.cancel(context)
        return
      }
      val now = System.currentTimeMillis()
      val state = WidgetStateStore.load(context)
      for (id in ids) awm.updateAppWidget(id, WidgetRenderer.render(context, state, now, sizeOf(awm, id)))
      BoundaryScheduler.scheduleNext(context, state?.boundariesMs ?: emptyList(), now)
    }
  }
}
