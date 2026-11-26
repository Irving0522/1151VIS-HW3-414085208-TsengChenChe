<!--
  App.vue（HW3：2026 美國期中選舉動態視覺化）
  全頁共用狀態：chamberKey（參院／眾院）
  1. 開票進度：stepIdx、playing（時間軸播放）
  2. 歷史脈絡：zoom（刷選範圍）、hover（同步提示）
  3. 兩屆比較：yearA、yearB（滑桿或點擊折線圖）
  4. 參院地圖：mapFilter（篩選）、picked（點選的州）
-->
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { CHAMBERS, SENATE_RACES, STATE_ZH, SOURCES } from './data/midterm2026.js'
import { HISTORY, HISTORY_SOURCE } from './data/history.js'
import { useTween } from './composables/useTween.js'
import SeatWaffle from './components/SeatWaffle.vue'
import CompareBars from './components/CompareBars.vue'
import HistoryChart from './components/HistoryChart.vue'
import HistoryBrush from './components/HistoryBrush.vue'
import ElectionCompare from './components/ElectionCompare.vue'
import SenateMap from './components/SenateMap.vue'

/* ---------- 全頁：院別 ---------- */
const chamberKey = ref('house')
const chamber = computed(() => CHAMBERS[chamberKey.value])

/* ---------- 1. 開票進度 ---------- */
const stepIdx = ref(0)
const snap = computed(() => chamber.value.snapshots[stepIdx.value])
const playing = ref(false)
let timer = null
function play() {
  stop(); playing.value = true; stepIdx.value = 0
  timer = setInterval(() => {
    if (stepIdx.value < chamber.value.snapshots.length - 1) stepIdx.value++
    else stop()
  }, 2200)
}
function stop() { playing.value = false; clearInterval(timer) }
onUnmounted(stop)
watch(chamberKey, () => { stop(); stepIdx.value = 0 })

/* 增減：開票中的席次未定，用「區間」表示 */
const change = computed(() => {
  const b = chamber.value.before, s = snap.value
  const dB = b.D + b.I, dN = s.D + s.I
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v)
  const range = (lo, hi) => lo === hi ? fmt(lo) : `${fmt(lo)} ～ ${fmt(hi)}`
  return {
    d: { now: dN, range: range(dN - dB, dN + s.P - dB), sure: s.P === 0 },
    r: { now: s.R, range: range(s.R - b.R, s.R + s.P - b.R), sure: s.P === 0 },
    pending: s.P,
  }
})
const majorityText = computed(() => {
  const s = snap.value, m = chamber.value.majority
  if (s.D + s.I >= m) return `民主黨陣營 ${s.D + s.I} 席，已確定過半（${m} 席）`
  if (s.R >= m) return `共和黨 ${s.R} 席，已確定過半`
  return '尚未有政黨確定過半'
})

/* ---------- 2. 歷史脈絡：刷選放大 ---------- */
const fullDomain = [1950, 2026]
const zoom = ref(null)
const viewDomain = useTween(() => zoom.value ?? fullDomain, { duration: 700 })
const zoomLabel = computed(() => zoom.value ? `${zoom.value[0]}–${zoom.value[1]} 年` : '全部（1950–2026 年）')
const hover = ref(null)
const hoverRow = computed(() => hover.value && HISTORY.find(r => r.year === hover.value.year))

/* 期中選舉年，民主黨眾院席次比上一屆增加多少；計算 2026 年在其中排第幾（由資料計算） */
const midtermSwing = computed(() => {
  const changes = HISTORY.filter(r => r.midterm && r.year > 1950).map(r => ({
    year: r.year, d: r.house.D - HISTORY.find(p => p.year === r.year - 2).house.D,
  }))
  const y26 = changes.at(-1).d
  return { n: changes.length, year2026: y26, rank: changes.filter(c => c.d > y26).length + 1 }
})

/* ---------- 3. 兩屆比較 ---------- */
const YEARS = HISTORY.map(r => r.year)
const idxA = ref(YEARS.indexOf(2024))
const idxB = ref(YEARS.indexOf(2026))
const yearA = computed(() => YEARS[idxA.value])
const yearB = computed(() => YEARS[idxB.value])
function pickYear(yr) { idxB.value = YEARS.indexOf(yr) }
const marks = computed(() => [
  { year: yearA.value, label: `A ${yearA.value}`, cls: 'a' },
  { year: yearB.value, label: `B ${yearB.value}`, cls: 'b' },
])
function preset(a, b) { idxA.value = YEARS.indexOf(a); idxB.value = YEARS.indexOf(b) }

/* ---------- 4. 參院地圖 ---------- */
const mapFilter = ref('all')
const FILTERS = [
  { k: 'all', label: '全部 35 州' }, { k: 'flip', label: '只看翻盤' },
  { k: 'D', label: '民主黨勝選' }, { k: 'R', label: '共和黨勝選' },
]
const filterCount = computed(() => mapFilter.value === 'all' ? 35
  : SENATE_RACES.filter(r => mapFilter.value === 'flip' ? r.flipped : r.party === mapFilter.value).length)
const picked = ref(null)
const tip = ref(null)
const flips = SENATE_RACES.filter(r => r.flipped)
const partyName = p => ({ D: '民主黨', R: '共和黨' }[p])
const ORIGINAL_IMG = `${import.meta.env.BASE_URL}original-cna.jpg`   // BASE_URL：GitHub Pages 子路徑也能正確載入
</script>

<template>
  <main>
    <header>
      <p class="kicker">HW3 新聞視覺化・Vue 3 + D3.js</p>
      <h1>2026 美國期中選舉：<br>民主黨重掌參眾兩院</h1>
      <div class="intro">
        <p class="lede">2026 年 11 月 3 日美國期中選舉，民主黨同時拿回參議院和眾議院，眾議院拿下 258 席，是 1992 年以來最多。
          這個頁面用互動圖表呈現開票進度、1950 年以來的席次變化、任兩屆選舉的比較，以及參議院 35 州的改選結果。</p>
        <figure class="news">
          <img :src="ORIGINAL_IMG" alt="中央社 2026 美國參眾議院選舉結果圖" />
          <figcaption>新聞來源：中央社〈<a :href="SOURCES.cna.url" target="_blank" rel="noopener">美期中選舉創多項歷史紀錄</a>〉附圖（2026/11/4）</figcaption>
        </figure>
      </div>
    </header>

    <!-- 全頁院別切換（黏在頂端） -->
    <div class="bar-sticky">
      <span class="bar-label">院別</span>
      <div class="seg-btns">
        <button v-for="(c, k) in CHAMBERS" :key="k" :class="{ on: chamberKey === k }" @click="chamberKey = k">{{ c.name }}</button>
      </div>
      <span class="bar-hint">切換後，下方第 1～3 張圖會一起更新</span>
    </div>

    <!-- ===== 1. 開票進度 ===== -->
    <section class="card">
      <h2>1. {{ chamber.name }}開票進度：從開票當晚到全部底定</h2>
      <div class="timeline">
        <button v-for="(s, i) in chamber.snapshots" :key="s.date" :class="['step', { on: stepIdx === i }]" @click="stop(); stepIdx = i">{{ s.label }}</button>
        <button class="play" @click="playing ? stop() : play()">{{ playing ? '⏸ 暫停' : '▶ 播放開票過程' }}</button>
      </div>
      <p class="sub">{{ chamber.note }}</p>

      <div class="cards">
        <div class="stat"><div class="k"><i class="sw d"></i>民主黨陣營（含獨立）</div><div class="v">{{ change.d.now }} 席</div>
          <div class="dlt">較改選前 {{ change.d.range }}<span v-if="!change.d.sure">（視未定席次而定）</span></div></div>
        <div class="stat"><div class="k"><i class="sw p"></i>開票中／未定</div><div class="v">{{ change.pending }} 席</div>
          <div class="dlt">{{ change.pending ? '增減以區間表示' : '全部確定' }}</div></div>
        <div class="stat"><div class="k"><i class="sw r"></i>共和黨</div><div class="v">{{ change.r.now }} 席</div>
          <div class="dlt">較改選前 {{ change.r.range }}<span v-if="!change.r.sure">（視未定席次而定）</span></div></div>
      </div>
      <p class="majority">{{ majorityText }}</p>

      <h3>改選前 vs {{ snap.label }}</h3>
      <CompareBars :before="chamber.before" :now="snap" :now-label="snap.label" :total="chamber.total" :majority="chamber.majority" />
      <h3>一格一席：{{ chamber.name }} {{ chamber.total }} 席</h3>
      <SeatWaffle :counts="snap" :total="chamber.total" :majority="chamber.majority" :rows="chamberKey === 'senate' ? 5 : 10" />
      <div class="legend">
        <span><i class="sw d"></i>民主黨</span><span><i class="sw i"></i>獨立（屬民主黨團）</span>
        <span><i class="sw p hatch"></i>開票中／未定</span><span><i class="sw r"></i>共和黨</span>
      </div>
      <p class="note" v-if="snap.note">※ {{ snap.note }}（資料：<a :href="SOURCES[snap.src].url" target="_blank" rel="noopener">{{ SOURCES[snap.src].name }}</a>）</p>
    </section>

    <!-- ===== 2. 歷史脈絡 ===== -->
    <section class="card">
      <div class="card-head">
        <div>
          <h2>2. 歷史脈絡：1950–2026 年{{ chamber.name }}席次</h2>
          <p class="sub">灰色直條為期中選舉年・目前顯示：{{ zoomLabel }}・點擊折線圖可設為比較年份 B</p>
        </div>
        <button v-if="zoom" class="btn" @click="zoom = null">顯示全部</button>
      </div>
      <div class="legend"><span><i class="sw d"></i>民主黨</span><span><i class="sw r"></i>共和黨</span></div>
      <HistoryChart :rows="HISTORY" :chamber="chamberKey" :x-domain="viewDomain" :hover-year="hover?.year ?? null" :marks="marks"
                    @hover="hover = $event" @leave="hover = null" @pick="pickYear" />
      <div class="overview">
        <p class="sub"><b>總覽：</b>在下圖拖曳選取年份區間即可放大上圖；點選框外空白處取消</p>
        <HistoryBrush :rows="HISTORY" :chamber="chamberKey" :full-domain="fullDomain" v-model="zoom" />
      </div>
      <p class="insight" v-if="chamberKey === 'house'">2026 年民主黨眾院席次比 2024 年增加 {{ midtermSwing.year2026 }} 席，
        在 1954–2026 年 {{ midtermSwing.n }} 次期中選舉中，民主黨增幅排第 {{ midtermSwing.rank }} 名。</p>
    </section>

    <!-- ===== 3. 兩屆比較 ===== -->
    <section class="card">
      <h2>3. 任選兩屆選舉比較（{{ chamber.name }}）</h2>
      <p class="sub">拖曳滑桿選年份，或直接點擊上方折線圖設定年份 B；淡色為年份 A、深色為年份 B</p>
      <div class="controls">
        <label class="ctl"><span class="chip a"></span>年份 A：<b>{{ yearA }}</b>
          <input type="range" min="0" :max="YEARS.length - 1" v-model.number="idxA" /></label>
        <label class="ctl"><span class="chip b"></span>年份 B：<b>{{ yearB }}</b>
          <input type="range" min="0" :max="YEARS.length - 1" v-model.number="idxB" /></label>
      </div>
      <div class="presets">
        <span>快速比較：</span>
        <button class="btn" @click="preset(2024, 2026)">2024 → 2026</button>
        <button class="btn" @click="preset(2008, 2010)">2008 → 2010</button>
        <button class="btn" @click="preset(1992, 1994)">1992 → 1994</button>
      </div>
      <ElectionCompare :rows="HISTORY" :chamber="chamberKey" :year-a="yearA" :year-b="yearB" />
    </section>

    <!-- ===== 4. 參院地圖 ===== -->
    <section class="card">
      <h2>4. 參議院 35 場改選：9 州從共和黨翻成民主黨</h2>
      <div class="presets">
        <span>篩選：</span>
        <button v-for="f in FILTERS" :key="f.k" :class="['btn', { on: mapFilter === f.k }]" @click="mapFilter = f.k">{{ f.label }}</button>
        <span class="count">{{ filterCount }} 州</span>
      </div>
      <div class="legend">
        <span><i class="sw d"></i>民主黨續任</span><span><i class="sw r"></i>共和黨續任</span>
        <span><i class="sw flip"></i>共和黨 → 民主黨（翻盤）</span><span><i class="sw none"></i>本次未改選</span>
      </div>
      <div class="map-wrap">
        <SenateMap :filter="mapFilter" @hover="tip = $event" @pick="picked = $event" />
        <div class="detail" v-if="picked">
          <button class="close" @click="picked = null">×</button>
          <div class="d-title">{{ STATE_ZH[picked.state] }}<small>{{ picked.state }}</small></div>
          <div>{{ picked.type }}</div>
          <div>改選前：{{ partyName(picked.before) }}</div>
          <div>勝選：<b>{{ picked.winner }}</b>（{{ partyName(picked.party) }}）</div>
          <div v-if="picked.flipped" class="t-flip">翻盤：共和黨 → 民主黨</div>
        </div>
        <p class="sub" v-else>點擊地圖上有顏色的州，可以固定顯示該州資料</p>
      </div>
      <ul class="flips">
        <li v-for="f in flips" :key="f.state"><b>{{ STATE_ZH[f.state] }}</b>{{ f.type === '補選' ? '（補選）' : '' }}：{{ f.winner }}</li>
      </ul>
    </section>

    <footer>
      <p><b>資料來源</b></p>
      <ul>
        <li v-for="s in SOURCES" :key="s.url"><a :href="s.url" target="_blank" rel="noopener">{{ s.name }}</a></li>
        <li><a :href="HISTORY_SOURCE.url" target="_blank" rel="noopener">{{ HISTORY_SOURCE.name }}</a></li>
      </ul>
      <p>標示「推算」的數字由公開數字計算而得，例如 11/22 眾院共和黨席次 = 435 − 民主黨 258 − 未定 4。2026 年歷史資料中的「其他」含未定席次。</p>
    </footer>

  </main>

  <!-- tooltip 用 Teleport 放到 body，不受頁面捲動與 transform 影響 -->
  <Teleport to="body">
    <!-- tooltip：地圖 -->
      <div v-if="tip" class="tooltip" :style="{ left: tip.x + 14 + 'px', top: tip.y + 14 + 'px' }">
        <div class="t-title">{{ tip.zh }}（{{ tip.race.state }}）{{ tip.race.type === '補選' ? '・補選' : '' }}</div>
        <div>改選前：{{ partyName(tip.race.before) }}</div>
        <div>勝選：<b>{{ tip.race.winner }}</b>（{{ partyName(tip.race.party) }}）</div>
        <div v-if="tip.race.flipped" class="t-flip">翻盤：共和黨 → 民主黨</div>
      </div>
      <!-- tooltip：歷史折線圖 -->
      <div v-if="hover && hoverRow" class="tooltip" :style="{ left: hover.clientX + 14 + 'px', top: hover.clientY + 14 + 'px' }">
        <div class="t-title">{{ hoverRow.year }} 年選舉{{ hoverRow.midterm ? '（期中選舉）' : '（總統大選年）' }}</div>
        <div><i class="sw d"></i>民主黨 <b>{{ hoverRow[chamberKey].D }}</b> 席</div>
        <div><i class="sw r"></i>共和黨 <b>{{ hoverRow[chamberKey].R }}</b> 席</div>
        <div v-if="hoverRow[chamberKey].O">其他／未定 {{ hoverRow[chamberKey].O }} 席</div>
      </div>
  </Teleport>
</template>

<style scoped>
main { max-width: 980px; margin: 0 auto; padding: 32px 16px 48px; }
.kicker { font-size: 12px; font-weight: 700; color: var(--accent); letter-spacing: .08em; margin: 0 0 6px; }
h1 { font-size: 30px; line-height: 1.3; margin: 0 0 12px; }
.intro { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 20px; align-items: start; margin-bottom: 18px; }
@media (max-width: 640px) { .intro { grid-template-columns: 1fr; } }
.lede { color: var(--text-2); font-size: 15px; line-height: 1.75; margin: 0; }
.news { margin: 0; }
.news img { width: 100%; border-radius: 6px; border: 1px solid var(--border); display: block; }
.news figcaption { font-size: 11px; color: var(--text-3); margin-top: 4px; line-height: 1.5; }
a { color: var(--d); }
.bar-sticky { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: var(--surface); padding: 10px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border); }
.bar-label { font-size: 13px; font-weight: 700; }
.bar-hint { font-size: 12px; color: var(--text-3); }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
h2 { font-size: 18px; margin: 0 0 10px; }
h3 { font-size: 14px; margin: 18px 0 6px; }
.sub { font-size: 12px; color: var(--text-2); margin: 4px 0 8px; }
.seg-btns { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; background: var(--panel); }
.seg-btns button { font: inherit; font-size: 13px; padding: 6px 18px; border: 0; background: transparent; color: var(--text-2); cursor: pointer; }
.seg-btns button.on { background: var(--text-1); color: var(--panel); font-weight: 700; }
.timeline, .presets { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.presets { margin: 8px 0; font-size: 12px; color: var(--text-2); }
.count { font-weight: 700; color: var(--text-1); margin-left: 4px; }
.step, .play, .btn { font: inherit; font-size: 12px; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--surface); color: var(--text-1); cursor: pointer; }
.step.on, .btn.on { border-color: var(--text-1); font-weight: 700; background: var(--panel); }
.play { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
@media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }
.stat { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.stat .k { font-size: 12px; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
.stat .v { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 2px 0; }
.stat .dlt { font-size: 12px; color: var(--text-2); }
.stat .dlt span { color: var(--text-3); }
.majority { font-size: 13px; font-weight: 700; margin: 10px 0 0; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 5px; }
.sw.d { background: var(--d); } .sw.i { background: var(--i); } .sw.r { background: var(--r); } .sw.p { background: var(--p); }
.sw.hatch { background: repeating-linear-gradient(45deg, var(--p) 0 3px, var(--text-3) 3px 4.5px); }
.sw.none { background: var(--norace); outline: 1px solid var(--border); }
.sw.flip { background: repeating-linear-gradient(45deg, var(--d) 0 4px, var(--r) 4px 6px); outline: 2px solid var(--flip); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--text-2); margin: 8px 0; }
.note { font-size: 12px; color: var(--text-3); line-height: 1.6; margin: 6px 0 0; }
.overview { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); }
.insight { font-size: 13px; font-weight: 700; margin: 10px 0 0; padding: 8px 12px; border-radius: 8px; background: var(--surface); }
.controls { display: flex; flex-wrap: wrap; gap: 10px 32px; margin: 6px 0; }
.ctl { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }
.ctl b { color: var(--text-1); min-width: 3em; display: inline-block; font-variant-numeric: tabular-nums; }
.ctl input { width: 220px; accent-color: var(--text-2); }
.chip { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.chip.a { background: var(--text-3); opacity: .45; } .chip.b { background: var(--text-1); }
.map-wrap { position: relative; }
.detail { position: absolute; right: 0; bottom: 8px; width: 210px; background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.7; box-shadow: 0 4px 16px rgba(0,0,0,.12); }
.d-title { font-size: 16px; font-weight: 700; }
.d-title small { font-size: 11px; color: var(--text-3); margin-left: 6px; font-weight: 400; }
.close { position: absolute; top: 4px; right: 8px; border: 0; background: none; color: var(--text-2); font-size: 18px; cursor: pointer; }
.flips { display: flex; flex-wrap: wrap; gap: 6px 14px; list-style: none; padding: 0; margin: 10px 0 0; font-size: 13px; color: var(--text-2); }
.flips b { color: var(--text-1); }
footer { font-size: 12px; color: var(--text-3); line-height: 1.7; }
footer ul { margin: 0 0 6px; padding-left: 18px; }
.tooltip { position: fixed; pointer-events: none; background: var(--panel); color: var(--text-1); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 10px; font-size: 12px; line-height: 1.7; box-shadow: 0 4px 16px rgba(0,0,0,.15); z-index: 10; }
.t-title { font-weight: 700; font-size: 13px; }
.t-flip { color: var(--accent); font-weight: 700; }
</style>
