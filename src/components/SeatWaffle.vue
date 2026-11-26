<!--
  席次方格圖（waffle）：一格 = 一席，按「民主黨 → 獨立 → 未定 → 空缺 → 共和黨」由左到右填滿
  相較原圖的半圓：每一席都數得出來，過半線位置固定，前後兩個時間點的大小完全一樣
  動畫：顏色改變時用 CSS transition，並依格子位置錯開延遲，形成由左往右的波浪
-->
<script setup>
import { computed } from 'vue'
import { ORDER, PARTY } from '../data/midterm2026.js'

const props = defineProps({
  counts:   { type: Object, required: true },   // { D, I, R, P, V }
  total:    { type: Number, required: true },
  majority: { type: Number, required: true },
  rows:     { type: Number, required: true },   // 參院 5 列、眾院 10 列
})

const CELL = 18, GAP = 3, PAD = { t: 26, l: 2 }
const cols = computed(() => Math.ceil(props.total / props.rows))
const W = computed(() => PAD.l * 2 + cols.value * (CELL + GAP))
const H = computed(() => PAD.t + props.rows * (CELL + GAP) + 4)

/* 依序把每一席分配給政黨（直行優先填滿，同黨的席次會連在一起） */
const seats = computed(() => {
  const list = []
  ORDER.forEach(k => { for (let i = 0; i < (props.counts[k] ?? 0); i++) list.push(k) })
  return list.map((party, i) => {
    const c = Math.floor(i / props.rows), r = i % props.rows
    return { i, party, x: PAD.l + c * (CELL + GAP), y: PAD.t + r * (CELL + GAP) }
  })
})

/* 過半線：第 majority 席所在的那一直行右側 */
const majX = computed(() => {
  const c = Math.floor((props.majority - 1) / props.rows)
  return PAD.l + (c + 1) * (CELL + GAP) - GAP / 2
})
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`席次方格圖，共 ${total} 席`">
    <defs>
      <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" class="p" />
        <line x1="0" y1="0" x2="0" y2="5" class="hatch-line" />
      </pattern>
    </defs>
    <rect v-for="s in seats" :key="s.i" :x="s.x" :y="s.y" :width="CELL" :height="CELL" rx="3"
          :class="['seat', PARTY[s.party].cls]" :style="{ transitionDelay: `${(s.i / total) * 450}ms` }">
      <title>第 {{ s.i + 1 }} 席：{{ PARTY[s.party].name }}</title>
    </rect>
    <line :x1="majX" :x2="majX" :y1="PAD.t - 8" :y2="H" class="maj" />
    <text :x="majX" :y="PAD.t - 12" text-anchor="middle" class="maj-label">過半 {{ majority }} 席</text>
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; }
.seat { transition: fill 0.45s ease; }
.seat.d { fill: var(--d); }
.seat.i { fill: var(--i); }
.seat.r { fill: var(--r); }
.seat.p { fill: url(#hatch); }
.seat.v { fill: var(--v); stroke: var(--text-3); stroke-width: 1; stroke-dasharray: 2 2; }
.p { fill: var(--p); }
.hatch-line { stroke: var(--text-3); stroke-width: 1.5; }
.maj { stroke: var(--text-1); stroke-width: 2; }
.maj-label { fill: var(--text-1); font-size: 12px; font-weight: 700; }
</style>
