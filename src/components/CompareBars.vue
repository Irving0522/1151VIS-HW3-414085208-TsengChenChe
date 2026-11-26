<!--
  改選前 vs 目前：兩條「一樣長」的堆疊長條，取代原圖內外圈大小不同的半圓
  長度用 useTween（d3.interpolate + d3.timer）補間，切換時間點時平滑變化
-->
<script setup>
import { computed } from 'vue'
import * as d3 from 'd3'
import { ORDER, PARTY } from '../data/midterm2026.js'
import { useTween } from '../composables/useTween.js'

const props = defineProps({
  before:   { type: Object, required: true },
  now:      { type: Object, required: true },
  nowLabel: { type: String, required: true },
  total:    { type: Number, required: true },
  majority: { type: Number, required: true },
})

const W = 900, BAR = 34, M = { t: 26, l: 92, r: 10 }
const H = M.t + BAR * 2 + 22 + 10
const x = computed(() => d3.scaleLinear([0, props.total], [M.l, W - M.r]))

const toArr = c => ORDER.map(k => c[k] ?? 0)
const beforeV = useTween(() => toArr(props.before), { duration: 600 })
const nowV = useTween(() => toArr(props.now), { duration: 600 })

function segs(vals) {
  let acc = 0
  return ORDER.map((k, i) => {
    const s = { k, x0: acc, x1: acc + vals[i], v: vals[i] }
    acc += vals[i]
    return s
  }).filter(s => s.v > 0.01)
}
const rows = computed(() => [
  { label: '改選前', y: M.t, segs: segs(beforeV.value) },
  { label: props.nowLabel, y: M.t + BAR + 22, segs: segs(nowV.value) },
])
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="改選前與目前席次比較長條圖">
    <defs>
      <pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" class="p" /><line x1="0" y1="0" x2="0" y2="6" class="hatch-line" />
      </pattern>
    </defs>
    <g v-for="row in rows" :key="row.label">
      <text :x="M.l - 10" :y="row.y + BAR / 2" dy="0.35em" text-anchor="end" class="row-label">{{ row.label }}</text>
      <g v-for="s in row.segs" :key="s.k">
        <rect :x="x(s.x0) + 1" :y="row.y" :width="Math.max(0, x(s.x1) - x(s.x0) - 2)" :height="BAR" rx="3"
              :class="['seg', PARTY[s.k].cls]">
          <title>{{ row.label }}・{{ PARTY[s.k].name }}：{{ Math.round(s.v) }} 席</title>
        </rect>
        <text v-if="x(s.x1) - x(s.x0) > 34" :x="(x(s.x0) + x(s.x1)) / 2" :y="row.y + BAR / 2" dy="0.35em"
              text-anchor="middle" :class="['val', PARTY[s.k].cls]">{{ Math.round(s.v) }}</text>
      </g>
    </g>
    <line :x1="x(majority)" :x2="x(majority)" :y1="M.t - 8" :y2="H - 6" class="maj" />
    <text :x="x(majority)" :y="M.t - 12" text-anchor="middle" class="maj-label">過半 {{ majority }}</text>
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; }
.row-label { fill: var(--text-1); font-size: 13px; font-weight: 600; }
.seg.d { fill: var(--d); } .seg.i { fill: var(--i); } .seg.r { fill: var(--r); }
.seg.p { fill: url(#hatch2); } .seg.v { fill: var(--v); stroke: var(--text-3); stroke-dasharray: 2 2; }
.p { fill: var(--p); } .hatch-line { stroke: var(--text-3); stroke-width: 1.5; }
.val { font-size: 13px; font-weight: 700; fill: #fff; font-variant-numeric: tabular-nums; }
.val.i, .val.p, .val.v { fill: var(--text-1); }
.maj { stroke: var(--text-1); stroke-width: 2; stroke-dasharray: 5 3; }
.maj-label { fill: var(--text-1); font-size: 12px; font-weight: 700; }
</style>
