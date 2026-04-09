<template>
  <div class="kiosk-main-wrapper">

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

    <div v-if="viewMode === 'loading'" class="screen-container screen-loading">
      <div class="spinner"></div>
      <h2 class="step-title">데이터를 조회하고 있습니다</h2>
      <p class="guide-text">잠시만 기다려 주세요</p>
    </div>

    <div v-if="viewMode === 'result'" class="screen-container screen-result">
      <h2 class="step-title">주차 요금 확인</h2>
      <div class="receipt-card">
        <div class="info-row">
          <span class="label">차량 번호</span>
          <span class="value plate-font">{{ vehicleInfo.vehicle_num }}</span>
        </div>
        <div class="info-row">
          <span class="label">회원 구분</span>
          <span class="value">{{ vehicleInfo.is_member ? '병원 등록 회원' : '비회원 (일반)' }}</span>
        </div>
        <hr class="divider" />
        <div class="detail-section">
          <div class="detail-row">
            <span>주차 이용 시간</span>
            <span>{{ vehicleInfo.total_stay_minutes }}분</span>
          </div>
          <div class="detail-row discount">
            <span>적용된 무료 시간</span>
            <span>- {{ vehicleInfo.total_free_minutes }}분</span>
          </div>
          <div v-if="vehicleInfo.ev_duration_minutes > 0" class="detail-row ev-charge">
            <span>전기차 충전 이용</span>
            <span>{{ vehicleInfo.ev_duration_minutes }}분</span>
          </div>
        </div>
        <hr class="divider thick" />
        <div class="total-row">
          <span class="label">최종 결제 금액</span>
          <span class="total-price">{{ vehicleInfo.total_fee.toLocaleString() }}원</span>
        </div>
      </div>

      <div class="action-group">
        <button v-if="vehicleInfo.total_fee === 0" class="btn-success btn-large" @click="processFreeExit">
          무료 출차하기
        </button>

        <button v-else-if="vehicleInfo.is_member && vehicleInfo.has_payment_method" class="btn-auto btn-large"
          @click="processAutoPayment">
          등록된 카드로 자동 결제
        </button>

        <button v-else class="btn-primary btn-large" @click="viewMode = 'manual-pay'">
          현장 결제 진행 (카드 삽입)
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'manual-pay'" class="screen-container screen-manual-pay">
      <h2 class="step-title">카드를 투입구에 끝까지 넣어주세요</h2>

      <div v-if="isAutoPayFailed" class="fallback-notice">
        <p>등록된 카드 결제에 실패하여 현장 결제로 전환되었습니다</p>
      </div>

      <div class="test-btn-group" style="margin-top: 30px;">
        <button class="btn-outline-test" @click="simulateManualPaySuccess">임시: 결제 성공 신호</button>
        <button class="btn-outline-test error" @click="viewMode = 'fail'">임시: 결제 실패 신호</button>
      </div>
    </div>

    <div v-if="viewMode === 'processing'" class="screen-container screen-processing">
      <div class="spinner large"></div>
      <h2 class="step-title">{{ paymentMethodType === 'AUTO' ? '자동 결제 승인 중입니다' : '현장 결제 승인 중입니다' }}</h2>
      <p class="price-display">{{ vehicleInfo.total_fee.toLocaleString() }}원</p>
    </div>

    <div v-if="viewMode === 'success'" class="screen-container screen-success">
      <div class="icon-circle success">✓</div>
      <h2 class="step-title">결제가 정상적으로 완료되었습니다</h2>
    </div>

    <div v-if="viewMode === 'fail'" class="screen-container screen-fail">
      <div class="icon-circle error">✕</div>
      <h2 class="step-title">결제 승인에 실패하였습니다</h2>
      <div class="btn-group">
        <button class="btn-primary" @click="viewMode = 'manual-pay'">다시 시도하기</button>
        <button class="btn-secondary" @click="viewMode = 'idle'">처음으로</button>
      </div>
    </div>

    <div v-if="viewMode === 'success-integrated'" class="screen-container screen-success-integrated">
      <div class="success-header">
        <div class="icon-circle success" style="margin: 0 auto 10px;">✓</div>
        <h1 class="step-title" style="color: #4caf50; font-size: 32px;">결제가 완료되었습니다</h1>
      </div>

      <div class="qr-and-farewell-box"
        style="display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: 30px;">
        <div class="qr-wrapper"
          style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <qrcode-vue :value="receiptUrl" :size="180" level="H" />
          <p style="margin-top: 10px; font-weight: bold;">
            {{ vehicleInfo.is_member ? '회원 전용 모바일 영수증' : '스캔하여 영수증 확인' }}
          </p>
        </div>

        <div class="farewell-message" style="margin-top: 20px;">
          <h2 class="highlight" style="font-size: 28px; color: #333;">안녕히 가십시오</h2>
          <p class="guide-text" style="font-size: 20px;">차단기가 열립니다 안전 운전 하세요</p>
        </div>
      </div>

      <p class="timer-text" style="margin-top: 40px; color: gray;">잠시 후 처음 화면으로 돌아갑니다</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios' 
import QrcodeVue from 'qrcode.vue'

const viewMode = ref('idle')
const manualPlateNum = ref('')
const vehicleInfo = ref({})
const isAutoPayFailed = ref(false)
const paymentMethodType = ref('MANUAL')

const receiptUrl = computed(() => {
  const logId = vehicleInfo.value.parking_log_id || 'dummy'
  const baseUrl = window.location.origin
  return vehicleInfo.value.is_member 
    ? `${baseUrl}/mypage/receipt/${logId}` 
    : `${baseUrl}/guest/receipt/${logId}`
})

const searchVehicleByManual = async () => {
  if (manualPlateNum.value.length < 4) {
    alert("번호판 4자리를 정확히 입력해주세요")
    return
  }

  viewMode.value = 'loading'
  
  try {
    // URL 수정 및 POST Body 데이터 전송
    const response = await axios.post(`http://127.0.0.1:8000/api/parking-payment/exit`, {
      vehicle_num: manualPlateNum.value
    })
    
    if (response.data) {
      vehicleInfo.value = response.data
      
      // 회원인데 결제수단 여부가 백엔드에서 안 넘어오면 임시로 true 처리
      if (vehicleInfo.value.has_payment_method === undefined) {
        vehicleInfo.value.has_payment_method = vehicleInfo.value.is_member
      }
      
      viewMode.value = 'result'
    }
  } catch (error) {
    console.error("서버 통신 에러:", error)
    // 404 에러(기록 없음) 등 파이썬이 던진 에러 메시지를 띄워줌
    const errorMsg = error.response?.data?.detail || "요금 조회 중 서버 오류가 발생했습니다"
    alert(errorMsg)
    viewMode.value = 'scan'
  }
}

// 결제 처리 로직 (결제 승인 API 연동 자리)
const processFreeExit = async () => {
  // 실제론 0원 결제 완료(출차 상태 변경) API 호출
  await processPaymentApiCall('FREE')
}

const processAutoPayment = async () => {
  paymentMethodType.value = 'AUTO'
  viewMode.value = 'processing'
  
  // 실제론 자동결제 API 호출
  const success = await processPaymentApiCall('AUTO')
  if (success) {
    triggerIntegratedSuccess()
  } else {
    isAutoPayFailed.value = true
    paymentMethodType.value = 'MANUAL'
    viewMode.value = 'manual-pay'
  }
}

const simulateManualPaySuccess = async () => {
  paymentMethodType.value = 'MANUAL'
  viewMode.value = 'processing'
  
  // 실제론 리더기 신호 받은 후, 서버에 결제 성공 상태 업데이트 API 호출
  const success = await processPaymentApiCall('MANUAL')
  if (success) triggerIntegratedSuccess()
}

const processPaymentApiCall = async (type) => {
  try {
    // 실제 파이썬 라우터(/pay)로 통신하도록 주석 해제 및 수정함!!
    const response = await axios.post(`http://127.0.0.1:8000/api/parking-payment/pay`, {
      parking_log_id: vehicleInfo.value.parking_log_id,
      pay_type: type, // 파이썬 스키마에 맞게 이름 변경
      discount_amount: 0 // 기본 할인 금액 0 세팅
    })
    
    console.log("결제 성공! 영수증:", response.data)
    
    // API 통신이 너무 빨라서 로딩 화면이 안 보일까 봐 1초 대기 타임 줌
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true 
  } catch (error) {
    console.error("결제 에러:", error)
    return false 
  }
}

const triggerIntegratedSuccess = () => {
  viewMode.value = 'success-integrated'
  setTimeout(() => { resetKiosk() }, 7000)
}

const resetKiosk = () => {
  viewMode.value = 'idle'
  manualPlateNum.value = ''
  vehicleInfo.value = {}
  isAutoPayFailed.value = false
  paymentMethodType.value = 'MANUAL'
}
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