<template>
  <div class="history-table-section">
    <div class="history-header">
      <h3>기기별 상세 장애 이력 및 이벤트 관리</h3>

      <div class="status-filters">
        <button
          type="button"
          class="filter-btn all"
          :class="{ active: selectedFilter === 'ALL' }"
          @click="selectedFilter = 'ALL'"
        >
          전체({{ dateFilteredHistoryData.length }})
        </button>

        <button
          type="button"
          class="filter-btn check"
          :class="{ active: selectedFilter === 'CHECK' }"
          @click="selectedFilter = 'CHECK'"
        >
          <span class="filter-dot check"></span>
          점검
        </button>

        <button
          type="button"
          class="filter-btn risk"
          :class="{ active: selectedFilter === 'RISK' }"
          @click="selectedFilter = 'RISK'"
        >
          <span class="filter-dot risk"></span>
          위험
        </button>
      </div>

      <button class="sort-button" type="button" @click="toggleSortOrder">
        {{ sortOrderLabel }}
        <span class="sort-arrows">↕</span>
      </button>
    </div>

    <div class="table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>발생일시</th>
            <th>기기 ID</th>
            <th>설치 위치</th>
            <th>상태</th>
            <th>상세 내역</th>
            <th>처리 상태</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in pagedHistoryData"
            :key="item.id"
            :class="rowClass(item)"
          >
            <td>{{ formatOccurredAt(item.occurredAt) }}</td>
            <td>{{ item.chargerId }}</td>
            <td>{{ item.location || '-' }}</td>

            <td>
              <span class="status-text" :class="getStatusClass(item.status)">
                <span
                  v-if="showStatusDot(item)"
                  class="status-dot"
                  :class="getStatusClass(item.status)"
                ></span>
                {{ getStatusLabel(item.status) }}
              </span>
            </td>

            <td class="detail-cell" :class="getStatusClass(item.status)">
              {{ item.detail }}
            </td>

            <td>
              <div class="action-buttons">
                <template v-if="item.inspectionStatus === 'DONE'">
                  <span class="action-done complete">조치완료</span>
                </template>
              
                <template v-else-if="item.inspectionStatus === 'STATUS_UPDATED'">
                  <span class="action-done status-updated">상태업데이트</span>
                </template>
              
                <template v-else>
                  <template
                    v-if="
                      item.inspectionStatus === 'REQUESTED' ||
                      item.inspectionStatus === 'IN_PROGRESS'
                    "
                  >
                    <span class="action-done inspection-done">요청됨</span>
                  </template>
                  <button
                    v-else
                    type="button"
                    class="action-btn inspection"
                    @click="handleInspection(item)"
                  >
                    점검요청
                  </button>
                
                  <template v-if="item.shutdownDone">
                    <span class="action-done shutdown-done">전원꺼짐</span>
                  </template>
                  <button
                    v-else
                    type="button"
                    class="action-btn shutdown"
                    @click="handleShutdown(item)"
                  >
                    강제종료
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="pagedHistoryData.length === 0">
            <td colspan="6" class="empty-row">
              표시할 장애 이력이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button
        class="page-nav"
        type="button"
        :disabled="currentPage === 1"
        @click="goPrevPage"
      >
        ‹
      </button>

      <button
        v-for="page in totalPages"
        :key="page"
        type="button"
        class="page-number"
        :class="{ active: currentPage === page }"
        @click="currentPage = page"
      >
        {{ page }}
      </button>

      <button
        class="page-nav"
        type="button"
        :disabled="currentPage === totalPages"
        @click="goNextPage"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  historyData: {
    type: Array,
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

const emit = defineEmits(['inspection-request', 'force-shutdown'])

const sortOrder = ref('desc')
const selectedFilter = ref('ALL')
const currentPage = ref(1)
const pageSize = 6

const sortOrderLabel = computed(() => {
  return sortOrder.value === 'desc' ? '최신순' : '오래된순'
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

function parseOccurredAtToDate(value) {
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

const dateFilteredHistoryData = computed(() => {
  const start = toDateOnly(props.startDate)
  const end = toDateOnly(props.endDate)

  if (!start || !end) {
    return props.historyData
  }

  const startTime = start.getTime()
  const endTime = end.getTime()

  return props.historyData.filter((item) => {
    const occurredAt = parseOccurredAtToDate(item.occurredAt)
    if (!occurredAt) return false

    const occurredDateOnly = new Date(
      occurredAt.getFullYear(),
      occurredAt.getMonth(),
      occurredAt.getDate()
    )

    const itemTime = occurredDateOnly.getTime()
    return itemTime >= startTime && itemTime <= endTime
  })
})

const filteredHistoryData = computed(() => {
  const faultOnlyData = dateFilteredHistoryData.value.filter(
    (item) => item.status === 'CHECK' || item.status === 'RISK'
  )

  if (selectedFilter.value === 'ALL') {
    return faultOnlyData
  }

  return faultOnlyData.filter((item) => item.status === selectedFilter.value)
})

const sortedHistoryData = computed(() => {
  return [...filteredHistoryData.value].sort((a, b) => {
    const timeA = new Date(a.occurredAt).getTime()
    const timeB = new Date(b.occurredAt).getTime()

    if (sortOrder.value === 'desc') {
      return timeB - timeA
    }

    return timeA - timeB
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedHistoryData.value.length / pageSize))
})

const pagedHistoryData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sortedHistoryData.value.slice(start, end)
})

watch([selectedFilter, sortOrder, () => props.startDate, () => props.endDate], () => {
  currentPage.value = 1
})

watch(
  () => sortedHistoryData.value.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  }
)

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const goPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const goNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const getStatusLabel = (status) => {
  if (status === 'CHECK') return '점검'
  if (status === 'RISK') return '위험'
  return status
}

const getStatusClass = (status) => {
  if (status === 'CHECK') return 'check'
  if (status === 'RISK') return 'risk'
  return ''
}

const showStatusDot = (item) => {
  if (item.status === 'NORMAL') return false
  if (item.inspectionStatus === 'DONE') return false
  if (
    (item.inspectionStatus === 'REQUESTED' ||
      item.inspectionStatus === 'IN_PROGRESS') &&
    item.shutdownDone
  ) return false
  return true
}

const rowClass = (item) => {
  if (item.status === 'RISK' && item.inspectionStatus !== 'DONE') return 'row-risk'
  return ''
}

const handleInspection = (item) => {
  emit('inspection-request', item)
}

const handleShutdown = (item) => {
  emit('force-shutdown', item)
}

const formatOccurredAt = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
</script>

<style scoped>
.history-table-section {
  height: 100%;
  color: #e5e7eb;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.history-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.status-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: #313a43;
  color: #d6dde5;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.filter-btn.all.active {
  background: #78c8ff;
  color: #0b1220;
}

.filter-btn.check.active,
.filter-btn.risk.active {
  background: #313a43;
  color: #ffffff;
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.filter-dot.check {
  background: #ffcc00;
}

.filter-dot.risk {
  background: #ff2b2b;
}

.sort-button {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.sort-arrows {
  color: #9fb0c2;
  font-size: 13px;
}

.table-wrap {
  height: calc(100% - 80px);
  overflow-x: auto;
  overflow-y: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.history-table thead th {
  background: #2a333c;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  padding: 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.history-table tbody td {
  padding: 14px 12px;
  color: #d9e1ea;
  font-size: 16px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  word-break: break-word;
}

.history-table tbody tr.row-risk td {
  background: rgba(111, 18, 18, 0.45);
}

.status-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-text.check {
  color: #ffcc00;
}

.status-text.risk {
  color: #ff2b2b;
}

.status-dot.check {
  background: #ffcc00;
}

.status-dot.risk {
  background: #ff2b2b;
}

.detail-cell {
  font-weight: 600;
}

.detail-cell.check {
  color: #d3b100;
}

.detail-cell.risk {
  color: #ff2b2b;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn,
.action-done {
  min-width: 74px;
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.action-btn {
  cursor: pointer;
  background: transparent;
}

.action-btn.inspection {
  border: 1px solid #d3a600;
  color: #d3a600;
}

.action-btn.shutdown {
  border: 1px solid #ff2b2b;
  color: #ff2b2b;
}

.action-done.inspection-done {
  color: #d3a600;
}

.action-done.shutdown-done {
  color: #ff6a6a;
}

.action-done.complete {
  color: #d9e1ea;
}

.empty-row {
  padding: 26px 12px !important;
  color: #94a3b8 !important;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 16px;
}

.page-nav,
.page-number {
  border: none;
  background: transparent;
  color: #6b7c8f;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  min-width: auto;
  height: auto;
  padding: 0;
  margin-top: -40px;
}

.page-number {
  font-size: 18px;
}

.page-number.active {
  color: #ffffff;
}

.page-nav:not(:disabled) {
  color: #59bfff;
}

.page-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
}

.action-done.status-updated {
  color: #94a3b8;
}
</style>