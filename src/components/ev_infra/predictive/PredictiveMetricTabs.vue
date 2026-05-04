<template>
  <div class="metric-tabs-section">
    <div class="top-row">
      <h3 class="section-title">AI 예지보전 분석</h3>

      <div class="tab-buttons">
        <button type="button" class="tab-button" :class="{ active: activeTab === 'temperature' }"
          @click="activeTab = 'temperature'">
          온도
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'current' }"
          @click="activeTab = 'current'">
          전류
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'voltage' }"
          @click="activeTab = 'voltage'">
          전압
        </button>
      </div>
    </div>

    <div class="metric-title-row">
      <div class="metric-unit">{{ currentUnitLabel }}</div>

      <div class="legend-row">
        <span v-if="activeTab === 'temperature'" class="legend-item temperature">
          <span class="legend-line temperature"></span>
          온도
        </span>

        <span v-if="activeTab === 'current'" class="legend-item current">
          <span class="legend-line current"></span>
          전류
        </span>

        <span v-if="activeTab === 'voltage'" class="legend-item voltage">
          <span class="legend-line voltage"></span>
          전압
        </span>
      </div>
    </div>

    <div v-if="hasAnyData" class="chart-main">
      <div ref="chartRef" class="echart-box"></div>
    </div>

    <div v-else class="empty-box">
      표시할 데이터가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

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
const chartRef = ref(null)

let chartInstance = null
let resizeObserver = null

const SERIES_META = {
  temperature: {
    label: '온도',
    unit: '°C',
    color: '#ff4d57',
    glowColor: 'rgba(255, 77, 87, 0.45)'
  },
  current: {
    label: '전류',
    unit: 'A',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.42)'
  },
  voltage: {
    label: '전압',
    unit: 'V',
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.44)'
  }
}

const currentMeta = computed(() => SERIES_META[activeTab.value])

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

const currentListByTab = computed(() => {
  if (activeTab.value === 'temperature') return temperatureList.value
  if (activeTab.value === 'current') return currentList.value
  return voltageList.value
})

const chartSeriesData = computed(() => {
  return currentListByTab.value
    .map((item) => {
      const date = parseMetricTimeToDate(item.time)
      if (!date) return null

      return {
        rawTime: item.time,
        time: date.getTime(),
        value: extractNumber(item.value)
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time)
})

const hasAnyData = computed(() => chartSeriesData.value.length > 0)

const latestPoint = computed(() => {
  if (!chartSeriesData.value.length) return null
  return chartSeriesData.value[chartSeriesData.value.length - 1]
})

function calcAxisRange(dataMin, dataMax) {
  const STEPS = 4 // 4구간 = 5라벨
  const range = dataMax - dataMin || 1
  const rawInterval = range / STEPS
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  const normalized = rawInterval / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const interval = nice * magnitude
  const niceMin = Math.floor(dataMin / interval) * interval
  // max = niceMin + 정확히 STEPS개 구간 → 라벨 항상 5개, 균등 간격 보장
  let niceMax = niceMin + interval * STEPS
  if (niceMax < dataMax) niceMax = niceMin + interval * (STEPS + 1)
  return { min: niceMin, max: niceMax, interval }
}

const currentAxisRange = computed(() => {
  const values = chartSeriesData.value.map((item) => item.value)
  if (!values.length) return { min: 0, max: 100, interval: 25 }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const safeRange = max - min || 1

  let dataMin, dataMax
  if (activeTab.value === 'voltage') {
    const pad = Math.max(safeRange * 0.2, 0.2)
    dataMin = min - pad
    dataMax = max + pad
  } else if (activeTab.value === 'current') {
    dataMin = Math.max(0, min - Math.max(safeRange * 0.25, 0.3))
    dataMax = max + Math.max(safeRange * 0.2, 0.3)
  } else {
    dataMin = Math.max(0, min - Math.max(safeRange * 0.2, 0.8))
    dataMax = max + Math.max(safeRange * 0.15, 0.8)
  }

  return calcAxisRange(dataMin, dataMax)
})

function getMarkPointData() {
  if (!latestPoint.value) return []

  return [
    {
      coord: [latestPoint.value.time, latestPoint.value.value],
      value: latestPoint.value.value
    }
  ]
}

function buildChartOption() {
  const meta = currentMeta.value
  const axisRange = currentAxisRange.value
  const data = chartSeriesData.value.map((item) => [item.time, item.value, item.rawTime])

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 400,
    animationEasingUpdate: 'cubicOut',
    grid: {
      top: 20,
      right: 10,
      bottom: 4,
      left: 8,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(7, 14, 28, 0.96)',
      borderColor: meta.glowColor,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: '#e5e7eb', fontSize: 12 },
      extraCssText: 'box-shadow: 0 12px 28px rgba(0,0,0,0.34); border-radius: 10px;',
      axisPointer: {
        type: 'line',
        snap: true,
        lineStyle: { color: meta.glowColor, width: 1, type: 'dashed' }
      },
      formatter(params) {
        const point = params?.find((item) => item.seriesName === meta.label) || params?.[0]
        if (!point || !point.data) return ''
        const rawTime = point.data[2]
        const value = Number(point.data[1] ?? 0)
        return `
          <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">${formatTooltipTime(rawTime)}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${meta.color};box-shadow:0 0 8px ${meta.glowColor};display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:${meta.color};">${meta.label} ${value.toFixed(1)}${meta.unit}</span>
          </div>`
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: ['1%', '2%'],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { lineStyle: { color: 'rgba(88, 107, 139, 0.25)' } }
    },
    yAxis: {
      type: 'value',
      min: axisRange.min,
      max: axisRange.max,
      interval: axisRange.interval,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        margin: 8,
        formatter(value) {
          return Number(value).toFixed(1)
        }
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(255,255,255,0.05)', width: 1 }
      },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    series: [
      {
        name: `${meta.label}-glow`,
        type: 'line',
        data,
        smooth: 0.3,
        showSymbol: false,
        silent: true,
        z: 1,
        clip: true,
        lineStyle: {
          width: 6,
          color: meta.glowColor,
          opacity: 0.15,
          shadowBlur: 8,
          shadowColor: meta.glowColor
        },
        areaStyle: { color: 'transparent' }
      },
      {
        name: meta.label,
        type: 'line',
        data,
        smooth: 0.3,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        z: 3,
        clip: true,
        sampling: 'lttb',
        lineStyle: {
          width: 2,
          color: meta.color,
          shadowBlur: 8,
          shadowColor: meta.glowColor
        },
        itemStyle: {
          color: meta.color,
          borderColor: meta.color,
          borderWidth: 1,
          shadowBlur: 4,
          shadowColor: meta.glowColor
        },
        emphasis: {
          focus: 'series',
          scale: 1.5,
          itemStyle: {
            color: '#ffffff',
            borderColor: meta.color,
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: meta.glowColor
          },
          lineStyle: { width: 2.5 }
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 9,
          animation: false,
          itemStyle: {
            color: '#ffffff',
            borderColor: meta.color,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: meta.glowColor
          },
          label: { show: false },
          data: getMarkPointData()
        }
      }
    ]
  }
}

async function initChart() {
  await nextTick()

  if (!chartRef.value || chartInstance) return

  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildChartOption(), true)
}

function updateChart() {
  if (!chartInstance) return
  chartInstance.setOption(buildChartOption(), true)
  chartInstance.resize()
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(async () => {
  if (hasAnyData.value) {
    await initChart()
  }

  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })

  if (chartRef.value) {
    resizeObserver.observe(chartRef.value)
  }

  window.addEventListener('resize', handleResize)
})

watch(
  hasAnyData,
  async (value) => {
    if (value) {
      if (!chartInstance) {
        await initChart()
      } else {
        updateChart()
      }
    } else if (chartInstance) {
      chartInstance.clear()
    }
  }
)

watch(
  [activeTab, chartSeriesData, currentAxisRange],
  async () => {
    if (!hasAnyData.value) return

    if (!chartInstance) {
      await initChart()
      return
    }

    updateChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  window.removeEventListener('resize', handleResize)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.metric-tabs-section {
  width: 100%; 
  height: 100%;
  flex: 1;
  display: flex; 
  flex-direction: column;
}
.top-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 17px;
}

.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}

.tab-buttons {
  display: flex;
  gap: 8px;
}

.tab-button {
  height: 28px;
  padding: 0 14px;
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: 999px;
  background: transparent;
  color: rgba(245, 245, 245, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.tab-button.active {
  background: rgba(130, 194, 227, 0.15);
  border-color: #82c2e3;
  color: #fff;
}

.metric-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-unit {
  font-size: 14px;
  color: rgba(245, 245, 245, 0.4);
}

.legend-row {
  display: flex;
  gap: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.legend-line {
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.legend-item.temperature {
  color: #ff0000;
}

.legend-line.temperature {
  background: #ff0000;
}

.legend-item.current {
  color: #fbb900;
}

.legend-line.current {
  background: #fbb900;
}

.legend-item.voltage {
  color: #82c2e3;
}

.legend-line.voltage {
  background: #82c2e3;
}

/* 차트 메인 영역 (데이터 유무 상관없이 높이 유지) */
.chart-main {
  flex: 1;
  min-height: 240px;
}

.echart-box {
  width: 100%;
  height: 100%;
}

/* 데이터 없을 때 뜨는 빈 박스 */
.empty-box {
  flex: 1; 
  height: 100%; 
  min-height: 240px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: rgba(245, 245, 245, 0.6); 
  font-size: 14px;
}

/* 메인 섹션 자체도 부모 카드를 가득 채우도록 강제 */
.metric-tabs-section {
  width: 100%; 
  height: 100%;
  display: flex; 
  flex-direction: column;
}
</style>