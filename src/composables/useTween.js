/* ============================================================
 * useTween：用 D3 的 interpolate + timer 做「數值補間動畫」
 * 傳入一個會變動的來源（ref / computed / getter），回傳一個會平滑追上它的 ref。
 * 可以補間數字、陣列或物件（d3.interpolate 會自動處理）。
 * ============================================================ */
import { ref, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'

export function useTween(source, { duration = 750, ease = d3.easeCubicInOut } = {}) {
  const read = typeof source === 'function' ? source : () => source.value
  const current = ref(read())
  let timer = null

  watch(read, target => {
    if (timer) timer.stop()
    const interp = d3.interpolate(current.value, target)   // 從「目前畫面上的值」補間到新目標
    timer = d3.timer(elapsed => {
      const t = Math.min(1, elapsed / duration)
      const v = interp(ease(t))
      // d3.interpolate 對陣列／物件會重複使用同一個輸出物件，要複製一份 Vue 才偵測得到變化
      current.value = Array.isArray(v) ? v.slice() : (v && typeof v === 'object' ? { ...v } : v)
      if (t === 1) { timer.stop(); timer = null }
    })
  }, { deep: true })

  onUnmounted(() => timer && timer.stop())
  return current
}
