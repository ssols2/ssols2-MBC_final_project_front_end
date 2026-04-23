<template>
  <div class="predictive-detail-page">
    <div class="page-header">
      <h2 class="page-title">예지보전 및 장애 관리</h2>

      <div class="date-filter-wrap">
        <button class="date-range-button" type="button" @click="toggleDatePopup">
          <span>{{ displayDateRange }}</span>
          <span class="calendar-icon">📅</span>
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

    <div v-if="loading" class="loading-box">
      데이터 불러오는 중...
    </div>

    <template v-else>
      <div class="device-info-bar">
        <div class="device-info-item">
          <span class="info-label">기기 ID</span>
          <span class="info-value">{{ chargerDetail.chargerId }}</span>
        </div>

        <div class="device-info-item">
          <span class="info-label">위치</span>
          <span class="info-value">{{ chargerDetail.location }}</span>
        </div>

        <div class="device-info-item">
          <span class="info-label">최종 갱신</span>
          <span class="info-value">{{ chargerDetail.updatedAt }}</span>
        </div>
      </div>

      <div class="content-section">
        <section class="section-box">
          <PredictiveSummaryCard
            :charger-detail="chargerDetail"
            @inspection-request="openInspectionModal"
            @force-shutdown="openForceShutdownModal"
          />
        </section>

        <section class="section-box">
          <PredictiveMetricTabs :metric-data="metricData" />
        </section>

        <section class="section-box">
          <FaultHistoryTable :history-data="historyData" />
        </section>
      </div>
    </template>

    <InspectionRequestModal
      :visible="inspectionModalVisible"
      :charger-detail="chargerDetail"
      @close="closeInspectionModal"
      @submit="submitInspectionRequest"
    />

    <ForceShutdownConfirmModal
      :visible="forceShutdownModalVisible"
      :charger-detail="chargerDetail"
      @close="closeForceShutdownModal"
      @confirm="handleForceShutdownConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import PredictiveDatePopup from './PredictiveDatePopup.vue'
import PredictiveSummaryCard from './PredictiveSummaryCard.vue'
import PredictiveMetricTabs from './PredictiveMetricTabs.vue'
import FaultHistoryTable from './FaultHistoryTable.vue'
import InspectionRequestModal from './InspectionRequestModal.vue'
import ForceShutdownConfirmModal from './ForceShutdownConfirmModal.vue'
import {
  getChargerDetail,
  getMetricData,
  getHistoryData
} from '../../../api/evPredictive'
import { requestInspection } from '../../../api/evInspection'
import { requestForceShutdown } from '../../../api/evControl'

const loading = ref(true)
const inspectionModalVisible = ref(false)
const forceShutdownModalVisible = ref(false)

const isDatePopupOpen = ref(false)
const filterStartDate = ref('2026-02-13')
const filterEndDate = ref('2026-03-13')

const chargerDetail = ref({})
const metricData = ref({
  temperature: [],
  current: [],
  voltage: []
})
const historyData = ref([])

const chargerId = 1

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

const fetchData = async () => {
  loading.value = true

  try {
    chargerDetail.value = await getChargerDetail(chargerId)
    metricData.value = await getMetricData(chargerId)
    historyData.value = await getHistoryData(chargerId)
  } finally {
    loading.value = false
  }
}

const toggleDatePopup = () => {
  isDatePopupOpen.value = !isDatePopupOpen.value
}

const closeDatePopup = () => {
  isDatePopupOpen.value = false
}

const openInspectionModal = () => {
  inspectionModalVisible.value = true
}

const closeInspectionModal = () => {
  inspectionModalVisible.value = false
}

const openForceShutdownModal = () => {
  forceShutdownModalVisible.value = true
}

const closeForceShutdownModal = () => {
  forceShutdownModalVisible.value = false
}

const submitInspectionRequest = async (payload) => {
  const result = await requestInspection(payload)
  alert(result.message)
  closeInspectionModal()
}

const handleForceShutdownConfirm = async (payload) => {
  const result = await requestForceShutdown(payload)
  alert(result.message)
  closeForceShutdownModal()
}

const handleDateApply = async ({ startDate: newStartDate, endDate: newEndDate }) => {
  filterStartDate.value = newStartDate
  filterEndDate.value = newEndDate
  closeDatePopup()
  await fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.predictive-detail-page {
  color: #ffffff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.date-filter-wrap {
  position: relative;
}

.date-range-button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  padding: 10px 14px;
  border: 1px solid #2b3553;
  border-radius: 10px;
  background: #11182c;
  color: #ffffff;
  cursor: pointer;
}

.calendar-icon {
  font-size: 14px;
}

.loading-box {
  padding: 20px;
  border: 1px solid #2b3553;
  border-radius: 12px;
  background: #0f172a;
}

.device-info-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #2b3553;
  border-radius: 14px;
  background: #0f172a;
}

.device-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.info-label {
  font-size: 12px;
  color: #94a3b8;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-box {
  border: 1px solid #2b3553;
  border-radius: 14px;
  background: #0f172a;
  overflow: hidden;
}
</style>