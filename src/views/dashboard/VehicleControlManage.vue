<template>
  <div class="vehicle-control-container">
    <header class="page-header">
      <!-- 왼쪽: 타이틀과 탭을 하나로 묶음 -->
      <div class="header-left">
        <h2 class="page-title">출입 차량 관제</h2>

        <div class="tab-button-group">
          <button class="tab-btn" :class="{ active: currentTab === 'log' }" @click="currentTab = 'log'">
            입출차 로그
          </button>
          <button class="tab-btn" :class="{ active: currentTab === 'prediction' }" @click="currentTab = 'prediction'">
            주차 예측 통계
          </button>
        </div>
      </div>

      <!-- 오른쪽: 달력 영역 -->
      <div class="header-right relative-box" v-if="currentTab === 'log'">
        <div class="date-trigger-box" @click="isCalendarOpen = true">
          <span class="date-text">{{ startDate }} ~ {{ endDate }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>

        <DatePopup :visible="isCalendarOpen" :start-date="startDate" :end-date="endDate" @close="isCalendarOpen = false"
          @apply="handleDateApply" />
      </div>
    </header>

    <main class="control-content">
      <transition name="fade" mode="out-in">
        <VehicleLog v-if="currentTab === 'log'" :start-date="startDate" :end-date="endDate" />
        <VehiclePrediction v-else-if="currentTab === 'prediction'" :start-date="startDate" :end-date="endDate" />
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VehicleLog from '@/components/VehicleControl/VehicleLog.vue'
import VehiclePrediction from '@/components/VehicleControl/VehiclePrediction.vue'
import DatePopup from '@/components/DatePopup.vue'

// 오늘 날짜 기본 세팅 함수
const getTodayStr = () => new Date().toISOString().split('T')[0]

// 달력 제어용 상태 변수들
const isCalendarOpen = ref(false)
const startDate = ref(getTodayStr())
const endDate = ref(getTodayStr())

// 달력 팝업에서 '적용' 버튼 눌렀을 때 실행될 함수
const handleDateApply = (dates) => {
  startDate.value = dates.startDate
  endDate.value = dates.endDate
}

// 기본값: 실시간 출입 기록
const currentTab = ref('log')
</script>

<style scoped>
/* 1. 전체 컨테이너 레이아웃 */
.vehicle-control-container {
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
  border-left: 5px solid #82c2e3;
  padding-left: 17px;
}

/* 왼쪽 그룹 (타이틀 + 탭) */
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
  letter-spacing: -0.5px;
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

.tab-btn:hover:not(.active) {
  color: #82c2e3;
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

.date-trigger-box svg {
  width: 18px;
  height: 18px;
  color: rgba(245, 245, 245, 0.6);
  flex-shrink: 0;
}

/* ── 4. 콘텐츠 영역 ── */
.control-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 전환 효과 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>