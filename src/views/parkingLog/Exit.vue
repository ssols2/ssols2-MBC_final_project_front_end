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

    <!-- 번호판 인식 화면 (테스트용) -->
    <div v-if="viewMode === 'scan'" class="screen-container screen-scan">
      <h2 class="step-title">차량 번호 입력</h2>
      <div class="manual-input-box">
        <p class="guide-text">차량 번호 뒤 4자리를 입력해 주세요</p>

        <div class="input-group">
          <input type="text" v-model="manualPlateNum" maxlength="4" placeholder="예: 3456" class="plate-input" />
        </div>
        <div class="btn-group">
          <button class="btn-primary" @click="searchVehicleByManual">차량 조회</button>
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
                <tr v-if="vehicleInfo.total_free_minutes > 0">
                  <th>적용된 무료/할인 시간</th>
                  <td class="status-success">- {{ vehicleInfo.total_free_minutes }}분</td>
                </tr>
                <tr v-if="vehicleInfo.ev_duration_minutes > 0">
                  <th>전기차 충전 이용</th>
                  <td class="status-warn">{{ vehicleInfo.ev_duration_minutes }}분</td>
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

                <template v-if="vehicleInfo.is_member && vehicleInfo.has_payment_method">
                  <div class="auto-pay-notice pulse-animation">
                    <p class="highlight-msg">등록된 카드로 자동 결제가 진행됩니다</p>
                    <p class="sub-guide">잠시만 기다려 주십시오</p>
                  </div>
                </template>

                <template v-else>
                  <div class="manual-pay-notice">
                    <h2 class="highlight-msg">결제하실 카드를 투입구에 꽂거나 태그해 주세요</h2>
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
            <td>{{ vehicleInfo.entry_time }}</td>
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
              <h2 class="plate-num-large">{{ manualPlateNum || vehicleInfo.vehicle_num }}</h2>
            </div>

            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>조회 상태</th>
                  <td class="status-no-entry">입차 기록 없음</td>
                </tr>
                <tr>
                  <th>알림</th>
                  <td class="sub-guide">시스템상에 해당 차량의 입차 정보가 존재하지 않습니다</td>
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

            <div class="payment-methods">
              <span class="pay-badge">신용/체크카드</span>
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
        <p class="guide-text">카드를 빼지 말고 잠시만 기다려 주십시오</p>

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
                <p>등록된 카드로 결제가 완료되지 않았습니다</p>
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
                <th>결제 금액</th>
                <td class="fee-num">{{ (vehicleInfo.total_fee || 0).toLocaleString() }}원</td>
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
          <div class="timer-bar">
            <div class="timer-progress">
            </div>
          </div>
          <p class="timer-text">
            <b>{{ countdown }}초</b> 후 대기 화면으로 돌아갑니다
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { getExitFeeReq, getExitFeeByOcrReq, processPaymentReq } from '@/api/final-payment/exit.js'

// ================================================ 상태 변수 ================================================
// 화면 제어 변수
const viewMode = ref('idle')              // 현재 화면 모드
const countdown = ref(5)                  // 자동 복귀 카운트다운
const showReminder = ref(false)           // 현장결제 독촉 팝업 제어

// 입력 및 정보 변수
const manualPlateNum = ref('')            // 입력한 4자리 번호
const errorMessage = ref('')              // 결제/조회 에러 메시지
const paymentMethodType = ref('MANUAL')   // AUTO 또는 MANUAL

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
  receipt_id: ''                          // 영수증 고유 ID
})

// QR 코드에 담을 영수증 URL (computed로 동적 생성)
const receiptUrl = computed(() => {
  // 시연 시 폰에서 스캔할 수 있도록 localhost 대신 현재 접속 호스트(IP)를 사용
  const host = window.location.hostname
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
    receipt_id: ''
  }
  manualPlateNum.value = ''
  errorMessage.value = ''
  showReminder.value = false
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

// ================================================ 조회 및 판별 로직 ================================================
// 차량 조회 함수 (번호판 4자리 입력 -> 테스트용)
const searchVehicleByManual = async () => {
  if (manualPlateNum.value.length < 4) return

  viewMode.value = 'loading'

  try {
    // [상황 1] 입차 기록이 아예 없는 경우 (시나리오 외 예외)
    if (!vehicleInfo.value.vehicle_num) {
      viewMode.value = 'result-fail'
      startTimer(5, 'scan')
      return
    }

    // [상황 2] 30분 이내 무료 회차 (주차비 0원 & 충전비 0원)
    if (vehicleInfo.value.total_fee === 0 && vehicleInfo.value.ev_duration_minutes === 0) {
      viewMode.value = 'result-free'
      startTimer(5, 'idle')
      return
    }

    // [상황 3] 결제가 필요한 모든 경우 (시나리오 1~4 통합)
    viewMode.value = 'result'

    // 자동결제 회원(시나리오 1, 2)이면 5초 대기 후 결제 승인으로 자동 이동
    if (vehicleInfo.value.is_member && vehicleInfo.value.has_payment_method) {
      paymentMethodType.value = 'AUTO'
      setTimeout(() => {
        if (viewMode.value === 'result') processPayment()
      }, 5000)
    } else {
      // 현장 결제 대상자 흐름 (결과 확인 후 현장결제 화면으로 전환)
      paymentMethodType.value = 'MANUAL'
      
      // 요금 확인 화면(result) 띄운 뒤, 카드 투입 화면(manual-pay)으로 자동 전환
      setTimeout(() => {
        if (viewMode.value === 'result') {
          viewMode.value = 'manual-pay'
        }
      }, 7000) 
    }
  } catch (err) {
    viewMode.value = 'result-fail'
    startTimer(5, 'scan')
  }
}

// ================================================ 결제 승인 로직 ================================================
// 결제 실행 함수
const processPayment = async () => {
  // 독촉 팝업이 떠있었다면 즉시 닫기
  showReminder.value = false
  viewMode.value = 'payment-processing'

  try {
    // '승인 중' 화면을 유지함
    await new Promise(resolve => setTimeout(resolve, 3000))

    // [성공 시]
    viewMode.value = 'success-integrated'
    // 성공 시엔 모든 데이터를 치우고 7초 뒤 처음으로
    startTimer(5, 'idle') 

  } catch (err) {
    // [실패 시]
    errorMessage.value = '결제 처리에 실패하였습니다. 다시 시도해 주십시오.'
    viewMode.value = 'payment-fail'

    // 실패 시에는 데이터를 유지한 채 다시 카드 태그 화면으로
    paymentMethodType.value = 'MANUAL'
    startTimer(3, 'manual-pay')
  }
}

// ================================================ 이벤트 감지 로직 ================================================
// [1] 화면 상태 감시 (Watch)
watch(viewMode, (newMode) => {
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
  // 윈도우 전체에서 키보드(리더기) 신호를 감시함
  window.addEventListener('keydown', handleCardInput)
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
</style>