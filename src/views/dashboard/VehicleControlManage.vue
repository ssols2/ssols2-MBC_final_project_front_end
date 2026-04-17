<template>
  <div class="vehicle-control-container">
    <header class="page-header">
      <h2 class="page-title">출입 차량 관제</h2>
      
      <div class="tab-button-group">
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'log' }"
          @click="currentTab = 'log'"
        >
          입출차 로그
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'prediction' }"
          @click="currentTab = 'prediction'"
        >
          주차 예측 통계
        </button>
      </div>
    </header>

    <main class="control-content">
      <transition name="fade" mode="out-in">
        <VehicleLog v-if="currentTab === 'log'" />
        <VehiclePrediction v-else-if="currentTab === 'prediction'" />
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VehicleLog from '@/components/VehicleControl/VehicleLog.vue'
import VehiclePrediction from '@/components/VehicleControl/VehiclePrediction.vue'

// 기본값: 실시간 출입 기록
const currentTab = ref('log')
</script>

<style scoped>
.vehicle-control-container { padding: 10px; color: #fff; }

.page-header {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 25px;
}

.page-title { font-size: 24px; font-weight: 700; }

/* ── 탭 버튼 디자인 (공통 UI 가이드 반영) ── */
.tab-button-group {
  display: flex;
  background: #1e1e2d;
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: none;
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: 0.3s;
}

.tab-btn.active {
  background: #82c2e3; /* 포인트 블루 */
  color: #000;
}

/* 전환 애니메이션 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>