<template>
    <div class="kiosk-main-wrapper">

        <!-- 조회 결과 X -> 팝업 -->
        <div v-if="isAlertOpen" class="custom-alert-overlay">
            <div class="custom-alert-box bounce-animation">
                <svg viewBox="0 0 24 24" class="alert-icon">
                    <path fill="currentColor" d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" />
                </svg>
                <h2 class="alert-msg">{{ alertMsg }}</h2>
                <button class="professional-btn alert-btn" @click="closeAlert">{{ t.btnConfirm }}</button>
            </div>
        </div>

        <!-- 대기화면 -->
        <div class="ev-type-tabs" v-if="viewMode === 'idle'">
            <button :class="['type-btn', { active: chargerType === 'FAST' }]" @click="chargerType = 'FAST'">
                <svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                {{ t.fastBtn }}
            </button>
            <button :class="['type-btn', { active: chargerType === 'SLOW' }]" @click="chargerType = 'SLOW'">
                <svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                    <line x1="22" y1="11" x2="22" y2="13"></line>
                </svg>
                {{ t.slowBtn }}
            </button>
        </div>

        <div class="demo-controller" v-if="viewMode === 'idle' || viewMode === 'error'">
            <span class="demo-label">현재 시연 기기:</span>
            <select v-model="selectedChargerId" class="demo-select" @change="checkChargerStatus">
                <optgroup v-for="floor in 5" :key="'group-' + floor" :label="`${floor}F`">
                    <option v-for="spot in 3" :key="`spot-${floor}-${spot}`"
                        :value="`${floor}F-D-${(spot + 7).toString().padStart(2, '0')}`">
                        {{ floor }}F-D-{{ (spot + 7).toString().padStart(2, '0') }}
                    </option>
                </optgroup>
            </select>
        </div>

        <div v-if="viewMode === 'idle'" class="screen-container screen-idle" @click="viewMode = 'scan'">
            <div class="center-content">
                <div class="logo-box">
                    <img class="main-logo-img" src="@/assets/txtlogo2.png" alt="S-HOSPITAL" />
                </div>
                <div class="touch-guidance pulse-animation">
                    <h2 class="touch-main-msg">EV CHARGING SYSTEM</h2>
                    <p class="touch-sub-msg">
                        {{ t.touchSubMsg1 }} <span class="blue-txt">{{ chargerType === 'FAST' ? t.fast : t.slow
                        }}</span>{{ t.touchSubMsg2 }}
                    </p>
                </div>
            </div>
        </div>

        <!-- 고장 화면 -->
        <div v-else-if="viewMode === 'error'" class="screen-container screen-error fade-in">
            <div class="center-content">
                <div class="error-visual-box bounce-animation mb-20">
                    <svg viewBox="0 0 24 24" style="width: 100px; height: 100px; color: #ff0015;">
                        <path fill="currentColor" d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" />
                    </svg>
                </div>
                <h2 class="step-title error-title">시스템 점검 중</h2>
                <p class="step-desc mt-20">해당 충전기는 현재 안전 점검이 진행 중입니다<br>불편을 드려 죄송합니다 다른 기기를 이용해 주세요</p>
                <div class="bottom-btn-area mt-40">
                    <button class="btn-home-link" @click="viewMode = 'idle'">
                        <svg viewBox="0 0 24 24" width="24" height="24" style="margin-right: 8px;">
                            <path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
                        </svg>
                        처음으로 돌아가기
                    </button>
                </div>
            </div>
        </div>

        <!-- 번호판 인식 -->
        <div v-else-if="viewMode === 'scan'" class="screen-container screen-scan fade-in">
            <div class="center-content">
                <h2 class="step-title">{{ t.scanTitle }}</h2>
                <div class="manual-input-box">
                    <p class="step-desc mb-20">{{ t.scanDesc1 }}<br />{{ t.scanDesc2 }}</p>

                    <div class="upload-section mt-40 mb-40">
                        <label for="fileInput" class="professional-btn upload-btn">
                            <svg viewBox="0 0 24 24" class="svg-icon" width="24" height="24">
                                <path fill="currentColor"
                                    d="M4,4H7L9,2H15L17,4H20A2,2,0,0,1,22,6V18A2,2,0,0,1,20,20H4A2,2,0,0,1,2,18V6A2,2,0,0,1,4,4M12,7A5,5,0,1,0,17,12A5,5,0,0,0,12,7M12,9A3,3,0,1,1,9,12A3,3,0,0,1,12,9Z" />
                            </svg>
                            {{ t.scanBtn }}
                        </label>
                        <input type="file" id="fileInput" @change="handleFileUpload" accept="image/*" hidden />
                    </div>

                    <div class="bottom-btn-area mt-40">
                        <button class="btn-home-link" @click="viewMode = 'idle'">
                            <svg viewBox="0 0 24 24" width="24" height="24" style="margin-right: 8px;">
                                <path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
                            </svg>
                            {{ t.btnHome }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 번호판 인식 실패 -->
        <div v-else-if="viewMode === 'scan_fail'" class="screen-container screen-error fade-in">
            <div class="center-content">
                <div class="error-visual-box bounce-animation mb-20">
                    <svg viewBox="0 0 24 24" style="width: 100px; height: 100px; color: #ff0015;">
                        <path fill="currentColor"
                            d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
                    </svg>
                </div>

                <h2 class="step-title error-title">{{ t.scanFailTitle }}</h2>
                <p class="step-desc mt-20">{{ t.scanFailDesc1 }}<br />{{ t.scanFailDesc2 }}</p>

                <div class="action-buttons-row mt-40">
                    <button class="btn-confirm btn-large" @click="viewMode = 'scan'">{{ t.btnRetry }}</button>
                    <button class="btn-confirm btn-large alt-blue-btn" @click="viewMode = 'manual-search'">{{
                        t.btnManual }}</button>
                </div>

                <div class="bottom-btn-area mt-40">
                    <button class="btn-home-link" @click="viewMode = 'idle'">
                        <svg viewBox="0 0 24 24" width="24" height="24" style="margin-right: 8px;">
                            <path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
                        </svg>
                        {{ t.btnHome }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 번호판 직접 입력 -->
        <div v-else-if="viewMode === 'manual-search'" class="screen-container screen-search fade-in">
            <h2 class="step-title">{{ t.manualTitle }}</h2>
            <p class="step-desc" v-if="!hasSearched">{{ t.manualDesc }}</p>

            <div class="search-input-display mt-20 mb-30" v-if="!hasSearched">
                <div class="plate-input-box" :class="{ 'empty': !searchQuery }">
                    {{ searchQuery || t.placeholder }}
                </div>
            </div>

            <div v-if="!hasSearched" class="custom-keypad-section">
                <div class="keypad-tabs">
                    <button :class="['k-tab', { active: keypadMode === 'NUM' }]" @click="keypadMode = 'NUM'">{{
                        t.numKeypad }}</button>
                    <button :class="['k-tab', { active: keypadMode === 'ENG' }]" @click="keypadMode = 'ENG'">{{
                        t.engKeypad }}</button>
                </div>

                <div v-if="keypadMode === 'NUM'" class="keypad-grid num-grid fade-in">
                    <button v-for="n in 9" :key="n" @click="appendChar(n)">{{ n }}</button>
                    <button class="btn-clear action-btn" @click="clearSearch">{{ t.btnClear }}</button>
                    <button @click="appendChar(0)">0</button>
                    <button class="btn-backspace action-btn" @click="backspace">←</button>
                </div>

                <div v-if="keypadMode === 'ENG'" class="keypad-grid eng-grid fade-in">
                    <button v-for="char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')" :key="char"
                        @click="appendChar(char)">{{ char }}</button>
                    <button class="btn-clear action-btn" @click="clearSearch" style="grid-column: span 3;">{{
                        t.deleteAll }}</button>
                    <button class="btn-backspace action-btn" @click="backspace" style="grid-column: span 4;">← {{
                        t.delete }}</button>
                </div>

                <div class="bottom-btn-area mt-40">
                    <button class="btn-cancel" @click="viewMode = 'scan_fail'">{{ t.btnPrev }}</button>
                    <button class="btn-confirm btn-large" :disabled="searchQuery.length < 2"
                        @click="executeManualSearch">
                        {{ t.btnSearch }}
                    </button>
                </div>
            </div>

            <div v-if="hasSearched" class="search-result-area fade-in">
                <h3 v-if="searchResultList?.length > 0" class="select-guide-text mb-20">{{ t.selectCar }}</h3>

                <div class="result-list-container">
                    <div v-for="(car, index) in searchResultList" :key="index" @click="selectVehicleManually(car)"
                        class="car-list-card pulse-hover">
                        <div class="car-img-area">
                            <img :src="car.vehicle_img ? `${backendUrl}${car.vehicle_img}` : '/assets/default-plate.png'"
                                alt="vehicle" />
                        </div>
                        <div class="car-info-area">
                            <div class="info-row">
                                <span class="info-label">{{ t.receiptVehicleNum }}</span>
                                <span class="info-value highlight">{{ car.vehicle_num }}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">{{ t.parkedLocation }}</span>
                                <span class="info-value">{{ car.parked_location || t.unknownLocation }}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">{{ t.entryTime }}</span>
                                <span class="info-value">{{ formatDateTime(car.entry_time) || car.entry_time }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!searchResultList || searchResultList.length === 0" class="no-result mt-20 bounce-animation">
                    <div class="error-visual-box compact">
                        <svg viewBox="0 0 24 24" class="svg-error">
                            <path fill="currentColor"
                                d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
                        </svg>
                    </div>
                    <p class="error-txt">{{ t.noResult }}</p>
                    <p class="guide-txt">{{ t.callAdmin1 }}<span style="color:#005baa; font-weight:bold;">{{
                        t.callAdmin2 }}</span>{{ t.callAdmin3 }}</p>
                </div>

                <div class="bottom-btn-area mt-40">
                    <button class="btn-cancel" @click="hasSearched = false">{{ t.btnPrev }} ({{ t.retrySearch
                        }})</button>
                </div>
            </div>
        </div>

        <!-- 번호판 인식중 로딩 화면 -->
        <div v-else-if="viewMode === 'loading'" class="screen-container screen-loading">
            <div class="modern-spinner"></div>
            <h2 class="step-title mt-20">{{ t.loadingTitle }}</h2>
            <p class="guide-text mt-10">{{ t.loadingDesc }}</p>
        </div>

        <!-- 번호판 인식 결과 화면 -->
        <div v-else-if="viewMode === 'status'" class="screen-container screen-status">
            <h2 class="step-title">{{ t.statusTitle }}</h2>

            <div class="info-card">
                <div class="info-row">
                    <span>{{ t.recognizedPlate }}</span>
                    <h3 class="bold-blue">{{ vehicleNum }}</h3>
                </div>
                <hr class="dash-line" />
                <div class="info-row">
                    <span>{{ t.batteryLevel }}</span>
                    <h3 class="battery-txt">{{ currentBattery }}%</h3>
                </div>
            </div>

            <h3 class="check-msg mt-30">{{ t.confirmVehicle }}</h3>
            <div class="bottom-btn-area">
                <button class="btn-cancel" @click="viewMode = 'scan'">{{ t.btnNo }}</button>
                <button class="btn-confirm" @click="viewMode = 'select_charger'">{{ t.btnYes }}</button>
            </div>
        </div>

        <!-- 충전기 선택 화면 -->
        <div v-else-if="viewMode === 'select_charger'" class="screen-container screen-select-charger">
            <h2 class="step-title">{{ t.selectChargerTitle }}</h2>
            <p class="step-desc mb-20" v-html="t.selectChargerDesc"></p>

            <div class="floor-tabs mt-20 mb-20">
                <button v-for="floor in 5" :key="floor" @click="selectedFloor = floor"
                    :class="['floor-btn', { active: selectedFloor === floor }]">
                    B{{ floor }}{{ t.floor }}
                </button>
            </div>

            <div class="spot-grid mt-20 mb-30">
                <button v-for="spotNum in availableSpots" :key="spotNum"
                    @click="selectedChargerId = `${selectedFloor}F-D-${spotNum.toString().padStart(2, '0')}`"
                    :disabled="isChargerBroken(`${selectedFloor}F-D-${spotNum.toString().padStart(2, '0')}`)" :class="['spot-btn', {
                        active: selectedChargerId === `${selectedFloor}F-D-${spotNum.toString().padStart(2, '0')}`,
                        'broken-disabled': isChargerBroken(`${selectedFloor}F-D-${spotNum.toString().padStart(2, '0')}`)
                    }]">
                    {{ selectedFloor }}F-D-{{ spotNum.toString().padStart(2, '0') }}

                    <div v-if="isChargerBroken(`${selectedFloor}F-D-${spotNum.toString().padStart(2, '0')}`)"
                        style="font-size: 12px; margin-top: 4px; color: #ff3b3b;">
                        (점검 중)
                    </div>
                </button>
            </div>

            <div class="selection-status mt-30">
                <h3 v-if="selectedChargerId" class="bold-blue">{{ t.selectedLocation }} {{ selectedChargerId }} ]</h3>
                <p v-else class="empty-status">{{ t.selectPlease }}</p>
            </div>

            <div class="bottom-btn-area mt-40">
                <button class="btn-cancel" @click="viewMode = 'status'">{{ t.btnPrev }}</button>
                <button class="btn-confirm btn-large" :disabled="!selectedChargerId" @click="viewMode = 'input_amount'">
                    {{ t.btnSetAmount }}
                </button>
            </div>
        </div>

        <!-- 금액 입력(충전량, 소요시간) -->
        <div v-else-if="viewMode === 'input_amount'" class="screen-container screen-input">
            <h2 class="step-title">{{ t.inputAmountTitle }}</h2>
            <div class="flex-layout">
                <div class="left-info-section">
                    <div class="input-display-box">
                        <p>{{ t.payAmount }}</p>
                        <div class="amount-display">{{ inputAmount.toLocaleString() }} {{ t.currency }}</div>
                    </div>
                    <div class="calc-info-box mt-20">
                        <div class="calc-row"><span>{{ t.selectedDevice }}</span><strong>{{ selectedChargerId }} ({{
                            chargerType === 'FAST' ? t.fast : t.slow }})</strong></div>
                        <div class="calc-row"><span>{{ t.expectedCharge }}</span><strong>{{ expectedKwh.toFixed(2) }}
                                kWh</strong></div>
                        <div class="calc-row highlight-row"><span>{{ t.expectedTime }}</span><strong>{{
                                expectedTotalMinutes }} {{ t.minute }}</strong></div>
                    </div>
                </div>
                <div class="right-numpad-section">
                    <div class="numpad-grid">
                        <button v-for="n in 9" :key="n" @click="appendNumber(n)">{{ n }}</button>
                        <button class="btn-clear" @click="clearNumber">{{ t.btnClear }}</button>
                        <button @click="appendNumber(0)">0</button>
                        <button @click="appendDoubleZero">00</button>
                    </div>
                </div>
            </div>
            <div class="bottom-btn-area">
                <button class="btn-cancel" @click="viewMode = 'select_charger'">{{ t.btnPrev }}</button>
                <button class="btn-confirm btn-large" :disabled="inputAmount === 0" @click="startCharging">{{
                    t.btnStartCharge }}</button>
            </div>
        </div>

        <!-- 충전중 화면 -->
        <div v-else-if="viewMode === 'charging'" class="screen-container screen-charging">
            <h2 class="step-title pulse-animation flex-center-align">
                <svg class="icon-svg mr-10" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"
                    stroke="none">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                {{ t.chargingTitle }}
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
                    <span>{{ t.chargeAmount }}</span>
                    <strong>{{ currentChargedKwh.toFixed(2) }} kWh</strong>
                </div>
            </div>

            <div class="bottom-btn-area mt-40">
                <button class="btn-stop-charging" @click="stopCharging">{{ t.btnStopCharge }}</button>
            </div>
        </div>

        <!-- 충전 완료 화면 -->
        <div v-else-if="viewMode === 'complete'" class="screen-container screen-complete">
            <h2 class="step-title">{{ t.completeTitle }}</h2>

            <div class="receipt-card mt-30">
                <h3>S-HOSPITAL EV CHARGE</h3>
                <hr />
                <div class="r-row"><span>{{ t.receiptVehicleNum }}</span>
                    <p>{{ vehicleNum }}</p>
                </div>
                <div class="r-row"><span>{{ t.receiptChargeAmount }}</span>
                    <p>{{ finalChargedKwh.toFixed(2) }} kWh</p>
                </div>
                <div class="r-row"><span>{{ t.receiptTime }}</span>
                    <p>{{ elapsedMinutes }} {{ t.minute }}</p>
                </div>
                <hr class="dash-line" />
                <div class="r-row total-amount">
                    <span>{{ t.receiptTotal }}</span>
                    <p>{{ finalAmount.toLocaleString() }} {{ t.currency }}</p>
                </div>
                <p class="receipt-notice mt-10">{{ t.receiptNotice }}</p>
            </div>

            <div class="timer-section mt-40">
                <div class="timer-bar">
                    <div class="timer-progress" :style="{ width: (countdown / totalCountdown) * 100 + '%' }"></div>
                </div>
                <p class="timer-text"><b>{{ countdown }}</b>{{ t.secToHome }}</p>
            </div>

            <div class="bottom-btn-area mt-20">
                <button class="btn-confirm btn-large" @click="viewMode = 'goodbye'">{{ t.btnConfirm }}</button>
            </div>
        </div>

        <!-- ㅂㅂ화면 -->
        <div v-else-if="viewMode === 'goodbye'" class="screen-container screen-bye fade-in">
            <div class="center-content">
                <h1 class="bye-msg pulse-animation">{{ t.byeMsg }}</h1>
                <p class="bye-sub mt-20">{{ t.byeSub }}</p>

                <div class="timer-section mt-40">
                    <div class="timer-bar">
                        <div class="timer-progress" :style="{ width: (countdown / totalCountdown) * 100 + '%' }"></div>
                    </div>
                    <p class="timer-text"><b>{{ countdown }}</b>{{ t.secToHome }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { scanEvPlateReq, startEvChargeReq, stopEvChargeReq, searchManualPlateReq } from '@/api/ev/charge.js'

// ==========================================
// 0. 국가별 다국어 번역 데이터
// ==========================================
const TRANSLATIONS = {
    KOR: {
        langName: '한국어',
        fastBtn: '급속 충전기', slowBtn: '완속 충전기',
        touchSubMsg1: '화면을 터치하여', touchSubMsg2: '충전을 시작합니다',
        scanTitle: '차량 번호판 인식', scanDesc1: '정확한 요금 정산 및 출차 연동을 위해', scanDesc2: '차량의 번호판이 잘 보이도록 촬영해 주세요',
        scanBtn: '차량 사진 선택하기', btnHome: '처음으로',
        scanFailTitle: '인식 결과 없음', scanFailDesc1: '번호판 인식을 실패했거나 입차 기록을 찾을 수 없습니다', scanFailDesc2: '아래 방법 중 하나를 선택해 주세요',
        btnRetry: '다시 촬영하기', btnManual: '차량 번호 직접 입력하기',
        manualTitle: '차량 번호 직접 입력', manualDesc: '차량 번호 뒷자리 4자리를 입력해 주세요', placeholder: '예) 1234', btnSearch: '조회',
        selectCar: '해당하는 차량을 선택해 주세요', entryTxt: '입차: ', noResult: '검색 결과가 없습니다', callAdmin1: '화면 하단의 ', callAdmin2: '[호출 버튼]', callAdmin3: '을 눌러 관리자에게 문의해 주세요',
        loadingTitle: '번호판 인식 중...', loadingDesc: '잠시만 기다려 주십시오',
        statusTitle: '차량 정보 확인', recognizedPlate: '인식된 차량번호', batteryLevel: '현재 배터리 잔여량',
        confirmVehicle: '해당 차량이 맞습니까?', btnNo: '아니오 (다시 인식)', btnYes: '예',
        selectChargerTitle: '충전기 위치 선택', selectChargerDesc: '차량을 주차하신 층과 충전기 번호를 선택해 주세요',
        floor: '층', selectedLocation: '선택된 위치: [', selectPlease: '주차하신 충전기 번호를 눌러주세요',
        btnPrev: '이전', btnSetAmount: '충전 금액 설정', inputAmountTitle: '충전 금액 입력',
        payAmount: '결제 금액', selectedDevice: '선택 기기', fast: '급속', slow: '완속',
        expectedCharge: '예상 충전량', btnClear: '지움', btnStartCharge: '충전 시작하기',
        chargingTitle: '충전이 진행 중입니다', chargeAmount: '충전량', elapsedTime: '소요 시간',
        btnStopCharge: '충전 중지 (결제하기)', completeTitle: '충전 및 결제가 완료되었습니다',
        receiptVehicleNum: '차량 번호', receiptChargeAmount: '충전량', receiptTime: '소요 시간',
        receiptTotal: '최종 결제 금액', receiptNotice: '* 해당 금액은 출차 시 합산되어 정산됩니다',
        btnConfirm: '확인', byeMsg: '이용해 주셔서 감사합니다', byeSub: '안전 운전 하세요!',
        autoReturnMsg: '잠시 후 대기 화면으로 이동합니다...', currency: '원', minute: '분',
        alertMax: '최대 금액을 초과했습니다', alertMin: '최소 충전 금액은 1,000원입니다',
        expectedTime: '예상 소요 시간', secToHome: '초 후 초기 화면으로 이동합니다',
        numKeypad: '숫자 키패드', engKeypad: '영문 키패드', deleteAll: '전체 지움', delete: '삭제',
        parkedLocation: '주차위치', unknownLocation: '위치 미상', retrySearch: '다시 검색',
        alertMinLength: '차량 번호를 2자 이상 입력해 주세요', alertError: '오류가 발생했습니다. 다시 시도해 주세요'
    },
    BRA: {
        langName: 'Português',
        fastBtn: 'Rápido', slowBtn: 'Lento',
        touchSubMsg1: 'Toque para iniciar a recarga', touchSubMsg2: '',
        scanTitle: 'Upload de Imagem', scanDesc1: 'Para calcular a tarifa corretamente,', scanDesc2: 'selecione uma foto clara da placa',
        scanBtn: 'Selecionar Foto', btnHome: 'Início',
        scanFailTitle: 'Falha no Reconhecimento', scanFailDesc1: 'Não foi possível reconhecer a placa ou registro', scanFailDesc2: 'Escolha uma das opções abaixo',
        btnRetry: 'Tentar Novamente', btnManual: 'Inserir Placa Manualmente',
        manualTitle: 'Busca Manual de Placa', manualDesc: 'Insira os últimos 4 dígitos da placa', placeholder: 'Ex: 1234', btnSearch: 'Buscar',
        selectCar: 'Selecione o veículo correspondente', entryTxt: 'Entrada: ', noResult: 'Nenhum resultado encontrado', callAdmin1: 'Pressione o ', callAdmin2: '[Botão de Chamada]', callAdmin3: ' abaixo para ajuda',
        loadingTitle: 'Reconhecendo placa...', loadingDesc: 'Por favor, aguarde',
        statusTitle: 'Confirmar Veículo', recognizedPlate: 'Placa Reconhecida', batteryLevel: 'Bateria Atual',
        confirmVehicle: 'Este é o seu veículo?', btnNo: 'Não (Tentar)', btnYes: 'Sim',
        selectChargerTitle: 'Selecionar Carregador', selectChargerDesc: 'Selecione o andar e o número do carregador',
        floor: 'F', selectedLocation: 'Local: [', selectPlease: 'Selecione o número do carregador',
        btnPrev: 'Voltar', btnSetAmount: 'Definir Valor', inputAmountTitle: 'Inserir Valor',
        payAmount: 'Valor', selectedDevice: 'Dispositivo', fast: 'Rápido', slow: 'Lento',
        expectedCharge: 'Recarga Estimada', btnClear: 'Limpar', btnStartCharge: 'Iniciar',
        chargingTitle: 'Recarga em Andamento', chargeAmount: 'Quantidade', elapsedTime: 'Tempo',
        btnStopCharge: 'Parar (Pagar)', completeTitle: 'Recarga e Pagamento Concluídos',
        receiptVehicleNum: 'Placa', receiptChargeAmount: 'Recarga', receiptTime: 'Tempo',
        receiptTotal: 'Valor Total', receiptNotice: '* Cobrado junto com o estacionamento na saída',
        btnConfirm: 'Confirmar', byeMsg: 'Obrigado', byeSub: 'Dirija com segurança!',
        autoReturnMsg: 'Retornando em instantes...', currency: ' $', minute: ' min',
        alertMax: 'Valor excede o limite', alertMin: 'O valor mínimo é 1.000',
        expectedTime: 'Tempo Estimado', secToHome: ' seg(s) para o início',
        numKeypad: 'Numérico', engKeypad: 'Alfabético', deleteAll: 'Limpar Tudo', delete: 'Apagar',
        parkedLocation: 'Local', unknownLocation: 'Desconhecido', retrySearch: 'Buscar Novamente',
        alertMinLength: 'Insira pelo menos 2 caracteres', alertError: 'Ocorreu um erro. Tente novamente'
    },
    CHN: {
        langName: '中文',
        fastBtn: '快充充电器', slowBtn: '慢充充电器',
        touchSubMsg1: '点击屏幕开始', touchSubMsg2: '充电',
        scanTitle: '车牌识别', scanDesc1: '为了准确结算费用和联动出场，', scanDesc2: '请上传清晰的车牌照片',
        scanBtn: '选择车辆照片', btnHome: '返回首页',
        scanFailTitle: '识别失败', scanFailDesc1: '未能识别车牌或找不到入场记录', scanFailDesc2: '请选择以下操作之一',
        btnRetry: '重新识别', btnManual: '手动输入车牌号',
        manualTitle: '手动输入车牌', manualDesc: '请输入车牌号后4位', placeholder: '例：1234', btnSearch: '查询',
        selectCar: '请选择您的车辆', entryTxt: '入场: ', noResult: '未找到相关结果', callAdmin1: '请点击下方的', callAdmin2: '[呼叫按钮]', callAdmin3: '联系管理员',
        loadingTitle: '车牌识别中...', loadingDesc: '请稍候',
        statusTitle: '车辆信息确认', recognizedPlate: '识别车牌号', batteryLevel: '当前电量',
        confirmVehicle: '这是您的车辆吗？', btnNo: '否 (重试)', btnYes: '是',
        selectChargerTitle: '选择充电器', selectChargerDesc: '请选择楼层和充电器编号',
        floor: '层', selectedLocation: '已选位置: [', selectPlease: '请选择充电器编号',
        btnPrev: '返回', btnSetAmount: '设置金额', inputAmountTitle: '输入金额',
        payAmount: '支付金额', selectedDevice: '已选设备', fast: '快充', slow: '慢充',
        expectedCharge: '预计充电量', btnClear: '清除', btnStartCharge: '开始充电',
        chargingTitle: '充电进行中', chargeAmount: '已充量', elapsedTime: '已用时间',
        btnStopCharge: '停止充电 (结算)', completeTitle: '充电与结算已完成',
        receiptVehicleNum: '车牌号', receiptChargeAmount: '充电量', receiptTime: '已用时间',
        receiptTotal: '最终金额', receiptNotice: '* 该费用将在出场时合并结算',
        btnConfirm: '确认', byeMsg: '感谢使用', byeSub: '祝您一路平安！',
        autoReturnMsg: '稍后返回首页...', currency: '元', minute: '分',
        alertMax: '超过最大金额', alertMin: '最低充电金额为1,000元',
        expectedTime: '预计所需时间', secToHome: '秒后返回首页',
        numKeypad: '数字键盘', engKeypad: '英文键盘', deleteAll: '全部清除', delete: '删除',
        parkedLocation: '停车位置', unknownLocation: '位置不详', retrySearch: '重新查询',
        alertMinLength: '请输入至少2个字符', alertError: '发生错误，请重试'
    },
    EUR: {
        langName: 'English',
        fastBtn: 'Fast Charger', slowBtn: 'Slow Charger',
        touchSubMsg1: 'Touch to start', touchSubMsg2: 'charging',
        scanTitle: 'License Plate Recognition', scanDesc1: 'For accurate billing and exit integration,', scanDesc2: 'please select a clear photo of your plate',
        scanBtn: 'Select Photo', btnHome: 'Home',
        scanFailTitle: 'Recognition Failed', scanFailDesc1: 'Failed to recognize plate or no entry record found', scanFailDesc2: 'Please choose an option below',
        btnRetry: 'Try Again', btnManual: 'Enter Manually',
        manualTitle: 'Manual Search', manualDesc: 'Enter the last 4 digits of your plate', placeholder: 'e.g. 1234', btnSearch: 'Search',
        selectCar: 'Please select your vehicle', entryTxt: 'Entry: ', noResult: 'No results found', callAdmin1: 'Please press the ', callAdmin2: '[Call Button]', callAdmin3: ' below for assistance',
        loadingTitle: 'Recognizing Plate...', loadingDesc: 'Please wait',
        statusTitle: 'Vehicle Verification', recognizedPlate: 'Recognized Plate', batteryLevel: 'Battery Level',
        confirmVehicle: 'Is this your vehicle?', btnNo: 'No (Retry)', btnYes: 'Yes',
        selectChargerTitle: 'Select Charger', selectChargerDesc: 'Select floor and charger number',
        floor: 'F', selectedLocation: 'Location: [', selectPlease: 'Select a charger number',
        btnPrev: 'Back', btnSetAmount: 'Set Amount', inputAmountTitle: 'Enter Amount',
        payAmount: 'Amount', selectedDevice: 'Device', fast: 'Fast', slow: 'Slow',
        expectedCharge: 'Expected Charge', btnClear: 'Clear', btnStartCharge: 'Start',
        chargingTitle: 'Charging in Progress', chargeAmount: 'Charged', elapsedTime: 'Elapsed',
        btnStopCharge: 'Stop (Pay)', completeTitle: 'Charging & Payment Completed',
        receiptVehicleNum: 'Plate', receiptChargeAmount: 'Charged', receiptTime: 'Elapsed Time',
        receiptTotal: 'Total Amount', receiptNotice: '* Added to parking fee at exit',
        btnConfirm: 'Confirm', byeMsg: 'Thank you', byeSub: 'Drive safely!',
        autoReturnMsg: 'Returning shortly...', currency: '', minute: ' min',
        alertMax: 'Maximum amount exceeded', alertMin: 'Minimum amount is 1,000',
        expectedTime: 'Expected Time', secToHome: ' sec(s) to home',
        numKeypad: 'Number Pad', engKeypad: 'Letter Pad', deleteAll: 'Clear All', delete: 'Delete',
        parkedLocation: 'Location', unknownLocation: 'Unknown', retrySearch: 'Search Again',
        alertMinLength: 'Please enter at least 2 characters', alertError: 'An error occurred. Please try again'
    },
    IND: {
        langName: 'हिन्दी',
        fastBtn: 'तेज़ चार्जर', slowBtn: 'धीमा चार्जर',
        touchSubMsg1: 'शुरू करने के लिए', touchSubMsg2: 'स्पर्श करें',
        scanTitle: 'नंबर प्लेट पहचान', scanDesc1: 'सटीक बिलिंग के लिए,', scanDesc2: 'कृपया अपनी प्लेट की एक स्पष्ट तस्वीर चुनें',
        scanBtn: 'तस्वीर चुनें', btnHome: 'होम',
        scanFailTitle: 'पहचान विफल', scanFailDesc1: 'प्लेट पहचानने में विफल या कोई रिकॉर्ड नहीं', scanFailDesc2: 'कृपया नीचे एक विकल्प चुनें',
        btnRetry: 'पुनः प्रयास करें', btnManual: 'मैन्युअल रूप से दर्ज करें',
        manualTitle: 'मैनुअल खोज', manualDesc: 'अपनी प्लेट के अंतिम 4 अंक दर्ज करें', placeholder: 'उदा. 1234', btnSearch: 'खोजें',
        selectCar: 'कृपया अपना वाहन चुनें', entryTxt: 'प्रवेश: ', noResult: 'कोई परिणाम नहीं', callAdmin1: 'कृपया सहायता के लिए नीचे ', callAdmin2: '[कॉल बटन]', callAdmin3: ' दबाएं',
        loadingTitle: 'पहचान की जा रही है...', loadingDesc: 'कृपया प्रतीक्षा करें',
        statusTitle: 'वाहन सत्यापन', recognizedPlate: 'पहचानी गई प्लेट', batteryLevel: 'बैटरी स्तर',
        confirmVehicle: 'क्या यह आपका वाहन है?', btnNo: 'नहीं', btnYes: 'हाँ',
        selectChargerTitle: 'चार्जर चुनें', selectChargerDesc: 'मंजिल और चार्जर नंबर चुनें',
        floor: 'F', selectedLocation: 'स्थान: [', selectPlease: 'चार्जर नंबर चुनें',
        btnPrev: 'पीछे', btnSetAmount: 'राशि सेट करें', inputAmountTitle: 'राशि दर्ज करें',
        payAmount: 'राशि', selectedDevice: 'उपकरण', fast: 'तेज़', slow: 'धीमा',
        expectedCharge: 'अपेक्षित चार्ज', btnClear: 'साफ़ करें', btnStartCharge: 'शुरू करें',
        chargingTitle: 'चार्जिंग जारी है', chargeAmount: 'चार्ज की गई मात्रा', elapsedTime: 'बिता हुआ समय',
        btnStopCharge: 'रोकें (भुगतान)', completeTitle: 'चार्जिंग और भुगतान पूरा हुआ',
        receiptVehicleNum: 'नंबर प्लेट', receiptChargeAmount: 'चार्ज', receiptTime: 'बिता हुआ समय',
        receiptTotal: 'कुल राशि', receiptNotice: '* बाहर निकलने पर पार्किंग शुल्क में जोड़ा जाएगा',
        btnConfirm: 'पुष्टि करें', byeMsg: 'धन्यवाद', byeSub: 'सुरक्षित ड्राइव करें!',
        autoReturnMsg: 'जल्द ही वापस लौट रहे हैं...', currency: '₹', minute: ' मिनट',
        alertMax: 'अधिकतम राशि पार हो गई', alertMin: 'न्यूनतम राशि 1,000 है',
        expectedTime: 'अपेक्षित समय', secToHome: ' सेकंड बाद होम पर',
        numKeypad: 'नंबर पैड', engKeypad: 'अक्षर पैड', deleteAll: 'सब साफ़ करें', delete: 'हटाएं',
        parkedLocation: 'पार्किंग स्थान', unknownLocation: 'अज्ञात स्थान', retrySearch: 'पुनः खोजें',
        alertMinLength: 'कृपया कम से कम 2 वर्ण दर्ज करें', alertError: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें'
    }
}

// ==========================================
// 1. 상태 및 기본 데이터
// ==========================================
const viewMode = ref('idle')
const vehicleNum = ref('')
const currentBattery = ref(0)
const currentLang = ref('KOR') // 현재 선택된 언어 상태값 (기본 한국어)

// 타이머 관련 변수
const countdown = ref(10)
const totalCountdown = ref(10)
let returnTimer = null

// 기기 선택
const selectedFloor = ref(1)
const selectedChargerId = ref('1F-D-08')
const chargerType = ref('SLOW') // 8번은 SLOW이므로 기본값 SLOW

// 서버에서 받아올 기기 목록 배열
const chargers = ref([])

// 고장/점검/위험 상태 판별기
const isChargerBroken = (id) => {
    // c.evChargerId -> c.id 로, chargerStatus -> status 로 이름표 일치시킴
    const target = chargers.value.find(c => c.id === id)
    if (!target) return false
    return target.status === 'POWER_OFF' || target.aiStatus === 'RISK' || target.aiStatus === 'CHECK'
}

// 대기화면 <select>에서 기기 변경 시 실행되는 함수
const checkChargerStatus = () => {
    if (isChargerBroken(selectedChargerId.value)) {
        viewMode.value = 'error'; // 고장이면 에러 화면으로 이동
    } else if (viewMode.value === 'error') {
        // 정상 기기를 선택하면 다시 대기 화면으로
        viewMode.value = 'idle'  
    }
}

// 실시간 동기화를 위한 타이머 변수
let syncInterval = null
// 3초마다 DB 상태 가져오는 실시간 폴링 함수
const startRealTimeSync = () => {
    syncInterval = setInterval(async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/ev/chargers')
            chargers.value = res.data.map(c => ({
                id: c.evChargerId,
                status: c.chargerStatus,
                aiStatus: c.aiStatus
            }))

            if (viewMode.value === 'idle' && isChargerBroken(selectedChargerId.value)) {
                viewMode.value = 'error'
            }
        } catch (e) {
            console.error('실시간 동기화 에러:', e)
        }
    }, 3000)
}

// 선택한 타입(FAST/SLOW)에 따라 보여줄 충전기 번호 세팅
const availableSpots = computed(() => {
    return chargerType.value === 'FAST' ? [10] : [8, 9]
})

// [추가] 선택된 기기 번호에 따라 타입을 자동으로 바꿔주는 로직
watch(selectedChargerId, (newId) => {
    if (newId) checkChargerStatus()
})

// 층이 바뀔 때 자동 할당 로직
watch(selectedFloor, (newFloor) => {
    if (chargerType.value === 'FAST') {
        selectedChargerId.value = `${newFloor}F-D-10`
    } else {
        selectedChargerId.value = ''
    }
})

// 단가
const EV_PRICE_SLOW = 180
const EV_PRICE_FAST = 324
const CHARGER_OUTPUT = { SLOW: 7, FAST: 50 }

const keypadMode = ref('NUM') // 'NUM' 또는 'ENG'

// 알림 팝업 상태 제어
const isAlertOpen = ref(false)
const alertMsg = ref('')
const alertCallback = ref(null)

const showAlert = (msg, callback = null) => {
    alertMsg.value = msg
    alertCallback.value = callback
    isAlertOpen.value = true
}

const closeAlert = () => {
    isAlertOpen.value = false
    if (alertCallback.value) alertCallback.value()
}

// 다국어
const t = computed(() => TRANSLATIONS[currentLang.value] || TRANSLATIONS['KOR'])

// 자동 타이머 로직
const startTimer = (seconds = 10, targetMode = 'idle') => {
    if (returnTimer) clearInterval(returnTimer)
    countdown.value = seconds
    totalCountdown.value = seconds

    returnTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(returnTimer)
            viewMode.value = targetMode
        }
    }, 1000)
}

// ==========================================
// 2. 수동 검색 로직 (스캔 실패 시 대안)
// ==========================================
const searchQuery = ref('')
const hasSearched = ref(false)
const searchResultList = ref([])

const appendChar = (char) => {
    if (searchQuery.value.length < 8) { // 최대 8글자 제한
        searchQuery.value += char.toString()
    }
}

const backspace = () => {
    searchQuery.value = searchQuery.value.slice(0, -1)
}

const clearSearch = () => {
    searchQuery.value = ''
}

const executeManualSearch = async () => {
    if (searchQuery.value.length < 2) {
        showAlert(t.value.alertMinLength)
        return
    }
    viewMode.value = 'loading'
    try {
        const response = await searchManualPlateReq({ last_four_digits: searchQuery.value })
        viewMode.value = 'manual-search'
        hasSearched.value = true

        // length 에러 방어: 데이터가 null이거나 없으면 빈 배열([]) 할당
        if (response.data.is_success && response.data.car_list) {
            searchResultList.value = response.data.car_list
        } else {
            searchResultList.value = []
        }
    } catch (error) {
        console.error("수동 검색 API 에러:", error)
        showAlert(t.value.alertError, () => {
            viewMode.value = 'manual-search'
            hasSearched.value = true
            searchResultList.value = []
        })
    }
}

const selectVehicleManually = (car) => {
    vehicleNum.value = car.vehicle_num
    // 수동 검색 시 국적 정보가 넘어오면 그대로 적용하되, 없으면 유저가 선택한 언어 유지
    if (car.license_plate_country) currentLang.value = car.license_plate_country
    currentBattery.value = Math.floor(Math.random() * 40) + 10
    viewMode.value = 'status'
    hasSearched.value = false // 검색 상태 초기화
}

// 수동 검색 결과 렌더링에 필요한 날짜 함수
const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
const backendUrl = 'http://localhost:8004'

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
    return Math.round((expectedKwh.value / outputKw.value) * 60)
})

// ==========================================
// 5. 번호판 인식 API 연동 
// ==========================================
const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    viewMode.value = 'loading'

    try {
        const response = await scanEvPlateReq(file)
        const data = response.data

        if (data.is_success === false) {
            showAlert(data.message || t.value.scanFailDesc1, () => {
                viewMode.value = 'scan_fail'
            })
            return
        }

        vehicleNum.value = data.vehicle_num
        if (data.license_plate_country) currentLang.value = data.license_plate_country
        currentBattery.value = Math.floor(Math.random() * 40) + 10
        viewMode.value = 'status'

    } catch (error) {
        console.error("EV 번호판 인식 실패:", error)
        showAlert(t.value.alertError, () => {
            viewMode.value = 'scan_fail'
        })
    } finally {
        event.target.value = ''
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

        if (chargingProgress.value >= 100) {
            stopCharging('COMPLETED') 
        }
    }, 100)
}

// ==========================================
// 7. 충전 중지 및 API 연동 (파이썬 /stop 호출)
// ==========================================
// 매개변수의 기본값 -> FORCE_STOPPED로 설정 (아무것도 안 넘어오면 이게 들어감)
const stopCharging = async (status = 'FORCE_STOPPED') => {
    
    // 게이지 상승 중지
    // 만약 충전 타이머(게이지 올리는 setInterval)가 돌고 있다면 화면 멈춤
    if (chargingTimer) clearInterval(chargingTimer)

    // 타입 검사
    // status가 string이면 -> 그대로, 마우스 클릭 이벤트 같은 이상한 객체면 'FORCE_STOPPED'로 덮어씌움
    const finalStatus = (typeof status === 'string') ? status : 'FORCE_STOPPED';

    // 100% 완료면 1(전액), 중간 종료면 현재 게이지(%)를 100으로 나눈 비율을 구함
    const ratio = finalStatus === 'COMPLETED' ? 1 : chargingProgress.value / 100
    
    // 비율을 적용하여 최종 충전량(kWh)과 최종 요금(원)을 역산함
    finalChargedKwh.value = expectedKwh.value * ratio
    finalAmount.value = Math.floor(inputAmount.value * ratio) // 요금은 소수점 버림 처리

    try {
        // 파이썬 서버로 보낼 데이터
        const stopRequestData = {
            ev_log_id: currentEvLogId.value,
            actual_kwh: parseFloat(finalChargedKwh.value.toFixed(2)), // 소수점 2자리까지만
            final_fee: finalAmount.value,
            charging_status: finalStatus
        }

        await stopEvChargeReq(stopRequestData)
        console.log(`충전 종료 처리 완료! 상태: ${finalStatus}`)
    } catch (error) {
        // 에러 나면 콘솔에 찍음
        console.error("충전 종료 API 에러:", error)
    }

    // 7. 화면을 영수증이 뜨는 'complete' 모드로 넘기고, 10초 뒤에 작별 화면으로 이동시킴
    viewMode.value = 'complete'
    startTimer(10, 'goodbye')
}

// 화면(viewMode)이 변할 때마다 언어 초기화 및 홈 복귀 제어
watch(viewMode, (newMode) => {
    if (newMode === 'idle') {
        currentLang.value = 'KOR'
        inputAmount.value = 0
        searchQuery.value = ''
        if (returnTimer) clearInterval(returnTimer)
    }

    if (newMode === 'goodbye') {
        startTimer(5, 'idle')
    }
    if (newMode === 'select_charger') {
        selectedFloor.value = 1
        if (chargerType.value === 'FAST') {
            selectedChargerId.value = '1F-D-10' 
        } else {
            selectedChargerId.value = ''
        }
    }
})

onMounted(() => {
    startRealTimeSync() // 화면이 켜지면 감시 시작
})

onUnmounted(() => {
    if (chargingTimer) clearInterval(chargingTimer)
    if (returnTimer) clearInterval(returnTimer)
    if (syncInterval) clearInterval(syncInterval)
})
</script>

<style scoped>
.kiosk-main-wrapper,
.kiosk-main-wrapper input,
.kiosk-main-wrapper button {
    font-family: 'Pretendard', -apple-system, sans-serif !important;
}

/* ── 1. 전체 래퍼 및 배경 (입출차 공통) ── */
.kiosk-main-wrapper {
    font-family: 'Pretendard', -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--bg-light) 0%, #e0eafc 100%);
    overflow-y: auto;
    position: relative;
}

/* ── 2. 레이아웃 및 컨테이너 (입출차 공통) ── */
.screen-container {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px 40px;
}

.center-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* ── 3. 타이포그래피 (입출차 공통) ── */
.page-title,
.step-title,
.highlight-title {
    font-size: 52px;
    font-weight: 800;
    color: #222;
    margin-bottom: 32px;
    margin-top: 25px;
    letter-spacing: -1.5px;
}

.error-title {
    color: #ff0015;
}

.step-desc,
.guide-text {
    font-size: 28px;
    color: #444;
    margin-bottom: 40px;
    letter-spacing: -1px;
    text-align: center;
    font-weight: 500;
}

.blue-txt,
.bold-blue {
    color: #005baa;
    font-weight: bold;
}

.mt-10 {
    margin-top: 10px;
}

.mt-20 {
    margin-top: 20px;
}

.mt-30 {
    margin-top: 30px;
}

.mt-40 {
    margin-top: 40px;
}

.mb-20 {
    margin-bottom: 20px;
}

.mb-30 {
    margin-bottom: 30px;
}

.mb-40 {
    margin-bottom: 40px;
}

/* ── 4. 로고 및 터치 애니메이션 (입출차 공통) ── */
.logo-box {
    width: 100%;
    height: 200px;
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
    margin-top: 20px;
}

.main-logo-img {
    height: 100%;
    width: auto;
    object-fit: contain;
}

.touch-guidance {
    margin-top: 60px;
    text-align: center;
}

.touch-main-msg {
    font-size: 36px;
    font-weight: 800;
    color: #333;
    margin-bottom: 16px;
    letter-spacing: -1px;
}

.touch-sub-msg {
    font-size: 24px;
    color: #444;
    font-weight: 500;
}

.pulse-animation {
    animation: pulseBtn 2s infinite ease-in-out;
}

@keyframes pulseBtn {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.03);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── 5. 공용 카드 디자인 (입출차 공통) ── */
.info-card,
.receipt-card {
    background: #ffffff;
    padding: 40px 50px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
    border-radius: 28px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

/* ── 6. 공통 버튼 (입출차 공통) ── */
.professional-btn,
.btn-confirm,
.btn-large,
.upload-btn {
    background: #005baa;
    color: #ffffff;
    padding: 24px 40px;
    font-size: 24px;
    font-weight: 700;
    border-radius: 20px;
    border: none;
    box-shadow: 0 12px 24px rgba(49, 130, 246, 0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.professional-btn:active,
.btn-confirm:active,
.upload-btn:active {
    transform: scale(0.96);
    box-shadow: 0 6px 12px rgba(49, 130, 246, 0.15);
}

.btn-cancel {
    background: #e0eafc;
    color: #444D56;
    padding: 24px 40px;
    font-size: 24px;
    font-weight: 700;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel:active {
    background: #d0def7;
}

.btn-stop-charging {
    background: #ff0015;
    color: #ffffff;
    padding: 24px 60px;
    font-size: 28px;
    font-weight: 800;
    border-radius: 20px;
    border: none;
    box-shadow: 0 12px 24px rgba(255, 0, 21, 0.25);
    cursor: pointer;
}

.bottom-btn-area {
    display: flex;
    gap: 20px;
    justify-content: center;
    width: 100%;
    margin-top: 40px;
}

.svg-icon {
    margin-right: 15px;
}

/* ── 7. EV 전용: 상단 탭 (데모용 기기 선택 포함) ── */
.ev-type-tabs {
    position: absolute;
    top: 80px;
    left: 50px;
    display: flex;
    gap: 15px;
}

.type-btn {
    background: rgba(255, 255, 255, 0.6);
    padding: 12px 24px;
    border-radius: 16px;
    font-weight: 700;
    color: #444;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    cursor: pointer;
    font-family: 'pretendard';
}

.type-btn.active {
    background: #fff;
    color: #005baa;
    border-color: #005baa;
    box-shadow: 0 8px 16px rgba(0, 91, 170, 0.15);
}

/* 데모용 */
.demo-controller {
    position: absolute;
    top: 80px;
    right: 50px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 12px 24px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.048);
    z-index: 100;
    border: 1px solid rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(8px);
}

.demo-label {
    font-weight: 800;
    color: #005baa47;
    font-size: 18px;
    letter-spacing: -0.5px;
}

.demo-select {
    padding: 10px 16px;
    font-size: 18px;
    font-weight: bold;
    color: #33333320;
    border: 2px solid #e5e8eb;
    border-radius: 10px;
    outline: none;
    cursor: pointer;
    background: #fff;
    transition: all 0.2s ease;
    font-family: 'Pretendard', sans-serif;
}

.demo-select:focus,
.demo-select:hover {
    border-color: #005baa;
    box-shadow: 0 4px 12px rgba(0, 91, 170, 0.1);
}

/* ── 8. EV 전용: 수동 검색 및 목록 ── */
.search-input-area {
    display: flex;
    gap: 15px;
    justify-content: center;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

.plate-input {
    flex: 1;
    font-size: 32px;
    font-weight: 800;
    text-align: center;
    border: 2px solid #e5e8eb;
    border-radius: 16px;
    padding: 20px;
    color: #005baa;
}

.plate-input:focus {
    outline: none;
    border-color: #005baa;
}

.search-result-area {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
}

.result-scroll-box {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px;
}

.car-result-card {
    background: #fff;
    padding: 24px 30px;
    border-radius: 16px;
    border: 1px solid #e5e8eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
    transition: all 0.2s;
}

.car-result-card:active {
    border-color: #005baa;
    background: #e8f3ff;
    transform: scale(0.98);
}

.entry-time-txt {
    color: #888;
    font-size: 18px;
    margin: 0;
}

/* ── 9. EV 전용: 충전기 선택 및 금액 입력 ── */
.floor-tabs {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.floor-btn {
    padding: 16px 32px;
    border-radius: 16px;
    font-size: 22px;
    font-weight: bold;
    background: #fff;
    border: 1px solid #e5e8eb;
    color: #444;
    cursor: pointer;
}

.floor-btn.active {
    background: #005baa;
    color: #fff;
    border-color: #005baa;
}

.spot-grid {
    display: flex;
    justify-content: center;
    gap: 30px;
    /* 버튼 사이 간격 */
    max-width: 700px;
    width: 100%;
    margin: 0 auto;
}

.spot-btn {
    padding: 24px 40px;
    border-radius: 20px;
    font-size: 28px;
    font-weight: bold;
    background: #fff;
    border: 2px solid #e5e8eb;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 220px;
    /* 버튼이 너무 작아지지 않게 최소 크기 지정 */
}

.spot-btn.active {
    border-color: #005baa;
    color: #005baa;
    background: #e8f3ff;
}

.selection-status {
    text-align: center;
    font-size: 24px;
    padding: 20px;
    background: #f8faff;
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
}

/* ── 10. EV 전용: 계산기(Numpad) 레이아웃 ── */
.flex-layout {
    display: flex;
    gap: 40px;
    width: 100%;
    max-width: 1000px;
    align-items: stretch;
    margin: 0 auto;
}

.left-info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.input-display-box {
    background: #fff;
    border-radius: 24px;
    padding: 40px;
    text-align: center;
    border: 2px solid #005baa;
    box-shadow: 0 10px 30px rgba(0, 91, 170, 0.1);
}

.input-display-box p {
    font-size: 20px;
    color: #888;
    margin: 0;
    font-weight: 600;
}

.amount-display {
    font-size: 56px;
    font-weight: 800;
    color: #005baa;
    margin-top: 10px;
}

.calc-info-box {
    background: #fff;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.calc-row {
    display: flex;
    justify-content: space-between;
    font-size: 22px;
    padding: 15px 0;
    border-bottom: 1px solid #f2f4f6;
    color: #444;
}

.calc-row:last-child {
    border-bottom: none;
}

.highlight-row {
    color: #005baa;
    font-weight: bold;
}

.right-numpad-section {
    flex: 1;
}

.numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    height: 100%;
}

.numpad-grid button {
    background: #fff;
    border: 1px solid #e5e8eb;
    border-radius: 20px;
    font-size: 36px;
    font-weight: 700;
    color: #333;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
    transition: all 0.1s;
    cursor: pointer;
}

.numpad-grid button:active {
    background: #e8f3ff;
    color: #005baa;
    border-color: #005baa;
    transform: scale(0.95);
}

.btn-clear {
    background: #fee2e5 !important;
    color: #ff0015 !important;
    border: none !important;
    font-size: 24px !important;
}

/* ── 11. EV 전용: 충전 프로그레스 바 ── */
.charging-visual-area {
    width: 100%;
    max-width: 800px;
    text-align: center;
    margin: 40px auto;
}

.progress-bar-bg {
    width: 100%;
    height: 40px;
    background: #e5e8eb;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.05);
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #005baa 0%, #009DFF 100%);
    transition: width 0.3s ease;
}

.progress-percent {
    font-size: 72px;
    font-weight: 800;
    color: #005baa;
    margin-top: 20px;
    letter-spacing: -2px;
}

.charging-details {
    display: flex;
    gap: 30px;
    justify-content: center;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

.detail-col {
    background: #fff;
    border-radius: 20px;
    padding: 30px 50px;
    text-align: center;
    flex: 1;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.detail-col span {
    display: block;
    font-size: 20px;
    color: #888;
    margin-bottom: 10px;
    font-weight: 600;
}

.detail-col strong {
    font-size: 36px;
    font-weight: 800;
    color: #222;
}

/* ── 12. 공통 로딩 스피너 및 영수증 ── */
.modern-spinner {
    width: 80px;
    height: 80px;
    border: 8px solid #e5e8eb;
    border-top: 8px solid #005baa;
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
    margin: 0 auto;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.r-row {
    display: flex;
    justify-content: space-between;
    font-size: 24px;
    padding: 16px 0;
    color: #444;
}

.r-row p {
    margin: 0;
    font-weight: bold;
    color: #222;
}

.r-row.total-amount {
    font-size: 32px;
    font-weight: 800;
    color: #005baa;
    padding: 20px 0;
}

.r-row.total-amount p {
    color: #005baa;
}

.dash-line {
    border: none;
    border-top: 2px dashed #e5e8eb;
    margin: 20px 0;
}

.receipt-notice {
    font-size: 18px;
    color: #ff0015;
    text-align: center;
    font-weight: 600;
}

.bye-msg {
    font-size: 72px;
    font-weight: 800;
    color: #005baa;
    margin: 0;
}

.bye-sub {
    font-size: 36px;
    color: #444;
    font-weight: bold;
}

/* 화면 전환 및 애니메이션 ── */
.fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 둥둥 떠다니는 귀여운 바운스 효과 (아이콘이나 팝업에 사용) */
.bounce-animation {
    animation: bounce 1s infinite alternate ease-in-out;
}

@keyframes bounce {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(-15px);
    }
}

/* 화면 전체를 은은하게 감싸는 카드 호버 효과 */
.info-card,
.receipt-card,
.detail-col {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-card:hover,
.receipt-card:hover,
.detail-col:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 50px rgba(0, 91, 170, 0.08);
}

/* ㅂㅂ 화면 타이머 섹션 */
.timer-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0 20px 0;
    margin-top: auto;
}

.timer-bar {
    width: 60%;
    height: 10px;
    background: #e5e8eb;
    border-radius: 10px;
    overflow: hidden;
    margin-top: 10px;
}

.timer-progress {
    height: 100%;
    background: #005baa;
    border-radius: 10px;
    transition: width 1s linear;
}

.timer-text {
    font-size: 20px;
    color: #444D56;
    margin-top: 12px;
    font-weight: 600;
}

.timer-text b {
    color: #005baa;
    font-size: 24px;
    margin-right: 5px;
}

/* ── 가상 입력창 디자인 ── */
.search-input-display {
    display: flex;
    justify-content: center;
}

.plate-input-box {
    font-size: 48px;
    font-weight: 800;
    color: #005baa;
    padding: 20px 60px;
    border: 4px solid #005baa;
    border-radius: 20px;
    background: #fff;
    min-width: 450px;
    text-align: center;
    letter-spacing: 2px;
}

.plate-input-box.empty {
    color: #b0b8c1;
    border-color: #e5e8eb;
    font-size: 32px;
}

/* ── 키패드 탭 & 그리드 ── */
.custom-keypad-section {
    width: 100%;
    max-width: 650px;
    margin: 0 auto;
}

.keypad-tabs {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
}

.k-tab {
    padding: 15px 40px;
    font-size: 22px;
    font-weight: 800;
    border-radius: 16px;
    border: 2px solid #e5e8eb;
    background: #f9fafb;
    color: #8b95a1;
    cursor: pointer;
    transition: all 0.2s;
}

.k-tab.active {
    background: #005baa;
    color: #fff;
    border-color: #005baa;
    box-shadow: 0 8px 16px rgba(0, 91, 170, 0.2);
}

.keypad-grid {
    display: grid;
    gap: 12px;
    background: #f2f4f6;
    padding: 25px;
    border-radius: 24px;
}

.num-grid {
    grid-template-columns: repeat(3, 1fr);
}

.eng-grid {
    grid-template-columns: repeat(7, 1fr);
}

.keypad-grid button {
    height: 70px;
    font-size: 28px;
    font-weight: 800;
    background: #fff;
    border: none;
    border-radius: 16px;
    color: #333;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: transform 0.1s, background 0.1s;
}

.keypad-grid button:active {
    background: #e8f3ff;
    color: #005baa;
    transform: scale(0.95);
}

.action-btn {
    background: #e0eafc !important;
    color: #005baa !important;
    font-size: 22px !important;
}

/* ── 중복 검색 결과 리스트 ── */
.select-guide-text {
    font-size: 28px;
    color: #222;
    text-align: center;
}

.result-list-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 550px;
    overflow-y: auto;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 10px;
}

.car-list-card {
    display: flex;
    background: #e5e8eb;
    border: 4px solid transparent;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.car-list-card:hover,
.pulse-hover:active {
    border-color: #8bc34a;
    background: #fff;
    transform: scale(0.98);
}

.car-img-area {
    width: 320px;
    background: #ccc;
    flex-shrink: 0;
}

.car-img-area img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.car-info-area {
    flex: 1;
    padding: 25px 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 20px;
}

.info-label {
    width: 90px;
    font-size: 20px;
    font-weight: 700;
    color: #555;
    text-align: right;
}

.info-value {
    flex: 1;
    background: #005baa;
    color: #fff;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 22px;
    font-weight: 800;
    text-align: center;
}

.info-value.highlight {
    font-size: 28px;
    letter-spacing: 1px;
}

.no-result {
    text-align: center;
}

.error-txt {
    font-size: 28px;
    font-weight: 800;
    color: #ff0015;
    margin-bottom: 10px;
}

/* ── 커스텀 알림 팝업 전용 CSS (정중앙 고정) ── */
.custom-alert-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.custom-alert-box {
    background: #fff;
    border: 4px solid #ff0015;
    border-radius: 28px;
    padding: 50px 60px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
}

.alert-icon {
    width: 80px;
    height: 80px;
    color: #ff0015;
    margin-bottom: 20px;
}

.alert-msg {
    font-size: 28px;
    font-weight: 800;
    color: #333;
    margin-bottom: 30px;
    word-break: keep-all;
    line-height: 1.4;
}

.alert-btn {
    width: 100%;
    font-size: 24px;
    padding: 15px;
}

/* ── 번호판 인식 실패 화면 전용 레이아웃 ── */
.action-buttons-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    justify-content: center;
    width: 100%;
    max-width: 750px;
    /* 전체 너비 제한 */
}

.action-buttons-row button {
    flex: 1;
    padding: 24px 10px;
    font-size: 24px;
}

/* 수동입력 버튼 (두 번째 버튼) 시각적 분리 */
.alt-blue-btn {
    background: #e8f3ff !important;
    color: #005baa !important;
    border: 2px solid #005baa !important;
    box-shadow: none !important;
}

.alt-blue-btn:active {
    background: #d0def7 !important;
}

/* 처음으로 (홈) 텍스트 링크 버튼 */
.btn-home-link {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #888;
    font-size: 22px;
    font-weight: 700;
    cursor: pointer;
    padding: 10px 20px;
    transition: color 0.2s, transform 0.2s;
}

.btn-home-link:hover,
.btn-home-link:active {
    color: #444;
    transform: scale(0.95);
}

/* ── [추가] 수동 검색 화면만 전용으로 공간 확보 (전체 공통은 유지) ── */
.screen-search {
    justify-content: flex-start !important;
    /* 상단부터 쌓아서 잘림 방지 */
    padding-top: 120px !important;
    /* 상단 제목 머리 공간 확보 */
    padding-bottom: 60px !important;
    /* 하단 버튼 바닥 공간 확보 */
    overflow-y: auto !important;
    /* 내용 길어지면 스크롤 생기게 함 */
}

/* 수동 검색 화면 내부의 요소 간격 타이트하게 조절 */
.screen-search .step-title {
    margin-top: 0 !important;
    margin-bottom: 10px !important;
}

.screen-search .step-desc {
    margin-bottom: 10px !important;
}

/* 키패드가 너무 크면 8% 정도 줄여서 한 화면에 넣음 */
.custom-keypad-section {
    transform: scale(0.92);
    transform-origin: top center;
    margin-top: -10px !important;
}

/* 고객용 충전기 선택 버튼 고장 시 디자인 */
.spot-btn:disabled {
    opacity: 0.5;
    background: #e2e8f0 !important;
    border: 1px solid #cbd5e1 !important;
    cursor: not-allowed !important;
    color: #94a3b8 !important;
    box-shadow: none !important;
    transform: none !important;
}
</style>