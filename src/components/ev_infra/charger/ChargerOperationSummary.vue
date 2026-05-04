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
            <span class="summary-value-week">
              {{ Number(displayAvg7DayUsage || 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }) }}
            </span>
            <span class="summary-unit-week">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change" :class="weekChangeClass">
              {{ weekChangeDisplayText }}
            </span>
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
            <span class="summary-value-month">
              {{ Number(displayAvg30DayUsage || 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }) }}
            </span>
            <span class="summary-unit-month">kWh</span>
          </div>

          <div class="summary-change-wrap">
            <span class="summary-change" :class="monthChangeClass">
              {{ monthChangeDisplayText }}
            </span>
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
          <div v-for="(value, index) in animatedBars" :key="index" class="bar-col">
            <div class="bar" :style="{
              height: `${(value / maxBarAxisValue) * 100}%`,
              transitionDelay: `${index * 35}ms`
            }" @mouseenter="showTooltip($event, labels[index], bars[index])" @mousemove="moveTooltip($event)"
              @mouseleave="hideTooltip"></div>
          </div>
        </div>

        <svg class="line-series" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2f7df6" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#2f7df6" stop-opacity="0" />
            </linearGradient>
          </defs>

          <polygon v-if="lineVisible" :points="`${animatedLinePoints} 100,100 0,100`" fill="url(#lineAreaGradient)" />

          <polyline v-if="lineVisible" ref="linePolylineRef" class="animated-line" fill="none" stroke="#fbb900"
            stroke-width="0.2" :points="animatedLinePoints" />
        </svg>

        <div v-if="lineVisible" class="line-point-layer">
          <div v-for="(value, index) in animatedLine" :key="`point-${index}`" class="line-point" :style="{
            left: `${((index + 0.5) / animatedLine.length) * 100}%`,
            top: `${100 - (Number(value || 0) / maxBarAxisValue) * 100}%`,
            transitionDelay: `${index * 35}ms`
          }"></div>
        </div>

        <div class="x-axis">
          <span v-for="label in labels" :key="label">{{ label }}</span>
        </div>

        <div v-if="tooltip.show" class="chart-tooltip" :style="{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`
        }">
          {{ tooltip.label }}:00시 : <br>
          <p class="kwh-font">{{ Number(tooltip.value || 0).toLocaleString() }} kWh</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const lineVisible = ref(false)

const animatedBars = ref([])
const animatedLine = ref([])

const avg7DayUsage = ref(0)
const avg30DayUsage = ref(0)
const weekChange = ref(0)
const monthChange = ref(0)

const displayAvg7DayUsage = ref(0)
const displayAvg30DayUsage = ref(0)
const displayWeekChange = ref(0)
const displayMonthChange = ref(0)

const linePolylineRef = ref(null)

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

const weekChangeDisplayText = computed(() => {
  if (weekChange.value === 'NEW') return '신규'
  return formatChangeText(displayWeekChange.value)
})

const monthChangeDisplayText = computed(() => {
  if (monthChange.value === 'NEW') return '신규'
  return formatChangeText(displayMonthChange.value)
})

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

const animatedLinePoints = computed(() => {
  if (!animatedLine.value.length) return ''

  const max = Number(maxBarAxisValue.value || 1)
  const count = animatedLine.value.length

  return animatedLine.value
    .map((value, index) => {
      const x = ((index + 0.5) / count) * 100
      const y = 100 - (Number(value || 0) / max) * 100
      return `${x},${y}`
    })
    .join(' ')
})

function animateValue({ from = 0, to = 0, duration = 900, onUpdate, onComplete }) {
  const start = performance.now()
  const startValue = Number(from || 0)
  const endValue = Number(to || 0)

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = startValue + (endValue - startValue) * eased

    onUpdate(current)

    if (progress < 1) {
      requestAnimationFrame(step)
    } else if (onComplete) {
      onComplete()
    }
  }

  requestAnimationFrame(step)
}

function animateBarsAndLine() {
  const targetBars = [...bars.value]
  const targetLine = [...line.value]

  animatedBars.value = targetBars.map(() => 0)
  animatedLine.value = [...targetLine]

  const barAnimationDuration = 380
  const barStaggerDelay = 16

  return new Promise((resolve) => {
    if (!targetBars.length) {
      resolve()
      return
    }

    const lastIndex = targetBars.length - 1

    targetBars.forEach((target, index) => {
      setTimeout(() => {
        animateValue({
          from: 0,
          to: Number(target || 0),
          duration: barAnimationDuration,
          onUpdate: (value) => {
            const next = [...animatedBars.value]
            next[index] = value
            animatedBars.value = next
          },
          onComplete: () => {
            if (index === lastIndex) {
              setTimeout(resolve, 20)
            }
          }
        })
      }, index * barStaggerDelay)
    })
  })
}

async function animateLineStroke() {
  await nextTick()

  const polyline = linePolylineRef.value
  if (!polyline) return

  const length = polyline.getTotalLength()

  polyline.style.transition = 'none'
  polyline.style.strokeDasharray = `${length}`
  polyline.style.strokeDashoffset = `${length}`
  polyline.getBoundingClientRect()

  requestAnimationFrame(() => {
    polyline.style.transition = 'stroke-dashoffset 0.45s ease'
    polyline.style.strokeDashoffset = '0'
  })
}

function animateSummaryNumbers() {
  animateValue({
    from: 0,
    to: avg7DayUsage.value,
    duration: 900,
    onUpdate: (value) => {
      displayAvg7DayUsage.value = value
    }
  })

  animateValue({
    from: 0,
    to: avg30DayUsage.value,
    duration: 1000,
    onUpdate: (value) => {
      displayAvg30DayUsage.value = value
    }
  })

  if (weekChange.value === 'NEW') {
    displayWeekChange.value = 0
  } else {
    animateValue({
      from: 0,
      to: Number(weekChange.value || 0),
      duration: 850,
      onUpdate: (value) => {
        displayWeekChange.value = value
      }
    })
  }

  if (monthChange.value === 'NEW') {
    displayMonthChange.value = 0
  } else {
    animateValue({
      from: 0,
      to: Number(monthChange.value || 0),
      duration: 950,
      onUpdate: (value) => {
        displayMonthChange.value = value
      }
    })
  }
}

async function runAnimations() {
  lineVisible.value = false

  await animateBarsAndLine()
  animateSummaryNumbers()

  lineVisible.value = true
  await nextTick()
  await animateLineStroke()
}

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

const loadAll = async () => {
  await Promise.all([fetchChargingSummary(), fetchAverageUsage()])
  await runAnimations()
}

onMounted(() => {
  loadAll()
})

watch(
  () => [props.startDate, props.endDate],
  () => {
    loadAll()
  }
)
</script>

<style scoped>
.charger-operation-summary {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ── 1. 타이틀 ── */
.header-row {
  margin-bottom: 17px;
}

.card-title {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
}

/* ── 2. 상단 요약 박스 ── */
.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px;
  margin-bottom: 20px;
}

.summary-box {
  padding: 15px 17px;
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.3);
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
  color: rgba(245, 245, 245, 0.6);
  font-size: 16px;
  font-weight: 600;
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

.summary-bottom {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-value-week {
  color: #82c2e3;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.2;
}

.summary-value-month {
  color: #fbb900;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.2;
}

.summary-unit-week {
  color: #82c2e3;
  font-size: 14px;
  font-weight: 600;
}

.summary-unit-month {
  color: #fbb900;
  font-size: 14px;
  font-weight: 600;
}

.summary-change-wrap {
  margin-top: 10px;
}

.summary-change {
  font-size: 14px;
  font-weight: 700;
}

.summary-change.up {
  color: #00e676;
}

.summary-change.down {
  color: #ff0000;
}

.summary-change.same {
  color: rgba(245, 245, 245, 0.6);
}

/* ── 3. 차트 영역 ── */
.chart-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.chart-legend {
  display: flex;
  gap: 18px;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(245, 245, 245, 0.6);
  font-size: 13px;
  font-weight: 500;
}

.chart-wrap {
  flex: 1;
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 10px;
}

.y-axis {
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: rgba(245, 245, 245, 0.4);
  font-size: 12px;
}

.chart-main {
  position: relative;
  min-height: 290px;
  padding-bottom: 28px;
}

/* 배경 격자선 */
.grid-lines {
  position: absolute;
  inset: 0 0 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-lines span {
  border-top: 1px solid rgba(245, 245, 245, 0.05);
  width: 100%;
}

/* 바 & 라인 시리즈 유지 */
.bar-series {
  position: absolute;
  inset: 0 0 28px 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  align-items: end;
  gap: 4px;
  z-index: 1;
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
  background: linear-gradient(to top, #5ea7cf 0%, #82c2e3 100%);
  cursor: pointer;
  transition: height 0.65s, transform 0.2s;
  transform-origin: bottom;
}

.bar:hover {
  transform: translateY(-2px);
}

.line-series {
  position: absolute;
  inset: 0 0 28px 0;
  width: 100%;
  height: calc(100% - 28px);
  pointer-events: none;
  z-index: 3;
}

.animated-line {
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* 꺾은선 점(Point) 디자인 */
.line-point-layer {
  position: absolute;
  inset: 0 0 28px 0;
  pointer-events: none;
  z-index: 4;
}

.line-point {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbb900;
  border: 2px solid #000;
  transform: translate(-50%, -50%);
  transition: top 0.8s;
}

/* X축 라벨 */
.x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  text-align: center;
  color: rgba(245, 245, 245, 0.4);
  font-size: 11px;
}

/* 툴팁 */
.chart-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  padding: 8px 12px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #ffffff;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  transform: translate(-50%, -120%);
}

.kwh-font {
  margin: 0;
  color: #82c2e3;
  font-size: 14px;
  font-weight: 700;
}
</style>