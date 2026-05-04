<template>
    <div class="payment-manage-container">
        <header class="payment-header">
            <div class="header-left">
                <h2 class="page-title">요금 정산 관리</h2>

                <div class="tab-button-group">
                    <button class="tab-btn" :class="{ active: currentTab === 'revenue' }" @click="currentTab = 'revenue'">
                        매출 통계 현황
                    </button>
                    <button class="tab-btn" :class="{ active: currentTab === 'analysis' }" @click="currentTab = 'analysis'">
                        결제 및 할인 분석
                    </button>
                </div>
            </div>

            <div class="header-right relative-box">
                <div class="date-trigger-box" @click="isCalendarOpen = true">
                    <span class="date-text">{{ startDate }} ~ {{ endDate }}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>

                <DatePopup
                    :visible="isCalendarOpen"
                    :start-date="startDate"
                    :end-date="endDate"
                    @close="isCalendarOpen = false"
                    @apply="handleDateApply"
                />
            </div>
        </header>

        <main class="payment-content">
            <transition name="fade" mode="out-in">
                <PaymentRevenueTab 
                    v-if="currentTab === 'revenue'" 
                    :start-date="startDate" 
                    :end-date="endDate" 
                />
                <PaymentAnalysisTab 
                    v-else-if="currentTab === 'analysis'" 
                    :start-date="startDate" 
                    :end-date="endDate" 
                />
            </transition>
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import PaymentRevenueTab from '@/components/payment/PaymentRevenueTab.vue'
import PaymentAnalysisTab from '@/components/payment/PaymentAnalysisTab.vue'
import DatePopup from '@/components/DatePopup.vue' 

// 오늘 날짜 기본 세팅 함수
const getTodayStr = () => new Date().toISOString().split('T')[0]

const currentTab = ref('revenue')

// 달력 제어용 상태 변수들
const isCalendarOpen = ref(false)
const startDate = ref(getTodayStr())
const endDate = ref(getTodayStr())

// 달력 팝업에서 '적용' 버튼 눌렀을 때 실행될 함수
const handleDateApply = (dates) => {
    startDate.value = dates.startDate
    endDate.value = dates.endDate
}
</script>

<style scoped>
/* 1. 전역 컨테이너 레이아웃 */
.payment-manage-container {
    width: 100%;
    overflow-y: auto;       
    overflow-x: hidden;     
    display: flex;
    flex-direction: column;
    background-color: transparent;
    color: #f5f5f5;
}

/* ── 2. 헤더 영역 (타이틀 & 탭 & 달력) ── */
.payment-header {
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

/* ── 오른쪽 달력 영역 ── */
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

/* 달력 아이콘  */
.date-trigger-box svg {
    width: 18px;
    height: 18px;
    color: rgba(245, 245, 245, 0.6); 
    flex-shrink: 0;
}

/* ── 4. 탭 콘텐츠가 들어갈 자리 ── */
.payment-content {
    flex: 1; 
    display: flex;
    flex-direction: column;
}

/* 부드러운 전환 효과 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>