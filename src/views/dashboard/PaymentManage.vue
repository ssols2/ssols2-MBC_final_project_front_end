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
.payment-manage-container {
    padding: 10px;
    color: #fff;
}

/* 헤더 레이아웃 수정: 양끝 정렬(space-between) 적용 */
.payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

/* 왼쪽 타이틀과 탭 사이 간격 유지 */
.header-left {
    display: flex;
    align-items: center;
    gap: 30px;
}

.page-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0; /* flex 적용 시 여백 초기화 */
}

.tab-button-group {
    display: flex;
    background: #1e1e2d;
    padding: 4px;
    border-radius: 8px;
}

.tab-btn {
    padding: 8px 16px;
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
    background: #82c2e3;
    color: #000;
}

/* 오른쪽 달력 영역 디자인 */
.relative-box {
    position: relative; /* 팝업이 이 박스를 기준으로 아래에 뜨게 함 */
}

.date-trigger-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #1e1e2d;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #3f3f46;
    color: #a1a1aa;
    cursor: pointer;
    transition: 0.2s;
}

.date-trigger-box:hover {
    border-color: #82c2e3;
    color: #fff;
}

.date-text {
    font-size: 14px;
    font-weight: 600;
    color: #e5edf8;
}

/* ── 부드러운 전환 효과 ── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>