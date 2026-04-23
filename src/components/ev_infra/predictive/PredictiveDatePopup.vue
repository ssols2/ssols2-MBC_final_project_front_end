<template>
  <div v-if="visible" class="date-popup-layer" @click.stop>
    <div class="date-popup">
<div class="date-popup-header">
  <div class="date-popup-title-wrap">
    <h3 class="date-popup-title">조회 기간 설정</h3>
    <span class="header-date-range">
      {{ tempStartDate ? formatDate(tempStartDate) : '-' }} ~
      {{ tempEndDate ? formatDate(tempEndDate) : '-' }}
    </span>
  </div>

  <button type="button" class="icon-btn close-btn" @click="handleClose">
    ✕
  </button>
</div>

      <div class="calendar-wrap">
        <div class="calendar-panel">
          <div class="calendar-header">
            <button type="button" class="icon-btn nav-btn" @click="moveLeftMonth(-1)">‹</button>
            <div class="calendar-title">{{ leftCalendar.year }}년 {{ leftCalendar.month }}월</div>
            <button type="button" class="icon-btn nav-btn" @click="moveLeftMonth(1)">›</button>
          </div>

          <div class="weekday-row">
            <div v-for="day in weekDays" :key="`left-${day}`" class="weekday-cell">
              {{ day }}
            </div>
          </div>

          <div class="date-grid">
            <button
              v-for="dayObj in leftCalendarDays"
              :key="`left-${dayObj.key}`"
              type="button"
              class="date-cell"
              :class="getDateCellClass(dayObj)"
              @click="handleDateClick(dayObj)"
            >
              {{ dayObj.date.getDate() }}
            </button>
          </div>
        </div>

        <div class="calendar-panel">
          <div class="calendar-header">
            <button type="button" class="icon-btn nav-btn" @click="moveRightMonth(-1)">‹</button>
            <div class="calendar-title">{{ rightCalendar.year }}년 {{ rightCalendar.month }}월</div>
            <button type="button" class="icon-btn nav-btn" @click="moveRightMonth(1)">›</button>
          </div>

          <div class="weekday-row">
            <div v-for="day in weekDays" :key="`right-${day}`" class="weekday-cell">
              {{ day }}
            </div>
          </div>

          <div class="date-grid">
            <button
              v-for="dayObj in rightCalendarDays"
              :key="`right-${dayObj.key}`"
              type="button"
              class="date-cell"
              :class="getDateCellClass(dayObj)"
              @click="handleDateClick(dayObj)"
            >
              {{ dayObj.date.getDate() }}
            </button>
          </div>
        </div>
      </div>

      <div class="date-popup-footer">
        <div class="quick-range-row">
          <label class="quick-range-label" for="quickRangeSelect">빠른 선택</label>
          <select
            id="quickRangeSelect"
            v-model="selectedQuickRange"
            class="quick-range-select"
            @change="handleQuickRangeChange"
          >
            <option value="">직접 선택</option>
            <option value="today">오늘</option>
            <option value="yesterday">어제</option>
            <option value="last7">최근 7일</option>
            <option value="clear">초기화</option>
          </select>
        </div>

        <div class="footer-actions">
          <button type="button" class="footer-btn secondary" @click="handleClose">
            취소
          </button>
          <button type="button" class="footer-btn primary" @click="handleApply">
            적용
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: [String, Date, null],
    default: null,
  },
  endDate: {
    type: [String, Date, null],
    default: null,
  },
})

const emit = defineEmits([
  'close',
  'apply',
  'update:startDate',
  'update:endDate',
])

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const selectedQuickRange = ref('')
const tempStartDate = ref(null)
const tempEndDate = ref(null)

const leftCalendar = ref({ year: 2026, month: 4 })
const rightCalendar = ref({ year: 2026, month: 5 })

function toDateOnly(value) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDate(date) {
  const d = toDateOnly(date)
  if (!d) return '-'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDate(a, b) {
  const da = toDateOnly(a)
  const db = toDateOnly(b)

  if (!da || !db) return false

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function isBetweenDates(target, start, end) {
  const t = toDateOnly(target)
  const s = toDateOnly(start)
  const e = toDateOnly(end)

  if (!t || !s || !e) return false

  const time = t.getTime()
  return time > s.getTime() && time < e.getTime()
}

function getToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getYesterday() {
  const d = getToday()
  d.setDate(d.getDate() - 1)
  return d
}

function syncTempDatesFromProps() {
  tempStartDate.value = toDateOnly(props.startDate)
  tempEndDate.value = toDateOnly(props.endDate)

  const today = getToday()
  const baseStart = tempStartDate.value || today
  const baseEnd = tempEndDate.value
    ? tempEndDate.value
    : new Date(baseStart.getFullYear(), baseStart.getMonth() + 1, 1)

  leftCalendar.value = {
    year: baseStart.getFullYear(),
    month: baseStart.getMonth() + 1,
  }

  rightCalendar.value = {
    year: baseEnd.getFullYear(),
    month: baseEnd.getMonth() + 1,
  }

  selectedQuickRange.value = ''
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      syncTempDatesFromProps()
    }
  },
  { immediate: true }
)

watch(
  () => [props.startDate, props.endDate],
  () => {
    if (props.visible) {
      syncTempDatesFromProps()
    }
  }
)

function moveMonth(calendarRef, diff) {
  const current = calendarRef.value
  const moved = new Date(current.year, current.month - 1 + diff, 1)

  calendarRef.value = {
    year: moved.getFullYear(),
    month: moved.getMonth() + 1,
  }
}

function moveLeftMonth(diff) {
  moveMonth(leftCalendar, diff)
}

function moveRightMonth(diff) {
  moveMonth(rightCalendar, diff)
}

function createCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = firstDay.getDay()
  const gridStart = new Date(year, month - 1, 1 - firstWeekday)

  const result = []

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)

    result.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      date,
      isCurrentMonth: date.getMonth() === month - 1,
    })
  }

  return result
}

const leftCalendarDays = computed(() =>
  createCalendarDays(leftCalendar.value.year, leftCalendar.value.month)
)

const rightCalendarDays = computed(() =>
  createCalendarDays(rightCalendar.value.year, rightCalendar.value.month)
)

function handleDateClick(dayObj) {
  const picked = toDateOnly(dayObj.date)
  if (!picked) return

  selectedQuickRange.value = ''

  if (!tempStartDate.value || (tempStartDate.value && tempEndDate.value)) {
    tempStartDate.value = picked
    tempEndDate.value = null
    return
  }

  if (picked.getTime() < tempStartDate.value.getTime()) {
    tempEndDate.value = tempStartDate.value
    tempStartDate.value = picked
  } else {
    tempEndDate.value = picked
  }
}

function getDateCellClass(dayObj) {
  const date = dayObj.date

  return {
    'is-other-month': !dayObj.isCurrentMonth,
    'is-start': isSameDate(date, tempStartDate.value),
    'is-end': isSameDate(date, tempEndDate.value),
    'is-in-range': isBetweenDates(date, tempStartDate.value, tempEndDate.value),
    'is-single':
      tempStartDate.value &&
      tempEndDate.value &&
      isSameDate(tempStartDate.value, tempEndDate.value) &&
      isSameDate(date, tempStartDate.value),
  }
}

function selectToday() {
  const today = getToday()

  tempStartDate.value = today
  tempEndDate.value = today

  leftCalendar.value = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }

  rightCalendar.value = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }
}

function selectYesterday() {
  const yesterday = getYesterday()

  tempStartDate.value = yesterday
  tempEndDate.value = yesterday

  leftCalendar.value = {
    year: yesterday.getFullYear(),
    month: yesterday.getMonth() + 1,
  }

  rightCalendar.value = {
    year: yesterday.getFullYear(),
    month: yesterday.getMonth() + 1,
  }
}

function selectLast7Days() {
  const end = getToday()
  const start = new Date(end)
  start.setDate(end.getDate() - 6)

  tempStartDate.value = start
  tempEndDate.value = end

  leftCalendar.value = {
    year: start.getFullYear(),
    month: start.getMonth() + 1,
  }

  rightCalendar.value = {
    year: end.getFullYear(),
    month: end.getMonth() + 1,
  }
}

function clearRange() {
  const today = getToday()

  tempStartDate.value = today
  tempEndDate.value = today
  selectedQuickRange.value = 'clear'

  leftCalendar.value = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }

  rightCalendar.value = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }
}

function handleQuickRangeChange() {
  switch (selectedQuickRange.value) {
    case 'today':
      selectToday()
      break
    case 'yesterday':
      selectYesterday()
      break
    case 'last7':
      selectLast7Days()
      break
    case 'clear':
      clearRange()
      break
    default:
      break
  }
}

function handleClose() {
  emit('close')
}

function handleApply() {
  const normalizedStart = tempStartDate.value
    ? tempStartDate.value
    : getToday()

  const normalizedEnd = tempEndDate.value
    ? tempEndDate.value
    : normalizedStart

  const start = formatDate(normalizedStart)
  const end = formatDate(normalizedEnd)

  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('apply', {
    startDate: start,
    endDate: end,
  })
  emit('close')
}
</script>

<style scoped>
.date-popup-layer {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1000;
}

.date-popup {
  width: 600px;
  border-radius: 7px;
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  color: #e5edf8;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.date-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.date-popup-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.date-popup-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  flex-shrink: 0;
}

.header-date-range {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  white-space: nowrap;
  line-height: 1;
}

.icon-btn,
.footer-btn,
.date-cell {
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
}

.calendar-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 14px 18px 16px;
}

.calendar-panel {
  padding: 4px 2px 0;
  background: transparent;
  border: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.calendar-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  color: #cbd5e1;
  font-size: 16px;
  font-weight: 700;
}

.icon-btn:hover {
  background: rgba(148, 163, 184, 0.12);
}

.close-btn {
  font-size: 16px;
  color: #94a3b8;
}

.weekday-row,
.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday-row {
  margin-bottom: 6px;
}

.weekday-cell {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  padding: 6px 0;
}

.date-cell {
  height: 32.5px;
  padding: 0;
  background: transparent;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  border-radius: 0;
}

.date-cell:hover {
  background: rgba(148, 163, 184, 0.08);
}

.date-cell.is-other-month {
  color: rgba(148, 163, 184, 0.35);
}

.date-cell.is-in-range {
  background: rgba(125, 211, 252, 0.24);
  color: #f8fafc;
}

.date-cell.is-start,
.date-cell.is-end,
.date-cell.is-single {
  background: #7dd3fc;
  color: #0f172a;
  font-weight: 700;
}

.date-cell.is-start {
  border-radius: 999px 0 0 999px;
}

.date-cell.is-end {
  border-radius: 0 999px 999px 0;
}

.date-cell.is-single {
  border-radius: 999px;
}

.date-popup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px 18px;
}

.quick-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-range-label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.quick-range-select {
  min-width: 120px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #0f172a;
  font-size: 12px;
  color: #e2e8f0;
  outline: none;
}

.quick-range-select:focus {
  border-color: #7dd3fc;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-btn {
  min-width: 74px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.footer-btn.secondary {
  background: transparent;
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.65);
}

.footer-btn.secondary:hover {
  background: rgba(147, 197, 253, 0.1);
}

.footer-btn.primary {
  background: #7dd3fc;
  color: #0f172a;
}

.footer-btn.primary:hover {
  filter: brightness(1.05);
}

@media (max-width: 1024px) {
  .date-popup {
    width: 680px;
  }
}

@media (max-width: 768px) {
  .date-popup-layer {
    left: 0;
    right: auto;
  }

  .date-popup {
    width: min(92vw, 680px);
  }

  .calendar-wrap {
    grid-template-columns: 1fr;
  }

  .date-popup-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-range-row {
    justify-content: flex-start;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>