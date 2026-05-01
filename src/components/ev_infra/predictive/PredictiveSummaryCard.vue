<template>
  <div class="summary-card" :class="cardThemeClass">
    <div class="summary-header">
      <h3 class="card-title">EV 기기 상태 요약 및 관리</h3>

      <!-- 260501 임소리 수정: 부서별 권한에 따른 버튼/텍스트 노출 분기 -->
      <div class="header-actions">

        <!-- 시설관리팀 화면 -->
        <template v-if="isFacilityTeam">
          <button v-if="normalizedInspectionStatus === 'REQUESTED' || normalizedInspectionStatus === 'IN_PROGRESS'"
            type="button" class="action-btn inspection" @click="$emit('inspection-complete')">
            점검 완료
          </button>
          <span v-else-if="normalizedInspectionStatus === 'DONE'" class="action-done complete">
            조치완료
          </span>
        </template>

        <!-- 주차관리팀 / 보안팀 화면 -->
        <template v-else>
          <!-- 강제 종료 후 점검 완료됨 -> 가동 재개 (활성) -->
          <button v-if="normalizedInspectionStatus === 'DONE' && chargerDetail.shutdownDone" type="button"
            class="action-btn restart active" @click="$emit('power-on')">
            가동 재개
          </button>

          <!-- 강제 종료 후 아직 점검 안됨 -> 가동 재개 (비활성) -->
          <button
            v-else-if="chargerDetail.shutdownDone && normalizedInspectionStatus !== 'DONE' && normalizedInspectionStatus !== 'NONE'"
            type="button" class="action-btn restart disabled" disabled>
            가동 재개
          </button>

          <!-- 모든 조치 완료 & 전원 켜짐 -> 조치완료 텍스트 -->
          <span v-else-if="normalizedInspectionStatus === 'DONE' && !chargerDetail.shutdownDone"
            class="action-done complete">
            조치완료
          </span>

          <!-- 초기 장애 상태 (버튼 2개 혹은 텍스트) -->
          <template v-else>
            <span v-if="normalizedInspectionStatus === 'REQUESTED' || normalizedInspectionStatus === 'IN_PROGRESS'"
              class="action-done inspection-done">요청됨</span>
            <button v-else type="button" class="action-btn inspection" :disabled="!canRequestInspection"
              @click="handleInspectionRequest">
              점검 요청
            </button>

            <span v-if="chargerDetail.shutdownDone" class="action-done shutdown-done">전원차단</span>
            <button v-else type="button" class="action-btn shutdown" :disabled="!canForceShutdown"
              @click="handleForceShutdown">
              강제 종료
            </button>
          </template>
        </template>
        <!-- 임소리 수정 부분 끝 -->

      </div>
    </div>

    <div class="summary-toolbar">
      <select v-model="selectedChargerId" class="charger-select" @change="handleChargerChange">
        <option v-for="item in normalizedChargerList" :key="item.chargerId" :value="item.chargerId">
          {{ item.chargerId }}
        </option>
      </select>
    </div>

    <div class="summary-body">
      <div class="summary-info-panel">
        <div class="device-card">
          <div class="device-top">
            <h4 class="device-id">{{ chargerDetail.chargerId }}</h4>
            <span class="status-lamp" :class="lampClass"></span>
          </div>

          <div class="result-box">
            <div class="result-header">
              <span class="result-icon">✓</span>
              <span class="result-title">{{ summaryStatusLabel }}</span>
            </div>

            <div class="result-content">
              <span class="badge">AI 예측</span>

              <div class="result-text">
                <template v-if="
                  normalizedAiStatus !== 'NORMAL' &&
                  chargerDetail.faultProb7d !== null &&
                  chargerDetail.faultProb7d !== undefined
                ">
                  7일 내 고장 확률 {{ faultPercent }}
                </template>
              </div>

              <div class="result-text">{{ reasonText }}</div>
              <div class="result-text">{{ actionGuideText }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-image-panel">
        <div class="machine-image-wrap">
          <img class="machine-image" src="@/assets/ev_machine.png" alt="EV 충전기" />

          <div v-if="screenStatusText" class="machine-screen-overlay" :class="screenStatusClass"></div>

          <div v-if="screenStatusText" class="machine-screen-text" :class="screenStatusClass">
            {{ screenStatusText }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  chargerDetail: {
    type: Object,
    required: true
  },
  chargerList: {
    type: Array,
    default: () => []
  }
})

// 260501 임소리: 부서 확인 로직 추가
const isFacilityTeam = computed(() => {
  try {
    const loginData = JSON.parse(sessionStorage.getItem('loginId')) || {}
    
    return loginData.adminDeptName === '시설관리팀'
  } catch (error) {
    console.error('부서 정보 확인 중 에러 발생:', error)
    return false
  }
})

// 260501 임소리: inspection-complete, power-on 추가
const emit = defineEmits([
  'charger-change',
  'inspection-request',
  'force-shutdown',
  'inspection-complete',
  'power-on'
])

const chargerDetail = computed(() => props.chargerDetail || {})

const normalizedChargerList = computed(() => {
  return Array.isArray(props.chargerList) ? props.chargerList : []
})

const selectedChargerId = ref(chargerDetail.value.chargerId || '')

watch(
  () => chargerDetail.value.chargerId,
  (newValue) => {
    selectedChargerId.value = newValue || ''
  },
  { immediate: true }
)

const normalizedInspectionStatus = computed(() => {
  const inspectionStatus = chargerDetail.value.inspectionStatus
  const inspectionRequested = chargerDetail.value.inspectionRequested

  if (inspectionStatus === 'DONE') return 'DONE'
  if (inspectionStatus === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (inspectionStatus === 'REQUESTED') return 'REQUESTED'
  if (inspectionRequested === true) return 'REQUESTED'

  return 'NONE'
})

const normalizedAiStatus = computed(() => {
  // shutdownDone이면 frozenAiStatus 우선 — 폴링이 NORMAL로 덮어도 무시
  if (chargerDetail.value.shutdownDone) {
    const frozen = chargerDetail.value.frozenAiStatus
    if (frozen === 'RISK' || frozen === 'CHECK') return frozen
  }
  return chargerDetail.value.aiStatus || 'NORMAL'
})

const faultPercent = computed(() => {
  const value = chargerDetail.value.faultProb7d

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Math.round(Number(value) * 100)}%`
})

const summaryStatusLabel = computed(() => {
  if (normalizedAiStatus.value === 'RISK') return '긴급 점검 필요'
  if (normalizedAiStatus.value === 'CHECK') return '점검 필요'
  return '정상 운영'
})

const reasonText = computed(() => {
  return chargerDetail.value.mainReason || '이상 사유 정보 없음'
})

const actionGuideText = computed(() => {
  if (normalizedInspectionStatus.value === 'DONE') {
    return '시설팀 조치가 완료되었습니다'
  }

  if (normalizedInspectionStatus.value === 'IN_PROGRESS') {
    return '시설팀 점검 진행 중입니다'
  }

  if (normalizedInspectionStatus.value === 'REQUESTED') {
    return '시설팀 점검 요청이 접수되었습니다'
  }

  if (normalizedAiStatus.value === 'RISK') {
    return '즉시 점검 및 기기 상태 확인 권장'
  }

  if (normalizedAiStatus.value === 'CHECK') {
    return '선제적 점검 및 상태 확인 권장'
  }

  return '현재 이상 징후 없음'
})

const cardThemeClass = computed(() => {
  if (chargerDetail.value.shutdownDone) return 'risk'
  if (normalizedAiStatus.value === 'RISK') return 'risk'
  if (normalizedAiStatus.value === 'CHECK') return 'check'
  return 'normal'
})

const lampClass = computed(() => {
  if (chargerDetail.value.shutdownDone) return 'risk'
  if (normalizedAiStatus.value === 'RISK') return 'risk'
  if (normalizedAiStatus.value === 'CHECK') return 'check'
  return 'normal'
})

const canRequestInspection = computed(() => {
  const status = chargerDetail.value.aiStatus

  return (
    (status === 'CHECK' || status === 'RISK') &&
    normalizedInspectionStatus.value === 'NONE'
  )
})

const canForceShutdown = computed(() => {
  const status = chargerDetail.value.aiStatus
  const shutdownDone = chargerDetail.value.shutdownDone

  return (status === 'CHECK' || status === 'RISK') && !shutdownDone
})

const screenStatusText = computed(() => {
  if (normalizedInspectionStatus.value === 'DONE') return '점검완료'
  if (normalizedInspectionStatus.value === 'IN_PROGRESS') return '점검중'
  if (normalizedAiStatus.value === 'RISK') return '위험'
  if (normalizedAiStatus.value === 'CHECK') return '점검필요'
  return '정상'
})

const screenStatusClass = computed(() => {
  if (normalizedInspectionStatus.value === 'DONE') return 'normal'
  if (normalizedInspectionStatus.value === 'IN_PROGRESS') return 'check'
  if (normalizedAiStatus.value === 'RISK') return 'risk'
  if (normalizedAiStatus.value === 'CHECK') return 'check'
  return 'normal'
})

const handleChargerChange = () => {
  if (!selectedChargerId.value) return
  emit('charger-change', selectedChargerId.value)
}

const handleInspectionRequest = () => {
  if (!canRequestInspection.value) return
  emit('inspection-request')
}

const handleForceShutdown = () => {
  if (!canForceShutdown.value) return
  emit('force-shutdown')
}
</script>

<style scoped>
.summary-card {
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 1px solid #1d9f49;
  border-radius: 8px;
  background: linear-gradient(180deg, #0b1018 0%, #0c1119 100%);
  box-shadow:
    0 0 0 1px rgba(38, 211, 100, 0.14),
    0 0 12px rgba(27, 186, 79, 0.1);
  color: #f3f4f6;
  overflow: hidden;
}

.summary-card.normal,
.summary-card.done {
  border-color: #1d9f49;
  box-shadow:
    0 0 0 1px rgba(38, 211, 100, 0.14),
    0 0 12px rgba(27, 186, 79, 0.1);
}

.summary-card.check {
  border-color: #ffcc00;
  box-shadow:
    0 0 0 1px rgba(255, 204, 0, 0.14),
    0 0 12px rgba(255, 204, 0, 0.1);
}

.summary-card.risk {
  border-color: #ef4444;
  box-shadow:
    0 0 0 1px rgba(239, 68, 68, 0.14),
    0 0 12px rgba(239, 68, 68, 0.1);
}

.summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap; /* 줄바꿈 금지 */
  justify-content: flex-end;
  height: 30px; /* 버튼 높이로 고정하여 틀어짐 방지 */
}

.action-btn {
  min-width: 84px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.action-btn.inspection {
  background: rgba(255, 204, 0, 0.12);
  border-color: #ffcc00;
  color: #ffcc00;
}

.action-btn.shutdown {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: #f87171;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.action-done.complete {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid #22c55e;
  color: #22c55e;
}

.action-done.inspection-done {
  background: rgba(255, 204, 0, 0.14);
  border: 1px solid #ffcc00;
  color: #ffcc00;
}

.action-done.shutdown-done {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid #ef4444;
  color: #f87171;
}

.summary-toolbar {
  margin-top: 10px;
}

.charger-select {
  min-width: 17px;
  height: 32px;
  padding: 0 30px 0 10px;
  border: 1px solid #374151;
  border-radius: 6px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 13px;
  font-weight: 600;
}

.summary-body {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
}

.summary-info-panel {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

.device-card {
  width: 100%;
  max-width: 400px;
  padding: 14px;
  border-radius: 10px;
  background: linear-gradient(180deg, #1a202c 0%, #161b25 100%);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.device-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.device-id {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
}

.status-lamp {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-lamp.normal,
.status-lamp.done {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.85);
}

.status-lamp.check {
  background: #ffcc00;
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.85);
}

.status-lamp.risk {
  background: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.85);
}

.result-box {
  border: 2px solid rgba(34, 197, 94, 0.7);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(34, 197, 94, 0.08);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.18);
}

.summary-card.check .result-box {
  border-color: rgba(255, 204, 0, 0.7);
  background: rgba(255, 204, 0, 0.08);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.18);
}

.summary-card.risk .result-box {
  border-color: rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.08);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.18);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(34, 197, 94, 0.14);
  color: #d1fae5;
  font-size: 16px;
  font-weight: 800;
}

.summary-card.check .result-header {
  background: rgba(255, 204, 0, 0.14);
  color: #fff3bf;
}

.summary-card.risk .result-header {
  background: rgba(239, 68, 68, 0.14);
  color: #fecaca;
}

.result-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #22c55e;
  color: #052e16;
  font-size: 11px;
  font-weight: 900;
}

.summary-card.check .result-icon {
  background: #ffcc00;
  color: #3b2f00;
}

.summary-card.risk .result-icon {
  background: #ef4444;
  color: #ffffff;
}

.result-content {
  margin: 10px;
  padding: 10px 12px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: rgba(55, 65, 81, 0.58);
}

.badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 7px;
  border: 1px solid #6b7280;
  border-radius: 5px;
  background: rgba(31, 41, 55, 0.9);
  color: #d1d5db;
  font-size: 11px;
  font-weight: 700;
}

.result-text {
  font-size: 14px;
  line-height: 1.5;
  color: #e5e7eb;
}

.summary-image-panel {
  flex: 0 0 160px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding-right: 4px;
}

.machine-image {
  width: 200px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

@media (max-width: 1024px) {
  .summary-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-image-panel {
    width: 100%;
    flex: none;
    justify-content: flex-end;
    align-items: center;
  }

  .machine-image {
    width: 130px;
  }
}

@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .device-card {
    max-width: 100%;
  }
}

.machine-image-wrap {
  position: relative;
  display: inline-block;
  width: 100%;
}

.machine-screen-text {
  position: absolute;
  top: 24.5%;
  left: 44%;
  transform: translateX(-50%);
  width: 31%;
  height: 13%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 800;
  font-size: 16.5px;
  line-height: 1;
  letter-spacing: -0.5px;
  text-align: center;

  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.machine-screen-text.normal {
  color: #22c55e;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.85);
}

.machine-screen-text.check {
  color: #facc15;
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.85);
}

.machine-screen-text.risk {
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.85);
}

.machine-screen-overlay {
  position: absolute;
  top: 22.55%;
  left: 44%;
  transform: translateX(-50%);
  width: 39.3%;
  height: 17.4%;
  border-radius: 2.5px;
}

.machine-screen-overlay.normal {
  background: rgba(34, 197, 94, 0.22);
  box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.35);
}

.machine-screen-overlay.check {
  background: rgba(250, 204, 21, 0.22);
  box-shadow: inset 0 0 20px rgba(250, 204, 21, 0.35);
}

.machine-screen-overlay.risk {
  background: rgba(239, 68, 68, 0.22);
  box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.35);
}

/* 260501: 가동 재개 버튼 스타일 추가 */
.action-btn.restart.active {
  border: 1px solid #22c55e;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.action-btn.restart.active:hover {
  background: rgba(34, 197, 94, 0.25);
}

.action-btn.restart.disabled {
  border: 1px solid #4b5563;
  color: #9ca3af;
  background: transparent;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 260501: 기기 스크린 텍스트 '점검중' 스타일 추가 */
.machine-screen-text.checking {
  color: #facc15;
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.85);
}
</style>