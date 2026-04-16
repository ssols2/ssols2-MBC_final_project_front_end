<template>
    <div class="kiosk-main-wrapper">

        <div class="ev-type-tabs" v-if="viewMode === 'idle'">
            <button :class="['type-btn', { active: chargerType === 'FAST' }]" @click="chargerType = 'FAST'">
                <svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                급속 충전기
            </button>
            <button :class="['type-btn', { active: chargerType === 'SLOW' }]" @click="chargerType = 'SLOW'">
                <svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                    <line x1="22" y1="11" x2="22" y2="13"></line>
                </svg>
                완속 충전기
            </button>
        </div>

        <div v-if="viewMode === 'idle'" class="screen-container screen-idle" @click="viewMode = 'scan'">
            <div class="center-content">
                <div class="logo-box">
                    <img class="main-logo-img" src="@/assets/txtlogo2.png" alt="S-HOSPITAL" />
                </div>
                <div class="touch-guidance pulse-animation">
                    <h2 class="touch-main-msg">EV CHARGING SYSTEM</h2>
                    <p class="touch-sub-msg">
                        화면을 터치하여 <span class="blue-txt">{{ chargerType === 'FAST' ? '급속' : '완속' }}</span> 충전을 시작합니다
                    </p>
                </div>
            </div>
        </div>

        <div v-else-if="viewMode === 'scan'" class="screen-container screen-scan">
            <h2 class="step-title">차량 번호판 인식</h2>
            <div class="manual-input-box">
                <p class="step-desc mb-20">정확한 요금 정산 및 출차 연동을 위해<br />차량의 번호판이 잘 보이도록 촬영해 주세요</p>

                <div class="upload-section mt-40 mb-40">
                    <label for="fileInput" class="professional-btn upload-btn">
                        <svg viewBox="0 0 24 24" class="svg-icon" width="24" height="24">
                            <path fill="currentColor"
                                d="M4,4H7L9,2H15L17,4H20A2,2,0,0,1,22,6V18A2,2,0,0,1,20,20H4A2,2,0,0,1,2,18V6A2,2,0,0,1,4,4M12,7A5,5,0,1,0,17,12A5,5,0,0,0,12,7M12,9A3,3,0,1,1,9,12A3,3,0,0,1,12,9Z" />
                        </svg>
                        차량 사진 선택하기
                    </label>
                    <input type="file" id="fileInput" @change="handleFileUpload" accept="image/*" hidden />
                </div>

                <div class="bottom-btn-area mt-40">
                    <button class="btn-cancel" @click="viewMode = 'idle'">처음으로</button>
                </div>
            </div>
        </div>

        <div v-else-if="viewMode === 'scan_fail'" class="screen-container screen-error">
            <div class="center-content">
                <h2 class="step-title error-title pulse-animation">인식 결과 없음</h2>
                <p class="step-desc mt-20">
                    번호판 인식을 실패했거나 입차 기록을 찾을 수 없습니다<br />
                    아래 방법 중 하나를 선택해 주세요
                </p>

                <div class="action-buttons mt-40">
                    <button class="btn-confirm btn-large full-width-btn" @click="viewMode = 'scan'">
                        다시 촬영하기
                    </button>
                    <button class="btn-cancel full-width-btn mt-15" @click="viewMode = 'manual-search'">
                        차량 번호 직접 입력하기
                    </button>
                </div>

                <div class="bottom-btn-area mt-30">
                    <button class="btn-text-link" @click="viewMode = 'idle'">초기 화면으로</button>
                </div>
            </div>
        </div>

        <div v-else-if="viewMode === 'manual-search'" class="screen-container screen-search">
            <h2 class="step-title">차량 번호 직접 입력</h2>
            <p class="step-desc">차량 번호 뒷자리 4자리를 입력해 주세요</p>
            <div class="search-input-area mt-30">
                <input type="text" class="plate-input" v-model="searchQuery" maxlength="4" placeholder="예) 1234" />
                <button class="btn-confirm" @click="executeManualSearch">조회</button>
            </div>

            <div v-if="hasSearched" class="search-result-area mt-30">
                <h3 v-if="searchResultList.length > 0" class="mb-20">해당하는 차량을 선택해 주세요</h3>
                <div class="result-scroll-box">
                    <div v-for="(car, index) in searchResultList" :key="index" @click="selectVehicleManually(car)"
                        class="car-result-card">
                        <h2 class="bold-blue">{{ car.vehicle_num }}</h2>
                        <p class="entry-time-txt">입차: {{ car.entry_time }}</p>
                    </div>
                </div>
                <div v-if="searchResultList.length === 0" class="no-result mt-20 pulse-animation">
                    <p class="error-txt">검색 결과가 없습니다</p>
                    <p class="guide-txt">화면 하단의 <span>[호출 버튼]</span>을 눌러 관리자에게 문의해 주세요</p>
                </div>
            </div>

            <div class="bottom-btn-area mt-40">
                <button class="btn-cancel" @click="viewMode = 'scan_fail'">이전</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'loading'" class="screen-container screen-loading">
            <div class="spinner"></div>
            <h2 class="step-title mt-20">번호판 인식 중...</h2>
            <p class="guide-text mt-10">잠시만 기다려 주십시오</p>
        </div>

        <div v-else-if="viewMode === 'status'" class="screen-container screen-status">
            <h2 class="step-title">차량 정보 확인</h2>

            <div class="info-card">
                <div class="info-row">
                    <span>인식된 차량번호</span>
                    <h3 class="bold-blue">{{ vehicleNum }}</h3>
                </div>
                <hr class="dash-line" />
                <div class="info-row">
                    <span>현재 배터리 잔여량</span>
                    <h3 class="battery-txt">{{ currentBattery }}%</h3>
                </div>
            </div>

            <h3 class="check-msg mt-30">해당 차량이 맞습니까?</h3>
            <div class="bottom-btn-area">
                <button class="btn-cancel" @click="viewMode = 'scan'">아니오 (다시 인식)</button>
                <button class="btn-confirm" @click="viewMode = 'input_amount'">예</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'select_charger'" class="screen-container screen-select-charger">
            <h2 class="step-title">충전기 위치 선택</h2>
            <p class="step-desc mb-20">차량을 주차하신 층과 충전기 번호를 선택해 주세요</p>

            <div class="floor-tabs mt-20 mb-20">
                <button v-for="floor in 5" :key="floor" @click="selectedFloor = floor"
                    :class="['floor-btn', { active: selectedFloor === floor }]">
                    {{ floor }}층
                </button>
            </div>

            <div class="spot-grid mt-20 mb-30">
                <button v-for="spot in 3" :key="spot" @click="selectedChargerId = `${selectedFloor}F-0${spot}`"
                    :class="['spot-btn', { active: selectedChargerId === `${selectedFloor}F-0${spot}` }]">
                    {{ selectedFloor }}F-0{{ spot }}
                </button>
            </div>

            <div class="selection-status mt-30">
                <h3 v-if="selectedChargerId" class="bold-blue">선택된 위치: [ {{ selectedChargerId }} ]</h3>
                <p v-else class="empty-status">주차하신 충전기 번호를 눌러주세요</p>
            </div>

            <div class="bottom-btn-area mt-40">
                <button class="btn-cancel" @click="viewMode = 'status'">이전</button>
                <button class="btn-confirm btn-large" :disabled="!selectedChargerId"
                    @click="viewMode = 'input_amount'">충전 금액 설정</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'input_amount'" class="screen-container screen-input">
            <h2 class="step-title">충전 금액 입력</h2>
            <div class="flex-layout">
                <div class="left-info-section">
                    <div class="input-display-box">
                        <p>결제 금액 (원)</p>
                        <div class="amount-display">{{ inputAmount.toLocaleString() }} 원</div>
                    </div>
                    <div class="calc-info-box mt-20">
                        <div class="calc-row"><span>선택 기기</span><strong>{{ selectedChargerId }} ({{ chargerType ===
                            'FAST' ? '급속' : '완속' }})</strong></div>
                        <div class="calc-row highlight-row"><span>예상 충전량</span><strong>{{ expectedKwh.toFixed(2) }}
                                kWh</strong></div>
                    </div>
                </div>
                <div class="right-numpad-section">
                    <div class="numpad-grid">
                        <button v-for="n in 9" :key="n" @click="appendNumber(n)">{{ n }}</button>
                        <button class="btn-clear" @click="clearNumber">지움</button>
                        <button @click="appendNumber(0)">0</button>
                        <button @click="appendDoubleZero">00</button>
                    </div>
                </div>
            </div>
            <div class="bottom-btn-area">
                <button class="btn-cancel" @click="viewMode = 'select_charger'">이전</button>
                <button class="btn-confirm btn-large" :disabled="inputAmount === 0" @click="startCharging">충전
                    시작하기</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'charging'" class="screen-container screen-charging">
            <h2 class="step-title pulse-animation flex-center-align">
                <svg class="icon-svg mr-10" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"
                    stroke="none">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                충전이 진행 중입니다
                <svg class="icon-svg ml-10" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"
                    stroke="none">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
            </h2>

            <div class="charging-visual-area">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: chargingProgress + '%' }"></div>
                </div>
                <h1 class="progress-percent">{{ chargingProgress.toFixed(1) }}%</h1>
            </div>

            <div class="charging-details mt-30">
                <div class="detail-col">
                    <span>충전량</span>
                    <strong>{{ currentChargedKwh.toFixed(2) }} kWh</strong>
                </div>
                <div class="detail-col">
                    <span>소요 시간</span>
                    <strong class="blue-txt">{{ elapsedMinutes }} 분</strong>
                </div>
            </div>

            <div class="bottom-btn-area mt-40">
                <button class="btn-stop-charging" @click="stopCharging">충전 중지 (결제하기)</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'complete'" class="screen-container screen-complete">
            <h2 class="step-title">충전 및 결제가 완료되었습니다</h2>

            <div class="receipt-card mt-30">
                <h3>S-HOSPITAL EV CHARGE</h3>
                <hr />
                <div class="r-row"><span>차량 번호</span>
                    <p>{{ vehicleNum }}</p>
                </div>
                <div class="r-row"><span>충전량</span>
                    <p>{{ finalChargedKwh.toFixed(2) }} kWh</p>
                </div>
                <div class="r-row"><span>소요 시간</span>
                    <p>{{ elapsedMinutes }} 분</p>
                </div>
                <hr class="dash-line" />
                <div class="r-row total-amount">
                    <span>최종 결제 금액</span>
                    <p>{{ finalAmount.toLocaleString() }} 원</p>
                </div>
                <p class="receipt-notice mt-10">* 해당 금액은 출차 시 합산되어 정산됩니다</p>
            </div>

            <div class="bottom-btn-area mt-30">
                <button class="btn-confirm btn-large" @click="viewMode = 'goodbye'">확인</button>
            </div>
        </div>

        <div v-else-if="viewMode === 'goodbye'" class="screen-container screen-bye">
            <div class="center-content">
                <h1 class="bye-msg">이용해 주셔서 감사합니다</h1>
                <p class="bye-sub mt-20">안전 운전 하세요!</p>
                <p class="auto-return-msg mt-40">잠시 후 대기 화면으로 이동합니다...</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { scanEvPlateReq, startEvChargeReq, stopEvChargeReq, searchManualPlateReq } from '@/api/ev/charge.js'

// ==========================================
// 1. 상태 및 기본 데이터
// ==========================================
const viewMode = ref('idle')
const chargerType = ref('FAST') // 템플릿과 맞춤 (RAPID=FAST, SLOW=SLOW)
const vehicleNum = ref('')
const currentBattery = ref(0)

const selectedFloor = ref(1)
const selectedChargerId = ref('')

const EV_PRICE_SLOW = 180
const EV_PRICE_FAST = 324
const CHARGER_OUTPUT = { SLOW: 7, FAST: 50 }

// ==========================================
// 2. 수동 검색 로직 (스캔 실패 시 대안)
// ==========================================
const searchQuery = ref('')
const searchResultList = ref([])
const hasSearched = ref(false)

const executeManualSearch = async () => {
    // 1. 4자리 검증
    if (searchQuery.value.length !== 4) {
        alert('차량 번호 4자리를 정확히 입력해 주세요.')
        return
    }

    // 2. 로딩 화면 띄우기 (검색하는 동안 스피너)
    viewMode.value = 'loading'

    try {
        // 3. 4자리 번호 검색 요청
        const response = await searchManualPlateReq({ last_four_digits: searchQuery.value })
        
        // 검색 완료되면 다시 수동 검색 화면으로 돌아오기
        viewMode.value = 'manual-search'
        hasSearched.value = true

        // 4. 결과가 있으면 리스트에 담기, 없으면 빈 배열
        if (response.data.is_success && response.data.car_list && response.data.car_list.length > 0) {
            searchResultList.value = response.data.car_list 
        } else {
            searchResultList.value = [] // 검색 결과 없음 화면이 뜨게 됨
        }

    } catch (error) {
        console.error("수동 검색 API 연결 에러:", error)
        alert("차량 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
        
        // 에러 나도 화면은 유지
        viewMode.value = 'manual-search'
        hasSearched.value = true
        searchResultList.value = []
    }
}

// ==========================================
// 3. 금액 입력 및 키패드 로직
// ==========================================
const inputAmount = ref(0)
const MAX_AMOUNT = 100000

const appendNumber = (num) => {
    const newAmount = Number(inputAmount.value.toString() + num.toString())
    if (newAmount <= MAX_AMOUNT) inputAmount.value = newAmount
    else alert(`최대 ${MAX_AMOUNT.toLocaleString()}원까지만 입력 가능합니다`)
}
const appendDoubleZero = () => {
    const newAmount = Number(inputAmount.value.toString() + '00')
    if (newAmount <= MAX_AMOUNT) inputAmount.value = newAmount
    else alert(`최대 ${MAX_AMOUNT.toLocaleString()}원까지만 입력 가능합니다`)
}
const clearNumber = () => { inputAmount.value = 0 }

// ==========================================
// 4. 파이썬 동기화: 금액 -> 시간 역산 로직
// ==========================================
// 현재 선택된 충전기의 단가 및 출력량
const unitPrice = computed(() => chargerType.value === 'FAST' ? EV_PRICE_FAST : EV_PRICE_SLOW)
const outputKw = computed(() => chargerType.value === 'FAST' ? CHARGER_OUTPUT.FAST : CHARGER_OUTPUT.SLOW)

// [파이썬 로직] target_kwh = target_amount / unit_price
const expectedKwh = computed(() => {
    return inputAmount.value > 0 ? (inputAmount.value / unitPrice.value) : 0
})

// [파이썬 로직] duration_hours = target_kwh / output_kw -> (프론트는 분 단위로 표시하기 위해 * 60)
const expectedTotalMinutes = computed(() => {
    if (expectedKwh.value === 0) return 0
    return Math.ceil((expectedKwh.value / outputKw.value) * 60)
})

// ==========================================
// 5. 번호판 인식 API 연동 
// ==========================================
const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    viewMode.value = 'loading' // 스피너 시작

    try {
        const response = await scanEvPlateReq(file)
        const data = response.data

        // 출차 때처럼 입차 기록이 없을 경우를 대비한 방어 로직
        if (data.is_success === false) {
            alert(data.message || '입차 기록을 찾을 수 없습니다.')
            viewMode.value = 'scan_fail'
            return
        }

        // 파이썬(자바 경유)이 응답한 데이터 화면에 꽂아주기
        vehicleNum.value = data.vehicle_num
        currentBattery.value = Math.floor(Math.random() * 40) + 10

        viewMode.value = 'status' // 차량 정보 확인 화면으로 이동

    } catch (error) {
        console.error("EV 번호판 인식 실패:", error)
        alert("번호판 인식에 실패했습니다. 다른 사진을 업로드해 주세요.")
        viewMode.value = 'scan_fail'
    }
}

// ==========================================
// 6. 충전 시작 및 API 연동 (파이썬 /start 호출)
// ==========================================
const chargingProgress = ref(0)     // 화면 게이지 수치
const currentChargedKwh = ref(0)
const elapsedMinutes = ref(0)       // 가짜 경과 시간

const finalChargedKwh = ref(0)
const finalAmount = ref(0)
let chargingTimer = null

// 서버가 발급해 줄 충전 세션 고유 번호를 저장할 변수
const currentEvLogId = ref(null)

const startCharging = async () => {
    if (inputAmount.value < 1000) {
        alert("최소 충전 금액은 1,000원입니다")
        return
    }

    // 파이썬 서버에 [충전 시작] 요청 쏘기
    try {
        const startRequestData = {
            vehicle_num: vehicleNum.value,
            ev_charger_id: selectedChargerId.value, // 프론트가 선택한 기기 ID
            charger_type: chargerType.value,        // FAST or SLOW
            initial_fee: inputAmount.value,
            expected_kwh: parseFloat(expectedKwh.value.toFixed(2)),
            expected_minutes: expectedTotalMinutes.value
        }

        const response = await startEvChargeReq(startRequestData)
        if (response.data.is_success) {
            // 서버가 준 충전 고유 번호 저장 (나중에 중단할 때 써야 함)
            currentEvLogId.value = response.data.ev_log_id 
        } else {
            alert("서버 오류로 충전을 시작할 수 없습니다.")
            return
        }
    } catch (error) {
        console.error("충전 시작 API 에러:", error)
        alert("서버 연결에 실패했습니다.")
        return
    }

    viewMode.value = 'charging'
    chargingProgress.value = 0
    elapsedMinutes.value = 0
    currentChargedKwh.value = 0

    // 시연용 타이머: 10초 만에 완료되도록 시뮬레이션
    chargingTimer = setInterval(() => {
        chargingProgress.value += 1

        // 퍼센트에 맞춰서 가짜 '소요 시간(분)'을 올림
        const progressRatio = chargingProgress.value / 100
        elapsedMinutes.value = Math.floor(expectedTotalMinutes.value * progressRatio)

        // [파이썬 로직] 충전 중 실시간 전력량: (사용한 분 / 60) * 기기 출력량
        currentChargedKwh.value = (elapsedMinutes.value / 60) * outputKw.value

        if (chargingProgress.value >= 100) stopCharging()
    }, 100)
}

// ==========================================
// 7. 충전 중지 및 API 연동 (파이썬 /stop 호출)
// ==========================================
const stopCharging = async () => {
    if (chargingTimer) clearInterval(chargingTimer)

    // [파이썬 로직] 강제 중지 시, 진행된 분(minutes)을 기준으로 최종 데이터 역산
    const actualKwh = (elapsedMinutes.value / 60) * outputKw.value
    finalChargedKwh.value = actualKwh
    finalAmount.value = Math.floor(actualKwh * unitPrice.value)

    // 파이썬 서버에 [충전 종료] 요청 쏘기
    try {
        const stopRequestData = {
            ev_log_id: currentEvLogId.value,
            actual_kwh: parseFloat(finalChargedKwh.value.toFixed(2)),
            final_fee: finalAmount.value
        }
        
        await stopEvChargeReq(stopRequestData)
        console.log("충전 종료 처리 및 요금 정산 완료!")
        
    } catch (error) {
        console.error("충전 종료 API 에러:", error)
        alert("충전 종료 처리 중 문제가 발생했습니다. 관리자에게 문의하세요.")
    }

    viewMode.value = 'complete'
}

onUnmounted(() => {
    if (chargingTimer) clearInterval(chargingTimer)
})
</script>

<style scope>
.kiosk-main-wrapper {
    font-family: 'Pretendard', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    background: linear-gradient(135deg, var(--bg-light) 0%, #e0eafc 100%);
    overflow: hidden;
}
</style>