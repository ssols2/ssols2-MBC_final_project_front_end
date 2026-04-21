<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-box">
      <div class="warning-icon">⚠️</div>

      <div class="modal-content">
        <h3>
          {{ safeChargerDetail.chargerId }} 기기를<br />
          <span class="danger-text">강제 종료</span> 하시겠습니까?
        </h3>

        <p>
          진행 중인 충전이 즉시 중단되며,<br />
          복구할 수 없습니다.
        </p>

        <div class="status-info">
          활성 충전 세션: 123개 4568, 약 40분 남음
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-button" @click="$emit('close')">
          취소
        </button>

        <button type="button" class="danger-button" @click="handleConfirm">
          강제 종료
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

const emit = defineEmits(['close', 'confirm'])

const safeChargerDetail = computed(() => ({
  chargerId: props.chargerDetail?.chargerId ?? ''
}))

const handleConfirm = () => {
  emit('confirm', {
    chargerId: safeChargerDetail.value.chargerId,
    commandType: 'POWER_OFF',
    confirmedTwice: true
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.65);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-box {
  width: 100%;
  max-width: 400px;        /* 🔥 가로 줄임 */
  min-height: 550px;       /* 🔥 세로 늘림 */
  background: #1f1f1f;
  color: white;
  padding: 36px 28px 28px;
  border-radius: 9px;
  text-align: center;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 아이콘 */
.warning-icon {
  font-size: 100px;
  margin-bottom: 24px; /* 🔥 간격 늘림 */
}

/* 컨텐츠 전체 */
.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 제목 */
.modal-content h3 {
  font-size: 24px;          /* 🔥 살짝 키움 */
  font-weight: 800;
  line-height: 1.6;
  margin-bottom: 16px;      /* 🔥 아래 간격 추가 */
}

/* 강조 텍스트 */
.danger-text {
  color: #ff3b3b;
  font-weight: 900;
}

/* 설명 */
.modal-content p {
  font-size: 15px;
  line-height: 1.7;
  color: #cfcfcf;
  margin-bottom: 20px;      /* 🔥 분리 */
}

/* 하단 상태 */
.status-info {
  font-size: 16px;
  color: #9a9a9a;
  margin-top: 10px;
  line-height: 1.5;
}

/* 버튼 영역 */
.modal-footer {
  margin-top: 40px;         /* 🔥 아래로 더 내림 */
  display: flex;
  gap: 12px;
}

/* 공통 버튼 */
.modal-footer button {
  flex: 1;
  height: 48px;            /* 🔥 높이 증가 */
  border-radius: 5px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

/* 취소 */
.cancel-button {
  background: #3a3a3a;
  color: #ddd;
}

/* 강제 종료 */
.danger-button {
  background: #ff3b3b;
  color: white;
}
</style>