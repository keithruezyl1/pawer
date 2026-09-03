package ph.pawer.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * JS ⇄ native bridge (Expo Modules API). Four functions, no events:
 *   setState(json)     store the precomputed blob, redraw every instance, arm the next boundary
 *   clear()            forget the blob (areas removed)
 *   isPinSupported()   API 26+ AND the launcher supports requestPinAppWidget
 *   requestPin()       show the system "add widget" dialog (tour T7); false if unsupported
 */
class PawerWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context unavailable")

  override fun definition() = ModuleDefinition {
    Name("PawerWidget")

    Function("setState") { json: String ->
      WidgetStateStore.save(context, json)
      PawerWidgetProvider.updateAll(context)
    }

    Function("clear") {
      WidgetStateStore.clear(context)
      PawerWidgetProvider.updateAll(context)
    }

    Function("isPinSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        AppWidgetManager.getInstance(context).isRequestPinAppWidgetSupported
    }

    Function("requestPin") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      val awm = AppWidgetManager.getInstance(context)
      if (!awm.isRequestPinAppWidgetSupported) return@Function false
      awm.requestPinAppWidget(ComponentName(context, PawerWidgetProvider::class.java), null, null)
    }

    Function("instanceCount") {
      val awm = AppWidgetManager.getInstance(context)
      awm.getAppWidgetIds(ComponentName(context, PawerWidgetProvider::class.java)).size
    }
  }
}
