<template>
  <div class="history-table-section">
    <div class="history-header">
      <!-- 좌측: 타이틀 바로 옆에 기기선택 + 필터 버튼 바짝 붙이기 -->
      <div class="th-left">
        <h3>기기별 상세 장애 이력 및 이벤트 관리</h3>

        <!-- 기기 선택) -->
        <select v-model="selectedChargerId" class="dark-select">
          <option value="ALL">전체 기기</option>
          <option v-for="id in chargerIdOptions" :key="id" :value="id">{{ id }}</option>
        </select>

        <!-- 상태 필터 -->
        <div class="status-filters">
          <button type="button" class="filter-btn all" :class="{ active: selectedFilter === 'ALL' }"
            @click="selectedFilter = 'ALL'">
            전체({{ faultOnlyData.length }})
          </button>

          <button type="button" class="filter-btn check" :class="{ active: selectedFilter === 'CHECK' }"
            @click="selectedFilter = 'CHECK'">
            <span class="filter-dot check"></span>
            점검
          </button>

          <button type="button" class="filter-btn risk" :class="{ active: selectedFilter === 'RISK' }"
            @click="selectedFilter = 'RISK'">
            <span class="filter-dot risk"></span>
            위험
          </button>
        </div>
      </div>

      <!-- 우측: 정렬 -->
      <div class="th-right">
        <select v-model="sortOrder" class="dark-select plain">
          <option value="desc">최신순</option>
          <option value="asc">오래된순</option>
        </select>
      </div>
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
          <tr v-for="item in pagedHistoryData" :key="item.id" :class="rowClass(item)">
            <td>{{ formatOccurredAt(item.occurredAt) }}</td>
            <td>{{ item.chargerId }}</td>
            <td>{{ item.location || '-' }}</td>

            <td>
              <span class="status-text" :class="getStatusClass(item.status)">
                <span v-if="showStatusDot(item)" class="status-dot" :class="getStatusClass(item.status)"></span>
                {{ getStatusLabel(item.status) }}
              </span>
            </td>

            <td class="detail-cell" :class="getStatusClass(item.status)">
              {{ item.detail }}
            </td>

            <!-- 260501 임소리 수정: 주차관리/보안팀 <-> 시설관리팀 권한에 맞게 조건식 추가 및 화면 구현 -->
            <td>
              <div class="action-buttons">
                <!-- 시설관리팀 화면 -->
                <template v-if="isFacilityTeam">
                  <button v-if="item.inspectionStatus === 'REQUESTED' || item.inspectionStatus === 'IN_PROGRESS'"
                    type="button" class="action-btn inspection" @click="$emit('inspection-complete', item)">
                    점검완료
                  </button>
                  <span v-else-if="item.inspectionStatus === 'DONE'" class="action-done complete">조치 완료</span>
                </template>

                <!-- 주차관리팀 / 보안팀 화면 -->
                <template v-else>
                  <template v-if="item.inspectionStatus === 'DONE'">
                    <button v-if="item.shutdownDone || powerOffChargerIds.has(item.chargerId)" type="button"
                      class="action-btn restart active" @click="$emit('power-on', item)">
                      가동 재개
                    </button>
                    <span v-else class="action-done complete">조치 완료</span>
                  </template>

                  <template v-else-if="item.inspectionStatus === 'STATUS_UPDATED' && hasNewerRecord(item)">
                    <span class="action-done status-updated">상태업데이트</span>
                  </template>

                  <template v-else>
                    <!-- 점검 요청 상태 표시 -->
                    <template v-if="item.inspectionStatus === 'REQUESTED'">
                      <span class="action-done inspection-done">요청됨</span>
                    </template>
                    <template v-else-if="item.inspectionStatus === 'IN_PROGRESS'">
                      <span class="action-done inspection-done" style="color:#facc15; border-color:#facc15;">점검
                        대기중</span>
                    </template>
                    <button v-else type="button" class="action-btn inspection" @click="handleInspection(item)">
                      점검요청
                    </button>

                    <!-- 강제 종료 상태 표시 -->
                    <template v-if="item.shutdownDone || powerOffChargerIds.has(item.chargerId)">
                      <span class="action-done shutdown-done">전원차단</span>
                    </template>
                    <button v-else type="button" class="action-btn shutdown" @click="handleShutdown(item)">
                      강제종료
                    </button>
                  </template>
                </template>
              </div>
            </td>
          </tr>
          <!-- 임소리 수정 부분 여기까지 끝 -->

          <tr v-if="pagedHistoryData.length === 0">
            <td colspan="6" class="empty-row">
              표시할 장애 이력이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button class="page-nav" type="button" :disabled="currentPage === 1" @click="goPrevPage">
        ‹
      </button>

      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="page-ellipsis">…</span>
        <button v-else type="button" class="page-number" :class="{ active: currentPage === p }"
          @click="currentPage = p">
          {{ p }}
        </button>
      </template>

      <button class="page-nav" type="button" :disabled="currentPage === totalPages" @click="goNextPage">
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
  chargerList: {
    type: Array,
    default: () => []
  },
  activeChargerId: {
    type: String,
    default: 'ALL'
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

// 260501 임소리: inspection-complete, power-on 추가
const emit = defineEmits([
  'inspection-request',
  'force-shutdown',
  'charger-select',
  'inspection-complete', // 시설팀 점검 완료 이벤트 추가
  'power-on'             // 주차/보안팀 가동 재개 이벤트 추가
])

// 260501 임소리: 부서 확인 로직
const isFacilityTeam = computed(() => {
  try {
    const loginData = JSON.parse(sessionStorage.getItem('loginId')) || {}

    return loginData.adminDeptName === '시설관리팀'
  } catch (error) {
    console.error('부서 정보 확인 중 에러 발생:', error)
    return false
  }
})

const sortOrder = ref('desc')
const selectedFilter = ref('ALL')
const selectedChargerId = ref(props.activeChargerId || 'ALL')
const currentPage = ref(1)
const pageSize = 6

const sortOrderLabel = computed(() => {
  return sortOrder.value === 'desc' ? '최신순' : '오래된순'
})

// chargerList 기준 powerOffDone 세트 — DB 업데이트 전에도 즉시 반영
const powerOffChargerIds = computed(() => {
  const set = new Set()
  props.chargerList.forEach((c) => { if (c.powerOffDone) set.add(c.chargerId) })
  return set
})

// 기기 ID 선택지 — chargerList 전체 기기 기준 (없으면 historyData fallback)
const chargerIdOptions = computed(() => {
  if (props.chargerList.length > 0) {
    return props.chargerList.map((c) => c.chargerId).filter(Boolean).sort()
  }
  return [...new Set(props.historyData.map((item) => item.chargerId))].filter(Boolean).sort()
})

// inspectionStatus 우선순위: NONE/actionable > REQUESTED > IN_PROGRESS > STATUS_UPDATED > DONE
function inspectionPriority(status) {
  switch (status) {
    case 'NONE': return 5
    case 'REQUESTED': return 4
    case 'IN_PROGRESS': return 3
    case 'STATUS_UPDATED': return 2
    case 'DONE': return 1
    default: return 5
  }
}

// chargerId+status 기준 중복 제거 — actionable 레코드 우선, 동순위면 최신
const deduplicatedHistoryData = computed(() => {
  const bestByKey = new Map()
  for (const item of props.historyData) {
    const key = `${item.chargerId}-${item.status}`
    const existing = bestByKey.get(key)
    if (!existing) {
      bestByKey.set(key, item)
    } else {
      const ep = inspectionPriority(existing.inspectionStatus)
      const np = inspectionPriority(item.inspectionStatus)
      if (np > ep || (np === ep && new Date(item.occurredAt) >= new Date(existing.occurredAt))) {
        bestByKey.set(key, item)
      }
    }
  }
  return [...bestByKey.values()]
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
    return new Date(Number(fullMatch[1]), Number(fullMatch[2]) - 1, Number(fullMatch[3]))
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
    return new Date(
      Number(fullDateTimeMatch[1]),
      Number(fullDateTimeMatch[2]) - 1,
      Number(fullDateTimeMatch[3]),
      Number(fullDateTimeMatch[4] || 0),
      Number(fullDateTimeMatch[5] || 0),
      Number(fullDateTimeMatch[6] || 0)
    )
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return parsed

  return null
}

// 미처리 이슈(RISK/CHECK/FAULT이고 완료 안된 것)는 날짜 필터 무시 — 항상 표시
const dateFilteredHistoryData = computed(() => {
  const start = toDateOnly(props.startDate)
  const end = toDateOnly(props.endDate)

  return deduplicatedHistoryData.value.filter((item) => {
    const isActiveFault =
      (item.status === 'RISK' || item.status === 'CHECK' || item.status === 'FAULT') &&
      item.inspectionStatus !== 'DONE'
    if (isActiveFault) return true

    if (!start || !end) return true

    const occurredAt = parseOccurredAtToDate(item.occurredAt)
    if (!occurredAt) return false

    const d = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate())
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
  })
})

// 기기 필터 적용
const chargerFilteredData = computed(() => {
  if (selectedChargerId.value === 'ALL') return dateFilteredHistoryData.value
  return dateFilteredHistoryData.value.filter(
    (item) => item.chargerId === selectedChargerId.value
  )
})

// 이력 기반 CHECK/FAULT/RISK 레코드
const faultOnlyFromHistory = computed(() =>
  chargerFilteredData.value.filter(
    (item) => item.status === 'CHECK' || item.status === 'FAULT' || item.status === 'RISK' || item.shutdownDone
  )
)

// chargerList 기준 현재 RISK/CHECK 상태인데 미처리 이슈 로그가 없는 기기를 합성 행으로 보완
// → issue_log에 실시간 반영이 늦거나 200건 밖으로 밀렸을 때 현재 상태를 반드시 표시
const syntheticRows = computed(() => {
  const targets =
    selectedChargerId.value === 'ALL'
      ? props.chargerList
      : props.chargerList.filter((c) => c.chargerId === selectedChargerId.value)

  const rows = []
  for (const charger of targets) {
    const cs = charger.chargerStatus
    const las = charger.aiStatus
    const isRisk = cs === 'RISK' || las === 'RISK'
    const isCheck = cs === 'CHECK' || cs === 'FAULT' || las === 'CHECK'
    if (!isRisk && !isCheck) continue

    // 해당 기기에 이미 미처리 이슈 로그가 있으면 합성 불필요
    const hasActiveLog = faultOnlyFromHistory.value.some(
      (item) =>
        item.chargerId === charger.chargerId &&
        item.inspectionStatus !== 'DONE'
    )
    if (hasActiveLog) continue

    rows.push({
      id: `__live__${charger.chargerId}`,
      occurredAt: new Date().toISOString(),
      chargerId: charger.chargerId,
      location: '',
      status: isRisk ? 'RISK' : 'CHECK',
      detail: charger.mainReason || (isRisk ? '위험 상태 감지' : '점검 필요'),
      mainReason: charger.mainReason || '',
      message: '',
      faultProb7d: charger.faultProb7d ?? 0,
      inspectionStatus: 'NONE',
      shutdownDone: charger.powerOffDone ?? false,
      completedBy: null
    })
  }
  return rows
})

// 합성 행(상단) + 이력 행(하단)
const faultOnlyData = computed(() => [
  ...syntheticRows.value,
  ...faultOnlyFromHistory.value
])

const filteredHistoryData = computed(() => {
  if (selectedFilter.value === 'ALL') return faultOnlyData.value
  if (selectedFilter.value === 'CHECK')
    return faultOnlyData.value.filter(
      (item) => item.status === 'CHECK' || item.status === 'FAULT'
    )
  return faultOnlyData.value.filter((item) => item.status === selectedFilter.value)
})

const sortedHistoryData = computed(() => {
  return [...filteredHistoryData.value].sort((a, b) => {
    const timeA = parseOccurredAtToDate(a.occurredAt)?.getTime() ?? 0
    const timeB = parseOccurredAtToDate(b.occurredAt)?.getTime() ?? 0
    return sortOrder.value === 'desc' ? timeB - timeA : timeA - timeB
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedHistoryData.value.length / pageSize))
)

const pagedHistoryData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedHistoryData.value.slice(start, start + pageSize)
})

// 윈도우 페이지네이션 — 최대 7개 항목 표시, 초과 시 ... 처리
const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', cur - 1, cur, cur + 1, '...', total]
})

// 부모(ChargerStatusStats 클릭)에서 기기가 바뀌면 셀렉트도 동기화
watch(
  () => props.activeChargerId,
  (val) => {
    selectedChargerId.value = val || 'ALL'
  }
)

watch(selectedChargerId, (val) => {
  currentPage.value = 1
  emit('charger-select', val)
})

watch(
  [selectedFilter, sortOrder, () => props.startDate, () => props.endDate],
  () => { currentPage.value = 1 }
)

watch(
  () => sortedHistoryData.value.length,
  () => {
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  }
)

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const goPrevPage = () => { if (currentPage.value > 1) currentPage.value -= 1 }
const goNextPage = () => { if (currentPage.value < totalPages.value) currentPage.value += 1 }

// 더 새로운 레코드가 존재할 때만 STATUS_UPDATED 표시
const hasNewerRecord = (item) => {
  if (item.inspectionStatus !== 'STATUS_UPDATED') return false
  return props.historyData.some(
    (other) =>
      other.chargerId === item.chargerId &&
      String(other.id) !== String(item.id) &&
      new Date(other.occurredAt) > new Date(item.occurredAt)
  )
}

const getStatusLabel = (status) => {
  if (status === 'CHECK' || status === 'FAULT') return '점검'
  if (status === 'RISK') return '위험'
  return status
}

const getStatusClass = (status) => {
  if (status === 'CHECK' || status === 'FAULT') return 'check'
  if (status === 'RISK') return 'risk'
  return ''
}

const showStatusDot = (item) => {
  if (item.status === 'NORMAL') return false
  if (item.inspectionStatus === 'DONE') return false
  if (
    (item.inspectionStatus === 'REQUESTED' || item.inspectionStatus === 'IN_PROGRESS') &&
    item.shutdownDone
  ) return false
  return true
}

const rowClass = (item) => {
  if (
    item.status === 'RISK' &&
    item.inspectionStatus !== 'DONE' &&
    item.inspectionStatus !== 'STATUS_UPDATED'
  ) return 'row-risk'
  return ''
}

const handleInspection = (item) => emit('inspection-request', item)
const handleShutdown = (item) => emit('force-shutdown', item)

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
/* 헤더 레이아웃 */
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 17px;
}

.history-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.th-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.th-right {
  display: flex;
  align-items: center;
}

/* ── 드롭다운 셀렉트  ── */
.dark-select {
  background-color: #444D56;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: #f5f5f5;
  padding: 0 12px;
  height: 28px;
  border-radius: 20px;
  font-size: 13px;
  font-family: 'Pretendard', sans-serif;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.dark-select option {
  background-color: #444D56;
  color: #f5f5f5;
  padding: 10px;
}

/* 정렬용 투명 셀렉트 */
.dark-select.plain {
  background: transparent;
  border: none;
}

/* ── 필터 탭 버튼 ── */
.status-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: transparent;
  color: rgba(245, 245, 245, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.filter-btn:hover {
  border-color: #82c2e3;
  color: #82c2e3;
}

.filter-btn.active {
  border-color: #82c2e3;
  background: rgba(130, 194, 227, 0.15);
  color: #fff;
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-dot.check {
  background: #fbb900;
}

.filter-dot.risk {
  background: #ff0000;
}

/* ── 테이블 공통 규격 통일 ── */
.table-wrap {
  flex: 1;
  overflow-y: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  text-align: center;
}

.history-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(15, 23, 42, 0.4);
  color: rgba(245, 245, 245, 0.6);
  font-size: 16px;
  font-weight: 600;
  padding: 17px 10px;
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
}

.history-table tbody td {
  padding: 17px 10px;
  color: #f5f5f5;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
}

.history-table tbody tr.row-risk td {
  background: rgba(255, 0, 0, 0.1);
}

.status-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text.check,
.detail-cell.check {
  color: #fbb900;
}

.status-text.risk,
.detail-cell.risk {
  color: #ff0000;
}

.status-dot.check {
  background: #fbb900;
}

.status-dot.risk {
  background: #ff0000;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn,
.action-done {
  min-width: 74px;
  height: 28px;
  padding: 0 10px;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  background: transparent;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn.inspection {
  border: 1px solid #fbb900;
  color: #fbb900;
}

.action-btn.inspection:hover {
  background: rgba(251, 185, 0, 0.1);
}

.action-btn.shutdown {
  border: 1px solid #ff0000;
  color: #ff0000;
}

.action-btn.shutdown:hover {
  background: rgba(255, 0, 0, 0.1);
}

.action-btn.restart.active {
  border: 1px solid #00e676;
  color: #00e676;
}

.action-done.inspection-done {
  color: #fbb900;
}

.action-done.shutdown-done {
  color: #ff0000;
}

.action-done.complete {
  color: rgba(245, 245, 245, 0.6);
}

.empty-row {
  padding: 40px !important;
  color: rgba(245, 245, 245, 0.6) !important;
}

/* ── 페이지네이션 ── */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 17px;
  margin-bottom: 17px;
}

.page-btn,
.page-nav,
.page-number {
  background: transparent;
  border: 1px solid rgba(245, 245, 245, 0.1);
  color: rgba(245, 245, 245, 0.6);
  min-width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled),
.page-nav:hover:not(:disabled),
.page-number:hover:not(:disabled) {
  border-color: #82c2e3;
  color: #82c2e3;
}

.page-btn.active,
.page-number.active {
  background: #82c2e3;
  border-color: #82c2e3;
  color: #000;
}

.page-btn:disabled,
.page-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-ellipsis {
  color: rgba(245, 245, 245, 0.6);
  font-size: 14px;
  padding: 0 2px;
}
</style>
