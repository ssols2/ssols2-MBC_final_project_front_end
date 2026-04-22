<template>
  <div class="charger-operation-summary">
    <div class="header-row">
      <h3 class="card-title">EV 인프라 가동률</h3>
    </div>

    <div class="summary-row">
      <div class="summary-box">
        <div class="summary-top">
          <div class="summary-label">
            <span class="summary-icon-week bar"></span>
            <span>최근 7일 평균 사용량</span>
          </div>
        </div>

        <div class="summary-bottom">
          <div class="summary-value-wrap">
            <span class="summary-value-week">{{ Number(avg7DayUsage || 0).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            }) }}</span>
            <span class="summary-unit-week">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change" :class="weekChangeClass">{{ weekChangeText }}</span>
          </div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-top">
          <div class="summary-label">
            <span class="summary-icon-month bar"></span>
            <span>최근 30일 평균 사용량</span>
          </div>
        </div>

        <div class="summary-bottom">
          <div class="summary-value-wrap">
            <span class="summary-value-month">{{ Number(avg30DayUsage || 0).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            }) }}</span>
            <span class="summary-unit-month">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change" :class="monthChangeClass">{{ monthChangeText }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-header">
      <div class="chart-legend">
        <div class="chart-legend-item">
          <span>충전량(kWh)</span>
        </div>
      </div>
    </div>

    <div class="chart-wrap">
      <div class="y-axis">
        <span v-for="tick in leftAxisTicks" :key="tick">
          {{ Number(tick).toLocaleString() }}
        </span>
      </div>

      <div class="chart-main">
        <div class="grid-lines">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="bar-series">
          <div v-for="(value, index) in bars" :key="index" class="bar-col">
            <div
              class="bar"
              :style="{ height: `${(value / maxBarAxisValue) * 100}%` }"
              @mouseenter="showTooltip($event, labels[index], value)"
              @mousemove="moveTooltip($event)"
              @mouseleave="hideTooltip"
            ></div>
          </div>
        </div>

        <svg class="line-series" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2f7df6" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#2f7df6" stop-opacity="0" />
            </linearGradient>
          </defs>

          <polygon
            :points="`${linePoints} 100,100 0,100`"
            fill="url(#lineAreaGradient)"
          />

          <polyline
            fill="none"
            stroke="#fbb900"
            stroke-width="0.2"
            :points="linePoints"
          />
        </svg>
        
        <div class="line-point-layer">
          <div
            v-for="(value, index) in line"
            :key="`point-${index}`"
            class="line-point"
            :style="{
              left: `${((index + 0.5) / line.length) * 100}%`,
              top: `${100 - (Number(value || 0) / maxBarAxisValue) * 100}%`
            }"
          ></div>
        </div>

        <div class="x-axis">
          <span v-for="label in labels" :key="label">{{ label }}</span>
        </div>

        <div
          v-if="tooltip.show"
          class="chart-tooltip"
          :style="{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }"
        >
          {{ tooltip.label }}:00시 : <br> <p class="kwh-font">{{ Number(tooltip.value || 0).toLocaleString() }} kWh</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getChargingSummary, getChargingLogs } from '@/api/evPredictive'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
})

const labels = ref([])
const bars = ref([])
const line = ref([])

const avg7DayUsage = ref(0)
const avg30DayUsage = ref(0)
const weekChange = ref(0)
const monthChange = ref(0)

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date, days) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const calculateAverageKwh = (rows, days) => {
  const dailyMap = new Map()

  rows.forEach((row) => {
    const dayKey = String(row.time || '').slice(0, 10)
    const kwh = Number(row.totalChargeKwh ?? row.currentChargeKwh ?? 0)

    if (!dayKey) return

    dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + kwh)
  })

  const total = Array.from(dailyMap.values()).reduce((sum, value) => sum + value, 0)
  return total / days
}

const calculateChangeRate = (currentAvg, previousAvg) => {
  const current = Number(currentAvg || 0)
  const previous = Number(previousAvg || 0)

  if (previous === 0) {
    if (current > 0) return 'NEW'
    return 0
  }

  return ((current - previous) / previous) * 100
}

const formatChangeText = (value) => {
  if (value === 'NEW') return '신규'

  const num = Number(value || 0)

  if (num > 0) return `▲ ${num.toFixed(1)}%`
  if (num < 0) return `▼ ${Math.abs(num).toFixed(1)}%`
  return '0.0%'
}

const weekChangeText = computed(() => formatChangeText(weekChange.value))
const monthChangeText = computed(() => formatChangeText(monthChange.value))

const weekChangeClass = computed(() => {
  if (weekChange.value === 'NEW') return 'up'
  if (weekChange.value > 0) return 'up'
  if (weekChange.value < 0) return 'down'
  return 'same'
})

const monthChangeClass = computed(() => {
  if (monthChange.value === 'NEW') return 'up'
  if (monthChange.value > 0) return 'up'
  if (monthChange.value < 0) return 'down'
  return 'same'
})

const fetchAverageUsage = async () => {
  try {
    const today = new Date()

    const current7Start = formatDate(addDays(today, -6))
    const current7End = formatDate(today)
    const previous7Start = formatDate(addDays(today, -13))
    const previous7End = formatDate(addDays(today, -7))

    const current30Start = formatDate(addDays(today, -29))
    const current30End = formatDate(today)
    const previous30Start = formatDate(addDays(today, -59))
    const previous30End = formatDate(addDays(today, -30))

    const [current7Rows, previous7Rows, current30Rows, previous30Rows] = await Promise.all([
      getChargingLogs(current7Start, current7End, 'ALL'),
      getChargingLogs(previous7Start, previous7End, 'ALL'),
      getChargingLogs(current30Start, current30End, 'ALL'),
      getChargingLogs(previous30Start, previous30End, 'ALL')
    ])

    const current7Avg = calculateAverageKwh(current7Rows, 7)
    const previous7Avg = calculateAverageKwh(previous7Rows, 7)
    const current30Avg = calculateAverageKwh(current30Rows, 30)
    const previous30Avg = calculateAverageKwh(previous30Rows, 30)

    avg7DayUsage.value = current7Avg
    avg30DayUsage.value = current30Avg
    weekChange.value = calculateChangeRate(current7Avg, previous7Avg)
    monthChange.value = calculateChangeRate(current30Avg, previous30Avg)
  } catch (error) {
    console.error('fetchAverageUsage error:', error)
    avg7DayUsage.value = 0
    avg30DayUsage.value = 0
    weekChange.value = 0
    monthChange.value = 0
  }
}

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: 0
})

const showTooltip = (event, label, value) => {
  tooltip.value = {
    show: true,
    x: event.clientX + 12,
    y: event.clientY - 12,
    label,
    value
  }
}

const moveTooltip = (event) => {
  tooltip.value = {
    ...tooltip.value,
    x: event.clientX + 12,
    y: event.clientY - 12
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const fetchChargingSummary = async () => {
  try {
    const data = await getChargingSummary(props.startDate, props.endDate)

    labels.value = data.map((item) => `${item.hourLabel}`)
    bars.value = data.map((item) => Number(item.hourlyKwh || 0))
    line.value = data.map((item) => Number(item.hourlyKwh || 0))
  } catch (error) {
    console.error('getChargingSummary error:', error)
    labels.value = []
    bars.value = []
    line.value = []
  }
}

const linePoints = computed(() => {
  if (!line.value.length) return ''

  const max = Number(maxBarAxisValue.value || 1)
  const count = line.value.length

  return line.value
    .map((value, index) => {
      const x = ((index + 0.5) / count) * 100
      const y = 100 - (Number(value || 0) / max) * 100
      return `${x},${y}`
    })
    .join(' ')
})

const maxBarAxisValue = computed(() => {
  if (!bars.value.length) return 100

  const max = Math.max(...bars.value, 0)

  if (max <= 10) return 10
  if (max <= 50) return 50
  if (max <= 100) return 100
  if (max <= 200) return 200
  if (max <= 500) return 500

  return Math.ceil(max / 100) * 100
})

const leftAxisTicks = computed(() => {
  const max = maxBarAxisValue.value
  return [max, max * 0.75, max * 0.5, max * 0.25, 0]
})

const rightAxisTicks = computed(() => {
  const max = maxBarAxisValue.value
  return [max, max * 0.8, max * 0.6, max * 0.4, max * 0.2, 0]
})

onMounted(() => {
  fetchChargingSummary()
  fetchAverageUsage()
})

watch(
  () => [props.startDate, props.endDate],
  () => {
    fetchChargingSummary()
    fetchAverageUsage()
  }
)
</script>

<style scoped>
.charger-operation-summary {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.header-row {
  margin-bottom: 14px;
}

.card-title {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-box {
  padding: 10px 14px;
  border: 1px solid #2b3553;
  border-radius: 8px;
  background: #11182c;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.summary-icon.line {
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: #fbb900;
}

.summary-icon-week.bar {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #82c2e3;
}

.summary-icon-month.bar {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #fbb900;
}

.mini-line-chart {
  width: 46px;
  height: 26px;
  flex: 0 0 46px;
}

.mini-bar-chart {
  display: flex;
  align-items: end;
  gap: 4px;
  width: 44px;
  height: 28px;
  flex: 0 0 44px;
}

.mini-bar {
  width: 6px;
  background: #82c2e3;
  border-radius: 2px 2px 0 0;
}

.mini-bar.h1 { height: 14px; }
.mini-bar.h2 { height: 22px; }
.mini-bar.h3 { height: 28px; }
.mini-bar.h4 { height: 18px; }

.summary-bottom {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.summary-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-value-week {
  color: #82c2e3;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.5;
}

.summary-value-month {
  color: #fbb900;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.5;
}

.summary-unit-week {
  color: #82c2e3;
  font-size: 15px;
  font-weight: 600;
}

.summary-unit-month {
  color: #fbb900;
  font-size: 15px;
  font-weight: 600;
}

.summary-change-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  margin-right: -5px;
  margin-top: 14px;
}

.summary-change {
  color: #45c15a;
  font-size: 16px;
  font-weight: 700;
}

.summary-sub {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-legend {
  display: flex;
  gap: 18px;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.chart-line-sample {
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #fbb900;
}

.chart-bar-sample {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #82c2e3;
}

.chart-right-label {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.chart-wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 10px;
  align-items: stretch;
}

.y-axis {
  padding-top: 8px;
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  font-size: 14px;
}

.chart-main {
  position: relative;
  min-height: 290px;
  padding: 8px 0 28px;
}

.grid-lines {
  position: absolute;
  inset: 8px 0 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-lines span {
  display: block;
  width: 100%;
  border-top: 1px solid rgba(125, 162, 227, 0.18);
}

.bar-series {
  position: absolute;
  inset: 8px 0 28px 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  align-items: end;
  gap: 4px;
}

.bar-col {
  display: flex;
  justify-content: center;
  align-items: end;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 14px;
  background: linear-gradient(to top, #5ea7cf 0%, #a9ddf4 100%);
  cursor: pointer;
}

.line-series {
  position: absolute;
  inset: 8px 0 28px 0;
  width: 100%;
  height: calc(100% - 36px);
  pointer-events: none;
}

.x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  text-align: center;
  color: #ffffff;
  font-size: 13px;
}

.right-axis {
  padding-top: 8px;
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  font-size: 12px;
  text-align: right;
}

.chart-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  transform: translate(0, -100%);
  text-align: center;
}

.kwh-font{
  color: #fbb900;
  font-size: 14px;
  font-weight: 600;
}

.summary-change.up {
  color: #45c15a;
}

.summary-change.down {
  color: #ff4d4f;
}

.summary-change.same {
  color: #ffffff;
}

.line-point-layer {
  position: absolute;
  inset: 8px 0 28px 0;
  pointer-events: none;
}

.line-point {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffffff;
  transform: translate(-50%, -50%);
}
</style>