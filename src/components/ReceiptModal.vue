<template>
    <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
        <div class="receipt-modal-card">
            <header class="receipt-header">
                <h2 v-if="step !== 3">주차 정산 영수증 조회</h2>
                <div v-if="step !== 3" class="title-bar"></div>
                <button class="close-icon-btn" @click="closeModal">✕</button>
            </header>

            <div class="receipt-content">
                <div v-if="step === 1" class="step-wrap">
                    <p class="step-guide">조회하실 차량번호 <strong>뒤 4자리</strong>를 입력해 주세요</p>
                    <div class="search-box">
                        <input type="text" v-model="searchQuery" placeholder="예) 1234" maxlength="4" class="res-input"
                            @keyup.enter="handleSearch" />
                        <button class="btn-primary" @click="handleSearch">검색하기</button>
                    </div>
                </div>

                <div v-if="step === 2" class="step-wrap">
                    <p class="step-guide"><strong>'{{ searchQuery }}'</strong> 차량의 최근 결제 내역입니다</p>
                    <div class="history-list">
                        <div v-for="item in receiptList" :key="item.id" class="history-item" @click="openReceipt(item)">
                            <div class="item-info">
                                <span class="item-car-num">{{ item.maskedNum }}</span>
                                <span class="item-date">{{ item.date }}</span>
                            </div>
                            <div class="item-status">
                                <span class="status-complete">결제완료</span>
                                <span class="arrow">〉</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn-back" @click="step = 1">이전으로</button>
                </div>

                <div v-if="step === 3" class="step-wrap">
                    <div class="official-receipt">
                        <div class="receipt-top">
                            <img src="@/assets/txtlogo2.png" alt="logo" class="receipt-logo" />
                            <p class="receipt-type">[주차요금 납부 확인서]</p>
                        </div>

                        <div class="receipt-table">
                            <div class="r-row"><span>차량번호</span><strong>{{ selectedReceipt.maskedNum }}</strong></div>
                            <div class="r-row"><span>입차시간</span><span>{{ selectedReceipt.entryTime }}</span></div>
                            <div class="r-row"><span>출차시간</span><span>{{ selectedReceipt.exitTime }}</span></div>
                            <div class="line"></div>
                            <div class="r-row"><span>총 주차요금</span><span>{{ selectedReceipt.parkingFee?.toLocaleString()
                                    }}원</span></div>
                            <div class="r-row"><span>전기차 충전요금</span><span>{{
                                selectedReceipt.evChargingFee?.toLocaleString() }}원</span></div>
                            <div class="r-row discount"><span>할인 내역</span><span>-{{
                                selectedReceipt.discountAmount?.toLocaleString() }}원</span></div>
                            <!-- <div class="line"></div> -->
                            <div class="r-row total"><span>실 결제금액</span><span class="blue-txt">{{
                                selectedReceipt.amount?.toLocaleString() }}원</span></div>
                        </div>

                        <div class="receipt-footer">
                            <p class="footer-guide">위 금액을 정히 영수함</p>
                            <p class="date">{{ selectedReceipt.date }}</p>
                        
                            <div class="signature-box">
                                <div class="sign-txt">
                                    <span class="pos">서울에스병원 병원장</span>
                                    <span class="name-sign">김 에 스</span>
                                </div>
                                <div class="stamp">印</div>
                            </div>
                        </div>    
                    </div>
                    <button class="btn-primary full" @click="step = 1">다른 영수증 조회</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { getReceiptsByVehicleReq } from '@/api/payment/receipt.js'

const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close'])

const step = ref(1)
const searchQuery = ref('')
const selectedReceipt = ref(null)

const receiptList = ref([])

const handleSearch = async () => {
    if (searchQuery.value.length < 4) { alert('4자리를 입력해주세요'); return }

    try {
        const res = await getReceiptsByVehicleReq(searchQuery.value)
        receiptList.value = res.data
        step.value = 2
    } catch (error) {
        console.error('조회 실패:', error)
        alert('조회 중 오류가 발생했습니다')
    }
}

const openReceipt = (item) => {
    selectedReceipt.value = item
    step.value = 3
}

const closeModal = () => {
    step.value = 1
    searchQuery.value = ''
    emit('close')
}
</script>

<style scoped>
/* 모달 전체 배경 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    /* 배경 살짝 더 어둡게 */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(4px);
    /* 배경 흐림 효과 추가 */
}

/* 모달 카드 기본 뼈대 */
.receipt-modal-card {
    background: #fff;
    width: 500px;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
}

/* 헤더 영역 */
.receipt-header {
    text-align: center;
    /* 텍스트를 중앙으로 */
    position: relative;
    /* 닫기 버튼 위치 고정용 */
}

.receipt-header h2 {
    font-size: 26px;
    color: #111;
    margin-bottom: 18px;
    font-weight: 800;
}

.title-bar {
    width: 45px;
    height: 4px;
    background: #005baa;
    margin: 0 auto 25px auto;
    border-radius: 2px;
}

.close-icon-btn {
    position: absolute;
    top: -25px;
    right: -10px;
    border: none;
    background: none;
    font-size: 28px;
    cursor: pointer;
    color: #bbb;
    transition: color 0.2s;
}

.close-icon-btn:hover {
    color: #333;
}

/* Step 1 & 2: 검색 및 목록 스타일 */
.step-guide {
    font-size: 18px;
    color: #555;
    margin-bottom: 18px;
    text-align: center;
    line-height: 1.5;
}

.res-input {
    width: 100%;
    padding: 18px;
    border: 2px solid #eee;
    background: #f8f9fa;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 20px;
    outline: none;
    border-radius: 12px;
    transition: all 0.2s;
}

.res-input:focus {
    border-color: #005baa;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(0, 91, 170, 0.1);
}

.btn-primary {
    width: 100%;
    padding: 18px;
    background: #005baa;
    color: #fff;
    border: none;
    font-weight: 800;
    font-size: 18px;
    cursor: pointer;
    border-radius: 10px;
    transition: background 0.2s;
    margin-top: 17px;
}

.btn-primary:hover {
    background: #004a8a;
}

/* 검색 결과 목록 */
.history-list {
    border: 1px solid #eee;
    border-radius: 10px;
    margin-bottom: 18px;
    max-height: 300px;
    overflow-y: auto;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.2s;
}

.history-item:last-child {
    border-bottom: none;
}

.history-item:hover {
    background: #f0f7ff;
}

.item-car-num {
    display: block;
    font-size: 19px;
    font-weight: 800;
    color: #005baa;
    margin-bottom: 4px;
}

.item-date {
    font-size: 15px;
    color: #888;
    font-weight: 500;
}

/* Step 3: 병원 공식 영수증 스타일 (하이라이트) */
.official-receipt {
    border: 1px solid #333;
    padding: 20px 30px;
    background: #fff;
    font-family: 'Pretendard', sans-serif;
}

/* 영수증 상단 로고 & 타이틀 */
.receipt-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.receipt-logo {
    height: 50px;
    width: auto;
    margin: 5px 0 25px 0;
    /* 기존 마진 제거 */
    /* filter: grayscale(1);
    opacity: 0.8; */
}

.receipt-type {
    font-size: 22px;
    font-weight: 900;
    color: #222;
    border-bottom: 3px double #222;
    display: inline-block;
    padding-bottom: 5px;
    letter-spacing: -0.5px;
    margin: 0 0 35px 0;
}

/* 영수증 내용 테이블 */
.receipt-table {
    margin-bottom: 15px;
}

.receipt-table .r-row.total {
    font-size: 22px;
    font-weight: 900;
    border-top: 2px solid #222;
    padding-top: 15px;
    margin-top: 10px;
    border-bottom: none;
}

.receipt-table .r-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    font-size: 16px;
    color: #333;
}

.receipt-table .r-row span:first-child {
    font-weight: 600;
    color: #666;
}

.receipt-table .r-row strong,
.receipt-table .r-row span:last-child {
    font-weight: 700;
}

.receipt-table .r-row.discount {
    color: #dc3545;
}

.receipt-table .r-row.total {
    font-size: 22px;
    font-weight: 900;
    border-top: 1px solid #333;
    padding-top: 20px;
    margin-top: 10px;
}

.blue-txt {
    color: #005baa;
}

.line {
    border-top: 1px dashed #ccc;
    margin: 20px 0;
}

/* 영수증 하단 푸터 */
.receipt-footer {
    display: flex;           
    flex-direction: column;
    align-items: center;    
    text-align: center;
    border-top: 1px solid #eee;
    padding-top: 25px;
    color: #444;
    width: 100%;           
}

.footer-guide {
    font-size: 15px;     
    font-weight: 500;
    color: #666;
    margin-bottom: 4px;  
}

.receipt-footer .date {
    font-size: 19px;       
    font-weight: 700;
    color: #333;
    margin-bottom: 0;        
}

/* 도장 스타일 반영 */
.signature-box {
    position: relative;     
    display: flex;          
    flex-direction: column;  
    align-items: center;   
    margin-top: 25px;       
    width: fit-content;     
}

.sign-txt {
    text-align: center;
}

.sign-txt .pos {
    display: block;
    font-size: 14px;
    color: #888;
    margin-bottom: 2px;
}

.sign-txt .name-sign {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 4px;
    color: #1a1a1a;
}

.stamp {
    position: absolute;     
    right: -28px;              
    bottom: -5px;            
    width: 48px;
    height: 48px;
    border: 2px solid #dc3545;
    color: #dc3545;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 22px;
    border-radius: 50%;
    transform: rotate(15deg); 
    background-color: rgba(255, 255, 255, 0.6); 
    z-index: 1;             
    pointer-events: none;  
}

/* 버튼 유틸리티 */
.btn-back {
    background: none;
    border: none;
    color: #999;
    text-decoration: none;
    width: 100%;
    margin-top: 15px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
}

.btn-back:hover {
    color: #666;
    text-decoration: underline;
}
</style>