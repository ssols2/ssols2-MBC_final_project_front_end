<template>
  <div class="metric-tabs-section">
    <div class="top-row">
      <h3 class="section-title">AI 예지보전 분석</h3>

      <div class="tab-buttons">
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'temperature' }"
          @click="activeTab = 'temperature'"
        >
          온도
        </button>
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'current' }"
          @click="activeTab = 'current'"
        >
          전류
        </button>
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'voltage' }"
          @click="activeTab = 'voltage'"
        >
          전압
        </button>
      </div>
    </div>

    <div class="metric-title-row">
      <div class="metric-unit">{{ currentUnitLabel }}</div>

      <div class="legend-row">
        <span
          v-if="activeTab === 'temperature'"
          class="legend-item temperature"
        >
          <span class="legend-line temperature"></span>
          온도
        </span>

        <span
          v-if="activeTab === 'current'"
          class="legend-item current"
        >
          <span class="legend-line current"></span>
          전류
        </span>

        <span
          v-if="activeTab === 'voltage'"
          class="legend-item voltage"
        >
          <span class="legend-line voltage"></span>
          전압
        </span>
      </div>
    </div>

    <div
      v-if="hasAnyData"
      class="chart-main"
      @mouseleave="hoveredPoint = null"
    >
      <div class="y-axis-labels">
        <span
          v-for="tick in yTicks"
          :key="`y-${tick.value}`"
          class="y-label"
          :style="{ bottom: `${tick.bottom}%` }"
        >
          {{ tick.label }}
        </span>
      </div>

      <div class="grid-lines">
        <span
          v-for="tick in yTicks"
          :key="`grid-${tick.value}`"
          class="grid-line"
          :style="{ bottom: `${tick.bottom}%` }"
        ></span>
      </div>

      <div
        v-if="hoveredPoint"
        class="hover-guide"
        :style="{ left: `${hoveredPoint.x}%` }"
      ></div>

      <svg
        class="line-chart"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="temperatureAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="currentAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#facc15" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#facc15" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="voltageAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#60a5fa" stop-opacity="0" />
          </linearGradient>
        </defs>

        <template v-for="series in visibleSeries" :key="series.key">
          <path
            class="area-path"
            :class="series.key"
            :d="series.areaPath"
          />
          <path
            class="line-path"
            :class="series.key"
            :d="series.linePath"
            fill="none"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </svg>

      <div class="point-layer">
        <template v-for="series in visibleSeries" :key="`${series.key}-points`">
          <button
            v-for="(point, index) in series.points"
            :key="`${series.key}-${point.time}-${index}`"
            type="button"
            class="point-dot"
            :class="[series.key, { active: isHovered(series.key, point.time) }]"
            :style="{
              left: `${point.x}%`,
              bottom: `${point.y}%`
            }"
            @mouseenter="setHoveredPoint(series, point)"
          ></button>
        </template>
      </div>

      <div
        v-if="hoveredPoint"
        class="tooltip-box"
        :class="tooltipAlignClass"
        :style="tooltipStyle"
      >
        <div class="tooltip-time">{{ hoveredPoint.timeLabel }}</div>
        <div class="tooltip-value" :class="hoveredPoint.key">
          {{ hoveredPoint.label }} {{ hoveredPoint.valueLabel }}
        </div>
      </div>

      <div class="x-axis-labels">
        <div
          v-for="(item, index) in baseMetricList"
          :key="`${item.time}-${index}-label`"
          class="x-label"
        >
          <span class="x-tick"></span>
        </div>
      </div>
    </div>

    <div v-else class="empty-box">
      표시할 데이터가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  metricData: {
    type: Object,
    required: true
  },
  startDate: {
    type: [String, Date, null],
    default: null
  },
  endDate: {
    type: [String, Date, null],
    default: null
  }
})

const activeTab = ref('temperature')
const hoveredPoint = ref(null)

const currentUnitLabel = computed(() => {
  if (activeTab.value === 'temperature') return '온도 (°C)'
  if (activeTab.value === 'current') return '전류 (A)'
  return '전압 (V)'
})

function toDateOnly(value) {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const text = String(value).trim()
  const fullMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (fullMatch) {
    const year = Number(fullMatch[1])
    const month = Number(fullMatch[2]) - 1
    const day = Number(fullMatch[3])
    return new Date(year, month, day)
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  return null
}

function parseMetricTimeToDate(value) {
  if (!value) return null

  const text = String(value).trim()

  const fullDateTimeMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (fullDateTimeMatch) {
    const year = Number(fullDateTimeMatch[1])
    const month = Number(fullDateTimeMatch[2]) - 1
    const day = Number(fullDateTimeMatch[3])
    const hour = Number(fullDateTimeMatch[4] || 0)
    const minute = Number(fullDateTimeMatch[5] || 0)
    const second = Number(fullDateTimeMatch[6] || 0)

    return new Date(year, month, day, hour, minute, second)
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

function formatTooltipTime(value) {
  const date = parseMetricTimeToDate(value)
  if (!date) return String(value ?? '-')

  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${mm}-${dd} ${hh}:${mi}`
}

function extractNumber(value) {
  if (value === null || value === undefined) return 0
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isNaN(parsed) ? 0 : parsed
}

function filterByDate(list) {
  const start = toDateOnly(props.startDate)
  const end = toDateOnly(props.endDate)

  if (!start || !end) return list

  const startTime = start.getTime()
  const endTime = end.getTime()

  return list.filter((item) => {
    const itemDateTime = parseMetricTimeToDate(item.time)
    if (!itemDateTime) return false

    const itemDateOnly = new Date(
      itemDateTime.getFullYear(),
      itemDateTime.getMonth(),
      itemDateTime.getDate()
    )

    const itemTime = itemDateOnly.getTime()
    return itemTime >= startTime && itemTime <= endTime
  })
}

const temperatureList = computed(() => filterByDate(props.metricData.temperature || []))
const currentList = computed(() => filterByDate(props.metricData.current || []))
const voltageList = computed(() => filterByDate(props.metricData.voltage || []))

const baseMetricList = computed(() => {
  return activeTab.value === 'temperature'
    ? temperatureList.value
    : activeTab.value === 'current'
      ? currentList.value
      : voltageList.value
})

function buildSeriesStats(list) {
  const values = list.map((item) => extractNumber(item.value))

  if (!values.length) {
    return { min: 0, max: 100, range: 100 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  let range = max - min

  if (range === 0) range = 1

  return { min, max, range }
}

const seriesStats = computed(() => ({
  temperature: buildSeriesStats(temperatureList.value),
  current: buildSeriesStats(currentList.value),
  voltage: buildSeriesStats(voltageList.value)
}))

const currentAxisRange = computed(() => {
  const stats = seriesStats.value[activeTab.value]

  const min = Number(stats.min ?? 0)
  const max = Number(stats.max ?? 0)
  const range = Number(stats.range ?? 1)

  const padding = range * 0.4 || 1

  let axisMin = min - padding
  let axisMax = max + padding

  if (axisMin === axisMax) {
    axisMin -= 1
    axisMax += 1
  }

  return {
    min: axisMin,
    max: axisMax,
    range: axisMax - axisMin
  }
})

const yTicks = computed(() => {
  const axis = currentAxisRange.value
  const step = axis.range / 4

  return Array.from({ length: 5 }, (_, index) => {
    const value = axis.min + step * index
    return {
      value,
      label: Number(value.toFixed(1)),
      bottom: (index / 4) * 100
    }
  })
})

function normalizeValue(rawValue, key) {
  const axis =
    key === activeTab.value 
      ? currentAxisRange.value
      : currentAxisRange.value

  return ((rawValue - axis.min) / axis.range) * 100
}

function buildSmoothPath(points) {
  if (!points.length) return ''
  if (points.length === 1) {
    const p = points[0]
    return `M ${p.x} ${100 - p.y}`
  }

  const first = points[0]
  let d = `M ${first.x} ${100 - first.y}`

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]
    const next = points[i + 1]
    const controlX = (current.x + next.x) / 2
    d += ` C ${controlX} ${100 - current.y}, ${controlX} ${100 - next.y}, ${next.x} ${100 - next.y}`
  }

  return d
}

function buildSeries(list, key, label, suffix) {
  if (!list.length) {
    return {
      key,
      label,
      suffix,
      points: [],
      linePath: '',
      areaPath: ''
    }
  }

  const parsedTimes = list.map((item) => parseMetricTimeToDate(item.time))
  const validTimes = parsedTimes
    .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
    .map((date) => date.getTime())

  const minTime = validTimes.length ? Math.min(...validTimes) : 0
  const maxTime = validTimes.length ? Math.max(...validTimes) : 0
  const timeRange = maxTime - minTime

  const points = list.map((item, index) => {
    const rawValue = extractNumber(item.value)
    const parsedDate = parsedTimes[index]
    const currentTime =
      parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.getTime()
        : minTime

    const x =
      timeRange === 0
        ? (list.length === 1 ? 50 : (index / Math.max(list.length - 1, 1)) * 100)
        : ((currentTime - minTime) / timeRange) * 100

    const y = normalizeValue(rawValue, key)

    return {
      time: item.time,
      rawValue,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2))
    }
  })

  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`

  return {
    key,
    label,
    suffix,
    points,
    linePath,
    areaPath
  }
}

const seriesList = computed(() => [
  buildSeries(temperatureList.value, 'temperature', '온도', '°C'),
  buildSeries(currentList.value, 'current', '전류', 'A'),
  buildSeries(voltageList.value, 'voltage', '전압', 'V')
])

const visibleSeries = computed(() => {
  return seriesList.value.filter((series) => series.key === activeTab.value)
})

const hasAnyData = computed(() => visibleSeries.value.some((series) => series.points.length > 0))

function setHoveredPoint(series, point) {
  hoveredPoint.value = {
    key: series.key,
    label: series.label,
    suffix: series.suffix,
    time: point.time,
    timeLabel: formatTooltipTime(point.time),
    valueLabel: `${point.rawValue.toFixed(1)}${series.suffix}`,
    x: point.x,
    y: point.y
  }
}

function isHovered(key, time) {
  return hoveredPoint.value?.key === key && hoveredPoint.value?.time === time
}

const tooltipAlignClass = computed(() => {
  if (!hoveredPoint.value) return 'center'
  if (hoveredPoint.value.x >= 86) return 'right'
  if (hoveredPoint.value.x <= 14) return 'left'
  return 'center'
})

const tooltipStyle = computed(() => {
  if (!hoveredPoint.value) return {}

  let left = hoveredPoint.value.x
  if (left < 4) left = 4
  if (left > 96) left = 96

  let bottom = hoveredPoint.value.y + 8
  if (bottom > 92) bottom = 92

  return {
    left: `${left}%`,
    bottom: `${bottom}%`
  }
})
</script>

<style scoped>
.metric-tabs-section {
  width: 100%;
  height: 100%;
  min-height: 360px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.tab-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.tab-button {
  min-width: 52px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid #35508a;
  background: #111c3d;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.tab-button:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.tab-button:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.tab-button + .tab-button {
  margin-left: -1px;
}

.tab-button.active {
  background: #2f80ed;
  border-color: #2f80ed;
  color: #ffffff;
  position: relative;
  z-index: 1;
}

.metric-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.metric-unit {
  font-size: 11px;
  color: #cbd5e1;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
}

.legend-item.temperature {
  color: #fca5a5;
}

.legend-item.current {
  color: #fde68a;
}

.legend-item.voltage {
  color: #93c5fd;
}

.legend-line {
  width: 16px;
  height: 2px;
  border-radius: 999px;
  display: inline-block;
}

.legend-line.temperature {
  background: #ef4444;
}

.legend-line.current {
  background: #facc15;
}

.legend-line.voltage {
  background: #60a5fa;
}

.chart-main {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 240px;
  margin-left: 42px;
  padding-bottom: 24px;
  border-left: 1px solid rgba(107, 114, 128, 0.4);
  border-bottom: 1px solid rgba(107, 114, 128, 0.4);
  background:
    linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(13, 19, 27, 1)),
    #0d131b;
  overflow: visible;
}

.y-axis-labels {
  position: absolute;
  top: 0;
  bottom: 24px;
  left: -42px;
  width: 42px;
  z-index: 3;
}

.y-label {
  position: absolute;
  right: 8px;
  transform: translateY(50%);
  font-size: 11px;
  color: #94a3b8;
  line-height: 1;
  white-space: nowrap;
}

.grid-lines {
  position: absolute;
  inset: 0 0 24px 0;
  z-index: 0;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid rgba(71, 85, 105, 0.24);
}

.hover-guide {
  position: absolute;
  top: 0;
  bottom: 24px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.25),
    rgba(255, 255, 255, 0.02)
  );
  z-index: 1;
  pointer-events: none;
}

.line-chart {
  position: absolute;
  inset: 0 0 24px 0;
  width: 100%;
  height: calc(100% - 24px);
  z-index: 2;
  overflow: visible;
}

.area-path.temperature {
  fill: url(#temperatureAreaGradient);
}

.area-path.current {
  fill: url(#currentAreaGradient);
}

.area-path.voltage {
  fill: url(#voltageAreaGradient);
}

.line-path {
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.line-path.temperature {
  stroke: #ef4444;
}

.line-path.current {
  stroke: #facc15;
}

.line-path.voltage {
  stroke: #60a5fa;
}

.point-layer {
  position: absolute;
  inset: 0 0 24px 0;
  z-index: 3;
  pointer-events: none;
}

.point-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  margin-bottom: -4px;
  border-radius: 50%;
  border: 1px solid rgba(15, 23, 42, 0.95);
  pointer-events: auto;
  cursor: pointer;
  padding: 0;
  outline: none;
}

.point-dot.temperature {
  background: #ef4444;
}

.point-dot.current {
  background: #facc15;
}

.point-dot.voltage {
  background: #60a5fa;
}

.point-dot.active {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-bottom: -5px;
  background: #ffffff;
}

.tooltip-box {
  position: absolute;
  min-width: 108px;
  max-width: 160px;
  padding: 8px 10px;
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 8px;
  background: rgba(10, 18, 35, 0.96);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
  pointer-events: none;
  z-index: 6;
}

.tooltip-box.center {
  transform: translate(-50%, -8px);
}

.tooltip-box.left {
  transform: translate(0, -8px);
}

.tooltip-box.right {
  transform: translate(-100%, -8px);
}

.tooltip-time {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 4px;
  line-height: 1.2;
}

.tooltip-value {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.tooltip-value.temperature {
  color: #fca5a5;
}

.tooltip-value.current {
  color: #fde68a;
}

.tooltip-value.voltage {
  color: #93c5fd;
}

.x-axis-labels {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 24px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  pointer-events: none;
}

.x-label {
  display: flex;
  justify-content: flex-end;
  flex: 1 1 0;
}

.x-tick {
  width: 1px;
  height: 5px;
  background: rgba(107, 114, 128, 0.5);
}

.empty-box {
  flex: 1;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  border: 1px dashed #334155;
  border-radius: 8px;
  text-align: center;
  color: #94a3b8;
  background: #0f172a;
}

@media (max-width: 768px) {
  .top-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .metric-title-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>