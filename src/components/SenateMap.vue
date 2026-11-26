<!--
  參議院 35 場改選地圖
  原圖只有「100 席」的總數；這裡畫出哪 35 州有改選、誰勝選、哪 9 州從共和黨翻成民主黨
  地圖：us-atlas 的 states-albers-10m（已投影好的 TopoJSON），用 topojson.feature 轉成 GeoJSON，再用 d3.geoPath 畫
-->
<script setup>
import { computed, ref } from 'vue'
import * as d3 from 'd3'
import { feature, mesh } from 'topojson-client'
import us from 'us-atlas/states-albers-10m.json'
import { SENATE_RACES, STATE_ZH } from '../data/midterm2026.js'

const props = defineProps({ filter: { type: String, default: 'all' } })   // all | flip | D | R
const emit = defineEmits(['hover', 'pick'])
const path = d3.geoPath()                       // 資料已是 Albers 投影座標，不需要再指定投影
const states = feature(us, us.objects.states).features
const borders = mesh(us, us.objects.states, (a, b) => a !== b)

const raceByState = new Map(SENATE_RACES.map(r => [r.state, r]))
const shapes = computed(() => states.map(f => {
  const race = raceByState.get(f.properties.name)
  const cls = !race ? 'none' : race.flipped ? 'flip' : race.party === 'D' ? 'hold-d' : 'hold-r'
  return { name: f.properties.name, d: path(f), race, cls, c: path.centroid(f) }
}).map(s => ({
  ...s,
  // 篩選：不符合條件的州變淡
  dim: !!s.race && props.filter !== 'all' && !(props.filter === 'flip' ? s.race.flipped : s.race.party === props.filter),
})))
const flips = computed(() => shapes.value.filter(s => s.race?.flipped))

const active = ref(null)
function enter(s, e) { if (s.race) { active.value = s.name; emit('hover', { race: s.race, zh: STATE_ZH[s.name], x: e.clientX, y: e.clientY }) } }
function leave() { active.value = null; emit('hover', null) }
</script>

<template>
  <svg viewBox="0 0 975 610" role="img" aria-label="2026 參議院改選各州結果地圖">
    <defs>
      <pattern id="flipHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" class="flip-bg" /><line x1="0" y1="0" x2="0" y2="7" class="flip-line" />
      </pattern>
    </defs>
    <path v-for="s in shapes" :key="s.name" :d="s.d" :data-state="s.name" :class="['st', s.cls, { on: active === s.name, dim: s.dim }]"
          @pointermove="enter(s, $event)" @pointerleave="leave" @click="s.race && emit('pick', s.race)" />
    <path :d="path(borders)" class="borders" />
    <!-- 翻盤州：加粗外框 -->
    <path v-for="s in flips" :key="'f' + s.name" :d="s.d" :class="['flip-outline', { dim: s.dim }]" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: auto; }
.st { stroke: none; transition: opacity .15s; cursor: default; }
.st.none { fill: var(--norace); }
.st.hold-d { fill: var(--d); cursor: pointer; }
.st.hold-r { fill: var(--r); cursor: pointer; }
.st.flip { fill: url(#flipHatch); cursor: pointer; }
.st.on { opacity: 0.75; }
.st.dim, .flip-outline.dim { opacity: 0.15; }
.st, .flip-outline { transition: opacity .4s ease; }
.flip-bg { fill: var(--d); }
.flip-line { stroke: var(--r); stroke-width: 3; }
.borders { fill: none; stroke: var(--panel); stroke-width: 1; pointer-events: none; }
.flip-outline { fill: none; stroke: var(--flip); stroke-width: 2.2; pointer-events: none; }
</style>
