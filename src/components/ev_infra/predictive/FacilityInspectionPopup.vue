<!-- FacilityInspectionPopup.vue (목록형으로 개조) -->
<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-box facility-popup">
      <div class="modal-icon">
        <img src="@/assets/Request_icon.png" alt="icon" style="filter: hue-rotate(320deg);" />
      </div>
      <div class="modal-title">긴급 점검 요청 목록</div>

      <!-- 요청이 있을 때 -->
      <div v-if="pendingList && pendingList.length > 0" class="modal-body list-body">
        <div class="list-container">
          <div v-for="(item, index) in pendingList" :key="index" class="list-item">
            <div class="item-header">
              <span class="device-id">{{ item.ev_charger_id }}</span>
              <span class="time-badge">{{ formatTime(item.occurred_time) }}</span>
            </div>
            <div class="item-desc">{{ item.detail_content }}</div>
            <button class="btn-check" @click="$emit('confirm', item)">해당 기기 점검하기</button>
          </div>
        </div>
      </div>

      <!-- 요청이 없을 때 (혹시 모를 에러 방지) -->
      <div v-else class="modal-body empty-body">
        현재 대기 중인 점검 요청이 없습니다.
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-button" @click="$emit('close')">
          닫기 (나중에 확인)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  pendingList: { type: Array, default: () => [] } // 배열로 받음!
})

const emit = defineEmits(['close', 'confirm'])

// 시간 포맷팅 함수 (예: 14:30)
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* 기존 스타일은 유지하고 목록용 스타일 추가 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10000;
}

.modal-box {
  width: 100%;
  max-width: 480px;
  padding: 28px 22px 22px;
  border-radius: 6px;
  color: #ffffff;
  text-align: center;
  background: linear-gradient(180deg, rgba(36, 43, 55, 0.96) 0%, rgba(28, 33, 43, 0.96) 100%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-icon img {
  width: 70px;
  height: 70px;
  margin-bottom: 10px;
}

.modal-title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 20px;
}

/* 리스트 컨테이너 (스크롤 가능) */
.list-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.list-body::-webkit-scrollbar {
  width: 6px;
}

.list-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

/* 개별 아이템 디자인 */
.list-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-id {
  font-size: 18px;
  font-weight: 700;
  color: #facc15;
}

.time-badge {
  font-size: 12px;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
}

.item-desc {
  font-size: 14px;
  color: #e5e7eb;
  line-height: 1.4;
  margin-bottom: 12px;
}

/* 점검하기 버튼 */
.btn-check {
  width: 100%;
  padding: 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.btn-check:hover {
  background: #ef4444;
  color: white;
}

.empty-body {
  padding: 40px 0;
  color: #9ca3af;
}

.modal-footer {
  margin-top: 20px;
  display: flex;
}

.cancel-button {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>