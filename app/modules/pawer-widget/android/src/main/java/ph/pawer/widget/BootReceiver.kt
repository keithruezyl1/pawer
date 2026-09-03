package ph.pawer.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Alarms die with a reboot; redraw from the stored blob and re-arm the next boundary. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) PawerWidgetProvider.updateAll(context)
  }
}
