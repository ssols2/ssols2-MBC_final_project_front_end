<template>
  <div class="kiosk-main-wrapper">

    <!-- 고객 무반응 타임아웃 -->
    <div v-if="showReminder" class="screen-flash-overlay">
      <div class="massive-reminder-popup bounce-animation">
        <svg viewBox="0 0 24 24" style="width: 100px; height: 100px; color: #fff; margin-bottom: 20px;">
          <path fill="currentColor"
            d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2,0,0,0 4,20H20A2,2,0,0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
        </svg>
        <h2>{{ t.reminderMsg }}</h2>
      </div>
    </div>

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
      <h2 class="step-title">주차장 출차 안내</h2>
      <div class="manual-input-box">
        <p class="guide-text">인식할 차량의 사진을 선택해 주세요</p>

        <div class="upload-section">
          <label for="exitFileInput" class="professional-btn">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor"
                d="M4,4H7L9,2H15L17,4H20A2,2,0,0,1,22,6V18A2,2,0,0,1,20,20H4A2,2,0,0,1,2,18V6A2,2,0,0,1,4,4M12,7A5,5,0,1,0,17,12A5,5,0,0,0,12,7M12,9A3,3,0,1,1,9,12A3,3,0,0,1,12,9Z" />
            </svg>
            차량 사진 선택하기
          </label>
          <input type="file" id="exitFileInput" @change="handleFileUpload" accept="image/*" hidden />
        </div>
      </div>
    </div>

    <!-- 번호판 인식중 화면 - 로딩화면 (공통) -->
    <div v-if="viewMode === 'loading'" class="screen-container screen-loading">
      <div class="modern-spinner"></div>
      <h2 class="step-title">AI 번호판 인식 중...</h2>
      <p class="guide-text">잠시만 기다려 주십시오</p>
    </div>

    <!-- 결과1: 번호판 인식 결과 화면 -->
    <div v-if="viewMode === 'result'" class="screen-container screen-result">
      <div class="center-content">
        <h1 class="page-title highlight-title">{{ t.resultTitle }}</h1>

        <div class="result-card-container">
          <div class="info-card">
            <h2 class="card-title">{{ t.infoCardTitle }}</h2>

            <div class="image-grid">
              <div class="image-box">
                <div class="image-wrapper">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="원본 차량 사진"
                    class="captured-img" />
                </div>
              </div>
              <div class="image-box">
                <div class="image-wrapper plate-wrapper">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="번호판 사진"
                    class="captured-img" />
                </div>
              </div>
            </div>

            <div class="payment-branch">
              <template v-if="paymentMethodType === 'AUTO'">
                <div class="auto-pay-notice pulse-animation">
                  <p class="highlight-msg">{{ t.autoPayNotice }}</p>
                  <p class="sub-guide">{{ t.loadingGuide }}</p>
                </div>
              </template>
              <template v-else>
                <div class="manual-pay-notice">
                  <h2 class="highlight-msg">{{ t.manualPayNotice }}</h2>
                  <p class="sub-guide">{{ t.prepareCard }}</p>
                </div>
              </template>
            </div>
          </div>

          <div class="info-card data-card">
            <h2 class="card-title">{{ t.paymentCardTitle }}</h2>
            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>{{ t.vehicleNum }}</th>
                  <td class="plate-num">
                    {{ vehicleInfo.vehicle_num }}
                    <span v-if="vehicleInfo.is_member" class="badge member-badge">{{ t.memberCar }}</span>
                    <span v-else class="badge normal-badge">{{ t.guestCar }}</span>
                  </td>
                </tr>
                <tr>
                  <th>{{ t.country }}</th>
                  <td>
                    <span class="badge country-badge">{{ vehicleInfo.license_plate_country }}</span>
                  </td>
                </tr>
                <tr>
                  <th>{{ t.entryTime }}</th>
                  <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
                </tr>
                <!-- <tr>
                  <th>{{ t.parkingSpot }}</th>
                  <td style="color: #1976d2; font-weight: bold;">{{ translatedSpot }}</td>
                </tr> -->
                <tr>
                  <th>{{ t.stayTime }}</th>
                  <td>{{ vehicleInfo.total_stay_minutes || 0 }}{{ t.minute }}</td>
                </tr>
                <tr>
                  <th>{{ t.parkingFee }}</th>
                  <td>{{ (vehicleInfo.parking_fee || 0).toLocaleString() }}{{ t.currency }}</td>
                </tr>

                <template v-if="vehicleInfo.ev_charging_fee > 0">
                  <tr>
                    <th>{{ t.evTime }}</th>
                    <td style="color: #4caf50; font-weight: bold;">{{ vehicleInfo.ev_duration_minutes || 0 }}{{ t.minute
                    }}</td>
                  </tr>
                  <tr>
                    <th>{{ t.evFee }}</th>
                    <td class="status-warn" style="color: #ff9800; font-weight: bold;">
                      + {{ (vehicleInfo.ev_charging_fee || 0).toLocaleString() }}{{ t.currency }}
                    </td>
                  </tr>
                </template>

                <tr v-if="vehicleInfo.total_free_minutes > 0">
                  <th>{{ t.discountTime }}</th>
                  <td class="status-success">- {{ vehicleInfo.total_free_minutes }}{{ t.minute }}</td>
                </tr>
              </table>
            </div>

            <div class="zone-action">
              <div class="total-fee-box">
                <p>{{ t.totalFee }}</p>
                <h2 class="fee-amount">
                  {{ (vehicleInfo.total_fee || 0).toLocaleString() }}<span>{{ t.currency }}</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 결과2: 무료 회차 화면 -->
    <div v-if="viewMode === 'result-free'" class="screen-container screen-result-free">
      <div class="center-content">
        <h1 class="page-title highlight-title free-page-title">{{ t.resultTitle }}</h1>

        <div class="result-card-container free-card-container">

          <div class="info-card free-info-card">
            <h2 class="card-title free-card-title">{{ t.infoCardTitle }}</h2>
            <div class="image-grid free-image-grid">
              <div class="image-box">
                <div class="image-wrapper free-img-top">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="원본 차량 사진"
                    class="captured-img" />
                </div>
              </div>
              <div class="image-box">
                <div class="image-wrapper plate-wrapper free-img-bottom">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="번호판 사진"
                    class="captured-img" />
                </div>
              </div>
            </div>
          </div>

          <div class="info-card data-card free-info-card">
            <h2 class="card-title free-card-title">{{ t.paymentCardTitle }}</h2>
            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>{{ t.vehicleNum }}</th>
                  <td class="plate-num">
                    {{ vehicleInfo.vehicle_num }}
                    <span v-if="vehicleInfo.is_member" class="badge member-badge">{{ t.memberCar }}</span>
                    <span v-else class="badge normal-badge">{{ t.guestCar }}</span>
                  </td>
                </tr>
                <tr>
                  <th>{{ t.country }}</th>
                  <td>
                    <span class="badge country-badge">{{ vehicleInfo.license_plate_country }}</span>
                  </td>
                </tr>
                <tr>
                  <th>{{ t.entryTime }}</th>
                  <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
                </tr>
                <!-- <tr>
                  <th>{{ t.parkingSpot }}</th>
                  <td class="bold-val">{{ translatedSpot }}</td>
                </tr> -->
                <tr>
                  <th>{{ t.totalStay }}</th>
                  <td>{{ vehicleInfo.total_stay_minutes }}{{ t.minute }}</td>
                </tr>
                <tr>
                  <th>{{ t.paymentAmount }}</th>
                  <td class="status-success free-fee-text">{{ t.freeFee }}</td>
                </tr>
              </table>
            </div>

            <div class="full-width-banner pulse-animation free-banner" style="margin-top: 20px;">
              <h2 class="highlight-msg free-banner-text" style="color: #fbb900;">
                {{ t.freeGuide1 }} &nbsp;|&nbsp; {{ t.freeGuide2 }}
              </h2>
            </div>
          </div>

        </div>

        <div class="timer-section free-timer-section">
          <div class="timer-bar free-timer-bar">
            <div class="timer-progress" :style="{ width: (countdown / 3) * 100 + '%' }"></div>
          </div>
          <p class="timer-text free-timer-text">
            <b>{{ countdown }}</b>{{ t.secToHome }}
          </p>
        </div>

      </div>
    </div>

    <!-- 결과3: 차량 조회 실패 화면 -->
    <div v-if="viewMode === 'result-fail'" class="screen-container screen-result-fail">
      <div class="center-content">

        <h1 class="page-title highlight-title">{{ t.failTitle }}</h1>

        <div class="result-card-container">
          <div class="info-card">
            <h2 class="card-title">{{ t.infoCardTitle }}</h2>

            <div class="image-grid">
              <div class="image-box">
                <div class="image-wrapper">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="원본 차량 사진"
                    class="captured-img" />
                </div>
              </div>
              <div class="image-box">
                <div class="image-wrapper plate-wrapper">
                  <img :src="vehicleInfo.plate_image_url || '/assets/default-plate.png'" alt="번호판 사진"
                    class="captured-img" />
                </div>
              </div>
            </div>
          </div>

          <div class="info-card data-card">
            <h2 class="card-title warning-title">{{ t.errorCardTitle }}</h2>
            <div class="zone-comprehension">
              <table class="res-table">
                <tr>
                  <th>{{ t.searchStatus }}</th>
                  <td class="status-no-entry">{{ t.noEntry }}</td>
                </tr>
                <tr>
                  <th>{{ t.alert }}</th>
                  <td class="sub-guide">{{ t.noEntryInfo2 }}
                  </td>
                </tr>
              </table>
            </div>

            <div class="zone-action">
              <div class="error-visual-box compact">
                <svg viewBox="0 0 24 24" class="svg-error" style="margin-top: 20px; margin-bottom: -15px;">
                  <path fill="currentColor"
                    d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
                </svg>
              </div>

              <div class="retry-guidance">
                <h2 class="highlight-msg">{{ t.noEntryNotice }}</h2>
                <p class="sub-guide">{{ t.noEntryGuide }}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- 현장 결제 화면 -->
    <div v-if="viewMode === 'manual-pay'" class="screen-container screen-manual-pay">
      <div class="center-content">

        <h1 class="page-title highlight-title">{{ t.manualPayTitle }}</h1>

        <div class="result-card-container single-center">
          <div class="info-card kiosk-strict-layout">
            <table class="pay-summary-table">
              <tr>
                <th>{{ t.vehicleNum }}:</th>
                <td class="bold-val">{{ vehicleInfo.vehicle_num }}</td>
              </tr>
              <tr>
                <th>{{ t.entryTime }}:</th>
                <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
              </tr>
            </table>

            <div class="massive-pay-box">
              <p class="pay-label">{{ t.totalFee }}:</p>
              <h1 class="massive-amount">
                {{ vehicleInfo.total_fee.toLocaleString() }} <span class="currency">{{ t.currency }}</span>
              </h1>
            </div>

            <div class="insert-card-action pulse-animation">
              <svg viewBox="0 0 24 24" class="massive-card-icon">
                <path fill="currentColor"
                  d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2,0,0,0 4,20H20A2,2,0,0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
              </svg>
              <h2 class="insert-text">{{ t.insertCard }}</h2>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 결제 승인 중 강제 딜레이 -->
    <div v-if="viewMode === 'payment-processing'" class="screen-container screen-payment-processing">
      <div class="center-content">
        <div class="modern-spinner large"></div>
        <h2 class="step-title">{{ paymentMethodType === 'AUTO' ? t.autoProcessing : t.manualProcessing }}</h2>
        <p class="guide-text">{{ t.loadingGuide }}</p>

        <!-- <div class="price-display">
          <span>{{ (vehicleInfo.total_fee || 0).toLocaleString() }}</span>{{ t.currency }}
        </div> -->
      </div>
    </div>

    <!-- 결제 실패 및 재시도 유도 화면 (공통) -->
    <div v-if="viewMode === 'payment-fail'" class="screen-container screen-payment-fail">
      <div class="center-content">
        <h1 class="page-title error-title">
          {{ paymentMethodType === 'AUTO' ? t.autoFail : t.manualFail }}
        </h1>

        <div class="result-card-container single">
          <div class="info-card data-card">

            <div class="error-visual-box compact">
              <svg viewBox="0 0 24 24" class="svg-error">
                <path fill="currentColor"
                  d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
              </svg>
              <h2>{{ t.failMsg }}</h2>
            </div>
            <p class="sub-guide"><span>{{ errorMessage }}</span></p>
            <hr class="divider" />
            <div class="retry-guidance pulse-animation">
              <template v-if="paymentMethodType === 'AUTO'">
                <p style="color: #005baa; font-weight: bold; text-align: center; font-size: 20px;">{{ t.retryAuto }}</p>
              </template>

              <template v-else>
                <p style="color: #005baa; font-weight: bold; text-align: center; font-size: 20px;">{{ t.retryManual }}
                </p>
              </template>

              <p style="margin-top: 10px; color: #888; text-align: center;">{{ t.needHelp }}</p>
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
          <h1 class="page-title highlight-title">{{ t.successTitle }}</h1>
        </div>

        <div class="result-card-container single">
          <div class="info-card data-card success-card-fix">

            <table class="res-table">
              <tr>
                <th>{{ t.vehicleNum }}</th>
                <td>{{ vehicleInfo.vehicle_num }}</td>
              </tr>
              <tr>
                <th>{{ t.entryTime }}</th>
                <td>{{ formatDateTime(vehicleInfo.entry_time) }}</td>
              </tr>
              <tr>
                <th>{{ t.paymentAmount }}</th>
                <td class="fee-num">{{ (vehicleInfo.total_fee || 0).toLocaleString() }}{{ t.currency }}</td>
              </tr>
              <tr v-if="vehicleInfo.ev_charging_fee > 0">
                <th>{{ t.evTime }}</th>
                <td>{{ vehicleInfo.ev_duration_minutes || 0 }}{{ t.minute }}</td>
              </tr>
              <tr>
                <th>{{ t.payType }}</th>
                <td>
                  {{ paymentMethodType === 'AUTO' ? t.payAuto : t.payManual }}
                </td>
              </tr>
            </table>
            <hr class="divider" />

            <div class="qr-and-farewell-box">
              <!-- <div class="qr-wrapper">
                <div>
                  <qrcode-vue :value="receiptUrl" :size="150" level="H" />
                </div>
                <p>
                  {{ vehicleInfo.is_member ? t.receiptMember : t.receiptGuest }}
                </p>
              </div> -->

              <div class="farewell-message">
                <h2 class="highlight">{{ t.goodbye }}</h2>
                <p class="guide-text">{{ t.openGate }}</p>
              </div>
            </div>

          </div>
        </div>

        <div class="timer-section">
          <div class="timer-bar" v-if="!isCardInserted">
            <div class="timer-progress" :style="{ width: (countdown / totalCountdown) * 100 + '%' }"></div>
          </div>
          <p class="timer-text">
            <template v-if="isCardInserted && paymentMethodType === 'MANUAL'">
              <b style="color: #d32f2f; font-size: 1.2rem;">{{ t.warnRemoveCard }}</b>
            </template>
            <template v-else>
              <b>{{ countdown }}</b>{{ t.secToHome }}
            </template>
          </p>
        </div>

        <div v-if="showCardRemovalPopup && paymentMethodType === 'MANUAL'" class="card-removal-overlay">
          <div class="popup-content bounce-animation">
            <svg viewBox="0 0 24 24" style="width: 100px; height: 100px; color: #ff0015; margin-bottom: 20px;">
              <path fill="currentColor" d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" />
            </svg>
            <h2 class="error-title" style="margin-bottom: 10px;">{{ t.pullCardTitle }}</h2>
            <p style="font-size: 26px; color: #444; font-weight: 600;">{{ t.pullCardDesc }}</p>
            <div class="arrow-down-animation">↓</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
// npm install qrcode.vue 해야함!
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import axios from 'axios'
import { getExitFeeByOcrReq, processPaymentReq, readNfcCardReq } from '@/api/parking/exit.js'

// ================================================ 국가별 다국어 번역 데이터 ================================================
const TRANSLATIONS = {
  KOR: {
    locale: 'ko-KR',
    floor: '층',
    touchSubMsg: '화면을 터치하여 출차를 시작합니다',
    scanTitle: '차량 번호판 이미지 업로드',
    scanGuide: '인식할 차량의 사진을 선택해 주세요',
    scanBtn: '차량 사진 선택하기',
    btnHome: '처음으로',
    loadingTitle: '번호판 인식 중...',
    loadingGuide: '잠시만 기다려 주십시오',
    infoCardTitle: '인식 차량 정보',
    paymentCardTitle: '결제 상세 내역',
    errorCardTitle: '오류 상세',
    resultTitle: '차량 확인 및 주차 요금 정산',
    entryTime: '입차 시각',
    parkingSpot: '주차 위치',
    memberType: '회원 구분',
    memberCar: '회원 차량',
    guestCar: '일반 차량',
    country: '국가',
    stayTime: '주차 이용 시간',
    parkingFee: '주차 요금',
    evTime: '전기차 충전 시간',
    evFee: '전기차 충전 요금',
    discountTime: '무료/할인 시간',
    totalFee: '최종 결제 금액',
    autoPayNotice: '등록된 카드로 자동 결제가 진행됩니다',
    manualPayNotice: '현장 결제 화면으로 이동합니다',
    prepareCard: '카드를 준비해 주십시오',
    exitConfirm: '출차 확인',
    vehicleNum: '차량 번호',
    totalStay: '총 주차 시간',
    paymentAmount: '결제 금액',
    freeFee: '0원 (무료)',
    freeGuide1: '30분 이내 회차 차량입니다',
    freeGuide2: '안녕히 가십시오',
    returnHome: '잠시 후 처음 화면으로 돌아갑니다',
    failTitle: '차량 조회 실패',
    searchStatus: '조회 상태',
    noEntry: '입차 기록 없음',
    alert: '알림',
    noEntryInfo1: '시스템상에',
    noEntryInfo2: '차량의 입차 정보가 존재하지 않습니다',
    noEntryNotice: '입차 정보를 확인할 수 없습니다',
    noEntryGuide: '번호를 다시 확인하시거나 하단의 직원 호출 버튼을 눌러주세요',
    manualPayTitle: '현장 결제 진행',
    payCar: '결제 차량',
    insertCard: '카드를 투입구에 꽂거나 단말기에 태그해 주세요',
    reminderMsg: '결제가 대기 중입니다. 카드를 꽂거나 리더기에 태그해 주세요!',
    autoProcessing: '자동 결제 승인 중입니다',
    manualProcessing: '현장 결제 승인 중입니다',
    autoFail: '자동 결제 승인 실패',
    manualFail: '결제 승인 실패',
    failMsg: '결제 처리에 실패하였습니다',
    retryAuto: '투입구에 카드를 꽂거나 태그하여 현장 결제를 진행해 주세요',
    retryManual: '카드를 빼신 후 다른 카드로 다시 꽂거나 태그해 주세요',
    needHelp: '(도움이 필요하시면 화면 아래의 직원 호출을 눌러주세요)',
    successTitle: '결제가 완료되었습니다',
    payType: '결제 구분',
    payAuto: '등록카드 자동결제',
    payManual: '현장 결제',
    receiptMember: '회원 전용 모바일 영수증',
    receiptGuest: '스캔하여 영수증 확인',
    goodbye: '안녕히 가십시오',
    openGate: '차단기가 열립니다 안전 운행하세요',
    warnRemoveCard: '⚠️ 카드를 뽑으시면 메인 화면으로 돌아갑니다',
    secToHome: '초 후 대기 화면으로 돌아갑니다',
    pullCardTitle: '카드를 투입구에서 뽑아주세요!',
    pullCardDesc: '카드를 제거하셔야 결제가 최종 완료됩니다',
    currency: '원',
    minute: '분'
  },
  BRA: {
    locale: 'pt-BR', floor: 'F',
    touchSubMsg: 'Toque na tela para iniciar a saída',
    scanTitle: 'Upload de Imagem', scanGuide: 'Por favor, selecione a foto do veículo', scanBtn: 'Selecionar Foto', btnHome: 'Início',
    loadingTitle: 'Reconhecendo placa...', loadingGuide: 'Por favor, aguarde',
    resultTitle: 'Verificação e Pagamento',
    infoCardTitle: 'Informações do Veículo',
    paymentCardTitle: 'Detalhes do Pagamento',
    errorCardTitle: 'Detalhes do Erro',
    entryTime: 'Hora de Entrada', parkingSpot: 'Vaga de Estacionamento', memberType: 'Tipo de Membro', memberCar: 'Membro', guestCar: 'Comum', country: 'País',
    stayTime: 'Tempo de Permanência', parkingFee: 'Taxa de Estacionamento', evTime: 'Tempo de Recarga EV', evFee: 'Taxa de Recarga EV', discountTime: 'Tempo de Desconto', totalFee: 'Valor Final',
    autoPayNotice: 'Pagamento automático com cartão registrado', manualPayNotice: 'Redirecionando para pagamento', prepareCard: 'Prepare seu cartão',
    exitConfirm: 'Confirmação de Saída', vehicleNum: 'Placa', totalStay: 'Tempo Total', paymentAmount: 'Valor', freeFee: '$0 (Gratuito)', freeGuide1: 'Veículo saindo dentro de 30 minutos', freeGuide2: 'Tenha uma boa viagem', returnHome: 'Retornando à tela inicial',
    failTitle: 'Falha na Busca', searchStatus: 'Status da Busca', noEntry: 'Sem Registro de Entrada', alert: 'Aviso', noEntryInfo1: 'A placa', noEntryInfo2: 'não possui registro', noEntryNotice: 'Informação não encontrada', noEntryGuide: 'Verifique a placa ou chame um funcionário',
    manualPayTitle: 'Pagamento Presencial', payCar: 'Veículo a Pagar', insertCard: 'Insira ou aproxime o cartão', reminderMsg: 'Aguardando pagamento!',
    autoProcessing: 'Processando Pagamento Automático', manualProcessing: 'Processando Pagamento', autoFail: 'Falha no Pagamento Automático', manualFail: 'Falha no Pagamento', failMsg: 'O pagamento falhou', retryAuto: 'Aproxime o cartão para pagamento presencial', retryManual: 'Tente novamente com outro cartão', needHelp: '(Se precisar de ajuda, chame um funcionário)',
    successTitle: 'Pagamento Concluído', payType: 'Método', payAuto: 'Pagamento Automático', payManual: 'Pagamento Presencial', receiptMember: 'Recibo Mobile', receiptGuest: 'Escaneie para o Recibo', goodbye: 'Tenha uma boa viagem', openGate: 'A cancela abrirá',
    warnRemoveCard: '⚠️ Retornará à tela inicial se o cartão for removido', secToHome: ' seg(s) para retornar', pullCardTitle: 'Retire o cartão!', pullCardDesc: 'O pagamento será finalizado ao retirar',
    currency: ' $', minute: ' min'
  },
  CHN: {
    locale: 'zh-CN', floor: '层',
    touchSubMsg: '触摸屏幕开始出场',
    scanTitle: '上传车牌图片', scanGuide: '请选择车辆图片', scanBtn: '选择车辆图片', btnHome: '返回首页',
    loadingTitle: '车牌识别中...', loadingGuide: '请稍候',
    resultTitle: '车辆确认与结算',
    infoCardTitle: '识别车辆信息',
    paymentCardTitle: '结算详细信息',
    errorCardTitle: '错误详情',
    entryTime: '入场时间', parkingSpot: '停车位置', memberType: '会员类型', memberCar: '会员车辆', guestCar: '普通车辆', country: '国家',
    stayTime: '停车时长', parkingFee: '停车费', evTime: '充电时间', evFee: '充电费', discountTime: '折扣时间', totalFee: '最终金额',
    autoPayNotice: '使用已注册银行卡自动扣款', manualPayNotice: '正在跳转现场支付', prepareCard: '请准备好银行卡',
    exitConfirm: '出场确认', vehicleNum: '车牌号', totalStay: '总时长', paymentAmount: '结算金额', freeFee: '0元 (免费)', freeGuide1: '30分钟内离场', freeGuide2: '祝您一路平安', returnHome: '稍后返回首页',
    failTitle: '查询失败', searchStatus: '查询状态', noEntry: '无入场记录', alert: '提醒', noEntryInfo1: '系统中不存在', noEntryInfo2: '车辆的入场信息', noEntryNotice: '无法确认入场信息', noEntryGuide: '请确认车牌号或呼叫员工',
    manualPayTitle: '现场支付', payCar: '结算车辆', insertCard: '请插入或刷银行卡', reminderMsg: '等待支付中。请插卡或刷卡！',
    autoProcessing: '自动支付处理中', manualProcessing: '支付处理中', autoFail: '自动支付失败', manualFail: '支付失败', failMsg: '支付处理失败', retryAuto: '请刷卡进行现场支付', retryManual: '请拔卡后重试', needHelp: '(如需帮助，请呼叫员工)',
    successTitle: '支付已完成', payType: '支付方式', payAuto: '自动支付', payManual: '现场支付', receiptMember: '会员电子小票', receiptGuest: '扫描查看小票', goodbye: '祝您一路平安', openGate: '闸机已开启',
    warnRemoveCard: '⚠️ 拔卡将返回主屏幕', secToHome: '秒后返回', pullCardTitle: '请拔出银行卡！', pullCardDesc: '拔卡后支付完成',
    currency: '元', minute: '分'
  },
  EUR: {
    locale: 'en-GB', floor: 'F',
    touchSubMsg: 'Touch the screen to start exiting',
    scanTitle: 'Upload License Plate', scanGuide: 'Please select an image of the vehicle', scanBtn: 'Select Image', btnHome: 'Home',
    loadingTitle: 'Recognizing Plate...', loadingGuide: 'Please wait',
    resultTitle: 'Vehicle Verification & Payment',
    infoCardTitle: 'Recognized Vehicle',
    paymentCardTitle: 'Payment Details',
    errorCardTitle: 'Error Details',
    entryTime: 'Entry Time', parkingSpot: 'Parking Spot', memberType: 'Member Type', memberCar: 'Member', guestCar: 'Guest', country: 'Country',
    stayTime: 'Parking Duration', parkingFee: 'Parking Fee', evTime: 'EV Charging Time', evFee: 'EV Fee', discountTime: 'Discount Time', totalFee: 'Total Amount',
    autoPayNotice: 'Auto-payment with registered card', manualPayNotice: 'Moving to manual payment', prepareCard: 'Please prepare your card',
    exitConfirm: 'Exit Confirmation', vehicleNum: 'Vehicle Number', totalStay: 'Total Stay', paymentAmount: 'Amount', freeFee: '$0 (Free)', freeGuide1: 'Exiting within 30 minutes', freeGuide2: 'Have a safe trip', returnHome: 'Returning home shortly',
    failTitle: 'Search Failed', searchStatus: 'Search Status', noEntry: 'No Entry Record', alert: 'Alert', noEntryInfo1: 'No entry record for', noEntryInfo2: 'in the system', noEntryNotice: 'Entry info not verified', noEntryGuide: 'Check the number or call staff',
    manualPayTitle: 'Manual Payment', payCar: 'Vehicle', insertCard: 'Insert or tap your card', reminderMsg: 'Payment pending. Insert or tap card!',
    autoProcessing: 'Processing auto-payment', manualProcessing: 'Processing payment', autoFail: 'Auto-Payment Failed', manualFail: 'Payment Failed', failMsg: 'Payment failed', retryAuto: 'Tap card for manual payment', retryManual: 'Remove card and try again', needHelp: '(Press call button for help)',
    successTitle: 'Payment Completed', payType: 'Payment Method', payAuto: 'Auto-Pay', payManual: 'Manual Payment', receiptMember: 'Mobile Receipt', receiptGuest: 'Scan for Receipt', goodbye: 'Have a safe trip', openGate: 'Gate is opening',
    warnRemoveCard: '⚠️ Removing card returns to home', secToHome: ' sec(s) to standby', pullCardTitle: 'Please remove your card!', pullCardDesc: 'Payment finalized upon removal',
    currency: '', minute: ' min'
  },
  IND: {
    locale: 'hi-IN', floor: 'F',
    touchSubMsg: 'बाहर निकलने के लिए स्क्रीन को स्पर्श करें',
    scanTitle: 'छवि अपलोड', scanGuide: 'वाहन की तस्वीर चुनें', scanBtn: 'तस्वीर चुनें', btnHome: 'होम',
    loadingTitle: 'नंबर प्लेट पहचानी जा रही है...', loadingGuide: 'कृपया प्रतीक्षा करें',
    resultTitle: 'वाहन सत्यापन और भुगतान',
    infoCardTitle: 'पहचाना गया वाहन',
    paymentCardTitle: 'भुगतान विवरण',
    errorCardTitle: 'त्रुटि विवरण',
    entryTime: 'प्रवेश समय', parkingSpot: 'पार्किंग स्थान', memberType: 'सदस्य प्रकार', memberCar: 'सदस्य', guestCar: 'सामान्य', country: 'देश',
    stayTime: 'पार्किंग अवधि', parkingFee: 'पार्किंग शुल्क', evTime: 'EV चार्जिंग समय', evFee: 'EV शुल्क', discountTime: 'छूट समय', totalFee: 'कुल राशि',
    autoPayNotice: 'पंजीकृत कार्ड से स्वचालित भुगतान', manualPayNotice: 'मैनुअल भुगतान स्क्रीन पर जा रहे हैं', prepareCard: 'कार्ड तैयार रखें',
    exitConfirm: 'निकास की पुष्टि', vehicleNum: 'वाहन संख्या', totalStay: 'कुल समय', paymentAmount: 'राशि', freeFee: '₹0 (मुफ्त)', freeGuide1: '30 मिनट के भीतर बाहर निकलना', freeGuide2: 'यात्रा सुरक्षित हो', returnHome: 'जल्द ही वापस लौट रहे हैं',
    failTitle: 'खोज विफल', searchStatus: 'खोज स्थिति', noEntry: 'कोई रिकॉर्ड नहीं', alert: 'चेतावनी', noEntryInfo1: 'सिस्टम में', noEntryInfo2: 'का कोई रिकॉर्ड नहीं', noEntryNotice: 'प्रवेश की पुष्टि नहीं हो सकी', noEntryGuide: 'नंबर जांचें या स्टाफ को बुलाएं',
    manualPayTitle: 'मैनुअल भुगतान', payCar: 'वाहन', insertCard: 'अपना कार्ड डालें या टैप करें', reminderMsg: 'भुगतान लंबित है। कार्ड डालें!',
    autoProcessing: 'स्वचालित भुगतान की प्रक्रिया', manualProcessing: 'मैनुअल भुगतान की प्रक्रिया', autoFail: 'स्वचालित भुगतान विफल', manualFail: 'भुगतान विफल', failMsg: 'भुगतान विफल रहा', retryAuto: 'मैनुअल भुगतान के लिए कार्ड टैप करें', retryManual: 'कार्ड निकालें और पुनः प्रयास करें', needHelp: '(मदद के लिए कॉल बटन दबाएं)',
    successTitle: 'भुगतान पूरा हुआ', payType: 'भुगतान विधि', payAuto: 'स्वचालित भुगतान', payManual: 'मैनुअल भुगतान', receiptMember: 'मोबाइल रसीद', receiptGuest: 'रसीद के लिए स्कैन करें', goodbye: 'यात्रा सुरक्षित हो', openGate: 'गेट खुल रहा है',
    warnRemoveCard: '⚠️ कार्ड निकालने पर होम पर लौटेंगे', secToHome: ' सेकंड बाद वापस', pullCardTitle: 'अपना कार्ड निकालें!', pullCardDesc: 'कार्ड निकालने के बाद भुगतान पूरा होगा',
    currency: '₹', minute: ' मिनट'
  }
}

// ================================================ 상태 변수 ================================================
// 화면 제어 변수
const viewMode = ref('idle')              // 현재 화면 모드
const countdown = ref(5)                  // 자동 복귀 카운트다운
const showReminder = ref(false)           // 현장결제 독촉 팝업 제어
const totalCountdown = ref(7)             // 결제 성공 후 복귀 카운트다운

const showCardRemovalPopup = ref(false)
let removalReminderTimer = null // 팝업 지연용 타이머 변수

// 입력 및 정보 변수
const errorMessage = ref('')              // 결제/조회 에러 메시지
const paymentMethodType = ref('MANUAL')   // AUTO 또는 MANUAL
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


// 백엔드에서 내려주는 국가 코드(KR, BR 등)를 TRANSLATIONS 키값(KOR, BRA 등)에 맞게 안전하게 변환해 주는 로직 
const t = computed(() => {
  const c = vehicleInfo.value.license_plate_country;
  const code = (c === 'KR' || c === 'KOR') ? 'KOR' :
    (c === 'BR' || c === 'BRA') ? 'BRA' :
      (c === 'CN' || c === 'CHN') ? 'CHN' :
        (c === 'EU' || c === 'EUR') ? 'EUR' :
          (c === 'IN' || c === 'IND') ? 'IND' : 'KOR';
  return TRANSLATIONS[code] || TRANSLATIONS['KOR'];
});

// 위치 정보 다국어 번역 로직 (예: "B1층 A-3" -> "B1F A-3")
const translatedSpot = computed(() => {
  if (!vehicleInfo.value.parked_location || vehicleInfo.value.parked_location === '-') return '-';
  return vehicleInfo.value.parked_location.replace('층', t.value.floor);
});

// 날짜 포맷 변환 함수 (0000년 00월 00일 00시 00분 00초)
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString(t.value.locale, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

// // QR 코드에 담을 영수증 URL (computed로 동적 생성)
// const receiptUrl = computed(() => {
//   // 시연 시 폰에서 스캔할 수 있도록 localhost 대신 현재 접속 호스트(IP)를 사용
//   const host = "192.168.137.178"
//   const port = window.location.port
//   return `http://${host}:${port}/receipt/${vehicleInfo.value.receipt_id}`
// })

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
  totalCountdown.value = seconds

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

// ================================================ 파이썬 웹소켓 (ACR39U 제어) ================================================
let ws = null // 웹소켓 객체

const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:9090')

  ws.onopen = () => console.log('로컬 에이전트(ACR39U) 웹소켓 연결 성공')

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data)
    console.log('웹소켓 수신 데이터:', data)

    if (data.type === 'card_detected') {
      // [추가] 물리적으로 카드가 들어왔음을 상태 변수에 저장 (팝업 트리거)
      isCardInserted.value = true

      // 수동 결제 모드이거나 결제 실패 화면일 때만 IC 카드 결제 시도
      const canAcceptCard = viewMode.value === 'manual-pay' || viewMode.value === 'payment-fail'

      if (data.type === 'card_detected' && canAcceptCard) {
        const cleanAtr = data.atr.replace(/\s+/g, '').toUpperCase()
        paymentMethodType.value = 'MANUAL'
        console.log(`[ACR39U] IC 카드 삽입 감지: ATR = ${cleanAtr}`)
        await processPayment(cleanAtr, false)
      }
    }
    else if (data.type === 'card_removed') {
      // [추가] 카드가 나갔으니 상태를 해제하여 팝업을 닫음
      isCardInserted.value = false
      console.log('카드가 제거되었습니다.')
      showCardRemovalPopup.value = false // 카드가 빠지면 팝업 즉시 닫기
      if (removalReminderTimer) clearTimeout(removalReminderTimer) // 타이머도 취소

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

// ================================================ ACR122U 연결 확인용 ================================================
// 마지막으로 읽은 카드 UID를 저장할 변수
const lastUid = ref('')

const startNfcContinuousScanner = async () => {
    console.log('로컬 에이전트(ACR122U) 웹소켓 연결 성공')
    while (true) {
        try {
            // 자바 서버에 카드 읽기 요청 (카드가 대져 있을 때까지 기다림)
            const nfcRes = await readNfcCardReq()
            
            if (nfcRes.data.is_success) {
                const uid = nfcRes.data.card_uid
                
                // 이전에 읽은 카드와 다를 때만 로그를 딱 한 번 찍음
                if (uid !== lastUid.value) {
                    lastUid.value = uid // 현재 카드 번호를 기억함
                    console.log(`%c[ACR122U] NFC 카드 태그 감지! UID: ${uid}`, "color: #005baa; font-weight: bold; font-size: 14px;")
                    
                    // 결제 대기 상태일 때만 결제 프로세스 진행
                    const isWaitingPayment = viewMode.value === 'manual-pay' || viewMode.value === 'payment-fail'
                    if (isWaitingPayment && !isProcessing.value) {
                        paymentMethodType.value = 'MANUAL'
                        await processPayment(uid, true)
                    }
                }
                else {
                lastUid.value = '' // UID를 초기화하여 재태그가 가능하게 만듦
            }
            
            await new Promise(r => setTimeout(r, 1000))
            }
        } catch (error) {
            lastUid.value = '' 
            await new Promise(r => setTimeout(r, 1000))
        }
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
    // 2. 현장결제인데 카드가 꽂혀있으면 5초 뒤에 팝업 띄우기
    if (paymentMethodType.value === 'MANUAL' && isCardInserted.value) {
      removalReminderTimer = setTimeout(() => {
        if (isCardInserted.value) { // 5초 뒤에도 여전히 꽂혀있다면 팝업 노출
          showCardRemovalPopup.value = true
        }
      }, 5000)
    }

  } catch (err) {
    console.error("결제 승인 실패:", err)
    const elapsed = Date.now() - startTime;
    if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));

    errorMessage.value = err.response?.data?.detail || t.value.failMsg
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
    //startTimer(5, 'idle')
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
  startNfcContinuousScanner() // ACR122U 연결
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
/* ── 1. 전체 래퍼 및 배경 (해상도 방어 완벽 적용) ── */
.kiosk-main-wrapper {
  font-family: 'Pretendard', -apple-system, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  /* 화면이 작아도 배경이 짤리지 않게 min-height로 변경 */
  background: linear-gradient(135deg, var(--bg-light) 0%, #e0eafc 100%);
  overflow-y: auto;
  position: relative;
  /* 전체화면 깜빡임 팝업이 화면을 꽉 채우기 위한 기준점 */
}

/* 결제 지연 독촉 화면 깜빡임 오버레이 */
.screen-flash-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 0, 21, 0.053);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: flashBg 0.6s infinite alternate;
}

@keyframes flashBg {
  0% {
    background-color: rgba(255, 0, 21, 0.062);
  }

  100% {
    background-color: rgba(255, 0, 21, 0.105);
  }
}

.massive-reminder-popup {
  background: #ff0015;
  color: #fff;
  padding: 50px 70px;
  border-radius: 32px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(255, 0, 21, 0.5);
}

.massive-reminder-popup h2 {
  font-size: 40px;
  font-weight: 800;
  margin: 0;
  line-height: 1.4;
}

.icon-big {
  font-size: 80px;
  margin-bottom: 20px;
}

/* ── 2. 레이아웃 및 컨테이너 ── */
.screen-container {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px 40px;
}

.screen-container screen-result {
  
}

.center-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── 3. 타이포그래피 (원본 복구) ── */
.page-title,
.highlight-title {
  font-size: 52px;
  font-weight: 800;
  color: #222;
  margin-bottom: 32px;
  margin-top: 25px;
  letter-spacing: -1.5px;
}


.step-title {
  font-size: 52px;
  font-weight: 800;
  color: #222;
  margin-bottom: 20px;
  margin-top: 10px;
  letter-spacing: -1.5px;
}

.error-title {
  font-size: 52px;
  font-weight: 800;
  color: #ff0015;
  margin-bottom: 20px;
}

.guide-text {
  font-size: 28px;
  color: #444;
  margin-bottom: 40px;
  letter-spacing: -1px;
  text-align: center;
  font-weight: 500;
}

.welcome-msg {
  font-size: 24px;
  font-weight: 700;
  color: #005baa;
  margin-top: 30px;
  text-align: center;
  background: #f2f4f6;
  padding: 16px;
  border-radius: 16px;
}

/* ── 4. 로고 및 터치 애니메이션 ── */
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

.bounce-animation {
  animation: bounce 1s infinite alternate;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-10px);
  }
}

/* ── 5. 버튼 ── */
.professional-btn {
  background: #005baa;
  color: #ffffff;
  padding: 24px 40px;
  font-size: 24px;
  font-weight: 700;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(0, 91, 170, 0.25);
  border: none;
  transition: all 0.2s ease;
}

.professional-btn:active {
  transform: scale(0.96);
  box-shadow: 0 6px 12px rgba(0, 91, 170, 0.15);
}

.btn-secondary {
  background: #e0eafc !important;
  color: #444D56 !important;
  box-shadow: none !important;
}

.btn-danger {
  background: #ff0015 !important;
  box-shadow: 0 12px 24px rgba(255, 0, 21, 0.25) !important;
}

.svg-icon {
  width: 28px;
  height: 28px;
  margin-right: 15px;
}

.btn-group,
.action-btn-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

/* ── 6. 결과 카드 디자인 (가로 2단 레이아웃 반영) ── */
.result-card-container {
  display: flex;
  gap: 30px;
  width: 100%;
  margin-bottom: 20px;
  align-items: stretch;
  justify-content: center;
}

/* 2단 분리 레이아웃 폭 제어 */
.single-center {
  max-width: 750px;
  margin: 0 auto;
}

.info-card {
  flex: 1;
  min-width: 0;
  /* 우측 카드 찌그러짐 방지 핵심 */
  background: #ffffff;
  padding: 20px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
}

.center-align {
  text-align: center;
}

.kiosk-strict-layout {
  padding: 50px;
}

.card-title {
  font-size: 26px;
  font-weight: 800;
  color: #222;
  margin-bottom: 20px;
  border-bottom: 2px solid #f2f4f6;
  padding-bottom: 24px;
  text-align: left;
}

/* ── 7. 데이터 테이블 ── */
.res-table {
  width: 100%;
  border-collapse: collapse;
}

.res-table th {
  text-align: left;
  font-size: 18px;
  color: #222;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;
  font-weight: 500;
  width: 35%;
}

.res-table td {
  text-align: right;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;
}

/* 현장 결제 전용 묵직한 좌측 정렬 테이블 */
.pay-summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.pay-summary-table th {
  text-align: left;
  font-size: 24px;
  color: #8b95a1;
  padding: 10px 0;
  font-weight: 500;
  width: 40%;
}

.pay-summary-table td {
  text-align: left;
  font-size: 24px;
  color: #333;
  padding: 10px 0;
  font-weight: 700;
}

.bold-val {
  color: #005baa !important;
  font-size: 28px !important;
  font-weight: 800 !important;
}

/* ── 8. 강조 태그 및 뱃지 ── */
.plate-num {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.plate-num-cell {
  font-size: 28px;
  color: #005baa;
  font-weight: bold;
}

.plate-num.warn {
  color: #ff0015;
}

.plate-num-large {
  font-size: 56px;
  font-weight: 800;
  color: #005baa;
  text-align: center;
  margin: 30px 0;
  letter-spacing: 1px;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}

.member-badge {
  background: #e8f3ff;
  color: #005baa;
}

.country-badge {
  background: #f2f4f6;
  color: #4e5968;
}

.normal-badge {
  background: #f2f4f6;
  color: #444D56;
}

/* ── 9. 이미지 그리드 영역  ── */
.image-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  margin-top: 10px;
}

.image-wrapper {
  width: 100%;
  height: 210px;
  background: #f9fafb;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e5e8eb;
}

.plate-wrapper {
  height: 200px;
  background: #e8f3ff;
  border: none;
}

.captured-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

/* ── 10. 경고, 에러 UI 및 현장결제 레이아웃 ── */
.warning-title {
  color: #ff0015;
  border-bottom-color: #fee2e5;
}

.status-warn {
  color: #ff0015 !important;
}

.status-success {
  color: #005baa !important;
}

.error-visual-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.svg-error {
  width: 92px;
  height: 92px;
  color: #ff0015;
  margin-bottom: 20px;
  margin-top: -34px;
}

.error-visual-box h2 {
  font-size: 32px;
}

/* 텍스트 겹침 박멸 완료 */
.payment-branch {
  margin-top: -5px;
  text-align: center;
  background: #f2f4f6;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.highlight-msg,
.sub-guide {
  margin: 0 !important;
  padding: 4px;
  line-height: 1.4;
}

.highlight-msg {
  font-size: 22px;
  font-weight: 800;
  color: #222;
  text-align: center;
}

.sub-guide {
  text-align: center;
  font-size: 20px;
  color: #444;
  font-weight: 500;
}

.total-fee-box {
  background: #e8f3ff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-top: 10px;
}

.total-fee-box p {
  font-size: 18px;
  color: #444D56;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.fee-amount {
  font-size: 40px;
  font-weight: 800;
  color: #005baa;
  margin: 0;
}

.fee-amount span {
  font-size: 24px;
  font-weight: 600;
  margin-left: 6px;
}

/* 현장결제 전용 거대 박스들 */
.massive-pay-box {
  background: #e8f3ff;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin: 10px 0 40px 0;
}

.pay-label {
  font-size: 24px;
  color: #005baa;
  font-weight: 700;
  margin: 0 0 15px 0;
}

.massive-amount {
  font-size: 64px;
  font-weight: 800;
  color: #005baa;
  margin: 0;
  letter-spacing: -1px;
}

.massive-amount .currency {
  font-size: 32px;
  font-weight: 600;
  margin-left: 8px;
}

.insert-card-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.massive-card-icon {
  width: 100px;
  height: 100px;
  color: #005baa;
  margin-bottom: 20px;
  margin-top: -50px;
}

.insert-text {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #222;
  margin: 0;
}

.success-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.farewell-message {
  text-align: center;
  padding: 0;
}

.farewell-message .highlight {
  font-size: 32px;
  font-weight: 800;
  color: #005baa;
  margin-bottom: 10px;
}

.farewell-message .guide-text {
  margin-bottom: 10px;
}

/* ── 결제 완료 화면 배율 방어 CSS ── */
.success-card-fix {
  padding: 25px 40px !important;
  /* 패딩을 살짝 줄여서 세로 길이 확보 */
  margin-bottom: 10px;
}

.success-timer-fix {
  padding: 5px 0 10px 0 !important;
  /* 하단 여백 축소 */
}

.qr-and-farewell-box {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.farewell-message.full-width {
  flex: 1;
  padding: 10px 0;
}

.success-header .page-title {
  margin-bottom: 15px !important;
  /* 타이틀 위아래 간격 축소 */
}

/* ── [추가] 성공 체크 아이콘 스타일 ── */
.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  color: #fff;
}

.icon-circle.success {
  background-color: #4caf50;
  /* 영롱한 성공 초록색 */
  box-shadow: 0 15px 30px rgba(76, 175, 80, 0.3);
}

.success-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

/* 팝업 오버레이 (카드 뽑기 유도용) */
.card-removal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.577);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.popup-content {
  background: #fff;
  padding: 50px 60px;
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

/* ── 11. 하단 타이머 프로그레스 ── */
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

/* ── 12. 로딩 스피너 (원본 복구) ── */
.loading-msg {
  text-align: center;
  font-size: 28px;
  font-weight: 800;
  color: #333;
  margin-top: 20px;
}

.loading-sub {
  text-align: center;
  font-size: 20px;
  color: #444;
  margin-top: 10px;
  font-weight: 500;
}

.modern-spinner {
  width: 70px;
  height: 70px;
  border: 6px solid #e5e8eb;
  border-top: 6px solid #005baa;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
  margin: 38px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.divider {
  margin: 28px 0;
}

/* ==========================================
   [결과 화면 전용] 위아래 잘림 방지 CSS
   ========================================== */

/* 1. 맨 위 타이틀 여백 축소 */
.screen-result .page-title.highlight-title {
  margin-top: 10px !important;
  margin-bottom: 25px !important;
  font-size: 52px !important; 
}

/* 2. 하얀색 카드 자체의 상하 여백 축소 */
.screen-result .info-card {
  padding: 15px 30px !important; 
}

/* 3. 자리를 제일 많이 차지하는 사진 박스 크기 강제 축소 */
.screen-result .image-wrapper {
  height: 200px !important; 
}
.screen-result .plate-wrapper {
  height: 200px !important;
}

/* 4. 사진들 사이 간격 축소 */
.screen-result .image-grid {
  gap: 10px !important; 
  margin-bottom: 15px !important;
  margin-top: 5px !important;
}

/* 5. 결제 상세 내역(테이블) 줄 간격 대폭 축소 */
.screen-result .res-table th,
.screen-result .res-table td {
  padding: 16px 0 !important;
  font-size: 17px !important; 
}

/* 6. 맨 밑에 '최종 결제 금액' 박스 크기 축소 */
.screen-result .total-fee-box {
  padding: 12px !important;
  margin-top: 5px !important;
}
.screen-result .fee-amount {
  font-size: 34px !important;
}
</style>