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
    glowColor: 'rgba(255, 77, 87, 0.45)',
    areaStart: 'rgba(255, 77, 87, 0.34)',
    areaMid: 'rgba(255, 77, 87, 0.14)',
    areaEnd: 'rgba(255, 77, 87, 0.01)'
  },
  current: {
    label: '전류',
    unit: 'A',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.42)',
    areaStart: 'rgba(250, 204, 21, 0.32)',
    areaMid: 'rgba(250, 204, 21, 0.13)',
    areaEnd: 'rgba(250, 204, 21, 0.01)'
  },
  voltage: {
    label: '전압',
    unit: 'V',
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.44)',
    areaStart: 'rgba(96, 165, 250, 0.34)',
    areaMid: 'rgba(96, 165, 250, 0.14)',
    areaEnd: 'rgba(96, 165, 250, 0.01)'
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

const currentAxisRange = computed(() => {
  const values = chartSeriesData.value.map((item) => item.value)

  if (!values.length) {
    return { min: 0, max: 100, interval: null }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const rawRange = max - min
  const safeRange = rawRange === 0 ? 1 : rawRange

  let axisMin = min
  let axisMax = max
  let interval = null

  if (activeTab.value === 'voltage') {
    interval = 0.5

    const paddedMin = min - Math.max(safeRange * 0.2, 0.2)
    const paddedMax = max + Math.max(safeRange * 0.2, 0.2)

    axisMin = Math.floor(paddedMin / interval) * interval
    axisMax = Math.ceil(paddedMax / interval) * interval
  } else if (activeTab.value === 'current') {
    axisMin = Math.max(0, min - Math.max(safeRange * 0.25, 0.3))
    axisMax = max + Math.max(safeRange * 0.2, 0.3)
    interval = null
  } else if (activeTab.value === 'temperature') {
    interval = 2

    const paddedMin = Math.max(0, min - Math.max(safeRange * 0.2, 0.8))
    const paddedMax = max + Math.max(safeRange * 0.15, 0.8)

    axisMin = Math.floor(paddedMin / interval) * interval
    axisMax = Math.ceil(paddedMax / interval) * interval
  }

  return {
    min: Number(axisMin.toFixed(2)),
    max: Number(axisMax.toFixed(2)),
    interval
  }
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
    animationDuration: 900,
    animationEasing: 'quarticOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicOut',
    grid: {
      top: 25,
      right: 6,
      bottom: 4,
      left: 12,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(7, 14, 28, 0.96)',
      borderColor: meta.glowColor,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: {
        color: '#e5e7eb',
        fontSize: 12
      },
      extraCssText:
        'box-shadow: 0 12px 28px rgba(0,0,0,0.34); border-radius: 10px;',
      axisPointer: {
        type: 'line',
        snap: true,
        lineStyle: {
          color: meta.glowColor,
          width: 1.1
        }
      },
      formatter(params) {
        const point = params?.find((item) => item.seriesName === meta.label) || params?.[0]
        if (!point || !point.data) return ''

        const rawTime = point.data[2]
        const value = Number(point.data[1] ?? 0)

        return `
          <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;line-height:1.2;">
            ${formatTooltipTime(rawTime)}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:9px;height:9px;border-radius:50%;background:${meta.color};box-shadow:0 0 10px ${meta.glowColor};display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;line-height:1.2;color:${meta.color};">
              ${meta.label} ${value.toFixed(1)}${meta.unit}
            </span>
          </div>
        `
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: ['1.5%', '2.5%'],
      axisLabel: {
        show: false
      },
      axisTick: {
        show: true,
        inside: false,
        length: 5,
        lineStyle: {
          color: 'rgba(120, 136, 163, 0.28)'
        }
      },
      splitLine: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(88, 107, 139, 0.35)'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: axisRange.min,
      max: axisRange.max,
      interval: axisRange.interval,
      axisLabel: {
        color: '#9fb0cc',
        fontSize: 11,
        margin: 10,
        formatter(value) {
          return Number(value).toFixed(1)
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(90, 108, 138, 0.18)',
          width: 1
        }
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      }
    },
    series: [
      {
        name: `${meta.label}-glow`,
        type: 'line',
        data,
        smooth: 0.34,
        showSymbol: false,
        silent: true,
        z: 1,
        clip: true,
        lineStyle: {
          width: 8,
          color: meta.glowColor,
          opacity: 0.18,
          shadowBlur: 10,
          shadowColor: meta.glowColor
        },
        areaStyle: {
          color: 'transparent'
        }
      },
      {
        name: meta.label,
        type: 'line',
        data,
        smooth: 0.34,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        z: 3,
        clip: true,
        sampling: 'lttb',
        lineStyle: {
          width: 2.4,
          color: meta.color,
          shadowBlur: 10,
          shadowColor: meta.glowColor
        },
        itemStyle: {
          color: meta.color,
          borderColor: '#ffffff',
          borderWidth: 0.8,
          shadowBlur: 6,
          shadowColor: meta.glowColor
        },
        emphasis: {
          focus: 'series',
          scale: 1.4,
          itemStyle: {
            color: '#ffffff',
            borderColor: meta.color,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: meta.glowColor
          },
          lineStyle: {
            width: 2.8
          }
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: meta.areaStart },
            { offset: 0.58, color: meta.areaMid },
            { offset: 1, color: meta.areaEnd }
          ])
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 10,
          animation: true,
          itemStyle: {
            color: '#ffffff',
            borderColor: meta.color,
            borderWidth: 2.5,
            shadowBlur: 14,
            shadowColor: meta.glowColor
          },
          label: {
            show: false
          },
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
  background: #444d56;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.tab-button:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.tab-button:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
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
  box-shadow: 0 0 12px rgba(47, 128, 237, 0.28);
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
  background: #ff4d57;
  box-shadow: 0 0 8px rgba(255, 77, 87, 0.45);
}

.legend-line.current {
  background: #facc15;
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.42);
}

.legend-line.voltage {
  background: #60a5fa;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.44);
}

.chart-main {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 280px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(24, 48, 92, 0.18), transparent 42%),
    linear-gradient(to bottom, rgba(13, 25, 51, 0.94), rgba(8, 15, 28, 1)),
    #0a1220;
}

.echart-box {
  width: 100%;
  height: 100%;
  min-height: 280px;
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