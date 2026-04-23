<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-icon">
        <img src="@/assets/Request_icon.png" alt="icon" />
      </div>

      <div class="modal-title">기기 점검 요청</div>

      <div class="modal-body">
        <div class="form-row horizontal">
          <label>기기 ID</label>
          <div class="select-box">
            <span>{{ safeChargerDetail.chargerId }}</span>
            <span class="select-arrow">⌄</span>
          </div>
        </div>

        <div class="form-row horizontal">
          <label>수신부서</label>
          <input type="text" value="시설관리팀" readonly />
        </div>

        <div class="form-row">
          <label class="type-label">장애유형</label>
          <div class="checkbox-group">
            <label class="check-item">
              <input type="checkbox" v-model="reasonTypes.temperature" />
              <span class="check-box"></span>
              <span>과열 감지</span>
            </label>

            <label class="check-item">
              <input type="checkbox" v-model="reasonTypes.voltage" />
              <span class="check-box"></span>
              <span>전압 이상</span>
            </label>

            <label class="check-item">
              <input type="checkbox" v-model="reasonTypes.current" />
              <span class="check-box"></span>
              <span>전류 이상</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <label class="type-label">요청사유</label>
          <textarea v-model="requestReason" rows="5"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-button" @click="$emit('close')">
          취소
        </button>
        <button type="button" class="submit-button" @click="handleSubmit">
          전송
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  chargerDetail: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const safeChargerDetail = computed(() => ({
  chargerId: props.chargerDetail?.chargerId ?? '',
  aiStatus: props.chargerDetail?.aiStatus ?? '',
  faultProb7d: props.chargerDetail?.faultProb7d ?? 0,
  mainReason: props.chargerDetail?.mainReason ?? '',
  detail: props.chargerDetail?.detail ?? ''
}))

const reasonTypes = ref({
  temperature: false,
  voltage: false,
  current: false
})

const requestReason = ref('')

const faultPercentText = () => {
  const value = Number(safeChargerDetail.value.faultProb7d ?? 0)

  if (Number.isNaN(value)) {
    return '0%'
  }

  return `${Math.round(value * 100)}%`
}

const getBaseReasonText = () => {
  return (
    safeChargerDetail.value.mainReason ||
    safeChargerDetail.value.detail ||
    '점검 필요 징후 감지'
  )
}

const applyDefaultReasonTypes = () => {
  const reason = getBaseReasonText()

  reasonTypes.value = {
    temperature:
      reason.includes('과열') ||
      reason.includes('온도') ||
      reason.includes('고온'),
    voltage:
      reason.includes('전압'),
    current:
      reason.includes('전류') ||
      reason.includes('과전류')
  }
}

const applyDefaultRequestReason = () => {
  const baseReason = getBaseReasonText()

  requestReason.value =
    `7일 내 고장 확률 ${faultPercentText()}\n` +
    `${baseReason}\n` +
    `선제적 점검 권장`
}

watch(
  () => props.visible,
  (opened) => {
    if (opened) {
      applyDefaultReasonTypes()
      applyDefaultRequestReason()
    }
  },
  { immediate: true }
)

watch(
  () => props.chargerDetail,
  () => {
    if (props.visible) {
      applyDefaultReasonTypes()
      applyDefaultRequestReason()
    }
  },
  { deep: true }
)

const handleSubmit = () => {
  emit('submit', {
    chargerId: safeChargerDetail.value.chargerId,
    targetDeptName: '시설관리팀',
    aiStatus: safeChargerDetail.value.aiStatus,
    faultProb7d: safeChargerDetail.value.faultProb7d,
    mainReason: safeChargerDetail.value.mainReason || safeChargerDetail.value.detail || '',
    requestReason: requestReason.value,
    reasonTypes: { ...reasonTypes.value }
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 999;
}

.modal-box {
  width: 100%;
  max-width: 410px;
  height: 700px;
  min-height: auto;
  padding: 28px 22px 22px;
  border-radius: 6px;
  color: #ffffff;
  text-align: center;
  background:
    linear-gradient(180deg, rgba(36, 43, 55, 0.96) 0%, rgba(28, 33, 43, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);

  display: flex;
  flex-direction: column;
}

.modal-icon{
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.modal-icon img {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 34px;
  color: #ffffff;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 25px;
  text-align: left;
}

.form-row.horizontal {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-right: 20px;
}

/* 라벨 고정폭 */
.form-row.horizontal label {
  width: 70px;
  font-size: 15px;
  font-weight: 700;
  color: #e6ebf3;
  flex-shrink: 0;
  margin-left: 20px;
}

.form-row input,
.form-row textarea,
.select-box {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(88, 98, 116, 0.35);
  color: #ffffff;
  font-size: 15px;
  flex: 1;
}


.form-row input,
.select-box {
  height: 40px;
  padding: 0 15px;
}

.type-label{
  margin-left: 20px;
}

.select-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.select-arrow {
  font-size: 14px;
  color: #d2d8e3;
  transform: translateY(-1px);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: nowrap;

  margin-top: 20px;
  margin-left: 20px;
  
}

.check-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  font-size: 14px;
  color: #f1f1f1;
  white-space: nowrap;
  cursor: pointer;
}

.check-item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.check-box {
  width: 18px;
  height: 18px;
  border: 1px solid #2f3540;
  background: #2b313b;   /* 기본 검정/짙은 회색 */
  border-radius: 2px;
  box-sizing: border-box;
  position: relative;
}

.check-item input:checked + .check-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #f2b400;   /* 노란 체크 */
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-row textarea {
  width: 90%;
  height: 95px;
  min-height: 140px;
  resize: none;
  padding: 14px 15px;
  line-height: 1.5;
  color: #f5f7fb;
  font-size: 14px;

  margin-top: 15px;
  margin-left: 15px;
}

.modal-footer {
  margin-top: 25px;
  display: flex;
  gap: 30px;
}

.cancel-button,
.submit-button {
  flex: 1;
  height: 44px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #79add3;
  background: rgba(73, 86, 102, 0.14);
  color: #dce4ee;
  margin-left: 15px;
}

.submit-button {
  border: none;
  background: #93c9eb;
  color: #183041;
  margin-right: 20px;
}
</style>