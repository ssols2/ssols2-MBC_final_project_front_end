<template>
  <div class="ev-infra-page">
    <div class="top-bar">
      <div class="page-header">
        <h2 class="page-title">EV 인프라 관리</h2>

        <div class="top-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'charger' }"
            @click="activeTab = 'charger'"
          >
            실시간 현황
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'predictive' }"
            @click="activeTab = 'predictive'"
          >
            예지보전 및 장애 관리
          </button>
        </div>
      </div>

      <div class="date-filter-slot">
        <button
          type="button"
          class="date-filter-button"
          @click.stop="isDatePopupOpen = !isDatePopupOpen"
        >
          {{ displayDateRange }}
          <span class="calendar-icon">
            <img src="@/assets/calender_Icon.png" alt="calendar" />
          </span>
        </button>
      
        <PredictiveDatePopup
          :visible="isDatePopupOpen"
          :start-date="filterStartDate"
          :end-date="filterEndDate"
          @update:startDate="filterStartDate = $event"
          @update:endDate="filterEndDate = $event"
          @apply="handleDateApply"
          @close="isDatePopupOpen = false"
        />
      </div>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'charger'" class="status-layout">
        <div class="status-top-grid">
          <section class="layout-card space-card">
            <ChargerStatusStats
              :charger-list="chargerList"
              @detail-view="handleChargerDetailView"
            />
          </section>
        
          <section class="layout-card summary-card-right">
            <ChargerOperationSummary
              :start-date="filterStartDate"
              :end-date="filterEndDate"
            />
          </section>
        </div>
      
        <section class="layout-card log-card">
          <ChargerEventLogTable 
            :start-date="filterStartDate"
            :end-date="filterEndDate"
            :charger-list="chargerList"
          />
        </section>
      </div>

      <div v-else class="predictive-layout">
        <div class="predictive-top-grid">
          <section class="layout-card summary-card">
            <PredictiveSummaryCard
              :charger-detail="chargerDetail"
              :charger-list="chargerList"
              @charger-change="handleChargerChange"
              @inspection-request="openSummaryInspectionModal"
              @force-shutdown="openSummaryForceShutdownModal"
              
              @inspection-complete="handleInspectionComplete"
              @power-on="handlePowerOnConfirm"
            />
          </section>

          <section class="layout-card analysis-card">
            <PredictiveMetricTabs
               :metric-data="metricData"
               :start-date="filterStartDate" 
               :end-date="filterEndDate"
            />
          </section>
        </div>

        <section class="layout-card history-card">
          <FaultHistoryTable
            :history-data="historyData"
            :charger-list="chargerList"
            :active-charger-id="historyChargerId"
            :start-date="filterStartDate"
            :end-date="filterEndDate"
            @inspection-request="openInspectionModal"
            @force-shutdown="openForceShutdownModal"
            @charger-select="handleHistoryChargerSelect"

            @inspection-complete="handleInspectionComplete"
            @power-on="handlePowerOnConfirm"
          />
        </section>
      </div>
    </div>

    <InspectionRequestModal
      :visible="inspectionModalVisible"
      :charger-detail="selectedHistoryItem || chargerDetail"
      @close="closeInspectionModal"
      @submit="handleInspectionSubmit"
    />

    <ForceShutdownConfirmModal
      :visible="forceShutdownModalVisible"
      :charger-detail="selectedHistoryItem || chargerDetail"
      @close="closeForceShutdownModal"
      @confirm="handleForceShutdownConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'

// [임소리] 추가 ======================================================================
import { useRoute } from 'vue-router'
const route = useRoute()

// DashboardLayout에서 던져준 새로고침 받기
const refreshPendingCount = inject('refreshPendingCount', () => {})

import axios from 'axios'

// 플로팅 팝업에서 다른 기기를 클릭했을 때 화면 즉시 갱신
watch(() => route.query.chargerId, async (newId) => {
  if (newId && route.query.tab === 'predictive') {
    await handleChargerDetailView(newId)
  }
})

// 시설관리팀 점검 완료 처리 함수
const handleInspectionComplete = async (item = null) => {
  // 테이블에서 넘어오면 item.chargerId, 요약 카드에서 넘어오면 현재 선택된 getActiveChargerId() 사용
  const targetId = item ? item.chargerId : getActiveChargerId()
  
  if (confirm(`[${targetId}] 기기의 점검을 완료 처리하시겠습니까?`)) {
    try {
      const res = await axios.post('http://localhost:8003/inspection/complete', { chargerId: targetId })
      if (res.data.success) {
        alert('점검 완료 처리되었습니다')
        await fetchChargerList()
        await fetchChargerDetail(targetId)
        await fetchHistoryData()

        refreshPendingCount()
      }
    } catch (e) {
      console.error('점검 완료 처리 실패:', e)
      alert('처리 중 오류가 발생했습니다')
    }
  }
}

// 주차/보안팀 가동 재개 처리 함수
const handlePowerOnConfirm = async (item = null) => {
  const targetId = item ? item.chargerId : getActiveChargerId()
  
  if (confirm(`[${targetId}] 기기를 다시 가동하시겠습니까?`)) {
    try {
      const res = await axios.post('http://localhost:8003/control/power-on', { chargerId: targetId })
      if (res.data.success) {
        alert('기기 가동이 재개되었습니다')
        await fetchChargerList()
        await fetchChargerDetail(targetId)
        await fetchHistoryData()
      }
    } catch (e) {
      console.error('가동 재개 실패:', e)
      alert('처리 중 오류가 발생했습니다')
    }
  }
}
// =============================================================================================

// 예지보전 컴포넌트
import PredictiveSummaryCard from '@/components/ev_infra/predictive/PredictiveSummaryCard.vue'
import PredictiveMetricTabs from '@/components/ev_infra/predictive/PredictiveMetricTabs.vue'
import FaultHistoryTable from '@/components/ev_infra/predictive/FaultHistoryTable.vue'
import InspectionRequestModal from '@/components/ev_infra/predictive/InspectionRequestModal.vue'
import ForceShutdownConfirmModal from '@/components/ev_infra/predictive/ForceShutdownConfirmModal.vue'
import PredictiveDatePopup from '@/components/ev_infra/predictive/PredictiveDatePopup.vue'

// 충전기 현황 컴포넌트
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
const isDatePopupOpen = ref(false)
const selectedHistoryItem = ref(null)
const chargerList = ref([])
const historyChargerId = ref('ALL')
const statusIntervalId = ref(null)
const metricIntervalId = ref(null)
const historyIntervalId = ref(null)

// 날짜 관련 헬퍼 함수
function formatDateOnly(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultLast7DaysRange() {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - 6)
  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end)
  }
}

const defaultRange = getDefaultLast7DaysRange()
const filterStartDate = ref(defaultRange.startDate)
const filterEndDate = ref(defaultRange.endDate)

// 충전기 상세 데이터 초기값
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

// 비즈니스 로직 함수들
const getActiveChargerId = () => {
  return selectedHistoryItem.value?.chargerId || chargerDetail.value?.chargerId || '5F-D-10'
}

// Spring ai_status가 NORMAL을 반환해도 chargerList(FastAPI)의 실시간 상태로 보정
const reconcileDetail = (detail, listItem, prevDetail = null) => {
  if (!detail || !listItem) return detail
  const merged = { ...detail }

  // shutdownDone이면 강제종료 시점의 fault 상태(aiStatus/mainReason) 보존
  // merged.shutdownDone이 아직 false여도 listItem.powerOffDone 또는 prevDetail.shutdownDone으로 판단
  const isShutdown = merged.shutdownDone || listItem?.powerOffDone || prevDetail?.shutdownDone
  if (isShutdown) {
    merged.shutdownDone = true
    // frozenAiStatus는 사용자가 강제종료 클릭 시에만 명시적으로 설정됨 — prevDetail.aiStatus fallback 없음
    const lockedStatus = prevDetail?.frozenAiStatus
    if (lockedStatus === 'RISK' || lockedStatus === 'CHECK') {
      merged.aiStatus        = lockedStatus
      merged.mainReason      = prevDetail.frozenMainReason || merged.mainReason
      merged.faultProb7d     = prevDetail.frozenFaultProb7d ?? merged.faultProb7d
      merged.frozenAiStatus  = lockedStatus
      merged.frozenMainReason  = prevDetail.frozenMainReason
      merged.frozenFaultProb7d = prevDetail.frozenFaultProb7d
      return merged
    }
    // frozenAiStatus 없으면 shutdownDone만 true로 두고 일반 로직 진행
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
      // 특정 기기 선택 시: 해당 기기 결과 + 기존 다른 기기 기록 병합 (중복 제거)
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
    console.error('fetchChargerList error:', error)
    chargerList.value = []
  }
}

// 폴링 제어
const stopPolling = () => {
  if (statusIntervalId.value) clearInterval(statusIntervalId.value)
  if (metricIntervalId.value) clearInterval(metricIntervalId.value)
  if (historyIntervalId.value) clearInterval(historyIntervalId.value)
  statusIntervalId.value = null
  metricIntervalId.value = null
  historyIntervalId.value = null
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

// 유틸리티 및 이벤트 핸들러
const formatShortDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

const displayDateRange = computed(() => {
  return `${formatShortDate(filterStartDate.value)} - ${formatShortDate(filterEndDate.value)}`
})

const handleChargerDetailView = async (chargerId) => {
  // 클릭 시점 스냅샷 캡처
  const clicked = chargerList.value.find((c) => c.chargerId === chargerId)
  // 클릭한 카드의 상태를 즉시 반영 (Spring fetch 완료 전 정상으로 깜빡이는 현상 방지)
  if (clicked) {
    const cs = clicked.chargerStatus
    const las = clicked.aiStatus
    const aiStatus =
      cs === 'RISK' || las === 'RISK' ? 'RISK'
      : cs === 'CHECK' || cs === 'FAULT' || las === 'CHECK' ? 'CHECK'
      : 'NORMAL'
    chargerDetail.value = {
      ...chargerDetail.value,
      chargerId,
      aiStatus,
      mainReason: clicked.mainReason || '',
      faultProb7d: clicked.faultProb7d ?? 0,
      inspectionStatus: chargerDetail.value.inspectionStatus || 'NONE',
      shutdownDone: clicked.powerOffDone ?? false
    }
  }
  // FaultHistoryTable 셀렉트도 클릭한 기기로 맞춤
  historyChargerId.value = chargerId
  // 탭 즉시 전환
  activeTab.value = 'predictive'
  selectedHistoryItem.value = null
  // 스냅샷 전달로 in-flight polling 응답과의 race 방지
  await Promise.all([
    fetchChargerDetail(chargerId, clicked),
    fetchMetricData(chargerId),
    fetchHistoryData(chargerId)
  ])
}

const openInspectionModal = (item) => {
  selectedHistoryItem.value = item
  inspectionModalVisible.value = true
}

const closeInspectionModal = () => {
  inspectionModalVisible.value = false
  selectedHistoryItem.value = null
}

const openForceShutdownModal = (item) => {
  selectedHistoryItem.value = item
  forceShutdownModalVisible.value = true
}

const closeForceShutdownModal = () => {
  forceShutdownModalVisible.value = false
  selectedHistoryItem.value = null
}

const handleInspectionSubmit = async (payload) => {
  try {
    const targetChargerId = getActiveChargerId()
    await requestInspection({ ...payload, chargerId: targetChargerId })
    inspectionModalVisible.value = false
    selectedHistoryItem.value = null
    fetchChargerDetail(targetChargerId)
    fetchMetricData(targetChargerId)
    fetchHistoryData()
  } catch (error) {
    console.error('handleInspectionSubmit error:', error)
    alert('점검 요청 전송에 실패했습니다. 서버 연결을 확인해주세요.')
  }
}

const handleForceShutdownConfirm = async (payload) => {
  try {
    const targetChargerId = getActiveChargerId()
    // DB fault 레코드의 status를 기준으로 고정 (실시간 센서값 아님)
    const faultRecord = historyData.value.find(
      (r) => r.chargerId === targetChargerId &&
             r.inspectionStatus !== 'DONE' &&
             (r.status === 'CHECK' || r.status === 'RISK' || r.status === 'FAULT')
    )
    const frozenAiStatus = faultRecord?.status || chargerDetail.value.aiStatus
    const frozenMainReason = faultRecord?.detail || chargerDetail.value.mainReason
    const frozenFaultProb7d = chargerDetail.value.faultProb7d
    await requestForceShutdown({ ...payload, chargerId: targetChargerId })
    chargerDetail.value = {
      ...chargerDetail.value,
      shutdownDone: true,
      frozenAiStatus,
      frozenMainReason,
      frozenFaultProb7d
    }
    // chargerList도 즉시 반영 → FaultHistoryTable syntheticRow가 전원꺼짐 표시
    chargerList.value = chargerList.value.map((c) =>
      c.chargerId === targetChargerId ? { ...c, powerOffDone: true } : c
    )
    forceShutdownModalVisible.value = false
    selectedHistoryItem.value = null
    fetchChargerDetail(targetChargerId)
    fetchMetricData(targetChargerId)
    fetchHistoryData()
  } catch (error) {
    console.error('handleForceShutdownConfirm error:', error)
    alert('강제 종료 요청에 실패했습니다. 서버 연결을 확인해주세요.')
  }
}

const openSummaryInspectionModal = () => {
  selectedHistoryItem.value = null
  inspectionModalVisible.value = true
}

const handleChargerChange = async (chargerId) => {
  selectedHistoryItem.value = null
  await Promise.all([
    fetchChargerDetail(chargerId),
    fetchMetricData(chargerId)
  ])
}

const handleHistoryChargerSelect = async (chargerId) => {
  await fetchHistoryData(chargerId === 'ALL' ? null : chargerId)
}

const openSummaryForceShutdownModal = () => {
  selectedHistoryItem.value = null
  forceShutdownModalVisible.value = true
}

const handleDateApply = ({ startDate, endDate }) => {
  filterStartDate.value = startDate
  filterEndDate.value = endDate
  isDatePopupOpen.value = false
}

const handleWindowClick = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (!target.closest('.date-filter-slot')) {
    isDatePopupOpen.value = false
  }
}

// onMounted(async () => {
//   await fetchChargerList()
//   const initialChargerId = chargerList.value.length > 0 ? chargerList.value[0].chargerId : '5F-D-10'

//   await Promise.all([
//     fetchChargerDetail(initialChargerId),
//     fetchMetricData(initialChargerId),
//     fetchHistoryData()
//   ])

//   startPolling()
//   window.addEventListener('click', handleWindowClick)
// })

onMounted(async () => {
  await fetchChargerList()

  if (route.query.tab === 'predictive' && route.query.chargerId) {
    await handleChargerDetailView(route.query.chargerId)
  } else {
    // 꼬리표 없이 그냥 메뉴로 들어왔으면 원래대로 첫 번째 기기 띄워주기
    const initialChargerId = chargerList.value.length > 0 ? chargerList.value[0].chargerId : '5F-D-10'
    await Promise.all([
      fetchChargerDetail(initialChargerId),
      fetchMetricData(initialChargerId),
      fetchHistoryData()
    ])
  }

  startPolling()
  window.addEventListener('click', handleWindowClick)
})

onBeforeUnmount(() => {
  stopPolling()
  window.removeEventListener('click', handleWindowClick)
})
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");

.ev-infra-page {
  height: 100vh;
  /* overflow-y: auto; */
  padding: 20px;
  color: #ffffff;
  box-sizing: border-box;
  font-family: 'Pretendard', sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.top-tabs {
  display: flex;
  flex-wrap: wrap;
}

.tab-btn {
  min-width: 160px;
  padding: 8px 16px;
  border: 1px solid #2b3553;
  border-radius: 5px;
  background: #11182c;
  color: #cdd6f4;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.date-filter-slot {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.date-filter-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 190px;
  padding: 9px 12px;
  border: 1px solid #2b3553;
  border-radius: 10px;
  background: #11182c;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.calendar-icon img {
  width: 16px;
  height: 16px;
}

.tab-content {
  display: block;
  min-height: auto;
}

.predictive-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.predictive-top-grid {
  display: grid;
  grid-template-columns: 1fr 1.32fr;
  gap: 15px;
  min-height: 0;
  align-items: start;
}

.layout-card {
  position: relative;
  padding: 18px;
  
  color: #e5e7eb;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.history-card {
  height: 560px;
  min-height: 560px;
  overflow: hidden;
}


.status-layout {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.status-top-grid {
  display: grid;
  grid-template-columns: 0.8fr 1fr;
  gap: 15px;
  align-items: stretch;
}

.space-card {
  height: 490px;
  min-height: 490px;
  overflow: hidden;
}

.summary-card-right {
  height: 490px;
  min-height: 490px;
  overflow: hidden;
}

.log-card {
  height: 650px;
  min-height: 650px;
  overflow: hidden;
}

/* 반응형 처리 */
@media (max-width: 1200px) {
  .predictive-top-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .date-filter-slot {
    justify-content: flex-start;
  }
}
</style>