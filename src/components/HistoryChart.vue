<!--
  歷史席次折線圖（1950–2026）：民主黨、共和黨各一條線
  - x 範圍由父元件傳入（刷選放大後會經過 useTween 補間動畫）
  - 期中選舉年用淡色背景標示，2026 年加上標註
  - 滑鼠移動：找最近的選舉年，emit('hover')；點擊：emit('pick') 設為比較年份
-->
<script setup>
import { computed, ref } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  rows:      { type: Array, required: true },    // HISTORY
  chamber:   { type: String, required: true },   // 'senate' | 'house'
  xDomain:   { type: Array, required: true },
  hoverYear: { type: Number, default: null },
  marks:     { type: Array, default: () => [] }, // [{ year, label, cls }]
})
const emit = defineEmits(['hover', 'leave', 'pick'])

const W = 900, H = 320, M = { t: 28, r: 70, b: 30, l: 46 }
const clipId = `hclip-${Math.random().toString(36).slice(2, 8)}`

const val = (d, p) => d[props.chamber][p]
const total = computed(() => props.chamber === 'senate' ? 100 : 435)
const majority = computed(() => props.chamber === 'senate' ? 51 : 218)

const x = computed(() => d3.scaleLinear(props.xDomain, [M.l, W - M.r]))
const y = computed(() => d3.scaleLinear([0, props.chamber === 'senate' ? 75 : 320], [H - M.b, M.t]))

const line = p => d3.line().x(d => x.value(d.year)).y(d => y.value(val(d, p))).curve(d3.curveMonotoneX)(props.rows)
const dPath = computed(() => line('D'))
const rPath = computed(() => line('R'))

const inView = yr => yr >= props.xDomain[0] - 1e-6 && yr <= props.xDomain[1] + 1e-6
const visible = computed(() => props.rows.filter(d => inView(d.year)))
const midterms = computed(() => visible.value.filter(d => d.midterm))
const xTicks = computed(() => {
  const span = props.xDomain[1] - props.xDomain[0]
  const step = span > 40 ? 8 : span > 20 ? 4 : 2
  return d3.range(Math.ceil(props.xDomain[0] / step) * step, props.xDomain[1] + 0.1, step).filter(Number.isInteger)
})
const yTicks = computed(() => y.value.ticks(5))

const last = computed(() => props.rows.at(-1))
const markX = computed(() => props.marks.filter(m => inView(m.year)).map(m => ({ ...m, cx: x.value(m.year) })))

/* hover / click */
const svgRef = ref(null)
const bisect = d3.bisector(d => d.year).center
function nearest(e) {
  if (!visible.value.length) return null
  const [mx] = d3.pointer(e, svgRef.value)
  return visible.value[bisect(visible.value, x.value.invert(mx))]
}
function onMove(e) { const d = nearest(e); if (d) emit('hover', { year: d.year, clientX: e.clientX, clientY: e.clientY }) }
function onClick(e) { const d = nearest(e); if (d) emit('pick', d.year) }
const hp = computed(() => {
  if (props.hoverYear == null || !inView(props.hoverYear)) return null
  const d = props.rows.find(r => r.year === props.hoverYear)
  return d && { cx: x.value(d.year), dy: y.value(val(d, 'D')), ry: y.value(val(d, 'R')) }
})
</script>

<template>
  <svg ref="svgRef" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="1950 到 2026 年國會席次折線圖">
    <defs><clipPath :id="clipId"><rect :x="M.l" y="0" :width="W - M.l - M.r" :height="H" /></clipPath></defs>

    <g :clip-path="`url(#${clipId})`">
      <!-- 期中選舉年：淡色直條 -->
      <rect v-for="d in midterms" :key="'m' + d.year" :x="x(d.year) - 3" :y="M.t" width="6" :height="H - M.t - M.b" class="mid" />
    </g>

    <g class="axis">
      <g v-for="t in yTicks" :key="'y' + t">
        <line :x1="M.l" :x2="W - M.r" :y1="y(t)" :y2="y(t)" class="grid" />
        <text :x="M.l - 8" :y="y(t)" dy="0.32em" text-anchor="end">{{ t }}</text>
      </g>
      <text v-for="t in xTicks" :key="'x' + t" :x="x(t)" :y="H - M.b + 18" text-anchor="middle">{{ t }}</text>
    </g>

    <line :x1="M.l" :x2="W - M.r" :y1="y(majority)" :y2="y(majority)" class="maj" />
    <text :x="W - M.r + 6" :y="y(majority)" dy="0.32em" class="maj-label">過半 {{ majority }}</text>

    <g :clip-path="`url(#${clipId})`">
      <path :d="dPath" class="ln d" />
      <path :d="rPath" class="ln r" />
      <line v-for="m in markX" :key="'k' + m.label" :x1="m.cx" :x2="m.cx" :y1="M.t" :y2="H - M.b" :class="['mk', m.cls]" />
    </g>
    <!-- A 標籤放線的左側、B 放右側，兩年相鄰時才不會重疊 -->
    <text v-for="m in markX" :key="'kl' + m.label" :x="m.cx + (m.cls === 'a' ? -4 : 4)" :y="M.t - 10"
          :text-anchor="m.cls === 'a' ? 'end' : 'start'" class="mk-label">{{ m.label }}</text>

    <!-- 2026 標註 -->
    <template v-if="inView(last.year)">
      <circle :cx="x(last.year)" :cy="y(val(last, 'D'))" r="5" class="pt d" />
      <circle :cx="x(last.year)" :cy="y(val(last, 'R'))" r="5" class="pt r" />
      <text :x="x(last.year) + 9" :y="y(val(last, 'D'))" dy="0.32em" class="end-label">民主黨 {{ val(last, 'D') }}</text>
      <text :x="x(last.year) + 9" :y="y(val(last, 'R'))" dy="0.32em" class="end-label">共和黨 {{ val(last, 'R') }}</text>
    </template>

    <g v-if="hp" pointer-events="none">
      <line :x1="hp.cx" :x2="hp.cx" :y1="M.t" :y2="H - M.b" class="hover-line" />
      <circle :cx="hp.cx" :cy="hp.dy" r="5" class="pt d" />
      <circle :cx="hp.cx" :cy="hp.ry" r="5" class="pt r" />
    </g>

    <rect :x="M.l" :y="M.t" :width="W - M.l - M.r" :height="H - M.t - M.b" fill="transparent" style="cursor: pointer"
          @pointermove="onMove" @pointerleave="emit('leave')" @click="onClick" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; overflow: visible; }
.axis text { fill: var(--text-2); font-size: 11px; }
.grid { stroke: var(--grid); }
.mid { fill: var(--text-3); opacity: 0.08; }
.maj { stroke: var(--text-1); stroke-width: 1.5; stroke-dasharray: 5 4; }
.maj-label { fill: var(--text-1); font-size: 11px; font-weight: 700; }
.ln { fill: none; stroke-width: 2.5; }
.ln.d { stroke: var(--d); } .ln.r { stroke: var(--r); }
.pt { stroke: var(--panel); stroke-width: 2; }
.pt.d { fill: var(--d); } .pt.r { fill: var(--r); }
.end-label { fill: var(--text-1); font-size: 12px; font-weight: 700; }
.hover-line { stroke: var(--text-3); stroke-dasharray: 3 3; }
.mk { stroke-width: 2; opacity: .8; }
.mk.a { stroke: var(--cmp-a); } .mk.b { stroke: var(--cmp-b); }
.mk-label { fill: var(--text-1); font-size: 11px; font-weight: 700; }
</style>
