<template>
  <div class="ev-infra-container">
    <header class="ev-header">
      <div class="header-left">
        <h2 class="page-title">EV 인프라 관리</h2>

        <div class="tab-button-group">
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'charger' }"
            @click="activeTab = 'charger'">
            실시간 현황
          </button>
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'predictive' }"
            @click="activeTab = 'predictive'">
            예지보전 및 장애 관리
          </button>
        </div>
      </div>

      <!-- 공통 달력 트리거 (PaymentManage와 동일 규격) -->
      <div class="header-right relative-box">
        <div class="date-trigger-box" @click.stop="isDatePopupOpen = !isDatePopupOpen">
          <span class="date-text">{{ filterStartDate }} ~ {{ filterEndDate }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>

        <!-- 공통 달력 컴포넌트 적용 -->
        <DatePopup :visible="isDatePopupOpen" :start-date="filterStartDate" :end-date="filterEndDate"
          @close="isDatePopupOpen = false" @apply="handleDateApply" />
      </div>
    </header>

    <div class="tab-content">
      <!-- 1. 실시간 현황 탭 -->
      <div v-if="activeTab === 'charger'" class="status-layout">
        <div class="status-top-grid">
          <section class="layout-card">
            <ChargerStatusStats :charger-list="chargerList" @detail-view="handleChargerDetailView" />
          </section>

          <section class="layout-card">
            <ChargerOperationSummary :start-date="filterStartDate" :end-date="filterEndDate" />
          </section>
        </div>

        <section class="layout-card log-card">
          <ChargerEventLogTable :start-date="filterStartDate" :end-date="filterEndDate" :charger-list="chargerList" />
        </section>
      </div>

      <!-- 2. 예지보전 탭 -->
      <div v-else class="predictive-layout">
        <div class="predictive-top-grid">
          <section class="layout-card">
            <PredictiveSummaryCard :charger-detail="chargerDetail" :charger-list="chargerList"
              @charger-change="handleChargerChange" @inspection-request="openSummaryInspectionModal"
              @force-shutdown="openSummaryForceShutdownModal" @inspection-complete="handleInspectionComplete"
              @power-on="handlePowerOnConfirm" />
          </section>

          <section class="layout-card">
            <PredictiveMetricTabs :metric-data="metricData" :start-date="filterStartDate" :end-date="filterEndDate" />
          </section>
        </div>

        <section class="layout-card history-card">
          <FaultHistoryTable :history-data="historyData" :charger-list="chargerList"
            :active-charger-id="historyChargerId" :start-date="filterStartDate" :end-date="filterEndDate"
            @inspection-request="openInspectionModal" @force-shutdown="openForceShutdownModal"
            @charger-select="handleHistoryChargerSelect" @inspection-complete="handleInspectionComplete"
            @power-on="handlePowerOnConfirm" />
        </section>
      </div>
    </div>

    <!-- 모달 레이어 -->
    <InspectionRequestModal :visible="inspectionModalVisible" :charger-detail="selectedHistoryItem || chargerDetail"
      @close="closeInspectionModal" @submit="handleInspectionSubmit" />

    <ForceShutdownConfirmModal :visible="forceShutdownModalVisible"
      :charger-detail="selectedHistoryItem || chargerDetail" @close="closeForceShutdownModal"
      @confirm="handleForceShutdownConfirm" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'

// ── [임소리] 추가 시작 ======================================================================
import { useRoute } from 'vue-router'
import DatePopup from '@/components/DatePopup.vue'

const route = useRoute()
const refreshPendingCount = inject('refreshPendingCount', () => { })

// 1. 공통 달력 제어 로직 (기존 filterStartDate/EndDate와 통합)
const getTodayStr = () => new Date().toISOString().split('T')[0]
const isDatePopupOpen = ref(false)
const filterStartDate = ref(getTodayStr())
const filterEndDate = ref(getTodayStr())

const handleDateApply = (dates) => {
  filterStartDate.value = dates.startDate
  filterEndDate.value = dates.endDate
  isDatePopupOpen.value = false
}

// 2. 라우터 쿼리 감시 (플로팅 팝업에서 기기 클릭 시 즉시 갱신)
watch(() => route.query.chargerId, async (newId) => {
  if (newId && route.query.tab === 'predictive') {
    await handleChargerDetailView(newId)
  }
})

// 3. 시설관리팀 점검 완료 처리 함수
const handleInspectionComplete = async (item = null) => {
  const targetId = item ? item.chargerId : getActiveChargerId()
  if (confirm(`[${targetId}] 기기의 점검을 완료 처리하시겠습니까?`)) {
    try {
      const res = await axios.post('http://localhost:8003/inspection/complete', { chargerId: targetId })
      if (res.data.success) {
        alert('점검 완료 처리되었습니다')
        await Promise.all([fetchChargerList(), fetchChargerDetail(targetId), fetchHistoryData()])
        refreshPendingCount()
      }
    } catch (e) {
      console.error('점검 완료 처리 실패:', e)
      alert('처리 중 오류가 발생했습니다')
    }
  }
}

// 4. 주차/보안팀 가동 재개 처리 함수
const handlePowerOnConfirm = async (item = null) => {
  const targetId = item ? item.chargerId : getActiveChargerId()
  if (confirm(`[${targetId}] 기기를 다시 가동하시겠습니까?`)) {
    try {
      const res = await axios.post('http://localhost:8003/control/power-on', { chargerId: targetId })
      if (res.data.success) {
        alert('기기 가동이 재개되었습니다')
        await Promise.all([fetchChargerList(), fetchChargerDetail(targetId), fetchHistoryData()])
      }
    } catch (e) {
      console.error('가동 재개 실패:', e)
      alert('처리 중 오류가 발생했습니다')
    }
  }
}
// ── [임소리] 추가 끝 ========================================================================

// 예지보전 컴포넌트
import PredictiveSummaryCard from '@/components/ev_infra/predictive/PredictiveSummaryCard.vue'
import PredictiveMetricTabs from '@/components/ev_infra/predictive/PredictiveMetricTabs.vue'
import FaultHistoryTable from '@/components/ev_infra/predictive/FaultHistoryTable.vue'
import InspectionRequestModal from '@/components/ev_infra/predictive/InspectionRequestModal.vue'
import ForceShutdownConfirmModal from '@/components/ev_infra/predictive/ForceShutdownConfirmModal.vue'

// 충전기 현황 컴포넌트[cite: 7]
import ChargerStatusStats from '@/components/ev_infra/charger/ChargerStatusStats.vue'
import ChargerOperationSummary from '@/components/ev_infra/charger/ChargerOperationSummary.vue'
import ChargerEventLogTable from '@/components/ev_infra/charger/ChargerEventLogTable.vue'

import { requestInspection } from '../../api/evInspection'
import { requestForceShutdown } from '../../api/evControl'
import {
  getChargerDetail,
  getHistoryData,
  getChargerList,
  getSensorHistory,
  getChargingLogs
} from '../../api/evPredictive'

// 탭 상태
const activeTab = ref('charger')

// 폴링 주기
const STATUS_REFRESH_MS = 15000
const METRIC_REFRESH_MS = 20000
const HISTORY_REFRESH_MS = STATUS_REFRESH_MS

// 상태 관리 변수
const inspectionModalVisible = ref(false)
const forceShutdownModalVisible = ref(false)
const selectedHistoryItem = ref(null)
const chargerList = ref([])
const historyChargerId = ref('ALL')
const statusIntervalId = ref(null)
const metricIntervalId = ref(null)
const historyIntervalId = ref(null)

// 날짜 관련 헬퍼 함수
// function formatDateOnly(date) {
//   const year = date.getFullYear()
//   const month = String(date.getMonth() + 1).padStart(2, '0')
//   const day = String(date.getDate()).padStart(2, '0')
//   return `${year}-${month}-${day}`
// }

// function getDefaultLast7DaysRange() {
//   const end = new Date()
//   end.setHours(0, 0, 0, 0)
//   const start = new Date(end)
//   start.setDate(end.getDate() - 6)
//   return {
//     startDate: formatDateOnly(start),
//     endDate: formatDateOnly(end)
//   }
// }

// 충전기 상세 데이터 초기
const chargerDetail = ref({
  chargerId: '',
  aiStatus: '',
  deviceStatus: '',
  faultProb7d: 0,
  mainReason: '',
  message: '',
  inspectionStatus: 'NONE',
  inspectionRequested: false,
  shutdownDone: false
})

const emptyMetricData = () => ({
  temperature: [],
  current: [],
  voltage: []
})

const metricData = ref(emptyMetricData())
const historyData = ref([])

// 비즈니스 로직 함수
const getActiveChargerId = () => {
  return selectedHistoryItem.value?.chargerId || chargerDetail.value?.chargerId || '5F-D-10'
}

// Spring ai_status가 NORMAL을 반환해도 chargerList(FastAPI)의 실시간 상태로 보정
const reconcileDetail = (detail, listItem, prevDetail = null) => {
  if (!detail || !listItem) return detail
  const merged = { ...detail }

  // shutdownDone이면 강제종료 시점의 fault 상태(aiStatus/mainReason) 보존
  const isShutdown = merged.shutdownDone || listItem?.powerOffDone || prevDetail?.shutdownDone
  if (isShutdown) {
    merged.shutdownDone = true
    const lockedStatus = prevDetail?.frozenAiStatus
    if (lockedStatus === 'RISK' || lockedStatus === 'CHECK') {
      merged.aiStatus = lockedStatus
      merged.mainReason = prevDetail.frozenMainReason || merged.mainReason
      merged.faultProb7d = prevDetail.frozenFaultProb7d ?? merged.faultProb7d
      merged.frozenAiStatus = lockedStatus
      merged.frozenMainReason = prevDetail.frozenMainReason
      merged.frozenFaultProb7d = prevDetail.frozenFaultProb7d
      return merged
    }
  }

  const cs = listItem.chargerStatus
  const las = listItem.aiStatus
  if ((cs === 'RISK' || las === 'RISK') && merged.aiStatus !== 'RISK') {
    merged.aiStatus = 'RISK'
    if (!merged.mainReason) merged.mainReason = listItem.mainReason || '위험 상태 감지'
  } else if (
    (cs === 'CHECK' || cs === 'FAULT' || las === 'CHECK') &&
    merged.aiStatus === 'NORMAL'
  ) {
    merged.aiStatus = 'CHECK'
    if (!merged.mainReason) merged.mainReason = listItem.mainReason || '점검 필요'
  }
  if (listItem.powerOffDone && !merged.shutdownDone) merged.shutdownDone = true
  const lf = Number(listItem.faultProb7d ?? 0)
  if (lf > Number(merged.faultProb7d ?? 0)) merged.faultProb7d = lf
  return merged
}

// knownListItem: 클릭 시점 스냅샷 — in-flight fetchChargerList 응답에 덮어쓰이지 않도록
const fetchChargerDetail = async (chargerId = getActiveChargerId(), knownListItem = null) => {
  try {
    const data = await getChargerDetail(chargerId)
    const listItem = knownListItem ?? chargerList.value.find((c) => c.chargerId === chargerId)
    chargerDetail.value = reconcileDetail(data, listItem, chargerDetail.value)
  } catch (error) {
    console.error('fetchChargerDetail error:', error)
  }
}

const fetchMetricData = async (chargerId = getActiveChargerId()) => {
  if (!chargerId) {
    metricData.value = emptyMetricData()
    return
  }
  try {
    metricData.value = await getSensorHistory(chargerId, 30)
  } catch (error) {
    console.error('fetchMetricData error:', error)
    metricData.value = emptyMetricData()
  }
}

const fetchHistoryData = async (chargerId = null) => {
  try {
    const rows = await getHistoryData(200, chargerId)
    if (chargerId && chargerId !== 'ALL') {
      const existingOthers = historyData.value.filter((r) => r.chargerId !== chargerId)
      const merged = [...rows, ...existingOthers]
      const seen = new Set()
      historyData.value = merged.filter((r) => {
        const key = r.id ?? `${r.chargerId}-${r.occurredAt}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } else {
      historyData.value = rows
    }
  } catch (error) {
    console.error('fetchHistoryData error:', error)
    historyData.value = []
  }
}

const fetchChargerList = async () => {
  try {
    const [chargers, chargingLogs] = await Promise.all([
      getChargerList(),
      getChargingLogs(filterStartDate.value, filterEndDate.value, 'ALL')
    ])

    const latestChargingLogMap = new Map()

    chargingLogs.forEach((log) => {
      if (!log?.chargerId) return
      const current = latestChargingLogMap.get(log.chargerId)
      const currentTime = current?.time ? new Date(current.time).getTime() : 0
      const nextTime = log?.time ? new Date(log.time).getTime() : 0

      if (!current || nextTime > currentTime) {
        latestChargingLogMap.set(log.chargerId, log)
      }
    })

    chargerList.value = chargers.map((charger) => {
      const latestLog = latestChargingLogMap.get(charger.chargerId)
      const isCharging = charger.chargerStatus === 'CHARGING'
      return {
        ...charger,
        currentChargeKwh: isCharging ? latestLog?.currentChargeKwh ?? 0 : 0,
        chargingMinutes: isCharging ? latestLog?.chargingMinutes ?? 0 : 0
      }
    })
  } catch (error) {
    console.error('fetchChargerList error:', error); chargerList.value = []
  }
}

// 폴링 제
const stopPolling = () => {
  if (statusIntervalId.value) clearInterval(statusIntervalId.value)
  if (metricIntervalId.value) clearInterval(metricIntervalId.value)
  if (historyIntervalId.value) clearInterval(historyIntervalId.value)
  statusIntervalId.value = metricIntervalId.value = historyIntervalId.value = null
}

const startPolling = () => {
  stopPolling()
  statusIntervalId.value = setInterval(async () => {
    await fetchChargerList()
    const chargerId = chargerDetail.value?.chargerId || getActiveChargerId()
    if (chargerId) await fetchChargerDetail(chargerId)
  }, STATUS_REFRESH_MS)

  metricIntervalId.value = setInterval(async () => {
    const chargerId = chargerDetail.value?.chargerId || getActiveChargerId()
    if (chargerId) await fetchMetricData(chargerId)
  }, METRIC_REFRESH_MS)

  historyIntervalId.value = setInterval(async () => {
    await fetchHistoryData()
  }, HISTORY_REFRESH_MS)
}

// 유틸리티 및 이벤트 핸들
// const formatShortDate = (value) => {
//   if (!value) return '-'
//   const date = new Date(value); const yy = String(date.getFullYear()).slice(2)
//   const mm = String(date.getMonth() + 1).padStart(2, '0'); const dd = String(date.getDate()).padStart(2, '0')
//   return `${yy}.${mm}.${dd}`
// }

// const displayDateRange = computed(() => {
//   return `${formatShortDate(filterStartDate.value)} - ${formatShortDate(filterEndDate.value)}`
// })

const handleChargerDetailView = async (chargerId) => {
  const clicked = chargerList.value.find((c) => c.chargerId === chargerId)
  if (clicked) {
    const cs = clicked.chargerStatus
    const las = clicked.aiStatus
    const aiStatus = (cs === 'RISK' || las === 'RISK') ? 'RISK' : (cs === 'CHECK' || cs === 'FAULT' || las === 'CHECK') ? 'CHECK' : 'NORMAL'
    chargerDetail.value = { ...chargerDetail.value, chargerId, aiStatus, mainReason: clicked.mainReason || '', faultProb7d: clicked.faultProb7d ?? 0, inspectionStatus: chargerDetail.value.inspectionStatus || 'NONE', shutdownDone: clicked.powerOffDone ?? false }
  }
  historyChargerId.value = chargerId
  activeTab.value = 'predictive'
  selectedHistoryItem.value = null
  await Promise.all([fetchChargerDetail(chargerId, clicked), fetchMetricData(chargerId), fetchHistoryData(chargerId)])
}

const openInspectionModal = (item) => { selectedHistoryItem.value = item; inspectionModalVisible.value = true }
const closeInspectionModal = () => { inspectionModalVisible.value = false; selectedHistoryItem.value = null }
const openForceShutdownModal = (item) => { selectedHistoryItem.value = item; forceShutdownModalVisible.value = true }
const closeForceShutdownModal = () => { forceShutdownModalVisible.value = false; selectedHistoryItem.value = null }

const handleInspectionSubmit = async (payload) => {
  try {
    const targetId = getActiveChargerId()
    await requestInspection({ ...payload, chargerId: targetId })
    inspectionModalVisible.value = false
    selectedHistoryItem.value = null
    fetchChargerDetail(targetId); fetchMetricData(targetId); fetchHistoryData()
  } catch (error) { console.error('handleInspectionSubmit error:', error) }
}

const handleForceShutdownConfirm = async (payload) => {
  try {
    const targetId = getActiveChargerId()
    const faultRecord = historyData.value.find((r) => r.chargerId === targetId && r.inspectionStatus !== 'DONE' && (r.status === 'CHECK' || r.status === 'RISK' || r.status === 'FAULT'))
    const frozenAiStatus = faultRecord?.status || chargerDetail.value.aiStatus
    const frozenMainReason = faultRecord?.detail || chargerDetail.value.mainReason
    const frozenFaultProb7d = chargerDetail.value.faultProb7d
    await requestForceShutdown({ ...payload, chargerId: targetId })
    chargerDetail.value = { ...chargerDetail.value, shutdownDone: true, frozenAiStatus, frozenMainReason, frozenFaultProb7d }
    chargerList.value = chargerList.value.map((c) => c.chargerId === targetId ? { ...c, powerOffDone: true } : c)
    forceShutdownModalVisible.value = false
    selectedHistoryItem.value = null
    fetchChargerDetail(targetId); fetchMetricData(targetId); fetchHistoryData()
  } catch (error) { console.error('handleForceShutdownConfirm error:', error) }
}

const openSummaryInspectionModal = () => { selectedHistoryItem.value = null; inspectionModalVisible.value = true }
const handleChargerChange = async (id) => { selectedHistoryItem.value = null; await Promise.all([fetchChargerDetail(id), fetchMetricData(id)]) }
const handleHistoryChargerSelect = async (id) => { await fetchHistoryData(id === 'ALL' ? null : id) }
const openSummaryForceShutdownModal = () => { selectedHistoryItem.value = null; forceShutdownModalVisible.value = true }

const handleWindowClick = (event) => { if (!event.target.closest('.header-right')) isDatePopupOpen.value = false }

onMounted(async () => {
  await fetchChargerList()
  if (route.query.tab === 'predictive' && route.query.chargerId) {
    await handleChargerDetailView(route.query.chargerId)
  } else {
    const initialId = chargerList.value.length > 0 ? chargerList.value[0].chargerId : '5F-D-10'
    await Promise.all([fetchChargerDetail(initialId), fetchMetricData(initialId), fetchHistoryData()])
  }
  startPolling()
  window.addEventListener('click', handleWindowClick)
})

onBeforeUnmount(() => { stopPolling(); window.removeEventListener('click', handleWindowClick) })
</script>

<style scoped>
/* 1. 전역 컨테이너 레이아웃 */
.ev-infra-container {
    width: 100%;
    overflow-y: auto;       
    overflow-x: hidden;     
    display: flex;
    flex-direction: column;
    background-color: transparent;
    color: #f5f5f5;
    font-family: 'Pretendard', sans-serif;
}

/* ── 2. 헤더 영역 (타이틀 & 탭 & 달력) ── */
.ev-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 17px;
    border-left: 5px solid #82c2e3;
    padding-left: 17px;
}

/* 왼쪽 (타이틀 + 탭) */
.header-left {
    display: flex;
    align-items: center;
    gap: 17px;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: #fff;
}

/* 탭 버튼 그룹 */
.tab-button-group {
    display: flex;
    background: rgba(68, 77, 86, 0.3);
    padding: 4px;
    border-radius: 5px; 
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: rgba(245, 245, 245, 0.6);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 5px;
  transition: 0.2s;
}

.tab-btn.active {
    background: #82c2e3; 
    color: #000; 
}

/* ── 3. 오른쪽 달력 영역 ── */
.relative-box {
    position: relative; 
}

.date-trigger-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(68, 77, 86, 0.3);
    padding: 8px 16px;
    border-radius: 5px; 
    border: 1px solid rgba(245, 245, 245, 0.1);
    cursor: pointer;
    transition: 0.2s;
}

.date-trigger-box:hover {
    border-color: #82c2e3; 
}

.date-text {
    font-size: 15px; 
    font-weight: 600;
    color: #fff;
}

/* 달력 아이콘 */
.date-trigger-box svg {
    width: 18px;
    height: 18px;
    color: rgba(245, 245, 245, 0.6);
    flex-shrink: 0;
}

/* ── 4. 탭 콘텐츠 영역 레이아웃 ── */
.tab-content {
    flex: 1; 
    display: flex;
    flex-direction: column;
}

/* 레이아웃 공통 간격 통일 (17px 규격) */
.status-layout, .predictive-layout {
  display: flex;
  flex-direction: column;
  gap: 17px; 
}

/* 상단 그리드 레이아웃 */
.status-top-grid {
  display: grid;
  grid-template-columns: 0.8fr 1fr;
  gap: 17px;
  align-items: stretch;
}

.predictive-top-grid {
  display: grid;
  grid-template-columns: 1fr 1.32fr;
  gap: 17px;
  min-height: 0;
  align-items: stretch;
}

/* 자식들을 감싸는 카드 공통 스타일 */
.layout-card {
  background: rgba(68, 77, 86, 0.3);
  border: 1px solid rgba(245, 245, 245, 0.08);
  border-radius: 10px;
  padding: 17px;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 5. 각 자식 섹션별 높이 지정  */
.space-card, .summary-card-right {
  height: 490px;
  min-height: 490px;
  overflow: hidden;
}

.log-card {
  height: 650px;
  min-height: 650px;
  overflow: hidden;
}

.history-card {
  height: 560px;
  min-height: 560px;
  overflow: hidden;
}

/* 반응형 처리 */
@media (max-width: 1200px) {
  .predictive-top-grid { grid-template-columns: 1fr; }
}
</style>