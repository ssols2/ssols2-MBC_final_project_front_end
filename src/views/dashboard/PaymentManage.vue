<template>
    <div class="payment-manage-container">
        <header class="payment-header">
            <h2 class="page-title">요금 정산 관리</h2>

            <div class="tab-button-group">
                <button class="tab-btn" :class="{ active: currentTab === 'revenue' }" @click="currentTab = 'revenue'">
                    매출 통계 현황
                </button>
                <button class="tab-btn" :class="{ active: currentTab === 'analysis' }" @click="currentTab = 'analysis'">
                    결제 및 할인 분석
                </button>
            </div>
        </header>

        <main class="payment-content">
            <transition name="fade" mode="out-in">
                <PaymentRevenueTab v-if="currentTab === 'revenue'" />
                <PaymentAnalysisTab v-else-if="currentTab === 'analysis'" />
            </transition>
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import PaymentRevenueTab from '@/components/payment/PaymentRevenueTab.vue'
import PaymentAnalysisTab from '@/components/payment/PaymentAnalysisTab.vue'

// 기본값은 1번 탭인 '매출 통계 현황'
const currentTab = ref('revenue')
</script>

<style scoped>
.payment-manage-container {
    padding: 10px;
    color: #fff;
}

.payment-header {
    display: flex;
    align-items: center;
    gap: 30px;
    margin-bottom: 25px;
}

.page-title {
    font-size: 24px;
    font-weight: 700;
}

/* ── 탭 버튼 디자인 (설계서 반영) ── */
.tab-button-group {
    display: flex;
    background: #1e1e2d;
    /* 버튼 배경색 */
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
    /* 포인트 블루 */
    color: #000;
    /* 활성화 시 글자색 반전 */
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