<template>
  <div class="event-log-table-wrap">
    <div class="table-header">
        <div class="table-title">충전 내역 및 이력 조회</div>

  <div class="table-header-right">
    <div class="charger-select-wrap">
      <select v-model="selectedChargerId" class="charger-select">
        <option value="ALL">전체</option>
            <option
              v-for="charger in chargerOptions"
              :key="charger.chargerId"
              :value="charger.chargerId"
            >
              {{ charger.chargerId }}
            </option>
      </select>
    </div>
          <button
            type="button"
            class="filter-btn all"
            :class="{ active: selectedFilter === 'ALL' }"
            @click="selectedFilter = 'ALL'"
          >
            전체
          </button>
        <button
          type="button"
          class="filter-btn normal"
          :class="{ active: selectedFilter === 'READY' }"
          @click="selectedFilter = 'READY'"
        >
          <span class="filter-dot normal"></span>
          대기(정상)
        </button>

        <button
          type="button"
          class="filter-btn charging"
          :class="{ active: selectedFilter === 'CHARGING' }"
          @click="selectedFilter = 'CHARGING'"
        >
          <span class="filter-dot charging"></span>
          사용중
        </button>

        <button
          type="button"
          class="filter-btn check"
          :class="{ active: selectedFilter === 'FORCE_STOPPED' }"
          @click="selectedFilter = 'FORCE_STOPPED'"
        >
          <span class="filter-dot check"></span>
          점검
        </button>

        <button
          type="button"
          class="filter-btn fault"
          :class="{ active: selectedFilter === 'FAULT_STOPPED' }"
          @click="selectedFilter = 'FAULT_STOPPED'"
        >
          <span class="filter-dot fault"></span>
          고장
        </button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-body-area">
        <table class="event-log-table">
          <thead>
            <tr>
              <th>충전일시</th>
              <th>기기 ID</th>
              <th>상태</th>
              <th>현재 충전량</th>
              <th>차량번호</th>
              <th>충전 시간</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="6" class="empty-cell">조회된 데이터가 없습니다.</td>
            </tr>

            <tr v-for="row in pagedLogs" :key="row.id">
              <td>{{ formatDateTime(row.time) }}</td>
              <td>{{ row.chargerId || '-' }}</td>

              <td>
                <span class="status-badge" :class="getStatusClass(row.status)">
                  <span class="status-dot" :class="getStatusClass(row.status)"></span>
                  {{ getStatusLabel(row.status) }}
                </span>
              </td>

              <td class="kwh-cell">
                {{ formatKwh(row.currentChargeKwh) }}
              </td>

              <td>{{ row.vehicleNumber || '-' }}</td>
              <td>{{ formatRemainTime(row) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-wrap" v-if="filteredLogs.length > 0">
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>

        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getChargingLogs } from '@/api/evPredictive'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
    chargerList: {
    type: Array,
    default: () => []
  }
  
})

const selectedFilter = ref('ALL')
const selectedChargerId = ref('ALL')
const chargerOptions = computed(() => Array.isArray(props.chargerList) ? props.chargerList : [])
const logs = ref([])

const currentPage = ref(1)
const pageSize = 10

const fetchLogs = async () => {
  try {
    logs.value = await getChargingLogs(
      props.startDate,
      props.endDate,
      'ALL'
    )
  } catch (error) {
    console.error('fetchLogs error:', error)
    logs.value = []
  }
}

const filteredLogs = computed(() => {
  let rows = Array.isArray(logs.value) ? [...logs.value] : []

  if (selectedChargerId.value !== 'ALL') {
    rows = rows.filter((log) => log.chargerId === selectedChargerId.value)
  }

  if (selectedFilter.value !== 'ALL') {
    rows = rows.filter((row) => {
      if (selectedFilter.value === 'READY') {
        return ['READY', 'STANDBY'].includes(row.status)
      }

      if (selectedFilter.value === 'FORCE_STOPPED') {
        return ['CHECK', 'FORCE_STOPPED'].includes(row.status)
      }

      if (selectedFilter.value === 'FAULT_STOPPED') {
        return ['RISK', 'FAULT', 'FAULT_STOPPED', 'POWER_OFF'].includes(row.status)
      }

      return row.status === selectedFilter.value
    })
  }

  rows.sort((a, b) => {
    const timeA = a?.time ? new Date(a.time).getTime() : 0
    const timeB = b?.time ? new Date(b.time).getTime() : 0
    return timeB - timeA
  })

  return rows.map((row) => ({
    ...row,
    mode: 'history'
  }))
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredLogs.value.length / pageSize))
})

const pagedLogs = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return filteredLogs.value.slice(startIndex, endIndex)
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'READY':
    case 'STANDBY':
      return '대기'

    case 'CHARGING':
      return '충전중'

    case 'COMPLETED':
      return '충전완료'

    case 'CHECK':
    case 'FORCE_STOPPED':
      return '점검'

    case 'RISK':
    case 'FAULT':
    case 'FAULT_STOPPED':
      return '고장'

    case 'POWER_OFF':
      return '전원차단'

    default:
      return '대기'
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'READY':
    case 'STANDBY':
      return 'normal'

    case 'CHARGING':
      return 'charging'

    case 'COMPLETED':
      return 'charging'

    case 'CHECK':
    case 'FORCE_STOPPED':
      return 'check'

    case 'RISK':
    case 'FAULT':
    case 'FAULT_STOPPED':
    case 'POWER_OFF':
      return 'fault'

    default:
      return 'normal'
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

const formatKwh = (value) => {
  const num = Number(value ?? 0)
  if (!num) return '—'
  return `${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}kWh`
}

const formatRemainTime = (row) => {
  const start = row?.time ? new Date(row.time) : null

  if (!start || Number.isNaN(start.getTime())) {
    return '—'
  }

  let minutes = Number(row?.chargingMinutes ?? 0)

  if (!minutes && row.status === 'CHARGING') {
    minutes = Math.floor((Date.now() - start.getTime()) / 60000)
  }

  if (!minutes || minutes < 0) {
    return '—'
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}시간 ${remainMinutes}분`
  }

  return `${remainMinutes}분`
}

onMounted(() => {
  fetchLogs()
})

watch(
  () => [props.startDate, props.endDate, selectedFilter.value, selectedChargerId.value],
  () => {
    currentPage.value = 1
    fetchLogs()
  }
)
</script>

<style scoped>
.event-log-table-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.table-title {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  white-space: nowrap;
}

.status-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #3a455f;
  border-radius: 999px;
  background: #1a2335;
  color: #dbe4f0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.filter-btn.active {
  border-color: #7aaed6;
  background: #24324b;
}

.filter-btn.all {  
  color: #ffffff; 
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-dot.normal {
  background: #00e676;
}

.filter-dot.charging {
  background: #7fc5ea;
}

.filter-dot.check {
  background: #f5b400;
}

.filter-dot.fault {
  background: #ff2d2d;
}

.table-container {
  flex: 1;
  min-height: 0;
  border-top: 1px solid #2b3553;
  display: flex;
  flex-direction: column;
}

.table-body-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.event-log-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.event-log-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 16px 10px;
  background: #2a3443;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.event-log-table tbody td {
  padding: 16px 10px;
  border-bottom: 1px solid rgba(74, 85, 104, 0.35);
  color: #e5e7eb;
  font-size: 16px;
  text-align: center;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 0 4px;
}

.page-btn {
  min-width: 64px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #3a455f;
  border-radius: 6px;
  background: #1a2335;
  color: #dbe4f0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-info {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.empty-cell {
  padding: 40px 0 !important;
  color: #94a3b8 !important;
}

.status-badge {
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

.status-badge.normal,
.status-dot.normal {
  color: #00e676;
  background-color: #00e676;
}

.status-badge.charging,
.status-dot.charging {
  color: #7fc5ea;
  background-color: #7fc5ea;
}

.status-badge.check,
.status-dot.check {
  color: #f5b400;
  background-color: #f5b400;
}

.status-badge.fault,
.status-dot.fault {
  color: #ff2d2d;
  background-color: #ff2d2d;
}

.status-badge.normal,
.status-badge.charging,
.status-badge.check,
.status-badge.fault {
  background: transparent;
}

.kwh-cell {
  color: #d9a300 !important;
  font-weight: 700;
}

.event-log-table th:nth-child(1),
.event-log-table td:nth-child(1) {
  width: 24%;
}

.event-log-table th:nth-child(2),
.event-log-table td:nth-child(2) {
  width: 16%;
}

.event-log-table th:nth-child(3),
.event-log-table td:nth-child(3) {
  width: 14%;
}

.event-log-table th:nth-child(4),
.event-log-table td:nth-child(4) {
  width: 16%;
}

.event-log-table th:nth-child(5),
.event-log-table td:nth-child(5) {
  width: 16%;
}

.event-log-table th:nth-child(6),
.event-log-table td:nth-child(6) {
  width: 14%;
}

.table-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.charger-select-wrap {
  display: flex;
  align-items: center;
}

.charger-select {
  height: 28px;
  min-width: 120px;
  padding: 0 10px;
  border: 1px solid #3a455f;
  border-radius: 6px;
  background: #1a2335;
  color: #dbe4f0;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}
</style>