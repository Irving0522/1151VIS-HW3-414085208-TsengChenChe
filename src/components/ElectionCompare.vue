<!--
  兩屆選舉比較：任選兩個選舉年，比較民主黨、共和黨、其他的席次
  切換年份時，長條高度與數字用 useTween（d3.interpolate + d3.timer）平滑變化
-->
<script setup>
import { computed } from 'vue'
import * as d3 from 'd3'
import { useTween } from '../composables/useTween.js'

const props = defineProps({
  rows:    { type: Array, required: true },
  chamber: { type: String, required: true },
  yearA:   { type: Number, required: true },
  yearB:   { type: Number, required: true },
})

const GROUPS = [
  { key: 'D', label: '民主黨' },
  { key: 'R', label: '共和黨' },
  { key: 'O', label: '其他／未定' },
]
const pick = yr => {
  const d = props.rows.find(r => r.year === yr)
  return d ? GROUPS.map(g => d[props.chamber][g.key]) : [0, 0, 0]
}
const tA = computed(() => pick(props.yearA))
const tB = computed(() => pick(props.yearB))
const vA = useTween(tA, { duration: 650 })
const vB = useTween(tB, { duration: 650 })

const W = 900, H = 300, M = { t: 30, r: 20, b: 56, l: 46 }
const total = computed(() => props.chamber === 'senate' ? 100 : 435)
const majority = computed(() => props.chamber === 'senate' ? 51 : 218)
const x0 = d3.scaleBand(GROUPS.map(g => g.key), [M.l, W - M.r]).paddingInner(0.3).paddingOuter(0.1)
const x1 = d3.scaleBand(['a', 'b'], [0, x0.bandwidth()]).padding(0.08)
const y = computed(() => d3.scaleLinear([0, props.chamber === 'senate' ? 75 : 320], [H - M.b, M.t]))

const bars = computed(() => GROUPS.map((g, i) => ({
  ...g, x: x0(g.key), a: vA.value[i], b: vB.value[i], delta: tB.value[i] - tA.value[i],
})))
const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v)
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="兩屆選舉席次比較">
    <g class="axis">
      <g v-for="t in y.ticks(5)" :key="t">
        <line :x1="M.l" :x2="W - M.r" :y1="y(t)" :y2="y(t)" class="grid" />
        <text :x="M.l - 8" :y="y(t)" dy="0.32em" text-anchor="end">{{ t }}</text>
      </g>
    </g>
    <line :x1="M.l" :x2="W - M.r" :y1="y(majority)" :y2="y(majority)" class="maj" />
    <text :x="W - M.r" :y="y(majority) - 6" text-anchor="end" class="maj-label">過半 {{ majority }} 席</text>

    <g v-for="g in bars" :key="g.key" :transform="`translate(${g.x},0)`">
      <rect :x="x1('a')" :y="y(g.a)" :width="x1.bandwidth()" :height="y(0) - y(g.a)" rx="3" :class="['bar', 'a', g.key]" />
      <text :x="x1('a') + x1.bandwidth() / 2" :y="y(g.a) - 6" text-anchor="middle" class="val">{{ Math.round(g.a) }}</text>
      <rect :x="x1('b')" :y="y(g.b)" :width="x1.bandwidth()" :height="y(0) - y(g.b)" rx="3" :class="['bar', 'b', g.key]" />
      <text :x="x1('b') + x1.bandwidth() / 2" :y="y(g.b) - 6" text-anchor="middle" class="val">{{ Math.round(g.b) }}</text>
      <text :x="x0.bandwidth() / 2" :y="H - M.b + 20" text-anchor="middle" class="group">{{ g.label }}</text>
      <text :x="x0.bandwidth() / 2" :y="H - M.b + 38" text-anchor="middle" class="delta">{{ yearB }} 比 {{ yearA }}：{{ fmt(g.delta) }} 席</text>
    </g>
    <line :x1="M.l" :x2="W - M.r" :y1="y(0)" :y2="y(0)" class="base" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; }
.axis text { fill: var(--text-2); font-size: 11px; }
.grid { stroke: var(--grid); }
.base { stroke: var(--text-3); }
.maj { stroke: var(--text-1); stroke-dasharray: 5 4; stroke-width: 1.5; }
.maj-label { fill: var(--text-1); font-size: 11px; font-weight: 700; }
/* 年份 A 用淡色、年份 B 用深色，同一政黨維持同色系 */
.bar.D.b { fill: var(--d); } .bar.D.a { fill: var(--d); opacity: .4; }
.bar.R.b { fill: var(--r); } .bar.R.a { fill: var(--r); opacity: .4; }
.bar.O.b { fill: var(--text-3); } .bar.O.a { fill: var(--text-3); opacity: .4; }
.val { fill: var(--text-1); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.group { fill: var(--text-1); font-size: 13px; font-weight: 700; }
.delta { fill: var(--text-2); font-size: 11px; }
</style>
