package ph.pawer.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Typeface
import android.os.Build
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint

/**
 * Draws the widget's headline in the app's own display face, as pixels.
 *
 * `android:fontFamily="@font/..."` in a RemoteViews layout is resolved by whichever process draws
 * the widget, which is the launcher, not us — and on a real device it came back as the system
 * face regardless (some OEM skins substitute fonts across every TextView they inflate). Rendering
 * here, in the app's own process, and sending a bitmap is the only way the headline is guaranteed
 * to be the same face as the dashboard card. Nothing downstream can override a bitmap.
 *
 * The cost is that a bitmap cannot tick, so the live countdown stays a system Chronometer.
 */
internal object Headline {

  /** Up to the dashboard card's own display size, so a launcher that gives the widget more room
   *  gets a headline that grows into it instead of a small one adrift in a big card. */
  private const val MAX_SP = 40f
  private const val MIN_SP = 9f

  fun render(ctx: Context, text: String, boxDp: Int, maxHeightDp: Int, maxLines: Int, colorInt: Int): Bitmap? {
    if (text.isBlank()) return null
    val density = ctx.resources.displayMetrics.density
    val widthPx = (boxDp * density).toInt()
    if (widthPx <= 0) return null

    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply {
      typeface = face(ctx)
      color = colorInt
    }

    // Shrink until it fits in maxLines AND inside the height it is allowed, which is what
    // autoSizeTextType does for the slots that are still TextViews. Half-point steps: finer than
    // anyone can see, coarse enough to be quick. Fitting the HEIGHT here rather than letting the
    // ImageView scale it down is what stops the headline being squeezed to nothing on a 2x2.
    val maxHeightPx = (maxHeightDp * density).toInt()
    var layout = measure(paint, text, widthPx, MAX_SP * density)
    var sp = MAX_SP
    while ((layout.lineCount > maxLines || layout.height > maxHeightPx) && sp > MIN_SP) {
      sp -= 0.5f
      layout = measure(paint, text, widthPx, sp * density)
    }

    val height = layout.height.coerceAtLeast(1)
    val bmp = Bitmap.createBitmap(widthPx, height, Bitmap.Config.ARGB_8888)
    // Tag it device-density so the ImageView draws it 1:1 rather than rescaling.
    bmp.density = ctx.resources.displayMetrics.densityDpi
    layout.draw(Canvas(bmp))
    return bmp
  }

  private fun measure(paint: TextPaint, text: String, widthPx: Int, sizePx: Float): StaticLayout {
    paint.textSize = sizePx
    return StaticLayout.Builder.obtain(text, 0, text.length, paint, widthPx)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL)
      // 0.95, as the layout had: the display face's natural line box is loose for a stacked headline.
      .setLineSpacing(0f, 0.95f)
      .setIncludePad(true)
      .build()
  }

  private fun face(ctx: Context): Typeface =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
      runCatching { ctx.resources.getFont(R.font.getai_black) }.getOrDefault(Typeface.DEFAULT_BOLD)
    else Typeface.DEFAULT_BOLD // API 24-25 has no Resources.getFont; the bold system face stands in
}
