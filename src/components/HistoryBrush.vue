<!--
  總覽小圖＋刷選（d3.brushX）：拖曳選取年份區間 → 上方歷史折線圖放大
-->
<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  rows:       { type: Array, required: true },
  chamber:    { type: String, required: true },
  fullDomain: { type: Array, required: true },
  modelValue: { type: Array, default: null },
})
const emit = defineEmits(['update:modelValue'])

const W = 900, H = 70, M = { t: 6, r: 70, b: 20, l: 46 }
const x = computed(() => d3.scaleLinear(props.fullDomain, [M.l, W - M.r]))
const y = computed(() => d3.scaleLinear([0, props.chamber === 'senate' ? 75 : 320], [H - M.b, M.t]))
const line = p => d3.line().x(d => x.value(d.year)).y(d => y.value(d[props.chamber][p]))(props.rows)
const ticks = computed(() => d3.range(1950, 2027, 10))

const brushG = ref(null)
let brush, internal = false
onMounted(() => {
  brush = d3.brushX().extent([[M.l, M.t], [W - M.r, H - M.b]])
    .on('end', event => {
      if (internal || !event.sourceEvent) return
      if (!event.selection) { emit('update:modelValue', null); return }
      let [a, b] = event.selection.map(px => Math.round(x.value.invert(px) / 2) * 2)   // 對齊到偶數年（選舉年）
      if (b - a < 6) b = Math.min(props.fullDomain[1], a + 6)
      emit('update:modelValue', [a, b]); move([a, b])
    })
  d3.select(brushG.value).call(brush)
  move(props.modelValue)
})
function move(range) {
  internal = true
  d3.select(brushG.value).transition().duration(300)
    .call(brush.move, range ? range.map(x.value) : null)
    .on('end interrupt', () => { internal = false })
}
watch(() => props.modelValue, v => { if (!internal) move(v) })
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="年份總覽與刷選">
    <path :d="line('D')" class="ln d" />
    <path :d="line('R')" class="ln r" />
    <text v-for="t in ticks" :key="t" :x="x(t)" :y="H - 5" text-anchor="middle" class="tick">{{ t }}</text>
    <g ref="brushG" class="brush" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; }
.ln { fill: none; stroke-width: 1.5; } .ln.d { stroke: var(--d); } .ln.r { stroke: var(--r); }
.tick { fill: var(--text-2); font-size: 10px; }
.brush :deep(.selection) { fill: var(--text-1); fill-opacity: 0.08; stroke: var(--text-2); }
.brush :deep(.handle) { fill: var(--text-2); fill-opacity: 0.5; }
</style>
