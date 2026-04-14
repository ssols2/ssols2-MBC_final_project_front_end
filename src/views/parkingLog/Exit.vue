<template>
  <div class="kiosk-main-wrapper">

    <!-- 출차 대기 화면 (공통) -->
    <div v-if="viewMode === 'idle'" class="screen-container screen-idle" @click="viewMode = 'scan'">
      <div class="center-content">
        <div class="logo-box">
          <img class="main-logo-img" src="@/assets/txtlogo2.png" alt="S-HOSPITAL" />
        </div>
        <div class="touch-guidance pulse-animation">
          <h2 class="touch-main-msg">SMART PARKING SYSTEM</h2>
          <p class="touch-sub-msg">화면을 터치하여 출차를 시작합니다</p>
        </div>
      </div>
    </div>

    <!-- 번호판 인식 화면 -->
    <div v-if="viewMode === 'scan'" class="screen-container screen-scan">
      <h2 class="step-title">차량 번호판 이미지 업로드</h2>
      <div class="manual-input-box">
        <p class="guide-text">인식할 차량의 사진을 선택해 주세요</p>

        <div class="upload-section" style="margin: 40px 0; text-align: center;">
          <label for="fileInput" class="professional-btn"
            style="cursor: pointer; display: inline-flex; align-items: center; gap: 10px; background-color: #1976d2; color: white; padding: 15px 30px; border-radius: 8px;">
            <svg viewBox="0 0 24 24" class="svg-icon" style="width: 24px; height: 24px;">
              <path fill="currentColor"
                d="M4,4H7L9,2H15L17,4H20A2,2,0,0,1,22,6V18A2,2,0,0,1,20,20H4A2,2,0,0,1,2,18V6A2,2,0,0,1,4,4M12,7A5,5,0,1,0,17,12A5,5,0,0,0,12,7M12,9A3,3,0,1,1,9,12A3,3,0,0,1,12,9Z" />
            </svg>
            차량 사진 선택하기
          </label>
          <input type="file" id="fileInput" @change="handleFileUpload" accept="image/*" hidden />
        </div>

        <div class="btn-group">
          <button class="btn-secondary" @click="viewMode = 'idle'">처음으로</button>
        </div>
      </div>
    </div>

    <!-- 번호판 인식중 화면 - 로딩화면 (공통) -->
    <div v-if="viewMode === 'loading'" class="screen-container screen-loading">
      <div class="spinner"></div>
      <h2 class="step-title">번호판 인식 중...</h2>
      <p class="guide-text">잠시만 기다려 주십시오</p>
    </div>

    <!-- 결과1: 번호판 인식 결과 화면 -->
    <div v-if="viewMode === 'result'" class="screen-container screen-result">
      <div class="center-content">

        <h1 class="page-title highlight-title">차량 확인 및 주차 요금 정산</h1>
        <div class="result-card-container single">
          <div class="info-card data-card">

            <div class="zone-recognition">
              <div class="plate-image-box">
                <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="인식된 차량 사진" />
              </div>

              <h2 class="plate-num-large">
                {{ vehicleInfo.vehicle_num }}
              </h2>
            </div>

            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>입차 시각</th>
                  <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
                </tr>
                <tr>
                  <th>회원 구분</th>
                  <td>
                    <span v-if="vehicleInfo.is_member" class="status-member">회원 차량</span>
                    <span v-else class="status-guest">일반 차량</span>
                  </td>
                </tr>
                <tr>
                  <th>주차 이용 시간</th>
                  <td>{{ vehicleInfo.total_stay_minutes || 0 }}분</td>
                </tr>
                <tr>
                  <th>주차 요금</th>
                  <td>{{ (vehicleInfo.parking_fee || 0).toLocaleString() }}원</td>
                </tr>

                <template v-if="vehicleInfo.ev_charging_fee > 0">
                  <tr>
                    <th>전기차 충전 시간</th>
                    <td style="color: #4caf50; font-weight: bold;">{{ vehicleInfo.ev_duration_minutes || 0 }}분</td>
                  </tr>
                  <tr>
                    <th>전기차 충전 요금</th>
                    <td class="status-warn" style="color: #ff9800; font-weight: bold;">
                      + {{ (vehicleInfo.ev_charging_fee || 0).toLocaleString() }}원
                    </td>
                  </tr>
                </template>

                <tr v-if="vehicleInfo.total_free_minutes > 0">
                  <th>적용된 무료/할인 시간</th>
                  <td class="status-success">- {{ vehicleInfo.total_free_minutes }}분</td>
                </tr>
              </table>
            </div>

            <div class="zone-action">

              <div class="total-fee-box">
                <p>최종 결제 금액</p>
                <h2 class="fee-amount">
                  {{ (vehicleInfo.total_fee || 0).toLocaleString() }}<span>원</span>
                </h2>
              </div>

              <div class="payment-branch">
                <template v-if="paymentMethodType === 'AUTO'">
                  <div class="auto-pay-notice pulse-animation">
                    <p class="highlight-msg">등록된 카드로 자동 결제가 진행됩니다</p>
                    <p class="sub-guide">잠시만 기다려 주십시오</p>
                  </div>
                </template>

                <template v-else>
                  <div class="manual-pay-notice">
                    <h2 class="highlight-msg">현장 결제 화면으로 이동합니다</h2>
                    <p class="sub-guide">카드를 준비해 주십시오</p>
                  </div>
                </template>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 결과2: 무료 회차 화면 -->
    <div v-if="viewMode === 'result-free'" class="screen-container screen-result-free">
      <h2 class="step-title highlight">출차 확인</h2>
      <div class="receipt-card">
        <table class="res-table">
          <tr>
            <th>차량 번호</th>
            <td class="plate-num">{{ vehicleInfo.vehicle_num }}</td>
          </tr>
          <tr>
            <th>입차 시각</th>
            <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
          </tr>
          <tr>
            <th>총 주차 시간</th>
            <td class="time-num">{{ vehicleInfo.total_stay_minutes }}분</td>
          </tr>
          <tr>
            <th>결제 금액</th>
            <td class="fee-num" style="color: #4caf50;">0원 (무료)</td>
          </tr>
        </table>

        <p class="welcome-msg pay-msg" style="margin-top: 20px; font-weight: bold;">
          30분 이내 회차 차량입니다<br />안녕히 가십시오
        </p>
      </div>

      <div class="timer-section" style="margin-top: 30px;">
        <p class="timer-text" style="color: gray;">잠시 후 처음 화면으로 돌아갑니다</p>
      </div>
    </div>

    <!-- 결과3: 차량 조회 실패 화면 -->
    <div v-if="viewMode === 'result-fail'" class="screen-container screen-result-fail">
      <div class="center-content">

        <h1 class="page-title highlight-title">차량 조회 실패</h1>

        <div class="result-card-container single">
          <div class="info-card data-card">

            <div class="zone-recognition">
              <div class="plate-image-box">
                <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="인식된 차량 사진" />
              </div>
              <h2 class="plate-num-large" style="color: #d32f2f;">{{ vehicleInfo.vehicle_num || '인식 불가' }}</h2>
            </div>

            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>조회 상태</th>
                  <td class="status-no-entry">입차 기록 없음</td>
                </tr>
                <tr>
                  <th>알림</th>
                  <td class="sub-guide">시스템상에 <b>'{{ vehicleInfo.vehicle_num }}'</b> 차량의 입차 정보가 존재하지 않습니다</td>
                </tr>
              </table>
            </div>

            <hr class="divider" />

            <div class="zone-action">
              <div class="error-visual-box compact">
                <svg viewBox="0 0 24 24" class="svg-error">
                  <path fill="currentColor"
                    d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
                </svg>
              </div>

              <div class="retry-guidance">
                <h2 class="highlight-msg">입차 정보를 확인할 수 없습니다</h2>
                <p class="sub-guide">번호를 다시 확인하시거나 하단의 직원 호출 버튼을 눌러주세요</p>
              </div>

              <div class="action-btn-group">
                <button class="professional-btn btn-secondary" @click="viewMode = 'idle'">초기 화면으로</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- 현장 결제 화면 -->
    <div v-if="viewMode === 'manual-pay'" class="screen-container screen-manual-pay">
      <div class="center-content">

        <h1 class="page-title highlight-title">현장 결제 진행</h1>

        <div class="result-card-container single">
          <div class="info-card data-card" style="padding: 40px 30px; text-align: center;">

            <div class="payment-summary-box">
              <p>결제 차량: <span>{{ vehicleInfo.vehicle_num }}</span></p>
              <p>입차 시각: <span>{{ formatDateTime(vehicleInfo.entry_time) }}</span></p>
              <h2>
                최종 결제 금액: <span>{{ vehicleInfo.total_fee.toLocaleString() }}</span>원
              </h2>
            </div>

            <div class="insert-guide-container">
              <div class="guide-visual pulse-animation">
                <svg viewBox="0 0 24 24" style="width: 60px; height: 60px; color: #1976d2;">
                  <path fill="currentColor"
                    d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2,0,0,0 4,20H20A2,2,0,0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                </svg>
              </div>

              <h2 class="step-title">카드를 투입구에 꽂거나 단말기에 태그해 주세요</h2>
            </div>
          </div>
        </div>

        <!-- 고객 무반응 타임아웃 -->
        <div v-if="showReminder" class="reminder-popup bounce-animation">
          결제가 대기 중입니다. 카드를 꽂거나 리더기에 태그해 주세요!
        </div>

      </div>
    </div>

    <!-- 결제 승인 중 강제 딜레이 -->
    <div v-if="viewMode === 'payment-processing'" class="screen-container screen-payment-processing">
      <div class="center-content">
        <div class="modern-spinner large"></div>
        <h2 class="step-title">{{ paymentMethodType === 'AUTO' ? '자동 결제 승인 중입니다' : '현장 결제 승인 중입니다' }}</h2>
        <p class="guide-text">잠시만 기다려 주십시오</p>

        <div class="price-display">
          <span>{{ (vehicleInfo.total_fee || 0).toLocaleString() }}</span>원
        </div>
      </div>
    </div>

    <!-- 결제 실패 및 재시도 유도 화면 (공통) -->
    <div v-if="viewMode === 'payment-fail'" class="screen-container screen-payment-fail">
      <div class="center-content">
        <h1 class="page-title error-title">
          {{ paymentMethodType === 'AUTO' ? '자동 결제 승인 실패' : '결제 승인 실패' }}
        </h1>

        <div class="result-card-container single">
          <div class="info-card data-card">

            <div class="error-visual-box compact">
              <svg viewBox="0 0 24 24" class="svg-error">
                <path fill="currentColor"
                  d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
              </svg>
              <h2>결제 처리에 실패하였습니다</h2>
            </div>
            <p class="sub-guide"><span>{{ errorMessage }}</span></p>
            <hr class="divider" />
            <div class="retry-guidance pulse-animation">
              <template v-if="paymentMethodType === 'AUTO'">
                <p style="color: #1a237e; font-weight: bold;">투입구에 카드를 꽂거나 태그하여 현장 결제를 진행해 주세요</p>
              </template>

              <template v-else>
                <p style="color: #1a237e; font-weight: bold;">카드를 빼신 후 다른 카드로 다시 꽂거나 태그해 주세요</p>
              </template>

              <p style="margin-top: 10px; color: #888;">(도움이 필요하시면 화면 아래의 직원 호출을 눌러주세요)</p>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- 결제 성공 화면 (공통) - 결과+영수증 QR코드+ㅂㅂ -->
    <div v-if="viewMode === 'success-integrated'" class="screen-container screen-success-integrated">
      <div class="center-content">

        <div class="success-header">
          <div class="icon-circle success pulse-animation">
            ✓</div>
          <h1 class="page-title highlight-title">결제가 완료되었습니다</h1>
        </div>

        <div class="result-card-container single">
          <div class="info-card data-card">

            <table class="res-table">
              <tr>
                <th>차량 번호</th>
                <td>{{ vehicleInfo.vehicle_num }}</td>
              </tr>
              <tr>
                <th>입차 시각</th>
                <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
              </tr>
              <tr>
                <th>결제 금액</th>
                <td class="fee-num">{{ (vehicleInfo.total_fee || 0).toLocaleString() }}원</td>
              </tr>
              <tr v-if="vehicleInfo.ev_charging_fee > 0">
                <th>충전 시간</th>
                <td>{{ vehicleInfo.ev_duration_minutes || 0 }}분</td>
              </tr>
              <tr>
                <th>결제 구분</th>
                <td>
                  {{ paymentMethodType === 'AUTO' ? '등록카드 자동결제' : '현장 결제' }}
                </td>
              </tr>
            </table>
            <hr class="divider" />

            <div class="qr-and-farewell-box">
              <div class="qr-wrapper">
                <div>
                  <qrcode-vue :value="receiptUrl" :size="150" level="H" />
                </div>
                <p>
                  {{ vehicleInfo.is_member ? '회원 전용 모바일 영수증' : '스캔하여 영수증 확인' }}
                </p>
              </div>

              <div class="farewell-message">
                <h2 class="highlight">안녕히 가십시오</h2>
                <p class="guide-text">차단기가 열립니다 안전 운행하세요</p>
              </div>
            </div>

          </div>
        </div>

        <div class="timer-section">
          <div class="timer-bar" v-if="!isCardInserted">
            <div class="timer-progress"></div>
          </div>
          <p class="timer-text">
            <template v-if="isCardInserted && paymentMethodType === 'MANUAL'">
              <b style="color: #d32f2f; font-size: 1.2rem;">⚠️ 카드를 뽑으시면 메인 화면으로 돌아갑니다</b>
            </template>
            <template v-else>
              <b>{{ countdown }}초</b> 후 대기 화면으로 돌아갑니다
            </template>
          </p>
        </div>

        <div v-if="isCardInserted && paymentMethodType === 'MANUAL'" class="card-removal-overlay">
          <div class="popup-content bounce-animation">
            <div class="warning-icon">⚠️</div>
            <h2>카드를 투입구에서 뽑아주세요!</h2>
            <p>카드를 제거하셔야 결제가 최종 완료됩니다</p>
            <div class="arrow-down-animation">↓</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import axios from 'axios'
import { getExitFeeByOcrReq, processPaymentReq, readNfcCardReq } from '@/api/final-payment/exit.js'

// ================================================ 상태 변수 ================================================
// 화면 제어 변수
const viewMode = ref('idle')              // 현재 화면 모드
const countdown = ref(5)                  // 자동 복귀 카운트다운
const showReminder = ref(false)           // 현장결제 독촉 팝업 제어

// 입력 및 정보 변수
const errorMessage = ref('')              // 결제/조회 에러 메시지
const paymentMethodType = ref('MANUAL')   // AUTO 또는 MANUAL

const currentLang = ref('KR')
const isProcessing = ref(false)           // 결제 중복 방지 플래그

const isCardInserted = ref(false)         // 물리적 카드 삽입 여부 상태 변수

// 인식된 차량 및 정산 상세 정보
const vehicleInfo = ref({
  vehicle_num: '',                        // 차량 번호
  plate_image_url: '',                    // 번호판 원본 사진
  is_member: false,                       // 회원 여부
  total_stay_minutes: 0,                  // 주차 시간
  total_free_minutes: 0,                  // 무료/할인 시간
  ev_duration_minutes: 0,                 // 충전 시간
  total_fee: 0,                           // 최종 금액
  entry_time: '',                         // 입차 시각
  receipt_id: '',                         // 영수증 고유 ID
  has_payment_method: false,
  parking_log_id: null,                   // 결제 시 파이썬에 넘겨줄 고유 ID
  license_plate_country: 'KR'
})

// 날짜 포맷 변환 함수 (0000년 00월 00일 00시 00분 00초)
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const i = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일 ${h}:${i}:${s}`
}

// QR 코드에 담을 영수증 URL (computed로 동적 생성)
const receiptUrl = computed(() => {
  // 시연 시 폰에서 스캔할 수 있도록 localhost 대신 현재 접속 호스트(IP)를 사용
  const host = "192.168.137.178"
  const port = window.location.port
  return `http://${host}:${port}/receipt/${vehicleInfo.value.receipt_id}`
})

// ================================================ 초기화 타이머 로직 ================================================
// 타이머 변수
let returnTimer = null
let reminderTimer = null

// 데이터 및 상태 초기화
const resetKiosk = () => {
  stopTimer()
  viewMode.value = 'idle'
  vehicleInfo.value = {
    vehicle_num: '',
    plate_image_url: '',
    is_member: false,
    total_stay_minutes: 0,
    total_free_minutes: 0,
    ev_duration_minutes: 0,
    total_fee: 0,
    entry_time: '',
    receipt_id: '',
    has_payment_method: false,
    parking_log_id: null
  }
  errorMessage.value = ''
  showReminder.value = false
  isProcessing.value = false
}

// 타이머 시작 (seconds: 시간, targetMode: 이동할 화면)
const startTimer = (seconds = 5, targetMode = 'idle') => {
  stopTimer() // 기존 타이머 중단 (안전장치)
  countdown.value = seconds

  returnTimer = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      stopTimer()

      // 목적지에 따른 분기 처리
      if (targetMode === 'idle') {
        // [완전 초기화] 성공이나 무료회차 시 모든 데이터 삭제 후 처음으로
        resetKiosk()
      } else {
        // [단계 복귀] 실패 시 데이터는 유지한 채 화면만 이전 단계로
        viewMode.value = targetMode
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (returnTimer) clearInterval(returnTimer)
}

// ================================================ 1. 파이썬 웹소켓 (ACR39U 제어) ================================================
let ws = null // 웹소켓 객체

const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:9090')

  ws.onopen = () => console.log('로컬 에이전트(ACR39U) 웹소켓 연결 성공')

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data)
    console.log('웹소켓 수신 데이터:', data)

    // 수동 결제 모드이거나 결제 실패 화면일 때만 IC 카드 입력을 허용함
    const canAcceptCard = viewMode.value === 'manual-pay' || viewMode.value === 'payment-fail'

    if (data.type === 'card_detected' && canAcceptCard) {
      const cleanAtr = data.atr.replace(/\s+/g, '').toUpperCase()
      // 현장결제로 바뀜
      paymentMethodType.value = 'MANUAL'
      console.log(`[ACR39U] IC 카드 삽입 감지: ATR = ${cleanAtr}`)

      // 파이썬 결제 로직으로 ATR 값 전송
      await processPayment(cleanAtr, false)
    } else if (data.type === 'card_removed') {
      console.log('카드가 제거되었습니다.')

      // 성공 화면에서 대기 중이었다면 카드가 뽑히는 순간 타이머 시작
      if (viewMode.value === 'success-integrated' && paymentMethodType.value === 'MANUAL') {
        startTimer(7, 'idle')
      }
    }
  }

  ws.onerror = (error) => console.error('웹소켓 에러 발생:', error)
  ws.onclose = () => {
    console.log('웹소켓 연결 종료, 3초 후 재연결 시도...')
    setTimeout(connectWebSocket, 3000)
  }
}

// ================================================ 결제 승인 로직 ================================================
// 매개변수로 atr 또는 uid 값을 범용적으로 받아 처리
const processPayment = async (cardIdentifier = '', isNfc = false) => {
  // 중복 결제 요청 방지
  if (isProcessing.value) return
  isProcessing.value = true

  showReminder.value = false
  viewMode.value = 'payment-processing'

  const startTime = Date.now();

  try {
    const paymentData = {
      parking_log_id: vehicleInfo.value.parking_log_id,
      pay_type: paymentMethodType.value,
      discount_amount: 0,
      card_atr: isNfc ? null : cardIdentifier.toUpperCase(),
      card_uid: isNfc ? cardIdentifier.toUpperCase() : null
    }

    const res = await processPaymentReq(paymentData)
    const elapsed = Date.now() - startTime;
    if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));

    vehicleInfo.value.receipt_id = res.data.approval_number
    vehicleInfo.value.vehicle_num = res.data.vehicle_num || vehicleInfo.value.vehicle_num
    viewMode.value = 'success-integrated'

    // 결제 완료 후 타이머 실행 조건부 제어
    // 자동결제 차량이거나 현장결제인데 이미 카드를 뽑은 상태라면 즉시 타이머 가동
    if (paymentMethodType.value === 'AUTO' || !isCardInserted.value) {
      startTimer(7, 'idle')
    }
    // 그 외(카드가 꽂혀있음) 상황은 웹소켓의 card_removed 이벤트를 기다림

  } catch (err) {
    console.error("결제 승인 실패:", err)
    const elapsed = Date.now() - startTime;
    if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));

    errorMessage.value = err.response?.data?.detail || '결제 처리에 실패하였습니다. 다시 시도해 주십시오'
    viewMode.value = 'payment-fail'
    startTimer(5, 'manual-pay')
  } finally {
    isProcessing.value = false // 작업 완료 후 플래그 해제
  }
}

// ================================================ 번호판 인식 및 요금 조회 ================================================
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  viewMode.value = 'loading'
  vehicleInfo.value.plate_image_url = URL.createObjectURL(file)

  try {
    const response = await getExitFeeByOcrReq(file)
    const data = response.data

    if (data.is_success === false) {
      console.log("기록 없음(데이터 실패):", data)
      vehicleInfo.value.vehicle_num = data.vehicle_num || '인식 불가'
      errorMessage.value = data.message || '입차 기록이 없습니다'

      viewMode.value = 'result-fail'
      startTimer(5, 'idle')
      return // 여기서 끝내기
    }

    console.log("통합 릴레이 조회 완료:", data)

    // 데이터 세팅 (나라 정보 포함)
    vehicleInfo.value = {
      ...vehicleInfo.value,
      vehicle_num: data.vehicle_num,
      is_member: data.is_member,
      total_stay_minutes: data.total_stay_minutes,
      total_free_minutes: data.total_free_minutes,
      ev_duration_minutes: data.ev_duration_minutes,
      total_fee: data.total_fee,
      ev_charging_fee: data.ev_charging_fee,
      parking_fee: data.parking_fee,
      entry_time: data.entry_time,
      has_payment_method: data.has_payment_method,
      parking_log_id: data.parking_log_id,
      pay_type: data.pay_type,
      license_plate_country: data.license_plate_country || 'KR'
    }

    // 나라 판별 결과에 따른 언어 전환 (일단 예시 코드)
    currentLang.value = vehicleInfo.value.license_plate_country
    console.log(`현재 키오스크 언어 설정: ${currentLang.value}`)

    // 무료 회차면 바로 보냄
    if (Number(vehicleInfo.value.total_fee) === 0) {
      viewMode.value = 'result-free'
      startTimer(3, 'idle')
      return
    }
    // pay_type에 따라 바로 분기
    viewMode.value = 'result'

    if (vehicleInfo.value.pay_type === 'AUTO') {
      // 자동결제 차량
      paymentMethodType.value = 'AUTO'
      setTimeout(() => {
        if (viewMode.value === 'result') processPayment()
      }, 5000) // 5초 뒤 결제 함수 실행
    } else {
      // 수동결제 차량 (현장결제)
      paymentMethodType.value = 'MANUAL'
      setTimeout(() => {
        if (viewMode.value === 'result') viewMode.value = 'manual-pay'
      }, 5000) // 5초 뒤 카드 삽입 화면으로
    }

  } catch (err) {
    console.error("차량 통합 조회 실패:", err)

    // 자바에서 받은 데이터
    const errorData = err.response?.data

    // 응답이 객체인지 확인하고 데이터 매칭
    if (errorData && typeof errorData === 'object') {
      // 자바에서 보낸 message가 있으면 쓰고, 없으면 기본 문구
      errorMessage.value = errorData.message || '입차 정보를 찾을 수 없습니다'
      vehicleInfo.value.vehicle_num = errorData.vehicle_num || '인식 실패'
    } else {
      // 문자열로 올 경우 대비
      errorMessage.value = errorData || '시스템 오류가 발생했습니다'
      vehicleInfo.value.vehicle_num = '인식 불가'
    }

    viewMode.value = 'result-fail'
    startTimer(5, 'idle')
  } finally {
    event.target.value = ''
  }
}

// ================================================ 이벤트 감지 및 2. 자바 API (ACR122U 제어) ================================================
// [1] 화면 상태 감시 (Watch)
watch(viewMode, async (newMode) => {
  // 화면이 바뀔 때마다 기존에 돌던 리마인드 타이머는 일단 무조건 정지 (안전장치)
  if (reminderTimer) clearTimeout(reminderTimer)
  showReminder.value = false

  // 현장 결제 화면(manual-pay) 진입 시에만 7초 타이머 가동
  if (newMode === 'manual-pay') {
    reminderTimer = setTimeout(() => {
      if (viewMode.value === 'manual-pay') {
        showReminder.value = true
      }
    }, 7000)

    try {
      console.log('[ACR122U] 자바 NFC 리더기 대기 모드 호출...')

      // 자바 8080 서버로 NFC 읽기 비동기 요청 전송
      const nfcRes = await readNfcCardReq()

      // 응답 수신 전 웹소켓(ACR39U)이 먼저 결제를 진행하여 화면이 넘어갔을 경우를 대비한 검증
      if (nfcRes.data.is_success && viewMode.value === 'manual-pay') {
        const cardUid = nfcRes.data.card_uid
        console.log(`[ACR122U] NFC 카드 태그 감지: UID = ${cardUid}`)

        paymentMethodType.value = 'MANUAL'
        // 수신된 UID를 기반으로 결제 승인 로직 호출
        await processPayment(cardUid, true)
      }
    } catch (error) {
      console.error('[ACR122U] NFC 리더기 통신 에러:', error)
      // 에러 발생 시 로그만 출력하고 화면 흐름은 웹소켓(ACR39U) 입력 대기를 위해 유지함
    }
  }
})

// [2] 하드웨어(카드리더기) 신호 처리 함수
const handleCardInput = (event) => {
  // enter키 아스키코드 == 13
  if (event.keyCode === 13 || event.key === 'Enter') {

    // 결제 대기 상태일 때만 작동
    const isWaitingPayment = viewMode.value === 'manual-pay'

    if (isWaitingPayment) {
      console.log('카드 신호 감지: 결제 프로세스 시작')
      processPayment()
    }
  }
}

// [3] 라이프사이클 훅 (Mounted / Unmounted)
onMounted(() => {
  window.addEventListener('keydown', handleCardInput)
  connectWebSocket() // 컴포넌트 마운트 시 ACR39U 웹소켓 연결
  console.log('S-HOSPITAL Kiosk System Online')
})

onUnmounted(() => {
  // 메모리 누수 방지를 위해 이벤트 리스너와 타이머 초기화
  window.removeEventListener('keydown', handleCardInput)
  stopTimer()
  if (reminderTimer) clearTimeout(reminderTimer)
})

</script>

<style scoped>
.kiosk-main-wrapper {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: linear-gradient(135deg, var(--bg-light) 0%, #e0eafc 100%);
  overflow: hidden;
}

.card-removal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.85); /* 화면 어둡게 */
  display: flex; justify-content: center; align-items: center;
  z-index: 9999; /* 무조건 맨 위 */
}
.popup-content {
  background: white; padding: 40px; border-radius: 20px; text-align: center;
}
</style>